import {parseArtifact} from './creator-package.mjs';
import {makeHost} from './creator.mjs';
export async function createCreatorReplay(artifact,actions,plain){
  const pack=await parseArtifact(JSON.stringify(artifact));
  if(typeof plain!=='boolean' || !Array.isArray(actions) || actions.length!==4 || !Array.from(actions).every(x=>Number.isInteger(x)&&(x===0||x===1)))throw Error('请先完成四回合；动作必须为四个整数位');
  const hosts=['training','door'].map(w=>makeHost(pack.next,pack.request,w,plain));
  actions.forEach((t,v)=>hosts.forEach(h=>h.act(v,t)));
  return {schema:'tapeweave-creator-replay-v1',authenticated:false,chain_identity:null,artifact:pack,actions:[...actions],plain,results:hosts.map(h=>h.snapshot())};
}
function equal(a,b){
 if(a===b)return true;
 if(!a||!b||typeof a!=='object'||typeof b!=='object'||Array.isArray(a)!==Array.isArray(b))return false;
 const keys=Object.keys(a);return keys.length===Object.keys(b).length&&keys.every(k=>Object.hasOwn(b,k)&&equal(a[k],b[k]));
}
export async function verifyCreatorReplay(text){
 if(typeof text!=='string'||new TextEncoder().encode(text).length>32768)throw Error('回放超过32 KiB');
 const r=JSON.parse(text);
 if(!r||typeof r!=='object')throw Error('非法回放');
 const expected=await createCreatorReplay(r.artifact,r.actions,r.plain);
 if(!equal(r,expected))throw Error('回放字段或双宿主结果不一致');
 return expected;
}
