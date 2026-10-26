// Bounded local cache and readonly discovery. Imported data never authorizes a send.
import {address,sessionCall} from './chain-host.mjs';
import {HOST,OPENED,quantity,validatePending} from './chain-wallet.mjs?v=history-20261026-1';
export const HISTORY_KEY='tapeweave-wallet-history-v1';
export const DEPLOYMENT_BLOCK=74224206n;
export const MAX_HISTORY_BYTES=1048576;
export const MAX_SCAN_BLOCKS=100;
const FORMAT='tapeweave-wallet-history-v1',HASH=/^0x[0-9a-fA-F]{64}$/;
const hex=x=>'0x'+x.toString(16),word=x=>BigInt(x).toString(16).padStart(64,'0');
const canonical=v=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?
 Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;
const equal=(a,b)=>JSON.stringify(canonical(a))===JSON.stringify(canonical(b));
function fields(o,keys){
 if(!o||typeof o!=='object'||Array.isArray(o)||Object.keys(o).sort().join()!==keys.slice().sort().join())throw Error('历史记录字段错误');
}
function hash(v){if(typeof v!=='string'||!HASH.test(v))throw Error('历史交易／区块哈希错误');return v.toLowerCase();}
function account(v){if(address(v)!==v)throw Error('历史账户必须为规范地址');return v;}
function session(v){sessionCall(v);return v;}
function timestamp(v){if(!Number.isSafeInteger(v)||v<0)throw Error('历史时间格式错误');return v;}
function observation(v){
 fields(v,['account','session','circuit','hash','block','blockHash','logIndex']);
 account(v.account);session(v.session);
 if(![1,2].includes(v.circuit))throw Error('历史卡片错误');
 quantity(v.block);quantity(v.logIndex);
 return {...v,hash:hash(v.hash),blockHash:hash(v.blockHash)};
}
function entry(v){
 fields(v,['intent','result','observedAt']);
 timestamp(v.observedAt);
 fields(v.intent,['format','chain','host','account','operation','circuit','session','version','trigger','before','created','expires','phase','hash','tx']);
 fields(v.intent.tx,['from','to','value','data','chainId','gas','gasPrice','nonce']);
 validatePending(v.intent);account(v.intent.account);
 const p=v.intent,r=v.result;
 if(p.operation==='open'&&(p.session!==null||p.version!==null||p.trigger!==null||p.before!==null))throw Error('历史开局字段错误');
 if(p.before){
  fields(p.before,['player','circuit','version','training','door']);
  for(const world of [p.before.training,p.before.door])fields(world,['latch','score','resource']);
 }
 if(p.phase!=='submitted'||!p.hash)throw Error('历史意图没有交易哈希');
 fields(r,r.failed?['hash','failed','fee','block','blockHash']:
  ['hash','session','state','fee','block','blockHash','logIndex','laterActionsInBlock']);
 hash(r.hash);hash(r.blockHash);quantity(r.block);
 if(r.hash.toLowerCase()!==p.hash.toLowerCase()||typeof r.fee!=='string'||!/^(0|[1-9][0-9]{0,155})$/.test(r.fee))throw Error('历史回执不符');
 if(r.failed!==undefined){
  if(r.failed!==true)throw Error('历史回滚状态错误');
 }else{
  session(r.session);quantity(r.logIndex);
  if(p.operation==='act'&&r.session!==p.session)throw Error('历史会话不符');
  const s=r.state;
  fields(s,['player','circuit','version','training','door']);
  for(const world of [s.training,s.door]){
   fields(world,['latch','score','resource']);
   if(!Object.values(world).every(x=>Number.isInteger(x)&&x>=0&&x<=4)||world.latch>1)throw Error('历史世界状态错误');
  }
  if(s.player!==p.account||s.circuit!==p.circuit||!Number.isInteger(s.version)||s.version<0||s.version>4||
   s.training.resource!==s.training.score||s.training.score>s.version||s.door.score>s.version||s.door.score+s.door.resource!==2||
   typeof r.laterActionsInBlock!=='boolean'||s.version<(p.operation==='open'?0:p.version+1))throw Error('历史状态不符');
 }
 // Copy and normalize through JSON; caller mutations cannot alter stored snapshots.
 return JSON.parse(JSON.stringify(v));
}
const empty=()=>({format:FORMAT,chain:196,host:HOST,entries:[],discovered:[]});
export function validateHistory(value){
 fields(value,['format','chain','host','entries','discovered']);
 if(value.format!==FORMAT||value.chain!==196||value.host!==HOST||!Array.isArray(value.entries)||value.entries.length>500||
  !Array.isArray(value.discovered)||value.discovered.length>1000)throw Error('历史格式、网络或数量超限');
 const v={...empty(),entries:value.entries.map(entry),discovered:value.discovered.map(observation)};
 if(new Set(v.entries.map(x=>x.result.hash.toLowerCase())).size!==v.entries.length||
  new Set(v.discovered.map(x=>x.session)).size!==v.discovered.length)throw Error('历史含重复交易或会话');
 const owners=new Map();
 for(const x of [...v.discovered,...v.entries.filter(e=>!e.result.failed).map(e=>({
  session:e.result.session,account:e.intent.account,circuit:e.intent.circuit}))]){
  const identity=x.account+':'+x.circuit,prior=owners.get(x.session);
  if(prior&&prior!==identity)throw Error('历史会话账户或卡片冲突');
  owners.set(x.session,identity);
 }
 if(new TextEncoder().encode(JSON.stringify(v)).length>MAX_HISTORY_BYTES)throw Error('历史超过 1 MiB，请先导出备份');
 return v;
}
function parse(text){
 if(typeof text!=='string'||text.length>MAX_HISTORY_BYTES||new TextEncoder().encode(text).length>MAX_HISTORY_BYTES)throw Error('历史备份超过 1 MiB');
 return validateHistory(JSON.parse(text));
}
export class WalletHistory{
 constructor(storage,{now=()=>Date.now()}={}){this.storage=storage;this.now=now;}
 load(){const raw=this.storage.getItem(HISTORY_KEY);return raw===null?empty():parse(raw);}
 write(old,next){
  const raw=JSON.stringify(validateHistory(next));
  if(this.storage.getItem(HISTORY_KEY)!==old)throw Error('另一页面已修改历史，请重新读取');
  this.storage.setItem(HISTORY_KEY,raw);
  if(this.storage.getItem(HISTORY_KEY)!==raw)throw Error('历史保存失败，待处理交易仍保留');
  return next;
 }
 merge(value){
  const incoming=validateHistory(value),old=this.storage.getItem(HISTORY_KEY),current=old===null?empty():parse(old);
  const entries=new Map(current.entries.map(e=>[e.result.hash.toLowerCase(),e]));
  for(const e of incoming.entries){
   const key=e.result.hash.toLowerCase(),prior=entries.get(key);
   if(prior&&!equal({intent:prior.intent,result:prior.result},{intent:e.intent,result:e.result}))throw Error('相同交易的记录冲突，未合并');
   if(!prior)entries.set(key,e);
  }
  const discovered=new Map(current.discovered.map(s=>[s.session,s]));
  for(const s of incoming.discovered){
   const prior=discovered.get(s.session);
   if(prior&&!equal(prior,s))throw Error('相同会话的开局记录冲突，需重新核查');
   discovered.set(s.session,s);
  }
  const next={...empty(),entries:[...entries.values()],discovered:[...discovered.values()]};
  this.write(old,next);return next;
 }
 record(intent,result){return this.merge({...empty(),entries:[entry({intent,result,observedAt:this.now()})]});}
 remember(discovered){return this.merge({...empty(),discovered});}
 // Keep exports within the same byte limit as storage so every export can be imported.
 export(){return JSON.stringify(this.load());}
 import(text){return this.merge(parse(text));}
 sessions(owner){
  owner=account(owner);const h=this.load(),found=new Map();
  for(const s of h.discovered)if(s.account===owner)found.set(s.session,{session:s.session,circuit:s.circuit,version:null,source:'discovered'});
  for(const e of h.entries){
   if(e.intent.account!==owner||e.result.failed)continue;
   const id=e.result.session,prior=found.get(id),s=e.result.state;
   if(!prior||prior.version===null||s.version>prior.version)found.set(id,{session:id,circuit:s.circuit,version:s.version,source:'cached'});
  }
  return [...found.values()].sort((a,b)=>BigInt(a.session)>BigInt(b.session)?-1:1);
 }
 entries(owner){return this.load().entries.filter(e=>e.intent.account===account(owner)).sort((a,b)=>b.observedAt-a.observedAt);}
}
// Current public endpoint permits 100 blocks per request. Never imply full history.
export async function discoverOpened(run,{account:owner,from,span=MAX_SCAN_BLOCKS}){
 owner=account(owner);
 if(typeof from!=='string'||!/^(0|[1-9][0-9]{0,77})$/.test(from)||!Number.isInteger(span)||span<1||span>MAX_SCAN_BLOCKS)throw Error('扫描起点或范围错误');
 const start=BigInt(from),head=await run.head(),height=quantity(head.number);
 if(start<DEPLOYMENT_BLOCK||start>height)throw Error('起点必须位于宿主部署块与当前块之间');
 const end=start+BigInt(span)-1n<height?start+BigInt(span)-1n:height;
 const anchor=await run.block(hex(end));
 const logs=await run.rpc('eth_getLogs',[{address:HOST,fromBlock:hex(start),toBlock:hex(end),
  topics:[OPENED,null,'0x'+'0'.repeat(24)+owner.slice(2)]}]);
 if(!Array.isArray(logs)||logs.length>100)throw Error('日志超限，请缩小范围后重试');
 const seen=new Set(),blocks=new Map(),sessions=new Set(),observations=[];
 for(const l of logs){
  if(!l||l.removed||l.address?.toLowerCase()!==HOST.toLowerCase()||!Array.isArray(l.topics)||l.topics.length!==3||
   l.topics[0]!==OPENED||l.topics[2]!=='0x'+'0'.repeat(24)+owner.slice(2)||!HASH.test(l.topics[1]??'')||
   !/^0x[0-9a-fA-F]{64}$/.test(l.data??''))throw Error('开局日志格式或账户不符');
  const n=quantity(l.blockNumber),index=quantity(l.logIndex),circuit=Number(BigInt(l.data));
  if(n<start||n>end||![1,2].includes(circuit))throw Error('开局日志超出范围');
  const id=BigInt(l.topics[1]).toString(),key=hash(l.transactionHash)+':'+index;session(id);
  if(seen.has(key)||sessions.has(id))throw Error('重复开局日志');seen.add(key);sessions.add(id);
  if(!blocks.has(l.blockNumber))blocks.set(l.blockNumber,await run.block(l.blockNumber));
  if(blocks.get(l.blockNumber).hash.toLowerCase()!==hash(l.blockHash))throw Error('开局日志不在规范区块');
  observations.push(observation({account:owner,session:id,circuit,hash:l.transactionHash,
   block:l.blockNumber,blockHash:l.blockHash,logIndex:l.logIndex}));
 }
 // Anchor both ends against reorgs observed while reading. Discovery is still single RPC.
 await run.sameBlock(anchor);await run.sameBlock(head);
 return {observations,from:start.toString(),to:end.toString(),next:end<height?(end+1n).toString():null,
  head:height.toString(),completeFromDeployment:start===DEPLOYMENT_BLOCK&&end===height};
}
