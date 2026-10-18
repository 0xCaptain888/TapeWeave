import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {request} from 'node:http';
import {startLocalServer} from './local-server.mjs';
import {createArtifact} from './creator-package.mjs';
import {verifyCreatorReplay} from './creator-replay.mjs';
import {presets} from './creator.mjs';
const dir=await mkdtemp(join(tmpdir(),'tapeweave-http-'));let app;
try{
 const database=join(dir,'state.sqlite');app=await startLocalServer({database});
 const call=async(op,b,headers={})=>{
  const r=await fetch(app.origin+'/api/'+op,{method:'POST',headers:{Origin:app.origin,'Content-Type':'application/json',Authorization:'Bearer '+app.token,...headers},body:typeof b==='string'?b:JSON.stringify(b)});
  return {status:r.status,data:await r.json()};
 };
 assert.equal((await call('show',{session:'x'},{Authorization:''})).status,403);
 assert.equal((await call('show',{session:'x'},{Origin:'https://evil.example'})).status,403);
 assert.equal((await call('show',{session:'x'},{Origin:''})).status,403);
 assert.equal(await new Promise((ok,fail)=>{const r=request(app.origin,{headers:{Host:'evil.example'}},s=>{s.resume();ok(s.statusCode);});r.on('error',fail);r.end();}),403);
 assert.equal((await call('show',{session:'x'},{'Content-Type':'text/plain'})).status,415);
 assert.equal((await call('show','{')).status,400);
 assert.equal((await call('show',' '.repeat(24577))).status,400);
 assert.equal((await call('show',{session:'x',extra:1})).status,400);
 assert.equal((await fetch(app.origin+'/state.sqlite')).status,404);
 assert.equal((await fetch(app.origin+'/local-server.mjs')).status,404);
 const page=await fetch(app.origin+'/');assert.equal(page.status,200);assert.ok(page.headers.get('content-security-policy').includes("frame-ancestors 'none'"));assert.ok((await page.text()).includes('SQLite'));
 const artifact=await createArtifact(presets.pulse.next,presets.pulse.request);
 for(const plain of [false,true]){
  const session=plain?'plain':'byte';
  assert.equal((await call('create',{session,artifact:JSON.stringify(artifact),plain})).status,200);
  assert.equal((await call('create',{session,artifact:JSON.stringify(artifact),plain})).status,400);
  assert.equal((await call('export',{session})).status,400);
  for(const [version,trigger] of [0,0,1,1].entries()){
   const b={session,command:{id:'cmd'+version,version,trigger}};
   const first=await call('act',b);assert.equal(first.status,200);
   assert.deepEqual((await call('act',b)).data,first.data);
   assert.equal((await call('act',{session,command:{id:'conflict'+version,version,trigger}})).status,400);
  }
  const snapshot=(await call('show',{session})).data;
  assert.equal(snapshot.version,4);assert.equal(snapshot.hosts[0].score,2);assert.equal(snapshot.hosts[1].score,1);assert.equal(snapshot.hosts[1].resource,1);
  const exported=await call('export',{session});assert.equal(exported.status,200);
  await verifyCreatorReplay(JSON.stringify(exported.data));
 }
 await app.close();app=await startLocalServer({database});
 assert.equal((await call('show',{session:'byte'})).data.version,4);
 const races=await call('create',{session:'race',artifact:JSON.stringify(artifact),plain:false});assert.equal(races.status,200);
 const concurrent=await Promise.all(['one','two'].map(id=>call('act',{session:'race',command:{id,version:0,trigger:0}})));
 assert.deepEqual(concurrent.map(x=>x.status).sort(),[200,400]);
 await assert.rejects(startLocalServer({database:join(process.cwd(),'bad.sqlite')}),/仓库目录之外/);
 console.log('PASS local loopback HTTP: two modes, export verification, restart, dedup, concurrent version, auth/origin/host/body/static boundaries; not browser or security audit');
}finally{await app?.close();await rm(dir,{recursive:true,force:true});}
