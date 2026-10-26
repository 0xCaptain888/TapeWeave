import assert from 'node:assert/strict';
import {WalletHistory,HISTORY_KEY,MAX_HISTORY_BYTES,DEPLOYMENT_BLOCK,validateHistory,discoverOpened} from './chain-history.mjs';
import {HOST,CHAIN,OPENED} from './chain-wallet.mjs';
import {plan} from './chain-host.mjs';
const ACCOUNT='0x'+'12'.repeat(20),OTHER='0x'+'34'.repeat(20),HASH='0x'+'aa'.repeat(32),BLOCK='0x'+'bb'.repeat(32);
const word=x=>BigInt(x).toString(16).padStart(64,'0'),hex=x=>'0x'+BigInt(x).toString(16);
const clone=x=>structuredClone(x),initial=(owner=ACCOUNT,circuit=1)=>({player:owner,circuit,version:0,
 training:{latch:0,score:0,resource:0},door:{latch:0,score:0,resource:2}});
function record(owner=ACCOUNT,hash=HASH,id='3'){
 const draft=plan({host:HOST,operation:'open',circuit:'1'});
 return {intent:{format:'tapeweave-wallet-intent-v1',chain:CHAIN,host:HOST,account:owner,
  operation:'open',circuit:1,session:null,version:null,trigger:null,before:null,created:1000,expires:61000,
  phase:'submitted',hash,tx:{from:owner,to:draft.to,value:'0x0',data:draft.data,chainId:CHAIN,gas:'0x186a0',gasPrice:'0x2',nonce:'0x0'}},
  result:{hash,session:id,state:initial(owner),fee:'200000',block:hex(DEPLOYMENT_BLOCK+1n),blockHash:BLOCK,
   logIndex:'0x0',laterActionsInBlock:false},observedAt:2000};
}
const archive=entries=>({format:'tapeweave-wallet-history-v1',chain:196,host:HOST,entries,discovered:[]});
function storage(){
 const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)};
}
let count=0;
async function test(name,fn){await fn();count++;console.log('PASS '+name);}
await test('journal persists receipts, restores after refresh, isolates accounts',async()=>{
 const s=storage(),h=new WalletHistory(s,{now:()=>2000}),e=record();h.record(e.intent,e.result);
 const restored=new WalletHistory(s);
 assert.equal(restored.sessions(ACCOUNT)[0].session,'3');assert.equal(restored.entries(ACCOUNT).length,1);
 assert.equal(restored.sessions(OTHER).length,0);
 const foreign=record(OTHER,'0x'+'cc'.repeat(32),'4');h.record(foreign.intent,foreign.result);
 assert.deepEqual(h.sessions(OTHER).map(x=>x.session),['4']);
 assert.equal(h.entries(ACCOUNT).length,1);
});
await test('idempotent re-verification and backup merge, no overwrite on conflicts',async()=>{
 const h=new WalletHistory(storage(),{now:()=>4000}),e=record();h.record(e.intent,e.result);
 h.record(e.intent,e.result);h.import(h.export());assert.equal(h.entries(ACCOUNT).length,1);
 const reorder=v=>Array.isArray(v)?v.map(reorder):v&&typeof v==='object'?
  Object.fromEntries(Object.keys(v).reverse().map(k=>[k,reorder(v[k])])):v;
 h.import(JSON.stringify(reorder(JSON.parse(h.export())),null,2));
 assert.equal(h.entries(ACCOUNT).length,1,'JSON field order does not create a false conflict');
 const before=h.export(),bad=record();bad.result.fee='3';
 assert.throws(()=>h.import(JSON.stringify(archive([bad]))),/冲突/);assert.equal(h.export(),before);
});
await test('reverted receipts remain visible without inventing a session',async()=>{
 const e=record();e.result={hash:HASH,failed:true,fee:'0',block:hex(DEPLOYMENT_BLOCK),blockHash:BLOCK};
 const h=new WalletHistory(storage());h.record(e.intent,e.result);
 assert.equal(h.sessions(ACCOUNT).length,0);assert.equal(h.entries(ACCOUNT)[0].result.failed,true);
});
await test('discovery caches session references separately from checked receipts',async()=>{
 const h=new WalletHistory(storage()),o={account:ACCOUNT,session:'3',circuit:1,hash:HASH,block:hex(DEPLOYMENT_BLOCK),blockHash:BLOCK,logIndex:'0x0'};
 h.remember([o]);h.remember([o]);assert.equal(h.entries(ACCOUNT).length,0);assert.equal(h.sessions(ACCOUNT)[0].version,null);
 const e=record();h.record(e.intent,e.result);assert.equal(h.sessions(ACCOUNT).length,1);assert.equal(h.sessions(ACCOUNT)[0].version,0);
});
await test('corrupt, oversized, wrong-chain and secret-bearing archives never write',async()=>{
 const h=new WalletHistory(storage()),e=record();h.record(e.intent,e.result);const before=h.export();
 const broken=[];
 for(const mutate of [
  a=>{a.chain=97;},a=>{a.host=OTHER;},a=>{a.extra='secret';},
  a=>{a.entries[0].intent.privateKey='not-a-key';},a=>{a.entries[0].intent.tx.secret='not-a-key';},
  a=>{a.entries[0].result.state.player=OTHER;},a=>{a.entries[0].result.state.training.latch=2;},
  a=>{a.entries[0].result.hash='bad';},a=>{a.entries[0].result.state.version=5;},
  a=>{a.entries.push(clone(a.entries[0]));},a=>{a.entries[0].intent.before={secret:'no'};},
 ]){
  const a=archive([record()]);mutate(a);broken.push(JSON.stringify(a));
 }
 broken.push('not json',' '.repeat(MAX_HISTORY_BYTES+1));
 for(const text of broken){assert.throws(()=>h.import(text));assert.equal(h.export(),before);}
});
await test('write failures preserve old cache and do not silently drop entries at limits',async()=>{
 const s=storage(),h=new WalletHistory(s),e=record();h.record(e.intent,e.result);
 const before=h.export();s.setItem=()=>{throw Error('quota');};
 assert.throws(()=>h.import(before),/quota/);assert.equal(h.export(),before);
 const tooMany=archive(Array.from({length:501},()=>record()));assert.throws(()=>validateHistory(tooMany),/数量超限/);
 const large=archive(Array.from({length:500},(_,i)=>record(ACCOUNT,'0x'+word(i+1),String(i+1))));
 const roomy=new WalletHistory(storage());roomy.import(JSON.stringify(large));
 const text=roomy.export();assert.ok(new TextEncoder().encode(text).length<=MAX_HISTORY_BYTES);
 const fresh=new WalletHistory(storage());fresh.import(text);
 assert.equal(fresh.entries(ACCOUNT).length,500,'capacity-size export round trips without pretty-print overflow');
});
function scanFixture(){
 const from=DEPLOYMENT_BLOCK,height=from+3000n,blockHash=BLOCK;
 const f={logs:[{address:HOST,removed:false,topics:[OPENED,'0x'+word(3),'0x'+'0'.repeat(24)+ACCOUNT.slice(2)],
  data:'0x'+word(1),transactionHash:HASH,blockNumber:hex(from+5n),blockHash,logIndex:'0x0'}],queries:[],changed:false};
 f.run={
  head:async()=>({number:hex(height),hash:blockHash}),
  block:async n=>({number:n,hash:blockHash}),
  sameBlock:async()=>{if(f.changed)throw Error('reorg');},
  rpc:async(method,params)=>{f.queries.push({method,params});return f.logs;},
 };
 f.options={account:ACCOUNT,from:from.toString()};
 return f;
}
await test('bounded account-filtered discovery advances one explicit page',async()=>{
 const f=scanFixture(),r=await discoverOpened(f.run,f.options);
 assert.equal(r.observations[0].session,'3');assert.equal(r.next,(DEPLOYMENT_BLOCK+100n).toString());
 assert.equal(r.completeFromDeployment,false);assert.equal(f.queries.length,1);
 const filter=f.queries[0].params[0];assert.equal(filter.address,HOST);
 assert.deepEqual(filter.topics,[OPENED,null,'0x'+'0'.repeat(24)+ACCOUNT.slice(2)]);
 assert.equal(filter.fromBlock,hex(DEPLOYMENT_BLOCK));assert.equal(filter.toBlock,hex(DEPLOYMENT_BLOCK+99n));
});
await test('empty last-page discovery never claims a partial scan is exhaustive',async()=>{
 const f=scanFixture();f.logs=[];
 const r=await discoverOpened(f.run,{account:ACCOUNT,from:(DEPLOYMENT_BLOCK+3000n).toString()});
 assert.equal(r.next,null);assert.equal(r.completeFromDeployment,false);assert.equal(r.observations.length,0);
});
await test('malformed, foreign, duplicate, out-of-range or noncanonical logs rejected',async()=>{
 for(const mutate of [
  f=>{f.logs[0].address=OTHER;},f=>{f.logs[0].removed=true;},
  f=>{f.logs[0].topics[2]='0x'+'0'.repeat(24)+OTHER.slice(2);},
  f=>{f.logs[0].blockHash='0x'+'cc'.repeat(32);},f=>{f.logs[0].topics[1]='0x'+word(0);},
  f=>{f.logs[0].data='0x'+word(3);},f=>{f.logs[0].blockNumber=hex(DEPLOYMENT_BLOCK+100n);},
  f=>{f.logs.push(clone(f.logs[0]));},f=>{f.logs=Array.from({length:101},()=>clone(f.logs[0]));},
  f=>{f.changed=true;},
 ]){
  const f=scanFixture();mutate(f);await assert.rejects(discoverOpened(f.run,f.options));
 }
 const f=scanFixture();
 for(const options of [{...f.options,from:'0'},{...f.options,span:101},{...f.options,from:'1e10'}])await assert.rejects(discoverOpened(f.run,options));
});
console.log(`PASS ${count} wallet history/discovery scenarios; local cache and synthetic RPC, no signature or chain writes`);
