import assert from 'node:assert/strict';
import {openStore} from './durable-host.mjs';
import {connectRpcHost} from './rpc-host.mjs';
import {createArtifact} from './creator-package.mjs';
import {presets} from './creator.mjs';
import {verifyRpcHost} from './verify-rpc-host.mjs';
import {prepareDelivery} from './prepare-delivery.mjs';
import {createCreatorReplay} from './creator-replay.mjs';
const artifact=await createArtifact(presets.pulse.next,presets.pulse.request);
const word=n=>BigInt(n).toString(16).padStart(64,'0');
const tail=hex=>word(hex.length/2)+hex.padEnd(Math.ceil(hex.length/64)*64,'0');
const fake=async(e,m,p)=>{
 if(m==='eth_chainId')return '0xc4';if(m==='eth_getCode')return '0x6000';
 const data=p[0].data;
 if(data.startsWith('0x084d60f1'))return '0x'+[2,1,1,100].map(word).join('');
 if(data.startsWith('0x3fc4be56'))return '0x'+word(32)+tail(artifact.netlist_hex);
 const raw=data.slice(10),old=parseInt(raw.slice(256,258),16),bits=parseInt(raw.slice(384,386),16),i=old*4+(bits&1)*2+(bits>>1);
 return '0x'+word(64)+word(128)+tail('0'+artifact.next[i])+tail('0'+artifact.request[i]);
};
const binding={artifact,processor:'0x'+'12'.repeat(20),circuit:'1',block:'0x123'};
const store=openStore(':memory:');
const config={...presets.pulse,plain:false};
try{
 store.create('ok',config);const host=await connectRpcHost(store,'ok',binding,fake);
 const observations=[];
 for(let i=0;i<4;i++){const r=await host.act({id:'a'+i,version:i,trigger:Number('0011'[i])});observations.push(r);assert.equal(r.records.length,4);assert.equal(r.host_transactions,false);}
 const transcript={binding:host.report,observations,snapshot:store.snapshot('ok'),authenticated:false,host_transactions:false};
 const verify=t=>verifyRpcHost(JSON.stringify(artifact),JSON.stringify(t));
 assert.equal((await verify(transcript)).complete_rpc_coverage,true);
 const replay=await createCreatorReplay(artifact,[0,0,1,1],false);
 const delivery=await prepareDelivery(JSON.stringify(artifact),JSON.stringify(replay),JSON.stringify(host.report),JSON.stringify(transcript));
 assert.equal(delivery.rpc_host.complete_rpc_coverage,true);assert.equal(delivery.competition_ready,false);assert.equal(delivery.files.rpc_host_utf8_sha256.length,64);
 const wrongReplay=await createCreatorReplay(artifact,[1,1,1,1],false);
 await assert.rejects(prepareDelivery(JSON.stringify(artifact),JSON.stringify(wrongReplay),undefined,JSON.stringify(transcript)),/回放不一致/);
 const resumed=structuredClone(transcript);resumed.observations=resumed.observations.slice(2);
 assert.equal((await verify(resumed)).unobserved_prefix_turns,2);assert.equal((await verify(resumed)).complete_rpc_coverage,false);
 const empty=structuredClone(transcript);empty.observations=[];assert.equal((await verify(empty)).observed_turns,0);
 for(const mutate of [t=>t.snapshot.hosts[1].score++,t=>t.observations[0].records.reverse(),t=>t.observations[0].receipt.version++,t=>t.observations[0].records[0].result='0x00',t=>t.host_transactions=true,t=>t.observations[1].receipt.command_id='a0',t=>t.observations[0].extra=true,t=>t.snapshot.config.plain=true]){const bad=structuredClone(transcript);mutate(bad);await assert.rejects(verify(bad));}
 await assert.rejects(verifyRpcHost(JSON.stringify(artifact),' '.repeat(524289)),/512/);
 assert.deepEqual(store.snapshot('ok').hosts.map(h=>h.score),[2,1]);
 store.create('failure',config);let broken=false;
 const failed=await connectRpcHost(store,'failure',binding,(...a)=>{if(broken)throw Error('synthetic timeout');return fake(...a);});broken=true;
 await assert.rejects(failed.act({id:'a',version:0,trigger:0}),/timeout/);assert.equal(store.snapshot('failure').version,0);
 store.create('mismatch',config);let wrong=false;
 const mismatch=await connectRpcHost(store,'mismatch',binding,(...a)=>wrong?'0x00':fake(...a));wrong=true;
 await assert.rejects(mismatch.act({id:'a',version:0,trigger:0}));assert.equal(store.snapshot('mismatch').version,0);
 store.create('race',config);let race=false;
 const competing=await connectRpcHost(store,'race',binding,async(...a)=>{if(race){race=false;store.act('race',{id:'other',version:0,trigger:1});}return fake(...a);});race=true;
 await assert.rejects(competing.act({id:'a',version:0,trigger:0}),/旧版本/);assert.equal(store.snapshot('race').version,1);assert.equal(store.snapshot('race').hosts[0].trace[0].trigger,1);
 store.create('plain',{...config,plain:true});await assert.rejects(connectRpcHost(store,'plain',binding,fake),/普通模式/);
 console.log('PASS synthetic RPC host: dual-host commit, transport/ABI failure no commit, competing writer preserved; not live RPC or chain transactions');
}finally{store.close();}
