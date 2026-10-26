import assert from 'node:assert/strict';
import {ACCEPTANCE_TASKS,makeDeviceAcceptance} from './device-acceptance.mjs';
function form(kind='android'){
 return {kind,device:'author test fixture',browser:'fixture only',revision:'42287e7',actualDevice:false,
  items:ACCEPTANCE_TASKS[kind].map(([id])=>({id,result:'incomplete',note:'',hash:''}))};
}
const incomplete=makeDeviceAcceptance(form());
assert.equal(incomplete.items.length,9);assert.equal(incomplete.result,'incomplete');assert.equal(incomplete.hardwareAttested,false);
for(const kind of ['android','plugin','native']){
 const f=form(kind);
 f.items[0].result='pass';assert.throws(()=>makeDeviceAcceptance(f),/观察/);
 for(const x of f.items){x.result='pass';x.note='author synthetic test';if(['send','uop'].includes(x.id))x.hash='0x'+'11'.repeat(32);}
 assert.throws(()=>makeDeviceAcceptance(f),/实际设备/);f.actualDevice=true;
 const report=makeDeviceAcceptance(f);assert.equal(report.result,'pass');
 assert.equal(report.pluginIdentityAttested,false);assert.equal(report.chainReceiptsReverified,false);
 if(kind!=='android'){
  const send=f.items.find(x=>x.id==='send');send.hash='';assert.throws(()=>makeDeviceAcceptance(f),/哈希/);
  send.hash='0x'+'11'.repeat(32);
 }
 f.items[0].result='fail';assert.equal(makeDeviceAcceptance(f).result,'fail');
 f.items[0].result='incomplete';assert.equal(makeDeviceAcceptance(f).result,'incomplete');
 const wrong=form(kind);wrong.items.reverse();assert.throws(()=>makeDeviceAcceptance(wrong),/条目/);
}
const bad=form();bad.revision='latest';assert.throws(()=>makeDeviceAcceptance(bad),/SHA/);
console.log('PASS manual device records: nine Android tasks, explicit incomplete/fail/pass, actual-device acknowledgement, per-send hashes, no identity/hardware/chain attestation');
