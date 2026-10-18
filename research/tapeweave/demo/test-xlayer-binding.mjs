import assert from 'node:assert/strict';
import {checkBinding,verifyBindingTranscript,encodeStep,endpoints,publicRead} from './xlayer-binding.mjs';
import {createArtifact} from './creator-package.mjs';
import {presets} from './creator.mjs';
import {createCreatorReplay} from './creator-replay.mjs';
import {prepareDelivery} from './prepare-delivery.mjs';
const artifact=await createArtifact(presets.pulse.next,presets.pulse.request);
const word=n=>BigInt(n).toString(16).padStart(64,'0');
const tail=hex=>word(hex.length/2)+hex.padEnd(Math.ceil(hex.length/64)*64,'0');
const dynamic=hex=>'0x'+word(32)+tail(hex);
const input={artifact,processor:'0x'+'12'.repeat(20),circuit:'1',block:'0x123'};
const fake=async(endpoint,method,params)=>{
 assert.ok(endpoints.includes(endpoint));
 if(method==='eth_chainId')return '0xc4';
 assert.equal(params.at(-1),'0x123');
 if(method==='eth_getCode')return '0x6000';
 assert.equal(method,'eth_call');const data=params[0].data;
 if(data.startsWith('0x084d60f1'))return '0x'+[2,1,1,100].map(word).join('');
 if(data.startsWith('0x3fc4be56'))return dynamic(artifact.netlist_hex);
 assert.equal(data.slice(0,10),'0xe8281a1a');assert.equal(data.length,458);
 const raw=data.slice(10),old=Number.parseInt(raw.slice(256,258),16),bits=Number.parseInt(raw.slice(384,386),16);
 const i=old*4+(bits&1)*2+(bits>>1);
 return '0x'+word(64)+word(128)+tail('0'+artifact.next[i])+tail('0'+artifact.request[i]);
};
const result=await checkBinding(input,fake);assert.equal(result.matched,true,result.failure);assert.equal(result.records.length,24);assert.equal(result.transitions.length,8);assert.equal(artifact.chain_identity,null);
await verifyBindingTranscript(artifact,result);
const replay=await createCreatorReplay(artifact,[0,0,1,1],false);
const handoff=await prepareDelivery(JSON.stringify(artifact),JSON.stringify(replay),JSON.stringify(result));
assert.equal(handoff.competition_ready,false);assert.equal(handoff.readonly_binding.transcript_consistent,true);assert.equal(handoff.replay.training_score,2);
assert.equal((await prepareDelivery(JSON.stringify(artifact),JSON.stringify(replay))).readonly_binding,null);
const other=await createArtifact(presets.alternating.next,presets.alternating.request);
await assert.rejects(prepareDelivery(JSON.stringify(other),JSON.stringify(replay)),/同一字节/);
for(const mutate of [r=>{r.records.reverse();},r=>{r.artifact_sha256='bad';},r=>{r.host_transactions=true;},r=>{r.transitions[0].next^=1;},r=>{r.records[0].result='0x1';},r=>{r.records.push(r.records[0]);}]){const changed=structuredClone(result);mutate(changed);await assert.rejects(verifyBindingTranscript(artifact,changed));}
for(const [field,value] of [['block','latest'],['processor','0x'+'00'.repeat(20)],['circuit','18446744073709551616'],['circuit',1]])await assert.rejects(checkBinding({...input,[field]:value},fake));
let calls=0;await assert.rejects(checkBinding({...input,artifact:{...artifact,sha256:'bad'}},()=>{calls++;}));assert.equal(calls,0);
for(const mutate of [
 (m,r)=>m==='eth_chainId'?'0x1':r,
 (m,r)=>m==='eth_getCode'?'0x':r,
 (m,r)=>r.startsWith('0x'+word(32))?dynamic('00'):r,
 (m,r)=>r.startsWith('0x'+word(64))?r+'00':r,
 (m,r)=>r.startsWith('0x'+word(64))?r.slice(0,-1)+'f':r,
]){const bad=await checkBinding(input,async(e,m,p)=>mutate(m,await fake(e,m,p)));assert.equal(bad.matched,false);assert.ok(bad.failure);}
const mismatch=await checkBinding(input,async(e,m,p)=>m==='eth_getCode'&&e===endpoints[1]?'0x6001':fake(e,m,p));assert.equal(mismatch.matched,false);
const timeout=await checkBinding(input,()=>{throw Error('synthetic timeout');});assert.equal(timeout.matched,false);assert.equal(timeout.failure,'synthetic timeout');
await assert.rejects(publicRead('https://evil.example','eth_call',[]));await assert.rejects(publicRead(endpoints[0],'eth_sendRawTransaction',[]));
assert.ok(encodeStep('1',0,0).startsWith('0xe8281a1a'));
console.log('PASS synthetic RPC binding: 24 bounded reads, eight transitions, fixed block/network, mismatches/malformed ABI/transport failure, no writes; not a real chain binding');
