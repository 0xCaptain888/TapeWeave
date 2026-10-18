import {checkBinding} from './xlayer-binding.mjs';
import {readLocalFile} from './read-local-file.mjs';
const [file,processor,circuit,block,...extra]=process.argv.slice(2);
try{
 if(!file||!processor||!circuit||!block||extra.length)throw Error('usage: node check-xlayer-binding.mjs ARTIFACT_FILE PROCESSOR CIRCUIT_UINT64 BLOCK_HEX');
 const artifact=await readLocalFile(file,16384);
 const result=await checkBinding({artifact,processor,circuit,block});
 console.log(JSON.stringify(result,null,2));if(!result.matched)process.exitCode=1;
}catch(e){console.error('只读绑定检查拒绝：'+e.message);process.exitCode=1;}
