# TapeWeave 真实主网运行与费用

执行日期：2026-10-26。链：X Layer 主网，196。用户明确授权真实钱包模拟、费用审核、部署、交互及 GitHub／Demo 更新；此前暂停部署已解除，预算复核线仍为累计 0.05 OKB。

## 已完成的链上结果

- 当前官方钱包 Account 2 的 X Layer AA 地址：`0xc055d5c6D6D02D797074829120c85e7843f8Cb3f`。
- CreateX：`0xba5Ed099633D3B313e4D5F7bdc1305d3c28ba5Ed`。
- TapeWeaveHost：`0x440c3CC7DdD50566126754199Df7336499eE1E20`。
- 部署交易：`0x0fc88535960a02bf3f6fd0b213f87c773a13c0c1a2abe345a9451a437edc697c`，区块 `0x46c924e`。
- 部署 UserOperation：`0x9e8c5fdc0515e14fdab2138d5645a968f8f6a205cda2d1a172a2f40ee11c85c3`。
- EntryPoint：`0x0000000071727De22E5E9d8BAf0edAc6f37da032`。已核 AA 的 `entryPoint()`、部署外层交易目标与事件发出地址一致；没有重新验证签名。
- initcode Keccak-256：`0x9ffe4fc56d84c487083a5464ba1fcc154c62105764b12821b4a88294b1033207`。
- runtime Keccak-256：`0xd9b8a0f70b59f0d8d03e7c6aec4b616e57810fb1412bb8d7f693bb1b37adf26e`。

两卡分别执行“等待 → 等待 → 触发 → 触发”，从实际 `Opened` 日志取得会话 ID，不从模拟结果猜测：

| 卡 | 真实会话 | 最终版本 | 训练分数 | 开门次数 | 剩余钥匙 |
|---|---:|---:|---:|---:|---:|
| 蓄能，ID1 | 1 | 4 | 2 | 1 | 1 |
| 交替，ID2 | 2 | 4 | 1 | 0 | 2 |

部署 1 笔、开局 2 笔、动作 8 笔，共 11 个不同交易哈希。每笔成功回执均绑定同一 AA 的成功 UserOperation；核验事件所在 UOP 日志区间，不能误认同 bundle 的其他操作。重算两局全部请求与效果，对比最后动作区块的完整会话，核规范区块与至少两个确认深度。结果 `BOTH_CARD_RUNS_VERIFIED`，`all_user_operations_verified=true`。

完整交易、UOP、规范区块、事件顺序、最终状态及逐笔费用在[公开运行 JSON](../research/tapeweave/demo/mainnet-evidence.json)。它是作者发布的报告，JSON 成功字段本身不构成签名或可信认证；应重新获取 RPC 复核。

## 模拟、风险检查与费用

部署前核固定版本的官方 CreateX runtime、AA 代码、真实处理器与两卡网表，执行 AA 地址的工厂 `eth_call`，确认返回预测地址；每步动作重新核当前会话与显式版本，再以 AA 地址 `eth_call`。

每次真实发送前还运行官方 `security tx-scan`、`gateway simulate`、`gateway gas-limit` 与 gas 报价。风险扫描覆盖范围内未检测到风险；这不是安全审计。网关无失败原因和风险项，未观察到代币资产变动。部署网关模拟 gasUsed 为 8,983,328，gas-limit 为 891,320；差异没有隐去，预算取较高值。动作也取网关模拟／估算较高值并留余量，不把估算当实际收费。

实际签名与 UOP 构造由官方钱包后端完成。CLI 没有单独返回完整 UOP 的独立签名前模拟报告，因此不将网关内部调用模拟称为完整 ERC-4337 校验。没有导出私钥、切换账户、发送价值转账或使用预先 `--force`。

11 笔实际回执均 `effectiveGasPrice=0`，外层 `gasUsed × effectiveGasPrice` 合计 **0 OKB**；成功 `UserOperationEvent.actualGasCost` 合计也为 **0 OKB**。这两项分别核账，不相加成重复费用。历史累计实付 **0.01052 OKB** 未变；不承诺未来交易必然免费。

每次提交前保存发送意图；收到哈希立即记录。成功回执核验后才推进下一版本，未知结果不自动重发。汇总复核曾遇公共 RPC HTTP 429，仅重试只读请求，未重新提交任何交易。

## 不连接钱包也能现场查看

打开[主网 Demo](https://0xcaptain888.github.io/TapeWeave/research/tapeweave/demo/chain.html)，先查看历史交易及两局结果，点击“读取蓄能卡会话”或“读取交替卡会话”：

1. 从公共 RPC 校验链 196，读取固定区块。
2. 对默认宿主逐字节比较公开的完整 runtime，含三个 immutable。
3. 读取会话并与公开记录的最终状态比较。
4. 再读取同一区块哈希，若变化则拒绝结果。

页面实时查询不重新验证全部历史回执；自填其他候选地址只显示未认证读取。只读区无需连接钱包。随后新增的顶部钱包区支持普通EOA逐笔模拟／确认／发送，以及本机会话历史、备份和分段发现；它与本文11笔真实AA运行记录分开，详见[钱包使用说明](../research/tapeweave/demo/WALLET-PLAY.md)。主作品页已增加主网入口，开发者调用草案默认折叠。

## 从源码与公共 RPC 重新复核

Node 24；先按[部署指南](tapeweave-createx-deployment-2026-10-26.md)在仓库外安装固定编译依赖。选择尚不存在的仓库外输出路径：

```sh
export TAPEWEAVE_SOLIDITY_TOOLS=/absolute/external/tools/node_modules
export TAPEWEAVE_RPC_URL=https://rpc.xlayer.tech
node contracts/verify-public-run.mjs research/tapeweave/demo/mainnet-evidence.json /absolute/external/new-public-run-proof.json
```

该命令从当前源码重建编译与 CreateX 预测，不能靠修改 JSON 的成功字段通过；从 RPC 重取部署和十笔交互、重算全部状态，并独立重查每笔实际费用。RPC 限流只重试读取。可设置另一来源的 `TAPEWEAVE_SECONDARY_RPC_URL`；任一端失败或不同即停止，不静默降级。

## 验收范围与剩余事项

本轮合约回归包括准备、initcode、32 局128拍与回滚、24 组 CreateX／部署后操作测试；其中本地处理器是 fixture。真实主网运行另有上面的 11 笔公开记录。

macOS Chrome 启动异常；备用 Chromium headless 也遭 MachPort 系统权限拒绝，未得到本机浏览器通过结果。改用 GitHub Actions Linux Chrome，**31 组 Node／Chrome 与两次 Python 发布保护全部通过**：[运行 40277443814](https://github.com/0xCaptain888/TapeWeave/actions/runs/40277443814)，代码快照 `6638845e4d710d774dc8c81946331eece32c2c39`。生产页面／模块配明确的替身 RPC，覆盖证据载入、两会话选择、runtime 不符拒绝、重组拒绝、无效草案、读取失败与过期异步响应；不将替身测试称为真实钱包端到端验收。

[Pages 运行 40277441779](https://github.com/0xCaptain888/TapeWeave/actions/runs/40277441779)成功。已从公开 HTTPS 获取 README、chain.html、chain-page.mjs、mainnet-evidence.json 与 work.html，全部 HTTP 200 且逐字等于发布源文件。公共 RPC 实测允许浏览器跨域（`Access-Control-Allow-Origin: *`）；不据此保证未来可用性。

另执行[真实公网 Chrome 运行 40278163174](https://github.com/0xCaptain888/TapeWeave/actions/runs/40278163174)，代码 `b3a120bcb347dbb114d2b3e08302a26f6d7550ea`：直接打开线上作品入口和主网页，确认 11 个交易链接，点击两卡按钮访问真实公共 RPC。两会话均代码匹配、版本 4、最终状态匹配，结果 `LIVE_PUBLIC_DEMO_BROWSER_PASSED`。没有替换 fetch、没有钱包或新交易；记录所观察的 RPC 均为读取。可用手动工作流 `Live public demo smoke` 或 `TAPEWEAVE_LIVE_SMOKE=1 CHROME=/path/to/chrome node research/tapeweave/demo/test-live-chain-browser.mjs` 重跑。

CI 中间运行 `40277880818` 曾在持久化测试新建会话后超时，后续运行 `40278052065` 通过。检查发现刷新测试仅等待“版本4”的摘要，可能从尚未销毁的旧文档读到它，随后操作撞上真正刷新。现已让四处刷新先等待 `performance.timeOrigin` 改变再检查恢复内容；这是测试导航同步修正，不宣称修复了用户历史反馈中所有刷新问题。

链上核验当前只有 `https://rpc.xlayer.tech` 一个来源。没有双提供商一致结论，也没有完整 UOP 独立模拟、重新验签、Android 真机、独立团队采用、安全审计、视频成片或投稿完成声明。两场景仍在作者同一宿主里，不能称两家独立应用采用。
