// All modes are read-only; writes are new local external JSON files only.
import {pathToFileURL} from 'node:url';
import {createRpc} from './createx-rpc.mjs';
import {externalOutput,readBundle,saveNew} from './createx-cli.mjs';
import {inspectHost,prepareHostAction,verifyHostRun,verifyHostTransaction} from './host-actions.mjs';

export async function main(args=process.argv.slice(2)){
  const [mode,bundlePath,output,...extra]=args;
  if(!bundlePath||!output||!['inspect','open','act','receipt','verify-run'].includes(mode)||
    (mode==='inspect'&&extra.length>1)||(mode==='open'&&extra.length!==1)||
    (mode==='act'&&extra.length!==4)||(mode==='receipt'&&![1,3].includes(extra.length))||
    (mode==='verify-run'&&extra.length!==1)){
    throw Error('usage: host-cli.mjs inspect BUNDLE NEW_OUTPUT [SESSION] | open BUNDLE NEW_OUTPUT CARD | act BUNDLE NEW_OUTPUT CARD SESSION VERSION 0_OR_1 | receipt BUNDLE NEW_OUTPUT TX_HASH [UOP_HASH TRUSTED_ENTRYPOINT] | verify-run BUNDLE NEW_OUTPUT MANIFEST');
  }
  externalOutput(output);
  if(!process.env.TAPEWEAVE_RPC_URL)throw Error('Set TAPEWEAVE_RPC_URL');
  const urls=[process.env.TAPEWEAVE_RPC_URL,process.env.TAPEWEAVE_SECONDARY_RPC_URL].filter(Boolean);
  const rpcs=urls.map(url=>createRpc(url)),bundle=await readBundle(bundlePath);
  const tools=process.env.TAPEWEAVE_SOLIDITY_TOOLS;
  const integer=(text,pattern)=>{
    if(!pattern.test(text))throw Error('Invalid card, version or trigger');
    return Number(text);
  };
  let result;
  if(mode==='inspect')result=await inspectHost(bundle,rpcs,tools,{sessionId:extra[0]});
  if(mode==='open')result=await prepareHostAction(bundle,rpcs,tools,{
    operation:'open',circuit:integer(extra[0],/^[12]$/),
  });
  if(mode==='act')result=await prepareHostAction(bundle,rpcs,tools,{
    operation:'act',circuit:integer(extra[0],/^[12]$/),sessionId:extra[1],
    expectedVersion:integer(extra[2],/^[0-3]$/),trigger:Boolean(integer(extra[3],/^[01]$/)),
  });
  if(mode==='receipt')result=await verifyHostTransaction(bundle,rpcs,tools,{
    transactionHash:extra[0],userOperationHash:extra[1],entryPoint:extra[2],
  });
  if(mode==='verify-run')result=await verifyHostRun(bundle,rpcs,tools,await readBundle(extra[0]));
  await saveNew(output,result);
  console.log(JSON.stringify({status:result.status,output,broadcast:false,
    provider_agreement:result.provider_agreement??result.snapshot?.provider_agreement},null,2));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  main().catch(error=>{
    console.error(JSON.stringify({status:'BLOCKED',
      reason:error.message.replace(/https?:\/\/\S+/g,'[RPC URL redacted]'),broadcast:false}));
    process.exitCode=1;
  });
}
