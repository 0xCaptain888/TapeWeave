// Real Chrome running production page/modules, with author-controlled fetch substitutes.
// No external RPC, wallet, signing, mobile device or independent participant.
import {createServer} from 'node:http';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
import {runBrowser} from './browser-process.mjs';
const root=new URL('./',import.meta.url);
const fixture=`<script>
const word=n=>BigInt(n).toString(16).padStart(64,'0');
window.rpcMode='success';window.releaseRPC=null;
window.fetch=async(_url,options)=>{
 const q=JSON.parse(options.body);if(window.rpcMode==='delayed')await new Promise(r=>window.releaseRPC=r);
 if(window.rpcMode==='failed')throw Error('fixture unavailable');
 const results={eth_chainId:'0xc4',eth_blockNumber:'0x123',eth_getCode:'0x01',eth_call:'0x'+'0'.repeat(24)+'12'.repeat(20)+[1,4,0,2,2,0,1,1].map(word).join('')};
 return new Response(JSON.stringify({jsonrpc:'2.0',id:1,result:results[q.method]}));
};
</script>`;
const checks=`<script type="module">
const out=document.createElement('pre');out.id='verdict';document.body.append(out);
try{
 const $=id=>document.getElementById(id),expect=(v,m)=>{if(!v)throw Error(m)},tick=()=>new Promise(r=>setTimeout(r,10));
 const wait=async(f)=>{for(let i=0;i<300;i++){if(f())return;await tick()}throw Error('fixture UI timeout')};
 await tick();expect(!$('host').value,'no default deployment');
 $('plan').click();expect(!$('draft').value&&$('status').textContent.includes('非零'),'empty address rejection');
 $('host').value='0x'+'12'.repeat(20);$('plan').click();expect(JSON.parse($('draft').value).broadcast===false,'unsigned draft');
 $('version').dispatchEvent(new Event('input'));expect(!$('draft').value&&!$('status').textContent,'configuration invalidates draft');
 $('read').click();await wait(()=>!$('read').disabled);expect($('snapshot').textContent.includes('"verified_host": false'),'read is unverified');
 $('session').dispatchEvent(new Event('input'));expect(!$('snapshot').textContent,'configuration invalidates read');
 window.rpcMode='failed';$('read').click();await wait(()=>!$('read').disabled);expect($('status').textContent.includes('读取失败')&&!$('snapshot').textContent,'explicit RPC failure');
 window.rpcMode='delayed';$('read').click();await wait(()=>!!window.releaseRPC);
 $('host').value='0x'+'34'.repeat(20);$('host').dispatchEvent(new Event('input'));
 window.rpcMode='success';window.releaseRPC();await wait(()=>!$('read').disabled);
 expect(!$('snapshot').textContent&&!$('status').textContent,'stale response discarded');
 out.textContent='PASS chain browser fixture';
}catch(e){out.textContent='FAIL '+e.message;}
</script>`;
const files=new Set(['chain.html','chain-page.mjs','chain-host.mjs','style.css']);
const server=createServer(async(req,res)=>{try{
 const file=new URL(req.url,'http://localhost').pathname.slice(1);if(!files.has(file)){res.writeHead(404);return res.end();}
 let text=await readFile(new URL(file,root),'utf8');if(file==='chain.html')text=text.replace('<script type="module" src="chain-page.mjs"></script>',fixture+'<script type="module" src="chain-page.mjs"></script>'+checks);
 res.setHeader('Content-Type',file.endsWith('.mjs')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');res.end(text);
}catch{res.writeHead(500);res.end();}});
const dir=await mkdtemp(join(tmpdir(),'tw-chain-browser-'));
try{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const html=await runBrowser(process.env.CHROME??'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',['--headless=new','--no-first-run','--no-default-browser-check','--user-data-dir='+dir,'--virtual-time-budget=8000','--dump-dom',`http://127.0.0.1:${server.address().port}/chain.html`],{timeout:30000});
 assert.match(html,/<pre id="verdict">PASS chain browser fixture<\/pre>/);
 console.log('PASS real Chrome chain page: draft invalidation, readonly success/failure, stale async rejection; substituted RPC only');
}finally{server.closeAllConnections();await new Promise(r=>server.close(r));await rm(dir,{recursive:true,force:true});}
