// Fixed official-frontend factory, read-only fee observation. No transaction API.
import {endpoints,publicRead} from './xlayer-binding.mjs';
const factory='0x1f09daefa827f02cbb40967cc91b259763760761';
const records=[];
const read=async(e,m,p)=>{const result=await publicRead(e,m,p);records.push({endpoint:e,method:m,params:p,result});return result;};
const uint=x=>{if(!/^0x[0-9a-f]{64}$/.test(x))throw Error('uint256 ABI不合法');return BigInt(x);};
const address=x=>{if(!/^0x0{24}[0-9a-f]{40}$/.test(x)||/^0x0{64}$/.test(x))throw Error('地址ABI不合法');return '0x'+x.slice(-40);};
const block=process.argv[2];
const report={schema:'tapeweave-manufacturing-fees-v1',observed_at_utc:new Date().toISOString(),factory,block,records,matched:false,zero_budget_permits_manufacturing:false,authenticated:false,transactions_sent:false};
try{
 if(process.argv.length!==3||!/^0x[1-9a-f][0-9a-f]{0,15}$/.test(block))throw Error('usage: check-manufacturing-fees.mjs HISTORICAL_BLOCK_HEX');
 const results=[];
 for(const endpoint of endpoints){
  if(await read(endpoint,'eth_chainId',[])!=='0xc4')throw Error('不是X Layer196');
  const call=(to,data)=>read(endpoint,'eth_call',[{to,data},block]);
  if(await read(endpoint,'eth_getCode',[factory,block])==='0x')throw Error('工厂无代码');
  const deploy=uint(await call(factory,'0xeb2a5d2c'));
  const count=uint(await call(factory,'0xa94da8a7'));if(count===0n)throw Error('没有可观察处理器');
  const processor=address(await call(factory,'0x4bc7cbbd'+'0'.repeat(64)));
  const tapeout=uint(await call(processor,'0xadfb2b69'));
  const transistors=address(await call(processor,'0x6fbd1719'));
  const mint=uint(await call(transistors,'0x6817c76c'));
  results.push({deploy_fee_base_units:deploy.toString(),processor_sample:processor,tapeout_fee_base_units:tapeout.toString(),transistors,mint_price_base_units:mint.toString(),processor_count:count.toString()});
 }
 if(JSON.stringify(results[0])!==JSON.stringify(results[1]))throw Error('双RPC费用不一致');
 report.matched=true;report.fees=results[0];
 report.reason=BigInt(results[0].deploy_fee_base_units)>0n||BigInt(results[0].tapeout_fee_base_units)>0n?'观察到非零创建或流片费，零预算停止':'仅有限样本费用为零，其他处理器／晶体管／权限／网络费用仍未确认，不授权制造';
}catch(e){report.failure=e.message;process.exitCode=1;}
console.log(JSON.stringify(report,null,2));
