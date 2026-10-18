import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,writeFileSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawn,spawnSync} from 'node:child_process';
import {openStore} from './durable-host.mjs';
import {presets} from './creator.mjs';
import {createArtifact} from './creator-package.mjs';
import {createCreatorReplay,verifyCreatorReplay} from './creator-replay.mjs';
import {DatabaseSync} from 'node:sqlite';
const dir=mkdtempSync(join(tmpdir(),'tapeweave-db-')),file=join(dir,'host.sqlite');
const config={...presets.pulse,plain:false};
let store;
try{
 store=openStore(file);store.create('s',config);
 const command={id:'first',version:0,trigger:0};
 const receipt=store.act('s',command);
 assert.deepEqual(store.act('s',command),receipt);
 assert.throws(()=>store.act('s',{...command,trigger:1}),/冲突/);
 assert.throws(()=>store.act('s',{...command,id:'stale'}),/旧版本/);
 receipt.hosts[0].score=99;assert.equal(store.snapshot('s').hosts[0].score,0);
 store.close();store=openStore(file);assert.equal(store.snapshot('s').version,1);store.close();
 // Kill a separate process after INSERT but before COMMIT. SQLite must roll back.
 const url=new URL('./durable-host.mjs',import.meta.url).href;
 const child=spawnSync(process.execPath,['--input-type=module','-e',`import {openStore} from ${JSON.stringify(url)};const s=openStore(${JSON.stringify(file)},{beforeCommit:()=>process.kill(process.pid,'SIGKILL')});s.act('s',{id:'crash',version:1,trigger:0});`]);
 assert.equal(child.signal,'SIGKILL');
 store=openStore(file);assert.equal(store.snapshot('s').version,1);store.close();
 // Two independent writers use the same expected version; exactly one commits.
 const run=id=>new Promise((resolve,reject)=>{
   const code=`import {openStore} from ${JSON.stringify(url)};const s=openStore(${JSON.stringify(file)});try{s.act('s',{id:${JSON.stringify(id)},version:1,trigger:0});}catch{process.exitCode=3}finally{s.close()}`;
   const p=spawn(process.execPath,['--input-type=module','-e',code],{stdio:'ignore'});p.on('error',reject);p.on('close',resolve);
 });
 assert.deepEqual((await Promise.all([run('a'),run('b')])).sort(),[0,3]);
 store=openStore(file);assert.equal(store.snapshot('s').version,2);
 store.act('s',{id:'third',version:2,trigger:1});
 const final=store.act('s',{id:'last',version:3,trigger:1});
 assert.equal(final.hosts[0].score,2);assert.equal(final.hosts[1].score,1);
 assert.deepEqual(store.act('s',{id:'last',version:3,trigger:1}),final);
 assert.throws(()=>store.act('s',{id:'extra',version:3,trigger:1}),/旧版本/);
 const frozen=store.snapshot('s');store.close();store=openStore(file);assert.deepEqual(store.snapshot('s'),frozen);
 store.close();store=openStore(file,{beforeCommit:()=>{throw Error('injected failure')}});
 assert.throws(()=>store.create('rollback',config),/injected/);assert.throws(()=>store.snapshot('rollback'),/不存在/);
 store.close();store=null;
 // Stored configuration must satisfy the same contract as newly created sessions.
 const configDb=join(dir,'invalid-config.sqlite');
 store=openStore(configDb);store.create('config',config);
 const rawConfig=new DatabaseSync(configDb);
 const original=rawConfig.prepare('SELECT config FROM sessions WHERE id=?').get('config').config;
 for(const invalid of ['{','null',JSON.stringify({...config,plain:0}),JSON.stringify({...config,extra:true}),JSON.stringify({...config,next:[0]})]){
  rawConfig.prepare('UPDATE sessions SET config=? WHERE id=?').run(invalid,'config');
  assert.throws(()=>store.snapshot('config'),/存储配置不合法/);
  assert.throws(()=>store.act('config',{id:'no-write',version:0,trigger:0}),/存储配置不合法/);
  assert.equal(rawConfig.prepare('SELECT count(*) AS n FROM commands').get().n,0);
  assert.equal(rawConfig.prepare('SELECT config FROM sessions WHERE id=?').get('config').config,invalid);
 }
 rawConfig.prepare('UPDATE sessions SET config=? WHERE id=?').run(original,'config');
 assert.equal(store.act('config',{id:'valid',version:0,trigger:0}).version,1);
 rawConfig.prepare('UPDATE sessions SET config=? WHERE id=?').run(JSON.stringify({...config,plain:'false'}),'config');
 assert.throws(()=>store.act('config',{id:'valid',version:0,trigger:0}),/存储配置不合法/);
 assert.equal(rawConfig.prepare('SELECT count(*) AS n FROM commands').get().n,1);
 rawConfig.close();store.close();store=null;
 const cli=new URL('./host-cli.mjs',import.meta.url).pathname;
 const artifactPath=join(dir,'custom.json');
 // A non-template behavior: always request, latch stays zero.
 const artifact=await createArtifact(Array(8).fill(0),Array(8).fill(1));
 writeFileSync(artifactPath,JSON.stringify(artifact));
 const invoke=(...args)=>spawnSync(process.execPath,[cli,...args],{encoding:'utf8',timeout:10000});
 for(const plain of [false,true]){
  const db=join(dir,plain?'plain.sqlite':'byte.sqlite');
  const made=invoke(db,'import','custom',artifactPath,plain?'plain':'byte');assert.equal(made.status,0,made.stderr);
  const incomplete=invoke(db,'export','custom');assert.equal(incomplete.status,1);assert.equal(incomplete.stdout,'');
  const expected=await createCreatorReplay(artifact,[0,0,1,1],plain);
  for(let i=0;i<4;i++){
   const done=invoke(db,'act','custom','cmd'+i,String(i),String([0,0,1,1][i]));assert.equal(done.status,0,done.stderr);
  }
  const shown=invoke(db,'show','custom');assert.equal(shown.status,0,shown.stderr);
  assert.deepEqual(JSON.parse(shown.stdout).hosts,expected.results);
  const exported=invoke(db,'export','custom');assert.equal(exported.status,0,exported.stderr);
  assert.deepEqual(await verifyCreatorReplay(exported.stdout),expected);
  assert.equal(invoke(db,'show','custom').stdout,shown.stdout);
  const duplicate=invoke(db,'import','custom',artifactPath);assert.equal(duplicate.status,1);
  assert.equal(invoke(db,'show','custom').stdout,shown.stdout);
  const retried=invoke(db,'act','custom','cmd0','0','0');assert.equal(retried.status,0,retried.stderr);
  assert.equal(JSON.parse(retried.stdout).version,1);
  assert.equal(invoke(db,'show','custom').stdout,shown.stdout);
  // Stored receipts are not trusted: corruption must stop export and retries.
  const raw=new DatabaseSync(db);raw.prepare("UPDATE commands SET receipt='[]' WHERE session_id='custom' AND version=0").run();raw.close();
  const corrupted=invoke(db,'export','custom');assert.equal(corrupted.status,1);assert.equal(corrupted.stdout,'');assert.match(corrupted.stderr,/存储回放不一致/);
  for(const [cmd,version,trigger] of [['cmd0','0','0'],['cmd3','3','1']]){
   const retry=invoke(db,'act','custom',cmd,version,trigger);
   assert.equal(retry.status,1);assert.equal(retry.stdout,'');assert.match(retry.stderr,/存储回放不一致/);
  }
  const inspect=new DatabaseSync(db);
  assert.equal(inspect.prepare("SELECT count(*) AS n FROM commands WHERE session_id='custom'").get().n,4);
  assert.equal(inspect.prepare("SELECT receipt FROM commands WHERE session_id='custom' AND version=0").get().receipt,'[]');inspect.close();
 }
 artifact.sha256='wrong';writeFileSync(artifactPath,JSON.stringify(artifact));
 const rejected=join(dir,'not-created.sqlite');assert.equal(invoke(rejected,'import','bad',artifactPath).status,1);assert.equal(existsSync(rejected),false);
 console.log('passed: corrupt-log retries rejected without writes in both modes; completed durable replay export/verification and corrupt log rejection; custom artifact CLI import, byte/plain persisted parity, invalid import no database creation; sqlite restart, idempotent receipts, conflicting IDs, crash rollback, two-process version race, dual-host atomic commit');
}finally{store?.close();rmSync(dir,{recursive:true,force:true});}
