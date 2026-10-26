// Bounded readonly agreement between two URLs. They may share infrastructure.
import {address,sessionCall,decodeSession} from './chain-host.mjs';
import {HOST,RUNTIME_SHA256,quantity} from './chain-wallet.mjs?v=history-20261026-1';
export const CROSSCHECK_ENDPOINTS=Object.freeze(['https://rpc.xlayer.tech','https://xlayerrpc.okx.com']);
export const MAX_HEAD_GAP=128n;
const HASH=/^0x[0-9a-fA-F]{64}$/,hex=n=>'0x'+n.toString(16);
async function runtimeDigest(code){
 if(typeof code!=='string'||!/^0x(?:[0-9a-fA-F]{2})+$/.test(code)||code.length>65538)throw Error('宿主代码格式或大小错误');
 const bytes=Uint8Array.from(code.slice(2).match(/../g),x=>parseInt(x,16));
 return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),x=>x.toString(16).padStart(2,'0')).join('');
}
function block(value,tag){
 if(!value||quantity(value.number)!==quantity(tag)||typeof value.hash!=='string'||!HASH.test(value.hash))throw Error('核验区块格式错误');
 return value.hash.toLowerCase();
}
async function both(fn){
 const results=await Promise.allSettled(CROSSCHECK_ENDPOINTS.map(fn));
 const failure=results.find(r=>r.status==='rejected');
 if(failure)throw failure.reason;
 return results.map(r=>r.value);
}
export async function crossCheckSession(rpc,{host,session}){
 if(address(host)!==HOST.toLowerCase())throw Error('交叉核验仅支持已发布的固定宿主');
 const data=sessionCall(session);
 const heads=await both(async endpoint=>{
  if(quantity(await rpc(endpoint,'eth_chainId',[]))!==196n)throw Error('交叉核验端点网络不符');
  return quantity(await rpc(endpoint,'eth_blockNumber',[]));
 });
 const low=heads[0]<heads[1]?heads[0]:heads[1],high=heads[0]>heads[1]?heads[0]:heads[1];
 if(high-low>MAX_HEAD_GAP||low<2n)throw Error('两端点链头差距过大或高度不足，无法交叉核验');
 const tag=hex(low-2n);
 const observations=await both(async(endpoint,i)=>{
  const hash=block(await rpc(endpoint,'eth_getBlockByNumber',[tag,false]),tag);
  const digest=await runtimeDigest(await rpc(endpoint,'eth_getCode',[HOST,tag]));
  if(digest!==RUNTIME_SHA256)throw Error('交叉核验宿主运行时代码与固定版本不符');
  const raw=await rpc(endpoint,'eth_call',[{to:HOST,data},tag]);
  const snapshot=decodeSession(raw);
  return {endpoint,head:hex(heads[i]),block_hash:hash,runtime_sha256:digest,snapshot};
 });
 if(observations[0].block_hash!==observations[1].block_hash)throw Error('两端点的固定区块哈希不一致');
 if(JSON.stringify(observations[0].snapshot)!==JSON.stringify(observations[1].snapshot))throw Error('两端点的固定区块会话状态不一致');
 await both(async(_,i)=>{
  const o=observations[i];
  const again=block(await rpc(o.endpoint,'eth_getBlockByNumber',[tag,false]),tag);
  if(again!==o.block_hash)throw Error('交叉核验期间区块发生变化');
 });
 return {format:'tapeweave-session-crosscheck-v1',chain_id:196,host:HOST.toLowerCase(),session,
  block:tag,block_hash:observations[0].block_hash,verified_host:true,provider_agreement:true,
  independent_providers:false,finality_proven:false,snapshot:observations[0].snapshot,observations};
}
