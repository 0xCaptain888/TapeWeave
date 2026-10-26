// Download pinned public compiler artifacts to an external test-tools folder.
// This is a reference-data download, never an RPC, wallet or deployment command.
import {pathToFileURL} from 'node:url';
import {FACTORY,FACTORY_COMMIT,FACTORY_CODE_HASH,libraries} from './createx.mjs';
import {externalOutput,saveNew} from './createx-cli.mjs';

export async function fetchReference(tools){
  const ethers=libraries(tools);
  const base=`https://raw.githubusercontent.com/pcaversaccio/createx/${FACTORY_COMMIT}/`;
  const paths=['artifacts/src/CreateX.sol/CreateX.json',
    'artifacts/build-info/c6d951136e35b73916c5666d481ae5c8.json'];
  const [artifact,build]=await Promise.all(paths.map(async path=>{
    const r=await fetch(base+path,{redirect:'error',signal:AbortSignal.timeout(20000)});
    if(!r.ok)throw Error('Pinned CreateX reference download failed');
    return r.json();
  }));
  const declarations=build.output.sources['src/CreateX.sol'].ast.nodes
    .filter(n=>n.nodeType==='ContractDefinition'&&n.name==='CreateX')
    .flatMap(n=>n.nodes.filter(d=>d.nodeType==='VariableDeclaration'&&d.mutability==='immutable'));
  if(declarations.length!==1||declarations[0].name!=='_SELF'||
    declarations[0].typeDescriptions.typeString!=='address')throw Error('Unexpected CreateX immutable layout');
  const refs=build.output.contracts['src/CreateX.sol'].CreateX.evm.deployedBytecode
    .immutableReferences[declarations[0].id];
  const runtime=Buffer.from(artifact.deployedBytecode.slice(2),'hex');
  for(const {start,length}of refs){
    if(length!==32||start<0||start+length>runtime.length||
      runtime.subarray(start,start+length).some(b=>b!==0))throw Error('Invalid CreateX template');
    Buffer.from(ethers.zeroPadValue(FACTORY,32).slice(2),'hex').copy(runtime,start);
  }
  const code='0x'+runtime.toString('hex');
  if(ethers.keccak256(code)!==FACTORY_CODE_HASH)throw Error('CreateX runtime hash mismatch');
  return {format:'tapeweave-createx-reference-v1',source_commit:FACTORY_COMMIT,
    source_files:paths,runtime:code,runtime_hash:FACTORY_CODE_HASH};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  (async()=>{
    if(process.argv.length!==3)throw Error('usage: fetch-createx-reference.mjs NEW_EXTERNAL_OUTPUT_JSON');
    externalOutput(process.argv[2]);
    await saveNew(process.argv[2],await fetchReference(process.env.TAPEWEAVE_SOLIDITY_TOOLS));
    console.log('Pinned CreateX test reference downloaded and runtime hash verified; no RPC or wallet used.');
  })().catch(error=>{console.error(error.message);process.exitCode=1;});
}
