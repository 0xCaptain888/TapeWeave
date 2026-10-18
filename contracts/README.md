# TapeWeave 最小链上双宿主（未部署）

执行日期：2026-10-18。源码：`TapeWeaveHost.sol`；可重跑作者测试：`test-host.mjs`。

## 已实现

- 每局绑定调用者，只接受两枚已审查电路ID1／2；两个世界独立保存latch、score、resource。
- 四拍固定补能；训练累加请求，门仅第二／四拍可消耗钥匙，初始两把。
- expectedVersion拒绝重复和过期提交，不采用客户端自报成绩。重复交易会revert，而非返回旧回执。
- 两宿主求值全部通过后在同一交易更新；处理器不可用、返回畸形或不符合已审查转换时整笔失败。
- 每次开局／动作核netlist哈希，step限定3,000,000 gas并在复制前限制返回大小，不能任意加载REF或其他电路。
- 无管理员、升级、支付、奖品、Token或NFT转移；不要求持有电路NFT。宿主身份为msg.sender，AA使用时是账户合约，而非外层打包者。

此版本**有意只接受已审查的两张卡**，并核对应真值表，不能宣称任意创作网表可自由进入链上游戏。普通共享公式仍是完全可实现的强替代。代码调用真实处理器接口，但当前测试使用本地Mock，尚无主网宿主消费。

## 重跑

依赖安装在仓库外，避免把临时编译工具或钱包数据发布：

```sh
npm install --prefix /absolute/external/tools --no-audit --no-fund solc@0.8.30 ethers@6.15.0 ganache@7.9.2
TAPEWEAVE_SOLIDITY_TOOLS=/absolute/external/tools/node_modules node contracts/test-host.mjs
```

编译设置：Solidity0.8.30，optimizer enabled／runs200，evmVersion shanghai。可设置`TAPEWEAVE_BUILD_OUTPUT`为一个尚不存在的仓库外文件，保存编译输入配置、源码、ABI、创建及运行时字节。不可将Ganache确定性测试账户用于真实网络或充值。

2026-10-18作者执行通过：两卡0011预期训练2／1、门1／0；身份拒绝、旧nonce、第五拍拒绝、不同玩家会话隔离；五种处理器故障实际本地挖出失败交易且状态不变（网表变化、revert、非法位、错误合法位、大返回）。最初Mock字节类型及ethers Result比较断言有错误，已修复后完整重跑；Ganache原生µWS不兼容Node24，使用其JS回退。测试不是审计、独立开发者验证或X Layer交易。

## 本轮补齐（2026-10-18）

本地EVM新增两卡×16序列的32局128拍，与普通公式逐拍核对；完整重跑通过。新[前端接入准备页](../research/tapeweave/demo/chain.html)提供只读会话与未发送调用草案，无默认部署地址、无钱包或发送功能；不是完整上链交互。[部署核验与最短用户验收](../docs/tapeweave-deployment-gate-2026-10-18.md)已取得官网部署正文，但其私钥测试网方式不覆盖当前账户；[非部署审核包](../docs/tapeweave-review-package-2026-10-18.md)汇总本轮EVM复跑、只读证据、部署准备和未发送的官方支持询问模板。

## 还不能称完成

1. 当前钱包CLI `wallet contract-call --help`要求EVM必须提供to，没有公开合约创建参数；不能把创建字节码发给随意地址、零地址或未核验CREATE2工厂，亦不读取私钥绕过钱包。用户已明确停止真实部署；外部阻塞为“缺少官方 Account 2 CREATE 路径”。不因一般已验证工厂而自行解除限制，需官方账户创建／模拟依据及后续重新审核。
2. 尚未部署，因此没有宿主地址、主网动作回执、部署实付费用或网页钱包接入。累计历史实付0.01052 OKB本轮未变，0.05暂停复核线继续有效。
3. 上游处理器仍可升级、暂停或不可用；真值表守卫能拒绝本子集语义变化，但不能保证可用性，不构成权限审计。两端RPC绑定仍未通过。
4. 玩家可无限开新局，成绩非排行榜资格或真人证明；无奖品、反女巫、链下签名授权、会话删除。不要基于本实验发放价值资产。
5. 开放更多创作卡、持久客户端、真机、独立体验、视频和最终投稿仍未完成。不提高历史70分。

资料：接口及本项目单端证据见[真实求值报告](../docs/tapeweave-manufactured-validation-2026-10-18.md)；官方协议 https://tapeout.net/TapeOut-Protocol.pdf ，官方入口 https://tapeout.net/ 。本轮接口依据仓库保存的真实请求／响应，未将未核源码写成官方安全保证。
