import {openStore} from './durable-host.mjs';
import {presets} from './creator.mjs';
import {parseArtifact,createArtifact} from './creator-package.mjs';
import {createCreatorReplay} from './creator-replay.mjs';
import {readLocalFile} from './read-local-file.mjs';
const [file,op,id,...args]=process.argv.slice(2);
let store;
try {
  if(!file || !['create','import','show','act','export'].includes(op) || !id)throw Error('usage: host-cli.mjs DB create SESSION [pulse|alternating] [byte|plain] | DB import SESSION ARTIFACT_FILE [byte|plain] | DB show SESSION | DB export SESSION | DB act SESSION COMMAND_ID VERSION TRIGGER');
  // Validate untrusted artifact before opening or creating a database.
  let imported;
  if(op==='import'){
    if(args.length<1||args.length>2||!['byte','plain'].includes(args[1]??'byte'))throw Error('非法创作包参数或模式');
    imported=await parseArtifact(await readLocalFile(args[0],16384));
  }
  store=openStore(file);
  let result;
  if(op==='import'){
    result=store.create(id,{next:imported.next,request:imported.request,plain:args[1]==='plain'});
  }else if(op==='create'){
    const [preset='pulse',mode='byte']=args;
    if(args.length>2 || !Object.hasOwn(presets,preset) || !['byte','plain'].includes(mode))throw Error('非法模板或模式');
    result=store.create(id,{...presets[preset],plain:mode==='plain'});
  }else if(op==='export'){
    if(args.length)throw Error('非法参数');
    const snapshot=store.snapshot(id);
    if(snapshot.version!==4)throw Error('请先完成四回合再导出');
    const artifact=await createArtifact(snapshot.config.next,snapshot.config.request);
    result=await createCreatorReplay(artifact,snapshot.hosts[0].trace.map(row=>row.trigger),snapshot.config.plain);
  }else if(op==='show'){
    if(args.length)throw Error('非法参数');result=store.snapshot(id);
  }else{
    if(args.length!==3 || !/^[0-3]$/.test(args[1]) || !/^[01]$/.test(args[2]))throw Error('非法动作参数');
    result=store.act(id,{id:args[0],version:Number(args[1]),trigger:Number(args[2])});
  }
  console.log(JSON.stringify(result,null,2));
}catch(e){console.error(`host rejected: ${e.message}`);process.exitCode=1;}
finally{store?.close();}
