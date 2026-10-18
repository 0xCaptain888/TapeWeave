// Local Chrome policy fixture, NOT TapeNow, a full TapeKit client or X Layer.
// node research/tapespec/build_compatibility_probe.mjs
import assert from 'node:assert/strict';
import http from 'node:http';
import {spawn} from 'node:child_process';
import {mkdtemp, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

// Verbatim SITE_CSP expression from TapeOutProtocol/TapeKit, commit
// 40994bd65baedbda4df72cb0985031a5f082f606, sw-gateway/serve.js.
// Copyright (c) 2026 TapeOutProtocol, MIT; vendor-tapekit-license.txt.
const SITE_CSP = [
  "default-src 'self' blob: data:",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:",
  "style-src 'self' 'unsafe-inline' blob: data: https:",
  "img-src 'self' blob: data: https:", "font-src 'self' blob: data: https:", "media-src 'self' blob: data: https:",
  "connect-src 'self' blob: data: https: wss:",
  "frame-src 'self' https:", "worker-src 'self' blob:", "object-src 'none'", "base-uri 'self'", "form-action 'self' https:",
  // 只允许同源把自己嵌进框架：否则任何网页都能把链上网站整页框住做点击劫持（连钱包的站尤其要紧）
  "frame-ancestors 'self'",
  'report-uri /.tape/csp-report',
].join('; ');

let externalRequests = 0;
const external = http.createServer((req,res)=>{
  externalRequests++;
  res.setHeader('access-control-allow-origin','*');
  res.setHeader('content-type','application/javascript');
  res.end('globalThis.crossOriginRan=true;');
});
const listen = s=>new Promise(r=>s.listen(0,'127.0.0.1',r));
let externalOrigin;
const server=http.createServer((req,res)=>{
  if(req.url==='/asset.js'){
    res.setHeader('content-type','application/javascript');res.end('globalThis.localRan=true;');return;
  }
  if(req.url==='/wrong-mime.js'){
    res.setHeader('content-type','text/plain');res.setHeader('x-content-type-options','nosniff');
    res.end('globalThis.wrongMimeRan=true;');return;
  }
  if(req.url==='/module.js'){
    res.setHeader('content-type','application/javascript');res.end('export default 42;');return;
  }
  if(req.url.startsWith('/.tape/csp-report')){res.writeHead(204);res.end();return;}
  res.setHeader('content-type','text/html');
  if(req.url==='/policy')res.setHeader('content-security-policy',SITE_CSP);
  res.end(`<!doctype html><title>policy fixture</title><pre id="result">pending</pre><script>
  (async()=>{
    const violations=[];addEventListener('securitypolicyviolation',e=>violations.push(e.effectiveDirective));
    const script=url=>new Promise(resolve=>{const s=document.createElement('script');s.src=url;s.onload=()=>resolve('loaded');s.onerror=()=>resolve('blocked');document.head.append(s)});
    const results={inline:true,eval:eval('21*2')===42};
    await script('/asset.js');results.localScript=globalThis.localRan===true;
    results.localModule=(await import('/module.js')).default===42;
    const b=URL.createObjectURL(new Blob(['globalThis.blobRan=true;'],{type:'application/javascript'}));
    await script(b);URL.revokeObjectURL(b);results.blobScript=globalThis.blobRan===true;
    await script('${externalOrigin}/cross.js');results.crossOriginScript=globalThis.crossOriginRan===true;
    await script('/wrong-mime.js');results.wrongMimeScript=globalThis.wrongMimeRan===true;
    results.violations=violations;
    document.querySelector('#result').textContent=JSON.stringify(results);
  })().catch(e=>document.querySelector('#result').textContent=JSON.stringify({error:String(e)}));
  </script>`);
});
let profile;
try{
  await listen(external);externalOrigin=`http://127.0.0.1:${external.address().port}`;
  await listen(server);const origin=`http://127.0.0.1:${server.address().port}`;
  profile=await mkdtemp(join(tmpdir(),'tapeout-compat-'));
  const rows=[];
  for(const policy of [false,true]){
    const args=['--headless=new','--no-first-run','--no-default-browser-check','--disable-extensions','--disable-background-networking',`--user-data-dir=${profile}`,'--dump-dom','--virtual-time-budget=3000',origin+(policy?'/policy':'/ordinary')];
    const before=externalRequests;
    const output=await new Promise((resolve,reject)=>{
      const p=spawn(process.env.CHROME||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args,{stdio:['ignore','pipe','pipe']});
      let stdout='',stderr='';const timer=setTimeout(()=>{p.kill();reject(new Error('Chrome timeout'));},20000);
      p.stdout.on('data',b=>stdout+=b);p.stderr.on('data',b=>stderr+=b);
      p.on('error',e=>{clearTimeout(timer);reject(e)});
      p.on('close',code=>{clearTimeout(timer);code===0?resolve(stdout):reject(new Error('Chrome exit '+code+': '+stderr.slice(-300)))});
    });
    const raw=output.match(/<pre id="result">([^<]+)<\/pre>/)?.[1];
    assert.ok(raw,'missing results');const r=JSON.parse(raw.replaceAll('&quot;','"').replaceAll('&amp;','&'));
    assert.equal(r.error,undefined);
    for(const key of ['inline','eval','localScript','localModule','blobScript'])assert.equal(r[key],true,key);
    assert.equal(r.crossOriginScript,!policy);
    assert.equal(r.wrongMimeScript,false);
    assert.equal(externalRequests-before,policy?0:1);
    if(policy)assert.ok(r.violations.includes('script-src-elem'));
    rows.push({policy:policy?'fixed-tapekit-site-csp':'ordinary-no-csp',...r,externalScriptRequests:externalRequests-before});
  }
  console.log(JSON.stringify({evidence:'real-chrome-local-policy-fixture-only',casesPerPolicy:7,rows},null,2));
}finally{
  await Promise.all([server,external].map(s=>new Promise(r=>s.close(r))));
  if(profile)await rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:100});
}
