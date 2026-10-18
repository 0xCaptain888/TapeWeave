import {verifyBindingTranscript} from './xlayer-binding.mjs';
import {readLocalFile} from './read-local-file.mjs';
const [artifact,report,...extra]=process.argv.slice(2);
try{
 if(!artifact||!report||extra.length)throw Error('usage: node verify-xlayer-binding.mjs ARTIFACT_FILE REPORT_FILE');
 const result=await verifyBindingTranscript(await readLocalFile(artifact,16384),JSON.parse(await readLocalFile(report,262144)));
 console.log(JSON.stringify({consistent:true,authenticated:false,block:result.block,processor:result.processor,circuit:result.circuit,artifact_sha256:result.artifact_sha256,note:'仅离线重算自述RPC记录；不认证RPC来源或链上制造者'},null,2));
}catch(e){console.error('只读记录复核失败：'+e.message);process.exitCode=1;}
