import {chromium} from '/Users/lyh/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import {readFile,writeFile,mkdir,rename,access} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const assets=fileURLToPath(new URL('./',import.meta.url));
const english=process.env.TAPEWEAVE_VIDEO_LANGUAGE==='en';
const output=assets+(english?'english/':'');
const scenes=JSON.parse(await readFile(new URL('scenes.json',import.meta.url),'utf8'));
const origin='https://0xcaptain888.github.io/TapeWeave/research/tapeweave/demo/';
let browser;
const observations=[];
await mkdir(output+'raw',{recursive:true});
async function overlay(page,scene){
 await page.evaluate(scene=>{
  document.getElementById('film-overlay')?.remove();
  const overlay=document.createElement('div');overlay.id='film-overlay';overlay.style.cssText='pointer-events:none;position:fixed;inset:0;z-index:2147483647;font-family:Arial,sans-serif';
  const top=document.createElement('div');top.style.cssText='position:absolute;top:0;left:0;right:0;height:86px;background:#10291f;color:#f6fff9;padding:16px 38px;box-shadow:0 5px 20px #0002';
  const label=document.createElement('div');label.textContent=scene.title;label.style.cssText='font-size:25px;font-weight:700;letter-spacing:1px';
  const url=document.createElement('div');url.textContent='TapeWeave  /  Real product walkthrough  /  X Layer';url.style.cssText='font-size:13px;color:#afd9c0;margin-top:8px';top.append(label,url);
  const bottom=document.createElement('div');bottom.textContent=scene.subtitle;bottom.style.cssText='position:absolute;bottom:0;left:0;right:0;min-height:78px;background:#10291ff5;color:white;text-align:center;padding:24px 30px;font-size:22px;line-height:1.4';
  overlay.append(top,bottom);document.body.append(overlay);
 },scene);
}
async function focus(page,selector){await page.locator(selector).evaluate(element=>{window.scrollTo({top:Math.max(0,element.getBoundingClientRect().top+scrollY-125),behavior:'instant'});});}
async function click(page,selector){await page.locator(selector).click();await page.waitForTimeout(500);}
let savedPackage;
try{
 for(const scene of scenes){
  try{await access(output+scene.id+'.webm');observations.push({scene:scene.id,reusedActualRecording:true,source:origin+scene.page,newSignature:false,newTransaction:false});continue;}catch{}
  browser=await chromium.launch({headless:true,executablePath:'/Users/lyh/Library/Caches/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-mac-arm64/chrome-headless-shell',args:['--no-sandbox','--single-process','--in-process-gpu','--disable-gpu']});
  const audio=assets+scene.id+'.mp3';
  const duration=Number(execFileSync('/opt/homebrew/bin/ffprobe',['-v','error','-show_entries','format=duration','-of','csv=p=0',audio],{encoding:'utf8'}).trim())+1.2;
  const context=await browser.newContext({viewport:{width:1600,height:900},recordVideo:{dir:output+'raw',size:{width:1600,height:900}},permissions:['clipboard-read','clipboard-write']});
  const page=await context.newPage();const requests=[];
  page.on('request',request=>{if(request.method()==='POST'){try{requests.push(JSON.parse(request.postData()).method);}catch{}}});
  const started=Date.now();
  await page.goto(origin+scene.page+(english?'?lang=en':''),{waitUntil:'networkidle',timeout:45000});
  if(english)await page.waitForFunction(()=>document.documentElement.lang==='en');
  await overlay(page,scene);
  if(scene.id==='02-create'){
   await page.locator('#title').fill('Charge & Light');await focus(page,'.work-create');await click(page,'#build');await page.waitForFunction(()=>!document.getElementById('recharge').disabled);
   await focus(page,'.work-preview');await page.waitForTimeout(1200);await click(page,'#recharge');await page.waitForTimeout(1200);await click(page,'#trigger');
   assert.match(await page.locator('#state').innerText(),/2/);await page.waitForTimeout(1600);await click(page,'#trigger');
   assert.equal(await page.locator('#trace tr').count(),3);savedPackage=await page.locator('#delivery').inputValue();
  }else if(scene.id==='03-deliver'||scene.id==='04-protect'){
   await page.locator('#title').fill('Charge & Light');await click(page,'#build');await page.waitForFunction(()=>!document.getElementById('recharge').disabled);
   savedPackage=await page.locator('#delivery').inputValue();await focus(page,'.work-delivery');
   await page.locator('#incoming').fill(savedPackage);await click(page,'#load');await focus(page,'.work-preview');await click(page,'#recharge');await click(page,'#trigger');
   if(scene.id==='03-deliver'){
    await page.reload({waitUntil:'networkidle'});await overlay(page,scene);await page.waitForFunction(()=>!document.getElementById('resume').disabled);await focus(page,'.work-preview');await click(page,'#resume');
    assert.equal(await page.locator('#trace tr').count(),2);
   }else{
    const before=await page.locator('#state').innerText(),corrupt=JSON.parse(savedPackage);corrupt.artifact.sha256='0'.repeat(64);
    await focus(page,'.work-delivery');await page.locator('#incoming').fill(JSON.stringify(corrupt,null,2));await click(page,'#load');
    assert.equal(await page.locator('#state').innerText(),before);assert.match(await page.locator('#status').innerText(),/失败|不匹配|do not match|failed/i);await focus(page,'#status');
   }
  }else if(scene.id==='05-applications'){
   await click(page,'#start');await focus(page,'.exhibit-grid');await click(page,'#a-charge');await page.waitForTimeout(1000);await click(page,'#a-use');
   await page.waitForTimeout(1800);await click(page,'#b-charge');await click(page,'#b-use');assert.equal(await page.locator('#task-progress').getAttribute('value'),'2');
   await page.waitForTimeout(1000);await page.locator('#b-use').evaluate(element=>element.scrollIntoView({block:'center'}));
  }else if(scene.id==='06-mainnet'){
   await page.waitForFunction(()=>document.querySelectorAll('#evidence-list a').length===11);await focus(page,'.chain-proof');
   assert.equal(await page.locator('#evidence-list a').count(),11);
  }else if(scene.id==='07-read'){
   await page.waitForFunction(()=>!document.getElementById('card1').disabled);await focus(page,'#card1');
   let snapshot;
   for(let attempt=0;attempt<3;attempt++){
    await click(page,'#card1');await page.waitForFunction(()=>!document.getElementById('read').disabled,{timeout:25000});
    const text=await page.locator('#snapshot').innerText();if(text){snapshot=JSON.parse(text);break;}await page.waitForTimeout(1200);
   }
   assert.ok(snapshot?.verified_host);assert.ok(snapshot.matches_recorded_final_state);assert.equal(snapshot.snapshot.version,4);
   observations.push({scene:scene.id,realPublicRpc:true,snapshot});await focus(page,'#snapshot');
  }else if(scene.id==='08-wallet'){
   await page.waitForFunction(()=>!document.getElementById('native-diagnose').disabled);await focus(page,'#connect-title');await click(page,'#native-diagnose');
   const diagnostic=JSON.parse(await page.locator('#native-diagnostic').inputValue());assert.equal(diagnostic.status,'no_provider');
   await page.waitForTimeout(1600);await focus(page,'#play-title');
  }
  await page.screenshot({path:output+scene.id+'.png'});
  const remaining=duration*1000-(Date.now()-started);if(remaining>0)await page.waitForTimeout(remaining);
  observations.push({scene:scene.id,durationTarget:duration,wallSeconds:(Date.now()-started)/1000,source:origin+scene.page,networkPostMethods:[...new Set(requests)],newSignature:false,newTransaction:false});
  const video=page.video();await context.close();await rename(await video.path(),output+scene.id+'.webm');
  console.log('RECORDED '+scene.id);
  await browser.close();browser=null;
 }
 await writeFile(output+'recording-observations.json',JSON.stringify({sourceCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),recordedAt:new Date().toISOString(),uiLanguage:english?'en':'zh',recording:'real browser operation; no provider/RPC substitutions',voice:'Microsoft en-US-GuyNeural synthetic male narration',observations},null,2));
}finally{await browser?.close();}
