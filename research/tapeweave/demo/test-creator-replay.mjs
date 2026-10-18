import assert from 'node:assert/strict';
import {presets} from './creator.mjs';
import {createArtifact} from './creator-package.mjs';
import {createCreatorReplay,verifyCreatorReplay} from './creator-replay.mjs';
for(const p of Object.values(presets)){
 const artifact=await createArtifact(p.next,p.request);
 for(let mask=0;mask<16;mask++){
  const actions=Array.from({length:4},(_,i)=>(mask>>(3-i))&1);
  const byte=await createCreatorReplay(artifact,actions,false);
  const plain=await createCreatorReplay(artifact,actions,true);
  assert.deepEqual(byte.results,plain.results);
  for(const r of [byte,plain]){
   const before=structuredClone(r);
   assert.deepEqual(await verifyCreatorReplay(JSON.stringify(r)),r);
   assert.deepEqual(r,before);
  }
  for(const alter of [r=>r.results[0].score++,r=>r.results[1].resource++,r=>r.results[0].trace[0].request^=1,r=>r.authenticated=true,r=>r.chain_identity={},r=>r.extra=1]){
   const bad=structuredClone(byte);alter(bad);
   await assert.rejects(()=>verifyCreatorReplay(JSON.stringify(bad)));
  }
 }
 await assert.rejects(()=>createCreatorReplay(artifact,[0,0],false));
 await assert.rejects(()=>createCreatorReplay(artifact,[0,0,1,true],false));
}
for(const text of ['null','[]','{','x'.repeat(32769)])await assert.rejects(()=>verifyCreatorReplay(text));
console.log('passed: 64 creator replay round trips, byte/plain parity, tampered dual-host results and invalid input rejection');
