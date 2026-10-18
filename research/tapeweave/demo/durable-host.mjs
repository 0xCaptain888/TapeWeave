// Local Node SQLite adapter, not a wallet, network server or authenticated ledger.
import {DatabaseSync} from 'node:sqlite';
import {makeHost,compile} from './creator.mjs';
const exact=(x,keys)=>x && typeof x==='object' && !Array.isArray(x) && Object.keys(x).sort().join(',')===[...keys].sort().join(',');
const name=x=>typeof x==='string' && /^[a-zA-Z0-9_-]{1,80}$/.test(x);
export function validateArchive(archive){
  if(!exact(archive,['schema','authenticated','chain_identity','sessions']) || archive.schema!=='tapeweave-local-archive-v1' || archive.authenticated!==false || archive.chain_identity!==null || !Array.isArray(archive.sessions) || archive.sessions.length>100)throw Error('非法本地归档');
  const ids=new Set();
  for(const s of archive.sessions){
    if(!exact(s,['id','config','commands']) || !name(s.id) || ids.has(s.id) || !exact(s.config,['next','request','plain']) || typeof s.config.plain!=='boolean' || !Array.isArray(s.commands) || s.commands.length>4)throw Error('非法归档会话');
    ids.add(s.id);compile(s.config.next,s.config.request);
    const hosts=['training','door'].map(w=>makeHost(s.config.next,s.config.request,w,s.config.plain));
    const commands=new Set();
    s.commands.forEach((c,i)=>{
      if(!exact(c,['id','version','trigger','hosts']) || !name(c.id) || commands.has(c.id) || c.version!==i || ![0,1].includes(c.trigger))throw Error('非法归档命令');
      commands.add(c.id);
      if(JSON.stringify(hosts.map(h=>h.act(i,c.trigger)))!==JSON.stringify(c.hosts))throw Error('归档回放不一致');
    });
  }
  return structuredClone(archive);
}
export function openStore(path, {beforeCommit=()=>{}}={}) {
  const db=new DatabaseSync(path);
  db.exec(`PRAGMA busy_timeout=5000; PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL;
    CREATE TABLE IF NOT EXISTS sessions(id TEXT PRIMARY KEY, config TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS commands(session_id TEXT NOT NULL, command_id TEXT NOT NULL,
      version INTEGER NOT NULL, trigger INTEGER NOT NULL, receipt TEXT NOT NULL,
      PRIMARY KEY(session_id,command_id), UNIQUE(session_id,version),
      FOREIGN KEY(session_id) REFERENCES sessions(id)); PRAGMA foreign_keys=ON;`);
  function transaction(fn){
    db.exec('BEGIN IMMEDIATE');
    try{const result=fn();beforeCommit();db.exec('COMMIT');return result;}
    catch(e){db.exec('ROLLBACK');throw e;}
  }
  function load(id){
    if(!name(id))throw Error('非法会话ID');
    const row=db.prepare('SELECT config FROM sessions WHERE id=?').get(id);
    if(!row)throw Error('会话不存在');
    let config;
    try{
      config=JSON.parse(row.config);
      if(!exact(config,['next','request','plain']) || typeof config.plain!=='boolean')throw Error('invalid shape');
      compile(config.next,config.request);
    }catch{throw Error('存储配置不合法');}
    const hosts=['training','door'].map(w=>makeHost(config.next,config.request,w,config.plain));
    const commands=db.prepare('SELECT * FROM commands WHERE session_id=? ORDER BY version').all(id);
    for(const c of commands){
      const receipt=hosts.map(h=>h.act(c.version,c.trigger));
      if(JSON.stringify(receipt)!==c.receipt)throw Error('存储回放不一致');
    }
    return {config,hosts,version:commands.length};
  }
  return {
    create(id,config){
      if(!name(id) || !exact(config,['next','request','plain']) || typeof config.plain!=='boolean')throw Error('非法配置');
      compile(config.next,config.request);
      const encoded=JSON.stringify({next:[...config.next],request:[...config.request],plain:config.plain});
      return transaction(()=>{
        db.prepare('INSERT INTO sessions VALUES(?,?)').run(id,encoded);
        return {session:id,version:0};
      });
    },
    snapshot(id){
      // Read transaction keeps config and command log in one consistent snapshot.
      db.exec('BEGIN');
      try{const s=load(id);const result={session:id,config:s.config,version:s.version,hosts:s.hosts.map(h=>h.snapshot())};db.exec('COMMIT');return result;}
      catch(e){db.exec('ROLLBACK');throw e;}
    },
    act(id,command){
      if(!name(id) || !exact(command,['id','version','trigger']) || !name(command.id) || !Number.isInteger(command.version) || command.version<0 || command.version>3 || ![0,1].includes(command.trigger))throw Error('非法命令');
      return transaction(()=>{
        const old=db.prepare('SELECT * FROM commands WHERE session_id=? AND command_id=?').get(id,command.id);
        if(old){
          if(old.version!==command.version || old.trigger!==command.trigger)throw Error('命令ID冲突');
          // Idempotency does not make stored JSON trustworthy. Validate the
          // entire current log before returning an earlier saved receipt.
          load(id);
          return {session:id,command_id:command.id,version:old.version+1,hosts:JSON.parse(old.receipt),authenticated:false,chain_identity:null};
        }
        const s=load(id);
        if(s.version!==command.version || s.version>=4)throw Error('旧版本或本局结束');
        const hosts=s.hosts.map(h=>h.act(command.version,command.trigger));
        db.prepare('INSERT INTO commands VALUES(?,?,?,?,?)').run(id,command.id,command.version,command.trigger,JSON.stringify(hosts));
        return {session:id,command_id:command.id,version:command.version+1,hosts,authenticated:false,chain_identity:null};
      });
    },
    archive(){
      db.exec('BEGIN');
      try{
        const sessions=db.prepare('SELECT id FROM sessions ORDER BY id').all().map(({id})=>{
          const s=load(id);
          const commands=db.prepare('SELECT * FROM commands WHERE session_id=? ORDER BY version').all(id).map(c=>({id:c.command_id,version:c.version,trigger:c.trigger,hosts:JSON.parse(c.receipt)}));
          return {id,config:s.config,commands};
        });
        const result=validateArchive({schema:'tapeweave-local-archive-v1',authenticated:false,chain_identity:null,sessions});
        db.exec('COMMIT');return result;
      }catch(e){db.exec('ROLLBACK');throw e;}
    },
    restoreArchive(input){
      const archive=validateArchive(input);
      return transaction(()=>{
        if(db.prepare('SELECT COUNT(*) AS n FROM sessions').get().n!==0 || db.prepare('SELECT COUNT(*) AS n FROM commands').get().n!==0)throw Error('仅允许恢复到空数据库');
        for(const s of archive.sessions){
          db.prepare('INSERT INTO sessions VALUES(?,?)').run(s.id,JSON.stringify(s.config));
          for(const c of s.commands)db.prepare('INSERT INTO commands VALUES(?,?,?,?,?)').run(s.id,c.id,c.version,c.trigger,JSON.stringify(c.hosts));
        }
        return {restored_sessions:archive.sessions.length,authenticated:false,chain_identity:null};
      });
    },
    close(){db.close();}
  };
}
