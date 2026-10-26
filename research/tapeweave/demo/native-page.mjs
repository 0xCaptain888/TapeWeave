import {NativeWalletRun,NATIVE_KEY,nativeHistory,saveNativeResult} from './native-wallet.mjs';
import {HOST,STORAGE_KEY,okb} from './chain-wallet.mjs?v=native-20261026-1';
import {diagnoseNative} from './native-diagnostics.mjs';
const $=id=>document.getElementById(id),providers=[];
let busy=false,active=null,cleanup=()=>{},rpcTail=Promise.resolve(),last=0;
const storage={getItem:k=>localStorage.getItem(k),setItem:(k,v)=>localStorage.setItem(k,v),removeItem:k=>localStorage.removeItem(k)};
function rpc(method,params){
 const next=rpcTail.then(async()=>{
  const delay=250-(Date.now()-last);if(delay>0)await new Promise(r=>setTimeout(r,delay));last=Date.now();
  const res=await fetch('https://rpc.xlayer.tech',{method:'POST',redirect:'error',credentials:'omit',referrerPolicy:'no-referrer',
   headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params}),signal:AbortSignal.timeout(15000)});
  if(!res.ok)throw Error('AA 只读 RPC HTTP '+res.status);
  const reader=res.body.getReader(),chunks=[];let size=0;
  try{while(true){const x=await reader.read();if(x.done)break;size+=x.value.length;if(size>262144)throw Error('AA RPC 响应过大');chunks.push(x.value);}}finally{await reader.cancel();}
  const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}
  const j=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
  if(j.error||j.id!==1||j.jsonrpc!=='2.0'||!Object.hasOwn(j,'result'))throw Error('AA 只读 RPC 请求失败');
  return j.result;
 });rpcTail=next.catch(()=>{});return next;
}
const run=new NativeWalletRun({rpc,storage,onVerified:async(p,r)=>saveNativeResult(storage,p,r)});
const message=text=>$('native-status').textContent=text;
function clear(){run.preview=null;$('native-preview').textContent='';$('native-fee-ack').checked=false;}
function render(){
 let pending=null,broken=false;
 try{pending=run.pending();}catch(e){broken=true;message(e.message);}
 let other=false;try{other=storage.getItem(STORAGE_KEY)!==null;}catch{broken=true;}
 $('native-account').textContent=run.account?'已连接 '+run.account:'未连接钱包';
 for(const id of ['native-provider','native-connect','native-switch','native-circuit','native-session','native-hash','native-export','native-diagnose'])$(id).disabled=busy;
 $('native-diagnostic-copy').disabled=busy||!$('native-diagnostic').value;
 $('native-open').disabled=busy||broken||other||Boolean(pending)||!run.account;
 $('native-read').disabled=busy||!run.account;
 for(const id of ['native-wait','native-trigger'])$(id).disabled=$('native-open').disabled||!active||active.version>=4;
 $('native-fee-ack').disabled=busy||!run.preview;
 $('native-confirm').disabled=$('native-open').disabled||!run.preview||!$('native-fee-ack').checked;
 $('native-lookup').disabled=busy||!pending||!run.account;
 $('native-recover').disabled=busy||!pending||Boolean(pending.hash);
 $('native-verify').disabled=busy||!pending?.hash;
 $('native-pending').textContent=pending?JSON.stringify({account:pending.account,operation:pending.operation,
  session:pending.session,requestId:pending.id,phase:pending.phase,transactionHash:pending.hash},null,2):
  broken?'记录无法读取。停止发送；请保留站点数据。':other?'普通钱包入口有待处理交易，先核验后再操作。':'没有待处理请求';
}
run.onchange=()=>{clear();render();};
async function task(fn){
 if(busy)return;busy=true;render();
 try{await fn();}catch(e){message(String(e.message??'AA 操作失败').slice(0,500));}
 finally{busy=false;render();}
}
async function locked(fn){
 if(!navigator.locks)throw Error('需要支持 Web Locks 的当前浏览器');
 return navigator.locks.request('tapeweave-wallet-send',{ifAvailable:true},lock=>{
  if(!lock)throw Error('另一页面正在处理钱包，请等待');return fn();
 });
}
function add(provider,name){
 if(!provider||typeof provider.request!=='function'||providers.length>=16||providers.some(x=>x===provider))return;
 const option=document.createElement('option');option.value=String(providers.length);option.textContent=String(name??'插件钱包').slice(0,60);
 providers.push(provider);$('native-provider').append(option);
}
window.addEventListener('eip6963:announceProvider',e=>add(e.detail?.provider,e.detail?.info?.name));
window.dispatchEvent(new Event('eip6963:requestProvider'));add(window.okxwallet,'OKX Wallet');
for(const p of window.ethereum?.providers??[])add(p,p.isMetaMask?'MetaMask':'插件钱包');
add(window.ethereum,window.ethereum?.isMetaMask?'MetaMask':'插件钱包');
function disconnect(){cleanup();run.disconnect();active=null;clear();render();}
function clearDiagnostic(){ $('native-diagnostic').value='';$('native-guidance').textContent='先检测钱包，再逐笔预览；检测不会请求签名。'; }
async function diagnose(){
 const selected=$('native-provider').value,p=providers[Number(selected)];
 const result=await diagnoseNative({provider:p,rpc,secureContext:window.isSecureContext,webLocks:Boolean(navigator.locks)});
 if(selected!==$('native-provider').value)throw Error('钱包选择已改变，请重新诊断');
 $('native-diagnostic').value=JSON.stringify(result,null,2);$('native-guidance').textContent=result.next;
 return result;
}
$('native-provider').onchange=()=>{disconnect();clearDiagnostic();render();};
$('native-diagnose').onclick=()=>task(async()=>{await diagnose();message('只读诊断已生成，没有请求连接授权、签名或发送交易。复制报告可继续排查。');});
$('native-diagnostic-copy').onclick=()=>task(async()=>{
 const text=$('native-diagnostic').value;if(!text)throw Error('请先生成诊断');
 try{await navigator.clipboard.writeText(text);message('已复制公开账户与兼容性诊断；不含钱包原始错误、能力原文或秘密。');}
 catch{$('native-diagnostic').focus();$('native-diagnostic').select();message('自动复制被拒绝，已选中诊断，请手动复制。');}
});
$('native-connect').onclick=()=>task(async()=>{
 disconnect();clearDiagnostic();
 const p=providers[Number($('native-provider').value)];if(!p)throw Error('未检测到插件，请在已安装钱包的浏览器或钱包 DApp 浏览器打开');
 try{await run.connect(p);}catch(e){await diagnose();throw e;}
 const changed=()=>{run.disconnect();active=null;clear();clearDiagnostic();message('AA 账户或网络改变，请重新连接；原意图保留');render();};
 for(const name of ['accountsChanged','chainChanged','disconnect'])p.on?.(name,changed);
 cleanup=()=>{for(const name of ['accountsChanged','chainChanged','disconnect'])p.removeListener?.(name,changed);};
 try{
  const c=await run.context();await run.capability(c);const b=await run.head();await run.checkAccount(c.account,b);run.assertContext(c);
 }catch(e){disconnect();await diagnose();throw e;}
 message('钱包声明本链支持 EIP-5792，且账户已有合约代码。请逐笔预览并在钱包核对；尚未证明该插件真实签名或兼容所有 AA。');
});
$('native-switch').onclick=()=>task(async()=>{
 const p=providers[Number($('native-provider').value)];if(!p)throw Error('没有可用钱包');
 await p.request({method:'wallet_switchEthereumChain',params:[{chainId:'0xc4'}]});disconnect();message('切网请求完成，请重新连接');
});
for(const id of ['native-session','native-circuit'])$(id).addEventListener('input',()=>{run.invalidate();active=null;clear();render();});
$('native-fee-ack').onchange=render;
function show(s){active=s;$('native-circuit').value=String(s.circuit);$('native-state').textContent=`会话 #${$('native-session').value} · ${s.version}/4 步 · 训练 ${s.training.score} · 开门 ${s.door.score} · 余钥匙 ${s.door.resource}`;}
$('native-read').onclick=()=>task(async()=>{
 clear();active=null;const c=await run.context(),id=$('native-session').value;
 const s=await run.session(id,c.account);run.assertContext(c);if(id!==$('native-session').value)throw Error('会话选择改变');
 show(s);message('已从链上读取此账户会话');
});
async function prepare(operation,trigger){
 clear();if(operation==='act'&&!active)throw Error('请先读取会话');
 const p=await run.prepare({operation,circuit:Number($('native-circuit').value),session:$('native-session').value,version:active?.version,trigger});
 $('native-preview').textContent=`${p.operation==='open'?'开局':`会话 #${p.session} 第 ${p.version+1} 步 ${p.trigger?'触发':'等待'}`}\n账户：${p.account}\nX Layer 196\n宿主：${HOST}\n转入价值：0 OKB，无代币授权\n内部调用 eth_call 已通过；完整 UserOperation 模拟及总费用尚未取得\n钱包将决定 nonce、gas、赞助和最终费用，请在钱包内核对\n预览 60 秒有效；每次只发一条调用，不升级账户`;
 message('核对预览，勾选费用提示后点击确认；钱包仍会要求你确认。');
}
$('native-open').onclick=()=>task(()=>prepare('open'));
$('native-wait').onclick=()=>task(()=>prepare('act',false));
$('native-trigger').onclick=()=>task(()=>prepare('act',true));
$('native-confirm').onclick=()=>task(async()=>{
 if(!$('native-fee-ack').checked)throw Error('请先阅读并确认费用边界');
 await locked(()=>run.send());clear();message('AA 请求已提交给钱包；请查询状态，不能重复发送');
});
$('native-lookup').onclick=()=>task(async()=>{
 clear();const r=await locked(()=>run.lookup());
 message(r.pending?'钱包仍在处理，稍后手动查询；不重发':'候选交易已通过链上事件核验并绑定，请点击核验回执保存历史');
});
$('native-recover').onclick=()=>task(async()=>{
 clear();const r=await locked(()=>run.recover($('native-hash').value.trim()));
 message(r.pending?'交易尚未确认，请稍后重查':'恢复哈希已按原账户、调用事件和 UOP 区间核对绑定，请核验保存');
});
$('native-verify').onclick=()=>task(async()=>{
 clear();const r=await locked(()=>run.verify());
 if(r.pending){message('等待确认及至少两块深度；不重发');return;}
 $('native-session').value=r.session;
 if(run.account===r.account)show(r.state);else active=null;
 $('native-result').textContent=JSON.stringify(r,null,2);
 message(`成功 UserOperation 与宿主事件、状态已核验。本次 UOP 实付 ${okb(r.fee)}，外层费用另列；未重新验签。`);
});
$('native-export').onclick=()=>task(async()=>{
 $('native-archive').value=JSON.stringify({format:'tapeweave-native-export-v1',authenticated:false,entries:nativeHistory(storage)});
 message('已生成本机 AA 回执导出，不含待处理请求或钱包秘密，请复制保存');
});
window.addEventListener('storage',e=>{if([NATIVE_KEY,STORAGE_KEY].includes(e.key)){active=null;clear();render();}});
document.addEventListener('visibilitychange',()=>{if(document.hidden){clear();render();}});
clearDiagnostic();
if(!providers.length)$('native-guidance').textContent='当前网页未检测到钱包接口。若使用 Codex 内置浏览器，请复制本页地址到已安装并启用钱包扩展的 Chrome；不要向网页提供私钥。';
message('连接钱包检测能力；连接本身不发送交易。');render();
