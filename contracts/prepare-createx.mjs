import {pathToFileURL} from 'node:url';
import {prepareCreateX} from './createx.mjs';
import {externalOutput,saveNew} from './createx-cli.mjs';

export async function main(args=process.argv.slice(2)){
  if(args.length!==3)throw Error('usage: prepare-createx.mjs AA_ADDRESS DEPLOYMENT_NUMBER NEW_OUTPUT_JSON');
  const [account,deploymentNumber,output]=args;
  externalOutput(output);
  const bundle=await prepareCreateX(process.env.TAPEWEAVE_SOLIDITY_TOOLS,{account,deploymentNumber});
  await saveNew(output,bundle);
  console.log(JSON.stringify({status:'CREATEX_PACKAGE_PREPARED',output,
    initcode_hash:bundle.initcode_hash,runtime_code_hash:bundle.runtime_code_hash,
    ready_to_send:false,broadcast:false,wallet_simulated:false},null,2));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  main().catch(error=>{console.error(error.message);process.exitCode=1;});
}
