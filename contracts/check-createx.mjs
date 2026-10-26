import {pathToFileURL} from 'node:url';
import {preflightCreateX,createRpc,verifyCreateXDeployment} from './createx-rpc.mjs';
import {externalOutput,readBundle,saveNew} from './createx-cli.mjs';

// RPC URLs can contain provider credentials; accept them from the environment,
// omit paths/queries from reports, and never print them in CLI diagnostics.
export async function main(args=process.argv.slice(2)){
  const [mode,bundlePath,output,...extra]=args;
  if(!['preflight','verify'].includes(mode)||!bundlePath||!output||
    (mode==='preflight'&&extra.length!==0)||
    (mode==='verify'&&![1,3].includes(extra.length))){
    throw Error('usage: check-createx.mjs preflight BUNDLE NEW_OUTPUT_JSON | verify BUNDLE NEW_OUTPUT_JSON TX_HASH [UOP_HASH TRUSTED_ENTRYPOINT]');
  }
  externalOutput(output);
  if(!process.env.TAPEWEAVE_RPC_URL)throw Error('Set TAPEWEAVE_RPC_URL; optional TAPEWEAVE_SECONDARY_RPC_URL');
  const urls=[process.env.TAPEWEAVE_RPC_URL,process.env.TAPEWEAVE_SECONDARY_RPC_URL].filter(Boolean);
  const bundle=await readBundle(bundlePath),rpcs=urls.map(url=>createRpc(url));
  const tools=process.env.TAPEWEAVE_SOLIDITY_TOOLS;
  const result=mode==='preflight'
    ?await preflightCreateX(bundle,rpcs,tools)
    :await verifyCreateXDeployment(bundle,rpcs,tools,{
      transactionHash:extra[0],userOperationHash:extra[1],entryPoint:extra[2],
    });
  await saveNew(output,result);
  console.log(JSON.stringify({status:result.status,output,
    provider_agreement:result.provider_agreement,broadcast:false,
    wallet_simulated:false},null,2));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  main().catch(error=>{
    // Fetch exceptions and URL parsers may include a provider token.
    const message=error.message.replace(/https?:\/\/\S+/g,'[RPC URL redacted]');
    console.error(JSON.stringify({status:'BLOCKED',reason:message,broadcast:false}));
    process.exitCode=1;
  });
}
