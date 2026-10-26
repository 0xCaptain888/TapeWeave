// EIP-1193 injected EOA flow. No private keys, AA signing, automatic sends or retries.
import {address,plan,sessionCall,decodeSession} from './chain-host.mjs';
export const HOST='0x440c3CC7DdD50566126754199Df7336499eE1E20';
export const CHAIN='0xc4';
// SHA-256 of the complete deployed runtime, including immutable configuration.
export const RUNTIME_SHA256='09f04536c2bac036e7d988dc458b066a6e7bef90db41ad1a8e4d2ab925abdd83';
export const STORAGE_KEY='tapeweave-wallet-pending-v1';
export const OPENED='0xcd79ecb8b02601f8233f68f1879a20f66616a11140945180a66d50282bf40726';
export const ACTED='0xb26d4ded5191059a26c7d19c74bac9188c71df7ea0c5cf9e0c6359b0b2be7476';
const HASH=/^0x[0-9a-fA-F]{64}$/,HEX=/^0x(?:[0-9a-fA-F]{2})+$/;
export function quantity(x){
 if(typeof x!=='string'||!/^0x(?:0|[1-9a-fA-F][0-9a-fA-F]*)$/.test(x)||x.length>66)throw Error('RPC 数量格式错误');
 return BigInt(x);
}
const hex=x=>'0x'+x.toString(16),word=x=>BigInt(x).toString(16).padStart(64,'0');
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
export function okb(value){
 const n=BigInt(value),s=(n%10n**18n).toString().padStart(18,'0').replace(/0+$/,'');
 return (n/10n**18n).toString()+(s?'.'+s:'')+' OKB';
}
export function advance(s,trigger){
 const t=Number(trigger),recharge=Number(s.version===0||s.version===2);
 const step=old=>s.circuit===1?{latch:recharge|(old&(1-t)),request:old&t}:{latch:old^t,request:(1-old)&t};
 const a=step(s.training.latch),b=step(s.door.latch),effect=Number(b.request===1&&s.version%2===1&&s.door.resource>0);
 return {state:{...s,version:s.version+1,training:{latch:a.latch,score:s.training.score+a.request,resource:s.training.resource+a.request},
  door:{latch:b.latch,score:s.door.score+effect,resource:s.door.resource-effect}},
  trainingRequest:a.request,doorRequest:b.request,doorEffect:effect};
}
export function validatePending(p){
 if(p?.format!=='tapeweave-wallet-intent-v1'||p.chain!==CHAIN||p.host!==HOST||
  !['awaiting-wallet','unknown','submitted'].includes(p.phase)||!Number.isSafeInteger(p.created)||
  !Number.isSafeInteger(p.expires)||p.expires<p.created)throw Error('本机待处理记录损坏；请保留备份并检查交易，不能直接重发');
 address(p.account);
 if(p.hash!==null&&!HASH.test(p.hash))throw Error('待处理交易哈希格式错误');
 if(p.operation!=='open'&&p.operation!=='act')throw Error('待处理操作错误');
 if(![1,2].includes(p.circuit))throw Error('待处理卡片错误');
 const expected=plan({host:HOST,circuit:String(p.circuit),session:p.session,version:String(p.version),trigger:p.trigger,operation:p.operation});
 if(p.tx?.from!==p.account||p.tx.to!==HOST.toLowerCase()||p.tx.data!==expected.data||
  p.tx.value!=='0x0'||p.tx.chainId!==CHAIN)throw Error('待处理调用不符');
 for(const key of ['gas','gasPrice','nonce'])quantity(p.tx[key]);
 if(quantity(p.tx.gas)===0n)throw Error('待处理 gas 错误');
 if(p.operation==='act'){
  if(!p.before||p.before.player!==p.account||p.before.circuit!==p.circuit||p.before.version!==p.version)throw Error('待处理会话不符');
  const s=p.before;
  if(!equal(decodeSession('0x'+'0'.repeat(24)+s.player.slice(2)+[s.circuit,s.version,s.training.latch,s.training.score,s.training.resource,s.door.latch,s.door.score,s.door.resource].map(word).join('')),s))throw Error('待处理会话损坏');
 }
 return p;
}
export class WalletRun{
 constructor({rpc,storage,now=()=>Date.now(),onVerified=async()=>{},digest=async code=>{
  const bytes=Uint8Array.from(code.slice(2).match(/../g),x=>parseInt(x,16));
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),x=>x.toString(16).padStart(2,'0')).join('');
 }}){
  this.rpc=rpc;this.storage=storage;this.now=now;this.digest=digest;this.onVerified=onVerified;
  this.provider=null;this.account=null;this.epoch=0;this.preview=null;this.busy=false;this.onchange=()=>{};
 }
 invalidate(){this.epoch++;this.preview=null;this.onchange();}
 disconnect(){this.provider=null;this.account=null;this.invalidate();}
 async connect(provider){
  this.disconnect();
  if(!provider||typeof provider.request!=='function')throw Error('没有可用的钱包接口');
  const accounts=await provider.request({method:'eth_requestAccounts'});
  if(!Array.isArray(accounts)||!accounts.length)throw Error('钱包没有返回账户');
  this.provider=provider;this.account=address(accounts[0]);
  try{await this.context();}catch(e){this.disconnect();throw e;}
  this.invalidate();return this.account;
 }
 async context(){
  const provider=this.provider,account=this.account,epoch=this.epoch;
  if(!provider||!account)throw Error('请先连接钱包');
  const chain=await provider.request({method:'eth_chainId'});
  if(quantity(chain)!==196n)throw Error('请切换至 X Layer（196），然后重新连接');
  const accounts=await provider.request({method:'eth_accounts'});
  if(!Array.isArray(accounts)||address(accounts[0])!==account||provider!==this.provider||epoch!==this.epoch)throw Error('钱包账户或网络已改变，请重新连接并预览');
  return {provider,account,epoch};
 }
 assertContext(c){if(c.epoch!==this.epoch||c.provider!==this.provider||c.account!==this.account)throw Error('钱包环境已改变，请重新预览');}
 pending(){
  const raw=this.storage.getItem(STORAGE_KEY);
  if(raw===null)return null;
  if(raw.length>16384)throw Error('本机待处理记录过大');
  return validatePending(JSON.parse(raw));
 }
 store(p){
  const raw=JSON.stringify(validatePending(p));this.storage.setItem(STORAGE_KEY,raw);
  if(this.storage.getItem(STORAGE_KEY)!==raw)throw Error('待处理记录保存失败；不能发送');
 }
 async block(tag){
  const b=await this.rpc('eth_getBlockByNumber',[tag,false]);
  if(!b||!HASH.test(b.hash)||quantity(b.number)!==quantity(tag))throw Error('RPC 区块格式错误');
  return b;
 }
 async sameBlock(b){if((await this.block(b.number)).hash.toLowerCase()!==b.hash.toLowerCase())throw Error('区块发生变化，请重新核验');}
 async codeAt(tag){
  const code=await this.rpc('eth_getCode',[HOST,tag]);
  if(typeof code!=='string'||!HEX.test(code)||await this.digest(code)!==RUNTIME_SHA256)throw Error('主网宿主代码与已审查版本不符');
 }
 async head(){
  if(quantity(await this.rpc('eth_chainId',[]))!==196n)throw Error('公共 RPC 网络错误');
  const b=await this.block(await this.rpc('eth_blockNumber',[]));await this.codeAt(b.number);return b;
 }
 async session(id,account=this.account){
  const b=await this.head(),s=decodeSession(await this.rpc('eth_call',[{to:HOST,data:sessionCall(id)},b.number]));
  if(account&&s.player!==account)throw Error('这局属于另一个账户');
  await this.sameBlock(b);return s;
 }
 async prepare({operation,circuit,session,version,trigger}){
  this.preview=null;
  if(this.busy||this.pending())throw Error('先核验待处理交易；不能重复发送');
  const c=await this.context(),b=await this.head();
  // Injected smart accounts need a separate, explicit UserOperation flow.
  const accountCode=await this.rpc('eth_getCode',[c.account,b.number]);
  if(accountCode!=='0x')throw Error('当前入口仅支持普通插件账户；AA／委托账户请使用已有官方钱包工具');
  const draft=plan({host:HOST,circuit:String(circuit),session,version:String(version),trigger,operation});
  let before=null;
  if(operation==='act'){
   before=decodeSession(await this.rpc('eth_call',[{to:HOST,data:sessionCall(session)},b.number]));
   if(before.player!==c.account||before.circuit!==circuit||before.version!==version)throw Error('会话账户、卡片或版本已改变；请读取当前会话');
  }
  const tx={from:c.account,to:draft.to,value:'0x0',data:draft.data};
  const result=await this.rpc('eth_call',[tx,b.number]);
  if(operation==='open'){
   if(typeof result!=='string'||!/^0x[0-9a-fA-F]{64}$/.test(result)||BigInt(result)===0n)throw Error('开局模拟返回值错误');
  }else if(result!=='0x')throw Error('动作模拟返回值错误');
  const gas=quantity(await this.rpc('eth_estimateGas',[tx])),price=quantity(await this.rpc('eth_gasPrice',[]));
  if(gas===0n||gas>10000000n)throw Error('gas 估算超出宿主范围');
  const nonce=quantity(await this.rpc('eth_getTransactionCount',[c.account,'pending']));
  if(nonce!==quantity(await this.rpc('eth_getTransactionCount',[c.account,'latest'])))throw Error('钱包还有未完成交易，请先处理');
  const feeGas=(gas*120n+99n)/100n;
  await this.sameBlock(b);this.assertContext(c);
  const p={format:'tapeweave-wallet-intent-v1',chain:CHAIN,host:HOST,account:c.account,
   operation,circuit,session:operation==='act'?session:null,version:operation==='act'?version:null,
   trigger:operation==='act'?trigger:null,before,
   created:this.now(),expires:this.now()+60000,phase:'awaiting-wallet',hash:null,
   tx:{...tx,chainId:CHAIN,gas:hex(feeGas),gasPrice:hex(price),nonce:hex(nonce)}};
  validatePending(p);this.preview=p;return p;
 }
 async send(){
  if(this.busy)throw Error('已有操作正在处理中');
  this.busy=true;
  let p;
  try{
   p=this.preview;this.preview=null;
   if(!p||this.now()>p.expires)throw Error('预览已过期，请重新模拟');
   validatePending(p);
   if(this.pending())throw Error('已有待处理交易，请先核验');
   const c=await this.context();
   if(c.account!==p.account)throw Error('账户已改变');
   const fresh=await this.prepareForSend(p);this.assertContext(c);
   if(!fresh)throw Error('预检失败');
   await this.context();this.assertContext(c);
   if(this.now()>p.expires)throw Error('预检期间预览已过期，请重新模拟');
   if(this.pending())throw Error('另一页面已有待处理操作，请先核验');
   // Write before invoking the wallet, so closing the tab cannot enable a duplicate.
   this.store(p);
   let hash;
   try{hash=await c.provider.request({method:'eth_sendTransaction',params:[p.tx]});}
   catch(e){
    if(e?.code===4001){if(equal(this.pending(),p))this.storage.removeItem(STORAGE_KEY);throw Error('你已取消签名；没有自动重试');}
    p.phase='unknown';this.store(p);throw Error('钱包返回不明结果。请检查钱包历史并填入交易哈希；不要重发。');
   }
   if(!HASH.test(hash??'')){p.phase='unknown';this.store(p);throw Error('钱包未返回合法交易哈希；请从钱包历史恢复，不要重发');}
   p.phase='submitted';p.hash=hash;
   try{this.store(p);}catch{throw Error('交易已发送，但哈希保存失败。请复制 '+hash+' 并从待处理入口恢复；不要重发');}
   return p;
  }finally{this.busy=false;this.onchange();}
 }
 async prepareForSend(p){
  if(this.now()>p.expires)throw Error('预览已过期');
  const b=await this.head();
  if(await this.rpc('eth_getCode',[p.account,b.number])!=='0x')throw Error('账户类型已改变');
  if(p.operation==='act'){
   const s=decodeSession(await this.rpc('eth_call',[{to:HOST,data:sessionCall(p.session)},b.number]));
   if(!equal(s,p.before))throw Error('会话已推进，请重新读取；不会自动更新版本重发');
  }
  for(const tag of ['pending','latest'])if(quantity(await this.rpc('eth_getTransactionCount',[p.account,tag]))!==quantity(p.tx.nonce))throw Error('账户 nonce 已改变，请重新预览');
  if(quantity(await this.rpc('eth_gasPrice',[]))>quantity(p.tx.gasPrice))throw Error('当前费用高于预览，请重新模拟');
  const gas=quantity(await this.rpc('eth_estimateGas',[p.tx]));
  if(gas===0n||gas>quantity(p.tx.gas))throw Error('gas 已超过预览，请重新模拟');
  const result=await this.rpc('eth_call',[p.tx,b.number]);
  if(p.operation==='act'?result!=='0x':!/^0x[0-9a-fA-F]{64}$/.test(result??''))throw Error('发送前模拟失败');
  await this.sameBlock(b);return true;
 }
 async recover(hash){
  const p=this.pending();if(!p)throw Error('没有待处理交易');
  if(!HASH.test(hash??''))throw Error('请填写完整的交易哈希');
  // Bind before saving a user-supplied hash; a typo must not replace a valid one.
  const tx=await this.rpc('eth_getTransactionByHash',[hash]);this.bindTransaction(p,tx,hash);
  if(p.hash&&p.hash.toLowerCase()!==hash.toLowerCase())throw Error('已有交易哈希，不能替换');
  p.hash=hash;p.phase='submitted';this.store(p);return p;
 }
 bindTransaction(p,tx,hash){
  if(!tx||tx.hash?.toLowerCase()!==hash.toLowerCase()||
   tx.from?.toLowerCase()!==p.account||tx.to?.toLowerCase()!==p.tx.to||
   tx.input?.toLowerCase()!==p.tx.data||quantity(tx.value)!==0n||
   quantity(tx.nonce)!==quantity(p.tx.nonce)||quantity(tx.chainId)!==196n)throw Error('交易与待处理账户、宿主、调用或 nonce 不符');
 }
 async verify(){
  const p=this.pending();if(!p?.hash)throw Error('请先从钱包历史恢复交易哈希');
  if(quantity(await this.rpc('eth_chainId',[]))!==196n)throw Error('RPC 网络不符');
  const tx=await this.rpc('eth_getTransactionByHash',[p.hash]);this.bindTransaction(p,tx,p.hash);
  const r=await this.rpc('eth_getTransactionReceipt',[p.hash]);if(!r)return {pending:true};
  if(r.transactionHash?.toLowerCase()!==p.hash.toLowerCase()||r.from?.toLowerCase()!==p.account||r.to?.toLowerCase()!==p.tx.to||!HASH.test(r.blockHash??''))throw Error('交易回执身份不符');
  const b=await this.block(r.blockNumber);
  if(b.hash.toLowerCase()!==r.blockHash.toLowerCase()||tx.blockHash?.toLowerCase()!==b.hash.toLowerCase()||quantity(tx.blockNumber)!==quantity(r.blockNumber))throw Error('交易所在区块不符');
  const height=quantity(await this.rpc('eth_blockNumber',[]));
  if(height<quantity(r.blockNumber)+1n)return {pending:true,confirming:true};
  const status=quantity(r.status);
  if(status!==0n&&status!==1n)throw Error('回执状态错误');
  const fee=quantity(r.gasUsed)*quantity(r.effectiveGasPrice);
  if(status===0n){
   await this.sameBlock(b);
   const result={failed:true,hash:p.hash,fee:fee.toString(),block:r.blockNumber,blockHash:r.blockHash};
   await this.onVerified(structuredClone(p),structuredClone(result));this.finish(p);return result;
  }
  await this.codeAt(b.number);
  if(!Array.isArray(r.logs)||r.logs.length>256)throw Error('回执日志错误');
  const logs=r.logs.filter(l=>l.address?.toLowerCase()===p.tx.to);
  if(logs.length!==1)throw Error('需要唯一的宿主事件');
  const l=logs[0];
  if(l.removed||l.transactionHash?.toLowerCase()!==p.hash.toLowerCase()||l.blockHash?.toLowerCase()!==b.hash.toLowerCase()||quantity(l.blockNumber)!==quantity(b.number)||!Array.isArray(l.topics))throw Error('事件区块或交易不符');
  if(!HASH.test(l.topics[1]??''))throw Error('事件会话错误');
  const id=BigInt(l.topics[1]).toString();sessionCall(id);
  let expected;
  if(p.operation==='open'){
   if(l.topics.length!==3||l.topics[0]!==OPENED||l.topics[2]!=='0x'+'0'.repeat(24)+p.account.slice(2)||l.data!=='0x'+word(p.circuit))throw Error('开局事件不符');
   expected={player:p.account,circuit:p.circuit,version:0,training:{latch:0,score:0,resource:0},door:{latch:0,score:0,resource:2}};
  }else{
   const a=advance(p.before,p.trigger);
   if(id!==p.session||l.topics.length!==2||l.topics[0]!==ACTED||l.data!=='0x'+[p.version+1,Number(p.trigger),a.trainingRequest,a.doorRequest,a.doorEffect].map(word).join(''))throw Error('动作事件与预期输出不符');
   expected=a.state;
  }
  const state=decodeSession(await this.rpc('eth_call',[{to:HOST,data:sessionCall(id)},b.number]));
  if(state.player!==p.account||state.circuit!==p.circuit||state.version<expected.version||
   (state.version===expected.version&&!equal(state,expected)))throw Error('回执所在块的会话状态不符');
  quantity(l.logIndex);await this.sameBlock(b);
  const result={hash:p.hash,session:id,state,fee:fee.toString(),block:r.blockNumber,blockHash:r.blockHash,
   logIndex:l.logIndex,laterActionsInBlock:state.version>expected.version};
  // Persist the public verified observation before clearing the recoverable intent.
  await this.onVerified(structuredClone(p),structuredClone(result));this.finish(p);return result;
 }
 finish(p){
  // Never remove a different tab's pending action.
  if(!equal(this.pending(),p))throw Error('本机待处理记录已改变，请重新核验');
  this.storage.removeItem(STORAGE_KEY);this.preview=null;
 }
}
