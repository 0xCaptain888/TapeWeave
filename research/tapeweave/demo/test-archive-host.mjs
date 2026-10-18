import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,readFileSync,writeFileSync,existsSync,realpathSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {openStore,validateArchive} from './durable-host.mjs';
import {presets} from './creator.mjs';
const dir=realpathSync(mkdtempSync(join(tmpdir(),'tapeweave-archive-')));
const cli=(...args)=>spawnSync(process.execPath,[fileURLToPath(new URL('archive-host.mjs',import.meta.url)),...args],{encoding:'utf8'});
try{
 const source=join(dir,'source.sqlite'),dest=join(dir,'restored.sqlite'),file=join(dir,'backup.json');
 let store=openStore(source);
 for(const plain of [false,true]){
  const id=plain?'plain':'byte';store.create(id,{...presets.pulse,plain});
  for(let i=0;i<3;i++)store.act(id,{id:'cmd'+i,version:i,trigger:i===2?1:0});
 }
 const before=store.snapshot('byte'),archive=store.archive();
 assert.equal(archive.sessions.length,2);
 const corrupt=structuredClone(archive);corrupt.sessions[0].commands[0].hosts[0].score=999;
 assert.throws(()=>validateArchive(corrupt));
 const duplicate=structuredClone(archive);duplicate.sessions.push(duplicate.sessions[0]);assert.throws(()=>validateArchive(duplicate));
 assert.throws(()=>store.restoreArchive(archive),/空数据库/);
 store.close();
 assert.equal(cli('backup',source,file).status,0);
 assert.equal(cli('backup',source,file).status,1);
 assert.equal(cli('restore',dest,file).status,0);
 assert.equal(cli('restore',dest,file).status,1);
 store=openStore(dest);assert.deepEqual(store.snapshot('byte'),before);
 const retry=store.act('byte',{id:'cmd0',version:0,trigger:0});assert.equal(retry.version,1);assert.equal(store.snapshot('byte').version,3);
 for(const id of ['byte','plain']){store.act(id,{id:'final',version:3,trigger:1});assert.equal(store.snapshot(id).hosts[0].score,2);assert.equal(store.snapshot(id).hosts[1].score,1);}
 store.close();
 const bad=join(dir,'bad.json'),badDb=join(dir,'bad.sqlite');writeFileSync(bad,JSON.stringify(corrupt));
 assert.equal(cli('restore',badDb,bad).status,1);assert.equal(existsSync(badDb),false);
 assert.equal(JSON.parse(readFileSync(file)).authenticated,false);
 const rollback=openStore(join(dir,'rollback.sqlite'),{beforeCommit(){throw Error('injected');}});
 assert.throws(()=>rollback.restoreArchive(archive),/injected/);assert.equal(rollback.archive().sessions.length,0);rollback.close();
 console.log('PASS logical archive: two modes, partial resume, command retry, no overwrite, corruption rejection, atomic rollback');
}finally{rmSync(dir,{recursive:true,force:true});}
