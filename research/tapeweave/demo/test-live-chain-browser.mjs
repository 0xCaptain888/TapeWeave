// Opt-in real public HTTPS page + real RPC. No substitutes, wallet or writes.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const origin='https://0xcaptain888.github.io';
if(process.env.TAPEWEAVE_LIVE_SMOKE!=='1')throw Error('Opt in with TAPEWEAVE_LIVE_SMOKE=1; this test reads public HTTPS and RPC');
const dir=await mkdtemp(join(tmpdir(),'tw-live-browser-'));
let chrome,socket;const pending=new Map(),methods=[];
try{
 chrome=spawn(process.env.CHROME??'/usr/bin/google-chrome',[
  '--headless=new','--no-first-run','--no-default-browser-check',
  '--remote-debugging-port=0','--user-data-dir='+dir,'about:blank',
 ],{detached:process.platform!=='win32',stdio:['ignore','ignore','pipe']});
 let stderr='',launchError;chrome.on('error',e=>launchError=e);
 chrome.stderr.on('data',data=>{stderr=(stderr+data).slice(-16384);});
 const pause=ms=>new Promise(r=>setTimeout(r,ms));
 const wait=async(fn,timeout=25000)=>{
  const until=Date.now()+timeout;
  while(Date.now()<until){
   if(launchError)throw launchError;
   if(chrome.exitCode!==null||chrome.signalCode!==null)throw Error('Chrome exited before public page verdict');
   const result=await fn();if(result)return result;
   await pause(100);
  }
  throw Error('Public page/UI timeout');
 };
 const endpoint=await wait(()=>stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/)?.[1]);
 const host=new URL(endpoint).host;
 const targets=await (await fetch(`http://${host}/json/list`)).json();
 socket=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);
 await new Promise((ok,fail)=>{socket.onopen=ok;socket.onerror=fail;});
 let serial=0;
 socket.onmessage=e=>{
  const message=JSON.parse(e.data);
  if(message.id){
   const p=pending.get(message.id);if(!p)return;
   clearTimeout(p.timer);pending.delete(message.id);
   message.error?p.reject(Error(message.error.message)):p.resolve(message.result);
  }else if(message.method==='Network.requestWillBeSent'){
   const request=message.params.request;
   if(request.url==='https://rpc.xlayer.tech/'&&request.method==='POST'&&request.postData){
    methods.push(JSON.parse(request.postData).method);
   }
  }
 };
 const cdp=(method,params={})=>new Promise((resolve,reject)=>{
  const id=++serial;
  const timer=setTimeout(()=>{pending.delete(id);reject(Error('CDP command timeout: '+method));},20000);
  pending.set(id,{resolve,reject,timer});socket.send(JSON.stringify({id,method,params}));
 });
 const evaluate=async expression=>{
  const r=await cdp('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});
  if(r.exceptionDetails)throw Error('Browser evaluation failed');
  return r.result.value;
 };
 await cdp('Network.enable');
 await cdp('Page.navigate',{url:origin+'/TapeWeave/research/tapeweave/demo/work.html'});
 await wait(()=>evaluate("!!document.querySelector('a[href=\"chain.html\"]')"));
 await cdp('Page.navigate',{url:origin+'/TapeWeave/research/tapeweave/demo/chain.html'});
 await wait(()=>evaluate("!!document.getElementById('card1') && !document.getElementById('card1').disabled"));
 assert.equal(await evaluate("document.querySelectorAll('#evidence-list a').length"),11);
 const snapshots=[];
 for(const [id,circuit]of [['card1',1],['card2',2]]){
  let snapshot;
  for(let attempt=0;attempt<4;attempt++){
   await evaluate(`document.getElementById('${id}').click()`);
   await wait(()=>evaluate("!document.getElementById('read').disabled"));
   const result=await evaluate("({status:document.getElementById('status').textContent,snapshot:document.getElementById('snapshot').textContent})");
   if(result.snapshot){snapshot=JSON.parse(result.snapshot);break;}
   if(attempt===3)throw Error('Public RPC read failed: '+result.status);
   await pause(2000*(attempt+1)); // Only retry read buttons; no state-changing API.
  }
  assert.equal(snapshot.verified_host,true);
  assert.equal(snapshot.matches_recorded_final_state,true);
  assert.equal(snapshot.snapshot.circuit,circuit);
  assert.equal(snapshot.snapshot.version,4);
  snapshots.push(snapshot);
 }
 const allowed=new Set(['eth_chainId','eth_blockNumber','eth_getBlockByNumber','eth_getCode','eth_call']);
 assert.ok(methods.length>=12,'observed real RPC requests');
 assert.ok(methods.every(m=>allowed.has(m)),'read-only RPC methods only');
 console.log(JSON.stringify({status:'LIVE_PUBLIC_DEMO_BROWSER_PASSED',
  page:origin+'/TapeWeave/research/tapeweave/demo/chain.html',
  real_https:true,real_rpc:true,fetch_substituted:false,wallet_used:false,
  rpc_methods:[...new Set(methods)],snapshots},null,2));
}finally{
 for(const p of pending.values()){clearTimeout(p.timer);p.reject(Error('Browser closing'));}
 socket?.close();
 if(chrome?.pid&&chrome.exitCode===null&&chrome.signalCode===null){
  try{process.kill(-chrome.pid,'SIGKILL');}catch{chrome.kill('SIGKILL');}
  await new Promise(r=>chrome.once('close',r));
 }
 await rm(dir,{recursive:true,force:true});
}
