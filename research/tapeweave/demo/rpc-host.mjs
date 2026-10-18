// Live read-only RPC evaluation followed by an optimistic local SQLite commit.
// No signing or chain state writes. The injected reader is only for tests.
import {checkBinding,decodeStep,encodeStep,endpoints,publicRead} from './xlayer-binding.mjs';
import {parseArtifact} from './creator-package.mjs';
export async function connectRpcHost(store,session,binding,read=publicRead){
 const artifact=await parseArtifact(typeof binding.artifact==='string'?binding.artifact:JSON.stringify(binding.artifact));
 const report=await checkBinding({...binding,artifact},read);
 if(!report.matched)throw Error('RPC接入拒绝：'+report.failure);
 const matches=s=>!s.config.plain&&JSON.stringify(s.config.next)===JSON.stringify(artifact.next)&&JSON.stringify(s.config.request)===JSON.stringify(artifact.request);
 if(!matches(store.snapshot(session)))throw Error('会话不是同一字节制品或使用普通模式');
 return {
  report,
  async act(command){
   // The store remains authoritative for exact command shape, idempotency and
   // transaction/version validation; validate before any RPC as well.
   if(!command||Object.keys(command).sort().join(',')!=='id,trigger,version'||typeof command.id!=='string'||!/^[a-zA-Z0-9_-]{1,80}$/.test(command.id)||!Number.isInteger(command.version)||command.version<0||command.version>3||![0,1].includes(command.trigger))throw Error('非法命令');
   const before=store.snapshot(session);
   if(!matches(before))throw Error('会话配置变化');
   if(before.version!==command.version)throw Error('RPC动作要求当前版本；已提交命令请用原持久宿主读取回执');
   const records=[];
   for(const host of before.hosts){
    const recharge=Number(before.version===0||before.version===2),i=host.latch*4+command.trigger*2+recharge;
    const params=[{to:report.processor,data:encodeStep(report.circuit,host.latch,command.trigger+(recharge<<1))},report.block];
    for(const endpoint of endpoints){
     const raw=await read(endpoint,'eth_call',params),[next,request]=decodeStep(raw);
     if(next!==artifact.next[i]||request!==artifact.request[i])throw Error('RPC动作转换不一致；未提交');
     records.push({endpoint,method:'eth_call',params,result:raw});
    }
   }
   // Network awaits never hold a SQLite transaction. A competing writer wins
   // or loses via the existing transaction's expected version / command id.
   const receipt=store.act(session,command);
   return {schema:'tapeweave-rpc-host-observation-v1',receipt,block:report.block,processor:report.processor,circuit:report.circuit,records,authenticated:false,host_transactions:false,evidence:'readonly-rpc-before-local-commit'};
  }
 };
}
