// Offline tests. Official factory runtime, local AA/EntryPoint/processor fixtures.
// No wallet login, public RPC, real signatures or real UserOperations.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile,mkdtemp,symlink,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {prepareCreateX,validateCreateX,FACTORY,FACTORY_CODE_HASH,libraries} from './createx.mjs';
import {createRpc,preflightCreateX,verifyCreateXDeployment,quantity} from './createx-rpc.mjs';
import {externalOutput,saveNew,readBundle} from './createx-cli.mjs';
import {inspectHost,prepareHostAction,verifyHostRun,validateRunManifest,
  verifyHostTransaction} from './host-actions.mjs';
import {main as hostCli} from './host-cli.mjs';

const tools=process.env.TAPEWEAVE_SOLIDITY_TOOLS;
const ethers=libraries(tools),require=createRequire(`${tools}/package.json`);
const solc=require('solc'),ganache=require('ganache');
if(!process.env.TAPEWEAVE_CREATEX_REFERENCE)throw Error('Set TAPEWEAVE_CREATEX_REFERENCE to the downloaded pinned reference');
const reference=JSON.parse(await readFile(process.env.TAPEWEAVE_CREATEX_REFERENCE,'utf8'));
assert.equal(ethers.keccak256(reference.runtime),FACTORY_CODE_HASH);
const evidence=JSON.parse(await readFile(new URL('../research/tapeweave/manufactured-transitions-2026-10-18.json',import.meta.url),'utf8'));
const netlists=['pulse','alternating'].map(name=>evidence.results.find(r=>r.name===name).artifact.netlist_hex);
const source=`// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
contract ProcessorFixture {
 function netlist(uint256 id) external pure returns(bytes memory){
  require(id==1||id==2);if(id==1)return hex"${netlists[0]}";return hex"${netlists[1]}";}
 function step(uint256 id,bytes calldata s,bytes calldata i) external pure returns(bytes memory,bytes memory){
  uint8 o=uint8(s[0]);uint8 t=uint8(i[0])&1;uint8 r=(uint8(i[0])>>1)&1;
  return(abi.encodePacked(id==1?r|(o&(1-t)):o^t),abi.encodePacked(id==1?o&t:(1-o)&t));}
}
contract AccountFixture {
 address public immutable entryPoint;
 constructor(address ep){entryPoint=ep;}
 function execute(address to,bytes calldata data) external {
  require(msg.sender==entryPoint);
  (bool ok,bytes memory result)=to.call(data);
  if(!ok)assembly{revert(add(result,32),mload(result))}
 }
}
contract EntryPointFixture {
 event BeforeExecution();
 event UserOperationEvent(bytes32 indexed userOpHash,address indexed sender,address indexed paymaster,
  uint256 nonce,bool success,uint256 actualGasCost,uint256 actualGasUsed);
 uint public nonce;
 function execute(bytes32 hash,address account,address to,bytes calldata data) external{
  emit BeforeExecution();
  AccountFixture(account).execute(to,data);
  emit UserOperationEvent(hash,account,address(0),nonce++,true,0,0);
 }
}`;
const compiled=JSON.parse(solc.compile(JSON.stringify({
  language:'Solidity',sources:{'Fixture.sol':{content:source}},
  settings:{evmVersion:'shanghai',outputSelection:{'*':{'*':['abi','evm.bytecode.object','evm.deployedBytecode.object']}}},
})));
assert.equal((compiled.errors??[]).filter(e=>e.severity==='error').length,0,
  (compiled.errors??[]).map(e=>e.formattedMessage).join('\n'));
const chain=ganache.provider({logging:{quiet:true},chain:{chainId:196,hardfork:'shanghai'},
  wallet:{deterministic:true}});
const directory=await mkdtemp(join(tmpdir(),'tapeweave-createx-tests-'));
let tests=0;
async function check(name,fn){await fn();tests++;console.log('PASS '+name);}
try{
  const provider=new ethers.BrowserProvider(chain);provider.pollingInterval=10;
  const signer=await provider.getSigner();
  const deploy=async name=>{
    const c=compiled.contracts['Fixture.sol'][name];
    const contract=await new ethers.ContractFactory(c.abi,c.evm.bytecode.object,signer)
      .deploy(...(name==='AccountFixture'?[await entry.getAddress()]:[]));
    await contract.waitForDeployment();return contract;
  };
  const entry=await deploy('EntryPointFixture'),account=await deploy('AccountFixture');
  const accountAddress=await account.getAddress(),entryPoint=await entry.getAddress();
  await chain.request({method:'evm_setAccountCode',params:[FACTORY,reference.runtime]});
  await chain.request({method:'evm_setAccountCode',params:[
    evidence.processor,'0x'+compiled.contracts['Fixture.sol'].ProcessorFixture.evm.deployedBytecode.object,
  ]});
  const rpc={label:'local-fixture-a',request:(method,params=[])=>chain.request({method,params})};
  const peer={...rpc,label:'local-fixture-b'};
  const faulty=(change)=>({label:'local-fault-fixture',request:async(method,params=[])=>{
    return change(method,params,structuredClone(await rpc.request(method,params)));
  }});
  async function runHostCli(args){
    const previous={fetch:globalThis.fetch,log:console.log,
      primary:process.env.TAPEWEAVE_RPC_URL,secondary:process.env.TAPEWEAVE_SECONDARY_RPC_URL};
    const reads=new Set(['eth_chainId','eth_blockNumber','eth_getBlockByNumber','eth_getCode',
      'eth_call','eth_getTransactionReceipt','eth_getTransactionByHash']);
    try{
      process.env.TAPEWEAVE_RPC_URL='https://local-fixture.invalid';
      delete process.env.TAPEWEAVE_SECONDARY_RPC_URL;
      globalThis.fetch=async(_url,request)=>{
        const query=JSON.parse(request.body);
        assert.ok(reads.has(query.method),'CLI must only issue read-only RPC requests');
        return new Response(JSON.stringify({jsonrpc:'2.0',id:query.id,
          result:await rpc.request(query.method,query.params)}));
      };
      console.log=()=>{};
      await hostCli(args);
    }finally{
      globalThis.fetch=previous.fetch;console.log=previous.log;
      for(const [key,value]of [['TAPEWEAVE_RPC_URL',previous.primary],
        ['TAPEWEAVE_SECONDARY_RPC_URL',previous.secondary]]){
        if(value===undefined)delete process.env[key];else process.env[key]=value;
      }
    }
  }
  let bundle;
  await check('explicit account, deterministic bundle and guarded salt',async()=>{
    bundle=await prepareCreateX(tools,{account:accountAddress,deploymentNumber:'1'});
    assert.deepEqual(bundle,await prepareCreateX(tools,{account:accountAddress,deploymentNumber:'1'}));
    assert.equal(bundle.broadcast,false);assert.equal(bundle.ready_to_send,false);
    assert.equal(bundle.wallet_simulated,false);assert.equal(bundle.rpc_simulated,false);
    assert.equal(ethers.dataLength(bundle.salt),32);
    assert.equal(ethers.dataSlice(bundle.salt,0,20).toLowerCase(),accountAddress.toLowerCase());
    assert.equal(ethers.dataSlice(bundle.salt,20,21),'0x00');
    assert.notEqual(ethers.getCreate2Address(FACTORY,bundle.salt,bundle.initcode_hash),bundle.predicted_address);
    assert.equal(bundle.execution.value,'0');
    assert.ok(!bundle.wallet_arguments.includes('--force'));
    await validateCreateX(bundle,tools);
    await saveNew(join(directory,'cli-bundle.json'),bundle);
  });
  await check('invalid account/nonce, changed code and forged ready flag rejected',async()=>{
    for(const options of [{deploymentNumber:'1'},{account:ethers.ZeroAddress,deploymentNumber:'1'},
      {account:accountAddress,deploymentNumber:'0'},{account:accountAddress,deploymentNumber:'01'},
      {account:accountAddress,deploymentNumber:(1n<<88n).toString()}]){
      await assert.rejects(()=>prepareCreateX(tools,options));
    }
    for(const mutate of [
      b=>{b.execution.calldata+='00';},b=>{b.ready_to_send=true;},
      b=>{b.preparation.expected_runtime='0x01';},b=>{b.account_address=ethers.ZeroAddress;},
    ]){
      const copy=structuredClone(bundle);mutate(copy);
      await assert.rejects(()=>validateCreateX(copy,tools));
    }
  });
  await check('real CreateX bytecode eth_call, prediction and no persistent deployment',async()=>{
    const result=await preflightCreateX(bundle,[rpc,peer],tools);
    assert.equal(result.status,'RPC_SIMULATION_PASSED');
    assert.equal(result.provider_agreement,true);
    assert.equal(result.wallet_simulated,false);assert.equal(result.ready_to_send,false);
    assert.equal(await rpc.request('eth_getCode',[bundle.predicted_address,'latest']),'0x');
    const single=await preflightCreateX(bundle,[rpc],tools);
    assert.equal(single.provider_agreement,false);
  });
  await check('wrong chain, untrusted factory, circuit drift and absent AA rejected',async()=>{
    const faults=[
      (m,p,r)=>m==='eth_chainId'?'0x1':r,
      (m,p,r)=>m==='eth_getCode'&&p[0]===FACTORY?'0x01':r,
      (m,p,r)=>m==='eth_getCode'&&p[0]===accountAddress?'0x':r,
      (m,p,r)=>m==='eth_call'&&p[0].to===bundle.preparation.processor
        ?ethers.AbiCoder.defaultAbiCoder().encode(['bytes'],['0xff']):r,
    ];
    for(const change of faults)await assert.rejects(()=>preflightCreateX(bundle,[faulty(change)],tools));
  });
  await check('RPC disagreement, duplicate origin and reorg during reads rejected',async()=>{
    await assert.rejects(()=>preflightCreateX(bundle,[rpc,rpc],tools),/origins/);
    await assert.rejects(()=>preflightCreateX(bundle,[rpc,faulty((m,p,r)=>
      m==='eth_getBlockByNumber'?{...r,hash:'0x'+'11'.repeat(32)}:r)],tools),/disagreement/);
    for(const address of [accountAddress,bundle.preparation.processor]){
      await assert.rejects(()=>preflightCreateX(bundle,[rpc,faulty((m,p,r)=>
        m==='eth_getCode'&&p[0]===address?'0x01':r)],tools),/disagreement/);
    }
    let blocks=0;
    await assert.rejects(()=>preflightCreateX(bundle,[faulty((m,p,r)=>{
      if(m==='eth_getBlockByNumber'&&++blocks>1)return {...r,hash:'0x'+'11'.repeat(32)};
      return r;
    })],tools),/Canonical block changed/);
  });
  const uopHash=ethers.keccak256(ethers.toUtf8Bytes('local unsigned fixture, not a real UserOperation'));
  const receipt=await(await entry.execute(uopHash,accountAddress,FACTORY,bundle.execution.calldata,
    {gasLimit:7000000})).wait();
  const transactionHash=receipt.hash;
  await check('owner-account wrapper deploys exact prepared host via actual factory',async()=>{
    const code=await provider.getCode(bundle.predicted_address);
    assert.equal(code.toLowerCase(),bundle.preparation.expected_runtime.toLowerCase());
    const host=new ethers.Contract(bundle.predicted_address,bundle.preparation.abi,provider);
    assert.equal(await host.processor(),bundle.preparation.processor);
    assert.equal(await host.pulseHash(),bundle.preparation.pulse_hash);
    assert.equal(await host.alternatingHash(),bundle.preparation.alternating_hash);
    await assert.rejects(()=>preflightCreateX(bundle,[rpc],tools),/already occupied/);
  });
  await check('successful receipt validates exact code, events and getters',async()=>{
    await chain.request({method:'evm_mine',params:[]});
    const proof=await verifyCreateXDeployment(bundle,[rpc,peer],tools,{transactionHash});
    assert.equal(proof.status,'DEPLOYMENT_CODE_AND_FACTORY_EVENT_VERIFIED');
    assert.equal(proof.user_operation.verified,false);
    assert.equal(proof.mainnet_host_actions_verified,false);
    assert.equal(proof.broadcast_by_verifier,false);
    const decorated=faulty((m,p,r)=>m==='eth_getTransactionReceipt'
      ?{...r,providerSpecific:'ignored',logs:r.logs.map(l=>({...l,providerSpecific:true}))}:r);
    assert.equal((await verifyCreateXDeployment(bundle,[rpc,decorated],tools,
      {transactionHash})).provider_agreement,true);
  });
  await check('explicit EntryPoint/UOP proof binds successful sender and event segment',async()=>{
    const proof=await verifyCreateXDeployment(bundle,[rpc],tools,
      {transactionHash,userOperationHash:uopHash,entryPoint});
    assert.equal(proof.user_operation.verified,true);
    assert.equal(proof.user_operation.signature_revalidated,false);
    await assert.rejects(()=>verifyCreateXDeployment(bundle,[rpc],tools,
      {transactionHash,userOperationHash:uopHash}),/both/);
    await assert.rejects(()=>verifyCreateXDeployment(bundle,[rpc],tools,
      {transactionHash,userOperationHash:ethers.ZeroHash,entryPoint}),/Missing/);
    await assert.rejects(()=>verifyCreateXDeployment(bundle,[rpc],tools,
      {transactionHash,userOperationHash:uopHash,entryPoint:accountAddress}),/Missing/);
  });
  await check('failed/missing receipts, missing creation and code mismatch rejected',async()=>{
    const faults=[
      (m,p,r)=>m==='eth_getTransactionReceipt'?null:r,
      (m,p,r)=>m==='eth_getTransactionReceipt'?{...r,status:'0x0'}:r,
      (m,p,r)=>m==='eth_getTransactionReceipt'?{...r,logs:r.logs.filter(l=>l.address.toLowerCase()!==FACTORY.toLowerCase())}:r,
      (m,p,r)=>m==='eth_getCode'&&p[0]===bundle.predicted_address?'0x01':r,
      (m,p,r)=>m==='eth_getTransactionByHash'?{...r,chainId:'0x1'}:r,
    ];
    for(const change of faults)await assert.rejects(()=>verifyCreateXDeployment(
      bundle,[faulty(change)],tools,{transactionHash}));
  });
  await check('event receipt binding, confirmations and canonical block checked',async()=>{
    await assert.rejects(()=>verifyCreateXDeployment(bundle,[rpc],tools,
      {transactionHash,minConfirmations:100}),/confirmations/);
    await assert.rejects(()=>verifyCreateXDeployment(bundle,[rpc],tools,
      {transactionHash,minConfirmations:0}),/Confirmations/);
    await assert.rejects(()=>verifyCreateXDeployment(bundle,[faulty((m,p,r)=>
      m==='eth_getBlockByNumber'?{...r,hash:ethers.ZeroHash}:r)],tools,{transactionHash}),/reorganized/);
    await assert.rejects(()=>verifyCreateXDeployment(bundle,[faulty((m,p,r)=>{
      if(m==='eth_getTransactionReceipt')r.logs[0].transactionHash=ethers.ZeroHash;
      return r;
    })],tools,{transactionHash}),/binding/);
    await assert.rejects(()=>verifyCreateXDeployment(bundle,[rpc,faulty((m,p,r)=>
      m==='eth_getTransactionReceipt'?{...r,logs:[]}:r)],tools,{transactionHash}),/disagreement/);
    await assert.rejects(()=>verifyCreateXDeployment(bundle,[rpc,faulty((m,p,r)=>
      m==='eth_getCode'&&p[0]===bundle.preparation.processor?'0x01':r)],tools,
      {transactionHash}),/disagreement/);
  });
  await check('failed UOP and creation in another UOP segment rejected',async()=>{
    const eventInterface=new ethers.Interface([
      'event UserOperationEvent(bytes32 indexed userOpHash,address indexed sender,address indexed paymaster,uint256 nonce,bool success,uint256 actualGasCost,uint256 actualGasUsed)',
    ]);
    const change=callback=>faulty((m,p,r)=>{
      if(m==='eth_getTransactionReceipt'){
        const log=r.logs.find(l=>l.topics[0]===eventInterface.getEvent('UserOperationEvent').topicHash);
        callback(log,eventInterface,r);
      }return r;
    });
    await assert.rejects(()=>verifyCreateXDeployment(bundle,[change(log=>{
      log.data=ethers.AbiCoder.defaultAbiCoder().encode(['uint256','bool','uint256','uint256'],[0,false,0,0]);
    })],tools,{transactionHash,userOperationHash:uopHash,entryPoint}),/failed/);
    await assert.rejects(()=>verifyCreateXDeployment(bundle,[change(log=>{
      log.topics[2]=ethers.zeroPadValue(entryPoint,32);
    })],tools,{transactionHash,userOperationHash:uopHash,entryPoint}),/another account/);
    await assert.rejects(()=>verifyCreateXDeployment(bundle,[change((log,iface,receipt)=>{
      // A preceding UOP ends after the creation: the selected UOP cannot claim it.
      const preceding=structuredClone(log);
      preceding.topics[1]=ethers.keccak256(ethers.toUtf8Bytes('another UOP'));
      preceding.logIndex=log.logIndex;
      log.logIndex=ethers.toQuantity(BigInt(log.logIndex)+1n);
      receipt.logs.splice(receipt.logs.length-1,0,preceding);
    })],tools,{transactionHash,userOperationHash:uopHash,entryPoint}),/outside/);
    await assert.rejects(()=>verifyCreateXDeployment(bundle,[change((log,iface,receipt)=>{
      // Move the selected terminal event before creation, outside its segment.
      for(const item of receipt.logs)item.logIndex=ethers.toQuantity(BigInt(item.logIndex)+1n);
      log.logIndex='0x0';
    })],tools,{transactionHash,userOperationHash:uopHash,entryPoint}),/outside/);
  });
  const manifest={format:'tapeweave-host-run-v1',deployment:{
    transaction_hash:transactionHash,user_operation_hash:uopHash,entry_point:entryPoint,
  },sessions:[]};
  await check('deployed host snapshot and unsigned opening simulate without persistence',async()=>{
    const snapshot=await inspectHost(bundle,[rpc,peer],tools);
    assert.equal(snapshot.session_count,'0');assert.equal(snapshot.session,null);
    assert.equal(snapshot.provider_agreement,true);
    const opening=await prepareHostAction(bundle,[rpc],tools,{operation:'open',circuit:1});
    assert.equal(opening.ready_to_send,false);assert.equal(opening.wallet_simulated,false);
    assert.equal(opening.rpc_simulated,true);assert.equal(opening.broadcast,false);
    assert.equal(opening.execution.to,bundle.predicted_address);
    assert.ok(!opening.wallet_arguments.includes('--force'));
    assert.equal((await inspectHost(bundle,[rpc],tools)).session_count,'0');
  });
  await check('missing host, changed configuration and divergent snapshots rejected',async()=>{
    const iface=new ethers.Interface(bundle.preparation.abi);
    const wrongCount=faulty((m,p,r)=>m==='eth_call'&&
      p[0].data===iface.encodeFunctionData('sessionCount')
      ?iface.encodeFunctionResult('sessionCount',[9]):r);
    await assert.rejects(()=>inspectHost(bundle,[rpc,wrongCount],tools),/disagreement/);
    const faults=[
      (m,p,r)=>m==='eth_getCode'&&p[0]===bundle.predicted_address?'0x':r,
      (m,p,r)=>m==='eth_getCode'&&p[0]===bundle.account_address?'0x':r,
      (m,p,r)=>m==='eth_call'&&p[0].data===iface.encodeFunctionData('pulseHash')
        ?iface.encodeFunctionResult('pulseHash',[ethers.ZeroHash]):r,
    ];
    for(const change of faults)await assert.rejects(()=>inspectHost(bundle,[faulty(change)],tools));
    await assert.rejects(()=>inspectHost(bundle,[rpc],tools,{sessionId:'1'}));
  });
  await check('both four-round worlds keep AA caller identity through execution wrapper',async()=>{
    const hostInterface=new ethers.Interface(bundle.preparation.abi);
    const host=new ethers.Contract(bundle.predicted_address,bundle.preparation.abi,provider);
    let sequence=1;
    const execute=async data=>{
      const hash=ethers.toBeHex(BigInt(sequence++),32);
      const receipt=await(await entry.execute(
        hash,accountAddress,bundle.predicted_address,data,{gasLimit:7000000})).wait();
      return {transaction_hash:receipt.hash,user_operation_hash:hash,entry_point:entryPoint};
    };
    for(const [circuit,score,door,keys]of [[1,2,1,1],[2,1,0,2]]){
      const open=await execute(hostInterface.encodeFunctionData('open',[circuit]));
      const id=await host.sessionCount();
      const run={circuit,session_id:id.toString(),open,actions:[]};
      for(const [version,trigger]of [false,false,true,true].entries()){
        if(circuit===1&&version===0){
          const plan=await prepareHostAction(bundle,[rpc,peer],tools,{
            operation:'act',circuit,sessionId:id.toString(),expectedVersion:version,trigger,
          });
          assert.equal(plan.snapshot.session.version,0);
          assert.equal(plan.execution.calldata,hostInterface.encodeFunctionData('act',[id,version,trigger]));
          assert.equal((await host.sessions(id)).version,0n);
          const cliOutput=join(directory,'cli-first-action.json');
          await runHostCli(['act',join(directory,'cli-bundle.json'),cliOutput,
            '1',id.toString(),'0','0']);
          assert.equal((await readBundle(cliOutput)).execution.calldata,plan.execution.calldata);
          assert.equal((await host.sessions(id)).version,0n);
          for(const wrong of [{expectedVersion:1},{circuit:2},{trigger:'false'},
            {expectedVersion:undefined},{sessionId:'01'}]){
            await assert.rejects(()=>prepareHostAction(bundle,[rpc],tools,{
              operation:'act',circuit,sessionId:id.toString(),expectedVersion:version,trigger,...wrong,
            }));
          }
          const wrongPlayer=faulty((m,p,r)=>{
            if(m==='eth_call'&&p[0].data===hostInterface.encodeFunctionData('sessions',[id])){
              return '0x'+ethers.zeroPadValue(entryPoint,32).slice(2)+r.slice(66);
            }return r;
          });
          await assert.rejects(()=>inspectHost(bundle,[wrongPlayer],tools,{sessionId:id.toString()}),
            /another account/);
        }
        run.actions.push({...await execute(hostInterface.encodeFunctionData('act',[id,version,trigger])),trigger});
      }
      const s=await host.sessions(id);
      assert.equal(s.player,accountAddress);assert.equal(s.version,4n);
      assert.equal(s.training.score,BigInt(score));assert.equal(s.door.score,BigInt(door));
      assert.equal(s.door.resource,BigInt(keys));
      manifest.sessions.push(run);
    }
    await chain.request({method:'evm_mine',params:[]});
  });
  await check('completed or stale versions cannot silently become new actions',async()=>{
    for(const expectedVersion of [0,3,4]){
      await assert.rejects(()=>prepareHostAction(bundle,[rpc],tools,{
        operation:'act',circuit:1,sessionId:manifest.sessions[0].session_id,
        expectedVersion,trigger:true,
      }));
    }
    await assert.rejects(()=>prepareHostAction(bundle,[rpc],tools,{
      operation:'open',circuit:1,sessionId:'1',
    }),/does not accept/);
  });
  await check('individual host receipts recover session IDs and distinguish partial proof',async()=>{
    const run=manifest.sessions[0];
    for(const ref of [run.open,run.actions[0]]){
      const proof=await verifyHostTransaction(bundle,[rpc,peer],tools,{
        transactionHash:ref.transaction_hash,userOperationHash:ref.user_operation_hash,entryPoint,
      });
      assert.equal(proof.status,'HOST_EVENT_VERIFIED');assert.equal(proof.session_id,run.session_id);
      assert.equal(proof.full_run_verified,false);assert.equal(proof.user_operation.verified,true);
    }
    await assert.rejects(()=>verifyHostTransaction(bundle,[rpc],tools,
      {transactionHash}),/exactly one host event/);
    await assert.rejects(()=>verifyHostTransaction(bundle,[faulty((m,p,r)=>
      m==='eth_getTransactionReceipt'?null:r)],tools,
      {transactionHash:run.open.transaction_hash}),/Missing/);
    await assert.rejects(()=>verifyHostTransaction(bundle,[rpc],tools,{
      transactionHash:run.open.transaction_hash,userOperationHash:ethers.ZeroHash,entryPoint,
    }),/Missing/);
  });
  await check('full deployment and both ordered sessions verify against events and historical state',async()=>{
    const proof=await verifyHostRun(bundle,[rpc,peer],tools,manifest);
    assert.equal(proof.status,'BOTH_CARD_RUNS_VERIFIED');
    assert.equal(proof.transaction_count,11);assert.equal(proof.all_user_operations_verified,true);
    assert.equal(proof.broadcast_by_verifier,false);assert.equal(proof.signature_revalidated,false);
    assert.equal(proof.provider_agreement,true);
    assert.deepEqual(proof.sessions.map(s=>[
      s.final_state.training.score,s.final_state.door.score,s.final_state.door.resource,
    ]),[[2,1,1],[1,0,2]]);
    const withoutUops=structuredClone(manifest);
    for(const ref of [withoutUops.deployment,...withoutUops.sessions.flatMap(s=>[s.open,...s.actions])]){
      delete ref.user_operation_hash;delete ref.entry_point;
    }
    assert.equal((await verifyHostRun(bundle,[rpc],tools,withoutUops)).all_user_operations_verified,false);
  });
  await check('incomplete, duplicate or ambiguous run manifests rejected',async()=>{
    for(const change of [
      m=>m.sessions.pop(),m=>m.sessions[0].actions.pop(),
      m=>{m.sessions[1].circuit=1;},m=>{m.sessions[1].session_id=m.sessions[0].session_id;},
      m=>{m.sessions[0].actions[0].transaction_hash=m.deployment.transaction_hash;},
      m=>{m.sessions[0].actions[0].trigger=0;},
      m=>{delete m.deployment.entry_point;},m=>{m.sessions[0].session_id='01';},
    ]){
      const copy=structuredClone(manifest);change(copy);
      assert.throws(()=>validateRunManifest(copy));
    }
    const reordered=structuredClone(manifest);
    [reordered.sessions[0].actions[0],reordered.sessions[0].actions[1]]=
      [reordered.sessions[0].actions[1],reordered.sessions[0].actions[0]];
    await assert.rejects(()=>verifyHostRun(bundle,[rpc],tools,reordered),/replay|order/);
  });
  await check('tampered run trigger, event payload, owner and final state rejected',async()=>{
    const changed=structuredClone(manifest);changed.sessions[0].actions[0].trigger=true;
    await assert.rejects(()=>verifyHostRun(bundle,[rpc],tools,changed),/replay/);
    const iface=new ethers.Interface(bundle.preparation.abi);
    const eventMutation=change=>faulty((m,p,r)=>{
      if(m==='eth_getTransactionReceipt'&&p[0]===manifest.sessions[0].open.transaction_hash){
        const log=r.logs.find(l=>l.address.toLowerCase()===bundle.predicted_address.toLowerCase());
        change(log,iface);
      }return r;
    });
    await assert.rejects(()=>verifyHostRun(bundle,[eventMutation(log=>{
      log.data='0x01';
    })],tools,manifest));
    await assert.rejects(()=>verifyHostRun(bundle,[eventMutation((log,iface)=>{
      const event=iface.encodeEventLog('Opened',[1,entryPoint,1]);
      log.data=event.data;log.topics=event.topics;
    })],tools,manifest),/account or card/);
    const finalState=faulty((m,p,r)=>m==='eth_call'&&
      p[0].data===iface.encodeFunctionData('sessions',[manifest.sessions[0].session_id])
      ?r.slice(0,-64)+ethers.toBeHex(2,32).slice(2):r);
    await assert.rejects(()=>verifyHostRun(bundle,[finalState],tools,manifest));
  });
  await check('reorg during later run verification invalidates earlier evidence',async()=>{
    let earlierReads=0;
    const earlierBlock=(await rpc.request('eth_getTransactionReceipt',[
      manifest.sessions[0].open.transaction_hash,
    ])).blockNumber;
    const reorg=faulty((m,p,r)=>{
      if(m==='eth_getBlockByNumber'&&p[0]===earlierBlock&&++earlierReads>=3){
        return {...r,hash:ethers.ZeroHash};
      }return r;
    });
    await assert.rejects(()=>verifyHostRun(bundle,[reorg],tools,manifest),/Canonical block changed/);
  });
  await check('host CLI rejects malformed input and site output before any fetch',async()=>{
    await assert.rejects(()=>hostCli(['open','bundle',join(directory,'plan.json'),'1','extra']),/usage/);
    await assert.rejects(()=>hostCli(['inspect','bundle',
      new URL('./must-not-write.json',import.meta.url).pathname]),/static/);
  });
  await check('host CLI completes read-only inspect, open, receipt and full-run file workflows',async()=>{
    const bundlePath=join(directory,'cli-bundle.json'),manifestPath=join(directory,'manifest.json');
    await saveNew(manifestPath,manifest);
    const cases=[
      ['inspect',[], 'HOST_SNAPSHOT_VERIFIED'],
      ['open',['2'],'HOST_ACTION_RPC_SIMULATION_PASSED'],
      ['receipt',[manifest.sessions[0].open.transaction_hash],'HOST_EVENT_VERIFIED'],
      ['verify-run',[manifestPath],'BOTH_CARD_RUNS_VERIFIED'],
    ];
    for(const [mode,extra,status]of cases){
      const output=join(directory,mode+'-cli-output.json');
      await runHostCli([mode,bundlePath,output,...extra]);
      assert.equal((await readBundle(output)).status,status);
    }
    const absent=join(directory,'invalid-action-must-not-exist.json');
    await assert.rejects(()=>runHostCli(['act',bundlePath,absent,'1','1','0','false']),
      /Invalid card, version or trigger/);
    await assert.rejects(()=>readFile(absent),/ENOENT/);
    assert.equal((await inspectHost(bundle,[rpc],tools)).session_count,'2');
  });
  await check('read-only RPC transport blocks writes, credentials in labels and oversized replies',async()=>{
    const client=createRpc('https://example.invalid/private-token?key=do-not-print',{
      fetchImpl:async()=>new Response(JSON.stringify({jsonrpc:'2.0',id:1,result:'0xc4'})),
    });
    assert.equal(client.label,'https://example.invalid');
    assert.equal(await client.request('eth_chainId'),'0xc4');
    await assert.rejects(()=>client.request('eth_sendRawTransaction',['0x01']),/read-only/);
    assert.throws(()=>createRpc('http://example.invalid'),/HTTPS/);
    assert.throws(()=>createRpc('https://user:password@example.invalid'),/HTTPS/);
    const huge=createRpc('https://example.invalid',{fetchImpl:async()=>new Response('x'.repeat(1024*1024+1))});
    await assert.rejects(()=>huge.request('eth_chainId'),/1 MiB/);
    const bad=createRpc('https://example.invalid',{fetchImpl:async()=>new Response('{"jsonrpc":"2.0","id":2,"result":"0xc4"}')});
    await assert.rejects(()=>bad.request('eth_chainId'),/Invalid RPC/);
    for(const value of ['0x00','0x','196',196])assert.throws(()=>quantity(value));
  });
  await check('external output, no overwrite and symlink-to-site rejection',async()=>{
    assert.throws(()=>externalOutput(new URL('./would-be-public.json',import.meta.url).pathname),/outside|static/);
    const output=join(directory,'package.json');
    await saveNew(output,bundle);assert.deepEqual(await readBundle(output),bundle);
    await assert.rejects(()=>saveNew(output,bundle),/EEXIST/);
    const linked=join(directory,'site-link');
    await symlink(new URL('../',import.meta.url).pathname,linked);
    assert.throws(()=>externalOutput(join(linked,'would-be-public.json')),/static/);
  });
  console.log(`PASS: ${tests} CreateX suites; official factory bytecode, local account/EntryPoint/processor fixtures only. No real UOP or public-chain deployment.`);
}finally{
  await chain.disconnect();
  await rm(directory,{recursive:true,force:true});
}
