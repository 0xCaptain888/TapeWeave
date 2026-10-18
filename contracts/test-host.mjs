// Tool dependencies are deliberately outside this repository. Usage:
// TAPEWEAVE_SOLIDITY_TOOLS=/absolute/path/to/node_modules node contracts/test-host.mjs
import {createRequire} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const directory=process.env.TAPEWEAVE_SOLIDITY_TOOLS;
if(!directory?.startsWith('/'))throw Error('Set absolute TAPEWEAVE_SOLIDITY_TOOLS');
const require=createRequire(directory+'/package.json');
const solc=require('solc'),ganache=require('ganache'),ethers=require('ethers');
assert.match(solc.version(),/^0\.8\.30\+/);
const source=await readFile(new URL('./TapeWeaveHost.sol',import.meta.url),'utf8');
const mock=`// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;
contract Mock {
 uint public mode; function setMode(uint m) external {mode=m;}
 function netlist(uint256 id) external view returns(bytes memory) {return mode==1 ? bytes(hex"ff") : (id==1 ? bytes(hex"01") : bytes(hex"02"));}
 function step(uint256 id,bytes calldata state,bytes calldata input) external view returns(bytes memory,bytes memory) {
  uint8 old=uint8(state[0]); uint8 t=uint8(input[0])&1; uint8 r=(uint8(input[0])>>1)&1;
  if(mode==2) revert("unavailable");
  if(mode==3) return(hex"02",hex"00");
  if(mode==4) return(hex"00",hex"00");
  if(mode==5) assembly { return(0, 4096) }
  return(abi.encodePacked(id==1 ? r|(old&(1-t)) : old^t),abi.encodePacked(id==1 ? old&t : (1-old)&t));
 }
}`;
const input={language:'Solidity',sources:{'Host.sol':{content:source},'Mock.sol':{content:mock}},settings:{optimizer:{enabled:true,runs:200},evmVersion:'shanghai',outputSelection:{'*':{'*':['abi','evm.bytecode.object','evm.deployedBytecode.object']}}}};
const output=JSON.parse(solc.compile(JSON.stringify(input)));
for(const e of output.errors??[]){if(e.severity==='error')throw Error(e.formattedMessage);console.error(e.formattedMessage);}
const chain=ganache.provider({logging:{quiet:true},chain:{hardfork:'shanghai'},wallet:{deterministic:true}});
try {
 const provider=new ethers.BrowserProvider(chain);provider.pollingInterval=10;
 const owner=await provider.getSigner(0),other=await provider.getSigner(1);
 const deploy=async(file,name,args=[])=>{const c=output.contracts[file][name];const x=await new ethers.ContractFactory(c.abi,c.evm.bytecode.object,owner).deploy(...args);await x.waitForDeployment();return x;};
 const mock=await deploy('Mock.sol','Mock');
 const host=await deploy('Host.sol','TapeWeaveHost',[await mock.getAddress(),ethers.keccak256('0x01'),ethers.keccak256('0x02')]);
 const rejected=async promise=>assert.rejects(promise);
 const send=async promise=>{await(await promise).wait();};
 await rejected(host.open.staticCall(3));
 for(const [circuit,expectedTraining,expectedDoor,resource]of [[1,2,1,1],[2,1,0,2]]){
  await send(host.open(circuit));const id=await host.sessionCount();
  await rejected(host.connect(other).act.staticCall(id,0,false));
  await rejected(host.act.staticCall(id,1,false));
  for(const [v,t]of[false,false,true,true].entries()){
   await send(host.act(id,v,t));
   await rejected(host.act.staticCall(id,v,t));
  }
  const s=await host.sessions(id);assert.equal(s.version,4n);assert.equal(s.training.score,BigInt(expectedTraining));assert.equal(s.door.score,BigInt(expectedDoor));assert.equal(s.door.resource,BigInt(resource));
  await rejected(host.act.staticCall(id,4,true));
 }
 // Different player and session have independent zero state.
 await send(host.connect(other).open(1));const isolated=await host.sessions(3);assert.equal(isolated.player,await other.getAddress());assert.equal(isolated.version,0n);assert.equal(isolated.training.score,0n);
 // Force a real mined revert for each broken processor mode, not only eth_call.
 for(const mode of [1,2,3,4,5]){
  await send(mock.setMode(0,{gasLimit:100000}));await send(host.open(1));const id=await host.sessionCount();
  const before=await host.sessions(id);await send(mock.setMode(mode,{gasLimit:100000}));
  await rejected((async()=>{await send(host.act(id,0,false,{gasLimit:7000000}));})());
  assert.deepEqual((await host.sessions(id)).toArray(true),before.toArray(true));
 }
 await send(mock.setMode(1,{gasLimit:100000}));await rejected(host.open.staticCall(1));
 const artifact=output.contracts['Host.sol'].TapeWeaveHost;
 if(process.env.TAPEWEAVE_BUILD_OUTPUT)await writeFile(process.env.TAPEWEAVE_BUILD_OUTPUT,JSON.stringify({compiler:solc.version(),settings:input.settings,source,abi:artifact.abi,bytecode:'0x'+artifact.evm.bytecode.object,runtime:'0x'+artifact.evm.deployedBytecode.object},null,2)+'\n',{flag:'wx'});
 console.log('PASS: both 0011 worlds; authentication; nonce; end; session isolation; five mined atomic reverts; bounded returndata; netlist admission');
} finally {await chain.disconnect();}
