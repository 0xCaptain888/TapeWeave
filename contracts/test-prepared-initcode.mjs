// Deploy the exact offline preparation in a local EVM, never a live network.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {prepareDeployment} from './prepare-deployment.mjs';
const tools=process.env.TAPEWEAVE_SOLIDITY_TOOLS;
if(!tools?.startsWith('/'))throw Error('Set absolute TAPEWEAVE_SOLIDITY_TOOLS');
const require=createRequire(`${tools}/package.json`);
const {ethers}=require('ethers'),ganache=require('ganache'),solc=require('solc');
const bundle=await prepareDeployment(tools);
// Return the reviewed netlists, but use formula transitions: this is a Mock, not TapeOut.
const evidence=JSON.parse(await (await import('node:fs/promises')).readFile(new URL('../research/tapeweave/manufactured-transitions-2026-10-18.json',import.meta.url),'utf8'));
const netlists=['pulse','alternating'].map(name=>evidence.results.find(r=>r.name===name).artifact.netlist_hex);
const source=`pragma solidity 0.8.30;
contract PreparedMock {
 function netlist(uint256 id) external pure returns(bytes memory){require(id==1||id==2);if(id==1)return hex"${netlists[0]}";return hex"${netlists[1]}";}
 function step(uint256 id,bytes calldata s,bytes calldata i) external pure returns(bytes memory,bytes memory){
 uint8 o=uint8(s[0]);uint8 t=uint8(i[0])&1;uint8 r=(uint8(i[0])>>1)&1;
 return(abi.encodePacked(id==1?r|(o&(1-t)):o^t),abi.encodePacked(id==1?o&t:(1-o)&t));}
}`;
const input={language:'Solidity',sources:{'Mock.sol':{content:source}},settings:{evmVersion:'shanghai',outputSelection:{'*':{'*':['evm.deployedBytecode.object']}}}};
const out=JSON.parse(solc.compile(JSON.stringify(input)));
assert.equal((out.errors??[]).filter(e=>e.severity==='error').length,0);
const chain=ganache.provider({logging:{quiet:true},chain:{hardfork:'shanghai'},wallet:{deterministic:true}});
try {
 const provider=new ethers.BrowserProvider(chain);provider.pollingInterval=10;
 const signer=await provider.getSigner();
 // Local-only code injection makes the constructor's real-address code check possible.
 await provider.send('evm_setAccountCode',[bundle.processor,'0x'+out.contracts['Mock.sol'].PreparedMock.evm.deployedBytecode.object]);
 const receipt=await(await signer.sendTransaction({data:bundle.initcode,gasLimit:7000000})).wait();
 assert.equal(receipt.status,1);
 const host=new ethers.Contract(receipt.contractAddress,bundle.abi,signer);
 assert.equal(await host.processor(),bundle.processor);
 assert.equal(await host.pulseHash(),bundle.pulse_hash);
 assert.equal(await host.alternatingHash(),bundle.alternating_hash);
 const code=await provider.getCode(receipt.contractAddress);
 const actual=Buffer.from(code.slice(2),'hex');
 const template=Buffer.from(bundle.runtime_template.slice(2),'hex');
 assert.equal(actual.length,template.length);
 // Mask ONLY compiler-declared immutable locations; compare every other byte.
 for(const refs of Object.values(bundle.immutable_references))for(const {start,length} of refs){
  assert.ok(start>=0&&length>0&&start+length<=actual.length);
  actual.fill(0,start,start+length);template.fill(0,start,start+length);
 }
 assert.deepEqual(actual,template);
 for(const [circuit,training,door,keys]of [[1,2,1,1],[2,1,0,2]]){
  await(await host.open(circuit)).wait();const id=await host.sessionCount();
  for(const [version,trigger]of [false,false,true,true].entries())await(await host.act(id,version,trigger)).wait();
  const s=await host.sessions(id);
  assert.equal(s.version,4n);assert.equal(s.training.score,BigInt(training));
  assert.equal(s.door.score,BigInt(door));assert.equal(s.door.resource,BigInt(keys));
 }
 assert.equal(bundle.broadcast,false);assert.equal(bundle.simulated,false);assert.equal(bundle.ready_to_send,false);
 console.log('PASS: exact prepared initcode local deployment; immutable getters; masked full runtime; both 0011 worlds. Mock only, no wallet/live RPC.');
}finally{await chain.disconnect();}
