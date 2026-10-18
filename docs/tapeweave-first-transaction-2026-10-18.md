# TapeWeave 首笔真实创建交易

访问与执行日期：2026-10-18 UTC（America/Los_Angeles 为2026-10-18 00:08左右）。用户已明确授权签名、交易和广播。本轮按此前0.05 OKB暂停复核线执行，不把账户全部余额视作预算。

## 已完成

- 钱包 Account 2，X Layer 196；模拟前余额0.10391355 OKB。
- 官方前端资产重新获取：<https://tapeout.net/app/assets/index-BtJs_b-c.js>，SHA256 `47fe0a3293428795cab83a43f2fd8c9da23650cb388963dbbfd116ee11f24c20`。Python访问403，curl成功；不是两个独立来源。
- createCPU参数：名称TapeWeave，符号TWAVE，story为`TapeWeave experimental portable behavior circuits. Not audited.`，transistorSupply=10000，mintPrice=0。10000是供应上限，不是已铸造或购买10000个晶体管。
- 工厂 `0x1f09daefa827f02cbb40967cc91b259763760761`；单端RPC <https://rpc.xlayer.tech> 固定块`0x4621a9f`的eth_call成功，eth_estimateGas为731580（估算不等于实际用量）。
- OKX CLI tx-scan返回action为空、风险项为空：仅在所做检查范围内未检测到风险，不是源码或权限审计。
- wallet contract-call首次调用未加force，直接返回交易；未遇到需要另行确认的Confirming响应。未发送授权交易。

## 真实结果

交易：`0x95ea9e0a9502dd3125a86edd9bd84c1a091c9b9f8001db65a913501244fd77dd`

钱包history返回SUCCESS，创建费支出0.0066 OKB、serviceCharge=0。RPC回执status=0x1，块`0x4621acc`，effectiveGasPrice=0、l1Fee=0。剩余0.05暂停复核线额度为0.0434 OKB，尚未计入任何未来操作。

CPUCreated事件（由工厂发出）记录：

- circuits／processor：`0xdfc1abf794ef40b9eeeba1d875e7ab2b21a0a146`
- transistors：`0xf009a23132f815d48b1b5275b088b780dcdcaa5a`
- creator：`0xc055d5c6d6d02d797074829120c85e7843f8cb3f`

回执外层from是`0x3017c541505769404a64541cfabedfebb06af9b1`、to是EntryPoint `0x0000000071727de22e5e9d8baf0edac6f37da032`，不是直接EOA调用工厂；同一回执包含creator为Account 2的CPUCreated和EntryPoint日志。与钱包AA执行路径相容，不应把外层from误认为用户账户，也不据此宣称已完整审计AA路径。

原始模拟、扫描、钱包返回、history及完整回执：[JSON](../research/tapeweave/create-processor-2026-10-18.json)。模拟预测地址仅作模拟；以上身份以成功回执事件为依据。公开JSON不含钱包凭据、私钥、助记词或签名原文。

## 尚未完成

本轮只创建处理器，没有铸造NAND／LATCH、没有流片电路、没有链上宿主消费、独立体验或手机验证。旧样本不是本项目电路身份，既有制品chain_identity=null保持不变。下一步应核新处理器的资源、费用及调用权限，优先避免集合级setApprovalForAll；如唯一可行路径需要该类授权，应停下说明，而非悄悄执行。工厂升级与owner控制路径仍未完成审计，单端RPC记录也不是独立交叉验证。历史设计70分不因创建成功而上调。
