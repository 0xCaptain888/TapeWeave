import {createArtifact} from './creator-package.mjs';
import {presets} from './creator.mjs';
import {createWork} from './work.mjs';
import {openLibrary,verifyAcceptance} from './work-library.mjs';
const $=id=>document.getElementById(id);let revision=0;const next=[],request=[];
const invalidate=()=>{revision++;$('package').value='';$('status').textContent='编辑已改变，请重新生成';};
for(let i=0;i<8;i++){const tr=document.createElement('tr');for(const value of [i>>2?'已蓄能':'未蓄能',(i>>1)&1,i&1]){const td=document.createElement('td');td.textContent=String(value);tr.append(td);}for(const [array,values,label]of [[next,['未蓄能','已蓄能'],'下一状态'],[request,['不请求','请求效果'],'效果请求']]){const td=document.createElement('td'),select=document.createElement('select');select.setAttribute('aria-label',`第${i+1}行${label}`);values.forEach((v,j)=>{const option=document.createElement('option');option.value=j;option.textContent=v;select.append(option);});select.value=(array===next?presets.pulse.next:presets.pulse.request)[i];select.onchange=invalidate;array.push(select);td.append(select);tr.append(td);}$('rules').append(tr);}
for(const id of ['name','description','scene'])$(id).oninput=invalidate;
$('package').oninput=()=>{revision++;};
$('build').onclick=async()=>{const token=++revision;$('package').value='';try{const title=$('name').value,description=$('description').value,scene=$('scene').value;const artifact=await createArtifact(next.map(x=>+x.value),request.map(x=>+x.value));const w=await createWork({title,description,scene,artifact});if(token!==revision)return;$('package').value=JSON.stringify(w,null,2);$('status').textContent='已生成；复制到作品页试用，或保存新版本。';}catch(e){if(token===revision)$('status').textContent=e.message;}};
const library=()=>openLibrary(localStorage);
function refresh(){try{$('library').replaceChildren();for(const item of library().list()){const section=document.createElement('p');const title=document.createElement('strong');title.textContent=item.id;section.append(title);for(const entry of item.versions){const button=document.createElement('button');button.textContent=`装载 v${entry.version} · ${entry.work.title}`;button.onclick=()=>{revision++;$('id').value=item.id;$('package').value=JSON.stringify(entry.work,null,2);$('status').textContent=`已装载${item.id} v${entry.version}的包；上方编辑表未改变，试用从零开始。`;};section.append(button);}$('library').append(section);}}catch(e){$('status').textContent=`无法读取作品库：${e.message}；未覆盖原数据`;}}
$('refresh').onclick=refresh;
$('save').onclick=async()=>{const input=$('package').value,id=$('id').value;try{const saved=await library().save(id,input);refresh();$('status').textContent=`已保存 ${id} v${saved.version}`;}catch(e){$('status').textContent=`未保存：${e.message}`;}};
let verifyRevision=0;$('record').oninput=()=>{verifyRevision++;$('verdict').textContent='';};
$('verify').onclick=async()=>{const token=++verifyRevision;$('verdict').textContent='';try{const r=await verifyAcceptance($('record').value);if(token!==verifyRevision)return;$('verdict').textContent=`计算一致，但未认证。作品：${r.work.title}；模式：${r.mode}；${r.trace.length}步；自报结果：${r.result}；观察：${r.note}`;}catch(e){if(token===verifyRevision)$('verdict').textContent=`复核失败：${e.message}`;}};
window.addEventListener('storage',refresh);refresh();
