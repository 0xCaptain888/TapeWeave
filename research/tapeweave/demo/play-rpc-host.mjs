// Explicit user-provided binding only; no default third-party circuit.
import {readLocalFile} from './read-local-file.mjs';
import {parseArtifact} from './creator-package.mjs';
import {openStore} from './durable-host.mjs';
import {connectRpcHost} from './rpc-host.mjs';
const args=process.argv.slice(2);let store;
try{
 if(args.length!==8)throw Error('usage: play-rpc-host.mjs DB SESSION ARTIFACT PROCESSOR CIRCUIT BLOCK ACTIONS_4_BITS NEW_COMMAND_PREFIX');
 const [db,session,file,processor,circuit,block,actions,prefix]=args;
 if(!/^[01]{4}$/.test(actions)||!/^[a-zA-Z0-9_-]{1,70}$/.test(prefix))throw Error('非法动作或命令前缀');
 const artifact=await parseArtifact(await readLocalFile(file,16384));
 store=openStore(db);
 // Existing session required: create/import with host-cli first. Never reset it.
 const host=await connectRpcHost(store,session,{artifact,processor,circuit,block});
 const observations=[];
 const initial=store.snapshot(session);
 if(initial.hosts.some(h=>h.trace.some(row=>row.trigger!==Number(actions[row.turn]))))throw Error('已提交动作与请求序列不一致');
 for(let i=store.snapshot(session).version;i<4;i++){
  const snapshot=store.snapshot(session);
  // A resumed run must agree with all committed actions, not silently relabel them.
  if(snapshot.hosts.some(h=>h.trace.some(row=>row.trigger!==Number(actions[row.turn]))))throw Error('已提交动作与请求序列不一致');
  observations.push(await host.act({id:prefix+'_'+i,version:i,trigger:Number(actions[i])}));
 }
 console.log(JSON.stringify({binding:host.report,observations,snapshot:store.snapshot(session),authenticated:false,host_transactions:false},null,2));
}catch(e){console.error('RPC宿主拒绝：'+e.message);process.exitCode=1;}finally{store?.close();}
