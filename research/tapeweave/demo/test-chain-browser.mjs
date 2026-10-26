// Real Chrome running production page/modules, with author-controlled fetch substitutes.
// No external RPC, wallet, signing, mobile device or independent participant.
import {createServer} from 'node:http';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
import {runBrowser} from './browser-process.mjs';
const root=new URL('./',import.meta.url);
const evidence=JSON.parse(await readFile(new URL('mainnet-evidence.json',root),'utf8'));
const fixture=`<script>
window.fixtureEvidence=${JSON.stringify(evidence).replaceAll('<','\\u003c')};
const word=n=>BigInt(n).toString(16).padStart(64,'0');
window.rpcMode='success';window.releaseRPC=null;window.blockReads=0;
window.fetch=async(_url,options)=>{
 if(_url==='mainnet-evidence.json')return new Response(JSON.stringify(window.fixtureEvidence));
 const q=JSON.parse(options.body);if(window.rpcMode==='delayed')await new Promise(r=>window.releaseRPC=r);
 if(window.rpcMode==='failed')throw Error('fixture unavailable');
 const e=window.fixtureEvidence;
 const s=e.proof.sessions[q.method==='eth_call'&&BigInt('0x'+q.params[0].data.slice(10))===2n?1:0].final_state;
 const results={eth_chainId:'0xc4',eth_blockNumber:'0x123',
 eth_getBlockByNumber:{number:'0x123',hash:'0x'+((window.rpcMode==='reorg'&&++window.blockReads%2===0)?'bb':'aa').repeat(32)},
 eth_getCode:window.rpcMode==='wrongCode'?'0x00':e.expected_runtime,
 eth_call:'0x'+'0'.repeat(24)+s.player.slice(2)+[s.circuit,s.version,s.training.latch,s.training.score,s.training.resource,s.door.latch,s.door.score,s.door.resource].map(word).join('')};
 return new Response(JSON.stringify({jsonrpc:'2.0',id:1,result:results[q.method]}));
};
</script>`;
const checks=`<script type="module">
const out=document.createElement('pre');out.id='verdict';document.body.append(out);
try{
 const $=id=>document.getElementById(id),expect=(v,m)=>{if(!v)throw Error(m)},tick=()=>new Promise(r=>setTimeout(r,10));
 const wait=async(f)=>{for(let i=0;i<300;i++){if(f())return;await tick()}throw Error('fixture UI timeout')};
 await wait(()=>!$('card1').disabled);expect($('host').value===window.fixtureEvidence.host,'published deployment loaded');
 expect($('evidence-list').children.length===11,'all real transaction references displayed');
 $('card1').click();await wait(()=>!$('read').disabled);
 expect(JSON.parse($('snapshot').textContent).verified_host===true,'reviewed runtime verified');
 expect(JSON.parse($('snapshot').textContent).matches_recorded_final_state===true,'card one live fixture matches history');
 $('card2').click();await wait(()=>!$('read').disabled);
 expect(JSON.parse($('snapshot').textContent).snapshot.circuit===2,'second card selected');
 expect(JSON.parse($('snapshot').textContent).matches_recorded_final_state===true,'second card state matches');
 window.rpcMode='wrongCode';$('read').click();await wait(()=>!$('read').disabled);
 expect($('status').textContent.includes('运行时代码')&&!$('snapshot').textContent,'runtime mismatch rejected');
 window.rpcMode='reorg';window.blockReads=0;$('read').click();await wait(()=>!$('read').disabled);
 expect($('status').textContent.includes('区块发生变化')&&!$('snapshot').textContent,'canonical block change rejected');
 window.rpcMode='success';$('host').value='';
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
 console.log('PASS real Chrome chain page: published evidence, both sessions, runtime mismatch, reorg, draft invalidation, readonly failures and stale async rejection; substituted RPC only');
}finally{server.closeAllConnections();await new Promise(r=>server.close(r));await rm(dir,{recursive:true,force:true});}
