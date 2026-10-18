// Offline consistency only. A fabricated transcript can pass; no provenance claim.
import {verifyBindingTranscript,encodeStep,decodeStep,endpoints} from './xlayer-binding.mjs';
import {parseArtifact} from './creator-package.mjs';
import {makeHost} from './creator.mjs';
import {readLocalFile} from './read-local-file.mjs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const canonical=x=>x&&typeof x==='object'?Array.isArray(x)?x.map(canonical):Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;
const same=(a,b)=>JSON.stringify(canonical(a))===JSON.stringify(canonical(b));
const exact=(x,keys)=>x&&typeof x==='object'&&!Array.isArray(x)&&same(Object.keys(x).sort(),keys.sort());
export async function verifyRpcHost(artifactText,transcriptText){
 if(typeof transcriptText!=='string'||Buffer.byteLength(transcriptText,'utf8')>524288)throw Error('RPC宿主记录超过512 KiB');
 const artifact=await parseArtifact(artifactText),t=JSON.parse(transcriptText);
 if(!exact(t,['binding','observations','snapshot','authenticated','host_transactions'])||t.authenticated!==false||t.host_transactions!==false||!Array.isArray(t.observations)||t.observations.length>4)throw Error('非法RPC宿主记录');
 const binding=await verifyBindingTranscript(artifact,t.binding),s=t.snapshot;
 if(!exact(s,['session','config','version','hosts'])||typeof s.session!=='string'||!/^[a-zA-Z0-9_-]{1,80}$/.test(s.session)||!Number.isInteger(s.version)||s.version<0||s.version>4||!same(s.config,{next:artifact.next,request:artifact.request,plain:false})||!Array.isArray(s.hosts)||s.hosts.length!==2)throw Error('非法最终快照');
 const hosts=['training','door'].map(w=>makeHost(artifact.next,artifact.request,w,false));
 const trace=s.hosts[0]?.trace;
 if(!Array.isArray(trace)||trace.length!==s.version)throw Error('快照轨迹不匹配');
 const start=s.version-t.observations.length;
 if(start<0)throw Error('观察数超过已提交拍数');
 const ids=new Set();
 for(let v=0;v<s.version;v++){
  const trigger=trace[v]?.trigger;
  if(![0,1].includes(trigger))throw Error('非法动作');
  const before=hosts.map(h=>h.snapshot()),results=hosts.map(h=>h.act(v,trigger));
  if(v<start)continue;
  const o=t.observations[v-start],r=o?.receipt;
  if(!exact(o,['schema','receipt','block','processor','circuit','records','authenticated','host_transactions','evidence'])||o.schema!=='tapeweave-rpc-host-observation-v1'||o.evidence!=='readonly-rpc-before-local-commit'||o.authenticated!==false||o.host_transactions!==false||o.block!==binding.block||o.processor!==binding.processor||o.circuit!==binding.circuit||!Array.isArray(o.records)||o.records.length!==4)throw Error('观察绑定或字段不一致');
  if(!exact(r,['session','command_id','version','hosts','authenticated','chain_identity'])||r.session!==s.session||typeof r.command_id!=='string'||!/^[a-zA-Z0-9_-]{1,80}$/.test(r.command_id)||ids.has(r.command_id)||r.version!==v+1||r.authenticated!==false||r.chain_identity!==null||!same(r.hosts,results))throw Error('提交回执不一致');
  ids.add(r.command_id);
  let index=0;
  for(const h of before)for(const endpoint of endpoints){
   const record=o.records[index++],recharge=Number(v===0||v===2),i=h.latch*4+trigger*2+recharge;
   const params=[{to:binding.processor,data:encodeStep(binding.circuit,h.latch,trigger+(recharge<<1))},binding.block];
   if(!exact(record,['endpoint','method','params','result'])||record.endpoint!==endpoint||record.method!=='eth_call'||!same(record.params,params))throw Error('RPC请求顺序或参数不一致');
   if(!same(decodeStep(record.result),[artifact.next[i],artifact.request[i]]))throw Error('RPC转换不一致');
  }
 }
 if(!same(s.hosts,hosts.map(h=>h.snapshot())))throw Error('最终宿主状态不一致');
 return {schema:'tapeweave-rpc-host-check-v1',consistent:true,artifact_sha256:artifact.sha256,version:s.version,observed_turns:t.observations.length,unobserved_prefix_turns:start,complete_rpc_coverage:s.version===4&&start===0,authenticated:false,host_transactions:false,notice:'仅复核文本自洽；不认证RPC来源、本地数据库历史、制造或链上交易'};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 try{const [artifact,transcript,...extra]=process.argv.slice(2);if(!artifact||!transcript||extra.length)throw Error('usage: verify-rpc-host.mjs ARTIFACT_FILE RPC_HOST_RECORD_FILE');console.log(JSON.stringify(await verifyRpcHost(await readLocalFile(artifact,16384),await readLocalFile(transcript,524288)),null,2));}
 catch(e){console.error('RPC宿主复核失败：'+e.message);process.exitCode=1;}
}
