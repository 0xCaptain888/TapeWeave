import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {presets} from './creator.mjs';
import {createArtifact} from './creator-package.mjs';
import {createCreatorReplay} from './creator-replay.mjs';
const dir=await mkdtemp(join(tmpdir(),'tw-verify-'));
const cli=fileURLToPath(new URL('./verify-creator.mjs',import.meta.url));
const play=fileURLToPath(new URL('./play-creator.mjs',import.meta.url));
const run=(...args)=>spawnSync(process.execPath,[cli,...args],{encoding:'utf8',timeout:10000});
try{
 const artifact=await createArtifact(presets.pulse.next,presets.pulse.request);
 const replay=await createCreatorReplay(artifact,[0,0,1,1],false);
 const artifactPath=join(dir,'play.json');const encoded=JSON.stringify(artifact);await writeFile(artifactPath,encoded);
 for(const ordinary of [false,true]){
  const args=[play,artifactPath,'0011',...(ordinary?['--ordinary']:[])];
  const played=spawnSync(process.execPath,args,{encoding:'utf8',timeout:10000});
  assert.equal(played.status,0,played.stderr);
  const output=JSON.parse(played.stdout);
  assert.deepEqual(output,await createCreatorReplay(artifact,[0,0,1,1],ordinary));
  const outputPath=join(dir,'played.json');await writeFile(outputPath,played.stdout);assert.equal(run('replay',outputPath).status,0);
 }
 const {readFile}=await import('node:fs/promises');assert.equal(await readFile(artifactPath,'utf8'),encoded);
 for(const args of [[artifactPath,'001'],[artifactPath,'0011','--bad']])assert.equal(spawnSync(process.execPath,[play,...args]).status,2);
 await writeFile(artifactPath,' '.repeat(16385));assert.equal(spawnSync(process.execPath,[play,artifactPath,'0011']).status,1);
 for(const [kind,value] of [['artifact',artifact],['replay',replay]]){
  const path=join(dir,kind+'.json');await writeFile(path,JSON.stringify(value));
  const result=run(kind,path);assert.equal(result.status,0,result.stderr);
  const data=JSON.parse(result.stdout);assert.equal(data.authenticated,false);assert.equal(data.chain_identity,null);
  if(kind==='replay')assert.deepEqual(data.results.map(s=>s.score),[2,1]);
  const corrupt=structuredClone(value);
  if(kind==='artifact')corrupt.sha256='bad';else corrupt.results[0].score++;
  await writeFile(path,JSON.stringify(corrupt));assert.equal(run(kind,path).status,1);
  await writeFile(path,' '.repeat(kind==='artifact'?16385:32769));assert.equal(run(kind,path).status,1);
 }
 const invalid=join(dir,'invalid.json');await writeFile(invalid,Buffer.from([0xff]));assert.equal(run('artifact',invalid).status,1);
 assert.equal(run('replay',join(dir,'missing')).status,1);
 assert.equal(run('artifact',dir).status,1);
 assert.equal(run('unknown',invalid).status,2);
 console.log('passed: creator execution in both modes with verifiable outputs; offline creator file CLI, scores, tampering, limits, invalid UTF-8 and usage failures');
}finally{await rm(dir,{recursive:true,force:true});}
