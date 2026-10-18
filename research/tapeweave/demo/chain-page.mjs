import {address,plan,sessionCall,decodeSession} from './chain-host.mjs';
const $=id=>document.getElementById(id);let revision=0;
const clear=()=>{revision++;$('status').textContent='';$('snapshot').textContent='';$('draft').value='';};
for(const id of ['host','session','operation','circuit','version','trigger'])$(id).addEventListener('input',clear);
async function rpc(method,params){
 const r=await fetch('https://rpc.xlayer.tech',{method:'POST',redirect:'error',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params}),signal:AbortSignal.timeout(15000)});
 if(!r.ok)throw Error('RPC HTTP '+r.status);
 const reader=r.body.getReader();let size=0;const chunks=[];
 try{while(true){const x=await reader.read();if(x.done)break;size+=x.value.length;if(size>65536)throw Error('RPC超过64 KiB');chunks.push(x.value);}}finally{await reader.cancel();}
 const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}
 const j=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
 if(j.error||j.id!==1||j.jsonrpc!=='2.0'||typeof j.result!=='string')throw Error('RPC响应错误');return j.result;
}
$('plan').onclick=()=>{clear();try{$('draft').value=JSON.stringify(plan({host:$('host').value,session:$('session').value,version:$('version').value,trigger:$('trigger').value==='1',circuit:$('circuit').value,operation:$('operation').value}),null,2);$('status').textContent='仅生成草案，宿主身份未验证；没有发送或模拟。';}catch(e){$('status').textContent=e.message;}};
$('read').onclick=async()=>{
 clear();const captured=revision;$('read').disabled=true;
 try{
  const host=address($('host').value),data=sessionCall($('session').value);
  if(await rpc('eth_chainId',[])!=='0xc4')throw Error('不是X Layer196');
  const block=await rpc('eth_blockNumber',[]);if(!/^0x[0-9a-f]+$/.test(block))throw Error('非法块号');
  const code=await rpc('eth_getCode',[host,block]);if(!/^0x(?:[0-9a-fA-F]{2})+$/.test(code))throw Error('候选地址没有代码');
  const snapshot=decodeSession(await rpc('eth_call',[{to:host,data},block]));
  if(captured===revision){$('snapshot').textContent=JSON.stringify({host,block,verified_host:false,snapshot},null,2);$('status').textContent='单端读取完成，未验证宿主身份、未推进状态。';}
 }catch(e){if(captured===revision)$('status').textContent='读取失败：'+e.message;}
 finally{$('read').disabled=false;}
};
