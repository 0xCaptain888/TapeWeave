// Author-controlled wallet/RPC fixtures. No network, credentials or signing.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {webcrypto} from 'node:crypto';
import {WalletRun,HOST,CHAIN,STORAGE_KEY,OPENED,ACTED,quantity,okb,advance,validatePending,RUNTIME_SHA256} from './chain-wallet.mjs';
const evidence=JSON.parse(await readFile(new URL('mainnet-evidence.json',import.meta.url),'utf8'));
const ACCOUNT='0x'+'12'.repeat(20),OTHER='0x'+'34'.repeat(20);
const HASH='0x'+'aa'.repeat(32),BLOCK_HASH='0x'+'bb'.repeat(32);
const word=x=>BigInt(x).toString(16).padStart(64,'0'),hex=x=>'0x'+x.toString(16);
const raw=s=>'0x'+'0'.repeat(24)+s.player.slice(2)+[s.circuit,s.version,s.training.latch,s.training.score,s.training.resource,s.door.latch,s.door.score,s.door.resource].map(word).join('');
const zero=circuit=>({player:ACCOUNT,circuit,version:0,training:{latch:0,score:0,resource:0},door:{latch:0,score:0,resource:2}});
let passed=0;
function fixture(){
 const m=new Map(),storage={getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)};
 const f={chain:CHAIN,accounts:[ACCOUNT],now:1000,nonce:'0x0',price:'0x2',gas:'0x186a0',code:evidence.expected_runtime,
  accountCode:'0x',sendCount:0,methods:[],receipt:null,tx:null,state:zero(1),blockHash:BLOCK_HASH,simulation:undefined,
  walletError:null,walletHash:HASH,height:'0x11'};
 const provider={request:async({method,params})=>{
  if(method==='eth_chainId')return f.chain;
  if(['eth_accounts','eth_requestAccounts'].includes(method))return f.accounts;
  if(method==='eth_sendTransaction'){
   f.sendCount++;assert.ok(storage.getItem(STORAGE_KEY),'intent persisted before wallet');
   if(f.walletError)throw f.walletError;
   f.tx={...params[0],hash:HASH,input:params[0].data,blockHash:BLOCK_HASH,blockNumber:'0x10'};return f.walletHash;
  }
  throw Error('unexpected wallet method '+method);
 }};
 const rpc=async(method,params)=>{
  f.methods.push(method);
  switch(method){
   case 'eth_chainId':return CHAIN;
   case 'eth_blockNumber':return f.height;
   case 'eth_getBlockByNumber':return {number:params[0],hash:f.blockHash};
   case 'eth_getCode':return params[0].toLowerCase()===HOST.toLowerCase()?f.code:f.accountCode;
   case 'eth_call':return params[0].data.startsWith('0x83c4b7a3')?raw(f.state):
    f.simulation??(params[0].data.startsWith('0x56f6a897')?'0x'+word(3):'0x');
   case 'eth_estimateGas':return f.gas;
   case 'eth_gasPrice':return f.price;
   case 'eth_getTransactionCount':return f.nonce;
   case 'eth_getTransactionByHash':return f.tx;
   case 'eth_getTransactionReceipt':return f.receipt;
   default:throw Error('unexpected RPC '+method);
  }
 };
 const run=new WalletRun({rpc,storage,now:()=>f.now});
 f.run=run;f.storage=storage;f.provider=provider;
 f.prepare=async(options={operation:'open',circuit:1})=>{if(!run.account)await run.connect(provider);return run.prepare(options);};
 f.mine=(p,{status='0x1'}={})=>{
  const a=p.operation==='act'?advance(p.before,p.trigger):null;
  const id=p.operation==='act'?p.session:'3';f.state=a?.state??zero(p.circuit);
  f.receipt={transactionHash:HASH,from:ACCOUNT,to:HOST.toLowerCase(),blockHash:BLOCK_HASH,blockNumber:'0x10',
   status,gasUsed:'0x186a0',effectiveGasPrice:'0x2',logs:[{
    address:HOST,transactionHash:HASH,blockHash:BLOCK_HASH,blockNumber:'0x10',removed:false,logIndex:'0x0',
    topics:p.operation==='open'?[OPENED,'0x'+word(id),'0x'+'0'.repeat(24)+ACCOUNT.slice(2)]:[ACTED,'0x'+word(id)],
    data:'0x'+(p.operation==='open'?word(p.circuit):[p.version+1,Number(p.trigger),a.trainingRequest,a.doorRequest,a.doorEffect].map(word).join('')),
   }]};
 };
 return f;
}
async function test(name,fn){await fn();passed++;console.log('PASS '+name);}
await test('pinned complete runtime digest matches published deployment',async()=>{
 const bytes=Buffer.from(evidence.expected_runtime.slice(2),'hex');
 assert.equal(Buffer.from(await webcrypto.subtle.digest('SHA-256',bytes)).toString('hex'),RUNTIME_SHA256);
});
await test('strict quantities and exact OKB formatting',async()=>{
 for(const x of ['0x00','0x','1',-1,null,'0x'+'f'.repeat(65)])assert.throws(()=>quantity(x));
 assert.equal(okb('1'),'0.000000000000000001 OKB');assert.equal(okb('1000000000000000000'),'1 OKB');
});
await test('explicit preview, one send, receipt-bound open recovery',async()=>{
 const f=fixture(),p=await f.prepare();assert.equal(f.sendCount,0);assert.equal(p.tx.gas,'0x1d4c0');
 await f.run.send();assert.equal(f.sendCount,1);
 await assert.rejects(f.run.send(),/预览已过期/);
 assert.equal((await f.run.verify()).pending,true);
 f.mine(p);const v=await f.run.verify();assert.equal(v.session,'3');assert.equal(v.fee,'200000');assert.equal(f.run.pending(),null);
 assert.equal(f.methods.includes('eth_sendRawTransaction'),false);
});
await test('both cards four actions replay and verified state',async()=>{
 for(const circuit of [1,2]){
  const f=fixture();f.state=zero(circuit);await f.run.connect(f.provider);
  for(const trigger of [false,false,true,true]){
   const p=await f.prepare({operation:'act',circuit,session:'3',version:f.state.version,trigger});
   await f.run.send();f.mine(p);const v=await f.run.verify();assert.deepEqual(v.state,f.state);
   f.nonce=hex(BigInt(f.nonce)+1n);
  }
  assert.equal(f.state.version,4);assert.equal(f.state.training.score,circuit===1?2:1);assert.equal(f.state.door.score,circuit===1?1:0);
  await assert.rejects(f.prepare({operation:'act',circuit,session:'3',version:4,trigger:true}),/整数范围/);
 }
});
await test('wrong chain, missing accounts, smart accounts and runtime refused',async()=>{
 let f=fixture();f.chain='0x61';await assert.rejects(f.prepare(),/X Layer/);
 f=fixture();f.accounts=[];await assert.rejects(f.prepare(),/账户/);
 f=fixture();f.accountCode='0x00';await assert.rejects(f.prepare(),/AA/);
 f=fixture();f.code='0x00';await assert.rejects(f.prepare(),/代码/);
});
await test('expired preview and changed account cannot send',async()=>{
 let f=fixture();await f.prepare();f.now+=60001;await assert.rejects(f.run.send(),/过期/);assert.equal(f.sendCount,0);
 f=fixture();await f.prepare();f.accounts=[OTHER];await assert.rejects(f.run.send(),/改变/);assert.equal(f.sendCount,0);
});
await test('state and nonce races never regenerate or resend',async()=>{
 let f=fixture();await f.prepare({operation:'act',circuit:1,session:'3',version:0,trigger:false});f.state.version=1;
 await assert.rejects(f.run.send(),/会话已推进/);assert.equal(f.sendCount,0);
 f=fixture();await f.prepare();f.nonce='0x1';await assert.rejects(f.run.send(),/nonce/);assert.equal(f.sendCount,0);
});
await test('increased gas or price requires another preview',async()=>{
 let f=fixture();await f.prepare();f.gas='0xffffff';await assert.rejects(f.run.send(),/gas/);
 f=fixture();await f.prepare();f.price='0x3';await assert.rejects(f.run.send(),/费用/);
});
await test('explicit user rejection clears intent; other errors preserve unknown',async()=>{
 let f=fixture();await f.prepare();f.walletError={code:4001};await assert.rejects(f.run.send(),/取消签名/);assert.equal(f.run.pending(),null);
 f=fixture();await f.prepare();f.walletError={code:-32000};await assert.rejects(f.run.send(),/不明结果/);
 assert.equal(f.run.pending().phase,'unknown');await assert.rejects(f.prepare(),/待处理/);assert.equal(f.sendCount,1);
});
await test('malformed wallet hash preserves recovery and blocks duplicates',async()=>{
 const f=fixture();await f.prepare();f.walletHash='0xbroken';await assert.rejects(f.run.send(),/合法交易哈希/);
 assert.equal(f.run.pending().hash,null);await assert.rejects(f.prepare(),/待处理/);
 await f.run.recover(HASH);assert.equal(f.run.pending().hash,HASH);
});
await test('refresh retains pending intent and verifies without connected wallet',async()=>{
 const f=fixture(),p=await f.prepare();await f.run.send();f.mine(p);
 const refreshed=new WalletRun({rpc:f.run.rpc,storage:f.storage});
 assert.equal(refreshed.account,null);assert.equal((await refreshed.verify()).session,'3');
});
await test('bad recovery hash or foreign transaction cannot overwrite intent',async()=>{
 const f=fixture();await f.prepare();f.walletHash='bad';await assert.rejects(f.run.send());
 await assert.rejects(f.run.recover('0xdead'),/完整/);
 f.tx.from=OTHER;await assert.rejects(f.run.recover(HASH),/不符/);assert.equal(f.run.pending().hash,null);
});
await test('failed and unconfirmed receipts cannot advance visible session',async()=>{
 const f=fixture(),p=await f.prepare();await f.run.send();f.mine(p,{status:'0x0'});
 f.height='0x10';assert.equal((await f.run.verify()).confirming,true);assert.ok(f.run.pending());
 f.height='0x11';
 const result=await f.run.verify();assert.equal(result.failed,true);assert.equal(result.state,undefined);assert.equal(f.run.pending(),null);
});
await test('wrong receipt, runtime, event, state or canonical block retains intent',async()=>{
 for(const mutation of [
  f=>{f.receipt.transactionHash='0x'+'cc'.repeat(32);},
  f=>{f.code='0x00';},
  f=>{f.receipt.logs[0].data='0x'+word(2);},
  f=>{f.receipt.logs[0].removed=true;},
  f=>{f.receipt.logs[0].topics[2]='0x'+'0'.repeat(24)+OTHER.slice(2);},
  f=>{f.state=zero(2);},
  f=>{f.blockHash='0x'+'cc'.repeat(32);},
  f=>{f.tx.input='0x00';},
 ]){
  const f=fixture(),p=await f.prepare();await f.run.send();f.mine(p);mutation(f);
  await assert.rejects(f.run.verify());assert.ok(f.run.pending());assert.equal(f.sendCount,1);
 }
});
await test('storage failure and malformed local intent block wallet invocation',async()=>{
 let f=fixture();await f.prepare();f.storage.setItem=()=>{throw Error('denied');};await assert.rejects(f.run.send(),/denied/);assert.equal(f.sendCount,0);
 f=fixture();f.storage.setItem(STORAGE_KEY,'{"bad":1}');await f.run.connect(f.provider);await assert.rejects(f.prepare(),/损坏/);
 const p=await fixture().prepare();p.tx.value='0x1';assert.throws(()=>validatePending(p));
});
await test('context changes during asynchronous preview discard result',async()=>{
 const f=fixture();await f.run.connect(f.provider);const rpc=f.run.rpc;
 f.run.rpc=async(method,params)=>{if(method==='eth_estimateGas')f.run.invalidate();return rpc(method,params);};
 await assert.rejects(f.prepare(),/环境已改变/);assert.equal(f.run.preview,null);
});
await test('pending intent in another tab prevents send after preflight',async()=>{
 const f=fixture(),p=await f.prepare(),rpc=f.run.rpc;let reads=0;
 f.run.rpc=async(method,params)=>{if(method==='eth_getBlockByNumber'&&++reads===2)f.storage.setItem(STORAGE_KEY,JSON.stringify(p));return rpc(method,params);};
 await assert.rejects(f.run.send(),/另一页面/);assert.equal(f.sendCount,0);
});
console.log(`PASS ${passed} wallet scenarios; author fixtures, no real wallet or mainnet transaction`);
