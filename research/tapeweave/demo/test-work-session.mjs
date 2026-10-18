import assert from 'node:assert/strict';
import {createWork,presetArtifact} from './work.mjs';
import {createSession,advanceSession,restoreSession,sessionStorage} from './work-session.mjs';
import {inspectUpgrade,applyUpgrade} from './work-upgrade.mjs';
const work=JSON.stringify(await createWork({title:'展览通行印记',description:'领取能量后在应用中使用一次',scene:'reveal',artifact:await presetArtifact('pulse')}));
for(const mode of ['byte','plain']){
 let r=await createSession(work,mode);r=await advanceSession(r,'charge',0,{trigger:0,recharge:1});r=await advanceSession(r,'use',1,{trigger:1,recharge:0});
 assert.equal((await restoreSession(JSON.stringify(r))).player.snapshot().trace[1].request,1);
 assert.deepEqual(await advanceSession(r,'use',1,{trigger:1,recharge:0}),r);
 await assert.rejects(()=>advanceSession(r,'use',1,{trigger:0,recharge:0}),/冲突/);
 await assert.rejects(()=>advanceSession(r,'stale',0,{trigger:0,recharge:0}),/旧版本/);
 const metadata=JSON.parse(work);metadata.title='New title';const text=JSON.stringify(metadata);
 assert.equal((await inspectUpgrade(r,text)).can_preserve,true);
 const kept=await applyUpgrade(r,text,'preserve');assert.equal(kept.record.mode,mode);assert.deepEqual(kept.record.commands,r.commands);assert.deepEqual(kept.previous,r);
 kept.record.commands[0].row.request=99;assert.notEqual(r.commands[0].row.request,99);
 metadata.scene='lamp';await assert.rejects(()=>applyUpgrade(r,JSON.stringify(metadata),'preserve'),/只能显式/);
 assert.equal((await applyUpgrade(r,JSON.stringify(metadata),'restart')).record.commands.length,0);
 metadata.scene='reveal';metadata.artifact=await presetArtifact('alternating');await assert.rejects(()=>applyUpgrade(r,JSON.stringify(metadata),'preserve'),/只能显式/);
 await assert.rejects(()=>applyUpgrade(r,text,''),/请选择/);await assert.rejects(()=>applyUpgrade(r,'{}','restart'));
 const bad=structuredClone(r);bad.commands[1].row.request=0;await assert.rejects(()=>restoreSession(JSON.stringify(bad)),/不一致/);
 const data=new Map(),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
 const a=sessionStorage(storage),b=sessionStorage(storage);await a.save(r);await assert.rejects(()=>b.save(r),/其他页面/);b.refresh();await b.save(r);assert(a.current());
 storage.setItem=()=>{throw Error('quota')};await assert.rejects(()=>a.save(r),/quota/);
}
console.log('PASS work sessions: replay, parity, idempotency, stale versions, tampering, detected concurrent writes, quota failure');
