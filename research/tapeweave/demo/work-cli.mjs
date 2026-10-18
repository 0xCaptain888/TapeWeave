import {openWorkStore} from './work-store.mjs';
import {readLocalFile} from './read-local-file.mjs';
import {parseWork} from './work.mjs';
const [db,op,id,...args]=process.argv.slice(2);let store;
try{
 if(!db||!id||!['create','show','act'].includes(op))throw Error('usage: work-cli.mjs DB create SESSION WORK_FILE [byte|plain] | DB show SESSION | DB act SESSION COMMAND_ID VERSION TRIGGER RECHARGE');
 let work;if(op==='create'){if(args.length<1||args.length>2||!['byte','plain'].includes(args[1]??'byte'))throw Error('非法参数');work=JSON.stringify(await parseWork(await readLocalFile(args[0],32768)));}
 if(op==='show'&&args.length)throw Error('非法参数');
 if(op==='act'&&(args.length!==4||! /^(0|[1-5]?[0-9]|6[0-3])$/.test(args[1])||! /^[01]$/.test(args[2])||! /^[01]$/.test(args[3])))throw Error('非法动作参数');
 store=openWorkStore(db);
 const result=op==='create'?await store.create(id,work,args[1]??'byte'):op==='show'?await store.snapshot(id):await store.act(id,{id:args[0],version:+args[1],input:{trigger:+args[2],recharge:+args[3]}});
 console.log(JSON.stringify(result,null,2));
}catch(e){console.error(`work rejected: ${e.message}`);process.exitCode=1;}finally{store?.close();}
