import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {crossCheckSession,CROSSCHECK_ENDPOINTS} from './chain-crosscheck.mjs';
import {HOST} from './chain-wallet.mjs';
const evidence=JSON.parse(await readFile(new URL('mainnet-evidence.json',import.meta.url),'utf8'));
const word=n=>BigInt(n).toString(16).padStart(64,'0'),HASH='0x'+'aa'.repeat(32),OTHER='0x'+'bb'.repeat(32);
function fixture(){
 const f={calls:[],heads:['0x46c980a','0x46c980c'],networks:['0xc4','0xc4'],
  hashes:[HASH,HASH],codes:[evidence.expected_runtime,evidence.expected_runtime],
  sessions:evidence.proof.sessions.map(s=>s.final_state),reorg:false,broken:false};
 f.rpc=async(endpoint,method,params)=>{
  const i=CROSSCHECK_ENDPOINTS.indexOf(endpoint);assert.ok(i>=0);f.calls.push({endpoint,method,params});
  if(f.broken&&i===1)throw Error('fixture timeout');
  switch(method){
   case 'eth_chainId':return f.networks[i];
   case 'eth_blockNumber':return f.heads[i];
   case 'eth_getBlockByNumber':return {number:params[0],hash:f.reorg&&f.calls.filter(x=>x.endpoint===endpoint&&x.method===method).length>1?OTHER:f.hashes[i]};
   case 'eth_getCode':assert.deepEqual(params,[HOST,'0x46c9808']);return f.codes[i];
   case 'eth_call':{
    assert.equal(params[1],'0x46c9808');const s=f.sessions[f.different&&i===1?1:0];
    return '0x'+'0'.repeat(24)+s.player.slice(2)+[s.circuit,s.version,s.training.latch,s.training.score,s.training.resource,s.door.latch,s.door.score,s.door.resource].map(word).join('');
   }
   default:throw Error('unexpected method '+method);
  }
 };
 f.read=()=>crossCheckSession(f.rpc,{host:HOST,session:'1'});return f;
}
let count=0;async function test(name,fn){await fn();count++;console.log('PASS '+name);}
await test('both endpoints use lower head minus two, identical block and pinned runtime',async()=>{
 const f=fixture(),r=await f.read();
 assert.equal(r.provider_agreement,true);assert.equal(r.independent_providers,false);assert.equal(r.finality_proven,false);
 assert.equal(r.block,'0x46c9808');assert.deepEqual(r.snapshot,evidence.proof.sessions[0].final_state);
 assert.equal(f.calls.length,12);
 assert.deepEqual(new Set(f.calls.map(c=>c.method)),new Set(['eth_chainId','eth_blockNumber','eth_getBlockByNumber','eth_getCode','eth_call']));
});
await test('same numeric chain and case-insensitive byte values agree',async()=>{
 const f=fixture();f.networks[1]='0xC4';f.hashes[1]=HASH.toUpperCase().replace('0X','0x');
 f.codes[1]=evidence.expected_runtime.toUpperCase().replace('0X','0x');assert.equal((await f.read()).provider_agreement,true);
});
await test('wrong chain, bad or stale heads stop before state reads',async()=>{
 for(const mutate of [f=>f.networks[1]='0x61',f=>f.heads[1]='0x046c980c',f=>f.heads[1]='0x1',
  f=>f.heads[1]='0x46c9900']){
  const f=fixture();mutate(f);await assert.rejects(f.read());assert.ok(!f.calls.some(c=>c.method==='eth_call'));
 }
});
await test('same state on a different block hash cannot pass',async()=>{
 const f=fixture();f.hashes[1]=OTHER;await assert.rejects(f.read(),/哈希不一致/);
});
await test('wrong or absent runtime cannot pass even if both states match',async()=>{
 for(const code of ['0x','0x00',evidence.expected_runtime.slice(0,-2)+'00']){
  const f=fixture();f.codes[1]=code;await assert.rejects(f.read(),/代码/);
 }
});
await test('different valid states are rejected',async()=>{
 const f=fixture();f.different=true;await assert.rejects(f.read(),/状态不一致/);
});
await test('reorg after reading and unavailable endpoint never return agreement',async()=>{
 const f=fixture();f.reorg=true;await assert.rejects(f.read(),/区块发生变化/);
 const down=fixture();down.broken=true;await assert.rejects(down.read(),/timeout/);
});
await test('malformed block or ABI is rejected and foreign host sends no requests',async()=>{
 for(const method of ['eth_getBlockByNumber','eth_call']){
  const f=fixture(),read=f.rpc;f.rpc=(endpoint,m,params)=>m===method?null:read(endpoint,m,params);
  await assert.rejects(f.read());
 }
 const f=fixture();
 await assert.rejects(crossCheckSession(f.rpc,{host:'0x'+'12'.repeat(20),session:'1'}),/固定宿主/);
 await assert.rejects(crossCheckSession(f.rpc,{host:HOST,session:'0'}));
 assert.equal(f.calls.length,0);
});
console.log(`PASS ${count} two-endpoint readonly scenarios; fixtures only, no independent-provider or finality proof`);
