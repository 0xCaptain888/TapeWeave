// Offline compiler only. No signer, provider, wallet, RPC, or broadcast API.
import {createRequire} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
export async function prepareDeployment(tools) {
  if (!tools?.startsWith('/')) throw Error('Set absolute TAPEWEAVE_SOLIDITY_TOOLS');
  const require = createRequire(`${tools}/package.json`);
  const solc = require('solc');
  const {ethers} = require('ethers');
  if (!solc.version().startsWith('0.8.30+')) throw Error('Require solc 0.8.30');
  const source = await readFile(new URL('./TapeWeaveHost.sol',import.meta.url),'utf8');
  const evidence = JSON.parse(await readFile(new URL('../research/tapeweave/manufactured-transitions-2026-10-18.json',import.meta.url),'utf8'));
  const sha = value => createHash('sha256').update(value).digest('hex');
  const hashes = ['pulse','alternating'].map(name => {
    const artifact = evidence.results.find(result => result.name === name)?.artifact;
    if (!artifact || !/^([0-9a-f]{2})+$/.test(artifact.netlist_hex)) throw Error('Missing reviewed netlist');
    const bytes = Buffer.from(artifact.netlist_hex,'hex');
    if (sha(bytes) !== artifact.sha256) throw Error('Artifact digest mismatch');
    return ethers.keccak256(bytes);
  });
  const processor = ethers.getAddress(evidence.processor);
  if (processor.toLowerCase() !== '0xdfc1abf794ef40b9eeeba1d875e7ab2b21a0a146') throw Error('Unexpected processor');
  const input = {language:'Solidity',sources:{'TapeWeaveHost.sol':{content:source}},settings:{optimizer:{enabled:true,runs:200},evmVersion:'shanghai',outputSelection:{'*':{'*':['abi','evm.bytecode.object','evm.deployedBytecode.object','evm.deployedBytecode.immutableReferences']}}}};
  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  const errors = (output.errors ?? []).filter(error => error.severity === 'error');
  if (errors.length) throw Error(errors.map(error => error.formattedMessage).join('\n'));
  const artifact = output.contracts['TapeWeaveHost.sol'].TapeWeaveHost;
  const constructorArgs = ethers.AbiCoder.defaultAbiCoder().encode(['address','bytes32','bytes32'],[processor,...hashes]);
  const initcode = '0x'+artifact.evm.bytecode.object+constructorArgs.slice(2);
  return {
    format:'tapeweave-offline-deployment-preparation-v1', chain_id:196,
    account_address:'0xc055d5c6d6d02d797074829120c85e7843f8cb3f',
    capability_basis:'user-directed-assumption-not-interface-verification',
    broadcast:false, simulated:false, deployment_address:null, wallet_creation_adapter:null,
    ready_to_send:false, blockers:['official Account 2 creation and simulation interface not integrated','real processor current state and upgrade risks require review','fee quote and explicit broadcast review required'],
    compiler:solc.version(), compiler_input:input, source_sha256:sha(source),
    abi:artifact.abi, processor, pulse_hash:hashes[0], alternating_hash:hashes[1],
    evidence_block:evidence.block, evidence_scope:'historical-single-rpc-not-current-or-dual-verification',
    constructor_args:constructorArgs, creation_bytecode:'0x'+artifact.evm.bytecode.object,
    initcode, initcode_sha256:sha(Buffer.from(initcode.slice(2),'hex')),
    runtime_template:'0x'+artifact.evm.deployedBytecode.object,
    immutable_references:artifact.evm.deployedBytecode.immutableReferences,
    runtime_note:'template contains unpatched immutables; not a deployed-code identity',
  };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.length !== 3) throw Error('usage: prepare-deployment.mjs NEW_OUTPUT_JSON');
  const result = await prepareDeployment(process.env.TAPEWEAVE_SOLIDITY_TOOLS);
  await writeFile(process.argv[2],JSON.stringify(result,null,2)+'\n',{flag:'wx',mode:0o600});
  console.log('Prepared offline only; no simulation, signer or broadcast.');
}
