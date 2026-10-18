// Offline finite-profile execution; stdout is an unauthenticated local replay.
import {readLocalFile} from './read-local-file.mjs';
import {parseArtifact} from './creator-package.mjs';
import {createCreatorReplay} from './creator-replay.mjs';
const [path,actions,mode,...extra]=process.argv.slice(2);
if(!path||!/^[01]{4}$/.test(actions??'')||(mode!==undefined&&mode!=='--ordinary')||extra.length){
 console.error('usage: node play-creator.mjs ARTIFACT_FILE ACTIONS_4_BITS [--ordinary]');process.exitCode=2;
}else{
 try{
  const artifact=await parseArtifact(await readLocalFile(path,16384));
  const replay=await createCreatorReplay(artifact,[...actions].map(Number),mode==='--ordinary');
  console.log(JSON.stringify(replay,null,2));
 }catch(e){console.error(`执行失败：${e.message}`);process.exitCode=1;}
}
