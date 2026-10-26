# TapeWeave 最小链上双宿主（已部署 X Layer 主网）

执行日期：2026-10-18。源码：`TapeWeaveHost.sol`；可重跑作者测试：`test-host.mjs`。

## 2026-10-26：CreateX／AA 适配已加入

确定性部署包、固定区块预检、回执／代码／配置及 EntryPoint／UOP 绑定已实际使用。通过官方钱包完成 `AA → CreateX → CREATE2`，宿主 `0x440c3CC7DdD50566126754199Df7336499eE1E20`；两卡开局和四拍动作均完成，合计 11 笔交易，完整重放与实际费用核验通过。费用合计 0 OKB；单 RPC，不重验签名，没有独立完整 UOP 模拟报告。见[真实主网记录](../docs/tapeweave-mainnet-run-2026-10-26.md)和[部署适配指南](../docs/tapeweave-createx-deployment-2026-10-26.md)。

继续补齐了 `host-actions.mjs`／`host-cli.mjs`：部署后源码／会话读取、显式版本动作准备、单笔回执恢复，以及两卡四拍的完整重放核验。使用方法和真实记录格式见[部署后操作指南](../docs/tapeweave-host-run-2026-10-26.md)。`check.mjs` 统一运行全部四份离线合约脚本；需先配置仓库外依赖及固定 CreateX 参考，任意失败即停止。工具没有钱包进程或广播接口。

## 已实现

- 每局绑定调用者，只接受两枚已审查电路ID1／2；两个世界独立保存latch、score、resource。
- 四拍固定补能；训练累加请求，门仅第二／四拍可消耗钥匙，初始两把。
- expectedVersion拒绝重复和过期提交，不采用客户端自报成绩。重复交易会revert，而非返回旧回执。
- 两宿主求值全部通过后在同一交易更新；处理器不可用、返回畸形或不符合已审查转换时整笔失败。
- 每次开局／动作核netlist哈希，step限定3,000,000 gas并在复制前限制返回大小，不能任意加载REF或其他电路。
- 无管理员、升级、支付、奖品、Token或NFT转移；不要求持有电路NFT。宿主身份为msg.sender，AA使用时是账户合约，而非外层打包者。

此版本**有意只接受已审查的两张卡**，并核对应真值表，不能宣称任意创作网表可自由进入链上游戏。普通共享公式仍是完全可实现的强替代。本地测试用 Mock；另有真实主网宿主消费记录，两者分开保存。

## 重跑

依赖安装在仓库外，避免把临时编译工具或钱包数据发布：

```sh
npm install --prefix /absolute/external/tools --no-audit --no-fund solc@0.8.30 ethers@6.15.0 ganache@7.9.2
TAPEWEAVE_SOLIDITY_TOOLS=/absolute/external/tools/node_modules node contracts/test-host.mjs
```

编译设置：Solidity0.8.30，optimizer enabled／runs200，evmVersion shanghai。可设置`TAPEWEAVE_BUILD_OUTPUT`为一个尚不存在的仓库外文件，保存编译输入配置、源码、ABI、创建及运行时字节。不可将Ganache确定性测试账户用于真实网络或充值。

2026-10-18作者执行通过：两卡0011预期训练2／1、门1／0；身份拒绝、旧nonce、第五拍拒绝、不同玩家会话隔离；五种处理器故障实际本地挖出失败交易且状态不变（网表变化、revert、非法位、错误合法位、大返回）。最初Mock字节类型及ethers Result比较断言有错误，已修复后完整重跑；Ganache原生µWS不兼容Node24，使用其JS回退。测试不是审计、独立开发者验证或X Layer交易。

## 本轮补齐（2026-10-18）

本地EVM新增两卡×16序列的32局128拍，与普通公式逐拍核对；完整重跑通过。后续[前端主网页](../research/tapeweave/demo/chain.html)已更新默认部署、历史回执、实时只读会话与折叠的调用草案，无网页签名或发送功能。旧[部署核验时间线](../docs/tapeweave-deployment-gate-2026-10-18.md)与[非部署审核包](../docs/tapeweave-review-package-2026-10-18.md)保留历史，当前真实状态以本页及主网记录为准。

## 离线部署准备工具（按用户确认的能力前提继续开发）

早期先以“TEE／AA支持X Layer部署”为开发前提构建离线工具，2026-10-26 已用 CreateX 完成真实验证。`prepare-deployment.mjs`本身仍只编译、不连接provider／钱包、不导出私钥；生成构造参数、完整initcode、散列、ABI、编译输入及immutable位置。参数来自已保存两枚制品，先核SHA-256，再计算构造函数所需Keccak-256，不能混用两类散列。

```sh
TAPEWEAVE_SOLIDITY_TOOLS=/absolute/external/tools/node_modules node contracts/test-deployment-preparation.mjs
TAPEWEAVE_SOLIDITY_TOOLS=/absolute/external/tools/node_modules node contracts/prepare-deployment.mjs /absolute/external/new-preparation.json
```

输出用`wx`拒绝覆盖已有文件，不含密钥；请存仓库外。基础编译包固定`account_address=null`、`ready_to_send=false`、`simulated=false`、`broadcast=false`、`wallet_creation_adapter=null`；它不选择账户，工厂适配由单独的`prepare-createx.mjs`提供。运行时字节模板含未填immutable，不作为部署身份；新增`expected_runtime`按编译器声明位置填三个immutable供精确核对。编译输入路径与早期Mock测试不同，元数据字节可能不同；真正部署审核应以此完整输入重新跑EVM，不凭测试模板字节相似放行。

作者本轮测试通过：两次生成确定一致，ABI构造参数顺序／两卡哈希正确，initcode拼接正确且保留所有未模拟／未发送标记。仅本地编译测试，不是官方钱包接入或真实部署。

### 完整准备包的本地EVM接入验证

```sh
TAPEWEAVE_SOLIDITY_TOOLS=/absolute/external/tools/node_modules node contracts/test-prepared-initcode.mjs
```

本轮已运行通过：直接部署`prepareDeployment`生成的完整initcode；核processor及两卡immutable getter；仅遮蔽编译器声明的immutable位置后，对比全部运行时代码；两卡0011双宿主得分／资源一致。此测试不重新拼接另一份宿主测试字节码，补上此前实际准备包尚未跑EVM的缺口。

**限制**：仅Ganache本地EVM，用`evm_setAccountCode`在本地处理器地址注入Mock（返回已保存网表，转换用普通公式）；不是实际TapeOut解释器、X Layer fork、TEE／AA账户模拟或主网部署。Mock注入不是可用于真实部署的方案。原准备包的`simulated=false`不被改写，因为官方账户模拟仍未完成；原32局／回滚测试为另一组测试，本轮新增仅两卡0011及代码配置核对。µWS仍回退JS。未连接任何钱包或实时RPC。

## 还不能称完成

1. 真实部署与交互已完成 RPC／网关模拟、官方风险扫描及费用审核，但没有单独获取完整 UOP 的独立签名前模拟报告；不能用成功交易替代这份报告。`wallet contract-call`首次调用也可能签名广播，不能当只读预检。
2. 网页提供历史证据与实时读取，无网页钱包发送；主网运行由官方 CLI 钱包执行。累计历史实付0.01052 OKB本轮未变，0.05暂停复核线继续有效。
3. 上游处理器仍可升级、暂停或不可用；真值表守卫能拒绝本子集语义变化，但不能保证可用性，不构成权限审计。两端RPC绑定仍未通过。
4. 玩家可无限开新局，成绩非排行榜资格或真人证明；无奖品、反女巫、链下签名授权、会话删除。不要基于本实验发放价值资产。
5. 开放更多创作卡、持久客户端、真机、独立体验、视频和最终投稿仍未完成。不提高历史70分。

资料：接口及本项目单端证据见[真实求值报告](../docs/tapeweave-manufactured-validation-2026-10-18.md)；官方协议 https://tapeout.net/TapeOut-Protocol.pdf ，官方入口 https://tapeout.net/ 。本轮接口依据仓库保存的真实请求／响应，未将未核源码写成官方安全保证。
