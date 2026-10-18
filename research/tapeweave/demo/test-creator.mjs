import assert from 'node:assert/strict';
import {compile,evaluate,makeHost,presets} from './creator.mjs';
// Default: every possible table in both output positions with representative partners.
// Opt in to the full Cartesian product; it can be slow on constrained machines.
const exhaustive=process.argv.includes('--exhaustive');
let transitions=0;
for(let a=0;a<256;a++)for(const b of (exhaustive?Array.from({length:256},(_,i)=>i):[0,255,a,a^255])){
  const n=Array.from({length:8},(_,i)=>(a>>i)&1),r=Array.from({length:8},(_,i)=>(b>>i)&1);
  const hex=compile(n,r);
  for(let i=0;i<8;i++){assert.deepEqual(evaluate(hex,i>>2,(i>>1)&1,i&1),[n[i],r[i]]);transitions++;}
}
for(const p of Object.values(presets))for(const world of ['training','door']){
  for(let bits=0;bits<16;bits++){
    const byte=makeHost(p.next,p.request,world),plain=makeHost(p.next,p.request,world,true);
    for(const trigger of [...bits.toString(2).padStart(4,'0')].map(Number)){
      const version=byte.snapshot().version;
      assert.deepEqual(byte.act(version,trigger),plain.act(version,trigger));
      const before=byte.snapshot();
      assert.throws(()=>byte.act(version,trigger));assert.deepEqual(byte.snapshot(),before);
      before.trace[0].request=99;assert.notDeepEqual(byte.snapshot(),before);
    }
    assert.throws(()=>byte.act(4,1));
  }
}
assert.throws(()=>compile(Array(8).fill(true),Array(8).fill(0)));
assert.throws(()=>evaluate('0100',0,0,0));
console.log(`passed: ${transitions} synthetic truth-table transitions; host parity, stale-version rejection and snapshot isolation`);
