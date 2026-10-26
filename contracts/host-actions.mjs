// Post-deployment reads, unsigned action preparation and receipt verification.
// No wallet process, credentials, signing or broadcast API.
import {libraries,validateCreateX} from './createx.mjs';
import {fixedHead,blockAt,agree,codeHash,reviewedState,quantity,
  confirmedReceipt,uopProof,verifyCreateXDeployment} from './createx-rpc.mjs';
import {decodeSession} from '../research/tapeweave/demo/chain-host.mjs';

const HASH=/^0x[0-9a-fA-F]{64}$/;
function sessionNumber(value){
  if(typeof value!=='string'||!/^[1-9][0-9]{0,77}$/.test(value)||
    BigInt(value)>=(1n<<256n))throw Error('Explicit nonzero decimal session ID required');
  return value;
}
function reviewedCircuit(value){
  if(![1,2].includes(value))throw Error('Circuit must be 1 or 2');
  return value;
}
async function sameBlock(rpc,tag,hash){
  if((await blockAt(rpc,tag)).hash.toLowerCase()!==hash.toLowerCase()){
    throw Error('Canonical block changed during host verification');
  }
}
async function hostAt(rpc,bundle,tag,ethers){
  const processorCodeHash=await reviewedState(rpc,bundle,tag,ethers);
  const runtime=await rpc.request('eth_getCode',[bundle.predicted_address,tag]);
  if(codeHash(runtime,ethers)!==bundle.runtime_code_hash||
    runtime.toLowerCase()!==bundle.preparation.expected_runtime.toLowerCase()){
    throw Error('Host runtime does not match reviewed source and configuration');
  }
  const host=new ethers.Interface(bundle.preparation.abi);
  for(const [name,expected]of [['processor',bundle.preparation.processor],
    ['pulseHash',bundle.preparation.pulse_hash],['alternatingHash',bundle.preparation.alternating_hash]]){
    const raw=await rpc.request('eth_call',[{
      to:bundle.predicted_address,data:host.encodeFunctionData(name),
    },tag]);
    if(host.decodeFunctionResult(name,raw)[0]!==expected)throw Error('Host configuration mismatch');
  }
  return processorCodeHash;
}
async function readSession(rpc,bundle,id,tag,ethers){
  const host=new ethers.Interface(bundle.preparation.abi);
  return decodeSession(await rpc.request('eth_call',[{
    to:bundle.predicted_address,data:host.encodeFunctionData('sessions',[id]),
  },tag]));
}
export async function inspectHost(bundle,rpcs,tools,{sessionId}={}){
  if(sessionId!==undefined)sessionNumber(sessionId);
  await validateCreateX(bundle,tools);
  const ethers=libraries(tools),fixed=await fixedHead(rpcs);
  const host=new ethers.Interface(bundle.preparation.abi);
  const observations=await Promise.all(rpcs.map(async rpc=>{
    const processorCodeHash=await hostAt(rpc,bundle,fixed.tag,ethers);
    const accountCodeHash=codeHash(await rpc.request('eth_getCode',[
      bundle.account_address,fixed.tag,
    ]),ethers);
    const [count]=host.decodeFunctionResult('sessionCount',await rpc.request('eth_call',[{
      to:bundle.predicted_address,data:host.encodeFunctionData('sessionCount'),
    },fixed.tag]));
    const session=sessionId===undefined?null:
      await readSession(rpc,bundle,sessionId,fixed.tag,ethers);
    if(session&&session.player!==bundle.account_address.toLowerCase()){
      throw Error('Session belongs to another account');
    }
    if(sessionId!==undefined&&BigInt(sessionId)>count)throw Error('Session exceeds host count');
    await sameBlock(rpc,fixed.tag,fixed.hash);
    return {endpoint:rpc.label,processor_code_hash:processorCodeHash,
      account_code_hash:accountCodeHash,session_count:count.toString(),session};
  }));
  const state=agree(observations.map(({endpoint,...state})=>state),'host snapshot');
  return {format:'tapeweave-host-snapshot-v1',status:'HOST_SNAPSHOT_VERIFIED',
    chain_id:196,host:bundle.predicted_address,account_address:bundle.account_address,
    block:fixed.tag,block_hash:fixed.hash,session_id:sessionId??null,...state,
    observations,provider_agreement:rpcs.length===2,broadcast:false,
    scope:'current code and state at fixed block; not deployment provenance or wallet authorization'};
}
export async function prepareHostAction(bundle,rpcs,tools,options={}){
  const {operation,circuit,sessionId,expectedVersion,trigger}=options;
  reviewedCircuit(circuit);
  if(operation==='open'){
    if(sessionId!==undefined||expectedVersion!==undefined||trigger!==undefined){
      throw Error('Open does not accept session, version or trigger');
    }
  }else if(operation==='act'){
    sessionNumber(sessionId);
    if(!Number.isInteger(expectedVersion)||expectedVersion<0||expectedVersion>3||
      typeof trigger!=='boolean')throw Error('Explicit version 0..3 and boolean trigger required');
  }else throw Error('Operation must be open or act');
  const snapshot=await inspectHost(bundle,rpcs,tools,{sessionId});
  if(operation==='act'&&(snapshot.session.circuit!==circuit||
    snapshot.session.version!==expectedVersion)){
    throw Error('Circuit or version changed; do not silently regenerate or resend an action');
  }
  const ethers=libraries(tools),host=new ethers.Interface(bundle.preparation.abi);
  const calldata=host.encodeFunctionData(operation,operation==='open'
    ?[circuit]:[sessionId,expectedVersion,trigger]);
  const results=await Promise.all(rpcs.map(async rpc=>{
    const raw=await rpc.request('eth_call',[{
      from:bundle.account_address,to:bundle.predicted_address,value:'0x0',
      data:calldata,gas:'0x989680',
    },snapshot.block]);
    host.decodeFunctionResult(operation,raw);
    await sameBlock(rpc,snapshot.block,snapshot.block_hash);
    return raw.toLowerCase();
  }));
  agree(results,'action simulation');
  return {format:'tapeweave-host-action-v1',status:'HOST_ACTION_RPC_SIMULATION_PASSED',
    operation,circuit,session_id:sessionId??null,expected_version:expectedVersion??null,
    trigger:trigger??null,snapshot,
    execution:{to:bundle.predicted_address,value:'0',calldata},
    wallet_arguments:['wallet','contract-call','--chain','196','--to',bundle.predicted_address,
      '--amt','0','--input-data',calldata,'--from',bundle.account_address],
    rpc_simulated:true,wallet_simulated:false,ready_to_send:false,broadcast:false,
    recovery:'If a prior send is pending or unknown, inspect its receipt first; never automatically retry as a new action.',
    scope:'host function simulation from AA address; not full wallet/UserOperation simulation'};
}

function transactionRef(ref){
  if(!ref||!HASH.test(ref.transaction_hash??''))throw Error('Missing transaction hash');
  if((ref.user_operation_hash!==undefined)!==(ref.entry_point!==undefined)){
    throw Error('Supply both UserOperation hash and trusted EntryPoint');
  }
  if(ref.user_operation_hash!==undefined&&!HASH.test(ref.user_operation_hash)){
    throw Error('Invalid UserOperation hash');
  }
  return {transactionHash:ref.transaction_hash,userOperationHash:ref.user_operation_hash,
    entryPoint:ref.entry_point};
}
export async function verifyHostTransaction(bundle,rpcs,tools,options={}){
  await validateCreateX(bundle,tools);
  const ethers=libraries(tools),host=new ethers.Interface(bundle.preparation.abi);
  const {receipt,observations,minConfirmations}=await confirmedReceipt(rpcs,ethers,options);
  const events=receipt.logs.filter(l=>l.address.toLowerCase()===bundle.predicted_address.toLowerCase())
    .map(log=>({log,event:host.parseLog(log)}))
    .filter(({event})=>event&&['Opened','Acted'].includes(event.name));
  if(events.length!==1)throw Error('Expected exactly one host event; use a dedicated transaction per step');
  const {log,event}=events[0],id=event.args.session.toString();
  sessionNumber(id);
  const states=await Promise.all(rpcs.map(async rpc=>{
    const processor=await hostAt(rpc,bundle,receipt.blockNumber,ethers);
    const session=await readSession(rpc,bundle,id,receipt.blockNumber,ethers);
    if(session.player!==bundle.account_address.toLowerCase()||
      (event.name==='Opened'&&(event.args.player.toLowerCase()!==session.player||
        Number(event.args.circuit)!==session.circuit))||
      (event.name==='Acted'&&(Number(event.args.version)<1||
        Number(event.args.version)>session.version))){
      throw Error('Host event account, circuit or version mismatch');
    }
    await sameBlock(rpc,receipt.blockNumber,receipt.blockHash);
    return {processor_code_hash:processor,session};
  }));
  const state=agree(states,'host receipt state');
  return {format:'tapeweave-host-transaction-proof-v1',status:'HOST_EVENT_VERIFIED',
    chain_id:196,host:bundle.predicted_address,account_address:bundle.account_address,
    transaction_hash:options.transactionHash,block:receipt.blockNumber,block_hash:receipt.blockHash,
    log_index:log.logIndex,session_id:id,circuit:state.session.circuit,operation:event.name,
    event_version:event.name==='Opened'?0:Number(event.args.version),
    trigger:event.name==='Acted'?event.args.trigger:null,session_at_end_of_block:state.session,
    user_operation:uopProof(receipt,log,bundle,options,ethers),observations,
    confirmed_at_depth:minConfirmations,provider_agreement:rpcs.length===2,
    full_run_verified:false,broadcast_by_verifier:false,
    scope:'one successful host event and end-of-block state; not full replay or deployment provenance'};
}
function after(previous,current){
  const a=quantity(previous.block),b=quantity(current.block);
  if(b<a||(a===b&&(previous.block_hash.toLowerCase()!==current.block_hash.toLowerCase()||
    quantity(current.log_index)<=quantity(previous.log_index)))){
    throw Error('Receipts are not in canonical execution order');
  }
}
function advance(state,circuit,trigger){
  const recharge=state.version===0||state.version===2?1:0,t=Number(trigger);
  const step=old=>circuit===1
    ?{latch:recharge|(old&(1-t)),request:old&t}
    :{latch:old^t,request:(1-old)&t};
  const training=step(state.training.latch),door=step(state.door.latch);
  const effect=door.request===1&&state.version%2===1&&state.door.resource>0?1:0;
  return {state:{...state,version:state.version+1,
    training:{latch:training.latch,score:state.training.score+training.request,
      resource:state.training.resource+training.request},
    door:{latch:door.latch,score:state.door.score+effect,resource:state.door.resource-effect}},
    trainingRequest:training.request,doorRequest:door.request,doorEffect:effect};
}
export function validateRunManifest(manifest){
  if(manifest?.format!=='tapeweave-host-run-v1'||!Array.isArray(manifest.sessions)||
    manifest.sessions.length!==2)throw Error('Manifest must contain both reviewed card sessions');
  transactionRef(manifest.deployment);
  const hashes=[manifest.deployment.transaction_hash.toLowerCase()],ids=[],circuits=[];
  for(const session of manifest.sessions){
    reviewedCircuit(session.circuit);sessionNumber(session.session_id);
    circuits.push(session.circuit);ids.push(session.session_id);
    if(!Array.isArray(session.actions)||session.actions.length!==4){
      throw Error('Each card requires four explicit actions');
    }
    for(const [index,ref]of [session.open,...session.actions].entries()){
      transactionRef(ref);hashes.push(ref.transaction_hash.toLowerCase());
      if(index>0&&typeof ref.trigger!=='boolean')throw Error('Each action needs a boolean trigger');
    }
  }
  if(new Set(circuits).size!==2||new Set(ids).size!==2||new Set(hashes).size!==11){
    throw Error('Cards, sessions and transaction hashes must be distinct');
  }
  return manifest;
}
export async function verifyHostRun(bundle,rpcs,tools,manifest,{minConfirmations=2}={}){
  validateRunManifest(manifest);
  // Always re-fetch and verify deployment; never trust a caller-supplied success flag.
  const deployment=await verifyCreateXDeployment(bundle,rpcs,tools,{
    ...transactionRef(manifest.deployment),minConfirmations,
  });
  const ethers=libraries(tools),host=new ethers.Interface(bundle.preparation.abi);
  const canonical=[{block:deployment.block,block_hash:deployment.block_hash}];
  const sessions=[];
  for(const run of manifest.sessions){
    let previous={block:deployment.block,block_hash:deployment.block_hash,
      log_index:deployment.creation_log_index};
    let state={player:bundle.account_address.toLowerCase(),circuit:run.circuit,version:0,
      training:{latch:0,score:0,resource:0},door:{latch:0,score:0,resource:2}};
    const steps=[];
    for(const [index,ref]of [run.open,...run.actions].entries()){
      const options={...transactionRef(ref),minConfirmations};
      const {receipt,observations}=await confirmedReceipt(rpcs,ethers,options);
      const events=receipt.logs.filter(l=>l.address.toLowerCase()===bundle.predicted_address.toLowerCase())
        .map(log=>({log,event:host.parseLog(log)}))
        .filter(({event})=>event&&['Opened','Acted'].includes(event.name)&&
          event.args.session.toString()===run.session_id);
      if(events.length!==1)throw Error('Missing or ambiguous host session event');
      const {event,log}=events[0],args=event.args;
      if(index===0){
        if(event.name!=='Opened'||args.player.toLowerCase()!==state.player||
          Number(args.circuit)!==run.circuit)throw Error('Opened account or card mismatch');
      }else{
        const next=advance(state,run.circuit,ref.trigger);
        if(event.name!=='Acted'||Number(args.version)!==index||args.trigger!==ref.trigger||
          Number(args.trainingRequest)!==next.trainingRequest||
          Number(args.doorRequest)!==next.doorRequest||
          Number(args.doorEffect)!==next.doorEffect)throw Error('Action event differs from replay');
        state=next.state;
      }
      const step={transaction_hash:ref.transaction_hash,block:receipt.blockNumber,
        block_hash:receipt.blockHash,log_index:log.logIndex,operation:event.name,
        version:index,user_operation:uopProof(receipt,log,bundle,options,ethers),observations};
      after(previous,step);previous=step;canonical.push(step);
      const codes=await Promise.all(rpcs.map(async rpc=>{
        const processor=await hostAt(rpc,bundle,step.block,ethers);
        if(index===4){
          agree([await readSession(rpc,bundle,run.session_id,step.block,ethers),state],
            'final session state');
        }
        await sameBlock(rpc,step.block,step.block_hash);
        return processor;
      }));
      agree(codes,'processor code at action');
      steps.push(step);
    }
    sessions.push({session_id:run.session_id,circuit:run.circuit,
      triggers:run.actions.map(a=>a.trigger),final_state:state,steps});
  }
  // Catch a reorg that occurred while the later session was being checked.
  for(const rpc of rpcs)for(const {block,block_hash}of canonical){
    await sameBlock(rpc,block,block_hash);
  }
  const uops=[deployment.user_operation,...sessions.flatMap(s=>s.steps.map(x=>x.user_operation))];
  return {format:'tapeweave-host-run-proof-v1',status:'BOTH_CARD_RUNS_VERIFIED',
    chain_id:196,host:bundle.predicted_address,account_address:bundle.account_address,
    deployment,sessions,transaction_count:11,confirmed_at_depth:minConfirmations,
    provider_agreement:rpcs.length===2,all_user_operations_verified:uops.every(p=>p.verified),
    signature_revalidated:false,broadcast_by_verifier:false,
    scope:'RPC-observed deployment, ordered events and final historical states; not independent users, audit, demand or current availability'};
}
