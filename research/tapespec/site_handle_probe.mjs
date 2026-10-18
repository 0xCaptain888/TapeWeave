// Isolated source probe, not a browser / RPC / full-client test.
// Run: node research/tapespec/site_handle_probe.mjs
// siteFor below is copied verbatim from TapeKit sw-gateway/sw.js lines 50–68:
// https://github.com/TapeOutProtocol/TapeKit/blob/40994bd65baedbda4df72cb0985031a5f082f606/sw-gateway/sw.js
// TapeKit MIT license; see upstream LICENSE. Copyright attribution is in
// vendor-tapekit-license.txt. Only this function is evaluated, with local stubs.
import assert from 'node:assert/strict';
import vm from 'node:vm';

const siteForSource = `async function siteFor(name, { fresh = false } = {}) {
  const old = sites.get(name);
  if (old && !fresh && Date.now() - old.at < HANDLE_MAX_AGE) return old;
  if (old && old.loading && !fresh) return old.loading;
  const h = old || { name, files: [], external: [], blocked: [], offchain: [], at: 0 };
  h.loading = (async () => {
   try {
    const res = await kernel.resolve(name, { fresh: fresh || !!old });
    const showable = res.status === 'ok' || (!!settings.devPreview && res.status === 'unpaid');
    // 解析结果变了（例如换了持有人、站长更新）就重开句柄；否则只更新时间
    if (!h.site || !h.res || h.res.block !== res.block || h.res.status !== res.status) { h.site = showable ? await kernel.openSite(res) : null; h.res = res; }
    h.at = Date.now(); h.showable = showable;
    sites.set(name, h);
    return h;
   } finally { h.loading = null; }   // 失败也要清掉：否则这个网站之后一直等一个已经失败的读取
  })();
  return h.loading;
}`;

async function scenario({ elapsed, fresh = false }) {
  let now = 1_000_000;
  let currentBlock = '0x100';
  const snapshots = {
    '0x100': { 'index.html': 'V1 HTML', 'late.js': 'V1 JS' },
    '0x101': { 'index.html': 'V2 HTML', 'late.js': 'V2 JS' },
  };
  let resolves = 0;
  const context = vm.createContext({
    sites: new Map(), HANDLE_MAX_AGE: 120_000,
    settings: { devPreview: false }, Date: { now: () => now },
    kernel: {
      resolve: async () => { resolves++; return { block: currentBlock, status: 'ok' }; },
      // Stub, NOT upstream openSite: one fixed snapshot per handle.
      openSite: async res => ({ get: async path => snapshots[res.block][path] }),
    },
  });
  vm.runInContext(siteForSource + '; globalThis.probe = siteFor;', context);
  const first = await context.probe('fixture.tape');
  const html = await first.site.get('index.html');
  const retainedSite = first.site;
  currentBlock = '0x101'; now += elapsed;
  // Represents another call to the dispatcher, not a browser FetchEvent.
  const later = await context.probe('fixture.tape', { fresh });
  return { html, laterJs: await later.site.get('late.js'),
    retainedSiteJs: await retainedSite.get('late.js'),
    sameHandleObject: first === later, resolves };
}

const beforeExpiry = await scenario({ elapsed: 119_999 });
const atExpiry = await scenario({ elapsed: 120_000 });
const forcedRefresh = await scenario({ elapsed: 1, fresh: true });
assert.equal(beforeExpiry.laterJs, 'V1 JS');
assert.equal(beforeExpiry.resolves, 1);
assert.equal(atExpiry.html, 'V1 HTML');
assert.equal(atExpiry.laterJs, 'V2 JS');
assert.equal(atExpiry.retainedSiteJs, 'V1 JS');
assert.equal(atExpiry.sameHandleObject, true);
assert.equal(forcedRefresh.laterJs, 'V2 JS');
assert.equal(forcedRefresh.resolves, 2);
console.log(JSON.stringify({ evidence: 'isolated-upstream-function-with-stubs',
  beforeExpiry, atExpiry, forcedRefresh, assertions: 8 }, null, 2));
