import {step} from './engine.mjs';

function exact(value, keys) {
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
      Object.keys(value).sort().join('|') !== [...keys].sort().join('|')) throw Error('字段不匹配');
}
function same(a, b) {
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return a === b;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  return Object.keys(a).length === Object.keys(b).length && Object.keys(a).every(k => Object.hasOwn(b,k) && same(a[k],b[k]));
}

export function parsePackage(text, cards) {
  if (typeof text !== 'string' || new TextEncoder().encode(text).length > 65536) throw Error('挑战包超过64 KiB限制');
  // JSON.parse uses the last occurrence of repeated keys; validation applies to that parsed value.
  const pack = JSON.parse(text);
  exact(pack,['schema','evidence','title','description','card','rules','prediction']);
  exact(pack.card,['mode','netlist_hex','sha256','chain_identity']);
  exact(pack.rules,['profile','world','windows','initial_state']);
  exact(pack.prediction,['question','old_state','trigger','recharge','expected_request','expected_next_state']);
  const card = cards.find(c => c.mode === pack.card.mode);
  if (!card) throw Error('未知卡片');
  const expected = createPackage(card,pack.rules.world,pack.rules.windows,pack.title,pack.description);
  if (!same(pack,expected)) throw Error('只接受固定两卡、零初态与固定预测题；内容或摘要不匹配');
  return expected;
}
// Export only the two fixed cards. Text is untrusted description, not executable code.
export function createPackage(card, world, windows, title, description) {
  for (const [value, limit] of [[title,120],[description,2000]]) {
    if (typeof value !== 'string' || !value.trim() || [...value].length > limit) throw Error('标题或说明为空或过长');
  }
  if (!['training','garden'].includes(world) || !Array.isArray(windows) || windows.length !== 4 || !windows.every(x => x === 0 || x === 1)) throw Error('非法宿主或窗口');
  const [next, request] = step(card.netlist_hex,0,1,1);
  return {schema:'tapeweave-challenge-v1',evidence:'local-synthetic-only',title,description,
    card:{mode:card.mode,netlist_hex:card.netlist_hex,sha256:card.sha256,chain_identity:null},
    rules:{profile:'four-turn-fixed-recharge-v1',world,windows:[...windows],initial_state:0},
    prediction:{question:'旧状态为0，同时触发并补能，本拍会输出吗？',old_state:0,trigger:1,recharge:1,expected_request:request,expected_next_state:next}};
}
