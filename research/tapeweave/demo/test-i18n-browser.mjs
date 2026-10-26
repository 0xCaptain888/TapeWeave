import {createServer}from'node:http';
import {readFile,mkdtemp,rm}from'node:fs/promises';
import {tmpdir}from'node:os';
import {join}from'node:path';
import assert from'node:assert/strict';
import {runBrowser}from'./browser-process.mjs';

const harness=`<!doctype html><html><head><meta charset="utf-8"></head><body><pre id="verdict">RUNNING</pre><iframe style="width:1280px;height:900px;border:0"></iframe><script type="module">
const frame=document.querySelector('iframe'),verdict=document.querySelector('#verdict');
const tick=()=>new Promise(r=>setTimeout(r,30));
const expect=(x,m)=>{if(!x)throw Error(m);};
async function until(fn){for(let i=0;i<250;i++){if(fn())return;await tick();}throw Error('timeout: '+fn);}
async function load(file){frame.src=file+'?lang=en';await new Promise(r=>frame.onload=r);await until(()=>frame.contentDocument.documentElement.lang==='en');await tick();return frame.contentDocument;}
try{
for(const file of ['work.html','manage.html','exhibit.html','chain.html','native.html','studio.html','index.html','validation.html','device-check.html','durable.html','local-work.html']){
 const doc=await load(file);expect(!/[\\u3400-\\u9fff]/u.test(doc.querySelector('h1').textContent),file+' heading');
 expect(doc.querySelector('[data-language=en]').getAttribute('aria-pressed')==='true',file+' selected language');
 for(const width of [320,390]){frame.style.width=width+'px';await tick();expect(doc.documentElement.scrollWidth<=width,file+' overflow '+width);}frame.style.width='1280px';
 const walker=doc.createTreeWalker(doc.body,NodeFilter.SHOW_TEXT),missing=[];
 while(walker.nextNode()){const n=walker.currentNode,p=n.parentElement;if(p.closest('script,style,textarea,input,code,[translate=no],#work-title,#work-description'))continue;if(/[\\u3400-\\u9fff]/u.test(n.data))missing.push(n.data);}
 expect(!missing.length,file+' untranslated: '+missing.join(' / '));
 doc.querySelector('[data-language=zh]').click();await until(()=>doc.documentElement.lang==='zh-CN');
 expect(/[\\u3400-\\u9fff]/u.test(doc.querySelector('h1').textContent),file+' Chinese restored');
 doc.querySelector('[data-language=en]').click();await until(()=>doc.documentElement.lang==='en');
}
let doc=await load('work.html');const $=id=>doc.getElementById(id);
$('title').value='我的自定义作品 / My custom work';$('description').value='补能后再触发 / My instructions';
$('build').click();await until(()=>$('delivery').value);const original=$('delivery').value;
expect(JSON.parse(original).title==='我的自定义作品 / My custom work','original title preserved');
$('recharge').click();await until(()=>$('state').textContent.includes('Step 1'));
$('trigger').click();await until(()=>$('state').textContent.includes('Step 2'));
expect($('visual-effect').textContent.includes('Lamp on'),'dynamic English effect');
const trace=$('trace').textContent,save=frame.contentWindow.localStorage.getItem('tapeweave-work-session-v1');
doc.querySelector('[data-language=zh]').click();await until(()=>$('state').textContent.includes('第2步'));
doc.querySelector('[data-language=en]').click();await until(()=>$('state').textContent.includes('Step 2'));
expect($('delivery').value===original&&$('trace').textContent===trace,'switch preserves package and trace');
expect(frame.contentWindow.localStorage.getItem('tapeweave-work-session-v1')===save,'switch does not save or mutate execution');
expect($('title').value==='我的自定义作品 / My custom work'&&$('work-title').textContent===$('title').value,'user content not translated');
const broken=JSON.parse(original);broken.artifact.sha256='0'.repeat(64);$('incoming').value=JSON.stringify(broken);$('load').click();
await until(()=>$('status').textContent.includes('do not match'));expect($('trace').textContent===trace,'failed import preserves trace');
expect([...doc.querySelectorAll('a[href]')].filter(a=>a.origin===location.origin&&a.pathname.endsWith('.html')).every(a=>a.search.includes('lang=en')),'English links retain language');
for(const width of [320,390,1280]){frame.style.width=width+'px';await tick();expect(doc.documentElement.scrollWidth<=width,'layout overflow '+width);}
await new Promise(r=>frame.onload=r); // Installed below via a new navigation.
}catch(e){verdict.textContent='FAIL '+e.stack;}
</script></body></html>`;
// End the test with a real link-navigation check, not a synthetic stored value.
const script=harness.replace("await new Promise(r=>frame.onload=r); // Installed below via a new navigation.",`const navigation=new Promise(r=>frame.onload=r);frame.contentDocument.querySelector('a[href*="manage.html"]').click();await navigation;await until(()=>frame.contentDocument.documentElement.lang==='en');expect(frame.contentWindow.location.search.includes('lang=en'),'actual link navigation');verdict.textContent='PASS bilingual browser';`);
const server=createServer(async(req,res)=>{try{
  const path=new URL(req.url,'http://localhost').pathname.slice(1);
  if(path==='test.html'){res.setHeader('Content-Type','text/html');return res.end(script);}
  if(!/^[a-z0-9-]+\.(?:html|mjs|css|json|svg)$/.test(path)){res.writeHead(404);return res.end();}
  const data=await readFile(new URL(path,import.meta.url));
  res.setHeader('Content-Type',path.endsWith('.mjs')?'text/javascript':path.endsWith('.css')?'text/css':path.endsWith('.html')?'text/html':'application/json');res.end(data);
}catch{res.writeHead(404);res.end();}});
const dir=await mkdtemp(join(tmpdir(),'tw-i18n-browser-'));
try{
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
  const extra=process.env.TAPEWEAVE_SINGLE_PROCESS==='1'?['--no-sandbox','--single-process','--in-process-gpu','--disable-gpu']:[];
  const html=await runBrowser(process.env.CHROME??'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',['--headless=new',...extra,'--no-first-run','--no-default-browser-check','--user-data-dir='+dir,'--virtual-time-budget=45000','--dump-dom',`http://127.0.0.1:${server.address().port}/test.html`],{timeout:60000});
  assert.equal(html.match(/<pre id="verdict">([\s\S]*?)<\/pre>/)?.[1],'PASS bilingual browser');
  console.log('PASS bilingual Chrome: 11 pages, dynamic English, Chinese round trips, user data, state, navigation and 320/390px layouts');
}finally{server.closeAllConnections();await new Promise(r=>server.close(r));await rm(dir,{recursive:true,force:true});}
