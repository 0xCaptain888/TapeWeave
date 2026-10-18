import {compile} from './creator.mjs';
export async function createArtifact(next,request){
  const hex=compile(next,request);
  const digest=await crypto.subtle.digest('SHA-256',Uint8Array.from(hex.match(/../g),x=>parseInt(x,16)));
  const sha256=[...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
  return {schema:'tapeweave-creator-experiment-v1',evidence:'author-local-only',chain_identity:null,next:[...next],request:[...request],netlist_hex:hex,sha256};
}
export async function parseArtifact(text){
  if(typeof text!=='string' || new TextEncoder().encode(text).length>16384)throw Error('创作包超过16 KiB');
  const p=JSON.parse(text);
  if(!p || typeof p!=='object' || Array.isArray(p) || Object.keys(p).sort().join(',')!=='chain_identity,evidence,netlist_hex,next,request,schema,sha256')throw Error('非法创作包字段');
  const expected=await createArtifact(p.next,p.request);
  for(const k of Object.keys(expected))if(JSON.stringify(p[k])!==JSON.stringify(expected[k]))throw Error('创作包字节、摘要或证据标记不匹配');
  return expected;
}
