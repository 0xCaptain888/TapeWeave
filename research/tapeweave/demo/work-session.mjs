// Replay-validated local execution journal. Not authentication or a cross-tab transaction.
import {connectWork} from './work.mjs';
const KEY='tapeweave-work-session-v1';
const size=x=>new TextEncoder().encode(x).length;
export async function restoreSession(text){
 if(typeof text!=='string'||size(text)>131072)throw Error('执行存档超过128 KiB');
 const r=JSON.parse(text);
 if(!r||Object.keys(r).sort().join(',')!=='authenticated,commands,mode,schema,work'||r.schema!=='tapeweave-work-session-v1'||r.authenticated!==false||!Array.isArray(r.commands)||r.commands.length>64)throw Error('执行存档格式不合法');
 const player=await connectWork(JSON.stringify(r.work),{mode:r.mode});const seen=new Set();
 for(const c of r.commands){
  if(!c||Object.keys(c).sort().join(',')!=='id,row'||typeof c.id!=='string'||!/^[a-zA-Z0-9_-]{1,80}$/.test(c.id)||seen.has(c.id))throw Error('执行命令不合法');
  seen.add(c.id);const row=player.step(c.row?.version,{trigger:c.row?.trigger,recharge:c.row?.recharge}).trace.at(-1);
  if(JSON.stringify(row)!==JSON.stringify(c.row))throw Error('执行存档计算不一致');
 }
 return {record:structuredClone(r),player};
}
export async function createSession(work,mode='byte'){
 const p=await connectWork(work,{mode});return {schema:'tapeweave-work-session-v1',authenticated:false,work:p.work,mode,commands:[]};
}
export async function advanceSession(record,id,version,input){
 const {record:r,player}=await restoreSession(JSON.stringify(record));
 const prior=r.commands.find(c=>c.id===id);
 if(prior){if(prior.row.version!==version||prior.row.trigger!==input.trigger||prior.row.recharge!==input.recharge)throw Error('命令ID冲突');return r;}
 const row=player.step(version,input).trace.at(-1);r.commands.push({id,row});
 await restoreSession(JSON.stringify(r));return r;
}
export function sessionStorage(storage){
 let expected=storage.getItem(KEY);
 return {
  read:()=>expected,
  async save(record){const raw=JSON.stringify(record);await restoreSession(raw);if(storage.getItem(KEY)!==expected)throw Error('其他页面已更改存档，请先恢复最新存档');storage.setItem(KEY,raw);expected=raw;},
  refresh(){expected=storage.getItem(KEY);return expected;},
  current:()=>storage.getItem(KEY)===expected,
 };
}
