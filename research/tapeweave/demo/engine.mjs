// Local fixed-profile engine; not a complete TapeOut VM.
export function step(hex, old, trigger, recharge) {
  if (![old, trigger, recharge].every(x => Number.isInteger(x) && (x === 0 || x === 1))) throw Error('输入必须为整数位');
  if (!/^(?:[0-9a-f]{2})+$/.test(hex) || hex.length > 120) throw Error('非法固定网表');
  const bytes = hex.match(/../g).map(x => parseInt(x, 16));
  const word = i => bytes[i] * 65536 + bytes[i + 1] * 256 + bytes[i + 2];
  const signals = [0, 1, trigger, recharge];
  if (bytes[0] !== 1 || bytes.length < 11) throw Error('缺少锁存器');
  const delayed = word(1); signals.push(old);
  for (let i = 4; i < bytes.length; i += 7) {
    if (bytes[i] !== 0 || i + 7 > bytes.length) throw Error('不支持的记录');
    const a = word(i + 1), b = word(i + 4);
    if (a >= signals.length || b >= signals.length) throw Error('非法信号引用');
    signals.push(1 - (signals[a] & signals[b]));
  }
  if (delayed >= signals.length) throw Error('非法锁存引用');
  return [signals[delayed], signals.at(-1)];
}
export function ordinary(mode, old, trigger, recharge) {
  if (![old, trigger, recharge].every(x => Number.isInteger(x) && (x === 0 || x === 1))) throw Error('输入必须为整数位');
  if (mode === 'pulse') return [recharge | (old & (1 - trigger)), old & trigger];
  if (mode === 'alternating') return [old ^ trigger, (1 - old) & trigger];
  throw Error('未知卡片');
}
export function advance(session, card, trigger, windows, world, plain = false) {
  const bit = x => Number.isInteger(x) && (x === 0 || x === 1);
  if (!session || !Array.isArray(session.trace) || session.trace.length > 4 ||
      !bit(session.state) || !bit(session.pending) || !Number.isInteger(session.score) ||
      session.score < 0 || session.score > session.trace.length) throw Error('非法本地状态');
  if (!bit(trigger)) throw Error('动作必须为整数位');
  if (!Array.isArray(windows) || windows.length !== 4 || !Array.from(windows).every(bit)) throw Error('非法四回合窗口');
  if (!['training', 'garden'].includes(world)) throw Error('未知宿主');
  if (typeof plain !== 'boolean') throw Error('非法执行方式');
  if (!card || !['pulse', 'alternating'].includes(card.mode)) throw Error('未知卡片');
  if (session.trace.length >= 4) throw Error('本局已结束');
  const turn = session.trace.length, recharge = Number(turn === 0 || turn === 2);
  const [next, request] = plain ? ordinary(card.mode, session.state, trigger, recharge) : step(card.netlist_hex, session.state, trigger, recharge);
  const effect = world === 'training' ? request : session.pending;
  const gained = effect * windows[turn];
  const row = {turn, old_state: session.state, trigger, recharge, request, next_state: next,
    effect_due: effect, window: windows[turn], gained, cumulative_score: session.score + gained};
  return {state: next, pending: request, score: row.cumulative_score, trace: [...structuredClone(session.trace), row]};
}
export const fresh = () => ({state: 0, pending: 0, score: 0, trace: []});
