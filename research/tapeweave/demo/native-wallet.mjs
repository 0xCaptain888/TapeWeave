// Explicit EIP-5792 call flow for already-deployed ERC-4337 accounts.
// No credentials, local signer, bundler URL, account upgrades or automatic retries.
import {address,plan,sessionCall,decodeSession} from './chain-host.mjs';
import {WalletRun,HOST,CHAIN,STORAGE_KEY,OPENED,ACTED,advance,quantity} from './chain-wallet.mjs?v=native-20261026-1';
export const NATIVE_KEY='tapeweave-native-pending-v1';
export const NATIVE_HISTORY_KEY='tapeweave-native-history-v1';
export const ENTRYPOINT='0x0000000071727de22e5e9d8baf0edac6f37da032';
export const USER_OPERATION='0x49628fd1471006c1482da88028e9ce4dbb080b815c9b0344d39e5a8e6ec1419f';
export const BEFORE_EXECUTION='0xbb47ee3e183a558b1a2ff0874b079f3fc5478b7454eacf2bfc5af2ff5878f972';
const HASH=/^0x[0-9a-fA-F]{64}$/,hex=n=>'0x'+n.toString(16),word=n=>BigInt(n).toString(16).padStart(64,'0');
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
function fields(o,keys){
 if(!o||typeof o!=='object'||Array.isArray(o)||Object.keys(o).sort().join()!==keys.slice().sort().join())throw Error('AA 本机记录字段错误');
}
function state(s){
 fields(s,['player','circuit','version','training','door']);
 for(const w of [s.training,s.door])fields(w,['latch','score','resource']);
 const raw='0x'+'0'.repeat(24)+address(s.player).slice(2)+[s.circuit,s.version,s.training.latch,s.training.score,s.training.resource,s.door.latch,s.door.score,s.door.resource].map(word).join('');
 if(!equal(decodeSession(raw),s))throw Error('AA 前置状态错误');
}
export function validateNativeIntent(p){
 fields(p,['format','chain','host','account','operation','circuit','session','version','trigger','before',
  'created','expires','block','blockHash','id','phase','hash','call']);
 if(p.format!=='tapeweave-native-intent-v1'||p.chain!==CHAIN||p.host!==HOST||
  address(p.account)!==p.account||!['open','act'].includes(p.operation)||![1,2].includes(p.circuit)||
  !Number.isSafeInteger(p.created)||p.created<0||!Number.isSafeInteger(p.expires)||p.expires!==p.created+60000||
  !['awaiting-wallet','unknown','submitted'].includes(p.phase)||!HASH.test(p.id)||!HASH.test(p.blockHash)||
  p.hash!==null&&!HASH.test(p.hash))throw Error('AA 本机记录损坏；保留记录并核查钱包，不能重发');
 quantity(p.block);fields(p.call,['to','value','data']);
 const expected=plan({host:HOST,operation:p.operation,circuit:String(p.circuit),session:p.session,version:String(p.version),trigger:p.trigger});
 if(p.call.to!==expected.to||p.call.data!==expected.data||p.call.value!=='0x0')throw Error('AA 调用不符');
 if(p.operation==='open'){
  if(p.before!==null||p.session!==null||p.version!==null||p.trigger!==null)throw Error('AA 开局字段错误');
 }else{
  state(p.before);
  if(p.before.player!==p.account||p.before.circuit!==p.circuit||p.before.version!==p.version)throw Error('AA 会话身份错误');
 }
 return p;
}
export function nativeCapabilities(value){
 if(!value||typeof value!=='object'||Array.isArray(value)||JSON.stringify(value).length>16384)throw Error('钱包能力格式错误');
 // Chain-specific capability takes precedence over a global capability.
 const status=value[CHAIN]?.atomic?.status??value['0x0']?.atomic?.status;
 if(status!=='supported')throw Error(status==='ready'?
  '钱包要求升级账户；本页不请求账户升级。请先在钱包中自行处理，再重新连接':
  '此钱包未声明 X Layer 的 EIP-5792 原生调用支持；请使用官方 AA 工具或普通 EOA 入口');
 return {chain:CHAIN,atomic:'supported',protocol:'EIP-5792 2.0.0'};
}
function logIndex(l,r){
 if(!l||l.removed||l.transactionHash?.toLowerCase()!==r.transactionHash.toLowerCase()||
  l.blockHash?.toLowerCase()!==r.blockHash.toLowerCase()||quantity(l.blockNumber)!==quantity(r.blockNumber)||
  !Array.isArray(l.topics)||l.topics.some(t=>!HASH.test(t)))throw Error('AA 日志与交易／区块不符');
 return quantity(l.logIndex);
}
export function nativeReceiptProof(p,r,tx,head,s){
 validateNativeIntent(p);
 if(!r||!HASH.test(r.transactionHash??'')||!HASH.test(r.blockHash??'')||
  tx?.hash?.toLowerCase()!==r.transactionHash.toLowerCase()||quantity(tx.chainId)!==196n||
  tx.to?.toLowerCase()!==ENTRYPOINT||r.to?.toLowerCase()!==ENTRYPOINT||
  tx.blockHash?.toLowerCase()!==r.blockHash.toLowerCase()||quantity(tx.blockNumber)!==quantity(r.blockNumber)||
  quantity(r.status)!==1n||quantity(r.blockNumber)<=quantity(p.block)||
  quantity(head)<quantity(r.blockNumber)+1n||!Array.isArray(r.logs)||r.logs.length>512)throw Error('AA 回执、EntryPoint、区块深度或发送时间边界不符');
 const logs=r.logs.map(l=>({l,index:logIndex(l,r)})).sort((a,b)=>a.index<b.index?-1:1);
 if(new Set(logs.map(x=>x.index.toString())).size!==logs.length)throw Error('AA 日志序号重复');
 const hostLogs=logs.filter(x=>x.l.address?.toLowerCase()===HOST.toLowerCase());
 if(hostLogs.length!==1)throw Error('需要唯一宿主事件，不能认领批量或其他会话');
 const {l,index}=hostLogs[0];if(!HASH.test(l.topics[1]??''))throw Error('AA 事件会话错误');
 const id=BigInt(l.topics[1]).toString();sessionCall(id);
 let expected;
 if(p.operation==='open'){
  if(l.topics.length!==3||l.topics[0]!==OPENED||l.topics[2]!=='0x'+'0'.repeat(24)+p.account.slice(2)||l.data!=='0x'+word(p.circuit))throw Error('AA 开局事件不符');
  expected={player:p.account,circuit:p.circuit,version:0,training:{latch:0,score:0,resource:0},door:{latch:0,score:0,resource:2}};
 }else{
  const a=advance(p.before,p.trigger);expected=a.state;
  if(id!==p.session||l.topics.length!==2||l.topics[0]!==ACTED||
   l.data!=='0x'+[p.version+1,Number(p.trigger),a.trainingRequest,a.doorRequest,a.doorEffect].map(word).join(''))throw Error('AA 动作事件不符');
 }
 state(s);
 if(s.player!==p.account||s.circuit!==p.circuit||s.version<expected.version||
  s.version===expected.version&&!equal(s,expected))throw Error('AA 块末会话状态不符');
 const boundaries=logs.filter(x=>x.l.address?.toLowerCase()===ENTRYPOINT&&
  [BEFORE_EXECUTION,USER_OPERATION].includes(x.l.topics[0]));
 const terminal=boundaries.find(x=>x.index>index);
 const lower=boundaries.filter(x=>x.index<index).at(-1);
 if(!lower||!terminal||terminal.l.topics[0]!==USER_OPERATION||terminal.l.topics.length!==4||
  terminal.l.topics[2]!=='0x'+'0'.repeat(24)+p.account.slice(2)||!/^0x[0-9a-fA-F]{256}$/.test(terminal.l.data??''))throw Error('宿主事件不属于此 AA 的 UserOperation 区间');
 const values=Array.from({length:4},(_,i)=>BigInt('0x'+terminal.l.data.slice(2+i*64,66+i*64)));
 if(values[1]!==1n)throw Error('UserOperation 未成功');
 return {format:'tapeweave-native-receipt-v1',hash:r.transactionHash.toLowerCase(),account:p.account,
  session:id,state:s,block:r.blockNumber,blockHash:r.blockHash,logIndex:l.logIndex,
  userOperationHash:terminal.l.topics[1],entryPoint:ENTRYPOINT,fee:values[2].toString(),
  outerFee:(quantity(r.gasUsed)*quantity(r.effectiveGasPrice)).toString(),
  signatureRevalidated:false,providerAgreement:false,laterActionsInBlock:s.version>expected.version};
}
export function validateNativeResult(r){
 fields(r,['format','hash','account','session','state','block','blockHash','logIndex','userOperationHash',
  'entryPoint','fee','outerFee','signatureRevalidated','providerAgreement','laterActionsInBlock']);
 if(r.format!=='tapeweave-native-receipt-v1'||!HASH.test(r.hash)||!HASH.test(r.blockHash)||!HASH.test(r.userOperationHash)||
  address(r.account)!==r.account||r.entryPoint!==ENTRYPOINT||r.signatureRevalidated!==false||r.providerAgreement!==false||
  typeof r.laterActionsInBlock!=='boolean'||![r.fee,r.outerFee].every(v=>typeof v==='string'&&/^(0|[1-9][0-9]{0,155})$/.test(v)))throw Error('AA 历史回执格式错误');
 sessionCall(r.session);quantity(r.block);quantity(r.logIndex);state(r.state);
 if(r.state.player!==r.account)throw Error('AA 历史回执账户不符');return r;
}
export function nativeHistory(storage){
 const raw=storage.getItem(NATIVE_HISTORY_KEY);if(raw===null)return [];
 if(raw.length>524288)throw Error('AA 历史超限');
 const entries=JSON.parse(raw);
 if(!Array.isArray(entries)||entries.length>100)throw Error('AA 历史格式错误');
 for(const e of entries){
  fields(e,['intent','result']);validateNativeIntent(e.intent);validateNativeResult(e.result);
  if(e.intent.account!==e.result.account||e.intent.hash!==e.result.hash||e.intent.phase!=='submitted'||
   e.intent.circuit!==e.result.state.circuit||e.intent.operation==='act'&&e.intent.session!==e.result.session)throw Error('AA 历史意图不符');
 }
 if(new Set(entries.map(e=>e.result.hash)).size!==entries.length)throw Error('AA 历史重复');
 return entries;
}
export class NativeWalletRun extends WalletRun{
 constructor(options){super(options);this.id=options.id??(()=> '0x'+Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join(''));}
 pending(){
  const text=this.storage.getItem(NATIVE_KEY);
  if(text===null)return null;
  if(text.length>16384)throw Error('AA 待处理记录过大');
  return validateNativeIntent(JSON.parse(text));
 }
 store(p){
  const text=JSON.stringify(validateNativeIntent(p));this.storage.setItem(NATIVE_KEY,text);
  if(this.storage.getItem(NATIVE_KEY)!==text)throw Error('AA 待处理意图保存失败；停止发送');
 }
 async capability(c){
  const result=nativeCapabilities(await c.provider.request({method:'wallet_getCapabilities',params:[c.account,[CHAIN]]}));
  this.assertContext(c);return result;
 }
 async checkAccount(account,b){
  const code=await this.rpc('eth_getCode',[account,b.number]);
  if(typeof code!=='string'||!/^0x(?:[0-9a-fA-F]{2})+$/.test(code)||code.toLowerCase().startsWith('0xef0100'))throw Error('AA 入口需要已部署的合约账户；未部署／普通 EOA／委托账户使用对应入口');
 }
 async check(p){
  const c=await this.context();if(c.account!==p.account)throw Error('AA 账户已改变');
  await this.capability(c);const b=await this.head();await this.checkAccount(c.account,b);
  if(p.operation==='act'){
   const s=decodeSession(await this.rpc('eth_call',[{to:HOST,data:sessionCall(p.session)},b.number]));
   if(!equal(s,p.before))throw Error('AA 会话已改变，请重新读取和预览');
  }
  const raw=await this.rpc('eth_call',[{from:c.account,...p.call,gas:'0x989680'},b.number]);
  if(p.operation==='open'?!/^0x[0-9a-fA-F]{64}$/.test(raw??'')||BigInt(raw)===0n:raw!=='0x')throw Error('AA 内部调用模拟失败');
  await this.sameBlock(b);this.assertContext(c);return {c,b};
 }
 async prepare({operation,circuit,session,version,trigger}){
  this.preview=null;
  if(this.busy||this.pending()||this.storage.getItem(STORAGE_KEY)!==null)throw Error('先处理已有 AA 或普通钱包交易，不能重复发送');
  const c=await this.context(),draft=plan({host:HOST,operation,circuit:String(circuit),session,version:String(version),trigger});
  const b=await this.head(),before=operation==='act'?decodeSession(await this.rpc('eth_call',[{to:HOST,data:sessionCall(session)},b.number])):null;
  if(before&&(before.player!==c.account||before.version!==version||before.circuit!==circuit))throw Error('AA 会话所属或版本不符');
  const created=this.now(),p={format:'tapeweave-native-intent-v1',chain:CHAIN,host:HOST,account:c.account,operation,circuit,
   session:operation==='act'?session:null,version:operation==='act'?version:null,trigger:operation==='act'?trigger:null,before,
   created,expires:created+60000,block:b.number,blockHash:b.hash,id:this.id(),phase:'awaiting-wallet',hash:null,
   call:{to:draft.to,value:'0x0',data:draft.data}};
  validateNativeIntent(p);await this.check(p);this.assertContext(c);
  this.preview=p;return p;
 }
 async send(){
  if(this.busy)throw Error('AA 操作进行中');
  this.busy=true;
  try{
   const p=this.preview;this.preview=null;
   if(!p||this.now()>p.expires)throw Error('AA 预览已过期');
   if(this.pending()||this.storage.getItem(STORAGE_KEY)!==null)throw Error('已有待处理交易');
   const {c,b}=await this.check(p);
   // A fresh lower time boundary prevents accepting pre-existing successful transactions.
   p.block=b.number;p.blockHash=b.hash;
   if(this.now()>p.expires)throw Error('AA 预检期间预览过期');
   if(this.pending()||this.storage.getItem(STORAGE_KEY)!==null)throw Error('另一页面已有待处理交易');
   this.assertContext(c);this.store(p);
   let result;
   try{result=await c.provider.request({method:'wallet_sendCalls',params:[{
    version:'2.0.0',id:p.id,from:p.account,chainId:CHAIN,atomicRequired:true,calls:[p.call],
   }]});}
   catch(e){
    if(e?.code===4001){
     if(equal(this.pending(),p))this.storage.removeItem(NATIVE_KEY);
     throw Error('你已拒绝 AA 钱包确认；没有自动重试');
    }
    p.phase='unknown';this.store(p);throw Error('AA 钱包结果不明；保留请求 ID，从钱包查询或恢复，不能重发');
   }
   p.phase=result?.id===p.id?'submitted':'unknown';this.store(p);
   if(p.phase==='unknown')throw Error('钱包没有返回原请求 ID；请人工恢复交易哈希，不能自动重发');
   return p;
  }finally{this.busy=false;this.onchange();}
 }
 async lookup(){
  const p=this.pending();if(!p)throw Error('没有 AA 待处理请求');
  const c=await this.context();if(c.account!==p.account)throw Error('请连接原 AA 账户查询');
  const s=await c.provider.request({method:'wallet_getCallsStatus',params:[p.id]});this.assertContext(c);
  if(s?.id!==p.id||s.version!=='2.0.0'||quantity(s.chainId)!==196n||!Number.isInteger(s.status)||s.atomic!==true)throw Error('钱包 AA 状态格式不符；原意图仍保留');
  if(s.status>=100&&s.status<200)return {pending:true};
  if(s.status!==200||!Array.isArray(s.receipts)||s.receipts.length!==1||!HASH.test(s.receipts[0].transactionHash??''))throw Error('钱包未返回唯一成功回执，请检查钱包；原意图保留，不重发');
  return this.recover(s.receipts[0].transactionHash);
 }
 async inspect(hash){
  const p=this.pending();if(!p||!HASH.test(hash??''))throw Error('需要 AA 意图与完整交易哈希');
  if(p.hash&&p.hash.toLowerCase()!==hash.toLowerCase())throw Error('已有 AA 交易哈希不能替换');
  if(quantity(await this.rpc('eth_chainId',[]))!==196n)throw Error('RPC 网络错误');
  const r=await this.rpc('eth_getTransactionReceipt',[hash]);if(!r)return {pending:true};
  if(r.transactionHash?.toLowerCase()!==hash.toLowerCase())throw Error('AA 候选交易哈希不符');
  const tx=await this.rpc('eth_getTransactionByHash',[hash]),b=await this.block(r.blockNumber);
  if(b.hash.toLowerCase()!==r.blockHash?.toLowerCase())throw Error('AA 交易不在规范块');
  const height=await this.rpc('eth_blockNumber',[]);
  if(quantity(height)<quantity(r.blockNumber)+1n)return {pending:true,confirming:true};
  await this.codeAt(b.number);
  const hosts=r.logs?.filter(l=>l.address?.toLowerCase()===HOST.toLowerCase());
  if(hosts?.length!==1||!HASH.test(hosts[0].topics?.[1]??''))throw Error('AA 回执没有唯一宿主会话');
  const id=BigInt(hosts[0].topics[1]).toString();
  const s=decodeSession(await this.rpc('eth_call',[{to:HOST,data:sessionCall(id)},b.number]));
  const result=nativeReceiptProof(p,r,tx,height,s);await this.sameBlock(b);
  return result;
 }
 async recover(hash){
  const p=this.pending(),result=await this.inspect(hash);if(result.pending)return result;
  if(!equal(this.pending(),p))throw Error('AA 意图已被其他页面修改');
  p.hash=hash.toLowerCase();p.phase='submitted';this.store(p);return {bound:true,hash:p.hash};
 }
 async verify(){
  const p=this.pending();if(!p?.hash)throw Error('先查询钱包状态或恢复哈希');
  const result=await this.inspect(p.hash);if(result.pending)return result;
  await this.onVerified(structuredClone(p),structuredClone(result));this.finish(p);return result;
 }
 finish(p){
  if(!equal(this.pending(),p))throw Error('AA 待处理记录已改变');
  this.storage.removeItem(NATIVE_KEY);this.preview=null;
 }
}
export function saveNativeResult(storage,intent,result){
 validateNativeIntent(intent);validateNativeResult(result);
 if(intent.hash!==result.hash||intent.account!==result.account)throw Error('AA 意图与回执不符');
 const old=storage.getItem(NATIVE_HISTORY_KEY);
 const entries=nativeHistory(storage);
 const prior=entries.find(e=>e.result.hash===result.hash);
 if(prior&&!equal(prior,{intent,result}))throw Error('AA 历史记录冲突；待处理意图保留');
 if(!prior)entries.push({intent,result});
 const text=JSON.stringify(entries);
 if(entries.length>100||text.length>524288)throw Error('AA 历史已满，请先备份后人工处理');
 if(storage.getItem(NATIVE_HISTORY_KEY)!==old)throw Error('AA 历史已由另一页面修改');
 storage.setItem(NATIVE_HISTORY_KEY,text);
 if(storage.getItem(NATIVE_HISTORY_KEY)!==text)throw Error('AA 历史保存失败');
}
