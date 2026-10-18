// Loopback-only development bridge. Not a remotely deployable/authenticated service.
import {createServer} from 'node:http';
import {randomBytes,timingSafeEqual} from 'node:crypto';
import {readFile,realpath,lstat} from 'node:fs/promises';
import {resolve,dirname,relative,isAbsolute} from 'node:path';
import {fileURLToPath} from 'node:url';
import {openStore} from './durable-host.mjs';
import {parseArtifact,createArtifact} from './creator-package.mjs';
import {createCreatorReplay} from './creator-replay.mjs';
const root=fileURLToPath(new URL('.',import.meta.url));
const assets=new Map([
 ['/', ['durable.html','text/html; charset=utf-8']],
 ...['durable.html','durable.mjs','style.css'].map(f=>['/'+f,[f,f.endsWith('.html')?'text/html; charset=utf-8':f.endsWith('.css')?'text/css; charset=utf-8':'text/javascript; charset=utf-8']])
]);
const exact=(v,keys)=>v && typeof v==='object' && !Array.isArray(v) && Object.keys(v).sort().join(',')===[...keys].sort().join(',');
const inside=(parent,child)=>{const r=relative(parent,child);return r===''||(!r.startsWith('..')&&!isAbsolute(r));};
async function body(req){
 let size=0;const chunks=[];
 for await(const chunk of req){size+=chunk.length;if(size>24576)throw Error('请求超过24 KiB');chunks.push(chunk);}
 return JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(Buffer.concat(chunks)));
}
export async function startLocalServer({database,port=0}={}){
 if(!database || !Number.isInteger(port)||port<0||port>65535)throw Error('非法数据库或端口');
 // Resolve the existing parent before creating anything; never serve database files.
 const parent=await realpath(dirname(resolve(database)));
 const path=resolve(parent,resolve(database).split(/[\\/]/).at(-1));
 if(inside(await realpath(resolve(root,'../../..')),path))throw Error('数据库必须放在仓库目录之外');
 try{if(!(await lstat(path)).isFile())throw Error('数据库必须是普通文件');}catch(e){if(e.code!=='ENOENT')throw e;}
 // Reject symlinked SQLite sidecars too.
 for(const suffix of ['-wal','-shm']){try{if(!(await lstat(path+suffix)).isFile())throw Error('非法数据库附属文件');}catch(e){if(e.code!=='ENOENT')throw e;}}
 const store=openStore(path),token=randomBytes(32).toString('hex');
 let origin;
 const server=createServer(async(req,res)=>{
  const send=(status,data,type='application/json; charset=utf-8')=>{res.writeHead(status,{'Content-Type':type});res.end(type.startsWith('application/json')?JSON.stringify(data):data);};
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','no-referrer');res.setHeader('X-Frame-Options','DENY');
  res.setHeader('Content-Security-Policy',"default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'");
  if(req.headers.host!==new URL(origin).host)return send(403,{error:'非法Host'});
  if(req.headers.origin && req.headers.origin!==origin)return send(403,{error:'非法Origin'});
  const url=new URL(req.url,origin);
  if(url.search)return send(400,{error:'不接受查询参数'});
  if(url.pathname.startsWith('/api/')){
   const supplied=Buffer.from(req.headers.authorization??''),expected=Buffer.from('Bearer '+token);
   if(supplied.length!==expected.length||!timingSafeEqual(supplied,expected))return send(403,{error:'本地访问凭据无效，请使用启动URL'});
   if(req.method!=='POST')return send(405,{error:'仅接受POST'});
   if(req.headers.origin!==origin)return send(403,{error:'缺少同源Origin'});
   if(req.headers['content-type']!=='application/json')return send(415,{error:'仅接受application/json'});
   try{
    const b=await body(req);let result;
    if(url.pathname==='/api/create'){
     if(!exact(b,['session','artifact','plain'])||typeof b.plain!=='boolean')throw Error('非法创建参数');
     const artifact=await parseArtifact(b.artifact);
     result=store.create(b.session,{next:artifact.next,request:artifact.request,plain:b.plain});
    }else if(url.pathname==='/api/show'){
     if(!exact(b,['session']))throw Error('非法读取参数');result=store.snapshot(b.session);
    }else if(url.pathname==='/api/act'){
     if(!exact(b,['session','command']))throw Error('非法动作参数');result=store.act(b.session,b.command);
    }else if(url.pathname==='/api/export'){
     if(!exact(b,['session']))throw Error('非法导出参数');const s=store.snapshot(b.session);
     if(s.version!==4)throw Error('请先完成四回合再导出');
     result=await createCreatorReplay(await createArtifact(s.config.next,s.config.request),s.hosts[0].trace.map(r=>r.trigger),s.config.plain);
    }else return send(404,{error:'未知接口'});
    send(200,result);
   }catch(e){send(400,{error:e.message?.startsWith('UNIQUE constraint')?'同名会话已存在，不覆盖':e.message});}
   return;
  }
  if(req.method!=='GET')return send(405,{error:'仅接受GET'});
  const asset=assets.get(url.pathname);if(!asset)return send(404,{error:'未公开此文件'});
  try{if(!(await lstat(resolve(root,asset[0]))).isFile())throw Error('非法静态文件');send(200,await readFile(resolve(root,asset[0])),asset[1]);}
  catch{send(500,{error:'静态文件不可用'});}
 });
 server.requestTimeout=10000;server.headersTimeout=10000;
 try{await new Promise((ok,fail)=>{server.once('error',fail);server.listen(port,'127.0.0.1',ok);});}
 catch(e){store.close();throw e;}
 origin=`http://127.0.0.1:${server.address().port}`;
 return {origin,token,url:`${origin}/#${token}`,close:()=>new Promise((ok,fail)=>{server.close(e=>{store.close();e?fail(e):ok();});server.closeIdleConnections();})};
}
if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const [database,port='8787',...extra]=process.argv.slice(2);
 try{
  if(extra.length||!/^\d+$/.test(port))throw Error('usage: node local-server.mjs DATABASE_OUTSIDE_REPO [PORT]');
  const app=await startLocalServer({database,port:Number(port)});
  console.log(`仅本机访问（启动凭据勿分享）：${app.url}\nSQLite: ${resolve(database)}\n停止请按Ctrl+C。不是公开服务，无钱包或写链。`);
  for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>{app.close().then(()=>process.exit(0),()=>process.exit(1));});
 }catch(e){console.error('本地服务启动失败：'+e.message);process.exitCode=1;}
}
