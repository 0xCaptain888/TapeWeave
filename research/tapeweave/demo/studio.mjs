import {compile,evaluate,makeHost,presets} from './creator.mjs';
import {openLocalSession,readLocal,clearLocal,localText} from './studio-storage.mjs';
import {createArtifact,parseArtifact} from './creator-package.mjs';
import {createCreatorReplay,verifyCreatorReplay} from './creator-replay.mjs';
const el=id=>document.getElementById(id);
let hosts=[], dirty=true, generation=0, local=null;
function invalidateSave(){
  try{local?.assertCurrent();clearLocal(localStorage);local=null;}
  catch(e){el('error').textContent=e.message;}
}
for(const [button,source,status] of [['copy-artifact','artifact','copy-artifact-status'],['copy-replay','replay-output','copy-replay-status']]){
 el(button).onclick=async()=>{
  const text=el(source).value,ticket=generation;
  if(!text)return;
  try{
   await navigator.clipboard.writeText(text);
   if(ticket===generation && el(source).value===text)el(status).textContent='已复制。仅本地未认证JSON，不含链身份。';
  }catch{
   if(ticket!==generation || el(source).value!==text)return;
   el(source).focus();el(source).select();
   el(status).textContent='剪贴板不可用，已选中文本，请手动复制。';
  }
 };
}
const selects=[];
for(let i=0;i<8;i++){
  const tr=document.createElement('tr');
  for(const v of [i>>2,(i>>1)&1,i&1]){const td=document.createElement('td');td.textContent=v;tr.append(td);}
  const pair=[];
  for(let j=0;j<2;j++){
    const s=document.createElement('select');s.setAttribute('aria-label',`第${i+1}行${j?'请求':'下一状态'}`);
    for(const v of [0,1])s.add(new Option(v,v));
    s.onchange=()=>{invalidateSave();dirty=true;generation++;el('artifact').value='';render();};
    const td=document.createElement('td');td.append(s);tr.append(td);pair.push(s);
  }
  selects.push(pair);el('rows').append(tr);
}
function showTrace(target,snapshots){
  el(target).replaceChildren();
  snapshots.forEach((snapshot,i)=>{
    for(const row of snapshot.trace){
      const tr=document.createElement('tr');
      for(const value of [i?'钥匙门':'训练',row.turn+1,row.old,row.trigger,row.recharge,row.request,row.next,i?row.obstacle:'—',row.effect]){
        const td=document.createElement('td');td.textContent=String(value);tr.append(td);
      }
      el(target).append(tr);
    }
  });
}
function render(){
  el('probe-result').textContent='';
  showTrace('studio-trace',dirty?[]:hosts.map(h=>h.snapshot()));
  el('replay-output').value='';
  el('copy-artifact').disabled=dirty||!el('artifact').value;
  el('copy-replay').disabled=true;
  el('copy-artifact-status').textContent='';el('copy-replay-status').textContent='';
  el('export-replay').disabled=dirty||!hosts.length||hosts[0].snapshot().version!==4;
  for(const id of ['wait','fire'])el(id).disabled=dirty||!hosts.length||hosts[0].snapshot().version>=4;
  el('visual').textContent=dirty?'行为已修改，请编译开启新局。':hosts.map((h,i)=>{
    const s=h.snapshot(),r=s.trace.at(-1);
    return `${i?'钥匙门':'训练'}：回合${s.version}/4 · 状态${s.latch} · 效果累计${s.score}${i?` · 剩余钥匙${s.resource}`:''}\n${r?`旧态${r.old} + 触发${r.trigger} + 补能${r.recharge} → 请求${r.request} / 新态${r.next} → 宿主效果${r.effect}`:'等待输入'}`;
  }).join('\n\n');
}
for(const id of ['probe-old','probe-trigger','probe-recharge'])el(id).onchange=()=>{el('probe-result').textContent='';};
el('probe').onclick=()=>{
 try{
  const next=selects.map(x=>Number(x[0].value)),request=selects.map(x=>Number(x[1].value));
  const [old,trigger,recharge]=['probe-old','probe-trigger','probe-recharge'].map(id=>Number(el(id).value));
  const index=old*4+trigger*2+recharge;
  const result=evaluate(compile(next,request),old,trigger,recharge);
  if(result[0]!==next[index] || result[1]!==request[index])throw Error('字节与行为表不一致');
  el('probe-result').textContent=`第${index+1}行：旧态${old} + 触发${trigger} + 补能${recharge} → 下一状态${result[0]} / 请求${result[1]}。字节与普通表一致；仅预览，当前局未改变，未计算宿主奖励。`;
 }catch(e){el('probe-result').textContent=`预览失败：${e.message}`;}
};
async function build(actions=[]){
  const ticket=++generation;dirty=true;el('artifact').value='';render();
  try{
    local?.assertCurrent();
    let expected;
    try{expected=localText(localStorage);}catch{}
    const next=selects.map(x=>Number(x[0].value)),request=selects.map(x=>Number(x[1].value));
    const plain=el('mode').value==='plain';
    const artifact=await createArtifact(next,request);
    if(ticket!==generation)return;
    let warning='';
    try{local=openLocalSession(localStorage,{next,request,plain},actions,expected);hosts=local.snapshots().map((_,i)=>({snapshot:()=>local.snapshots()[i]}));}
    catch(e){if(e.code==='STALE_SAVE')throw e;local=null;hosts=['training','door'].map(w=>makeHost(next,request,w,plain));actions.forEach((t,v)=>hosts.forEach(h=>h.act(v,t)));warning=`本地保存不可用，仅内存模式：${e.message}`;}
    dirty=false;
    el('artifact').value=JSON.stringify(artifact,null,2);
    el('error').textContent=warning;render();
  }catch(e){if(ticket===generation){el('error').textContent=e.message;render();}}
}
function preset(){const p=presets[el('preset').value];selects.forEach((x,i)=>{x[0].value=p.next[i];x[1].value=p.request[i];});build();}
el('compile').onclick=()=>build();el('preset').onchange=preset;el('mode').onchange=()=>build();
for(const [id,trigger] of [['wait',0],['fire',1]])el(id).onclick=()=>{
  try{if(dirty)throw Error('请先编译');if(local)local.act(hosts[0].snapshot().version,trigger);else for(const h of hosts)h.act(h.snapshot().version,trigger);generation++;render();}catch(e){el('error').textContent=e.message;}
};
el('export-replay').onclick=async()=>{
 const ticket=generation;
 try{
  if(dirty||!hosts.length||hosts[0].snapshot().version!==4)throw Error('请先完成四回合');
  const actions=hosts[0].snapshot().trace.map(r=>r.trigger);
  const r=await createCreatorReplay(JSON.parse(el('artifact').value),actions,el('mode').value==='plain');
  if(ticket===generation){el('replay-output').value=JSON.stringify(r,null,2);el('copy-replay').disabled=false;el('copy-replay-status').textContent='';}
 }catch(e){el('error').textContent=e.message;}
};
let verifyRevision=0;
el('verify-text').addEventListener('input',()=>{verifyRevision++;el('verify-status').textContent='';showTrace('verified-trace',[]);});
el('verify-replay').onclick=async()=>{
 const ticket=++verifyRevision;
 showTrace('verified-trace',[]);el('verify-status').textContent='';
 try{
  const r=await verifyCreatorReplay(el('verify-text').value);
  if(ticket===verifyRevision){
   showTrace('verified-trace',r.results);
   el('verify-status').textContent=`计算一致：训练${r.results[0].score}，门${r.results[1].score}。以下为粘贴回放的重算明细，不是当前局。未认证，仅本地重算，当前局未改变。`;
  }
 }catch(e){if(ticket===verifyRevision)el('verify-status').textContent=`复核失败：${e.message}；当前局未改变。`;}
};
let importRevision=0;
el('import-text').addEventListener('input',()=>{importRevision++;el('import-status').textContent='';});
el('import').onclick=async()=>{
 const ticket=generation,revision=++importRevision,text=el('import-text').value;
 try{
  const p=await parseArtifact(text);
  if(ticket!==generation || revision!==importRevision){el('import-status').textContent='配置或输入已变化，请重新导入。';return;}
  selects.forEach((x,i)=>{x[0].value=p.next[i];x[1].value=p.request[i];});
  await build();
  el('import-status').textContent=dirty?'装载未完成，请查看错误。':'创作包已装载，双宿主清零；执行模式保持原选择。未认证，无链身份。';
 }catch(e){el('import-status').textContent=`导入失败：${e.message}；当前局未改变。`;}
};
el('reload-save').onclick=()=>location.reload();
window.addEventListener('storage',event=>{
 if(event.storageArea!==localStorage || (event.key!==null && event.key!=='tapeweave-studio-local-v1'))return;
 // Invalidate pending digest/import work without touching the shared save.
 generation++;dirty=true;el('artifact').value='';render();
 el('error').textContent='存档已被其他页面更改，请刷新恢复后再操作；可点击“重新读取存档”。';
});
try{
 const saved=readLocal(localStorage);
 if(saved){selects.forEach((x,i)=>{x[0].value=saved.record.next[i];x[1].value=saved.record.request[i];});el('mode').value=saved.record.plain?'plain':'byte';build(saved.record.actions);}
 else preset();
}catch(e){el('error').textContent=`存档恢复失败：${e.message}。请点击编译建立新局；旧存档未自动覆盖。`;dirty=true;render();}
