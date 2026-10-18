import {connectWork} from '../work.mjs';
const $=id=>document.getElementById(id);let player=null,revision=0;
function stop(){revision++;player=null;for(const id of ['charge','use'])$(id).disabled=true;$('effect').textContent='配置已变化，请重新装载';$('state').textContent='';$('status').textContent='';}
$('package').oninput=stop;$('mode').onchange=stop;
$('load').onclick=async()=>{stop();const token=revision;try{const next=await connectWork($('package').value,{mode:$('mode').value});if(token!==revision)return;player=next;$('effect').textContent='已装载；请用自己的内容替换此效果';$('state').textContent=JSON.stringify(player.snapshot(),null,2);for(const id of ['charge','use'])$(id).disabled=false;}catch(e){if(token===revision)$('status').textContent=e.message;}};
for(const id of ['charge','use'])$(id).onclick=()=>{if(!player)return;try{const s=player.step(player.snapshot().version,{trigger:id==='use'?1:0,recharge:id==='charge'?1:0});const request=s.trace.at(-1).request;
// 开发者任务：替换为你自己应用的内容效果。不能把request当作权限或奖励。
$('effect').textContent=request===1?'有效请求：由你的应用决定效果':'本步无请求';$('state').textContent=JSON.stringify(s,null,2);$('status').textContent='本地未认证，无链动作';for(const key of ['charge','use'])$(key).disabled=s.version>=64;
}catch(e){$('status').textContent=e.message;}};
