import assert from 'node:assert/strict';
import {createArtifact,parseArtifact} from './creator-package.mjs';
import {presets} from './creator.mjs';
for(const p of Object.values(presets)){
 const artifact=await createArtifact(p.next,p.request);
 assert.deepEqual(await parseArtifact(JSON.stringify(artifact)),artifact);
 for(const [key,value] of [['sha256','wrong'],['netlist_hex','0100'],['chain_identity',{}],['evidence','verified'],['schema','other'],['next',[true]],['extra',1]]){
  await assert.rejects(()=>parseArtifact(JSON.stringify({...artifact,[key]:value})));
 }
 assert.deepEqual(p.next,presets[Object.keys(presets).find(k=>presets[k]===p)].next);
}
for(const t of ['null','[]','{','x'.repeat(16385)])await assert.rejects(()=>parseArtifact(t));
console.log('passed: creator package round trips, tampered fields and oversized/invalid input rejection');
