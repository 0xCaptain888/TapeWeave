import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {NativeWalletRun,NATIVE_KEY,NATIVE_HISTORY_KEY,ENTRYPOINT,USER_OPERATION,BEFORE_EXECUTION,
 nativeCapabilities,nativeReceiptProof,validateNativeIntent,saveNativeResult,nativeHistory} from './native-wallet.mjs';
import {HOST,STORAGE_KEY,OPENED,ACTED,advance} from './chain-wallet.mjs';
const evidence=JSON.parse(await readFile(new URL('mainnet-evidence.json',import.meta.url),'utf8'));
const ACCOUNT='0x'+'12'.repeat(20),HASH='0x'+'ab'.repeat(32),BLOCK='0x'+'bb'.repeat(32),ID='0x'+'cd'.repeat(32);
const word=n=>BigInt(n).toString(16).padStart(64,'0'),hex=n=>'0x'+BigInt(n).toString(16);
const initial=()=>({player:ACCOUNT,circuit:1,version:0,training:{latch:0,score:0,resource:0},door:{latch:0,score:0,resource:2}});
const abi=s=>'0x'+'0'.repeat(24)+s.player.slice(2)+[s.circuit,s.version,s.training.latch,s.training.score,s.training.resource,s.door.latch,s.door.score,s.door.resource].map(word).join('');
function fixture(){
 const f={now:1000,account:ACCOUNT,chain:'0xc4',atomic:'supported',accountCode:'0x1234',stored:new Map(),calls:[],sends:0,
  rpcCalls:[],reject:false,unknown:false,wrongId:false,head:0x100n,s:initial(),receipt:null,tx:null,quota:false,batchStatus:200};
 const storage={getItem:k=>f.stored.get(k)??null,setItem:(k,v)=>{if(f.quota)throw Error('quota');f.stored.set(k,v);},removeItem:k=>f.stored.delete(k)};
 f.storage=storage;
 f.mined=(p)=>{
  const n=f.head+1n;
  let topics,data;
  if(p.operation==='open'){
   f.s={...initial(),circuit:p.circuit};topics=[OPENED,'0x'+word(3),'0x'+'0'.repeat(24)+ACCOUNT.slice(2)];data='0x'+word(p.circuit);
  }else{
   const a=advance(p.before,p.trigger);f.s=a.state;topics=[ACTED,'0x'+word(3)];
   data='0x'+[p.version+1,Number(p.trigger),a.trainingRequest,a.doorRequest,a.doorEffect].map(word).join('');
  }
  const base={transactionHash:HASH,blockNumber:hex(n),blockHash:BLOCK,removed:false};
  f.receipt={...base,to:ENTRYPOINT,status:'0x1',gasUsed:'0x100',effectiveGasPrice:'0x2',logs:[
   {...base,address:ENTRYPOINT,logIndex:'0x1',topics:[BEFORE_EXECUTION],data:'0x'},
   {...base,address:HOST,logIndex:'0x2',topics,data},
   {...base,address:ENTRYPOINT,logIndex:'0x3',topics:[USER_OPERATION,ID,'0x'+'0'.repeat(24)+ACCOUNT.slice(2),'0x'+word(0)],
    data:'0x'+[0,1,32,16].map(word).join('')},
  ]};
  f.tx={hash:HASH,to:ENTRYPOINT,chainId:'0xc4',blockHash:BLOCK,blockNumber:hex(n)};f.head=n+1n;
 };
 f.provider={request:async({method,params})=>{
  f.calls.push({method,params});
  if(method==='eth_requestAccounts'||method==='eth_accounts')return [f.account];
  if(method==='eth_chainId')return f.chain;
  if(method==='wallet_getCapabilities')return {'0xc4':{atomic:{status:f.atomic}}};
  if(method==='wallet_sendCalls'){
   f.sends++;assert.ok(f.stored.has(NATIVE_KEY),'intent saved before wallet dispatch');
   assert.deepEqual(params[0],{version:'2.0.0',id:ID,from:ACCOUNT,chainId:'0xc4',atomicRequired:true,calls:[f.run.pending().call]});
   if(f.reject)throw {code:4001};if(f.unknown)throw Error('unknown');
   f.mined(f.run.pending());return {id:f.wrongId?'0xother':ID};
  }
  if(method==='wallet_getCallsStatus')return {id:ID,version:'2.0.0',chainId:'0xc4',atomic:true,status:f.batchStatus,
   receipts:f.receipt?[{transactionHash:HASH}]:[]};
  throw Error('unexpected wallet method '+method);
 }};
 f.rpc=async(method,params)=>{
  f.rpcCalls.push({method,params});
  switch(method){
   case 'eth_chainId':return '0xc4';
   case 'eth_blockNumber':return hex(f.head);
   case 'eth_getBlockByNumber':return {number:params[0],hash:BLOCK};
   case 'eth_getCode':return params[0].toLowerCase()===HOST.toLowerCase()?evidence.expected_runtime:f.accountCode;
   case 'eth_call':return params[0].data.startsWith('0x83c4b7a3')?abi(f.s):params[0].data.startsWith('0x56f6a897')?'0x'+word(3):'0x';
   case 'eth_getTransactionReceipt':return f.receipt;
   case 'eth_getTransactionByHash':return f.tx;
   default:throw Error('unexpected rpc '+method);
  }
 };
 f.run=new NativeWalletRun({rpc:f.rpc,storage,now:()=>f.now,id:()=>ID,onVerified:async(p,r)=>saveNativeResult(storage,p,r)});
 f.connect=()=>f.run.connect(f.provider);
 f.prepare=()=>f.run.prepare({operation:'open',circuit:1});
 f.send=async()=>{await f.connect();await f.prepare();await f.run.send();};
 return f;
}
let count=0;async function test(name,fn){await fn();count++;console.log('PASS '+name);}
await test('capability gate: supported only, global fallback, no automatic upgrade',async()=>{
 assert.equal(nativeCapabilities({'0xc4':{atomic:{status:'supported'}}}).atomic,'supported');
 assert.equal(nativeCapabilities({'0x0':{atomic:{status:'supported'}}}).atomic,'supported');
 for(const v of [{},{'0xc4':{atomic:{status:'ready'}}},{'0xc4':{atomic:{status:'unsupported'}}},
  {'0x0':{atomic:{status:'supported'}},'0xc4':{atomic:{status:'unsupported'}}}])assert.throws(()=>nativeCapabilities(v));
});
await test('explicit preview and one native dispatch, request ID persisted before invocation',async()=>{
 const f=fixture();await f.connect();await f.prepare();
 assert.equal(f.sends,0);assert.equal(f.run.pending(),null);
 await f.run.send();assert.equal(f.sends,1);assert.equal(f.run.pending().id,ID);
 await assert.rejects(f.prepare(),/不能重复/);
 assert.ok(!f.calls.some(c=>c.method==='eth_sendTransaction'));
});
await test('wallet result is only a hint; public UOP, canonical block and state verified before journal',async()=>{
 const f=fixture();await f.send();const bound=await f.run.lookup();assert.equal(bound.hash,HASH);
 const result=await f.run.verify();assert.equal(result.userOperationHash,ID);assert.equal(result.fee,'32');
 assert.equal(result.outerFee,'512');assert.equal(result.signatureRevalidated,false);assert.equal(result.session,'3');
 assert.equal(f.run.pending(),null);assert.equal(nativeHistory(f.storage).length,1);
});
await test('refresh without wallet can verify already-bound hash and persist result',async()=>{
 const f=fixture();await f.send();await f.run.recover(HASH);
 const restored=new NativeWalletRun({rpc:f.rpc,storage:f.storage,onVerified:async(p,r)=>saveNativeResult(f.storage,p,r)});
 assert.equal(restored.account,null);assert.equal((await restored.verify()).session,'3');
});
await test('four distinct version-bound actions recompute correct event and final state',async()=>{
 const f=fixture();await f.connect();f.s=initial();
 for(const t of [false,false,true,true]){
  const p=await f.run.prepare({operation:'act',circuit:1,session:'3',version:f.s.version,trigger:t});
  f.mined(p);const proof=nativeReceiptProof(p,f.receipt,f.tx,hex(f.head),f.s);
  assert.equal(proof.state.version,p.version+1);
 }
 assert.equal(f.s.training.score,2);assert.equal(f.s.door.score,1);assert.equal(f.s.door.resource,1);
});
await test('ready, missing support, EOA and delegation stop without sending',async()=>{
 for(const mutate of [f=>f.atomic='ready',f=>f.atomic='unsupported',f=>f.accountCode='0x',f=>f.accountCode='0xef0100'+'11'.repeat(20),f=>f.accountCode='0xEF0100'+'11'.repeat(20)]){
  const f=fixture();mutate(f);await f.connect();await assert.rejects(f.prepare());assert.equal(f.sends,0);
 }
});
await test('expired preview, changed account, version and EOA pending prevent dispatch',async()=>{
 for(const mutate of [f=>f.now=62000,f=>f.account='0x'+'34'.repeat(20),f=>f.stored.set(STORAGE_KEY,'pending')]){
  const f=fixture();await f.connect();await f.prepare();mutate(f);await assert.rejects(f.run.send());assert.equal(f.sends,0);
 }
 const f=fixture();await f.connect();
 await f.run.prepare({operation:'act',circuit:1,session:'3',version:0,trigger:false});
 f.s=advance(f.s,false).state;await assert.rejects(f.run.send(),/改变/);assert.equal(f.sends,0);
});
await test('rejection clears intent, other failures retain unknown and never fall back',async()=>{
 const reject=fixture();reject.reject=true;await reject.connect();await reject.prepare();
 await assert.rejects(reject.run.send(),/拒绝/);assert.equal(reject.run.pending(),null);
 for(const mutate of [f=>f.unknown=true,f=>f.wrongId=true]){
  const f=fixture();mutate(f);await f.connect();await f.prepare();await assert.rejects(f.run.send());
  assert.equal(f.run.pending().phase,'unknown');await assert.rejects(f.prepare());assert.equal(f.sends,1);
 }
});
await test('status pending, failure, wrong id, forged receipt never clear original',async()=>{
 for(const status of [100,400,500,600]){
  const f=fixture();await f.send();f.batchStatus=status;
  if(status===100)assert.equal((await f.run.lookup()).pending,true);else await assert.rejects(f.run.lookup());
  assert.ok(f.run.pending());assert.equal(f.sends,1);
 }
 const f=fixture();await f.send();f.receipt.logs[1].topics[2]='0x'+'0'.repeat(24)+'34'.repeat(20);
 await assert.rejects(f.run.lookup());assert.equal(f.run.pending().hash,null);
});
await test('wrong sender, UOP failure, interval, duplicate or altered event rejected',async()=>{
 for(const mutate of [
  r=>r.logs[2].topics[2]='0x'+'0'.repeat(24)+'34'.repeat(20),
  r=>r.logs[2].data='0x'+[0,0,32,16].map(word).join(''),
  r=>r.logs[0].logIndex='0x4',r=>r.logs.push(structuredClone(r.logs[1])),
  r=>r.logs[1].data='0x'+word(2),r=>r.logs[1].removed=true,
  r=>r.logs[2].blockHash='0x'+'ff'.repeat(32),r=>r.logs[2].address='0x'+'34'.repeat(20),
 ]){
  const f=fixture();await f.send();mutate(f.receipt);
  await assert.rejects(f.run.recover(HASH));assert.equal(f.run.pending().hash,null);
 }
});
await test('pre-existing transaction and changed EntryPoint cannot be claimed',async()=>{
 const f=fixture();await f.send();const p=f.run.pending();p.block=f.receipt.blockNumber;
 assert.throws(()=>nativeReceiptProof(p,f.receipt,f.tx,hex(f.head),f.s),/边界/);
 f.tx.to='0x'+'34'.repeat(20);await assert.rejects(f.run.recover(HASH));
});
await test('quota and journal failure preserve recovery; strict export refuses extra secret fields',async()=>{
 const f=fixture();await f.connect();await f.prepare();f.quota=true;
 await assert.rejects(f.run.send(),/quota/);assert.equal(f.sends,0);
 const g=fixture();await g.send();await g.run.recover(HASH);g.quota=true;
 await assert.rejects(g.run.verify(),/quota/);assert.ok(g.run.pending().hash);
 g.quota=false;await g.run.verify();const entries=nativeHistory(g.storage);
 entries[0].intent.secret='not-a-key';g.stored.set(NATIVE_HISTORY_KEY,JSON.stringify(entries));
 assert.throws(()=>nativeHistory(g.storage),/字段/);
 const p=structuredClone(entries[0].intent);assert.throws(()=>validateNativeIntent(p));
});
console.log(`PASS ${count} native wallet scenarios; fixture provider/RPC, no actual plugin signature or hardware evidence`);
