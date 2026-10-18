import {presetArtifact,createWork,parseWork,connectWork,makeAcceptance} from './work.mjs';
import {parseArtifact} from './creator-package.mjs';
import {createSession,restoreSession,advanceSession,sessionStorage} from './work-session.mjs';
const $=id=>document.getElementById(id);
let revision=0,player=null,current='',revealed=false,journal=null,busy=false;
let store;try{store=sessionStorage(localStorage);}catch{}

function clearAcceptance(){ $('acceptance').value='';$('copy-acceptance').disabled=true; }
function stop(){player=null;current='';revealed=false;for(const id of ['reset','recharge','trigger','wait','accept'])$(id).disabled=true;$('trace').replaceChildren();$('work-title').textContent='尚未装载作品';$('work-description').textContent='';$('state').textContent='';$('visual-effect').classList.remove('active');$('visual-effect').textContent='等待作品';clearAcceptance();}
function edit(){revision++;$('delivery').value='';$('copy-work').disabled=true;$('status').textContent='';stop();}
for(const id of ['title','description','template','artifact-input','scene'])$(id).addEventListener('input',edit);
for(const id of ['incoming','result','note'])$(id).addEventListener('input',()=>{revision++;clearAcceptance();$('status').textContent='';});
function render(){
 const s=player.snapshot();$('work-title').textContent=player.work.title;$('work-description').textContent=player.work.description;
 $('state').textContent=`第${s.version}步 · 状态${s.latch} · ${$('mode').value==='plain'?'普通共享真值表':'电路字节计算'}`;
 const req=s.trace.at(-1)?.request===1;revealed ||= req;
 const active=player.work.scene==='lamp'?req:s.trace.some(r=>r.request===1);
 $('visual-effect').classList.toggle('active',active);$('visual-effect').textContent=player.work.scene==='lamp'?(active?'💡 灯亮了':'○ 灯未亮'):(active?'✦ 内容已揭开':'▧ 内容尚未揭开');
 $('trace').replaceChildren();for(const r of s.trace){const tr=document.createElement('tr');for(const value of [r.version+1,r.old,r.trigger,r.recharge,r.next,r.request]){const td=document.createElement('td');td.textContent=String(value);tr.append(td);}$('trace').append(tr);}
 for(const id of ['reset','accept'])$(id).disabled=false;for(const id of ['recharge','trigger','wait'])$(id).disabled=s.version>=64;
}
async function install(text,token){const candidate=await connectWork(text,{mode:$('mode').value});if(token!==revision)return false;const nextJournal=await createSession(JSON.stringify(candidate.work),$('mode').value);if(token!==revision)return false;
 if(store)await store.save(nextJournal);if(token!==revision)return false;
 journal=nextJournal;player=candidate;current=JSON.stringify(candidate.work);revealed=false;clearAcceptance();$('result').value='';$('note').value='';render();return true;}
$('build').onclick=async()=>{const token=++revision;$('delivery').value='';$('copy-work').disabled=true;stop();try{
 const artifact=$('template').value==='custom'?await parseArtifact($('artifact-input').value):await presetArtifact($('template').value);
 if(token!==revision)return;
 const work=await createWork({title:$('title').value,description:$('description').value,scene:$('scene').value,artifact});
 const text=JSON.stringify(work,null,2);if(await install(text,token)){$('delivery').value=text;$('copy-work').disabled=false;$('status').textContent='作品已生成。可复制给接收者；不是链上发布。';}
}catch(e){if(token===revision)$('status').textContent=e.message;}};
$('load').onclick=async()=>{const token=++revision;clearAcceptance();try{const work=await parseWork($('incoming').value);if(await install(JSON.stringify(work),token)){$('delivery').value='';$('copy-work').disabled=true;$('status').textContent='已校验并开启接收者试用；作品未经身份认证。';}}catch(e){if(token===revision)$('status').textContent=e.message;}};
async function reset(){const text=current,token=++revision;clearAcceptance();if(!text)return;try{await install(text,token);}catch(e){if(token===revision)$('status').textContent=e.message;}}
$('reset').onclick=reset;$('mode').onchange=()=>{stopMode();};
function stopMode(){const text=current;revision++;stop();if(text){const token=revision;install(text,token).catch(e=>{if(token===revision)$('status').textContent=e.message;});}}
for(const [id,input]of Object.entries({recharge:{trigger:0,recharge:1},trigger:{trigger:1,recharge:0},wait:{trigger:0,recharge:0}}))$(id).onclick=async()=>{if(!player||busy)return;busy=true;const token=++revision;clearAcceptance();$('status').textContent='';try{
 const next=await advanceSession(journal,crypto.randomUUID(),player.snapshot().version,input);
 if(token!==revision)return;
 if(store)await store.save(next);
 if(token!==revision)return;
 const restored=await restoreSession(JSON.stringify(next));if(token!==revision)return;
 journal=restored.record;player=restored.player;render();if(!store)$('status').textContent='浏览器存储不可用，本次仅内存运行';
 }catch(e){$('status').textContent=e.message;}finally{busy=false;}};
$('resume').onclick=async()=>{if(!store){$('status').textContent='浏览器存储不可用';return;}const token=++revision;try{const text=store.refresh();if(!text)throw Error('没有本机执行存档');const restored=await restoreSession(text);if(token!==revision)return;player=restored.player;journal=restored.record;current=JSON.stringify(player.work);$('mode').value=journal.mode;clearAcceptance();$('delivery').value='';$('copy-work').disabled=true;render();$('status').textContent='已重算并恢复本机存档；不是认证使用记录';}catch(e){if(token===revision)$('status').textContent=e.message;}};
window.addEventListener('storage',()=>{if(store&&!store.current()){revision++;stop();$('status').textContent='其他页面已更改存档，请先恢复最新存档';}});
$('accept').onclick=async()=>{if(!player)return;const token=++revision;clearAcceptance();try{const record=await makeAcceptance(current,$('mode').value,player.snapshot().trace,{result:$('result').value,note:$('note').value});if(token!==revision)return;$('acceptance').value=JSON.stringify(record,null,2);$('copy-acceptance').disabled=false;$('status').textContent='生成的是自报记录，不是独立采用或认证成绩。';}catch(e){if(token===revision)$('status').textContent=e.message;}};
for(const [button,output]of [['copy-work','delivery'],['copy-acceptance','acceptance']])$(button).onclick=async()=>{const text=$(output).value,token=revision;if(!text)return;try{await navigator.clipboard.writeText(text);if(token===revision&&$(output).value===text)$('status').textContent='已复制';}catch{if(token===revision&&$(output).value===text){$(output).focus();$(output).select();$('status').textContent='请手动复制已选中的文本';}}};
stop();
