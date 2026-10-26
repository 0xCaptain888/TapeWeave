import {address,plan,sessionCall,decodeSession} from './chain-host.mjs';
const $=id=>document.getElementById(id);let revision=0,evidence=null;
const clear=()=>{revision++;$('status').textContent='';$('snapshot').textContent='';$('draft').value='';};
for(const id of ['host','session','operation','circuit','version','trigger'])$(id).addEventListener('input',clear);
async function jsonResponse(response,limit){
 if(!response.ok)throw Error('HTTP '+response.status);
 const reader=response.body.getReader();let size=0;const chunks=[];
 try{while(true){const x=await reader.read();if(x.done)break;size+=x.value.length;if(size>limit)throw Error('响应过大');chunks.push(x.value);}}finally{await reader.cancel();}
 const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}
 return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
}
async function rpc(method,params){
 const r=await fetch('https://rpc.xlayer.tech',{method:'POST',redirect:'error',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params}),signal:AbortSignal.timeout(15000)});
 const j=await jsonResponse(r,65536);
 if(j.error||j.id!==1||j.jsonrpc!=='2.0'||!Object.hasOwn(j,'result'))throw Error('RPC响应错误');return j.result;
}
function txLink(hash,label){
 if(!/^0x[0-9a-fA-F]{64}$/.test(hash))throw Error('非法交易哈希');
 const a=document.createElement('a');a.href='https://www.oklink.com/xlayer/tx/'+hash;
 a.target='_blank';a.rel='noopener noreferrer';a.textContent=label;return a;
}
async function loadEvidence(){
 const captured=revision;
 try{
  const e=await jsonResponse(await fetch('mainnet-evidence.json',{cache:'no-cache',signal:AbortSignal.timeout(15000)}),131072);
  if(e.format!=='tapeweave-public-mainnet-evidence-v1'||e.chain_id!==196||
    e.proof?.status!=='BOTH_CARD_RUNS_VERIFIED'||e.proof.transaction_count!==11||
    e.proof.sessions?.length!==2||!/^0x(?:[0-9a-fA-F]{2})+$/.test(e.expected_runtime))throw Error('记录格式错误');
  address(e.host);address(e.account_address);
  const refs=[e.manifest.deployment,...e.manifest.sessions.flatMap(s=>[s.open,...s.actions])];
  if(refs.length!==11||new Set(refs.map(x=>x.transaction_hash)).size!==11)throw Error('交易记录不完整');
  const links=refs.map((x,i)=>txLink(x.transaction_hash,i===0?'部署交易':`交互 ${i} · ${x.transaction_hash.slice(0,10)}…`));
  const rows=e.proof.sessions.map((s,i)=>{
   if(s.circuit!==i+1||!/^[1-9][0-9]*$/.test(s.session_id)||s.final_state.version!==4)throw Error('会话记录错误');
   const tr=document.createElement('tr');
   for(const value of [`${s.circuit===1?'蓄能':'交替'} · #${s.session_id}`,s.final_state.training.score,`${s.final_state.door.score} / ${s.final_state.door.resource}`]){
    const td=document.createElement('td');td.textContent=String(value);tr.append(td);
   }
   return tr;
  });
  evidence=e;
  $('evidence-host').textContent='宿主：'+e.host;
  $('evidence-sessions').replaceChildren(...rows);$('evidence-list').replaceChildren(...links);
  $('evidence-state').textContent=`11 笔交易已记录；外层交易实付合计 ${e.outer_fee_total_wei==='0'?'0 OKB':e.outer_fee_total_wei+' wei'}，UOP 实付合计 ${e.user_operation_fee_total_wei==='0'?'0 OKB':e.user_operation_fee_total_wei+' wei'}。单 RPC 核验，签名未重验。`;
  $('evidence-status').textContent='历史运行快照已载入；实时状态尚未读取。';
  if(captured===revision&&!$('host').value)$('host').value=e.host;
  for(const id of ['card1','card2'])$(id).disabled=false;
 }catch(error){$('evidence-status').textContent='运行记录载入失败：'+error.message;}
}
$('plan').onclick=()=>{clear();try{$('draft').value=JSON.stringify(plan({host:$('host').value,session:$('session').value,version:$('version').value,trigger:$('trigger').value==='1',circuit:$('circuit').value,operation:$('operation').value}),null,2);$('status').textContent='仅生成草案，宿主身份未验证；没有发送或模拟。';}catch(e){$('status').textContent=e.message;}};
$('read').onclick=async()=>{
 clear();const captured=revision;$('read').disabled=true;
 try{
  const host=address($('host').value),data=sessionCall($('session').value);
  if(await rpc('eth_chainId',[])!=='0xc4')throw Error('不是X Layer196');
  const block=await rpc('eth_blockNumber',[]);if(!/^0x[0-9a-f]+$/.test(block))throw Error('非法块号');
  const canonical=await rpc('eth_getBlockByNumber',[block,false]);
  if(!canonical||canonical.number!==block||!/^0x[0-9a-fA-F]{64}$/.test(canonical.hash))throw Error('非法区块');
  const code=await rpc('eth_getCode',[host,block]);if(typeof code!=='string'||!/^0x(?:[0-9a-fA-F]{2})+$/.test(code))throw Error('候选地址没有代码');
  const reviewed=Boolean(evidence&&host.toLowerCase()===evidence.host.toLowerCase());
  if(reviewed&&code.toLowerCase()!==evidence.expected_runtime.toLowerCase())throw Error('宿主运行时代码与公开版本不符');
  const snapshot=decodeSession(await rpc('eth_call',[{to:host,data},block]));
  const again=await rpc('eth_getBlockByNumber',[block,false]);
  if(again?.hash!==canonical.hash)throw Error('核验期间区块发生变化');
  const saved=evidence?.proof.sessions.find(s=>s.session_id===$('session').value);
  const matches=reviewed&&Boolean(saved)&&JSON.stringify(snapshot)===JSON.stringify(saved.final_state);
  if(captured===revision){$('snapshot').textContent=JSON.stringify({host,block,block_hash:canonical.hash,verified_host:reviewed,matches_recorded_final_state:matches,snapshot},null,2);$('status').textContent=reviewed?`实时读取完成；运行时代码匹配，${matches?'当前会话与历史最终状态一致':'当前会话未匹配历史最终状态'}。单 RPC，未推进状态。`:'单端读取完成，未验证宿主身份、未推进状态。';}
 }catch(e){if(captured===revision)$('status').textContent='读取失败：'+e.message;}
 finally{$('read').disabled=false;}
};
for(const [id,index]of [['card1',0],['card2',1]])$(id).onclick=()=>{
 if(!evidence||$('read').disabled)return;
 clear();$('host').value=evidence.host;$('session').value=evidence.proof.sessions[index].session_id;
 $('read').click();
};
await loadEvidence();
