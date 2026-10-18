import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {advance,fresh} from './engine.mjs';
import {createPackage} from './package.mjs';
import {createReplay,verifyReplay} from './replay.mjs';
const {cards}=JSON.parse(await readFile(new URL('../reference-bundle-v1.json',import.meta.url)));
let count=0;
for(const card of cards) for(const world of ['training','garden']) for(let w=0;w<16;w++) for(let a=0;a<16;a++) {
 const windows=[...w.toString(2).padStart(4,'0')].map(Number);
 const actions=[...a.toString(2).padStart(4,'0')].map(Number);
 const pack=createPackage(card,world,windows,'标题','说明');
 const outputs=[];
 for(const execution of ['byte','plain']) {
  let session=fresh();
  assert.throws(()=>createReplay(pack,session,execution,cards));
  for(const trigger of actions) session=advance(session,card,trigger,windows,world,execution==='plain');
  const snapshot=structuredClone(session);
  const replay=createReplay(pack,session,execution,cards);
  assert.deepEqual(verifyReplay(JSON.stringify(replay),cards),replay);
  for (const mutate of [r=>r.score++,r=>r.actions[0]^=1,r=>r.authenticated=true,r=>r.chain_identity={},r=>r.trace[0].gained++,r=>r.extra=1,r=>r.final_pending^=1]) {
    const changed=structuredClone(replay); mutate(changed);
    assert.throws(()=>verifyReplay(JSON.stringify(changed),cards));
  }
  assert.equal(replay.authenticated,false);assert.equal(replay.chain_identity,null);
  assert.deepEqual(replay.actions,actions);assert.deepEqual(session,snapshot);
  const bad=structuredClone(session);bad.trace[3].gained+=1;
  assert.throws(()=>createReplay(pack,bad,execution,cards));
  outputs.push(replay);
 }
 assert.deepEqual(outputs[0].trace,outputs[1].trace);count++;
}
for (const text of ['null','[]','{}','{',' '.repeat(65537)]) assert.throws(()=>verifyReplay(text,cards));
console.log(`passed: ${count} synthetic action sequences in both modes; incomplete and altered traces rejected`);
