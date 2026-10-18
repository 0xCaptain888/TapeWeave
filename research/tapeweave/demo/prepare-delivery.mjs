// Reproducible engineering handoff summary, not a competition submission.
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {parseArtifact} from './creator-package.mjs';
import {verifyCreatorReplay} from './creator-replay.mjs';
import {verifyBindingTranscript} from './xlayer-binding.mjs';
import {readLocalFile} from './read-local-file.mjs';
import {verifyRpcHost} from './verify-rpc-host.mjs';
export async function prepareDelivery(artifactText,replayText,bindingText,rpcHostText){
 const artifact=await parseArtifact(artifactText),replay=await verifyCreatorReplay(replayText);
 if(replay.artifact.sha256!==artifact.sha256)throw Error('交付创作包与回放不是同一字节制品');
 const binding=bindingText===undefined?null:await verifyBindingTranscript(artifact,JSON.parse(bindingText));
 const rpcHost=rpcHostText===undefined?null:await verifyRpcHost(artifactText,rpcHostText);
 if(rpcHost){
  const transcript=JSON.parse(rpcHostText);
  if(replay.plain||transcript.snapshot.version!==4||!isDeepStrictEqual(transcript.snapshot.hosts,replay.results))throw Error('RPC宿主记录与交付回放不一致');
  if(binding&&(binding.processor!==transcript.binding.processor||binding.circuit!==transcript.binding.circuit||binding.block!==transcript.binding.block))throw Error('两个绑定指向不同对象');
 }
 const digest=text=>createHash('sha256').update(text,'utf8').digest('hex');
 return {schema:'tapeweave-engineering-handoff-v1',evidence:'author-local-engineering-only',authenticated:false,competition_ready:false,
 artifact_sha256:artifact.sha256,files:{artifact_utf8_sha256:digest(artifactText),replay_utf8_sha256:digest(replayText),binding_utf8_sha256:bindingText===undefined?null:digest(bindingText),rpc_host_utf8_sha256:rpcHostText===undefined?null:digest(rpcHostText)},
 rpc_host:rpcHost,
 replay:{actions:replay.actions,plain:replay.plain,training_score:replay.results[0].score,door_score:replay.results[1].score,remaining_keys:replay.results[1].resource},
 readonly_binding:binding?{processor:binding.processor,circuit:binding.circuit,block:binding.block,chain_id:196,transcript_consistent:true,rpc_provenance_authenticated:false}:null,
 missing:['项目制造交易及制造者证据','真实双宿主消费交易与权限／重放边界','费用与延迟实测','独立任务与公平普通对照结果','实际设备与系统剪贴板验收','180秒内视频文件','当前官方资格与最终提交字段复核','真实投稿资料及最终内容确认'],
 notice:'文件摘要识别输入文本；只读记录可被自造，不认证来源、制造、所有权、宿主消费或参赛资格。未执行报名或投稿。'};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const [artifact,replay,binding,rpcHost,...extra]=process.argv.slice(2);
 try{
  if(!artifact||!replay||extra.length)throw Error('usage: node prepare-delivery.mjs ARTIFACT_FILE REPLAY_FILE [BINDING_REPORT_FILE [RPC_HOST_RECORD_FILE]]');
  console.log(JSON.stringify(await prepareDelivery(await readLocalFile(artifact,16384),await readLocalFile(replay,32768),binding?await readLocalFile(binding,262144):undefined,rpcHost?await readLocalFile(rpcHost,524288):undefined),null,2));
 }catch(e){console.error('工程交付检查失败：'+e.message);process.exitCode=1;}
}
