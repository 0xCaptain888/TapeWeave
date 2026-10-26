import {ACCEPTANCE_TASKS,makeDeviceAcceptance} from './device-acceptance.mjs';
const $=id=>document.getElementById(id),KEY='tapeweave-device-acceptance-draft-v1';
const message=t=>$('accept-status').textContent=t;
function invalidate(){$('accept-output').value='';$('accept-copy').disabled=true;}
function render(){
 invalidate();$('accept-items').replaceChildren();
 for(const [id,title,guide]of ACCEPTANCE_TASKS[$('accept-kind').value]){
  const section=document.createElement('section'),h=document.createElement('h2');h.textContent=title;
  const p=document.createElement('p');p.textContent=guide;
  const label=document.createElement('label');label.textContent='实际结果';
  const select=document.createElement('select');select.id='accept-result-'+id;
  for(const [value,name]of [['incomplete','未完成'],['pass','实际通过'],['fail','实际失败']]){
   const o=document.createElement('option');o.value=value;o.textContent=name;select.append(o);
  }
  label.append(select);
  const noteLabel=document.createElement('label');noteLabel.textContent='实际操作、结果或失败（通过／失败必填）';
  const note=document.createElement('textarea');note.id='accept-note-'+id;note.maxLength=1200;note.rows=3;noteLabel.append(note);
  section.append(h,p,label,noteLabel);
  if(['send','uop'].includes(id)){
   const l=document.createElement('label');l.textContent='此项实际交易哈希';
   const input=document.createElement('input');input.id='accept-hash-'+id;input.maxLength=66;l.append(input);section.append(l);
  }
  $('accept-items').append(section);
 }
}
function collect(){
 const kind=$('accept-kind').value;
 return {kind,device:$('accept-device').value,browser:$('accept-browser').value,revision:$('accept-revision').value,
  actualDevice:$('accept-actual').checked,items:ACCEPTANCE_TASKS[kind].map(([id])=>({
   id,result:$('accept-result-'+id).value,note:$('accept-note-'+id).value,hash:$('accept-hash-'+id)?.value??'',
  }))};
}
function restore(v){
 // Validate structure through the report builder before touching the active form.
 const report=makeDeviceAcceptance(v);
 $('accept-kind').value=report.kind;render();
 $('accept-device').value=v.device;$('accept-browser').value=v.browser;$('accept-revision').value=v.revision;$('accept-actual').checked=v.actualDevice;
 for(const x of v.items){
  $('accept-result-'+x.id).value=x.result;$('accept-note-'+x.id).value=x.note;
  if($('accept-hash-'+x.id))$('accept-hash-'+x.id).value=x.hash;
 }
}
$('accept-kind').onchange=()=>{render();message('类型已切换，条目重新标为未完成。之前保存的草稿没有自动覆盖。');};
document.addEventListener('input',invalidate);
$('accept-export').onclick=()=>{
 invalidate();try{$('accept-output').value=JSON.stringify(makeDeviceAcceptance(collect()),null,2);$('accept-copy').disabled=false;message('已生成实际观察记录；结果没有独立认证，复制保存后交回本次任务。');}catch(e){message(e.message);}
};
$('accept-save').onclick=()=>{
 try{const input=collect();makeDeviceAcceptance(input);const raw=JSON.stringify(input);
  localStorage.setItem(KEY,raw);if(localStorage.getItem(KEY)!==raw)throw Error('草稿保存失败');message('草稿已保存在本机；不等于通过，也没有上传。');
 }catch(e){message(e.message);}
};
$('accept-restore').onclick=()=>{
 try{const raw=localStorage.getItem(KEY);if(!raw)throw Error('没有保存过草稿');if(raw.length>32768)throw Error('草稿超限');
  restore(JSON.parse(raw));message('已恢复自报草稿；继续实际执行未完成项。');
 }catch(e){message(e.message);}
};
$('accept-copy').onclick=async()=>{
 try{await navigator.clipboard.writeText($('accept-output').value);message('已复制，请保存或回传。');}
 catch{$('accept-output').focus();$('accept-output').select();message('系统未允许自动复制，已选中文本，请手动复制；不能记自动复制通过。');}
};
$('accept-environment').textContent=`当前浏览器报告视口 ${innerWidth} × ${innerHeight}；触点 ${navigator.maxTouchPoints??0}。这些值不能证明实际 Android 硬件或插件。`;
render();
for(const id of ['accept-kind','accept-device','accept-browser','accept-revision','accept-actual','accept-save','accept-restore','accept-export'])$(id).disabled=false;
message('先在真实设备执行；未执行项保留未完成。');
