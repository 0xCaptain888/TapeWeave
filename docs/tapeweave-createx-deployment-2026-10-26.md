# CreateX／AA 部署适配与只读核验

更新日期：2026-10-26。源码以本仓库为准，外部依赖固定到下文版本。

现有 OnchainOS 合约调用已经实际完成 `AA → CreateX → CREATE2`：真实 TapeWeaveHost 部署及两卡四拍共 11 笔交易通过回执、UOP、代码与状态核验。执行了 AA 地址 RPC 模拟、官方风险扫描、网关模拟和费用审核；钱包负责 UOP 构造和签名，没有另外取得完整 UOP 的独立签名前模拟报告。新增实付 0 OKB。[完整主网记录](tapeweave-mainnet-run-2026-10-26.md)。

## 工具与信任范围

| 工具 | 作用 | 不代表 |
|---|---|---|
| `contracts/prepare-createx.mjs` | 从本地源码编译，按显式 AA 地址与部署编号生成 initcode、salt、地址和内部 calldata | 当前钱包已选中该地址、已经授权发送 |
| `contracts/check-createx.mjs preflight` | 固定区块核工厂代码、处理器与两卡网表，模拟实际工厂执行和计算地址 | 钱包签名、EntryPoint／bundler 校验、费用或赞助确认 |
| `contracts/check-createx.mjs verify` | 核成功回执、确认深度、规范区块、工厂事件、完整 runtime 与三个配置 getter | 当前可用性、最终性、真实游戏动作完成 |
| 可选 UOP 核验 | 用明确指定的可信 EntryPoint 和 UserOperation hash，绑定成功账户与工厂事件所在日志区间 | 重新验证签名或自动认证 EntryPoint 身份 |

同一输出文件不覆盖，部署包和回执输出仅允许放在仓库／静态站点之外，包括拒绝经符号链接写回站点。工具没有广播接口；RPC 方法只允许读取和 `eth_call`。预检不替用户解锁钱包。

## 固定依据

- CreateX：提交 `6b78530a870846920834eb4b6cd369be01be9ed0`，[源代码](https://github.com/pcaversaccio/createx/blob/6b78530a870846920834eb4b6cd369be01be9ed0/src/CreateX.sol)、[部署列表](https://createx.rocks/deployments)。
- X Layer 工厂：`0xba5Ed099633D3B313e4D5F7bdc1305d3c28ba5Ed`。
- 工厂 runtime Keccak-256：`0xbd8a7ea8cfca7b4e5f5041d7d4b17bc317c5ce42cfbc42066a00cf26b43eb53f`。
- 下载器使用上述提交的官方 artifact 和 build-info，仅在编译器声明的 `_SELF` immutable 位置填入工厂地址，再核整个 runtime 散列；不任意忽略差异。
- OnchainOS：已研究的官方提交 `73856f4ac90b2d9c59f44d35d2f7ee79ef298a4c`，[钱包命令参考](https://github.com/okx/onchainos-skills/blob/73856f4ac90b2d9c59f44d35d2f7ee79ef298a4c/skills/okx-agentic-wallet/references/wallet-cli-reference.md)。

这条路径不使用私钥导出，也不要求钱包暴露直接 CREATE。`execution.calldata` 是给工厂的**内部调用**，完整 `UserOperation.callData` 由钱包后端封装。

## 生成准备包

在仓库根目录运行。以下外部目录必须事先存在；依赖和输出不得放入站点：

```sh
npm install --prefix /absolute/external/tools --ignore-scripts --no-audit --no-fund solc@0.8.30 ethers@6.15.0 ganache@7.9.2
export TAPEWEAVE_SOLIDITY_TOOLS=/absolute/external/tools/node_modules
node contracts/prepare-createx.mjs AA_ADDRESS 1 /absolute/external/new-createx-bundle.json
```

将 `AA_ADDRESS` 替换为之后实际执行调用的 AA 地址，不是 EOA 签名者或 bundler 地址。工具不默认选取历史钱包。部署编号为 `1..2^88-1` 的十进制整数，生成后不要手改 JSON；验证工具会从当前源码重建整个准备包，任何字段变化均拒绝。

规则如下：

- 原始 salt：AA 地址 20 字节 + `00` 一字节 + 部署编号 11 字节。
- CreateX 实际使用的 guarded salt：`keccak256(abi.encode(AA地址, 原始salt))`。
- 预测地址用 guarded salt 计算，不能直接用原始 salt。
- initcode 为 creation bytecode 加构造参数；本合约参数是 `processor, pulseHash, alternatingHash`，**没有 `owner()`**。
- `expected_runtime` 仅填编译器声明的三个 immutable 位置，用于部署后逐字节核对。未填的 `runtime_template` 不是代码身份。
- 已占用预测地址时拒绝再次预检，应先核验原有回执，不能用换编号自动重发掩盖未知交易状态。

## 公共 RPC 只读预检

```sh
export TAPEWEAVE_RPC_URL=https://rpc.xlayer.tech
node contracts/check-createx.mjs preflight /absolute/external/new-createx-bundle.json /absolute/external/new-preflight.json
```

可配置 `TAPEWEAVE_SECONDARY_RPC_URL` 为另一个独立来源。两个来源必须是不同 origin，在共同区块核对区块哈希与处理器代码；任意端失败或不一致则整次失败，**不会静默降级为单端成功**。不同域名本身也不能证明基础设施独立，需使用者确认。

RPC URL 接受 HTTPS，本地测试可用 HTTP 回环地址；报告只保留 origin，不打印 URL 中的路径或查询凭据。双端还需账户代码一致。成功固定保留 `wallet_simulated=false`、`ready_to_send=false`、`broadcast=false`。这不是发送许可，结果只对应所记区块。

## 真实发送之前

本次用户明确要求真实主网部署与交互，已解除此前暂停；历史累计实付 `0.01052 OKB`，`0.05 OKB` 预算复核线不变。任何后续新部署仍需要：

1. 确认钱包当前选中账户及 X Layer 地址，与准备包 AA 地址一致。
2. 重跑只读预检，审查官方交易扫描、后端模拟、费用与赞助结果。
3. 操作处于用户明确授权范围，未知结果先查回执，不自动重发。

**`onchainos wallet contract-call` 会进入签名和自动广播流程；不带 `--force` 的首次调用也不是 dry-run。** 仓库内准备／核验工具仅生成 `wallet_arguments`，不启动钱包。本次真实执行在仓库外进行，每步审核、提交、保存实际哈希并核验后推进，未添加 `--force`。若 CLI 返回 confirming，须展示提示后按对应确认流程继续。

## 核验已有部署

先取得实际链上交易哈希；UserOperation hash 与交易哈希不同：

```sh
node contracts/check-createx.mjs verify /absolute/external/new-createx-bundle.json /absolute/external/new-deployment-proof.json TX_HASH
```

默认为至少两个区块确认。还可以同时提供 UOP hash 和经过独立确认的钱包 EntryPoint：

```sh
node contracts/check-createx.mjs verify /absolute/external/new-createx-bundle.json /absolute/external/new-uop-proof.json TX_HASH UOP_HASH TRUSTED_ENTRYPOINT
```

仅供一个可选参数会拒绝。匹配成功的 UOP 必须对应准备包 AA 地址，工厂创建事件必须位于该 UOP 的执行日志区间，不能误认同一 bundle 中另一个 UOP 的创建事件。仅普通部署核验成功时，`user_operation.verified=false`；即便提供 UOP 并通过，也保留 `signature_revalidated=false`。

部署后下一阶段才是用真实账户分别执行两张卡的 `open` 和四次 `act`，核 `Opened／Acted`、玩家身份、版本与双场景状态。部署验证器保持 `mainnet_host_actions_verified=false`，没有把本地模拟写成主网游戏证明。后续已新增[动作准备与完整运行核验工具](tapeweave-host-run-2026-10-26.md)，真实结果需用实际交易清单重新核验，不能靠部署成功标记推定。

## 离线测试

先下载固定版本参考，之后整套测试不访问公共 RPC、不登录钱包：

```sh
node contracts/fetch-createx-reference.mjs /absolute/external/new-createx-reference.json
export TAPEWEAVE_CREATEX_REFERENCE=/absolute/external/new-createx-reference.json
node contracts/test-createx.mjs
node contracts/test-deployment-preparation.mjs
node contracts/test-prepared-initcode.mjs
node contracts/test-host.mjs
```

CreateX 测试使用官方 runtime；本地 AA 包装器、EntryPoint 和处理器是明确标记的 fixture。两个测试 RPC 共享同一 Ganache 链，只用于检查分歧拒绝，不是两个真实独立提供商。测试不验证 ERC-4337 签名、真实 TapeOut 解释器或主网执行。本轮结果与真实 RPC 预检见后续执行记录。

## 本轮执行记录

2026-10-26 作者执行：

- 新增 **14 组 CreateX 测试通过**：包括实际工厂字节码部署、两卡四拍的 AA 调用身份、完整 runtime／getter、错误链／工厂／网表拒绝、RPC 分歧和重组、失败回执、UOP 失败／错误发送者／跨 UOP 日志误认拒绝、只读传输及外部输出保护。
- 原有三组合约脚本通过：确定性编译准备、完整准备 initcode 本地部署、32 局穷举与五种实际本地挖出的原子回滚。Ganache 及 bigint 原生绑定不可用，测试使用 JS 回退。
- Node 24.22.0 运行 `node research/tapeweave/demo/check.mjs`：**22 组 Node 测试 + 2 次 Python 发布保护通过**。本轮未运行 Chrome、Android 真机或独立开发者验收。
- 公网工具预检返回 `RPC_SIMULATION_PASSED`，端点 `https://rpc.xlayer.tech`，链 196，固定区块 `0x46c84e2`，区块哈希 `0x484a0ada5a8eb0a36a464a6236d3413f7e767390f16c1b2d19019e7eca62202f`。
- 实际 TapeWeaveHost initcode Keccak-256：`0x9ffe4fc56d84c487083a5464ba1fcc154c62105764b12821b4a88294b1033207`；预期配置填入后的 runtime Keccak-256：`0xd9b8a0f70b59f0d8d03e7c6aec4b616e57810fb1412bb8d7f693bb1b37adf26e`。
- 使用历史准备记录中的 AA 地址与编号 1 做只读模拟，未认证它是当前钱包选中账户。工厂代码匹配固定散列、处理器有代码、两卡当前网表匹配、预测地址尚空；工厂执行返回地址、本地预测与工厂地址计算一致。
- 配置第二端点 `https://xlayerrpc.okx.com` 的尝试返回 `BLOCKED: fetch failed`，没有输出双端成功报告。单端报告明确保留 `provider_agreement=false`。

以上为早期只读预检记录，不自动延续为后续发送许可。随后在用户明确授权下完成真实部署及动作，见[主网记录](tapeweave-mainnet-run-2026-10-26.md)。完整准备包、扫描／模拟中间结果及钱包业务结果保留仓库外；公开站点仅发布选定的代码身份、交易清单、UOP／状态证明与费用，不含钱包会话、凭据或发送脚本。
