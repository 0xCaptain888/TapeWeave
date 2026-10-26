// Curate public, read-only evidence from an already verified run.
// JSON is an author report, not a trusted attestation. No wallet process.
import {readFile,writeFile} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {validateCreateX} from './createx.mjs';
import {validateRunManifest} from './host-actions.mjs';
const [externalDirectory,output]=process.argv.slice(2);
if(!externalDirectory||!output)throw Error('usage: publish-run-evidence.mjs EXTERNAL_RUN_DIRECTORY NEW_PUBLIC_JSON');
const read=async name=>JSON.parse(await readFile(join(resolve(externalDirectory),name),'utf8'));
const bundle=await read('deployment-bundle.json');
await validateCreateX(bundle,process.env.TAPEWEAVE_SOLIDITY_TOOLS);
const manifest=validateRunManifest(await read('actual-run-manifest.json'));
const proof=await read('actual-run-proof.json');
if(proof.status!=='BOTH_CARD_RUNS_VERIFIED'||proof.transaction_count!==11||
  !proof.all_user_operations_verified||proof.host!==bundle.predicted_address||
  proof.deployment.transaction_hash!==manifest.deployment.transaction_hash){
  throw Error('Expected completed run proof for the reviewed deployment');
}
for(const [index,session]of manifest.sessions.entries()){
  const p=proof.sessions[index],refs=[session.open,...session.actions];
  if(p.session_id!==session.session_id||p.circuit!==session.circuit||p.steps.length!==5||
    p.steps.some((step,i)=>step.transaction_hash!==refs[i].transaction_hash||
      step.user_operation.user_operation_hash!==refs[i].user_operation_hash)){
    throw Error('Manifest differs from verified run');
  }
}
const deploymentFee=await read('deployment-entrypoint-observation.json');
const fees=[{transaction_hash:deploymentFee.transaction_hash,
  outer_fee:deploymentFee.outer_fee,
  user_operation_actual_gas_cost:deploymentFee.user_operations[0].actual_gas_cost}];
for(const circuit of [1,2])for(const stage of ['open','act0','act1','act2','act3']){
  const fee=await read(`card${circuit}-${stage}-fee.json`);
  fees.push({transaction_hash:fee.transaction_hash,outer_fee:fee.outer_fee,
    user_operation_actual_gas_cost:fee.user_operation_actual_gas_cost});
}
const hashes=[manifest.deployment.transaction_hash,...manifest.sessions.flatMap(s=>[s.open,...s.actions].map(x=>x.transaction_hash))];
if(fees.some((f,i)=>f.transaction_hash!==hashes[i]||
  !/^\d+$/.test(f.outer_fee)||!/^\d+$/.test(f.user_operation_actual_gas_cost))){
  throw Error('Fees differ from manifest');
}
const outer=fees.reduce((sum,f)=>sum+BigInt(f.outer_fee),0n);
const uop=fees.reduce((sum,f)=>sum+BigInt(f.user_operation_actual_gas_cost),0n);
const artifact={format:'tapeweave-public-mainnet-evidence-v1',recorded_at:new Date().toISOString(),
  chain_id:196,host:bundle.predicted_address,account_address:bundle.account_address,
  deployment_number:bundle.deployment_number,
  expected_runtime:bundle.preparation.expected_runtime,runtime_code_hash:bundle.runtime_code_hash,
  manifest,proof,fees,outer_fee_total_wei:outer.toString(),user_operation_fee_total_wei:uop.toString(),
  scope:'Author-published snapshot. Re-run the read-only verifier against RPC; JSON is not signed proof. Browser checks runtime and current session only. One RPC origin; signatures not revalidated.'};
await writeFile(resolve(output),JSON.stringify(artifact,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({status:'PUBLIC_RUN_SNAPSHOT_CURATED',output:resolve(output),transaction_count:11,
  outer_fee_total_wei:outer.toString(),user_operation_fee_total_wei:uop.toString()}));
