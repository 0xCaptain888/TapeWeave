// Author-controlled real Chrome UI check; not a player study or platform preview test.
import assert from 'node:assert/strict';
import http from 'node:http';
import {readFile, mkdtemp, rm} from 'node:fs/promises';
import {runBrowser} from './browser-process.mjs';
import {tmpdir} from 'node:os';
import {join, resolve, extname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const studio = process.argv[2] === '--studio';
if (process.argv.length > (studio ? 3 : 2)) throw Error('usage: browser-check.mjs [--studio]');
const target = studio ? 'studio.html' : 'index.html';
const layoutChecks = `
 const layoutWidths=[];
 for(const width of [390,320]){
  const narrow=document.createElement('iframe');narrow.style.cssText='display:block;border:0;width:'+width+'px;height:900px;max-width:none';narrow.src='${target}?restore=1';document.body.append(narrow);
  await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('narrow document load timeout')),5000);narrow.onload=()=>{clearTimeout(timer);resolve()}});
  const doc=narrow.contentDocument;
  expect(narrow.contentWindow.innerWidth===width,'narrow iframe viewport');
  expect(doc.documentElement.scrollWidth<=width,'page horizontal overflow at '+width);
  for(const area of doc.querySelectorAll('textarea')){
   expect(area.getBoundingClientRect().right<=width,'textarea overflow at '+width);
   expect(area.labels.length>0||area.getAttribute('aria-label'),'textarea accessible name');
  }
  layoutWidths.push(width);narrow.remove();
 }
`;
const studioChecks = `
<script type="module">
const out=document.createElement('pre');out.id='browser-check';document.body.append(out);
try {
 const $=id=>document.getElementById(id);
 const expect=(ok,msg)=>{if(!ok)throw Error(msg)};
 const ready=async()=>{for(let i=0;i<200 && !$('artifact').value;i++)await new Promise(r=>setTimeout(r,10));expect(!!$('artifact').value,'compile timeout')};
 await ready();
 $('preset').value='pulse';$('preset').dispatchEvent(new Event('change'));await ready();
 const artifact=JSON.parse($('artifact').value);
 const savedBeforeProbe=localStorage.getItem('tapeweave-studio-local-v1'),visualBeforeProbe=$('visual').textContent;
 $('probe-old').value='0';$('probe-trigger').value='1';$('probe-recharge').value='1';$('probe').click();
 expect($('probe-result').textContent.includes('下一状态1 / 请求0'),'probe old state timing');
 expect(localStorage.getItem('tapeweave-studio-local-v1')===savedBeforeProbe && $('visual').textContent===visualBeforeProbe,'probe does not commit');
 $('probe-old').value='1';$('probe-old').dispatchEvent(new Event('change'));
 expect(!$('probe-result').textContent,'probe input clears result');
 $('probe').click();expect($('probe-result').textContent.includes('下一状态1 / 请求1'),'probe charged request');
 expect(artifact.chain_identity===null && artifact.sha256.length===64,'local identity');
 for(const id of ['wait','wait','fire','fire'])$(id).click();
 expect($('visual').textContent.includes('效果累计2') && $('visual').textContent.includes('效果累计1') && $('visual').textContent.includes('剩余钥匙1'),'dual host effects');
 expect($('fire').disabled,'four turn lock');
 expect($('studio-trace').rows.length===8,'dual trace eight rows');
 const firstTrace=$('studio-trace').textContent;
 expect($('studio-trace').rows[6].cells[8].textContent==='0','door request without obstacle has no effect');
 const baseline=$('visual').textContent;
 const waitFor=async(test)=>{for(let i=0;i<200&&!test();i++)await new Promise(r=>setTimeout(r,10));expect(test(),'async UI timeout')};
 $('export-replay').click();await waitFor(()=>!!$('replay-output').value);
 expect(!$('copy-artifact').disabled && !$('copy-replay').disabled,'copy outputs enabled');
 let copied='';
 Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{copied=text;}}});
 $('copy-artifact').click();await waitFor(()=>!!$('copy-artifact-status').textContent);
 expect(copied===$('artifact').value,'copy artifact exact text');
 $('copy-replay').click();await waitFor(()=>!!$('copy-replay-status').textContent);
 expect(copied===$('replay-output').value,'copy replay exact text');
 navigator.clipboard.writeText=async()=>{throw Error('denied')};
 $('copy-replay-status').textContent='';$('copy-replay').click();await waitFor(()=>!!$('copy-replay-status').textContent);
 expect($('copy-replay-status').textContent.includes('手动复制') && $('replay-output').selectionEnd===$('replay-output').value.length,'copy denied selects output');
 const replay=JSON.parse($('replay-output').value);
 expect(replay.results[0].score===2 && replay.results[1].score===1 && !replay.authenticated,'creator replay results');
 $('verify-text').value=JSON.stringify(replay);$('verify-replay').click();await waitFor(()=>!!$('verify-status').textContent);
 expect($('verify-status').textContent.includes('计算一致'),'creator replay verify');
 expect($('verify-status').textContent.includes(artifact.sha256) && $('verify-status').textContent.includes('执行模式：'+(replay.plain?'普通共享真值表':'字节求值')) && $('verify-status').textContent.includes('四拍动作：0011'),'verified replay identity and actions');
 expect($('verified-trace').rows.length===8 && $('verified-trace').textContent===firstTrace,'verified trace matches replay');
 $('verify-text').dispatchEvent(new Event('input'));
 expect(!$('verified-trace').rows.length && !$('verify-status').textContent,'verified trace cleared on input');
 replay.results[0].score++;
 $('verify-text').value=JSON.stringify(replay);$('verify-text').dispatchEvent(new Event('input'));$('verify-replay').click();await waitFor(()=>!!$('verify-status').textContent);
 expect($('verify-status').textContent.includes('复核失败') && $('visual').textContent===baseline,'creator replay rejection nonmutating');
 expect(!$('verified-trace').rows.length,'failed verification has no trace');
 $('mode').value='plain';$('mode').dispatchEvent(new Event('change'));await ready();
 expect($('visual').textContent.includes('回合0/4'),'mode reset');
 for(const id of ['wait','wait','fire','fire'])$(id).click();
 expect($('visual').textContent===baseline,'ordinary parity');
 expect($('studio-trace').textContent===firstTrace,'ordinary trace parity');
 const cells=$('rows').querySelectorAll('select');
 cells[1].value='1';cells[1].dispatchEvent(new Event('change'));
 expect($('fire').disabled && !$('artifact').value,'edit invalidates artifact and actions');
 expect(!$('studio-trace').rows.length,'dirty trace cleared');
 expect($('copy-artifact').disabled && $('copy-replay').disabled && !$('copy-replay-status').textContent,'dirty copy disabled');
 $('compile').click();await ready();
 expect(JSON.parse($('artifact').value).sha256!==artifact.sha256,'changed byte identity');
 expect($('visual').textContent.includes('回合0/4'),'compile reset');
 for(let i=0;i<8;i++){cells[i*2+1].value='1';cells[i*2+1].dispatchEvent(new Event('change'))}
 $('compile').click();await ready();$('wait').click();
 expect($('visual').textContent.includes('请求1') && $('visual').textContent.includes('效果累计1'),'edited request consumed');
 $('import-text').value=JSON.stringify(artifact);$('import').click();await waitFor(()=>$('import-status').textContent.includes('已装载'));
 expect($('mode').value==='plain' && $('visual').textContent.includes('回合0/4'),'creator import reset and mode');
 $('wait').click();$('wait').click();
 const beforeImport=$('visual').textContent;
 const corrupt={...artifact,sha256:'wrong'};
 $('import-text').value=JSON.stringify(corrupt);$('import-text').dispatchEvent(new Event('input'));$('import').click();await waitFor(()=>!!$('import-status').textContent);
 expect($('import-status').textContent.includes('导入失败') && $('visual').textContent===beforeImport,'creator failed import nonmutating');
 // Supersede a real in-flight digest before introducing a stale save.
 $('compile').click();cells[1].value='0';cells[1].dispatchEvent(new Event('change'));
 await new Promise(r=>setTimeout(r,100));
 expect(!$('artifact').value && $('fire').disabled,'stale digest ignored');
 // Restore the intended configuration and two-turn progress for document recovery.
 $('import-text').value=JSON.stringify(artifact);$('import-text').dispatchEvent(new Event('input'));$('import').click();
 await waitFor(()=>$('import-status').textContent.includes('已装载'));
 $('wait').click();$('wait').click();
 // A fresh same-origin document exercises startup recovery without recursively running this harness.
 const frame=document.createElement('iframe');frame.src='studio.html?restore=1';document.body.append(frame);
 await waitFor(()=>!!frame.contentDocument?.getElementById('artifact')?.value);
 expect(frame.contentDocument.getElementById('visual').textContent===beforeImport,'fresh document storage recovery');
 expect(frame.contentDocument.getElementById('studio-trace').rows.length===4,'recovered trace rebuilt');
 // A second document advances the shared save; the old document must not overwrite it.
 frame.contentDocument.getElementById('fire').click();
 const newer=frame.contentDocument.getElementById('visual').textContent;
 expect(newer!==beforeImport,'second document advances');
 const savedAfterOther=localStorage.getItem('tapeweave-studio-local-v1');
 await waitFor(()=>$('error').textContent.includes('重新读取存档'));
 expect($('fire').disabled && !$('artifact').value,'external storage notification');
 const blockedVisual=$('visual').textContent;
 $('fire').click();
 expect($('error').textContent.includes('存档已被其他页面更改') && $('visual').textContent===blockedVisual,'stale document rejection nonmutating');
 expect(localStorage.getItem('tapeweave-studio-local-v1')===savedAfterOther,'stale document preserves shared save');
 const preserved=()=>expect(localStorage.getItem('tapeweave-studio-local-v1')===savedAfterOther,'stale reset preserves shared save');
 $('compile').click();await new Promise(r=>setTimeout(r,30));preserved();
 expect($('fire').disabled && !$('artifact').value,'stale compile refused');
 $('mode').value='byte';$('mode').dispatchEvent(new Event('change'));
 await new Promise(r=>setTimeout(r,30));preserved();
 expect($('fire').disabled && !$('artifact').value,'stale mode reset refused');
 $('import-text').value=JSON.stringify(artifact);$('import-text').dispatchEvent(new Event('input'));$('import').click();
 await waitFor(()=>$('import-status').textContent.includes('未完成'));preserved();
 expect($('fire').disabled,'stale import refused');
 cells[1].value='1';cells[1].dispatchEvent(new Event('change'));preserved();
 $('compile').click();await new Promise(r=>setTimeout(r,30));preserved();
 expect($('fire').disabled && $('error').textContent.includes('存档已被其他页面更改'),'stale edit then compile refused');
 expect($('reload-save').textContent.includes('放弃未保存编辑'),'explicit recovery control');
 // Exercise the real reload handler in a child document so this harness survives.
 const oldDocument=frame.contentDocument;
 oldDocument.getElementById('mode').value='byte';
 oldDocument.getElementById('rows').querySelector('select').value='1';
 oldDocument.getElementById('reload-save').click();
 await waitFor(()=>frame.contentDocument!==oldDocument && !!frame.contentDocument?.getElementById('artifact')?.value);
 expect(frame.contentDocument.getElementById('mode').value==='plain','recovery restores saved mode');
 expect(frame.contentDocument.getElementById('visual').textContent===newer,'recovery restores latest progress');
 expect(frame.contentDocument.getElementById('rows').querySelector('select').value===String(artifact.next[0]),'recovery discards unsaved controls');
 preserved();
 frame.remove();
 ${layoutChecks}
 out.textContent=JSON.stringify({passed:true,layoutWidths,checks:['verified replay identity and actions','verified trace matches replay','verified trace cleared on input','failed verification has no trace','probe old state timing','probe does not commit','probe input clears result','probe charged request','copy outputs enabled','copy artifact exact text','copy replay exact text','copy denied selects output','dirty copy disabled','dual trace eight rows','door request without obstacle has no effect','ordinary trace parity','dirty trace cleared','recovered trace rebuilt','local identity','dual host effects','four turn lock','mode reset','ordinary parity','edit invalidation','changed byte identity','compile reset','edited request consumed','stale digest ignored','creator replay results','creator replay verify','creator replay rejection nonmutating','creator import reset and mode','creator failed import nonmutating','fresh document storage recovery','second document advances','stale document rejection nonmutating','stale document preserves shared save','stale compile refused','stale mode reset refused','stale import refused','stale edit then compile refused','explicit recovery control','external storage notification','recovery restores saved mode','recovery restores latest progress','recovery discards unsaved controls'],viewport:innerWidth});
}catch(e){out.textContent=JSON.stringify({passed:false,error:e.message})}
</script>`;
const checks = `
<script type="module">
const result = document.createElement('pre');result.id='browser-check';document.body.append(result);
try {
 const $ = id => document.getElementById(id);
 const expect = (ok, message) => {if (!ok) throw Error(message)};
 for(let i=0;i<100 && !$('status').textContent;i++) await new Promise(r=>setTimeout(r,20));
 expect($('status').textContent.includes('得分 0'),'startup');
 expect($('fire').disabled,'prediction required');
 $('guess0').click();
 expect($('prediction').textContent.includes('预测正确'),'prediction answer');
 for(const id of ['wait','wait','fire','fire']) $(id).click();
 expect($('status').textContent.includes('得分 2'),'training score');
 expect($('trace').children.length===4 && $('fire').disabled,'finished');
 $('export-replay').click();
 const replay=JSON.parse($('replay').value);
 expect(replay.score===2 && replay.actions.join('')==='0011' && replay.trace.length===4,'export replay result');
 expect(replay.authenticated===false && replay.chain_identity===null && replay.execution==='byte','replay evidence');
 const baseline=$('trace').textContent;
 $('verify-text').value=$('replay').value;$('verify-replay').click();
 expect($('verify-status').textContent.includes('计算一致') && $('verify-status').textContent.includes('未认证'),'replay verification');
 const tampered=structuredClone(replay);tampered.score++;
 $('verify-text').value=JSON.stringify(tampered);$('verify-replay').click();
 expect($('verify-status').textContent.includes('复核失败') && $('trace').textContent===baseline,'verification failure nonmutating');
 $('verify-text').dispatchEvent(new Event('input'));expect(!$('verify-status').textContent,'verification stale result cleared');
 const change=(id,value)=>{$(id).value=value;$(id).dispatchEvent(new Event('change'))};
 change('execution','plain');
 expect($('trace').children.length===0 && $('fire').disabled,'execution reset');
 expect(!$('replay').value && $('export-replay').disabled,'replay invalidated');
 $('guess0').click();for(const id of ['wait','wait','fire','fire']) $(id).click();
 expect($('trace').textContent===baseline,'ordinary parity');
 change('world','garden');$('guess0').click();
 for(let i=0;i<4;i++) $('fire').click();
 const rows=[...$('trace').children].map(tr=>[...tr.children].map(td=>Number(td.textContent)));
 expect(rows[0][6]===0 && rows[1][6]===rows[0][4],'garden delay');
 expect($('explanation').textContent.includes('末拍新请求不在本局成熟'),'garden final pending');
 change('card','alternating');expect($('trace').children.length===0 && $('fire').disabled,'card reset');
 $('guess1').click();expect($('prediction').textContent.includes('预测正确'),'alternating prediction');
 $('fire').click();change('windows','1000');expect($('trace').children.length===0 && $('fire').disabled,'window reset');
 $('guess1').click();$('fire').click();$('reset').click();expect($('trace').children.length===0 && $('fire').disabled,'manual reset');
 $('title').value='测试作品';$('description').value='<'+'script>不是代码<'+'/script>'; $('export').click();
 const pack=JSON.parse($('package').value);
 expect(pack.title==='测试作品' && pack.card.mode==='alternating' && pack.rules.world==='garden' && pack.rules.windows.join('')==='1000','package config');
 expect(pack.card.chain_identity===null && pack.prediction.expected_request===1,'package identity and prediction');
 $('title').dispatchEvent(new Event('input'));expect(!$('package').value,'edited text invalidates export');
 $('title').value=' ';$('export').click();expect(!$('package').value && $('error').textContent.includes('为空或过长'),'empty title rejected');
 $('title').value='恢复';$('export').click();
 expect(!$('error').textContent,'no application error');
 const saved=$('package').value;
 change('card','pulse');$('guess0').click();$('fire').click();
 $('import-text').value=saved;$('import').click();
 expect($('card').value==='alternating' && $('world').value==='garden' && $('windows').value==='1000','import config');
 expect($('trace').children.length===0 && $('fire').disabled && $('execution').value==='plain','import reset and mode');
 expect($('description').value.includes('<script>'),'import description is text');
 $('guess1').click();$('fire').click();
 const snapshot=$('trace').textContent;
 const corrupt=JSON.parse(saved);corrupt.card.sha256='wrong';
 $('import-text').value=JSON.stringify(corrupt);$('import').click();
 expect($('trace').textContent===snapshot && $('card').value==='alternating','failed import preserves session');
 ${layoutChecks}
 result.textContent=JSON.stringify({passed:true,layoutWidths,checks:['startup','prediction gate','training score','finish lock','ordinary parity','garden delay','final pending','card reset','window reset','manual reset','package config','package identity','export invalidation','empty title rejection','import config','import reset and mode','import description text','failed import atomicity','export replay result','replay evidence','replay invalidated','replay verification','verification failure nonmutating','verification stale result cleared'],viewport:innerWidth});
} catch(e) {result.textContent=JSON.stringify({passed:false,error:e.message})}
</script>`;
const server=http.createServer(async(req,res)=>{
 try {
  const path=resolve(root,'.'+new URL(req.url,'http://localhost').pathname);
  if(!path.startsWith(root)) {res.writeHead(403);res.end();return;}
  let data=await readFile(path);
  const types={'.html':'text/html','.mjs':'application/javascript','.css':'text/css','.json':'application/json'};
  res.setHeader('content-type',types[extname(path)]||'text/plain');
  if(path.endsWith('/demo/'+target) && !new URL(req.url,'http://localhost').searchParams.has('restore')) data=data.toString().replace('</body>',(studio ? studioChecks : checks)+'</body>');
  res.end(data);
 } catch {res.writeHead(404);res.end();}
});
let profile;
try {
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 profile=await mkdtemp(join(tmpdir(),'tapeweave-ui-'));
 const chrome=process.env.CHROME||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
 // Diagnose browser startup separately from app/module failures.
 try{await runBrowser(chrome,['--headless=new','--no-first-run','--no-default-browser-check',`--user-data-dir=${profile}`,'--dump-dom','about:blank'],{timeout:10000});}
 catch(e){throw Error(`Chrome startup preflight failed before loading TapeWeave: ${e.message}`);}
 const results=[];
 for(const width of [1100,390]) {
  const html=await runBrowser(chrome,[
    '--headless=new','--no-first-run','--no-default-browser-check','--disable-extensions','--disable-background-networking',
    '--force-device-scale-factor=1',`--window-size=${width},900`,`--user-data-dir=${profile}`,
    '--dump-dom','--virtual-time-budget=5000',`http://127.0.0.1:${server.address().port}/demo/${target}`]);
  const raw=html.match(/<pre id="browser-check">([^<]+)<\/pre>/)?.[1];
  assert.ok(raw,'missing browser result');
  const result=JSON.parse(raw.replaceAll('&quot;','"').replaceAll('&amp;','&'));
  assert.equal(result.passed,true,result.error);results.push(result);
 }
 console.log(JSON.stringify({evidence:'author-controlled-local-chrome-only',results},null,2));
} finally {
 await new Promise(r=>server.close(r));
 if(profile)await rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:100});
}
