import assert from 'node:assert/strict';
import {diagnoseNative} from './native-diagnostics.mjs';
const account='0x'+'12'.repeat(20);
async function check(options={}){
 const methods=[],f={chain:'0xc4',accounts:[account],code:'0x1234',atomic:'supported',...options};
 const provider=f.absent?null:{request:async({method})=>{
  methods.push(method);
  if(method==='eth_chainId')return f.chain;
  if(method==='eth_accounts')return f.accounts;
  if(method==='wallet_getCapabilities'){
   if(f.error)throw Error('secret-provider-error-do-not-export');
   if(f.change)f.accounts=['0x'+'34'.repeat(20)];
   return {'0xc4':{atomic:{status:f.atomic},extraSecret:'private-provider-field'}};
  }
  throw Error('write method forbidden');
 }};
 const r=await diagnoseNative({provider,rpc:async(method,params)=>{
  methods.push(method);assert.equal(method,'eth_getCode');assert.deepEqual(params,[account,'latest']);
  if(f.rpcError)throw Error('secret-rpc-error');return f.code;
 },secureContext:true,webLocks:!f.noLocks});
 assert.ok(methods.every(m=>['eth_chainId','eth_accounts','wallet_getCapabilities','eth_getCode'].includes(m)));
 assert.equal(r.signatureRequested,false);assert.equal(r.transactionSubmitted,false);assert.equal(r.acceptancePassed,false);
 assert.ok(!JSON.stringify(r).includes('secret')&&!JSON.stringify(r).includes('private-provider-field'));
 return r;
}
for(const [options,status]of [
 [{absent:true},'no_provider'],[{accounts:[]},'disconnected'],[{chain:'0x61'},'wrong_network'],
 [{code:'0x'},'eoa_or_undeployed'],[{code:'0xEF0100'+'11'.repeat(20)},'delegated'],
 [{atomic:'unsupported'},'unsupported'],[{atomic:'ready'},'upgrade_required'],[{atomic:'strange'},'unsupported'],
 [{error:true},'method_unavailable'],[{rpcError:true},'rpc_unavailable'],[{code:'oops'},'invalid_response'],
 [{change:true},'changed'],[{noLocks:true},'browser_unsupported'],[{},'ready'],
])assert.equal((await check(options)).status,status,JSON.stringify(options));
console.log('PASS 14 read-only native diagnostic cases: no connection/signature/send methods, account change, safe allowlisted exports; not real plugin compatibility');
