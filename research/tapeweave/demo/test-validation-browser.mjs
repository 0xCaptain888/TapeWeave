// Production form in real Chrome; clipboard is deliberately substituted, not OS permission evidence.
import {createServer} from 'node:http';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
import {runBrowser} from './browser-process.mjs';
const root=new URL('./',import.meta.url);
const fixture=`<script>
window.clipboardMode='reject';window.copied=null;window.releaseCopy=null;
Object.defineProperty(navigator,'clipboard',{value:{writeText:async value=>{
 if(window.clipboardMode==='delayed')await new Promise(r=>window.releaseCopy=r);
 if(window.clipboardMode==='reject')throw Error('fixture denied');window.copied=value;
}}});
</script>`;
const checks=`<script type="module">
const verdict=document.createElement('pre');verdict.id='verdict';document.body.append(verdict);
try{
 const form=document.getElementById('record-form'),fields=form.elements;
 const out=document.getElementById('output'),status=document.getElementById('status'),copy=document.getElementById('copy');
 const expect=(v,m)=>{if(!v)throw Error(m)},tick=()=>new Promise(r=>setTimeout(r,20));
 const set=(key,value)=>{fields[key].value=value;fields[key].dispatchEvent(new Event('input',{bubbles:true}))};
 const submit=()=>form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));
 await tick();expect(fields.result.value===''&&copy.disabled&&!out.value,'no default pass or export');
 for(const [k,v]of Object.entries({device:'Chrome author fixture, not mobile',prediction:'<img src=x onerror="window.injected=true">',actions:'0011 byte then plain',observed:'training 2, door 1, keys 1',help_and_failures:'clipboard substitute',kind:'independent-player',mode:'both',result:'fail'}))set(k,v);
 submit();expect(!out.value&&copy.disabled&&status.textContent,'consent required');
 fields.consent.checked=true;fields.consent.dispatchEvent(new Event('change',{bubbles:true}));submit();
 let record=JSON.parse(out.value);expect(record.authenticated===false&&record.chain_identity===null,'unverified record');
 expect(out.value.includes('fail')&&!window.injected&&!document.querySelector('img'),'failure retained and text not HTML');
 copy.click();await tick();expect(status.textContent.includes('手动复制')&&out.selectionEnd===out.value.length,'clipboard denial fallback');
 window.clipboardMode='success';copy.click();await tick();expect(window.copied===out.value&&status.textContent.includes('已复制'),'copy exact JSON');
 window.clipboardMode='delayed';copy.click();await tick();expect(window.releaseCopy,'delayed copy started');
 set('observed','new observation');expect(!out.value&&copy.disabled&&!status.textContent,'input invalidates JSON');
 window.releaseCopy();await tick();expect(!status.textContent,'stale clipboard result ignored');
 set('result','incomplete');submit();expect(JSON.parse(out.value).authenticated===false&&out.value.includes('incomplete'),'incomplete export');
 fields.mode.value='byte';fields.mode.dispatchEvent(new Event('change',{bubbles:true}));expect(!out.value&&copy.disabled,'select invalidates');
 set('kind','author-mobile');fields.consent.checked=false;submit();record=JSON.parse(out.value);expect(record.consent_reported===null,'author consent not claimed');
 localStorage.setItem('tw-validation-reload-check','fixture');
 const frame=document.createElement('iframe');
 await new Promise(resolve=>{frame.onload=resolve;frame.src='validation.html?clean';document.body.append(frame)});
 expect(!frame.contentDocument.getElementById('output').value&&frame.contentDocument.querySelector('[name=result]').value==='','fresh document does not restore record');
 localStorage.removeItem('tw-validation-reload-check');
 verdict.textContent='PASS validation browser fixture';
}catch(e){verdict.textContent='FAIL '+e.message;}
</script>`;
const files=new Set(['i18n.mjs','i18n-catalog.mjs','i18n.css','validation.html','validation-page.mjs','validation-record.mjs','style.css']);
const server=createServer(async(req,res)=>{try{
 const url=new URL(req.url,'http://localhost'),file=url.pathname.slice(1);
 if(!files.has(file)){res.writeHead(404);return res.end();}
 let text=await readFile(new URL(file,root),'utf8');
 if(file==='validation.html'&&!url.search)text=text.replace('<script type="module" src="validation-page.mjs"></script>',fixture+'<script type="module" src="validation-page.mjs"></script>'+checks);
 res.setHeader('Content-Type',file.endsWith('.mjs')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(text);
}catch{res.writeHead(500);res.end();}});
const dir=await mkdtemp(join(tmpdir(),'tw-validation-browser-'));
try{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const html=await runBrowser(process.env.CHROME??'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',['--headless=new','--no-first-run','--no-default-browser-check','--user-data-dir='+dir,'--virtual-time-budget=8000','--dump-dom',`http://127.0.0.1:${server.address().port}/validation.html`],{timeout:30000});
 const result=html.match(/<pre id="verdict">([^<]*)<\/pre>/)?.[1];
 assert.equal(result,'PASS validation browser fixture');
 console.log('PASS real Chrome manual record: consent, explicit outcomes, text safety, invalidation, fresh document, substituted clipboard and stale async result');
}finally{server.closeAllConnections();await new Promise(r=>server.close(r));await rm(dir,{recursive:true,force:true});}
