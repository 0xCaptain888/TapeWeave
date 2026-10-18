// Local browser fixture, NOT the full TapeKit client or an RPC/X Layer test.
// node research/tapespec/browser_session_probe.mjs
// Requires local Chrome; no packages, wallet, remote requests, or downloads.
import assert from 'node:assert/strict';
import http from 'node:http';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';

const probe = await readFile(new URL('./site_handle_probe.mjs', import.meta.url), 'utf8');
const source = probe.split('const siteForSource = `')[1]?.split('`;')[0];
assert.ok(source?.startsWith('async function siteFor('));
// Function copyright: TapeOutProtocol, MIT; see vendor-tapekit-license.txt.
// All surrounding dispatch, clock, kernel, HTML and script are our fixture.
const sw = `
let now = 1000000, block = 'V1';
const Date = { now: () => now };
const sites = new Map(), HANDLE_MAX_AGE = 120000, settings = {devPreview:false};
const kernel = {
 resolve: async () => ({block, status:'ok'}),
 openSite: async res => ({get: async path => res.block})
};
${source}
self.addEventListener('install', e => e.waitUntil(self.skipWaiting()));
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('message', e => e.waitUntil((async () => {
 const m=e.data;
 if(m.reset){sites.clear();now=1000000;block='V1';}
 if(m.block)block=m.block;
 if(m.elapsed)now+=m.elapsed;
 e.ports[0].postMessage('ok');
})()));
self.addEventListener('fetch', e => {
 const u=new URL(e.request.url);
 if(!['/document','/late.js'].includes(u.pathname))return;
 e.respondWith((async()=>{
  const h=await siteFor('fixture.tape',{fresh:u.searchParams.has('tape-reload')&&e.request.mode==='navigate'});
  const v=await h.site.get(u.pathname);
  const body=u.pathname==='/document'
   ? '<!doctype html><title>'+v+'</title><body data-version="'+v+'">'+v+'</body>'
   : 'globalThis.loadedVersion='+JSON.stringify(v)+';';
  return new Response(body,{headers:{'content-type':u.pathname==='/document'?'text/html':'application/javascript',
   'cache-control':'no-cache','content-security-policy':"default-src 'self'; script-src 'self'",'x-fixture-block':h.res.block}});
 })());
});`;
const server = http.createServer((req, res) => {
  res.setHeader('cache-control', 'no-store');
  if (req.url === '/sw.js') {res.setHeader('content-type', 'application/javascript');res.end(sw);}
  else if (req.url === '/boot') {res.setHeader('content-type', 'text/html');res.end('<!doctype html><title>fixture bootstrap</title>');}
  else {res.statusCode=404;res.end('fixture route missing');}
});
const profile = await mkdtemp(join(tmpdir(), 'tapespec-browser-'));
let chrome, ws;
const pending = new Map();
let seq = 0;
try {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const executable = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  chrome = spawn(executable, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`,
    '--no-first-run','--no-default-browser-check','--disable-extensions','--disable-background-networking','about:blank'], {stdio:['ignore','ignore','pipe']});
  const endpoint = await new Promise((resolve,reject) => {
    const timer=setTimeout(()=>reject(new Error('Chrome startup timeout')),15000);
    let text='';
    chrome.once('error',reject);
    chrome.once('exit',code=>{clearTimeout(timer);reject(new Error('Chrome exited '+code));});
    chrome.stderr.on('data',b=>{text+=b;const m=text.match(/DevTools listening on (ws:\/\/\S+)/);if(m){clearTimeout(timer);resolve(m[1]);}});
  });
  ws = new WebSocket(endpoint);
  await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});});
  ws.addEventListener('message',e=>{
    const m=JSON.parse(e.data); const p=pending.get(m.id);if(!p)return;
    pending.delete(m.id);clearTimeout(p.timer);m.error?p.reject(new Error(m.error.message)):p.resolve(m.result);
  });
  const send=(method,params={},sessionId)=>new Promise((resolve,reject)=>{
    const id=++seq;const timer=setTimeout(()=>{pending.delete(id);reject(new Error('CDP timeout '+method));},15000);
    pending.set(id,{resolve,reject,timer});ws.send(JSON.stringify({id,method,params,sessionId}));
  });
  const newTab=async()=>{
    const {targetId}=await send('Target.createTarget',{url:'about:blank'});
    const {sessionId}=await send('Target.attachToTarget',{targetId,flatten:true});
    await send('Page.enable',{},sessionId);await send('Runtime.enable',{},sessionId);
    await send('Network.enable',{},sessionId);
    return sessionId;
  };
  const evaluate=async(s,expression)=>{
    const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true},s);
    if(r.exceptionDetails)throw new Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);
    return r.result.value;
  };
  const wait=async(s,expr)=>{
    const end=Date.now()+10000;
    while(Date.now()<end){try{if(await evaluate(s,expr))return;}catch{}await new Promise(r=>setTimeout(r,50));}
    throw new Error('Page condition timeout: '+expr);
  };
  const navigate=async(s,path)=>{
    await send('Page.navigate',{url:origin+path},s);
    await wait(s,`location.pathname===${JSON.stringify(path.split('?')[0])} && document.readyState==='complete'`);
  };
  const tab=await newTab();await navigate(tab,'/boot');
  await evaluate(tab,`navigator.serviceWorker.register('/sw.js').then(()=>navigator.serviceWorker.ready).then(()=>true)`);
  await wait(tab,'!!navigator.serviceWorker.controller');
  const control=(s,m)=>evaluate(s,`new Promise(resolve=>{const c=new MessageChannel();c.port1.onmessage=()=>{c.port1.close();resolve(true)};navigator.serviceWorker.controller.postMessage(${JSON.stringify(m)},[c.port2])})`);
  const loadScript=s=>evaluate(s,`new Promise((resolve,reject)=>{globalThis.loadedVersion=null;const el=document.createElement('script');el.src='/late.js';el.onload=()=>resolve({html:document.body.dataset.version,script:globalThis.loadedVersion});el.onerror=()=>reject(new Error('script load failed'));document.head.appendChild(el)})`);
  const results=[];
  for(const cacheDisabled of [false,true]){
    await send('Network.setCacheDisabled',{cacheDisabled},tab);
    for(const [name,change,expected] of [
      ['no-update-after-expiry',{elapsed:120000},'V1'],
      ['new-version-before-expiry',{block:'V2',elapsed:119999},'V1'],
      ['new-version-at-expiry',{block:'V2',elapsed:120000},'V2'],
    ]){
      await control(tab,{reset:true});await navigate(tab,'/document');
      assert.equal(await evaluate(tab,'document.body.dataset.version'),'V1');
      await control(tab,change);
      const result=await loadScript(tab);
      assert.deepEqual(result,{html:'V1',script:expected});
      results.push({name,cacheDisabled,...result});
    }
  }
  // Real navigation in a second tab, same origin and shared Service Worker.
  await control(tab,{reset:true});await navigate(tab,'/document');
  await control(tab,{block:'V2',elapsed:1});
  const tab2=await newTab();await navigate(tab2,'/document?tape-reload=1');
  assert.equal(await evaluate(tab2,'document.body.dataset.version'),'V2');
  const firstTab=await loadScript(tab);
  assert.deepEqual(firstTab,{html:'V1',script:'V2'});
  results.push({name:'second-tab-fresh-navigation',...firstTab});
  console.log(JSON.stringify({evidence:'real-chrome-sw-fixture-with-upstream-siteFor-and-stub-kernel',
    browser:(await send('Browser.getVersion')).product,scenarios:results.length,results},null,2));
} finally {
  for(const p of pending.values()){clearTimeout(p.timer);p.reject(new Error('probe closing'));}
  pending.clear();
  ws?.close();
  if(chrome && chrome.exitCode===null){const exited=new Promise(r=>chrome.once('exit',r));chrome.kill();await exited;}
  await new Promise(r=>server.close(r));
  await rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:100});
}
