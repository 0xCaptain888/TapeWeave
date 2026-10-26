// Rebuild reviewed code locally, then fetch actual deployment, UOPs, actions and fees.
// No wallet access or broadcast. A published success flag is never trusted.
import {pathToFileURL} from 'node:url';
import {prepareCreateX,libraries} from './createx.mjs';
import {createRpc} from './createx-rpc.mjs';
import {externalOutput,readBundle,saveNew} from './createx-cli.mjs';
import {verifyHostRun} from './host-actions.mjs';
export async function main(args=process.argv.slice(2)){
  if(args.length!==2)throw Error('usage: verify-public-run.mjs PUBLIC_EVIDENCE_JSON NEW_EXTERNAL_REPORT');
  const [input,output]=args;externalOutput(output);
  const artifact=await readBundle(input),tools=process.env.TAPEWEAVE_SOLIDITY_TOOLS;
  if(artifact.format!=='tapeweave-public-mainnet-evidence-v1'||artifact.chain_id!==196)throw Error('Unknown public evidence format');
  const bundle=await prepareCreateX(tools,{account:artifact.account_address,deploymentNumber:artifact.deployment_number});
  if(bundle.predicted_address!==artifact.host||bundle.runtime_code_hash!==artifact.runtime_code_hash||
    bundle.preparation.expected_runtime!==artifact.expected_runtime)throw Error('Published runtime differs from reviewed local source');
  if(!process.env.TAPEWEAVE_RPC_URL)throw Error('Set TAPEWEAVE_RPC_URL');
  const urls=[process.env.TAPEWEAVE_RPC_URL,process.env.TAPEWEAVE_SECONDARY_RPC_URL].filter(Boolean);
  const retryRead=async(...args)=>{
    for(let i=0;i<4;i++){
      const response=await fetch(...args);
      if(response.status!==429||i===3)return response;
      await response.body.cancel();
      await new Promise(r=>setTimeout(r,1000*(i+1)));
    }
  };
  const rpcs=urls.map(url=>createRpc(url,{fetchImpl:retryRead,timeout:60000}));
  const proof=await verifyHostRun(bundle,rpcs,tools,artifact.manifest);
  const ethers=libraries(tools),iface=new ethers.Interface([
    'event UserOperationEvent(bytes32 indexed userOpHash,address indexed sender,address indexed paymaster,uint256 nonce,bool success,uint256 actualGasCost,uint256 actualGasUsed)',
  ]);
  const refs=[artifact.manifest.deployment,...artifact.manifest.sessions.flatMap(s=>[s.open,...s.actions])];
  const steps=[proof.deployment,...proof.sessions.flatMap(s=>s.steps)],fees=[];
  for(const [index,ref]of refs.entries()){
    const receipt=await rpcs[0].request('eth_getTransactionReceipt',[ref.transaction_hash]);
    if(receipt?.blockHash!==steps[index].block_hash)throw Error('Receipt changed during fee verification');
    const events=receipt.logs.filter(l=>l.address.toLowerCase()===ref.entry_point.toLowerCase())
      .flatMap(l=>{try{const e=iface.parseLog(l);return e?.args.userOpHash===ref.user_operation_hash?[e]:[];}catch{return [];}});
    if(events.length!==1)throw Error('Missing fee event');
    const fee={transaction_hash:ref.transaction_hash,
      outer_fee:(BigInt(receipt.gasUsed)*BigInt(receipt.effectiveGasPrice)).toString(),
      user_operation_actual_gas_cost:events[0].args.actualGasCost.toString()};
    if(JSON.stringify(fee)!==JSON.stringify(artifact.fees?.[index]))throw Error('Published fee differs from RPC receipt');
    fees.push(fee);
  }
  const outer=fees.reduce((s,f)=>s+BigInt(f.outer_fee),0n).toString();
  const uop=fees.reduce((s,f)=>s+BigInt(f.user_operation_actual_gas_cost),0n).toString();
  if(outer!==artifact.outer_fee_total_wei||uop!==artifact.user_operation_fee_total_wei)throw Error('Published fee total differs');
  await saveNew(output,{...proof,fees,outer_fee_total_wei:outer,user_operation_fee_total_wei:uop});
  console.log(JSON.stringify({status:proof.status,output,transaction_count:11,
    all_user_operations_verified:proof.all_user_operations_verified,
    outer_fee_total_wei:outer,user_operation_fee_total_wei:uop,broadcast:false}));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  main().catch(error=>{console.error(JSON.stringify({status:'BLOCKED',
    reason:error.message.replace(/https?:\/\/\S+/g,'[RPC URL redacted]'),broadcast:false}));process.exitCode=1;});
}
