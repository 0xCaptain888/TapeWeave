// Unified offline contract gate; tools/reference data must already be external.
// No installation, public RPC, wallet process or publication.
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
if(process.argv.length!==2)throw Error('usage: node contracts/check.mjs');
if(!process.env.TAPEWEAVE_SOLIDITY_TOOLS||!process.env.TAPEWEAVE_CREATEX_REFERENCE){
  throw Error('Set TAPEWEAVE_SOLIDITY_TOOLS and TAPEWEAVE_CREATEX_REFERENCE; see contracts/README.md');
}
const suites=['test-deployment-preparation.mjs','test-prepared-initcode.mjs',
  'test-host.mjs','test-createx.mjs'];
for(const suite of suites){
  console.log('\nRunning '+suite);
  const result=spawnSync(process.execPath,[fileURLToPath(new URL(suite,import.meta.url))],{
    stdio:'inherit',timeout:180000,
  });
  if(result.error||result.signal||result.status!==0){
    console.error('FAILED '+suite+': '+(result.error?.code??result.signal??result.status));
    process.exit(1);
  }
}
console.log('\nPASS four offline contract scripts; fixtures only, no real signatures or public deployment');
