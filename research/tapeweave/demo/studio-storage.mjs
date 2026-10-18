import {compile,makeHost} from './creator.mjs';
const KEY='tapeweave-studio-local-v1';
export function restoreRecord(text){
  if(typeof text!=='string' || new TextEncoder().encode(text).length>16384)throw Error('本地存档超限');
  const r=JSON.parse(text);
  if(!r || Object.keys(r).sort().join(',')!=='actions,next,plain,request,schema' || r.schema!=='tapeweave-studio-save-v1' || typeof r.plain!=='boolean' || !Array.isArray(r.actions) || r.actions.length>4 || !Array.from(r.actions).every(x=>Number.isInteger(x)&&[0,1].includes(x)))throw Error('非法本地存档');
  compile(r.next,r.request);
  const hosts=['training','door'].map(w=>makeHost(r.next,r.request,w,r.plain));
  r.actions.forEach((t,v)=>hosts.forEach(h=>h.act(v,t)));
  return {record:r,hosts};
}
export function openLocalSession(storage,config,actions=[]){
  const initial={schema:'tapeweave-studio-save-v1',next:[...config.next],request:[...config.request],plain:config.plain,actions:[...actions]};
  let {record,hosts}=restoreRecord(JSON.stringify(initial));
  // Persist before exposing a successful state change. setItem is one key write,
  // not a cross-tab compare-and-swap, authenticated log or disk durability guarantee.
  let saved=JSON.stringify(record);
  storage.setItem(KEY,saved);
  return {
    snapshots:()=>hosts.map(h=>h.snapshot()),
    act(version,trigger){
      if(version!==record.actions.length || version>=4 || !Number.isInteger(trigger) || ![0,1].includes(trigger))throw Error('旧版本或非法动作');
      // Best-effort stale-session guard, not an atomic cross-tab lock.
      if(storage.getItem(KEY)!==saved)throw Error('存档已被其他页面更改，请刷新恢复后再操作');
      const candidate={...record,actions:[...record.actions,trigger]};
      const restored=restoreRecord(JSON.stringify(candidate));
      const encoded=JSON.stringify(candidate);
      storage.setItem(KEY,encoded);saved=encoded;
      record=restored.record;hosts=restored.hosts;
      return hosts.map(h=>h.snapshot());
    }
  };
}
export function readLocal(storage){const raw=storage.getItem(KEY);return raw===null?null:restoreRecord(raw);}
export function clearLocal(storage){storage.removeItem(KEY);}
