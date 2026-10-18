// Finite interactive work delivery. No wallet, network, dynamic code or HTML execution.
import {createArtifact,parseArtifact} from './creator-package.mjs';
import {evaluate,presets} from './creator.mjs';
const exact=(o,keys)=>o&&typeof o==='object'&&!Array.isArray(o)&&Object.keys(o).sort().join(',')===[...keys].sort().join(',');
const text=(x,max)=>typeof x==='string'&&x.trim().length>0&&x.length<=max;
export async function createWork({title,description,scene,artifact}){
  if(!text(title,80)||!text(description,1200)||!['lamp','reveal'].includes(scene))throw Error('请填写标题、使用说明，并选择支持的场景');
  const checked=await parseArtifact(JSON.stringify(artifact));
  return {schema:'tapeweave-interactive-work-v1',title:title.trim(),description:description.trim(),scene,artifact:checked,authenticated:false,chain_identity:null};
}
export async function presetArtifact(name){
  if(!Object.hasOwn(presets,name))throw Error('未知模板');
  return createArtifact(presets[name].next,presets[name].request);
}
export async function parseWork(input){
  if(typeof input!=='string'||new TextEncoder().encode(input).length>32768)throw Error('作品包超过32 KiB或不是文本');
  if(!input.trim())throw Error('尚未粘贴作品包，请复制完整作品包后再试；原试用进度未改变');
  let w;try{w=JSON.parse(input);}catch{throw Error('作品包不是有效JSON，内容可能没有复制完整；请重新复制整个作品包后再试，原试用进度未改变');}
  if(!exact(w,['schema','title','description','scene','artifact','authenticated','chain_identity'])||w.schema!=='tapeweave-interactive-work-v1'||w.authenticated!==false||w.chain_identity!==null)throw Error('作品包格式或证据标记不合法');
  return createWork(w);
}
// Applications supply inputs, own state persistence, identity and effect permissions.
// This local instance provides neither authentication nor durable transactions.
export async function connectWork(input,{mode='byte'}={}){
  if(!['byte','plain'].includes(mode))throw Error('未知执行模式');
  const work=await parseWork(input),a=work.artifact;
  let state={version:0,latch:0,trace:[]};
  return {work:structuredClone(work),snapshot:()=>structuredClone(state),
    step(expectedVersion,{trigger,recharge}){
      if(expectedVersion!==state.version||![trigger,recharge].every(x=>x===0||x===1)||state.version>=64)throw Error('旧版本、非法输入或超过64步');
      const i=state.latch*4+trigger*2+recharge;
      const [next,request]=mode==='byte'?evaluate(a.netlist_hex,state.latch,trigger,recharge):[a.next[i],a.request[i]];
      const row={version:state.version,old:state.latch,trigger,recharge,next,request};
      state={version:state.version+1,latch:next,trace:[...state.trace,row]};
      return structuredClone(state);
    }};
}
export async function makeAcceptance(input,mode,trace,{result,note}){
  if(!['pass','fail','incomplete'].includes(result)||!text(note,1200)||!Array.isArray(trace)||trace.length>64)throw Error('请选择验收结果并填写实际观察（最多64步）');
  const player=await connectWork(input,{mode});
  for(const row of trace){
    if(!row||typeof row!=='object')throw Error('非法操作记录');
    const s=player.step(row.version,{trigger:row.trigger,recharge:row.recharge});
    if(JSON.stringify(s.trace.at(-1))!==JSON.stringify(row))throw Error('操作记录计算不一致');
  }
  return {schema:'tapeweave-work-acceptance-v1',source:'self-reported-not-verified',authenticated:false,chain_identity:null,work:player.work,mode,trace:player.snapshot().trace,result,note:note.trim()};
}
