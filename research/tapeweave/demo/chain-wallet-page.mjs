import {WalletRun,HOST,STORAGE_KEY,okb,quantity} from './chain-wallet.mjs?v=history-20261026-1';
import {WalletHistory,HISTORY_KEY,DEPLOYMENT_BLOCK,discoverOpened,MAX_HISTORY_BYTES} from './chain-history.mjs';
const $=id=>document.getElementById(id),providers=[];
let busy=false,active=null,cleanup=()=>{};
let lastRPC=0;
const message=text=>{$('wallet-status').textContent=text;};
async function rpc(method,params){
 // The public endpoint is rate limited. Only readonly requests use this transport.
 const delay=220-(Date.now()-lastRPC);if(delay>0)await new Promise(r=>setTimeout(r,delay));lastRPC=Date.now();
 const response=await fetch('https://rpc.xlayer.tech',{method:'POST',redirect:'error',
  headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params}),
  signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw Error('公共 RPC HTTP '+response.status+'；稍后可重新读取，交易不会自动重发');
 const reader=response.body.getReader(),chunks=[];let size=0;
 try{while(true){const x=await reader.read();if(x.done)break;size+=x.value.length;if(size>131072)throw Error('RPC 响应过大');chunks.push(x.value);}}finally{await reader.cancel();}
 const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}
 const j=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
 if(j.error||j.id!==1||j.jsonrpc!=='2.0'||!Object.hasOwn(j,'result'))throw Error('公共 RPC 请求失败；请重新读取，勿重复发送');
 return j.result;
}
// Lazy storage access keeps readonly mode usable when browser storage is denied.
const storage={
 getItem:key=>localStorage.getItem(key),setItem:(key,value)=>localStorage.setItem(key,value),
 removeItem:key=>localStorage.removeItem(key),
};
const historyStore=new WalletHistory(storage);
const run=new WalletRun({rpc,storage,onVerified:async(intent,result)=>{
 try{historyStore.record(intent,result);}
 catch(e){throw Error('回执核验完成，但历史未能保存；待处理记录仍保留，请备份后重新核验。'+e.message);}
}});
function clearPreview(){run.preview=null;$('wallet-preview').textContent='';$('wallet-confirm').disabled=true;}
function render(){
 $('wallet-account').textContent=run.account?'已连接 '+run.account:'未连接钱包';
 for(const id of ['wallet-provider','wallet-switch','wallet-circuit','wallet-session','wallet-connect','wallet-read','wallet-open','wallet-wait','wallet-trigger','wallet-verify','wallet-recover'])$(id).disabled=busy;
 const connected=Boolean(run.account);let pending=null,broken=false;
 try{pending=run.pending();}catch(e){broken=true;message(e.message);}
 const blocked=busy||Boolean(pending)||broken||!connected;
 $('wallet-open').disabled=blocked;
 for(const id of ['wallet-wait','wallet-trigger'])$(id).disabled=blocked||!active||active.version>=4;
 $('wallet-read').disabled=busy||!connected;
 $('wallet-confirm').disabled=blocked||!run.preview;
 $('wallet-verify').disabled=busy||!pending?.hash;
 $('wallet-recover').disabled=busy||!pending||Boolean(pending.hash);
 $('wallet-pending').hidden=!pending&&!broken;
 $('wallet-pending-text').textContent=pending?
  `待处理：${pending.operation==='open'?'开局':'第 '+(pending.version+1)+' 步'} · ${pending.account} · ${pending.hash??'尚无交易哈希。请检查钱包历史，找到后填入；不会自动重发。'}`:
  broken?'待处理记录无法读取，已阻止发送。请保留站点数据并检查钱包历史。':'';
 for(const id of ['history-select','history-load','history-export','history-import','history-scan','history-from','history-span','history-archive'])$(id).disabled=busy;
 $('history-load').disabled=busy||!connected||!$('history-select').value;
 $('history-scan').disabled=busy||!connected;
}
run.onchange=()=>{clearPreview();renderHistory();};
function showState(s){
 active=s;$('wallet-circuit').value=String(s.circuit);
 $('wallet-state').textContent=`会话 #${$('wallet-session').value} · ${s.circuit===1?'蓄能卡':'交替卡'} · ${s.version}/4 步\n训练 ${s.training.score} 分；开门 ${s.door.score} 次，剩 ${s.door.resource} 把钥匙${s.version===4?'\n本局完成。可以切换卡片后开始新局。':''}`;
}
async function task(fn){
 if(busy)return;busy=true;render();
 try{await fn();}catch(e){message(String(e.message??'操作失败').slice(0,500));}
 finally{busy=false;render();}
}
function renderHistory(){
 const selected=$('history-select').value;$('history-select').replaceChildren();$('history-list').replaceChildren();
 try{
  const all=historyStore.load();
  if(!run.account){$('history-status').textContent=`本机共 ${all.entries.length} 笔回执记录。连接钱包后按账户展示；备份可在未连接时导出。`;render();return;}
  const sessions=historyStore.sessions(run.account),entries=historyStore.entries(run.account);
  for(const s of sessions){
   const o=document.createElement('option');o.value=s.session;
   o.textContent=`#${s.session} · ${s.circuit===1?'蓄能':'交替'} · ${s.version===null?'链上发现':s.version+'/4 步（本机快照）'}`;
   $('history-select').append(o);
  }
  if(sessions.some(s=>s.session===selected))$('history-select').value=selected;
  for(const e of entries){
   const li=document.createElement('li'),r=e.result,p=e.intent;
   const a=document.createElement('a');a.href='https://www.oklink.com/xlayer/tx/'+r.hash;
   a.target='_blank';a.rel='noopener noreferrer';a.textContent=r.hash;
   li.append(`${r.failed?'回滚':`会话 #${r.session}`} · ${p.operation==='open'?'开局':`第 ${p.version+1} 步 ${p.trigger?'触发':'等待'}`} · 实付 ${okb(r.fee)} · `,a);
   $('history-list').append(li);
  }
  $('history-status').textContent=`当前账户：${sessions.length} 个会话，${entries.length} 笔本机回执。历史及导入内容仅为缓存；选择后将重新读取链上状态。`;
 }catch(e){$('history-status').textContent='历史读取失败：'+e.message;}
 render();
}
async function locked(fn){
 if(!navigator.locks)throw Error('浏览器不支持跨标签操作锁，请使用当前版本 Chrome／Edge');
 return navigator.locks.request('tapeweave-wallet-send',{ifAvailable:true},async lock=>{
  if(!lock)throw Error('另一页面正在处理钱包记录，请等待后重试');
  return fn();
 });
}
function addProvider(provider,name){
 if(!provider||typeof provider.request!=='function'||providers.length>=16||providers.some(p=>p.provider===provider))return;
 const option=document.createElement('option');option.value=String(providers.length);
 option.textContent=String(name||'浏览器钱包').slice(0,60);providers.push({provider});$('wallet-provider').append(option);
 $('wallet-connect').textContent='Connect Wallet';
}
// EIP-6963 metadata is untrusted text: no icon HTML or rdns-based authentication.
window.addEventListener('eip6963:announceProvider',e=>addProvider(e.detail?.provider,e.detail?.info?.name));
window.dispatchEvent(new Event('eip6963:requestProvider'));
addProvider(window.okxwallet,'OKX Wallet');
for(const p of window.ethereum?.providers??[])addProvider(p,p.isMetaMask?'MetaMask':'浏览器钱包');
addProvider(window.ethereum,window.ethereum?.isMetaMask?'MetaMask':'浏览器钱包');
$('wallet-provider').onchange=()=>{cleanup();run.disconnect();active=null;clearPreview();renderHistory();};
$('wallet-connect').onclick=()=>task(async()=>{
 const provider=providers[Number($('wallet-provider').value)]?.provider;
 if(!provider)throw Error('未检测到钱包。请在安装了 OKX／MetaMask 插件的浏览器打开，或在钱包 DApp 浏览器打开本页');
 cleanup();active=null;clearPreview();await run.connect(provider);
 const changed=()=>{run.disconnect();active=null;clearPreview();message('钱包环境已改变，请重新连接；待处理记录仍保留');renderHistory();};
 for(const name of ['accountsChanged','chainChanged','disconnect'])provider.on?.(name,changed);
 cleanup=()=>{for(const name of ['accountsChanged','chainChanged','disconnect'])provider.removeListener?.(name,changed);};
 message('连接成功。选择卡片并预览开局，或填入属于你的会话 ID 恢复。每笔都需要单独确认。');
 renderHistory();
});
$('wallet-switch').onclick=()=>task(async()=>{
 const provider=providers[Number($('wallet-provider').value)]?.provider;
 if(!provider)throw Error('未检测到插件钱包');
 await provider.request({method:'wallet_switchEthereumChain',params:[{chainId:'0xc4'}]});
 run.disconnect();active=null;clearPreview();renderHistory();message('切网请求已完成，请重新连接钱包');
});
for(const id of ['wallet-session','wallet-circuit'])$(id).addEventListener('input',()=>{
 run.invalidate();active=null;$('wallet-state').textContent='选择已改变，请读取会话或预览新局';render();
});
$('wallet-read').onclick=()=>task(async()=>{
 clearPreview();const c=await run.context(),id=$('wallet-session').value;
 const s=await run.session(id,c.account);run.assertContext(c);
 if(id!==$('wallet-session').value)throw Error('会话选择已改变，请重新读取');
 showState(s);message('会话已读取，所属账户和完整宿主代码已核对。');render();
});
async function prepare(operation,trigger){
 clearPreview();
 if(operation==='act'&&!active)throw Error('请先读取会话');
 const p=await run.prepare({operation,circuit:Number($('wallet-circuit').value),
  session:$('wallet-session').value,version:active?.version,trigger});
 const fee=quantity(p.tx.gas)*quantity(p.tx.gasPrice);
 $('wallet-preview').textContent=`${operation==='open'?'开新局':`会话 #${p.session} · 第 ${p.version+1} 步 · ${trigger?'触发':'等待'}`}\n账户：${p.account}\nX Layer 主网（196）\n宿主：${HOST}\n原生币转入：0 OKB；无代币授权\n模拟通过，gas 上限 ${quantity(p.tx.gas)}，gas 单价 ${quantity(p.tx.gasPrice)} wei\n当前交易参数的 gas 费用上限：${okb(fee)}\n60 秒内有效。钱包若修改费用，须重新核对钱包提示。普通插件账户不承诺赞助费用。`;
 message('请核对预览，再点击“确认并打开钱包”。只做宿主函数模拟，不是完整 UserOperation 模拟。');render();
}
$('wallet-open').onclick=()=>task(()=>prepare('open'));
$('wallet-wait').onclick=()=>task(()=>prepare('act',false));
$('wallet-trigger').onclick=()=>task(()=>prepare('act',true));
$('wallet-confirm').onclick=()=>task(async()=>{
 await locked(async()=>{
  message('正在重新预检并等待钱包确认；请勿关闭页面或重复发送');
  const p=await run.send();clearPreview();message('已发送。交易哈希已保存在本机，请点击“核验交易回执”：'+p.hash);
 });
});
$('wallet-verify').onclick=()=>task(async()=>{
 clearPreview();const result=await locked(()=>run.verify());renderHistory();
 if(result.pending){message(result.confirming?'已上链，等待至少两个区块深度后再次核验':'交易待确认；稍后再次核验，不会自动重发');return;}
 const a=document.createElement('a');a.href='https://www.oklink.com/xlayer/tx/'+result.hash;a.target='_blank';a.rel='noopener noreferrer';a.textContent=result.hash;
 $('wallet-receipt').replaceChildren(a);
 if(result.failed){message('交易已回滚，实付 gas '+okb(result.fee)+'。请重新读取状态后预览新操作。');return;}
 $('wallet-session').value=result.session;
 if(run.account===result.state.player)showState(result.state);else{active=null;$('wallet-state').textContent='已核验原账户会话 #'+result.session+'；连接对应账户后可续用';}
 message(`回执、事件与区块状态核验通过。实付 gas ${okb(result.fee)}。${result.laterActionsInBlock?'同块另有后续动作，展示的是块末状态。':''} 单 RPC；不是独立提供商共识。`);
});
$('wallet-recover').onclick=()=>task(async()=>{
 await locked(()=>run.recover($('wallet-hash').value.trim()));message('交易哈希已与原账户、调用及 nonce 绑定，请核验回执');
});
$('history-select').onchange=()=>{clearPreview();render();};
$('history-load').onclick=()=>task(async()=>{
 clearPreview();active=null;
 const c=await run.context(),id=$('history-select').value;
 const s=await run.session(id,c.account);run.assertContext(c);
 $('wallet-session').value=id;showState(s);message('已重新读取历史会话的链上状态，可按当前版本继续操作');
});
$('history-export').onclick=()=>task(async()=>{
 $('history-archive').value=historyStore.export();
 message('已生成本机历史备份，请复制保存。仅含已核验回执与发现的会话，不含待处理意图或钱包秘密。');
});
$('history-import').onclick=()=>task(async()=>{
 clearPreview();active=null;
 const text=$('history-archive').value;
 if(text.length>MAX_HISTORY_BYTES)throw Error('备份超过 1 MiB');
 await locked(()=>historyStore.import(text));renderHistory();
 message('备份已合并；没有签名认证。选择会话并重新读取链上状态后再继续。待处理交易保持原记录。');
});
$('history-scan').onclick=()=>task(async()=>{
 clearPreview();const c=await run.context();
 const result=await discoverOpened(run,{account:c.account,from:$('history-from').value,span:Number($('history-span').value)});
 run.assertContext(c);
 await locked(()=>{run.assertContext(c);return historyStore.remember(result.observations);});
 renderHistory();
 if(result.next)$('history-from').value=result.next;
 message(`已扫描区块 ${result.from}–${result.to}，发现 ${result.observations.length} 个开局。${result.next?'点击再次扫描可继续下一段。':'已到本次查询的链头。'} 只覆盖所选范围，单 RPC；发现记录不等于完整交易历史，续用前仍需读取会话。`);
});
window.addEventListener('storage',e=>{
 if(e.key===STORAGE_KEY){clearPreview();active=null;message('另一页面修改了待处理记录；请核验交易后继续');render();}
 if(e.key===HISTORY_KEY)renderHistory();
});
document.addEventListener('visibilitychange',()=>{if(document.hidden){clearPreview();render();}});
$('history-from').value=DEPLOYMENT_BLOCK.toString();
renderHistory();
