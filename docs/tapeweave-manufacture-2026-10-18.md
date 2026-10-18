# TapeWeave 两枚工作室电路真实流片

执行／访问日期：2026-10-18 UTC。沿用用户签名、交易、广播授权及0.05 OKB暂停复核线。

## 结果

处理器为首笔创建所得 `0xdfc1abf794ef40b9eeeba1d875e7ab2b21a0a146`。本轮按工作室creator.mjs的compile与presets生成网表，不用早期精简实验字节冒充工作室制品：

|模板|链电路ID|NAND|LATCH|字节|
|---|---:|---:|---:|---:|
|pulse|1|54|1|382|
|alternating|2|47|1|333|

单端RPC固定块`0x4621be9`核processor/transistors双向关系、creator、费用、供应与初始余额。采购101个NAND和2个LATCH，mintPrice=0，每笔protocolFee=0.00066 OKB。未调用setApprovalForAll，原有对处理器授权为false；资源持有后，两枚tapeout的eth_call均成功。两次独立模拟均返回1，因为模拟不提交，不能把第二次模拟的1当作真实第二枚ID。

每笔付费调用之前运行tx-scan，action及风险项为空；在检查范围内未发现风险，不是审计。wallet contract-call均首次不加force，直接广播，无Confirming。真实交易：

|操作|费用OKB|交易|
|---|---:|---|
|101 NAND|0.00066|`0x5d4a40d2790a717fc6c4a3a9046a331fadef60250f039aaf4f089b0efc942636`|
|2 LATCH|0.00066|`0xcbdba658087e863bfee6a8c0fb9b92a3b6ad77616ce0383bc14bc95b2b826b1d`|
|pulse流片|0.0013|`0x63adc6a533a6098852a4d8b084a0867bd602483c5e42c9c46699787297203aa1`|
|alternating流片|0.0013|`0xd1798f884d00531c30901db435d60ffab9455564e5e6026495f35cb7e9a6608c`|

四份RPC回执均status=1；两个流片钱包history均SUCCESS。本轮合计0.00392 OKB，连同创建累计0.01052 OKB，距暂停复核线剩0.03948 OKB。回执effectiveGasPrice及l1Fee均为0，已取得钱包history的记录serviceCharge为0；不是未来费用承诺。

TapedOut日志分别记录ID1／2、author为Account 2、gateCount=55／48及nState=1（gateCount包含LATCH，不能误写为NAND数）。随后固定块读取两个netlist，逐字节等于本地编译结果。原始计划、模拟、扫描、执行、回执和网表核验：[JSON](../research/tapeweave/manufacture-circuits-2026-10-18.json)。RPC来源为<https://rpc.xlayer.tech>，ABI依据此前已固定哈希的[官方前端](https://tapeout.net/app/assets/index-BtJs_b-c.js)。

## 完成边界

已从“只有处理器”推进为两枚真实电路，但还没运行这两枚电路的完整八转换对照、双端绑定工具、真实双宿主回放或链上宿主交易；未声称独立用户采用、真机验证或获奖证据。这里是工作室模板，不自动替换早期固定demo／reference bundle，旧制品chain_identity=null维持原状。后续应单独产生带真实身份的绑定记录。无集合级授权，也未转移任何旧资产；工厂升级控制路径仍未审计。
