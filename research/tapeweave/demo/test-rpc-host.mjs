import assert from 'node:assert/strict';
import {openStore} from './durable-host.mjs';
import {connectRpcHost} from './rpc-host.mjs';
import {createArtifact} from './creator-package.mjs';
import {presets} from './creator.mjs';
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
 for(let i=0;i<4;i++){const r=await host.act({id:'a'+i,version:i,trigger:Number('0011'[i])});assert.equal(r.records.length,4);assert.equal(r.host_transactions,false);}
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
