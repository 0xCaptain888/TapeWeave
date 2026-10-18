import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {step, advance, fresh} from './engine.mjs';
const bundle = JSON.parse(readFileSync(new URL('../reference-bundle-v1.json', import.meta.url)));
let count = 0;
for (const card of bundle.cards) {
  for (const t of card.transitions) assert.deepEqual(step(card.netlist_hex, t.old_state, t.trigger, t.recharge), [t.next_state, t.request]);
  for (const challenge of bundle.challenges) {
    for (let bits = 0; bits < 16; bits++) {
      const actions = [...bits.toString(2).padStart(4, '0')].map(Number);
      let a = fresh(), b = fresh();
      for (const action of actions) {
        a = advance(a, card, action, challenge.windows, challenge.world);
        b = advance(b, card, action, challenge.windows, challenge.world, true);
        assert.deepEqual(a, b);
      }
      assert.throws(() => advance(a, card, 1, challenge.windows, challenge.world));
      count++;
    }
    const ref = challenge.optimal_reference[card.mode];
    let session = fresh();
    for (const action of ref.actions) session = advance(session, card, action, challenge.windows, challenge.world);
    assert.deepEqual(session.trace, ref.trace);
  }
}
console.log(`passed: 16 transitions, 64 reference replays, ${count} synthetic trajectories`);
