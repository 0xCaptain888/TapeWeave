// Actual production page in Chrome; author fixture, clipboard substitute, not independent use.
import {createServer} from 'node:http';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
import {runBrowser} from './browser-process.mjs';
const checks=`<script type="module">
const verdict=document.createElement('pre');verdict.id='verdict';document.body.append(verdict);
try{
const $=id=>document.getElementById(id),expect=(x,m)=>{if(!x)throw Error(m)},tick=()=>new Promise(r=>setTimeout(r,30));
const until=async f=>{for(let i=0;i<60;i++){if(f())return;await tick();}throw Error('UI timeout')};
const set=(id,v)=>{$(id).value=v;$(id).dispatchEvent(new Event('input',{bubbles:true}))};
Object.defineProperty(navigator,'clipboard',{value:{writeText:async()=>{throw Error('denied fixture')}}});
expect($('trigger').disabled&&!$('result').value,'initial state');
set('title','<img src=x onerror=alert(1)>');$('build').click();await until(()=>$('delivery').value);
const delivered=$('delivery').value;expect($('work-title').textContent.includes('<img')&&!document.querySelector('img'),'text only');
$('recharge').click();await tick();$('trigger').click();await tick();expect($('visual-effect').classList.contains('active'),'lamp effect');
const saved=localStorage.getItem('tapeweave-work-session-v1');expect(JSON.parse(saved).commands.length===2,'saved execution');$('resume').click();await tick();await tick();expect($('state').textContent.includes('第2步')&&$('visual-effect').classList.contains('active'),'resume replay');
const changed=JSON.parse(delivered);changed.title='Receiver v2';set('incoming',JSON.stringify(changed));$('review-upgrade').click();await until(()=>!$('apply-upgrade').disabled);expect($('upgrade-review').textContent.includes('"can_preserve": true'),'compatible review');$('upgrade-policy').value='preserve';$('apply-upgrade').click();await until(()=>$('work-title').textContent==='Receiver v2');expect($('state').textContent.includes('第2步')&&JSON.parse($('previous-session').value).work.title===JSON.parse(delivered).title,'preserved and backed up');
const different={...changed,scene:'reveal'};set('incoming',JSON.stringify(different));$('review-upgrade').click();await until(()=>!$('apply-upgrade').disabled);$('upgrade-policy').value='preserve';$('apply-upgrade').click();await tick();expect($('status').textContent.includes('只能显式')&&$('state').textContent.includes('第2步'),'incompatible rejected');$('upgrade-policy').value='restart';$('apply-upgrade').click();await until(()=>$('state').textContent.includes('第0步'));$('recharge').click();await tick();$('trigger').click();await tick();
set('incoming',delivered);$('load').click();await until(()=>$('work-title').textContent===JSON.parse(delivered).title);$('recharge').click();await tick();$('trigger').click();await tick();
$('trigger').click();await tick();expect(!$('visual-effect').classList.contains('active'),'consumed charge');
$('accept').click();await tick();expect(!$('acceptance').value,'no default pass');
set('result','fail');set('note','author test, not user evidence');$('accept').click();await until(()=>$('acceptance').value);
expect(JSON.parse($('acceptance').value).result==='fail','failure recorded');
set('note','changed');expect(!$('acceptance').value,'edited observation invalidates');
set('incoming','{}');const old=$('state').textContent;$('load').click();await tick();expect($('state').textContent===old,'failed import preserves player');
set('incoming',delivered);$('load').click();await until(()=>$('state').textContent.includes('第0步'));
$('mode').value='plain';$('mode').dispatchEvent(new Event('change'));await until(()=>!$('trigger').disabled);
$('recharge').click();await tick();$('trigger').click();await tick();expect($('visual-effect').classList.contains('active')&&$('state').textContent.includes('普通'),'plain parity');
set('scene','reveal');expect($('trigger').disabled&&!$('delivery').value,'edit disables stale preview');
$('build').click();await until(()=>$('delivery').value);$('recharge').click();await tick();$('trigger').click();await tick();$('wait').click();await tick();expect($('visual-effect').textContent.includes('已揭开'),'persistent scene');
$('copy-work').click();await tick();expect($('status').textContent.includes('手动复制'),'clipboard fallback');
$('reset').click();await until(()=>$('state').textContent.includes('第0步'));expect(!$('visual-effect').classList.contains('active'),'reset effects');
localStorage.setItem('tapeweave-work-session-v1',saved);window.dispatchEvent(new Event('storage'));expect($('trigger').disabled,'external write stops player');$('resume').click();await tick();await tick();expect($('state').textContent.includes('第2步'),'external recovery');
set('title','');$('build').click();await tick();expect(!$('delivery').value&&$('trigger').disabled,'invalid build removes old delivery');
for(const width of [320,390]){const frame=document.createElement('iframe');frame.style.cssText='position:absolute;left:-5000px;border:0;width:'+width+'px;height:900px';const loaded=new Promise(r=>frame.onload=r);frame.src='work.html?layout=1';document.body.append(frame);await loaded;const doc=frame.contentDocument;expect(doc.documentElement.scrollWidth<=width,'work layout overflow '+width);expect(doc.querySelector('.work-preview').getBoundingClientRect().width<=width,'preview width '+width);frame.remove();}
verdict.textContent='PASS work browser';
}catch(e){verdict.textContent='FAIL '+e.message}
</script>`;
const files=new Set(['work.html','work-page.mjs','work.mjs','work-session.mjs','work-upgrade.mjs','work-library.mjs','work.css','style.css','creator.mjs','creator-package.mjs']);
const server=createServer(async(req,res)=>{try{const file=new URL(req.url,'http://localhost').pathname.slice(1);if(!files.has(file)){res.writeHead(404);return res.end();}let text=await readFile(new URL(file,import.meta.url),'utf8');if(file==='work.html'&&!req.url.includes('layout=1'))text=text.replace('</body>',checks+'</body>');res.setHeader('Content-Type',file.endsWith('.mjs')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(text);}catch{res.writeHead(500);res.end();}});
const dir=await mkdtemp(join(tmpdir(),'tw-work-browser-'));
try{await new Promise(r=>server.listen(0,'127.0.0.1',r));const html=await runBrowser(process.env.CHROME??'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',['--headless=new','--no-first-run','--no-default-browser-check','--user-data-dir='+dir,'--virtual-time-budget=10000','--dump-dom',`http://127.0.0.1:${server.address().port}/work.html`],{timeout:30000});assert.equal(html.match(/<pre id="verdict">([^<]*)<\/pre>/)?.[1],'PASS work browser');console.log('PASS work Chrome production page: create/import/play/plain/acceptance/reset/text safety/clipboard substitute');}finally{server.closeAllConnections();await new Promise(r=>server.close(r));await rm(dir,{recursive:true,force:true});}
