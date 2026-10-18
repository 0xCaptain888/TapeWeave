# TapeWeave 链接入与工程交付工具

日期：2026-10-17。本文为作者源码说明；本轮没有重新访问官方规则／制造ABI，也没有访问真实RPC、签名、制造、部署、付费或投稿。选择器沿用既有[历史只读调查](../../../docs/tapeout-integrated-decision-2026-10-17.md)及其保存JSON，不是当前官方接口认证。

## 1. 已开发的只读绑定检查

```sh
node research/tapeweave/demo/check-xlayer-binding.mjs ARTIFACT_FILE PROCESSOR CIRCUIT_UINT64 BLOCK_HEX > /tmp/tapeweave-binding.json
```

四个参数均必填；不提供预设为本项目所有的处理器或电路ID。需要用户提供实际已存在、与创作包字节一致的电路。块号必须为历史块十六进制quantity（如`0x123`仅为格式示例，不是推荐实际块），不接受`latest`。电路ID必须是uint64十进制字符串。

固定两个公开端点：`https://rpc.xlayer.tech`和`https://xlayerrpc.okx.com`。每个端点最多12次：chainId、处理器代码、info、netlist与8种转换；最多24次。只允许`eth_chainId`、`eth_getCode`、`eth_call`，调用15秒超时、响应64 KiB上限、不跟随HTTP重定向。无钱包、余额读取、gas估算、state override或发送交易。

检查顺序：

1. 本地先校验创作包有限行为表、字节、SHA与null身份，参数非法不访问网络。
2. 两端chainId均为196；历史块处理器有代码。
3. `info(uint256)`选择器`0x084d60f1`返回四ABI字，前三为2输入、1输出、1状态；第四字段仅保存，不以未知含义作保证。
4. `netlist(uint256)`选择器`0x3fc4be56`返回字节须与创作包完全一致。
5. `step(uint256,bytes,bytes)`选择器`0xe8281a1a`核对8行旧状态／触发／补能；输入打包trigger | recharge<<1，状态与输出均严格为一字节0／1，动态ABI偏移、填充与尾部精确校验。
6. 两端代码、info、字节与转换完全一致才标`matched:true`。

失败或网络异常输出`matched:false`和已取得的记录，退出码1；参数错误只有stderr。输出重定向可能留下空文件，不覆盖输入或数据库。成功报告也仅为**两个RPC在指定块返回相同字节和有限转换**，不证明RPC独立、区块最终性、制造者、所有者、升级权限、安全性或真实宿主交易。原创作包chain_identity仍为null；不会改写本地回放或SQLite配置。

## 2. 离线记录复核

```sh
node research/tapeweave/demo/verify-xlayer-binding.mjs ARTIFACT_FILE /tmp/tapeweave-binding.json
```

报告限256 KiB，只接受完整成功的24条记录。离线按预期端点／方法／参数／顺序重放检查，再比较全部结论；调换记录、篡改转换、摘要、证据字段或增加记录均拒绝。**任何人仍可构造自洽RPC文本**，通过复核不认证RPC来源或上链历史；不叫链证明或官方认证。

## 3. 工程交付清单生成（不是投稿器）

```sh
node research/tapeweave/demo/prepare-delivery.mjs \
  research/tapeweave/demo/creator-artifact-example.json \
  research/tapeweave/demo/creator-replay-example.json > /tmp/tapeweave-handoff.json
```

可选第三参数是只读绑定报告。先复核创作包与回放为同一字节，重算双宿主结果；有绑定报告则离线复核全记录。输出输入文件UTF-8文本SHA、制品SHA、动作、模式、成绩、可选历史绑定和未完成项。无打包下载、上传、报名、交易或后台处理。文本SHA受空格影响，与制品字节SHA不同。固定`competition_ready:false`，不会因合成报告而变为参赛完成。

## 4. 已知阻塞与下一次具体授权清单

代码侧已补齐有限创作→本地双宿主→SQLite事务恢复→回放→只读字节绑定检查→工程交付摘要；没有把剩余外部工作伪装完成。

|缺项|执行前必须确定|当前状态|
|---|---|---|
|制造与部署|当前官方制造ABI、工厂／实现地址、网络、钱包地址、制品字节与权限|未知／未核验，不生成猜测calldata|
|费用|报价、单笔／总预算上限、native token、失败重试与停止条件|未报价、未扣款|
|宿主真实消费|状态归属、并发与重放保护、签名域、升级权限及目标合约|仅本地宿主，无链消费交易|
|授权|用户已授权推进真实集成与全部相关开发；实际交易仍须指定钱包、合约与金额上限|开发授权已具备，执行参数待确定|
|价值验证|真人同意、独立参与者任务、公平普通对照、数据保留|任务表已有，未外联或虚构结果|
|演示与投稿|真实证据、≤180秒录制、最新资格与表单、正式提交许可|脚本已有，未录制或提交|

这里不把公开源码授权解释为付费、写链或外联授权。为避免误导，没有“模拟制造成功”按钮或假交易回执。平台静态Pages不运行Node工具；在本地Node24运行。

用户最新授权已覆盖推进真实制造、宿主消费、独立验证、视频及投稿相关开发；不是无限金额授权，也不能替代CLI要求的逐笔交易确认。原始私钥／令牌不进入聊天，使用已连接钱包或团队Secrets。真实受试者、录制结果和投稿资料不得由程序虚构。

## 5. 测试边界

`test-xlayer-binding.mjs`使用自造RPC响应覆盖24条读取、8转换、错误网络／代码／字节／ABI／双端差异／传输异常、参数前置拒绝、报告篡改及交付包不匹配。最初calldata长度测试误写650字符，按真实ABI 7个32字＋4字节选择器共458字符纠正后通过。**本轮没有制造可成功绑定的真实项目电路，也没有线上RPC通过记录**。测试生成的成功报告仅存在测试内存，不作为真实证据保存。
