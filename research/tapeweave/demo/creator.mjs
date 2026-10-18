// Experimental finite profile: 2 inputs, 1 latch, no REF. Not a general TAP VM.
const bit = x => Number.isInteger(x) && (x === 0 || x === 1);
export function compile(next, request) {
  if (![next, request].every(t => Array.isArray(t) && t.length === 8 && Array.from(t).every(bit))) throw Error('每张表必须有8个整数位');
  // Signals: 0=false, 1=true, 2=trigger, 3=recharge, 4=old state.
  const gates = [];
  const nand = (a,b) => { gates.push([a,b]); return 4 + gates.length; };
  const not = a => nand(a,a);
  const and = (a,b) => not(nand(a,b));
  const or = (a,b) => nand(not(a),not(b));
  const vars = [4,2,3], inv = vars.map(not);
  function table(values) {
    let result = 0;
    for (let i=0;i<8;i++) if (values[i]) {
      const digits = [i>>2, (i>>1)&1, i&1];
      const terms = digits.map((x,j) => x ? vars[j] : inv[j]);
      result = or(result, and(and(terms[0],terms[1]),terms[2]));
    }
    return result;
  }
  const delayed = table(next), output = table(request);
  // Output is the final signal, including constant-zero truth tables.
  not(not(output));
  const u24 = n => [n>>16, (n>>8)&255, n&255];
  const bytes = [1,...u24(delayed),...gates.flatMap(([a,b])=>[0,...u24(a),...u24(b)])];
  return bytes.map(x=>x.toString(16).padStart(2,'0')).join('');
}
export function evaluate(hex, old, trigger, recharge) {
  // Same limited opcode layout as the fixed demo; larger explicit creator cap.
  if (typeof hex !== 'string' || hex.length > 4096 || !/^(?:[0-9a-f]{2})+$/.test(hex)) throw Error('创作网表超限或非法');
  // Keep the existing fixed-profile engine limit intact: use a bounded local decoder here.
  const b = hex.match(/../g).map(x=>parseInt(x,16));
  if (![old,trigger,recharge].every(bit) || b[0]!==1 || b.length<11 || (b.length-4)%7) throw Error('非法创作输入');
  const word = i => b[i]*65536+b[i+1]*256+b[i+2];
  const signals=[0,1,trigger,recharge,old];
  for(let i=4;i<b.length;i+=7){
    const a=word(i+1), c=word(i+4);
    if(b[i]!==0 || a>=signals.length || c>=signals.length) throw Error('非法引用');
    signals.push(1-(signals[a]&signals[c]));
  }
  if(word(1)>=signals.length) throw Error('非法锁存引用');
  return [signals[word(1)],signals.at(-1)];
}
export function makeHost(next, request, world, plain=false) {
  if(!['training','door'].includes(world) || typeof plain!=='boolean') throw Error('未知宿主或模式');
  const hex=compile(next,request), n=[...next], r=[...request];
  let state={version:0,latch:0,resource:2,score:0,trace:[]};
  return {
    snapshot:()=>structuredClone(state),
    act(expectedVersion,trigger){
      if(expectedVersion!==state.version || !bit(trigger) || state.version>=4) throw Error('旧回合、非法动作或本局结束');
      const recharge=Number(state.version===0 || state.version===2);
      const i=state.latch*4+trigger*2+recharge;
      const [latch,req]=plain?[n[i],r[i]]:evaluate(hex,state.latch,trigger,recharge);
      // Host alone decides effects. Door: only rounds 2/4 present an obstacle;
      // opening consumes a key, unsolicited requests never consume keys.
      const obstacle=Number(state.version===1 || state.version===3);
      const effect=world==='training'?req:Number(req===1 && obstacle===1 && state.resource>0);
      const row={turn:state.version,old:state.latch,trigger,recharge,request:req,next:latch,obstacle,effect};
      const candidate={version:state.version+1,latch,resource:state.resource-(world==='door'?effect:0),score:state.score+effect,trace:[...state.trace,row]};
      state=candidate;
      return structuredClone(state);
    }
  };
}
export const presets = {
  pulse: {next:[0,1,0,1,1,1,0,1],request:[0,0,0,0,0,0,1,1]},
  alternating:{next:[0,0,1,1,1,1,0,0],request:[0,0,1,1,0,0,0,0]}
};
