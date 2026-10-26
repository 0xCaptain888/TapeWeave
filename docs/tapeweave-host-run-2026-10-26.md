# 部署后操作、恢复与两卡运行核验

更新：2026-10-26。部署后操作工具已用于真实主网：两张卡各一笔开局、四笔动作，加部署共 11 笔真实交易，完整重算／状态／成功 UOP 核验通过。每步先模拟和审核，新增实际费用为 0 OKB。[真实运行记录](tapeweave-mainnet-run-2026-10-26.md)。

已实现 `contracts/host-actions.mjs` 和 `contracts/host-cli.mjs`。各命令仅通过 RPC 读取或 `eth_call`，生成新的仓库外 JSON；不启动钱包进程、不访问凭据、不签名或广播。不确定前次发送是否成功时，可以先核回执，避免重复开局或把旧动作变成新动作。

## 前提

沿用[CreateX 部署指南](tapeweave-createx-deployment-2026-10-26.md)生成的原始部署包和依赖。真实使用前须完成部署与回执验证；本工具不接受随意输入的宿主地址，目标必须等于部署包的预测地址，运行时代码和配置必须与当前源码重新编译结果完全一致。

```sh
export TAPEWEAVE_SOLIDITY_TOOLS=/absolute/external/tools/node_modules
export TAPEWEAVE_RPC_URL=https://rpc.xlayer.tech
# 可另设 TAPEWEAVE_SECONDARY_RPC_URL；任一端失败则停止，不静默降级。
```

下文的 `BUNDLE`、`SESSION`、`TX_HASH` 等占位符必须替换为真实路径或读取所得值。输出为绝对路径、尚不存在、且在仓库与静态服务目录之外。工具不会自动将结果上传站点。

## 查看与准备下一步

读取固定区块的完整宿主代码、三个 immutable getter、处理器代码和已审查网表，以及账户代码与会话数：

```sh
node contracts/host-cli.mjs inspect BUNDLE /absolute/external/new-host-snapshot.json
```

提供会话 ID 时，再检查该会话确实存在且玩家是部署包中的 AA 地址：

```sh
node contracts/host-cli.mjs inspect BUNDLE /absolute/external/new-session-snapshot.json SESSION
```

准备 ID1 开局调用（ID2 将末尾的 `1` 改为 `2`）：

```sh
node contracts/host-cli.mjs open BUNDLE /absolute/external/new-open-plan.json 1
```

开局的 `eth_call` 不持久保存新局，不预留会话 ID。**实际会话 ID 必须从真实成功开局回执获取**，不能假定等于模拟时的会话数加一。

准备指定会话的第一个等待动作：

```sh
node contracts/host-cli.mjs act BUNDLE /absolute/external/new-action-plan.json 1 SESSION 0 0
```

最后四个参数依次是：卡 ID、会话 ID、明确的 expectedVersion、触发位（`0` 等待，`1` 触发）。标准 `0011` 路径为：

| 步骤 | expectedVersion | 触发位 |
|---|---:|---:|
| 第一次动作 | 0 | 0 |
| 第二次动作 | 1 | 0 |
| 第三次动作 | 2 | 1 |
| 第四次动作 | 3 | 1 |

每次必须重新读取状态、核对卡 ID 与传入的 expectedVersion 后才生成调用。版本不匹配、其他玩家、会话不存在或已完成即拒绝；不自动改版本、不自动开新局。RPC 模拟成功仍是 `wallet_simulated=false`、`ready_to_send=false`、`broadcast=false`。

准备包内的 `wallet_arguments` 仅供审阅。用户此次已明确授权真实部署和交互；后续新操作仍须处于授权与预算内，执行费用审核和安全检查。`wallet contract-call` 可能首次调用就签名广播，不能用它试探或假装只读模拟。

## 从单笔回执恢复

取得真实链上交易哈希后：

```sh
node contracts/host-cli.mjs receipt BUNDLE /absolute/external/new-host-receipt.json TX_HASH
```

或者同时提供 UOP hash 和独立确认的可信 EntryPoint：

```sh
node contracts/host-cli.mjs receipt BUNDLE /absolute/external/new-host-uop-receipt.json TX_HASH UOP_HASH TRUSTED_ENTRYPOINT
```

工具验证成功状态、确认深度、规范区块、交易与日志绑定、实际宿主代码和配置。专用单步交易必须恰好有一条宿主 `Opened` 或 `Acted` 事件；多个步骤合并到一笔交易时拒绝，不能含糊选择一个结果。

输出包含实际 `session_id`、事件版本、卡 ID 及区块结束时的会话状态。开局回执可以在刷新或本地记录丢失后恢复实际会话 ID。动作回执用于确认该次动作已经发生，再读取当前会话版本；**不能盲目重发旧动作**。

`HOST_EVENT_VERIFIED` 只代表单步事件和状态核验。若同一会话在同一区块还有后续动作，区块结束状态可以高于该事件版本；工具不把它伪装成事件发生瞬间的状态。单步结果固定 `full_run_verified=false`，不代表整局重放已通过。

失败、查无回执、确认不足、RPC 不可用或重组都返回 `BLOCKED`，没有成功证明文件。`BLOCKED` 不证明交易永远没发生，也不授权再次发送。

## 完整两卡记录

每张卡使用一个实际会话：一笔开局和四笔独立动作；加上部署共 11 笔不同交易。将真实结果整理成下面的 JSON 格式；这里的说明占位文字不是可通过的哈希：

```json
{
  "format": "tapeweave-host-run-v1",
  "deployment": {
    "transaction_hash": "实际部署交易哈希"
  },
  "sessions": [
    {
      "circuit": 1,
      "session_id": "实际ID1会话编号",
      "open": {"transaction_hash": "实际ID1开局交易哈希"},
      "actions": [
        {"transaction_hash": "实际ID1动作1交易哈希", "trigger": false},
        {"transaction_hash": "实际ID1动作2交易哈希", "trigger": false},
        {"transaction_hash": "实际ID1动作3交易哈希", "trigger": true},
        {"transaction_hash": "实际ID1动作4交易哈希", "trigger": true}
      ]
    },
    {
      "circuit": 2,
      "session_id": "实际ID2会话编号",
      "open": {"transaction_hash": "实际ID2开局交易哈希"},
      "actions": [
        {"transaction_hash": "实际ID2动作1交易哈希", "trigger": false},
        {"transaction_hash": "实际ID2动作2交易哈希", "trigger": false},
        {"transaction_hash": "实际ID2动作3交易哈希", "trigger": true},
        {"transaction_hash": "实际ID2动作4交易哈希", "trigger": true}
      ]
    }
  ]
}
```

每条交易记录还可同时增加 `user_operation_hash` 与 `entry_point`。可选 UOP 信息必须成对提供；验证器会核成功 sender 与该事件所在的 UOP 日志区间。仅在全部 11 笔都核验 UOP 时，`all_user_operations_verified` 才为 `true`；始终不声称重新验证签名。

执行：

```sh
node contracts/host-cli.mjs verify-run BUNDLE /absolute/external/new-run-proof.json /absolute/external/actual-run-manifest.json
```

验证器从公共 RPC 重新取得部署及动作证据，不信任手填的“已成功”字段：

1. 重新核部署交易、CreateX 事件、完整代码及构造配置。
2. 每局核开局玩家、卡 ID 和会话 ID；开局必须发生在部署之后。
3. 核四拍版本、触发位、两个场景的请求及开门效果，逐拍重算状态。
4. 检查规范链中的先后顺序；同一区块按全局日志位置排序。
5. 在最后一拍所在区块读取真实会话，完整比较训练和门的 latch、score、resource。
6. 收尾再次核所有引用区块，拒绝核验过程中发生的重组。

标准 `0011` 的 ID1 结果为训练 2、开门 1、余钥匙 1；ID2 为训练 1、开门 0、余钥匙 2。工具也接受其他明确的四拍布尔序列，但依旧按合约公式重新计算。两个场景属于同一实验宿主，不是两个独立项目采用。

成功返回 `BOTH_CARD_RUNS_VERIFIED`，仅证明指定 RPC 所观察到的部署、事件与历史状态。不同 origin 不证明服务独立；需要自行选择独立提供商。证明文件本身不是签名凭据，不能仅凭上传 JSON 就信任，接收方应重跑核验。

## 测试与剩余事项

```sh
export TAPEWEAVE_CREATEX_REFERENCE=/absolute/external/new-createx-reference.json
node contracts/check.mjs
```

统一入口依次运行四份离线脚本，任意失败停止。CreateX 与部署后操作共 24 组测试，使用官方工厂 runtime、Ganache 本地 AA／EntryPoint 包装器及处理器 fixture，不验证真实钱包签名或真实 TapeOut 解释器。

本轮执行结果：

- 四份合约脚本全部通过；随后新增 CLI 文件工作流测试，最终 CreateX／部署后操作 24 组通过。CLI 测试走实际入口、RPC 传输封装及外部文件输出，底层读取仍是明确标记的本地 Ganache 替身；没有真实钱包或公网交易。
- `node research/tapeweave/demo/check.mjs` 在 Node 24.22.0 下通过 22 组 Node 测试与两次 Python 发布保护。
- 链上页面的 Chrome 测试首次因本地监听受限未运行；允许回环网络后 Chrome 启动即 `SIGABRT` 退出，没有页面验收结果。本轮不记为浏览器通过，不推定页面故障根因。
- 新文件语法、已跟踪与新增文件空白检查通过。后续本轮用户要求同步 GitHub 与公开 Demo，发布完成状态以仓库最新提交、Actions 和线上实际文件为准。

后续真实主网运行已完成，证据与模拟／费用范围见[真实记录](tapeweave-mainnet-run-2026-10-26.md)。macOS 备用 Chromium 同样因系统 MachPort 权限拒绝启动，改用 Linux Actions；[31 组 Node／Chrome + 两次 Python 全部通过](https://github.com/0xCaptain888/TapeWeave/actions/runs/40277443814)，覆盖真实页面的历史快照、两会话读取、代码不符、重组、错误及异步过期保护。RPC 为替身，不能替代真实链上证明。Pages 已成功部署并比对线上文件。Android 真机、独立开发者、完整 UOP 独立模拟、双 RPC、视频及投稿仍须分别完成。
