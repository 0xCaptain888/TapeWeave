// Explicit receiver-side fork, not identity, automatic migration or remote update.
import {parseWork} from './work.mjs';
import {compareWorks} from './work-library.mjs';
import {restoreSession,createSession} from './work-session.mjs';
export async function inspectUpgrade(record,text){
 const old=await restoreSession(JSON.stringify(record)),work=await parseWork(text);
 const comparison=await compareWorks(JSON.stringify(old.record.work),JSON.stringify(work));
 return {...comparison,can_preserve:comparison.same_behavior&&old.record.work.scene===work.scene,steps:old.record.commands.length,work};
}
export async function applyUpgrade(record,text,policy){
 const prior=await restoreSession(JSON.stringify(record));const review=await inspectUpgrade(prior.record,text);
 if(!['preserve','restart'].includes(policy))throw Error('请选择保留进度或从零开始');
 if(policy==='preserve'&&!review.can_preserve)throw Error('规则或场景已变化，只能显式从零开始');
 const next=await createSession(JSON.stringify(review.work),prior.record.mode);
 if(policy==='preserve')next.commands=structuredClone(prior.record.commands);
 await restoreSession(JSON.stringify(next));
 return {record:next,previous:prior.record};
}
