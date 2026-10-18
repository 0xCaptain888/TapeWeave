// Offline regression entry point. No package installation, RPC or wallet calls.
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const args = process.argv.slice(2);
if (args.length > 1 || (args.length === 1 && args[0] !== '--browser')) {
  console.error('usage: node research/tapeweave/demo/check.mjs [--browser]');
  process.exit(2);
}
const tests = ['test-engine.mjs', 'test-host-boundaries.mjs', 'test-package.mjs', 'test-replay.mjs', 'test-creator.mjs', 'test-durable-host.mjs', 'test-studio-storage.mjs', 'test-creator-package.mjs', 'test-creator-replay.mjs', 'test-browser-process.mjs', 'test-verify-creator.mjs', 'test-local-server.mjs'];
if (args[0] === '--browser') tests.push('browser-check.mjs', 'browser-check.mjs --studio', 'test-durable-browser.mjs');
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
console.log(`\nPASS: ${tests.length} author-controlled local suites; not independent adoption or value evidence`);
if (args.length === 0) console.log('Chrome checks skipped; opt in with --browser. Mobile, touch and platform preview remain unverified.');
