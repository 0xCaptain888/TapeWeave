// Manual observations only: no automatic verdict, identity or chain authentication.
export function makeRecord(input) {
  const text = (key, max = 1200) => {
    const value = input[key];
    if (typeof value !== 'string' || !value.trim() || value.length > max) throw Error(`请填写${key}（最多${max}字符）`);
    return value.trim();
  };
  const kind = text('kind', 30);
  if (!['author-mobile', 'independent-player', 'creator', 'developer'].includes(kind)) throw Error('非法角色');
  if (kind !== 'author-mobile' && input.consent !== true) throw Error('请先取得参与者同意；不要填写个人身份信息');
  const result = text('result', 20);
  if (!['pass', 'fail', 'incomplete'].includes(result)) throw Error('必须明确选择结果');
  const mode = text('mode', 20);
  if (!['byte', 'plain', 'both'].includes(mode)) throw Error('非法模式');
  return {
    format: 'tapeweave-manual-observation-v1', authenticated: false, chain_identity: null,
    source: 'user-entered-not-verified', kind, consent_reported: kind === 'author-mobile' ? null : true,
    device: text('device', 300), mode, prediction: text('prediction'),
    actions: text('actions', 300), observed: text('observed'), help_and_failures: text('help_and_failures'), result,
  };
}
