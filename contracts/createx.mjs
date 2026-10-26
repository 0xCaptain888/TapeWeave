// Deterministic preparation only. This module has no signer or broadcast API.
import {createRequire} from 'node:module';
import {isDeepStrictEqual} from 'node:util';
import {prepareDeployment} from './prepare-deployment.mjs';

export const FACTORY='0xba5Ed099633D3B313e4D5F7bdc1305d3c28ba5Ed';
export const FACTORY_CODE_HASH='0xbd8a7ea8cfca7b4e5f5041d7d4b17bc317c5ce42cfbc42066a00cf26b43eb53f';
export const FACTORY_COMMIT='6b78530a870846920834eb4b6cd369be01be9ed0';
export const FACTORY_ABI=[
  'function deployCreate2(bytes32 salt,bytes initCode) payable returns(address)',
  'function computeCreate2Address(bytes32 salt,bytes32 initCodeHash) view returns(address)',
  'event ContractCreation(address indexed newContract,bytes32 indexed salt)',
];
export function libraries(tools){
  if(!tools?.startsWith('/'))throw Error('Set absolute TAPEWEAVE_SOLIDITY_TOOLS');
  return createRequire(`${tools}/package.json`)('ethers').ethers;
}
export function nonzeroAddress(value,ethers){
  if(typeof value!=='string')throw Error('Explicit address required');
  const result=ethers.getAddress(value);
  if(result===ethers.ZeroAddress)throw Error('Nonzero address required');
  return result;
}
export async function prepareCreateX(tools,{account,deploymentNumber}={}){
  const ethers=libraries(tools);
  account=nonzeroAddress(account,ethers);
  if(typeof deploymentNumber!=='string'||!/^[1-9][0-9]{0,26}$/.test(deploymentNumber)
    ||BigInt(deploymentNumber)>=(1n<<88n))throw Error('Deployment number must be 1..2^88-1');
  const base=await prepareDeployment(tools);
  const salt=ethers.concat([account,'0x00',ethers.toBeHex(BigInt(deploymentNumber),11)]);
  // For AA||00||number, CreateX hashes the padded sender and the raw salt.
  const guardedSalt=ethers.keccak256(ethers.AbiCoder.defaultAbiCoder()
    .encode(['address','bytes32'],[account,salt]));
  const initcodeHash=ethers.keccak256(base.initcode);
  const predicted=ethers.getCreate2Address(FACTORY,guardedSalt,initcodeHash);
  const calldata=new ethers.Interface(FACTORY_ABI)
    .encodeFunctionData('deployCreate2',[salt,base.initcode]);
  return {
    format:'tapeweave-createx-deployment-v1',chain_id:196,
    account_address:account,deployment_number:deploymentNumber,
    factory:FACTORY,factory_commit:FACTORY_COMMIT,factory_code_hash:FACTORY_CODE_HASH,
    salt,guarded_salt:guardedSalt,initcode_hash:initcodeHash,
    predicted_address:predicted,runtime_code_hash:ethers.keccak256(base.expected_runtime),
    execution:{to:FACTORY,value:'0',calldata},
    preparation:base,
    ready_to_send:false,wallet_simulated:false,rpc_simulated:false,broadcast:false,
    wallet_creation_adapter:'onchainos wallet contract-call',
    wallet_arguments:['wallet','contract-call','--chain','196','--to',FACTORY,
      '--amt','0','--input-data',calldata,'--from',account],
    blockers:['fresh RPC preflight','current wallet account and backend simulation',
      'fee and explicit broadcast authorization'],
  };
}
export async function validateCreateX(bundle,tools){
  if(bundle?.format!=='tapeweave-createx-deployment-v1')throw Error('Unknown deployment format');
  // Recompile from this checkout. Never trust a pasted hash, ABI or bytecode.
  const expected=await prepareCreateX(tools,{
    account:bundle.account_address,deploymentNumber:bundle.deployment_number,
  });
  if(!isDeepStrictEqual(bundle,expected))throw Error('Deployment bundle differs from reviewed local source');
  return bundle;
}
