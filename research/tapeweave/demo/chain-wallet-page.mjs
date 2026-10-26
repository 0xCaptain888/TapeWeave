import {WalletRun,HOST,STORAGE_KEY,okb,quantity} from './chain-wallet.mjs';
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
const run=new WalletRun({rpc,storage:{
 getItem:key=>localStorage.getItem(key),setItem:(key,value)=>localStorage.setItem(key,value),
 removeItem:key=>localStorage.removeItem(key),
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
}
run.onchange=()=>{clearPreview();render();};
function showState(s){
 active=s;$('wallet-circuit').value=String(s.circuit);
 $('wallet-state').textContent=`会话 #${$('wallet-session').value} · ${s.circuit===1?'蓄能卡':'交替卡'} · ${s.version}/4 步\n训练 ${s.training.score} 分；开门 ${s.door.score} 次，剩 ${s.door.resource} 把钥匙${s.version===4?'\n本局完成。可以切换卡片后开始新局。':''}`;
}
async function task(fn){
 if(busy)return;busy=true;render();
 try{await fn();}catch(e){message(String(e.message??'操作失败').slice(0,500));}
 finally{busy=false;render();}
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
$('wallet-provider').onchange=()=>{cleanup();run.disconnect();active=null;clearPreview();render();};
$('wallet-connect').onclick=()=>task(async()=>{
 const provider=providers[Number($('wallet-provider').value)]?.provider;
 if(!provider)throw Error('未检测到钱包。请在安装了 OKX／MetaMask 插件的浏览器打开，或在钱包 DApp 浏览器打开本页');
 cleanup();active=null;clearPreview();await run.connect(provider);
 const changed=()=>{run.disconnect();active=null;clearPreview();message('钱包环境已改变，请重新连接；待处理记录仍保留');render();};
 for(const name of ['accountsChanged','chainChanged','disconnect'])provider.on?.(name,changed);
 cleanup=()=>{for(const name of ['accountsChanged','chainChanged','disconnect'])provider.removeListener?.(name,changed);};
 message('连接成功。选择卡片并预览开局，或填入属于你的会话 ID 恢复。每笔都需要单独确认。');
});
$('wallet-switch').onclick=()=>task(async()=>{
 const provider=providers[Number($('wallet-provider').value)]?.provider;
 if(!provider)throw Error('未检测到插件钱包');
 await provider.request({method:'wallet_switchEthereumChain',params:[{chainId:'0xc4'}]});
 run.disconnect();active=null;clearPreview();message('切网请求已完成，请重新连接钱包');
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
 if(!navigator.locks)throw Error('浏览器不支持安全的跨标签发送锁，请换用当前版本 Chrome／Edge');
 await navigator.locks.request('tapeweave-wallet-send',{ifAvailable:true},async lock=>{
  if(!lock)throw Error('另一标签页正在请求钱包，请等待并核验交易');
  message('正在重新预检并等待钱包确认；请勿关闭页面或重复发送');
  const p=await run.send();clearPreview();message('已发送。交易哈希已保存在本机，请点击“核验交易回执”：'+p.hash);
 });
});
$('wallet-verify').onclick=()=>task(async()=>{
 clearPreview();const result=await run.verify();
 if(result.pending){message(result.confirming?'已上链，等待至少两个区块深度后再次核验':'交易待确认；稍后再次核验，不会自动重发');return;}
 const a=document.createElement('a');a.href='https://www.oklink.com/xlayer/tx/'+result.hash;a.target='_blank';a.rel='noopener noreferrer';a.textContent=result.hash;
 $('wallet-receipt').replaceChildren(a);
 if(result.failed){message('交易已回滚，实付 gas '+okb(result.fee)+'。请重新读取状态后预览新操作。');return;}
 $('wallet-session').value=result.session;
 if(run.account===result.state.player)showState(result.state);else{active=null;$('wallet-state').textContent='已核验原账户会话 #'+result.session+'；连接对应账户后可续用';}
 message(`回执、事件与区块状态核验通过。实付 gas ${okb(result.fee)}。${result.laterActionsInBlock?'同块另有后续动作，展示的是块末状态。':''} 单 RPC；不是独立提供商共识。`);
});
$('wallet-recover').onclick=()=>task(async()=>{
 await run.recover($('wallet-hash').value.trim());message('交易哈希已与原账户、调用及 nonce 绑定，请核验回执');
});
window.addEventListener('storage',e=>{
 if(e.key===STORAGE_KEY){clearPreview();active=null;message('另一页面修改了待处理记录；请核验交易后继续');render();}
});
document.addEventListener('visibilitychange',()=>{if(document.hidden){clearPreview();render();}});
render();
