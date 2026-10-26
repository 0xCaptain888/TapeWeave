import {createServer} from 'node:http';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';import {join} from 'node:path';import assert from 'node:assert/strict';
import {runBrowser} from './browser-process.mjs';
const checks=`<script type="module">
const v=document.createElement('pre');v.id='verdict';document.body.append(v);
try{const $=id=>document.getElementById(id),wait=async f=>{for(let i=0;i<100;i++){if(f())return;await new Promise(r=>setTimeout(r,30));}throw Error('timeout')},expect=(x,m)=>{if(!x)throw Error(m)};
await wait(()=>$('rules').children.length===8);
$('build').click();await wait(()=>$('package').value);const first=$('package').value;
$('save').click();await wait(()=>$('library').textContent.includes('v1'));
$('name').value='second';$('name').dispatchEvent(new Event('input'));expect(!$('package').value,'edit clears');$('build').click();await wait(()=>$('package').value);$('save').click();await wait(()=>$('library').textContent.includes('v2'));
$('library').querySelector('button').click();expect($('package').value===first,'old version intact');
const {connectWork,makeAcceptance}=await import('./work.mjs');const p=await connectWork(first);p.step(0,{trigger:0,recharge:1});const r=await makeAcceptance(first,'byte',p.snapshot().trace,{result:'incomplete',note:'author fixture'});
$('record').value=JSON.stringify(r);$('verify').click();await wait(()=>$('verdict').textContent);expect($('verdict').textContent.includes('计算一致'),'verify');
$('record').value='{}';$('record').dispatchEvent(new Event('input'));expect(!$('verdict').textContent,'invalidate');$('verify').click();await wait(()=>$('verdict').textContent);expect($('verdict').textContent.includes('失败'),'reject');
const buttons=()=>[...$('library').querySelectorAll('button')];buttons().find(b=>b.textContent==='以v1为基准').click();buttons().find(b=>b.textContent==='比较v2').click();await wait(()=>$('comparison').textContent);expect($('comparison').textContent.includes('title'),'diff');buttons().find(b=>b.textContent==='回退至v1（追加）').click();await wait(()=>$('library').textContent.includes('v3'));$('backup').click();await wait(()=>$('archive').value);const archive=$('archive').value;localStorage.removeItem('tapeweave-work-library-v1');$('refresh').click();$('archive').value=archive;$('restore-library').click();await wait(()=>$('library').textContent.includes('v3'));$('restore-library').click();await wait(()=>$('status').textContent.includes('空作品库'));expect($('library').textContent.includes('v3'),'nonempty restore refused');
const s=$('rules').querySelector('select');s.value='1';s.dispatchEvent(new Event('change'));expect(!$('package').value,'rule clears');
v.textContent='PASS manage browser';}catch(e){v.textContent='FAIL '+e.message}
</script>`;
const files=new Set(['i18n.mjs','i18n-catalog.mjs','i18n.css','manage.html','manage-page.mjs','work-library.mjs','work.mjs','creator.mjs','creator-package.mjs','style.css','work.css']);
const server=createServer(async(req,res)=>{try{const name=new URL(req.url,'http://localhost').pathname.slice(1);if(!files.has(name)){res.writeHead(404);return res.end();}let text=await readFile(new URL(name,import.meta.url),'utf8');if(name==='manage.html')text=text.replace('</body>',checks+'</body>');res.setHeader('Content-Type',name.endsWith('.mjs')?'text/javascript':name.endsWith('.css')?'text/css':'text/html');res.end(text);}catch{res.writeHead(500);res.end();}});
const dir=await mkdtemp(join(tmpdir(),'tw-manage-'));
try{await new Promise(r=>server.listen(0,'127.0.0.1',r));const html=await runBrowser(process.env.CHROME??'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',['--headless=new','--no-first-run','--user-data-dir='+dir,'--virtual-time-budget=10000','--dump-dom',`http://127.0.0.1:${server.address().port}/manage.html`],{timeout:30000});assert.equal(html.match(/<pre id="verdict">([^<]*)<\/pre>/)?.[1],'PASS manage browser');console.log('PASS Chrome management editor/library/versions/acceptance; author fixture');}finally{server.closeAllConnections();await new Promise(r=>server.close(r));await rm(dir,{recursive:true,force:true});}
