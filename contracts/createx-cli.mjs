// CLI utilities shared by preparation, read-only preflight and receipt inspection.
import {readFile,stat,writeFile} from 'node:fs/promises';
import {realpathSync} from 'node:fs';
import {resolve,relative,isAbsolute,dirname,basename,sep} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('../',import.meta.url));
export function externalOutput(path){
  if(!path||!isAbsolute(path))throw Error('Output must be a new absolute path outside the repository');
  const resolved=resolve(path);
  const actual=resolve(realpathSync(dirname(resolved)),basename(resolved));
  for(const candidate of [resolved,actual]){
    const rel=relative(realpathSync(root),candidate);
    if(rel===''||(!rel.startsWith('..'+sep)&&rel!=='..'&&!isAbsolute(rel))){
      throw Error('Keep deployment runtime files outside the repository and static site');
    }
  }
  return actual;
}
export async function readBundle(path){
  if(!path||!(await stat(path)).isFile()||(await stat(path)).size>1024*1024){
    throw Error('Expected deployment JSON up to 1 MiB');
  }
  return JSON.parse(await readFile(path,'utf8'));
}
export async function saveNew(path,value){
  await writeFile(externalOutput(path),JSON.stringify(value,null,2)+'\n',{flag:'wx',mode:0o600});
}
