import {parseWork,makeAcceptance} from './work.mjs';
const KEY='tapeweave-work-library-v1';
export function openLibrary(storage){
 const raw=()=>storage.getItem(KEY);
 function read(){const s=raw();if(s===null)return {schema:KEY,items:[]};if(s.length>2097152)throw Error('作品库过大');const o=JSON.parse(s);if(o.schema!==KEY||!Array.isArray(o.items)||o.items.length>100)throw Error('作品库损坏');const ids=new Set();for(const item of o.items){if(!item||typeof item.id!=='string'||!item.id.trim()||item.id.length>80||ids.has(item.id)||!Array.isArray(item.versions)||!item.versions.length||item.versions.length>20)throw Error('作品库条目损坏');ids.add(item.id);for(const [i,v] of item.versions.entries()){if(!v||v.version!==i+1||!v.work||v.work.schema!=='tapeweave-interactive-work-v1')throw Error('作品版本损坏');}}return o;}
 return {
 list:()=>structuredClone(read().items),
 async save(id,input){if(typeof id!=='string'||!id.trim()||id.length>80)throw Error('请填写库内作品标识（最多80字符）');const before=raw(),db=read(),work=await parseWork(input);for(const entry of db.items)for(const v of entry.versions)await parseWork(JSON.stringify(v.work));let item=db.items.find(x=>x.id===id);if(!item){if(db.items.length>=100)throw Error('最多100件作品');item={id,versions:[]};db.items.push(item);}if(item.versions.length>=20)throw Error('每件作品最多20版');const previous=item.versions.at(-1);if(previous&&JSON.stringify(previous.work)===JSON.stringify(work))throw Error('内容未变，不新增版本');item.versions.push({version:item.versions.length+1,work});const text=JSON.stringify(db);if(text.length>2097152)throw Error('作品库过大');if(raw()!==before)throw Error('作品库已变化，请刷新后重试');storage.setItem(KEY,text);return structuredClone(item.versions.at(-1));}
 };
}
export async function verifyAcceptance(input){
 if(typeof input!=='string'||new TextEncoder().encode(input).length>65536)throw Error('记录超过64 KiB');
 const r=JSON.parse(input);const expected=await makeAcceptance(JSON.stringify(r.work),r.mode,r.trace,{result:r.result,note:r.note});
 const keys=Object.keys(expected);if(Object.keys(r).length!==keys.length||keys.some(k=>JSON.stringify(r[k])!==JSON.stringify(expected[k])))throw Error('记录字段或计算不一致');
 return expected;
}
