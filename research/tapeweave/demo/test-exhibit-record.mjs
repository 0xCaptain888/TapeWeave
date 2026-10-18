import assert from 'node:assert/strict';
import {createWork,presetArtifact,connectWork} from './work.mjs';
import {verifyExhibitRecord} from './exhibit-record.mjs';
for(const mode of ['byte','plain']){
 const work=await createWork({title:'测试',description:'先领取再使用',scene:'reveal',artifact:await presetArtifact('pulse')});
 const a=await connectWork(JSON.stringify(work),{mode}),b=await connectWork(JSON.stringify(work),{mode});
 for(const p of [a,b]){p.step(0,{trigger:0,recharge:1});p.step(1,{trigger:1,recharge:0});}
 const record={schema:'tapeweave-author-exhibit-experiment-v1',authenticated:false,chain_identity:null,mode,elapsed_ms:123,work,applications:{exhibit:{snapshot:a.snapshot(),revealed:true},stamp:{snapshot:b.snapshot(),stock:0,stamps:1}},source:'local-author-applications-not-independent-adoption'};
 const result=await verifyExhibitRecord(JSON.stringify(record));assert.equal(result.completed,2);assert.equal(result.mode,mode);
 for(const change of [r=>r.applications.stamp.stock=1,r=>r.applications.exhibit.revealed=false,r=>r.applications.exhibit.snapshot.trace[0].next=0,r=>r.authenticated=true,r=>r.elapsed_ms=-1,r=>r.mode='unknown',r=>r.applications.stamp.snapshot.extra=1]){const bad=structuredClone(record);change(bad);await assert.rejects(()=>verifyExhibitRecord(JSON.stringify(bad)));}
 // A use after exhausting inventory is not a valid exhibition action, even with valid circuit math.
 b.step(2,{trigger:0,recharge:1});b.step(3,{trigger:1,recharge:0});const empty=structuredClone(record);empty.applications.stamp.snapshot=b.snapshot();await assert.rejects(()=>verifyExhibitRecord(JSON.stringify(empty)),/空库存/);
 const partial=structuredClone(record);const zero=await connectWork(JSON.stringify(work),{mode});partial.applications={exhibit:{snapshot:zero.snapshot(),revealed:false},stamp:{snapshot:zero.snapshot(),stock:1,stamps:0}};assert.equal((await verifyExhibitRecord(JSON.stringify(partial))).completed,0);
}
await assert.rejects(()=>verifyExhibitRecord(' '.repeat(131073)),/128 KiB/);
console.log('PASS exhibition record recomputation: modes, partial, tamper, inventory, evidence flags, size');
