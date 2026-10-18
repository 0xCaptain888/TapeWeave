import assert from 'node:assert/strict';
import {createWork,presetArtifact} from './work.mjs';
import {createSession,advanceSession,restoreSession,sessionStorage} from './work-session.mjs';
const work=JSON.stringify(await createWork({title:'展览通行印记',description:'领取能量后在应用中使用一次',scene:'reveal',artifact:await presetArtifact('pulse')}));
for(const mode of ['byte','plain']){
 let r=await createSession(work,mode);r=await advanceSession(r,'charge',0,{trigger:0,recharge:1});r=await advanceSession(r,'use',1,{trigger:1,recharge:0});
 assert.equal((await restoreSession(JSON.stringify(r))).player.snapshot().trace[1].request,1);
 assert.deepEqual(await advanceSession(r,'use',1,{trigger:1,recharge:0}),r);
 await assert.rejects(()=>advanceSession(r,'use',1,{trigger:0,recharge:0}),/冲突/);
 await assert.rejects(()=>advanceSession(r,'stale',0,{trigger:0,recharge:0}),/旧版本/);
 const bad=structuredClone(r);bad.commands[1].row.request=0;await assert.rejects(()=>restoreSession(JSON.stringify(bad)),/不一致/);
 const data=new Map(),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
 const a=sessionStorage(storage),b=sessionStorage(storage);await a.save(r);await assert.rejects(()=>b.save(r),/其他页面/);b.refresh();await b.save(r);assert(a.current());
 storage.setItem=()=>{throw Error('quota')};await assert.rejects(()=>a.save(r),/quota/);
}
console.log('PASS work sessions: replay, parity, idempotency, stale versions, tampering, detected concurrent writes, quota failure');
