// Strict bounded ABI helpers. This module never signs or broadcasts.
export function address(v){if(typeof v!=='string'||!/^0x[0-9a-fA-F]{40}$/.test(v)||/^0x0{40}$/i.test(v))throw Error('需要非零合约地址');return v.toLowerCase();}
const word=n=>BigInt(n).toString(16).padStart(64,'0');
function uint(v,max){if(typeof v!=='string'||!/^(0|[1-9][0-9]*)$/.test(v)||v.length>78||BigInt(v)>max)throw Error('整数范围错误');return BigInt(v);}
export function plan({host,session,version,trigger,circuit,operation}){
 host=address(host);let data;
 if(operation==='open'){const c=uint(circuit,2n);if(c===0n)throw Error('仅两张审查卡');data='0x56f6a897'+word(c);}
 else if(operation==='act'){const id=uint(session,(1n<<256n)-1n),v=uint(version,3n);if(id===0n||typeof trigger!=='boolean')throw Error('非法动作');data='0x28cfd1cf'+word(id)+word(v)+word(Number(trigger));}
 else throw Error('未知操作');
 return {chainId:196,to:host,value:'0',data,broadcast:false,verified_host:false};
}
export function sessionCall(id){const n=uint(id,(1n<<256n)-1n);if(n===0n)throw Error('会话从1开始');return '0x83c4b7a3'+word(n);}
export function decodeSession(raw){
 if(typeof raw!=='string'||!/^0x[0-9a-fA-F]{576}$/.test(raw))throw Error('会话ABI应为九个字');
 const words=Array.from({length:9},(_,i)=>raw.slice(2+i*64,66+i*64));
 if(!/^0{24}[0-9a-fA-F]{40}$/.test(words[0]))throw Error('非法玩家ABI');
 const values=words.slice(1).map(w=>BigInt('0x'+w));
 const [c,v,tl,ts,tr,dl,ds,dr]=values;
 if(![1n,2n].includes(c)||v>4n||tl>1n||dl>1n||ts>v||tr!==ts||ds>v||ds+dr!==2n)throw Error('不存在或不符合本宿主范围的会话');
 return {player:'0x'+words[0].slice(24).toLowerCase(),circuit:Number(c),version:Number(v),training:{latch:Number(tl),score:Number(ts),resource:Number(tr)},door:{latch:Number(dl),score:Number(ds),resource:Number(dr)}};
}
