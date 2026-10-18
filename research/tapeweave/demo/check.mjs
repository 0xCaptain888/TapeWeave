// Offline regression entry point. No package installation, RPC or wallet calls.
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const args = process.argv.slice(2);
if (args.length > 1 || (args.length === 1 && args[0] !== '--browser')) {
  console.error('usage: node research/tapeweave/demo/check.mjs [--browser]');
  process.exit(2);
}
const tests = ['test-engine.mjs', 'test-host-boundaries.mjs', 'test-package.mjs', 'test-replay.mjs', 'test-creator.mjs', 'test-durable-host.mjs', 'test-studio-storage.mjs', 'test-creator-package.mjs', 'test-creator-replay.mjs', 'test-browser-process.mjs', 'test-verify-creator.mjs', 'test-local-server.mjs', 'test-xlayer-binding.mjs', 'test-rpc-host.mjs', 'test-archive-host.mjs'];
if (args[0] === '--browser') tests.push('browser-check.mjs', 'browser-check.mjs --studio', 'test-durable-browser.mjs');
// Keep publishing guards in the same fail-fast gate, including Python -O.
const publishingTest = fileURLToPath(new URL('../../../scripts/test-sync-tapeweave-github.py', import.meta.url));
for (const flags of [[], ['-O']]) {
  const name = `publishing guards: python3 ${flags.join(' ')}`.trim();
  console.log(`\n=== ${name} ===`);
  const result = spawnSync('python3', [...flags, publishingTest], {
    stdio: 'inherit', timeout: 120_000,
    env: {...process.env, PYTHONDONTWRITEBYTECODE: '1'},
  });
  if (result.error || result.signal || result.status !== 0) {
    console.error(`FAILED: ${name} (${result.error?.code ?? result.signal ?? result.status})`);
    process.exit(1);
  }
}
for (const name of tests) {
  console.log(`\n=== ${name} ===`);
  const [file, ...testArgs] = name.split(' ');
  const result = spawnSync(process.execPath, [fileURLToPath(new URL(file, import.meta.url)), ...testArgs], {
    stdio: 'inherit', timeout: 120_000,
  });
  if (result.error || result.signal || result.status !== 0) {
    console.error(`FAILED: ${name} (${result.error?.code ?? result.signal ?? result.status})`);
    process.exit(1);
  }
}
console.log(`\nPASS: ${tests.length} Node/Chrome suites + 2 Python publishing runs (normal and -O); author-controlled, not independent adoption or value evidence`);
if (args.length === 0) console.log('Chrome checks skipped; opt in with --browser. Mobile, touch and platform preview remain unverified.');
