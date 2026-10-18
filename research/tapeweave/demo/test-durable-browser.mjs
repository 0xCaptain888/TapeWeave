// Real Chrome DevTools test, no production test injection or CSP bypass.
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {startLocalServer} from './local-server.mjs';
import {createArtifact} from './creator-package.mjs';
import {presets} from './creator.mjs';
const dir=await mkdtemp(join(tmpdir(),'tw-browser-'));let app,chrome,socket;
try{
 app=await startLocalServer({database:join(dir,'test.sqlite')});
 chrome=spawn(process.env.CHROME??'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',['--headless=new','--no-first-run','--no-default-browser-check','--remote-debugging-port=0','--user-data-dir='+join(dir,'profile'),'about:blank'],{stdio:['ignore','ignore','pipe']});
 let stderr='';chrome.stderr.on('data',d=>{stderr+=d;});
 const wait=async(fn)=>{for(let i=0;i<400;i++){const value=await fn();if(value)return value;await new Promise(r=>setTimeout(r,50));}throw Error('Chrome/UI timeout');};
 const endpoint=await wait(()=>stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/)?.[1]);
 const host=new URL(endpoint).host;
 const targets=await (await fetch(`http://${host}/json/list`)).json();
 socket=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);
 await new Promise((ok,fail)=>{socket.onopen=ok;socket.onerror=fail;});
 let serial=0;const pending=new Map();
 socket.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);}};
 const cdp=(method,params={})=>new Promise((resolve,reject)=>{const id=++serial;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});
 const evaluate=async(expression)=>{const r=await cdp('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
 await cdp('Page.navigate',{url:app.url});await wait(()=>evaluate("!!document.getElementById('create') && !document.getElementById('create').disabled"));
 const artifact=await createArtifact(presets.pulse.next,presets.pulse.request);
 for(const plain of [false,true]){
  await evaluate(`document.getElementById('session').value=${JSON.stringify(plain?'plain':'byte')};document.getElementById('mode').value=${JSON.stringify(plain?'plain':'byte')};document.getElementById('artifact').value=${JSON.stringify(JSON.stringify(artifact))};document.getElementById('create').click()`);
  await wait(()=>evaluate("!document.getElementById('wait').disabled"));
  for(const [i,id] of ['wait','wait','fire','fire'].entries()){
   await evaluate(`document.getElementById('${id}').click()`);
   await wait(()=>evaluate(`document.getElementById('summary').textContent.includes('版本 ${i+1}/4') && !document.getElementById('load').disabled`));
  }
  assert.equal(await evaluate("document.getElementById('trace').rows.length"),8);
  assert.ok(await evaluate("document.getElementById('summary').textContent.includes('训练: 得分 2') && document.getElementById('summary').textContent.includes('门: 得分 1 · 资源 1')"));
  await evaluate("document.getElementById('export').click()");await wait(()=>evaluate("!!document.getElementById('replay').value"));
  assert.equal(await evaluate("JSON.parse(document.getElementById('replay').value).plain"),plain);
  await cdp('Page.reload');await wait(()=>evaluate("!!document.getElementById('summary') && document.getElementById('summary').textContent.includes('版本 4/4')"));
  assert.equal(await evaluate("document.getElementById('trace').rows.length"),8);
 }
 // Simulate a committed request whose receipt was lost before the UI acknowledged it.
 await evaluate(`document.getElementById('session').value='retrycase';document.getElementById('artifact').value=${JSON.stringify(JSON.stringify(artifact))};document.getElementById('create').click()`);
 await wait(()=>evaluate("!document.getElementById('wait').disabled"));
 await evaluate(`(async()=>{const key='tapeweave-durable-ui-v1',r=JSON.parse(sessionStorage.getItem(key));r.pending={session:'retrycase',command:{id:'lost_receipt',version:0,trigger:0}};sessionStorage.setItem(key,JSON.stringify(r));const response=await fetch('/api/act',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+r.token},body:JSON.stringify(r.pending)});if(!response.ok)throw Error('setup failed');})()`);
 await cdp('Page.reload');await wait(()=>evaluate("!!document.getElementById('retry') && !document.getElementById('retry').disabled"));
 assert.ok(await evaluate("document.getElementById('wait').disabled"));
 await evaluate("document.getElementById('retry').click()");
 await wait(()=>evaluate("!document.getElementById('wait').disabled"));
 assert.ok(await evaluate("document.getElementById('summary').textContent.includes('版本 1/4')"));
 assert.equal(await evaluate("document.getElementById('trace').rows.length"),2);
 await evaluate("document.getElementById('list').click()");
 await wait(()=>evaluate("document.querySelectorAll('#sessions button').length===3 && !document.getElementById('list').disabled"));
 assert.ok(await evaluate("document.getElementById('sessions').textContent.includes('byte · 4/4 · 字节求值') && document.getElementById('sessions').textContent.includes('plain · 4/4 · 普通共享真值表')"));
 await evaluate("document.querySelector('#sessions button').click()");
 await wait(()=>evaluate("document.getElementById('summary').textContent.includes('会话 byte · 版本 4/4') && !document.getElementById('load').disabled"));
 assert.equal(await evaluate("document.getElementById('session').value"),'byte');
 assert.equal(await evaluate("document.getElementById('trace').rows.length"),8);
 // Small viewport, with real top-level navigation (framing deliberately denied).
 await cdp('Emulation.setDeviceMetricsOverride',{width:320,height:900,deviceScaleFactor:1,mobile:false});
 assert.ok(await evaluate('document.documentElement.scrollWidth<=320'));
 console.log('PASS real Chrome durable UI: byte/plain import, four actions, traces, export, refresh recovery, 320px layout; not mobile/touch or independent adoption');
}finally{
 socket?.close();if(chrome && chrome.exitCode===null){chrome.kill('SIGKILL');await new Promise(r=>chrome.once('close',r));}
 await app?.close();await rm(dir,{recursive:true,force:true});
}
