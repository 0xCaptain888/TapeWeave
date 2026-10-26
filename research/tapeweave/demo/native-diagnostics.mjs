// Read-only, allowlisted observations. Never serialize provider errors or raw capabilities.
import {address} from './chain-host.mjs';
import {quantity,CHAIN} from './chain-wallet.mjs?v=native-20261026-1';
const actions={
 no_provider:'当前网页没有钱包接口。请复制本页地址，在已安装并启用钱包扩展的 Chrome 中打开，或在钱包 DApp 浏览器打开。',
 disconnected:'钱包没有向本页提供账户。先点 Connect Wallet 并在钱包允许连接，再重新诊断；连接授权不是交易签名。',
 wallet_unavailable:'钱包只读请求失败或被拒绝。解锁钱包、检查站点连接权限后重试，不需要提供私钥。',
 invalid_response:'钱包或 RPC 返回格式不符，已停止。复制此报告，不要通过修改返回值绕过检查。',
 wrong_network:'钱包当前不在 X Layer 196。点击切换网络后重新连接；不要只修改网络名称。',
 eoa_or_undeployed:'此地址没有已部署合约代码，可能是普通 EOA 或尚未部署的智能账户。普通账户请用普通钱包入口；不要把插件地址当成官方工具 AA 地址。',
 delegated:'检测到 EIP-7702 委托代码，本 AA 入口不支持。请使用对应钱包工具，不自动升级或降级。',
 unsupported:'账户有合约代码，但钱包未声明本链原子调用 supported。请使用官方 AA 工具；不改用普通交易冒充 AA。',
 upgrade_required:'钱包返回 ready，需要账户升级。本页不会请求升级，请先在钱包自行评估处理。',
 method_unavailable:'钱包不提供所需能力方法，不能通过本页签 AA 请求。请使用官方 AA 工具或适配的钱包。',
 rpc_unavailable:'公共 RPC 读取失败，暂时不能判定账户类型。稍后重试，不要重复发送交易。',
 changed:'诊断期间账户或网络改变。原结果作废，请稳定钱包环境后重新连接。',
 browser_unsupported:'此环境缺少安全上下文或 Web Locks。请用当前版本 Chrome 打开 HTTPS 页面。',
 ready:'本次只读检查满足预览门槛；尚未签名，也未验证真实插件交易。下一步点击 Connect Wallet，再逐笔预览与钱包确认。',
};
export async function diagnoseNative({provider,rpc,secureContext,webLocks}){
 const result={format:'tapeweave-native-diagnostic-v1',status:'no_provider',chain:null,account:null,
  accountKind:'unknown',atomic:'unknown',secureContext:secureContext===true,webLocks:webLocks===true,
  readOnly:true,signatureRequested:false,transactionSubmitted:false,pluginAttested:false,acceptancePassed:false};
 const finish=status=>({...result,status,next:actions[status]});
 if(!provider||typeof provider.request!=='function')return finish('no_provider');
 let chain,account;
 try{
  chain=await provider.request({method:'eth_chainId'});quantity(chain);result.chain='0x'+BigInt(chain).toString(16);
  const accounts=await provider.request({method:'eth_accounts'});
  if(!Array.isArray(accounts))return finish('invalid_response');
  if(!accounts.length)return finish('disconnected');
  account=address(accounts[0]);result.account=account;
 }catch{return finish('wallet_unavailable');}
 if(quantity(chain)!==196n)return finish('wrong_network');
 let code;
 try{code=await rpc('eth_getCode',[account,'latest']);}catch{return finish('rpc_unavailable');}
 if(typeof code!=='string'||!/^0x(?:[0-9a-fA-F]{2})*$/.test(code)||code.length>131074)return finish('invalid_response');
 result.accountKind=code==='0x'?'eoa-or-undeployed':code.toLowerCase().startsWith('0xef0100')?'delegated':'contract';
 let status=result.accountKind==='eoa-or-undeployed'?'eoa_or_undeployed':result.accountKind==='delegated'?'delegated':null;
 if(!status){
  try{
   const value=await provider.request({method:'wallet_getCapabilities',params:[account,[CHAIN]]});
   if(!value||typeof value!=='object'||Array.isArray(value))return finish('invalid_response');
   const raw=value[CHAIN]?.atomic?.status??value['0x0']?.atomic?.status;
   result.atomic=['supported','ready','unsupported'].includes(raw)?raw:'unknown';
   status=result.atomic==='supported'?'ready':result.atomic==='ready'?'upgrade_required':'unsupported';
  }catch{return finish('method_unavailable');}
 }
 try{
  const accounts=await provider.request({method:'eth_accounts'}),currentChain=await provider.request({method:'eth_chainId'});
  if(!Array.isArray(accounts)||address(accounts[0])!==account||quantity(currentChain)!==196n)return finish('changed');
 }catch{return finish('changed');}
 if(status==='ready'&&(!result.secureContext||!result.webLocks))status='browser_unsupported';
 return finish(status);
}
