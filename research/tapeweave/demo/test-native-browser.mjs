// Production HTML in Chrome; synthetic wallet/RPC only, never a real signature.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {runBrowser} from './browser-process.mjs';
const root=new URL('./',import.meta.url);
const evidence=JSON.parse(await readFile(new URL('mainnet-evidence.json',root),'utf8'));
const fixture=`<script>
const evidence=${JSON.stringify(evidence).replaceAll('<','\\u003c')};
const word=n=>BigInt(n).toString(16).padStart(64,'0'),hex=n=>'0x'+BigInt(n).toString(16),
 account='0x'+'12'.repeat(20),host=evidence.host,entry='0x0000000071727de22e5e9d8baf0edac6f37da032',
 blockHash='0x'+'bb'.repeat(32);
const f=window.fixture={account,chain:'0xc4',atomic:'unsupported',head:256n,sends:0,reject:false,handlers:new Map(),receipt:null,tx:null,state:null,request:null};
const parent=window.parent!==window&&window.parent.fixture;
if(parent)for(const key of ['account','head','receipt','tx','state','request'])f[key]=structuredClone(parent[key]);
const provider={on:(n,fn)=>f.handlers.set(n,fn),removeListener:(n,fn)=>{if(f.handlers.get(n)===fn)f.handlers.delete(n);},
 request:async({method,params})=>{
  if(['eth_requestAccounts','eth_accounts'].includes(method))return [f.account];
  if(method==='eth_chainId')return f.chain;
  if(method==='wallet_switchEthereumChain'){f.chain='0xc4';return null;}
  if(method==='wallet_getCapabilities')return {'0xc4':{atomic:{status:f.atomic}}};
  if(method==='wallet_getCallsStatus')return {id:f.request,version:'2.0.0',chainId:'0xc4',atomic:true,status:200,receipts:[{transactionHash:f.tx.hash}]};
  if(method!=='wallet_sendCalls')throw Error('unexpected provider method '+method);
  f.sends++;
  const batch=params[0],p=JSON.parse(localStorage.getItem('tapeweave-native-pending-v1'));
  if(!p||p.id!==batch.id||batch.from!==account||batch.version!=='2.0.0'||!batch.atomicRequired||batch.chainId!=='0xc4'||
   batch.calls.length!==1||JSON.stringify(batch.calls[0])!==JSON.stringify(p.call))throw Error('bad wallet dispatch');
  if(f.reject){f.reject=false;throw {code:4001};}
  f.request=batch.id;
  const number=hex(++f.head),hash='0x'+word(f.sends),txdata=batch.calls[0].data,open=p.operation==='open';
  let topics,data;
  if(open){
   f.state={player:account,circuit:p.circuit,version:0,training:{latch:0,score:0,resource:0},door:{latch:0,score:0,resource:2}};
   topics=['0xcd79ecb8b02601f8233f68f1879a20f66616a11140945180a66d50282bf40726','0x'+word(3),'0x'+'0'.repeat(24)+account.slice(2)];data='0x'+word(p.circuit);
  }else{
   const s=p.before,t=Number(p.trigger),recharge=Number(s.version===0||s.version===2),
    step=old=>s.circuit===1?{latch:recharge|(old&(1-t)),request:old&t}:{latch:old^t,request:(1-old)&t},
    a=step(s.training.latch),b=step(s.door.latch),effect=Number(b.request&&s.version%2===1&&s.door.resource>0);
   f.state={...s,version:s.version+1,training:{latch:a.latch,score:s.training.score+a.request,resource:s.training.resource+a.request},door:{latch:b.latch,score:s.door.score+effect,resource:s.door.resource-effect}};
   topics=['0xb26d4ded5191059a26c7d19c74bac9188c71df7ea0c5cf9e0c6359b0b2be7476','0x'+word(3)];
   data='0x'+[s.version+1,t,a.request,b.request,effect].map(word).join('');
  }
  const base={transactionHash:hash,blockNumber:number,blockHash,removed:false};
  f.tx={hash,to:entry,chainId:'0xc4',blockHash,blockNumber:number,input:txdata};
  f.receipt={...base,to:entry,status:'0x1',gasUsed:'0x100',effectiveGasPrice:'0x2',logs:[
   {...base,address:entry,logIndex:'0x1',topics:['0xbb47ee3e183a558b1a2ff0874b079f3fc5478b7454eacf2bfc5af2ff5878f972'],data:'0x'},
   {...base,address:host,logIndex:'0x2',topics,data},
   {...base,address:entry,logIndex:'0x3',topics:['0x49628fd1471006c1482da88028e9ce4dbb080b815c9b0344d39e5a8e6ec1419f','0x'+word(50+f.sends),'0x'+'0'.repeat(24)+account.slice(2),'0x'+word(0)],data:'0x'+[0,1,32,16].map(word).join('')},
  ]};f.head++;return {id:batch.id};
 }};
window.addEventListener('eip6963:requestProvider',()=>window.dispatchEvent(new CustomEvent('eip6963:announceProvider',{detail:{info:{name:'<img src=x> Fixture AA'},provider}})));
window.fetch=async(url,options)=>{
 const q=JSON.parse(options.body);let result;
 switch(q.method){
  case 'eth_chainId':result='0xc4';break;
  case 'eth_blockNumber':result=hex(f.head);break;
  case 'eth_getBlockByNumber':result={number:q.params[0],hash:blockHash};break;
  case 'eth_getCode':result=q.params[0].toLowerCase()===host.toLowerCase()?evidence.expected_runtime:'0x1234';break;
  case 'eth_call':
   if(q.params[0].data.startsWith('0x83c4b7a3')){
    const s=f.state;result='0x'+'0'.repeat(24)+s.player.slice(2)+[s.circuit,s.version,s.training.latch,s.training.score,s.training.resource,s.door.latch,s.door.score,s.door.resource].map(word).join('');
   }else result=q.params[0].data.startsWith('0x56f6a897')?'0x'+word(3):'0x';break;
  case 'eth_getTransactionReceipt':result=f.receipt;break;
  case 'eth_getTransactionByHash':result=f.tx;break;
  default:throw Error('unexpected fixture RPC '+q.method);
 }
 return new Response(JSON.stringify({jsonrpc:'2.0',id:1,result}));
};
</script>`;
const checks=`<script type="module">
const out=document.createElement('pre');out.id='native-verdict';document.body.append(out);
try{
 const $=id=>document.getElementById('native-'+id),f=window.fixture,expect=(v,m)=>{if(!v)throw Error(m)},
 wait=async(fn)=>{for(let i=0;i<12000;i++){if(fn())return;await new Promise(r=>setTimeout(r,10));}throw Error('UI timeout: '+$('status').textContent);},
 idle=()=>wait(()=>!$('connect').disabled);
 await wait(()=>$('provider').options.length===1);
 expect(!document.querySelector('#native-provider img'),'provider metadata as text');
 expect(f.sends===0&&$('open').disabled&&$('confirm').disabled,'no implicit authority');
 $('diagnose').click();await idle();
 expect(JSON.parse($('diagnostic').value).status==='unsupported'&&f.sends===0,'read-only unsupported diagnosis');
 let copiedDiagnostic='';Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{copiedDiagnostic=text;}}});
 $('diagnostic-copy').click();await idle();
 expect(copiedDiagnostic===$('diagnostic').value&&JSON.parse(copiedDiagnostic).signatureRequested===false,'diagnostic copy stays read-only');
 $('connect').click();await idle();
 expect($('status').textContent.includes('未声明')&&$('open').disabled,'unsupported stops and disconnects');
 f.atomic='ready';$('connect').click();await idle();
 expect($('status').textContent.includes('升级')&&$('open').disabled&&f.sends===0,'no auto upgrade');
 f.atomic='supported';f.chain='0x61';$('connect').click();await idle();
 expect($('status').textContent.includes('X Layer')&&$('open').disabled,'wrong chain stopped');
 $('switch').click();await idle();$('connect').click();await idle();
 expect($('account').textContent.includes(f.account)&&f.sends===0,'explicit capable connection');
 $('diagnose').click();await idle();
 expect(JSON.parse($('diagnostic').value).status==='ready'&&JSON.parse($('diagnostic').value).acceptancePassed===false,'compatible diagnosis is not acceptance');
 localStorage.setItem('tapeweave-wallet-pending-v1','{}');window.dispatchEvent(new StorageEvent('storage',{key:'tapeweave-wallet-pending-v1'}));
 expect($('open').disabled,'EOA pending blocks AA');
 localStorage.removeItem('tapeweave-wallet-pending-v1');window.dispatchEvent(new StorageEvent('storage',{key:'tapeweave-wallet-pending-v1'}));
 $('open').click();await idle();
 expect($('preview').textContent.includes('完整 UserOperation')&&$('confirm').disabled,'internal simulation not full UOP and fee ack required');
 $('fee-ack').checked=true;$('fee-ack').dispatchEvent(new Event('change'));f.reject=true;$('confirm').click();await idle();
 expect(f.sends===1&&$('status').textContent.includes('拒绝')&&!localStorage.getItem('tapeweave-native-pending-v1'),'explicit refusal no retry');
 $('open').click();await idle();$('fee-ack').checked=true;$('fee-ack').dispatchEvent(new Event('change'));$('confirm').click();await idle();
 expect(f.sends===2&&$('open').disabled&&JSON.parse(localStorage.getItem('tapeweave-native-pending-v1')).id===f.request,'persisted request and duplicate lock');
 const frame=document.createElement('iframe');frame.src='/native.html?restored=1';document.body.append(frame);
 await wait(()=>frame.contentDocument?.getElementById('restored-verdict')?.textContent);
 expect(frame.contentDocument.getElementById('restored-verdict').textContent==='PASS native refresh','fresh document recovery without connect or send');
 frame.remove();
 window.dispatchEvent(new StorageEvent('storage',{key:'tapeweave-native-pending-v1'}));
 $('session').value='3';$('read').click();await idle();
 expect($('state').textContent.includes('0/4'),'own session re-read');
 $('wait').click();await idle();$('fee-ack').checked=true;$('fee-ack').dispatchEvent(new Event('change'));$('confirm').click();await idle();
 $('lookup').click();await idle();expect(!$('verify').disabled,'wallet status only binds candidate');
 $('verify').click();await idle();
 expect($('state').textContent.includes('1/4')&&!localStorage.getItem('tapeweave-native-pending-v1'),'successful UOP journals before clearing');
 $('export').click();await idle();
 expect(JSON.parse($('archive').value).entries.length===2,'public AA journal export');
 $('wait').click();await idle();f.handlers.get('accountsChanged')?.(['0x'+'34'.repeat(20)]);
 expect($('confirm').disabled&&$('open').disabled&&!$('preview').textContent&&f.sends===3,'account change invalidates preview without send');
 expect(!$('diagnostic').value&&$('diagnostic-copy').disabled,'account change clears diagnostic');
 const widths=[];
 for(const width of [320,390]){
  const frame=document.createElement('iframe');frame.style.cssText='border:0;width:'+width+'px;height:900px;max-width:none';frame.src='/native.html?layout=1';document.body.append(frame);
  await wait(()=>frame.contentDocument?.getElementById('native-connect')&&!frame.contentDocument.getElementById('native-connect').disabled);
  expect(frame.contentWindow.innerWidth===width&&frame.contentDocument.documentElement.scrollWidth<=width,'AA narrow layout '+width);widths.push(width);frame.remove();
 }
 out.textContent='PASS native browser fixture '+widths.join(',');
}catch(e){out.textContent='FAIL '+e.message;}
</script>`;
const restored=`<script type="module">
const out=document.createElement('pre');out.id='restored-verdict';document.body.append(out);
try{
 const $=id=>document.getElementById('native-'+id),wait=async(fn)=>{for(let i=0;i<6000;i++){if(fn())return;await new Promise(r=>setTimeout(r,10));}throw Error('restore timeout');};
 await wait(()=>!$('connect').disabled);
 if(!$('open').disabled||$('account').textContent!=='未连接钱包')throw Error('refresh silently connected');
 $('hash').value=window.fixture.tx.hash;$('recover').click();await wait(()=>!$('connect').disabled);
 if($('verify').disabled)throw Error('hash not bound');
 $('verify').click();await wait(()=>!$('connect').disabled);
 if(!JSON.parse($('result').textContent).userOperationHash||window.fixture.sends!==0)throw Error('refresh recovery failed');
 out.textContent='PASS native refresh';
}catch(e){out.textContent='FAIL '+e.message;}
</script>`;
const files=new Set(['native.html','native-page.mjs','native-wallet.mjs','native-diagnostics.mjs','chain-host.mjs','chain-wallet.mjs','style.css']);
const server=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost'),file=url.pathname.slice(1);
  if(!files.has(file)){res.writeHead(404);return res.end();}
  let text=await readFile(new URL(file,root),'utf8');
  if(file==='native.html')text=text.replace('<script type="module" src="native-page.mjs',fixture+'<script type="module" src="native-page.mjs')+
   (url.searchParams.has('restored')?restored:url.searchParams.has('layout')?'':checks);
  res.setHeader('Content-Type',file.endsWith('.mjs')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(text);
 }catch(e){res.writeHead(500);res.end('fixture failure');}
});
const dir=await mkdtemp(join(tmpdir(),'tw-native-browser-'));
try{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const html=await runBrowser(process.env.CHROME??'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ['--headless=new','--no-first-run','--no-default-browser-check','--user-data-dir='+dir,'--virtual-time-budget=100000','--dump-dom',`http://127.0.0.1:${server.address().port}/native.html`],{timeout:110000});
 const verdict=html.match(/<pre id="native-verdict">([^<]*)<\/pre>/)?.[1];
 assert.equal(verdict,'PASS native browser fixture 320,390',verdict??'AA browser verdict missing');
 console.log('PASS actual Chrome AA UI: capability gate, fee acknowledgement, refusal, one dispatch, refresh recovery, UOP journal, account change, 320/390 layout; synthetic wallet/RPC only');
}finally{server.closeAllConnections();await new Promise(r=>server.close(r));await rm(dir,{recursive:true,force:true});}
