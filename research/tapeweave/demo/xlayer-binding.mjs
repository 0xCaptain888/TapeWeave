// Read-only, bounded identity/transition check for the creator subset.
// No signing, estimateGas, state overrides, manufacturing or send methods.
import {parseArtifact} from './creator-package.mjs';
export const endpoints=['https://rpc.xlayer.tech','https://xlayerrpc.okx.com'];
const word=n=>BigInt(n).toString(16).padStart(64,'0');
const bytes=s=>{if(typeof s!=='string'||!/^0x(?:[a-f0-9]{2})*$/.test(s)||s.length>32770)throw Error('非法或过大ABI响应');return s.slice(2);};
function dynamic(raw,count){
 const hex=bytes(raw);let cursor=count*64;const result=[];
 if(hex.length<cursor)throw Error('ABI头不完整');
 for(let i=0;i<count;i++){
  if(BigInt('0x'+hex.slice(i*64,i*64+64))!==BigInt(cursor/2))throw Error('非规范ABI偏移');
  const sizeHex=hex.slice(cursor,cursor+64);if(sizeHex.length!==64)throw Error('ABI长度缺失');
  const size=BigInt('0x'+sizeHex);if(size>4096n)throw Error('ABI字节数组过大');
  const length=Number(size)*2,padded=Math.ceil(Number(size)/32)*64;
  const value=hex.slice(cursor+64,cursor+64+length),padding=hex.slice(cursor+64+length,cursor+64+padded);
  if(value.length!==length||padding.length!==padded-length||/[^0]/.test(padding))throw Error('ABI长度或填充不匹配');
  result.push(value);cursor+=64+padded;
 }
 if(cursor!==hex.length)throw Error('ABI尾部多余数据');return result;
}
const tail=hex=>word(hex.length/2)+hex.padEnd(Math.ceil(hex.length/64)*64,'0');
export function encodeStep(id,state,input){return '0xe8281a1a'+word(id)+word(96)+word(160)+tail(state.toString(16).padStart(2,'0'))+tail(input.toString(16).padStart(2,'0'));}
export async function publicRead(endpoint,method,params){
 if(!endpoints.includes(endpoint)||!['eth_chainId','eth_getCode','eth_call'].includes(method))throw Error('仅允许固定公开RPC的只读方法');
 const response=await fetch(endpoint,{method:'POST',redirect:'error',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params}),signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw Error('RPC HTTP '+response.status);
 const reader=response.body.getReader();let size=0;const chunks=[];
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>65536)throw Error('RPC响应超过64 KiB');chunks.push(value);}}finally{await reader.cancel();}
 const data=new Uint8Array(size);let offset=0;for(const chunk of chunks){data.set(chunk,offset);offset+=chunk.length;}
 const json=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(data));
 if(json.jsonrpc!=='2.0'||json.id!==1||json.error||typeof json.result!=='string')throw Error('RPC响应失败或结构不匹配');return json.result;
}
export async function verifyBindingTranscript(artifact,report){
 if(!report||report.matched!==true||!Array.isArray(report.records)||report.records.length!==24||typeof report.observed_at_utc!=='string'||!Number.isFinite(Date.parse(report.observed_at_utc)))throw Error('仅复核完整成功的24条只读记录');
 let index=0;
 const replay=await checkBinding({artifact,processor:report.processor,circuit:report.circuit,block:report.block},async(endpoint,method,params)=>{
  const record=report.records[index++];
  if(!record||record.endpoint!==endpoint||record.method!==method||JSON.stringify(record.params)!==JSON.stringify(params))throw Error('记录顺序或参数不一致');
  return record.result;
 });
 replay.observed_at_utc=report.observed_at_utc;
 const canonical=v=>v&&typeof v==='object'?Array.isArray(v)?v.map(canonical):Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;
 if(!replay.matched||JSON.stringify(canonical(replay))!==JSON.stringify(canonical(report)))throw Error('只读记录或推导结论不一致');
 return replay; // Self-reported RPC text, not authenticated RPC provenance.
}
export async function checkBinding({artifact:input,processor,circuit,block},read=publicRead){
 const artifact=await parseArtifact(typeof input==='string'?input:JSON.stringify(input));
 if(typeof processor!=='string'||!/^0x[a-fA-F0-9]{40}$/.test(processor)||/^0x0{40}$/i.test(processor))throw Error('非法处理器地址');
 if(typeof circuit!=='string'||! /^(0|[1-9][0-9]{0,19})$/.test(circuit)||BigInt(circuit)>0xffffffffffffffffn)throw Error('电路ID须为uint64十进制字符串');
 if(typeof block!=='string'||!/^0x(?:0|[1-9a-f][0-9a-f]*)$/.test(block)||block.length>18)throw Error('必须指定历史块十六进制quantity，不接受latest');
 processor=processor.toLowerCase();
 const records=[];
 const request=async(endpoint,method,params)=>{
  const response=await read(endpoint,method,params);records.push({endpoint,method,params,result:response});return response;
 };
 // Never write into the original artifact or replace its null chain identity.
 const result={schema:'tapeweave-xlayer-readonly-binding-v1',evidence:'bounded-readonly-byte-and-transition-check',observed_at_utc:new Date().toISOString(),chain_id:196,processor,circuit,block,artifact_sha256:artifact.sha256,matched:false,authenticated:false,host_transactions:false,records};
 try{
  const perEndpoint=[];
  for(const endpoint of endpoints){
   if(await request(endpoint,'eth_chainId',[])!=='0xc4')throw Error('RPC网络不是X Layer 196');
   const code=await request(endpoint,'eth_getCode',[processor,block]);if(bytes(code).length===0)throw Error('指定块处理器无代码');
   const call=data=>request(endpoint,'eth_call',[{to:processor,data},block]);
   const info=bytes(await call('0x084d60f1'+word(circuit)));
   if(info.length!==256)throw Error('info必须为四个ABI字');
   const values=Array.from({length:4},(_,i)=>BigInt('0x'+info.slice(i*64,(i+1)*64)));
   if(values[0]!==2n||values[1]!==1n||values[2]!==1n)throw Error('仅支持2输入／1输出／1状态的创作子集');
   const [netlist]=dynamic(await call('0x3fc4be56'+word(circuit)),1);
   if(netlist!==artifact.netlist_hex)throw Error('链上字节与创作包不同');
   const transitions=[];
   for(let old=0;old<2;old++)for(let trigger=0;trigger<2;trigger++)for(let recharge=0;recharge<2;recharge++){
    const index=old*4+trigger*2+recharge,input=trigger+(recharge<<1);
    const [state,output]=dynamic(await call(encodeStep(circuit,old,input)),2);
    if(state!==artifact.next[index].toString(16).padStart(2,'0')||output!==artifact.request[index].toString(16).padStart(2,'0'))throw Error('链上转换与创作包不匹配（行'+index+'）');
    transitions.push({old,trigger,recharge,next:parseInt(state,16),request:parseInt(output,16)});
   }
   perEndpoint.push({code,info,netlist,transitions});
  }
  if(JSON.stringify(perEndpoint[0])!==JSON.stringify(perEndpoint[1]))throw Error('两RPC响应不一致');
  result.matched=true;result.transitions=perEndpoint[0].transitions;
 }catch(e){result.failure=e.message;}
 return result;
}
