const $=id=>document.getElementById(id);
const key='tapeweave-durable-ui-v1';
let record,ready=false,busy=false,snapshot=null,listNext=null;
function save(){sessionStorage.setItem(key,JSON.stringify(record));}
try{
 record=JSON.parse(sessionStorage.getItem(key)??'null')??{token:'',session:'',pending:null};
 if(location.hash){record.token=location.hash.slice(1);history.replaceState(null,'',location.pathname);save();}
 if(typeof record.token!=='string'||!/^[a-f0-9]{64}$/.test(record.token)||typeof record.session!=='string')throw Error('请使用Node启动时输出的完整URL');
 save();ready=true;if(record.session)$('session').value=record.session;
}catch(e){$('error').textContent='本地凭据／标签页存储不可用：'+e.message;}
function render(){
 for(const id of ['create','load','list'])$(id).disabled=busy||!ready;
 $('list-next').disabled=busy||!ready||!listNext;
 for(const button of $('sessions').querySelectorAll('button'))button.disabled=busy||!ready||!!record?.pending;
 for(const id of ['wait','fire'])$(id).disabled=busy||!snapshot||snapshot.version>=4||!!record?.pending;
 $('retry').disabled=busy||!ready||!record?.pending;
 $('export').disabled=busy||!snapshot||snapshot.version!==4||!!record?.pending;
 if(!snapshot)return;
 $('summary').textContent=`会话 ${snapshot.session} · 版本 ${snapshot.version}/4 · ${snapshot.config.plain?'普通共享真值表':'字节求值'}\n`+snapshot.hosts.map((h,i)=>`${i===0?'训练':'门'}: 得分 ${h.score} · 资源 ${h.resource}`).join('\n');
 $('trace').replaceChildren();
 for(const [i,h] of snapshot.hosts.entries())for(const r of h.trace){const tr=document.createElement('tr');for(const v of [i===0?'训练':'门',r.turn+1,r.old,r.trigger,r.recharge,r.request,r.next,r.obstacle??'—',r.effect]){const td=document.createElement('td');td.textContent=String(v);tr.append(td);}$('trace').append(tr);}
}
async function api(op,b){
 const response=await fetch('/api/'+op,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+record.token},body:JSON.stringify(b),signal:AbortSignal.timeout(10000)});
 const data=await response.json();if(!response.ok)throw Error(data.error??'请求失败');return data;
}
function clearExport(){$('replay').value='';$('copy').disabled=true;$('copy-status').textContent='';}
async function run(fn){if(busy||!ready)return;busy=true;$('error').textContent='';clearExport();render();try{await fn();}catch(e){$('error').textContent=e.message;}finally{busy=false;render();}}
async function load(session){
 const s=await api('show',{session});
 record.session=session;save();snapshot=s;$('status').textContent='已读取持久快照；未认证、无链身份。';
}
async function loadSession(session){
 if(record.pending && record.pending.session!==session)throw Error('存在待确认命令，请先处理原会话');
 await load(session);$('session').value=session;
}
async function listSessions(after=''){
 // Clear old controls before reading; an error must not leave stale pagination.
 listNext=null;$('sessions').replaceChildren();$('list-status').textContent='读取中…';
 try{
  const result=await api('list',{after});listNext=result.next;
  for(const s of result.sessions){
   const item=document.createElement('li'),button=document.createElement('button');
   button.textContent=`${s.session} · ${s.version}/4 · ${s.plain?'普通共享真值表':'字节求值'}`;
   button.onclick=()=>run(()=>loadSession(s.session));item.append(button);$('sessions').append(item);
  }
  $('list-status').textContent=result.sessions.length?`本页${result.sessions.length}项${listNext?'，仍有下一页':'，已到末页'}。列表不是自动更新；选择会话时重新读取最新快照。`:'没有已保存会话。';
 }catch(e){$('list-status').textContent='列表读取失败；未改变当前会话。';throw e;}
}
$('list').onclick=()=>run(()=>listSessions());
$('list-next').onclick=()=>run(()=>listSessions(listNext));
$('create').onclick=()=>run(async()=>{
 if(record.pending)throw Error('先重试或读取待确认命令的原会话，不能新建');
 const session=$('session').value;
 await api('create',{session,artifact:$('artifact').value,plain:$('mode').value==='plain'});await load(session);
});
$('load').onclick=()=>run(async()=>{
 const session=$('session').value;
 await loadSession(session);
 // A successful read is an explicit refresh after a definitive version conflict.
 // Do not discard uncertain commands: retry can still obtain their receipt.
});
async function submit(){
 const pending=record.pending;if(!pending)throw Error('没有待确认命令');
 const receipt=await api('act',pending);
 record.pending=null;save();
 await load(pending.session);$('status').textContent=`命令已确认（回执版本${receipt.version}），显示重新读取的最新快照。`;
}
for(const [id,trigger] of [['wait',0],['fire',1]])$(id).onclick=()=>run(async()=>{
 record.pending={session:snapshot.session,command:{id:crypto.randomUUID(),version:snapshot.version,trigger}};
 save();await submit();
});
$('retry').onclick=()=>run(async()=>{
 try{await submit();}catch(e){
  // Definitive stale-version response cannot be committed for this exact payload.
  if(e.message==='旧版本或本局结束'){const session=record.pending.session;record.pending=null;save();await load(session);throw Error('该命令因版本冲突未提交，已读取最新快照；请重新选择动作');}
  throw e;
 }
});
$('export').onclick=()=>run(async()=>{
 const replay=await api('export',{session:snapshot.session});$('replay').value=JSON.stringify(replay,null,2);$('copy').disabled=false;
});
$('copy').onclick=async()=>{
 const text=$('replay').value;if(!text)return;
 try{await navigator.clipboard.writeText(text);if($('replay').value===text)$('copy-status').textContent='已复制未认证回放。';}
 catch{if($('replay').value===text){$('replay').focus();$('replay').select();$('copy-status').textContent='剪贴板不可用，已选中，请手动复制。';}}
};
render();if(ready&&record.session)run(()=>load(record.session));
