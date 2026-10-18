import {open} from 'node:fs/promises';
// Bounded UTF-8 read shared by offline commands; never writes the input.
export async function readLocalFile(path,limit){
 const file=await open(path,'r');
 try{
  if(!(await file.stat()).isFile())throw Error('仅接受普通文件');
  const buffer=Buffer.alloc(limit+1);let size=0;
  while(size<buffer.length){const r=await file.read(buffer,size,buffer.length-size,null);if(!r.bytesRead)break;size+=r.bytesRead;}
  if(size>limit)throw Error(`文件超过${limit/1024} KiB`);
  return new TextDecoder('utf-8',{fatal:true}).decode(buffer.subarray(0,size));
 }finally{await file.close();}
}
