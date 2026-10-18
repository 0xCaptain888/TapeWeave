// Author-controlled synchronous in-memory checks, not persistent host guarantees.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {advance, fresh, ordinary} from './engine.mjs';
const {cards} = JSON.parse(readFileSync(new URL('../reference-bundle-v1.json', import.meta.url)));
const windows = [0, 0, 1, 1];
let rejections = 0;
function reject(session, card, trigger, wins, world, plain) {
  const before = structuredClone({session, card, wins});
  assert.throws(() => advance(session, card, trigger, wins, world, plain));
  assert.deepEqual({session, card, wins}, before);
  rejections++;
}
for (const plain of [false, true]) {
  for (const value of [-1, 2, '1', true, null, NaN, Infinity]) {
    reject(fresh(), cards[0], value, windows, 'training', plain);
    reject({...fresh(), state: value}, cards[0], 1, windows, 'training', plain);
    reject({...fresh(), pending: value}, cards[0], 1, windows, 'garden', plain);
    assert.throws(() => ordinary('pulse', 0, value, 1));
  }
  for (const wins of [[0, 1], [0, 0, 1, 2], [0, 0, '1', 1], Array(4)]) {
    reject(fresh(), cards[0], 1, wins, 'training', plain);
  }
  reject(fresh(), cards[0], 1, windows, 'unknown', plain);
  reject({...fresh(), score: 1}, cards[0], 1, windows, 'training', plain);
  reject(fresh(), {...cards[0], mode: 'unknown'}, 1, windows, 'training', plain);
  let training = fresh(), garden = fresh();
  for (const trigger of [0, 0, 1, 1]) {
    const oldTraining = structuredClone(training), oldGarden = structuredClone(garden);
    const nextTraining = advance(training, cards[0], trigger, windows, 'training', plain);
    assert.deepEqual(training, oldTraining);
    assert.deepEqual(garden, oldGarden);
    const nextGarden = advance(garden, cards[0], trigger, windows, 'garden', plain);
    assert.deepEqual(training, oldTraining);
    assert.deepEqual(garden, oldGarden);
    training = nextTraining; garden = nextGarden;
  }
  assert.equal(training.score, 2);
  assert.equal(garden.score, 1);
  assert.equal(garden.pending, 1); // Last request is not an extra point.
  reject(training, cards[0], 1, windows, 'training', plain);
  assert.deepEqual(fresh(), {state: 0, pending: 0, score: 0, trace: []});
}
reject(fresh(), {...cards[0], netlist_hex: cards[0].netlist_hex.slice(0, -2)}, 1, windows, 'training', false);
reject(fresh(), cards[0], 1, windows, 'training', 'false');
// Deep freezing detects writes even if an implementation later restores the value.
function freeze(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}
let recoveryChecks = 0;
for (const plain of [false, true]) {
  for (const world of ['training', 'garden']) {
    const wins = freeze([1, 1, 1, 1]);
    const card = freeze(structuredClone(cards[0]));
    let session = fresh();
    for (const trigger of [0, 0, 1]) session = advance(session, card, trigger, wins, world, plain);
    assert.equal(session.score, world === 'training' ? 1 : 0);
    assert.equal(session.pending, 1);
    assert.equal(session.state, 1);
    freeze(session);
    const before = structuredClone(session);
    reject(session, card, '1', wins, world, plain);
    if (!plain) {
      reject(session, {...card, netlist_hex: card.netlist_hex.slice(0, -2)}, 1, wins, world, plain);
    }
    const recovered = advance(session, card, 1, wins, world, plain);
    const control = advance(structuredClone(before), card, 1, wins, world, plain);
    assert.deepEqual(recovered, control);
    assert.deepEqual(session, before);
    assert.equal(recovered.trace.length, 4);
    assert.equal(recovered.score, world === 'training' ? 2 : 1); // One final effect, not a failure plus a retry.
    assert.notEqual(recovered.trace, session.trace);
    recoveryChecks++;
  }
}
let ownershipChecks = 0;
for (const plain of [false, true]) {
  for (const world of ['training', 'garden']) {
    const original = advance(fresh(), cards[0], 0, windows, world, plain);
    const snapshot = structuredClone(original);
    const left = advance(original, cards[0], 1, windows, world, plain);
    const right = advance(original, cards[0], 0, windows, world, plain);
    const rightSnapshot = structuredClone(right);
    left.trace[0].request = 99;
    left.trace[0].note = 'caller mutation';
    left.trace.push({turn: 99});
    assert.deepEqual(original, snapshot);
    assert.deepEqual(right, rightSnapshot);
    original.trace[0].trigger = 99;
    assert.deepEqual(right, rightSnapshot);
    ownershipChecks++;
  }
}
console.log(`passed: ${rejections} rejected calls preserve inputs; two-mode host isolation, delay and reset; ${recoveryChecks} frozen mid-session failure/retry checks; ${ownershipChecks} trace ownership checks`);
