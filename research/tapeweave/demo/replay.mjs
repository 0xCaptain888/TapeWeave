import {advance, fresh} from './engine.mjs';
import {parsePackage} from './package.mjs';

function equal(a,b) {
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return a === b;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  return Object.keys(a).length === Object.keys(b).length && Object.keys(a).every(k => Object.hasOwn(b,k) && equal(a[k],b[k]));
}

export function verifyReplay(text,cards) {
  if (typeof text !== 'string' || new TextEncoder().encode(text).length > 65536) throw Error('回放超过64 KiB限制');
  // Same last-key JSON semantics as challenge import; not duplicate-key rejection.
  const record = JSON.parse(text);
  if (!record || typeof record !== 'object') throw Error('非法回放');
  const expected = createReplay(record.challenge,{
    state:record.final_state,pending:record.final_pending,score:record.score,trace:record.trace
  },record.execution,cards);
  if (!equal(record,expected)) throw Error('回放字段、动作或证据标记不一致');
  return expected;
}

// A reproducible local record, not an authenticated score or chain receipt.
export function createReplay(pack, session, execution, cards) {
  const challenge = parsePackage(JSON.stringify(pack), cards);
  if (!['byte','plain'].includes(execution)) throw Error('未知执行方式');
  if (!Array.isArray(session.trace) || session.trace.length !== 4) throw Error('请先完成四回合');
  const card = cards.find(c => c.mode === challenge.card.mode);
  let expected = fresh();
  const actions = session.trace.map(row => row.trigger);
  for (const trigger of actions) {
    if (trigger !== 0 && trigger !== 1) throw Error('非法动作');
    expected = advance(expected,card,trigger,challenge.rules.windows,challenge.rules.world,execution === 'plain');
  }
  // Compare every known field rather than trusting supplied scores or state.
  for (const key of ['state','pending','score']) if (session[key] !== expected[key]) throw Error('回放状态不一致');
  for (let i=0;i<4;i++) for (const key of Object.keys(expected.trace[i])) {
    if (session.trace[i][key] !== expected.trace[i][key]) throw Error('回放轨迹不一致');
  }
  return {schema:'tapeweave-local-replay-v1',evidence:'local-unverified-action-record',
    authenticated:false,chain_identity:null,execution,challenge,actions,
    trace:expected.trace,score:expected.score,final_state:expected.state,
    final_pending:expected.pending,
    warning:'可编辑的本地自述；可复算不证明真人操作、作者身份或链上消费。花园末拍pending不计分。'};
}
