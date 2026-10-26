// Actual production form in desktop Chrome, not Android or wallet acceptance.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {runBrowser} from './browser-process.mjs';
const root=new URL('./',import.meta.url);
const checks=`<script type="module">
const out=document.createElement('pre');out.id='device-verdict';document.body.append(out);
try{
 const $=id=>document.getElementById('accept-'+id),expect=(v,m)=>{if(!v)throw Error(m)},
 wait=async(fn)=>{for(let i=0;i<1000;i++){if(fn())return;await new Promise(r=>setTimeout(r,10));}throw Error('form timeout');};
 await wait(()=>!$('export').disabled);
 expect($('items').querySelectorAll('select').length===9,'nine real-device tasks');
 expect([...$('items').querySelectorAll('select')].every(s=>s.value==='incomplete')&&!$('actual').checked,'nothing passes by default');
 $('export').click();expect(!$('output').value&&$('status').textContent.includes('设备'),'metadata required');
 $('device').value='Desktop fixture / Linux';$('browser').value='Chrome fixture';$('revision').value='abcdef0';$('export').click();
 expect(JSON.parse($('output').value).result==='incomplete'&&JSON.parse($('output').value).hardwareAttested===false,'incomplete export is explicit');
 $('device').dispatchEvent(new Event('input',{bubbles:true}));expect(!$('output').value&&$('copy').disabled,'edit invalidates report');
 const first=$('items').querySelector('select');first.value='pass';first.dispatchEvent(new Event('input',{bubbles:true}));$('export').click();
 expect(!$('output').value&&$('status').textContent.includes('观察'),'cannot pass without observations');
 $('note-touch').value='Synthetic UI test, not actual touch';$('save').click();
 $('kind').value='plugin';$('kind').dispatchEvent(new Event('change'));expect($('items').querySelectorAll('select').length===6,'plugin task set');
 $('restore').click();expect($('kind').value==='android'&&$('result-touch').value==='pass'&&$('note-touch').value.includes('Synthetic'),'validated draft restored');
 for(const select of $('items').querySelectorAll('select')){select.value='pass';document.getElementById(select.id.replace('result','note')).value='Synthetic UI checks only';}
 $('export').click();expect(!$('output').value&&$('status').textContent.includes('实际设备'),'all-pass requires actual device checkbox');
 for(const select of $('items').querySelectorAll('select'))select.value='incomplete';
 $('kind').value='native';$('kind').dispatchEvent(new Event('change'));
 $('result-send').value='pass';$('note-send').value='Synthetic fixture';
 $('export').click();expect(!$('output').value&&$('status').textContent.includes('哈希'),'chain pass requires transaction hash');
 $('result-send').value='incomplete';$('export').click();
 let copied='';Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async t=>{copied=t;}}});
 $('copy').click();await wait(()=>copied!=='');expect(copied===$('output').value,'exact report copy');
 navigator.clipboard.writeText=async()=>{throw Error('denied');};$('copy').click();await wait(()=>$('status').textContent.includes('手动复制'));
 expect($('output').selectionEnd===$('output').value.length,'copy refusal selects report');
 const widths=[];
 for(const width of [320,390]){
  const frame=document.createElement('iframe');frame.style.cssText='border:0;width:'+width+'px;height:900px;max-width:none';frame.src='/device-check.html?layout=1';document.body.append(frame);
  await wait(()=>frame.contentDocument?.getElementById('accept-export')&&!frame.contentDocument.getElementById('accept-export').disabled);
  expect(frame.contentWindow.innerWidth===width&&frame.contentDocument.documentElement.scrollWidth<=width,'form narrow layout '+width);
  for(const area of frame.contentDocument.querySelectorAll('textarea,input,select'))expect(area.getBoundingClientRect().right<=width,'form control overflow');
  widths.push(width);frame.remove();
 }
 out.textContent='PASS acceptance form '+widths.join(',');
}catch(e){out.textContent='FAIL '+e.message;}
</script>`;
const files=new Set(['device-check.html','device-check-page.mjs','device-acceptance.mjs','style.css']);
const server=createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost'),file=url.pathname.slice(1);
  if(!files.has(file)){res.writeHead(404);return res.end();}
  let text=await readFile(new URL(file,root),'utf8');
  if(file==='device-check.html'&&!url.searchParams.has('layout'))text+=checks;
  res.setHeader('Content-Type',file.endsWith('.mjs')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(text);
 }catch{res.writeHead(500);res.end();}
});
const dir=await mkdtemp(join(tmpdir(),'tw-device-browser-'));
try{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const html=await runBrowser(process.env.CHROME??'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ['--headless=new','--no-first-run','--no-default-browser-check','--user-data-dir='+dir,'--virtual-time-budget=15000','--dump-dom',`http://127.0.0.1:${server.address().port}/device-check.html`],{timeout:30000});
 const verdict=html.match(/<pre id="device-verdict">([^<]*)<\/pre>/)?.[1];
 assert.equal(verdict,'PASS acceptance form 320,390',verdict??'acceptance browser verdict missing');
 console.log('PASS actual Chrome acceptance UI: incomplete defaults, required observations/hash, draft restoration, copy refusal, 320/390 layout; no hardware or signing acceptance');
}finally{server.closeAllConnections();await new Promise(r=>server.close(r));await rm(dir,{recursive:true,force:true});}
