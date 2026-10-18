import {spawn} from 'node:child_process';
// Only terminate the process group created by this invocation, never existing Chrome.
export function runBrowser(executable,args,{timeout=30000}={}){
 return new Promise((resolve,reject)=>{
  const child=spawn(executable,args,{detached:process.platform!=='win32'});
  let output='',stderr='',failure=null;
  const stop=()=>{
   try{if(process.platform==='win32')child.kill('SIGKILL');else process.kill(-child.pid,'SIGKILL');}catch(e){if(e.code!=='ESRCH')failure??=e;}
  };
  const timer=setTimeout(()=>{failure=Error(`Chrome timeout after ${timeout}ms; no UI verdict. ${stderr.slice(-500)}`);stop();},timeout);
  child.stdout.on('data',b=>output+=b);
  child.stderr.on('data',b=>stderr+=b);
  child.on('error',e=>{clearTimeout(timer);reject(e)});
  child.on('close',(code,signal)=>{
   clearTimeout(timer);
   if(failure)reject(failure);
   else if(code!==0)reject(Error(`Chrome exited ${code??signal}: ${stderr.slice(-500)}`));
   else resolve(output);
  });
 });
}
