// Production UI in real Chrome; author-controlled EIP-1193 and RPC fixtures.
// No wallet extension, signing, public RPC or mainnet writes.
import {createServer} from 'node:http';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
import {runBrowser} from './browser-process.mjs';
const root=new URL('./',import.meta.url),evidence=JSON.parse(await readFile(new URL('mainnet-evidence.json',root),'utf8'));
const fixture=`<script>
window.fixtureEvidence=${JSON.stringify(evidence).replaceAll('<','\\u003c')};
const word=n=>BigInt(n).toString(16).padStart(64,'0'),account='0x'+'12'.repeat(20),host=window.fixtureEvidence.host;
window.fixture={sendCount:0,chain:'0xc4',account,nonce:0,state:null,transaction:null,receipt:null,reject:false,badHash:false,handlers:new Map()};
const f=window.fixture,blockHash='0x'+'bb'.repeat(32);
function advance(s,t){
 const recharge=Number(s.version===0||s.version===2),step=old=>s.circuit===1?{latch:recharge|(old&(1-t)),request:old&t}:{latch:old^t,request:(1-old)&t};
 const a=step(s.training.latch),b=step(s.door.latch),effect=Number(b.request===1&&s.version%2===1&&s.door.resource>0);
 return {state:{...s,version:s.version+1,training:{latch:a.latch,score:s.training.score+a.request,resource:s.training.resource+a.request},door:{latch:b.latch,score:s.door.score+effect,resource:s.door.resource-effect}},a,b,effect};
}
const provider={on:(name,fn)=>f.handlers.set(name,fn),removeListener:(name,fn)=>{if(f.handlers.get(name)===fn)f.handlers.delete(name);},
 request:async({method,params})=>{
  if(method==='eth_chainId')return f.chain;
  if(method==='wallet_switchEthereumChain'){f.chain='0xc4';return null;}
  if(['eth_requestAccounts','eth_accounts'].includes(method))return [f.account];
  if(method!=='eth_sendTransaction')throw Error('unexpected provider method '+method);
  f.sendCount++;
  if(f.reject){f.reject=false;throw {code:4001};}
  const tx=params[0],hash='0x'+word(f.sendCount),open=tx.data.startsWith('0x56f6a897');
  const version=f.state?.version;
  let data,topics;
  if(open){
   f.state={player:f.account,circuit:Number(BigInt('0x'+tx.data.slice(10))),version:0,training:{latch:0,score:0,resource:0},door:{latch:0,score:0,resource:2}};
   data='0x'+word(f.state.circuit);topics=['0xcd79ecb8b02601f8233f68f1879a20f66616a11140945180a66d50282bf40726','0x'+word(3),'0x'+'0'.repeat(24)+f.account.slice(2)];
  }else{
   const trigger=Number(BigInt('0x'+tx.data.slice(-64))),a=advance(f.state,trigger);f.state=a.state;
   data='0x'+[version+1,trigger,a.a.request,a.b.request,a.effect].map(word).join('');
   topics=['0xb26d4ded5191059a26c7d19c74bac9188c71df7ea0c5cf9e0c6359b0b2be7476','0x'+word(3)];
  }
  f.transaction={...tx,hash,input:tx.data,blockHash,blockNumber:'0x10'};
  f.receipt={transactionHash:hash,from:f.account,to:host.toLowerCase(),status:'0x1',blockNumber:'0x10',blockHash,gasUsed:'0x186a0',effectiveGasPrice:'0x2',
   logs:[{address:host,transactionHash:hash,blockNumber:'0x10',blockHash,removed:false,logIndex:'0x0',topics,data}]};
  f.nonce++;if(f.badHash){f.badHash=false;return 'bad';}return hash;
 }};
window.addEventListener('eip6963:requestProvider',()=>window.dispatchEvent(new CustomEvent('eip6963:announceProvider',{detail:{info:{name:'<img src=x onerror=alert(1)> Mock Wallet'},provider}})));
window.fetch=async(url,options)=>{
 if(url==='mainnet-evidence.json')return new Response(JSON.stringify(window.fixtureEvidence));
 const q=JSON.parse(options.body),s=f.state??window.fixtureEvidence.proof.sessions[0].final_state;
 let result;
 switch(q.method){
  case 'eth_chainId':result='0xc4';break;
  case 'eth_blockNumber':result='0x11';break;
  case 'eth_getBlockByNumber':result={number:q.params[0],hash:blockHash};break;
  case 'eth_getCode':result=q.params[0].toLowerCase()===host.toLowerCase()?window.fixtureEvidence.expected_runtime:'0x';break;
  case 'eth_call':result=q.params[0].data.startsWith('0x83c4b7a3')?'0x'+'0'.repeat(24)+s.player.slice(2)+[s.circuit,s.version,s.training.latch,s.training.score,s.training.resource,s.door.latch,s.door.score,s.door.resource].map(word).join(''):q.params[0].data.startsWith('0x56f6a897')?'0x'+word(3):'0x';break;
  case 'eth_estimateGas':result='0x186a0';break;
  case 'eth_gasPrice':result='0x2';break;
  case 'eth_getTransactionCount':result='0x'+f.nonce.toString(16);break;
  case 'eth_getTransactionByHash':result=f.transaction;break;
  case 'eth_getTransactionReceipt':result=f.receipt;break;
  default:throw Error('unexpected fixture RPC '+q.method);
 }
 return new Response(JSON.stringify({jsonrpc:'2.0',id:1,result}));
};
</script>`;
const checks=`<script type="module">
const out=document.createElement('pre');out.id='wallet-verdict';document.body.append(out);
try{
 const $=id=>document.getElementById(id),f=window.fixture,expect=(v,m)=>{if(!v)throw Error(m)},tick=()=>new Promise(r=>setTimeout(r,10));
 const wait=async(fn)=>{for(let i=0;i<15000;i++){if(fn())return;await tick();}throw Error('wallet UI timeout: '+$('wallet-status').textContent);};
 const idle=()=>wait(()=>!$('wallet-connect').disabled);
 await wait(()=>$('wallet-provider').options.length===1);
 expect(!document.querySelector('#wallet-provider img'),'provider metadata is text');
 f.chain='0x61';$('wallet-connect').click();await idle();
 expect($('wallet-status').textContent.includes('X Layer'),'wrong network guidance');
 $('wallet-switch').click();await idle();$('wallet-connect').click();await idle();
 expect($('wallet-account').textContent.includes(f.account),'explicit wallet connection');
 expect(f.sendCount===0,'connection never sends');
 $('wallet-open').click();await idle();
 expect(!$('wallet-confirm').disabled&&$('wallet-preview').textContent.includes('0.00000000000024 OKB'),'fee preview exact');
 f.reject=true;$('wallet-confirm').click();await idle();
 expect(f.sendCount===1&&$('wallet-status').textContent.includes('取消签名'),'rejection shown without retry');
 $('wallet-open').click();await idle();$('wallet-confirm').click();await idle();
 expect(f.sendCount===2&&!$('wallet-pending').hidden,'pending saved after explicit confirmation');
 expect($('wallet-open').disabled,'duplicate open blocked');
 $('wallet-verify').click();await idle();
 expect($('wallet-session').value==='3'&&$('wallet-state').textContent.includes('0/4'),'receipt opens own session');
 for(const id of ['wallet-wait','wallet-wait','wallet-trigger','wallet-trigger']){
  $(id).click();await idle();expect(!$('wallet-confirm').disabled,'action simulated');
  $('wallet-confirm').click();await idle();$('wallet-verify').click();await idle();
 }
 expect(f.sendCount===6&&$('wallet-state').textContent.includes('4/4'),'four separately confirmed actions');
 expect($('wallet-state').textContent.includes('训练 2 分；开门 1 次'),'computed card outcome');
 expect($('wallet-trigger').disabled,'finished session cannot advance');
 $('wallet-circuit').value='2';$('wallet-circuit').dispatchEvent(new Event('input'));
 $('wallet-open').click();await idle();f.badHash=true;$('wallet-confirm').click();await idle();
 expect(!$('wallet-pending').hidden&&$('wallet-open').disabled,'unknown send blocks duplicate');
 $('wallet-hash').value=f.transaction.hash;$('wallet-recover').click();await idle();
 $('wallet-verify').click();await idle();expect($('wallet-state').textContent.includes('交替卡'),'unknown hash recovered and verified');
 const sends=f.sendCount;f.account='0x'+'34'.repeat(20);f.handlers.get('accountsChanged')?.([f.account]);
 expect($('wallet-account').textContent==='未连接钱包'&&$('wallet-open').disabled,'account event invalidates authority');
 expect(f.sendCount===sends,'no automatic send on change');
 out.textContent='PASS wallet browser fixture';
}catch(e){out.textContent='FAIL '+e.message;}
</script>`;
const files=new Set(['chain.html','chain-page.mjs','chain-host.mjs','chain-wallet-page.mjs','chain-wallet.mjs','style.css']);
const server=createServer(async(req,res)=>{try{
 const file=new URL(req.url,'http://localhost').pathname.slice(1);if(!files.has(file)){res.writeHead(404);return res.end();}
 let text=await readFile(new URL(file,root),'utf8');
 if(file==='chain.html')text=text.replace('<script type="module" src="chain-page.mjs"></script>',fixture+'<script type="module" src="chain-page.mjs"></script>')+checks;
 res.setHeader('Content-Type',file.endsWith('.mjs')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(text);
}catch{res.writeHead(500);res.end();}});
const dir=await mkdtemp(join(tmpdir(),'tw-wallet-browser-'));
try{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const html=await runBrowser(process.env.CHROME??'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ['--headless=new','--no-first-run','--no-default-browser-check','--user-data-dir='+dir,'--virtual-time-budget=100000','--dump-dom',`http://127.0.0.1:${server.address().port}/chain.html`],{timeout:110000});
 assert.match(html,/<pre id="wallet-verdict">PASS wallet browser fixture<\/pre>/);
 console.log('PASS real Chrome wallet UI: discovery, chain, preview, rejection, open + four steps, unknown-hash recovery, account change; substituted provider/RPC only');
}finally{server.closeAllConnections();await new Promise(r=>server.close(r));await rm(dir,{recursive:true,force:true});}
