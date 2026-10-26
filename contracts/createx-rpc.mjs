// Read-only RPC and verification. No wallet credentials, signing or broadcast.
import {isDeepStrictEqual} from 'node:util';
import {libraries,nonzeroAddress,validateCreateX,FACTORY,FACTORY_ABI,FACTORY_CODE_HASH} from './createx.mjs';

const METHODS=new Set(['eth_chainId','eth_blockNumber','eth_getBlockByNumber',
  'eth_getCode','eth_call','eth_getTransactionReceipt','eth_getTransactionByHash']);
const HEX=/^0x(?:[0-9a-fA-F]{2})*$/;
const HASH=/^0x[0-9a-fA-F]{64}$/;
export function quantity(value){
  if(typeof value!=='string'||!/^0x(?:0|[1-9a-fA-F][0-9a-fA-F]*)$/.test(value)
    ||value.length>66)throw Error('Invalid RPC quantity');
  return BigInt(value);
}
export function createRpc(url,{fetchImpl=fetch,timeout=15000}={}){
  const target=new URL(url);
  const loopback=['localhost','127.0.0.1','[::1]'].includes(target.hostname);
  if(target.username||target.password||target.hash||
    !(target.protocol==='https:'||(target.protocol==='http:'&&loopback))){
    throw Error('Use HTTPS RPC, or HTTP loopback for local tests');
  }
  return {
    label:target.origin,
    async request(method,params=[]){
      if(!METHODS.has(method))throw Error('Only read-only RPC methods are allowed');
      const response=await fetchImpl(target.href,{
        method:'POST',redirect:'error',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({jsonrpc:'2.0',id:1,method,params}),
        signal:AbortSignal.timeout(timeout),
      });
      if(!response.ok)throw Error(`RPC HTTP ${response.status}`);
      const chunks=[];let size=0;
      const reader=response.body.getReader();
      try{
        while(true){
          const {value,done}=await reader.read();if(done)break;
          size+=value.length;if(size>1024*1024)throw Error('RPC response exceeds 1 MiB');
          chunks.push(value);
        }
      }finally{await reader.cancel();}
      const payload=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(Buffer.concat(chunks)));
      if(payload.jsonrpc!=='2.0'||payload.id!==1||payload.error||
        !Object.hasOwn(payload,'result'))throw Error(`Invalid RPC response for ${method}`);
      return payload.result;
    },
  };
}
export function peers(rpcs){
  if(!Array.isArray(rpcs)||rpcs.length<1||rpcs.length>2)throw Error('Use one or two RPC providers');
  if(rpcs.length===2&&rpcs[0].label===rpcs[1].label)throw Error('RPC origins must differ');
}
async function chain(rpc){
  if(quantity(await rpc.request('eth_chainId'))!==196n)throw Error('Expected X Layer chain 196');
}
export async function blockAt(rpc,tag){
  const block=await rpc.request('eth_getBlockByNumber',[tag,false]);
  if(!block||quantity(block.number)!==quantity(tag)||!HASH.test(block.hash))throw Error('Invalid canonical block');
  return block;
}
export function agree(values,name){
  if(values.some(v=>!isDeepStrictEqual(v,values[0])))throw Error(`RPC disagreement: ${name}`);
  return values[0];
}
export async function fixedHead(rpcs){
  peers(rpcs);
  const heads=await Promise.all(rpcs.map(async rpc=>{
    await chain(rpc);return quantity(await rpc.request('eth_blockNumber'));
  }));
  const tag='0x'+heads.reduce((a,b)=>a<b?a:b).toString(16);
  const blocks=await Promise.all(rpcs.map(rpc=>blockAt(rpc,tag)));
  agree(blocks.map(b=>b.hash.toLowerCase()),'block hash');
  return {tag,hash:blocks[0].hash};
}
export function codeHash(code,ethers){
  if(typeof code!=='string'||!HEX.test(code)||code==='0x')throw Error('Missing contract code');
  return ethers.keccak256(code);
}
export async function reviewedState(rpc,bundle,tag,ethers){
  const [factoryCode,processorCode]=await Promise.all([
    rpc.request('eth_getCode',[FACTORY,tag]),
    rpc.request('eth_getCode',[bundle.preparation.processor,tag]),
  ]);
  if(codeHash(factoryCode,ethers)!==FACTORY_CODE_HASH)throw Error('Unrecognized factory code');
  const processorHash=codeHash(processorCode,ethers);
  const abi=ethers.AbiCoder.defaultAbiCoder();
  for(const [id,hash]of [[1,bundle.preparation.pulse_hash],[2,bundle.preparation.alternating_hash]]){
    const data='0x3fc4be56'+abi.encode(['uint256'],[id]).slice(2);
    const result=await rpc.request('eth_call',[{to:bundle.preparation.processor,data},tag]);
    const [netlist]=abi.decode(['bytes'],result);
    if(ethers.keccak256(netlist)!==hash)throw Error('Current circuit differs from reviewed netlist');
  }
  return processorHash;
}
export async function preflightCreateX(bundle,rpcs,tools){
  await validateCreateX(bundle,tools);
  const ethers=libraries(tools);
  const fixed=await fixedHead(rpcs),iface=new ethers.Interface(FACTORY_ABI);
  const observations=await Promise.all(rpcs.map(async rpc=>{
    const processorCodeHash=await reviewedState(rpc,bundle,fixed.tag,ethers);
    const accountCodeHash=codeHash(
      await rpc.request('eth_getCode',[bundle.account_address,fixed.tag]),ethers);
    if(await rpc.request('eth_getCode',[bundle.predicted_address,fixed.tag])!=='0x'){
      throw Error('Predicted address is already occupied; verify an existing receipt, do not resend');
    }
    const result=await rpc.request('eth_call',[{
      from:bundle.account_address,to:FACTORY,value:'0x0',
      data:bundle.execution.calldata,gas:'0x989680',
    },fixed.tag]);
    const [deployed]=iface.decodeFunctionResult('deployCreate2',result);
    if(deployed!==bundle.predicted_address)throw Error('Factory returned an unexpected address');
    const query=iface.encodeFunctionData('computeCreate2Address',
      [bundle.guarded_salt,bundle.initcode_hash]);
    const [computed]=iface.decodeFunctionResult('computeCreate2Address',
      await rpc.request('eth_call',[{to:FACTORY,data:query},fixed.tag]));
    if(computed!==bundle.predicted_address)throw Error('Factory address calculation mismatch');
    // Reject an RPC that changes its canonical answer during a read.
    if((await blockAt(rpc,fixed.tag)).hash.toLowerCase()!==fixed.hash.toLowerCase()){
      throw Error('Canonical block changed during preflight');
    }
    return {endpoint:rpc.label,processor_code_hash:processorCodeHash,account_code_hash:accountCodeHash};
  }));
  agree(observations.map(o=>o.processor_code_hash),'processor code');
  agree(observations.map(o=>o.account_code_hash),'account code');
  return {
    format:'tapeweave-createx-preflight-v1',status:'RPC_SIMULATION_PASSED',
    chain_id:196,block:fixed.tag,block_hash:fixed.hash,
    account_address:bundle.account_address,predicted_address:bundle.predicted_address,
    initcode_hash:bundle.initcode_hash,observations,
    provider_agreement:rpcs.length===2,
    provider_scope:rpcs.length===2?'two distinct configured RPC origins':'single RPC',
    rpc_simulated:true,wallet_simulated:false,ready_to_send:false,broadcast:false,
    scope:'factory execution only; no EntryPoint validation, wallet signature, sponsorship or fee approval',
  };
}
const UOP_ABI=[
  'event BeforeExecution()',
  'event UserOperationEvent(bytes32 indexed userOpHash,address indexed sender,address indexed paymaster,uint256 nonce,bool success,uint256 actualGasCost,uint256 actualGasUsed)',
];
export function logPosition(log,receipt){
  if(log.removed||log.transactionHash?.toLowerCase()!==receipt.transactionHash.toLowerCase()
    ||log.blockHash?.toLowerCase()!==receipt.blockHash.toLowerCase()
    ||quantity(log.blockNumber)!==quantity(receipt.blockNumber))throw Error('Invalid receipt log binding');
  return quantity(log.logIndex);
}
export function uopProof(receipt,creation,bundle,options,ethers){
  const {userOperationHash,entryPoint}=options;
  if(!userOperationHash&&!entryPoint)return {verified:false,scope:'UserOperation proof not supplied'};
  if(!HASH.test(userOperationHash??'')||!entryPoint)throw Error('Supply both UserOperation hash and trusted EntryPoint');
  const trusted=nonzeroAddress(entryPoint,ethers);
  const iface=new ethers.Interface(UOP_ABI);
  const entries=receipt.logs.filter(l=>l.address.toLowerCase()===trusted.toLowerCase())
    .map(log=>{let event;try{event=iface.parseLog(log);}catch{return null;}
      return event?{event,position:logPosition(log,receipt)}:null;}).filter(Boolean)
    .sort((a,b)=>a.position<b.position?-1:1);
  const targets=entries.filter(e=>e.event.name==='UserOperationEvent'&&
    e.event.args.userOpHash.toLowerCase()===userOperationHash.toLowerCase());
  if(targets.length!==1)throw Error('Missing or ambiguous UserOperation event');
  const target=targets[0];
  if(target.event.args.sender!==bundle.account_address||target.event.args.success!==true){
    throw Error('UserOperation failed or used another account');
  }
  const boundaries=entries.filter(e=>e.position<target.position);
  const lower=boundaries.at(-1);
  const pos=logPosition(creation,receipt);
  if(!lower||pos<=lower.position||pos>=target.position)throw Error('Creation is outside selected UserOperation');
  return {verified:true,user_operation_hash:userOperationHash,entry_point:trusted,
    trust_basis:'explicit caller-supplied EntryPoint; verify this address against the wallet deployment',
    signature_revalidated:false};
}
// Shared receipt checks for deployment and subsequent host actions.
export async function confirmedReceipt(rpcs,ethers,options={}){
  const {transactionHash,minConfirmations=2}=options;
  if(!HASH.test(transactionHash??''))throw Error('Expected transaction hash');
  if(!Number.isSafeInteger(minConfirmations)||minConfirmations<1||minConfirmations>10000){
    throw Error('Confirmations must be 1..10000');
  }
  peers(rpcs);
  const receipts=await Promise.all(rpcs.map(async rpc=>{
    await chain(rpc);
    const receipt=await rpc.request('eth_getTransactionReceipt',[transactionHash]);
    if(!receipt||receipt.transactionHash?.toLowerCase()!==transactionHash.toLowerCase()
      ||quantity(receipt.status)!==1n||!HASH.test(receipt.blockHash??'')
      ||!Array.isArray(receipt.logs)||receipt.logs.length>4096)throw Error('Missing, failed or invalid receipt');
    return receipt;
  }));
  // Compare consensus fields, not provider-specific convenience fields or key order.
  agree(receipts.map(r=>({
    transaction_hash:r.transactionHash.toLowerCase(),status:quantity(r.status),
    block:quantity(r.blockNumber),block_hash:r.blockHash.toLowerCase(),
    logs:r.logs.map(log=>{
      if(!HEX.test(log.data??'')||!Array.isArray(log.topics)||log.topics.length>4||
        log.topics.some(t=>!HASH.test(t)))throw Error('Malformed receipt log');
      return {index:logPosition(log,r),address:nonzeroAddress(log.address,ethers).toLowerCase(),
        data:log.data.toLowerCase(),topics:log.topics.map(t=>t.toLowerCase())};
    }),
  })),'receipt');
  if(new Set(receipts[0].logs.map(l=>logPosition(l,receipts[0]).toString())).size!==receipts[0].logs.length){
    throw Error('Duplicate receipt log index');
  }
  const receipt=receipts[0],tag=receipt.blockNumber;
  const observations=await Promise.all(rpcs.map(async rpc=>{
    const [canonical,head,transaction]=await Promise.all([
      blockAt(rpc,tag),rpc.request('eth_blockNumber'),
      rpc.request('eth_getTransactionByHash',[transactionHash]),
    ]);
    if(canonical.hash.toLowerCase()!==receipt.blockHash.toLowerCase())throw Error('Receipt was reorganized');
    if(quantity(head)-quantity(tag)+1n<BigInt(minConfirmations))throw Error('Not enough confirmations');
    if(!transaction||transaction.hash?.toLowerCase()!==transactionHash.toLowerCase()
      ||transaction.blockHash?.toLowerCase()!==receipt.blockHash.toLowerCase()
      ||quantity(transaction.blockNumber)!==quantity(tag)||quantity(transaction.chainId)!==196n){
      throw Error('Transaction and receipt disagree');
    }
    return {endpoint:rpc.label,confirmations:(quantity(head)-quantity(tag)+1n).toString()};
  }));
  return {receipt,observations,minConfirmations};
}
export async function verifyCreateXDeployment(bundle,rpcs,tools,options={}){
  await validateCreateX(bundle,tools);
  const ethers=libraries(tools);
  const {receipt,observations:confirmations,minConfirmations}=await confirmedReceipt(rpcs,ethers,options);
  const transactionHash=options.transactionHash,tag=receipt.blockNumber;
  const iface=new ethers.Interface(FACTORY_ABI),host=new ethers.Interface(bundle.preparation.abi);
  const creations=receipt.logs.filter(l=>l.address?.toLowerCase()===FACTORY.toLowerCase())
    .filter(log=>{try{
      const parsed=iface.parseLog(log);
      return parsed?.name==='ContractCreation'&&parsed.args.newContract===bundle.predicted_address
        &&parsed.args.salt?.toLowerCase()===bundle.guarded_salt.toLowerCase();
    }catch{return false;}});
  if(creations.length!==1)throw Error('Missing or ambiguous CreateX creation event');
  logPosition(creations[0],receipt);
  const aa=uopProof(receipt,creations[0],bundle,options,ethers);
  const observations=await Promise.all(rpcs.map(async (rpc,index)=>{
    const processorCodeHash=await reviewedState(rpc,bundle,tag,ethers);
    const runtime=await rpc.request('eth_getCode',[bundle.predicted_address,tag]);
    if(codeHash(runtime,ethers)!==bundle.runtime_code_hash||
      runtime.toLowerCase()!==bundle.preparation.expected_runtime.toLowerCase()){
      throw Error('Deployed runtime differs from exact compiled immutable configuration');
    }
    for(const [name,expected]of [['processor',bundle.preparation.processor],
      ['pulseHash',bundle.preparation.pulse_hash],['alternatingHash',bundle.preparation.alternating_hash]]){
      const result=await rpc.request('eth_call',[{
        to:bundle.predicted_address,data:host.encodeFunctionData(name),
      },tag]);
      if(host.decodeFunctionResult(name,result)[0]!==expected)throw Error('Deployed configuration mismatch');
    }
    if((await blockAt(rpc,tag)).hash.toLowerCase()!==receipt.blockHash.toLowerCase()){
      throw Error('Canonical block changed during verification');
    }
    return {...confirmations[index],processor_code_hash:processorCodeHash};
  }));
  agree(observations.map(o=>o.processor_code_hash),'processor code');
  return {
    format:'tapeweave-createx-deployment-proof-v1',status:'DEPLOYMENT_CODE_AND_FACTORY_EVENT_VERIFIED',
    chain_id:196,transaction_hash:transactionHash,block:tag,block_hash:receipt.blockHash,
    creation_log_index:creations[0].logIndex,
    deployment_address:bundle.predicted_address,account_address:bundle.account_address,
    runtime_code_hash:bundle.runtime_code_hash,initcode_hash:bundle.initcode_hash,
    user_operation:aa,observations,provider_agreement:rpcs.length===2,
    confirmed_at_depth:minConfirmations,
    mainnet_host_actions_verified:false,broadcast_by_verifier:false,
    scope:'deployment receipt and historical code/configuration; not current availability, gameplay or finality guarantee',
  };
}
