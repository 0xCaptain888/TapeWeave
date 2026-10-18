import {step, advance, fresh} from './engine.mjs';
import {createReplay, verifyReplay} from './replay.mjs';
import {createPackage, parsePackage} from './package.mjs';
const el = id => document.getElementById(id);
let bundle, session = fresh(), predicted = false;
for (let i = 0; i < 16; i++) {
  const value = i.toString(2).padStart(4, '0');
  el('windows').add(new Option(value, value));
}
el('windows').value = '0011';
const card = () => bundle.cards.find(c => c.mode === el('card').value);
const windows = () => [...el('windows').value].map(Number);
function render() {
  const c = card();
  el('export-replay').disabled = session.trace.length !== 4;
  el('replay').value = '';
  el('identity').textContent = `SHA-256: ${c.sha256}\n字节: ${c.netlist_hex}\nchain_identity: null\nlocal-synthetic-only`;
  el('status').textContent = `回合 ${Math.min(session.trace.length + 1, 4)}/4 · 状态 ${session.state} · 得分 ${session.score}${session.trace.length === 4 ? ' · 本局结束' : ''}`;
  el('trace').replaceChildren();
  for (const row of session.trace) {
    const tr = document.createElement('tr');
    for (const value of [row.turn + 1, row.old_state, row.trigger, row.recharge, row.request, row.next_state, row.effect_due, row.window, row.gained]) {
      const td = document.createElement('td'); td.textContent = value; tr.append(td);
    }
    el('trace').append(tr);
  }
  for (const id of ['wait', 'fire']) el(id).disabled = !predicted || session.trace.length >= 4;
  const ref = bundle.challenges.find(x => x.world === el('world').value && x.windows.join('') === el('windows').value).optimal_reference[c.mode];
  el('reference').textContent = `动作 ${ref.actions.join('')}，最优分 ${ref.score}。合成系统参考，不代表真实体验或价值。`;
}
function reset() {
  session = fresh(); predicted = false;
  el('package').value = ''; el('package-status').textContent = '';
  el('prediction').textContent = '先选一个答案，再开始挑战。';
  el('explanation').textContent = ''; render();
}
function guard(fn) { return () => { try { fn(); } catch (e) { el('error').textContent = `执行失败：${e.message}`; } }; }
try {
  const response = await fetch('../reference-bundle-v1.json');
  if (!response.ok) throw Error('参考包读取失败');
  bundle = await response.json();
  for (const id of ['card', 'world', 'windows', 'execution']) el(id).addEventListener('change', guard(reset));
  for (const guess of [0, 1]) el(`guess${guess}`).addEventListener('click', guard(() => {
    const [next, request] = step(card().netlist_hex, 0, 1, 1);
    predicted = true;
    el('prediction').textContent = `${guess === request ? '预测正确' : '预测不同'}：请求 ${request}，下一状态 ${next}。旧状态参与本拍输出；请求不等于宿主得分。`;
    render();
  }));
  for (const [id, trigger] of [['wait', 0], ['fire', 1]]) el(id).addEventListener('click', guard(() => {
    if (!predicted) throw Error('请先预测');
    const candidate = advance(session, card(), trigger, windows(), el('world').value, el('execution').value === 'plain');
    session = candidate;
    const r = session.trace.at(-1);
    el('explanation').textContent = `本拍请求 ${r.request}；${el('world').value === 'garden' ? '使用上拍请求' : '使用本拍请求'}生效 ${r.effect_due}，窗口 ${r.window}，得分 +${r.gained}。${session.trace.length === 4 && el('world').value === 'garden' ? '末拍新请求不在本局成熟。' : ''}`;
    render();
  }));
  for (const id of ['title','description']) el(id).addEventListener('input', () => {
    el('package').value = ''; el('package-status').textContent = ''; el('replay').value = '';
  });
  el('export').addEventListener('click', guard(() => {
    el('package').value = ''; el('package-status').textContent = ''; el('error').textContent = '';
    const pack = createPackage(card(), el('world').value, windows(), el('title').value, el('description').value);
    el('package').value = JSON.stringify(pack, null, 2);
    el('package-status').textContent = '已生成当前配置快照；复制JSON保存为文件后可用play_challenge.py执行。不是链上制品或安全认证。';
  }));
  el('export-replay').addEventListener('click', guard(() => {
    el('replay').value = ''; el('error').textContent = '';
    const pack = createPackage(card(),el('world').value,windows(),el('title').value,el('description').value);
    el('replay').value = JSON.stringify(createReplay(pack,session,el('execution').value,bundle.cards),null,2);
  }));
  el('verify-text').addEventListener('input', () => { el('verify-status').textContent = ''; });
  el('verify-replay').addEventListener('click', () => {
    el('verify-status').textContent = '';
    try {
      const record = verifyReplay(el('verify-text').value,bundle.cards);
      el('verify-status').textContent = `计算一致：${record.challenge.card.mode} / ${record.challenge.rules.world} / 动作 ${record.actions.join('')} / 得分 ${record.score}。仅本地算术复核；未认证，不证明真人操作或链消费。`;
    } catch (e) { el('verify-status').textContent = `复核失败：${e.message}`; }
  });
  el('import').addEventListener('click', guard(() => {
    // Validate everything before touching live controls or session state.
    const pack = parsePackage(el('import-text').value, bundle.cards);
    el('card').value = pack.card.mode;
    el('world').value = pack.rules.world;
    el('windows').value = pack.rules.windows.join('');
    el('title').value = pack.title; el('description').value = pack.description;
    reset(); el('error').textContent = '';
    el('package-status').textContent = '已装载挑战包，本局从零开始；请重新预测。执行模式保持当前选择，说明仅为文本。';
  }));
  el('reset').addEventListener('click', guard(reset)); reset();
} catch (e) { el('error').textContent = `无法启动：${e.message}。请使用支持相对资源的预览或本地HTTP服务。`; }
