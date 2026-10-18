// Recompute author exhibition records locally. Never authenticates their origin.
import {connectWork} from './work.mjs';
const exact=(x,keys)=>x&&typeof x==='object'&&!Array.isArray(x)&&Object.keys(x).sort().join(',')===[...keys].sort().join(',');
const canonical=x=>Array.isArray(x)?x.map(canonical):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;
const same=(a,b)=>JSON.stringify(canonical(a))===JSON.stringify(canonical(b));
export async function verifyExhibitRecord(text){
  if(typeof text!=='string'||new TextEncoder().encode(text).length>131072)throw Error('实验记录超过128 KiB或不是文本');
  const r=JSON.parse(text);
  if(!exact(r,['schema','authenticated','chain_identity','mode','elapsed_ms','work','applications','source'])||r.schema!=='tapeweave-author-exhibit-experiment-v1'||r.authenticated!==false||r.chain_identity!==null||r.source!=='local-author-applications-not-independent-adoption'||!Number.isSafeInteger(r.elapsed_ms)||r.elapsed_ms<0||!exact(r.applications,['exhibit','stamp']))throw Error('实验记录格式或证据标记不合法');
  const a=r.applications.exhibit,b=r.applications.stamp;
  if(!exact(a,['snapshot','revealed'])||!exact(b,['snapshot','stock','stamps']))throw Error('应用记录格式不合法');
  let revealed=false,stock=1,stamps=0;
  for(const [kind,app] of [['exhibit',a],['stamp',b]]){
    const player=await connectWork(JSON.stringify(r.work),{mode:r.mode});
    if(!exact(app.snapshot,['version','latch','trace'])||!Array.isArray(app.snapshot.trace)||app.snapshot.trace.length>64)throw Error('应用轨迹不合法');
    for(const row of app.snapshot.trace){
      if(!exact(row,['version','old','trigger','recharge','next','request'])||!((row.trigger===0&&row.recharge===1)||(row.trigger===1&&row.recharge===0)))throw Error('展览仅支持领取或使用操作');
      if(kind==='stamp'&&row.trigger===1&&stock===0)throw Error('空库存不能继续使用');
      const state=player.step(row.version,{trigger:row.trigger,recharge:row.recharge});
      if(!same(state.trace.at(-1),row))throw Error('行为轨迹计算不一致');
      if(row.request===1){if(kind==='exhibit')revealed=true;else if(row.trigger===1){stock--;stamps++;}}
    }
    if(!same(player.snapshot(),app.snapshot))throw Error('最终快照计算不一致');
  }
  if(a.revealed!==revealed||b.stock!==stock||b.stamps!==stamps)throw Error('应用效果或库存计算不一致');
  return {authenticated:false,chain_identity:null,mode:r.mode,sha256:r.work.artifact.sha256,completed:Number(revealed)+Number(stamps>0),steps:{exhibit:a.snapshot.version,stamp:b.snapshot.version},elapsed_ms:r.elapsed_ms};
}
