// Offline file verification only: no RPC, wallet, HTTP server or writes.
import {readLocalFile} from './read-local-file.mjs';
import {parseArtifact} from './creator-package.mjs';
import {verifyCreatorReplay} from './creator-replay.mjs';
const [kind,path,...extra]=process.argv.slice(2);
if(!['artifact','replay'].includes(kind)||!path||extra.length){
 console.error('usage: node verify-creator.mjs artifact|replay FILE');process.exitCode=2;
}else{
 try{
  const limit=kind==='artifact'?16384:32768;
  const text=await readLocalFile(path,limit);
  if(kind==='artifact'){
   const p=await parseArtifact(text);
   console.log(JSON.stringify({valid:true,kind,sha256:p.sha256,authenticated:false,chain_identity:null,notice:'仅有限行为表与字节匹配；不认证作者或链制造'},null,2));
  }else{
   const r=await verifyCreatorReplay(text);
   console.log(JSON.stringify({valid:true,kind,actions:r.actions,plain:r.plain,results:r.results,authenticated:false,chain_identity:null,notice:'仅计算一致；不认证玩家、时间或历史'},null,2));
  }
 }catch(e){console.error(`校验失败：${e.message}`);process.exitCode=1;}
}
