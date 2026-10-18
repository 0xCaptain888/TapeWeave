// Node24 local durable work sessions. No public server, wallet or identity claims.
import {DatabaseSync} from 'node:sqlite';
import {createSession,advanceSession,restoreSession} from './work-session.mjs';
const valid=x=>typeof x==='string'&&/^[a-zA-Z0-9_-]{1,80}$/.test(x);
export function openWorkStore(path,{beforeCommit=()=>{}}={}){
 const db=new DatabaseSync(path);db.exec('PRAGMA busy_timeout=5000; PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; CREATE TABLE IF NOT EXISTS work_sessions(id TEXT PRIMARY KEY, record TEXT NOT NULL)');
 function raw(id){if(!valid(id))throw Error('非法会话ID');const row=db.prepare('SELECT record FROM work_sessions WHERE id=?').get(id);if(!row)throw Error('会话不存在');return row.record;}
 function tx(fn){db.exec('BEGIN IMMEDIATE');try{const result=fn();beforeCommit();db.exec('COMMIT');return result;}catch(e){db.exec('ROLLBACK');throw e;}}
 return {
  async create(id,work,mode='byte'){if(!valid(id))throw Error('非法会话ID');const record=await createSession(work,mode);return tx(()=>{db.prepare('INSERT INTO work_sessions VALUES(?,?)').run(id,JSON.stringify(record));return structuredClone(record);});},
  async snapshot(id){return (await restoreSession(raw(id))).record;},
  async act(id,command){
   if(!command||Object.keys(command).sort().join(',')!=='id,input,version'||!valid(command.id)||!command.input||Object.keys(command.input).sort().join(',')!=='recharge,trigger')throw Error('非法命令');
   const before=raw(id),record=(await restoreSession(before)).record;
   const next=await advanceSession(record,command.id,command.version,command.input);
   return tx(()=>{if(raw(id)!==before)throw Error('会话已变化；以原命令ID重试');db.prepare('UPDATE work_sessions SET record=? WHERE id=?').run(JSON.stringify(next),id);return structuredClone(next);});
  },
  list(){return db.prepare('SELECT id FROM work_sessions ORDER BY id LIMIT 101').all().map(r=>r.id);},
  close(){db.close();}
 };
}
