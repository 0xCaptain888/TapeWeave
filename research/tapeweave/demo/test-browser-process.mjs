import assert from 'node:assert/strict';
import {runBrowser} from './browser-process.mjs';
assert.equal(await runBrowser(process.execPath,['-e',"process.stdout.write('ok')"]),'ok');
await assert.rejects(()=>runBrowser(process.execPath,['-e',"process.stderr.write('failure');process.exit(2)"]),/exited 2: failure/);
await assert.rejects(()=>runBrowser('/nonexistent/tapeweave-browser',[]),/ENOENT/);
await assert.rejects(()=>runBrowser(process.execPath,['-e','setInterval(()=>{},1000)'],{timeout:200}),/timeout/);
console.log('passed: browser subprocess success, failure, missing executable and timeout cleanup');
