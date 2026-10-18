// Logical backup, not a byte-for-byte SQLite backup or authenticated history.
import {openStore,validateArchive} from './durable-host.mjs';
import {readLocalFile} from './read-local-file.mjs';
import {lstat,realpath,open,unlink} from 'node:fs/promises';
import {resolve,dirname,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../../',import.meta.url));
async function external(path){
 const p=resolve(path),parent=await realpath(dirname(p));
 if(parent!==dirname(p))throw Error('父目录不能经过符号链接');
 const rel=relative(root,p);if(!rel.startsWith('..'))throw Error('归档与数据库必须位于仓库外');
 return p;
}
async function reserve(path){return open(path,'wx',0o600);}
let store;
try{
 const [op,dbArg,archiveArg,...extra]=process.argv.slice(2);
 if(extra.length||!['backup','restore'].includes(op)||!dbArg||!archiveArg)throw Error('usage: archive-host.mjs backup|restore DB ARCHIVE_FILE');
 const db=await external(dbArg),archive=await external(archiveArg);
 if(db===archive||[db+'-wal',db+'-shm'].includes(archive))throw Error('输入输出路径冲突');
 if(op==='backup'){
  for(const path of [db,db+'-wal',db+'-shm']){
   try{const stat=await lstat(path);if(!stat.isFile()||stat.isSymbolicLink())throw Error('数据库必须是普通文件');}
   catch(e){if(e.code!=='ENOENT'||path===db)throw e;}
  }
  store=openStore(db);
  const text=JSON.stringify(store.archive(),null,2)+'\n';
  if(Buffer.byteLength(text)>2097152)throw Error('归档超过2 MiB');
  const handle=await reserve(archive);
  try{await handle.writeFile(text);await handle.sync();}finally{await handle.close();}
  console.log(JSON.stringify({backup:archive,authenticated:false}));
 }else{
  // Validate all data before creating destination. No overwrite or merging.
  const data=validateArchive(JSON.parse(await readLocalFile(archive,2097152)));
  for(const p of [db+'-wal',db+'-shm']){
   try{await lstat(p);throw Error('目标已有SQLite旁文件');}catch(e){if(e.code!=='ENOENT')throw e;}
  }
  const handle=await reserve(db);await handle.close();
  try{store=openStore(db);const result=store.restoreArchive(data);store.close();store=undefined;console.log(JSON.stringify(result));}
  catch(e){store?.close();store=undefined;for(const p of [db,db+'-wal',db+'-shm'])await unlink(p).catch(()=>{});throw e;}
 }
}catch(e){console.error(`archive rejected: ${e.message}`);process.exitCode=1;}
finally{store?.close();}
