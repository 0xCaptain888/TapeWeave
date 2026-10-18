# TapeWeave 开发收口与未完成执行项

更新：2026-10-17。本文只描述仓库工程及作者本地测试，本轮没有重新访问比赛规则、钱包或链RPC。

## 已有本地工程闭环

|环节|入口／实现|完成边界|
|创作与预览|`research/tapeweave/demo/studio.html`|有限八行行为表，不是任意网表编辑器|
|双宿主执行|工作室与`creator.mjs`|训练／钥匙门、独立状态，普通共享表同等规则|
|制品与回放|`creator-package.mjs`、`creator-replay.mjs`|摘要及计算复核，不认证身份或历史|
|持久提交|`durable-host.mjs`、`local-server.mjs`|本机SQLite事务、命令ID重试、版本冲突拒绝|
|会话发现|本地`durable.html`|50项游标列表与快照恢复，不是公网账户服务|
|归档恢复|`archive-host.mjs`|外部路径、全新目标库、逻辑日志重算；非物理灾备|
|链只读工具|`check-xlayer-binding.mjs`、`play-rpc-host.mjs`|双RPC绑定／求值适配器，真实项目绑定尚无，非链上宿主交易|
|工程交付|`prepare-delivery.mjs`|回放／绑定／RPC记录一致性与缺项汇总，始终不声称参赛就绪|
|公开源码同步|`scripts/sync-tapeweave-github.py`|固定授权仓库、默认dry-run、非强推、不删远端文件|

以上主要本地流程已有实现。继续开发不意味着无限追加账号、删除、排行榜、收费或公开后端；这些不在当前首版范围内。不用新增辅助功能替代真实集成和价值验证。

## 最新：发布保护接入统一回归入口

此前同步保护测试需手动单跑，主入口可能漏测；现已将普通Python及`-O`两次测试接入`check.mjs`，先于Node／Chrome执行。需要本机`python3`，缺失、启动失败、120秒超时或非零返回均使主入口立即失败，不能跳过后继续报告通过。设置`PYTHONDONTWRITEBYTECODE=1`，测试用替身API，不联网、不读令牌、不发布。

本轮`node research/tapeweave/demo/check.mjs --browser`完整通过：18组Node／Chrome及2次Python运行，每次8个测试方法；这是作者回归，不是新增真人、手机或链消费证据。主入口现在显示两类数量，避免误把Python运行数计成Node测试。此前各节结果保留为历史。

## 前轮修复：Python优化启动不会跳过发布保护

检查发现同步脚本原先用`assert`检查GitHub身份及发布后文件集合／blob／模式；Python以`-O`启动会删除这些断言。现改为显式条件与`ValueError`，错误身份与发布不匹配在普通及优化模式均拒绝，不因优化标志放行。测试同样改为检查明确错误。

本轮普通Python及`python3 -O`分别运行8个同步测试方法，均通过；15组Node回归通过。本轮未运行Chrome（没有改浏览器源码），不将前轮18组结果冒充本轮结果。没有写链、钱包或费用操作。此修复不使同步成为原子CAS，也不增加自动回滚保证。

```sh
PYTHONDONTWRITEBYTECODE=1 python3 -O scripts/test-sync-tapeweave-github.py
```

## 前轮补齐：发布失败保护的离线测试

新入口：

```sh
PYTHONDONTWRITEBYTECODE=1 python3 scripts/test-sync-tapeweave-github.py
node research/tapeweave/demo/check.mjs --browser
```

同步测试使用临时目录、替身Git文件清单与替身API；不读令牌、不联系GitHub、不写远端。8个测试方法覆盖：

- 默认预览无写请求；远端独有文件、错误身份和截断树拒绝。
- 分支在检查中变化则不更新ref；可能已创建未引用tree／commit，不冒充没有任何API写入。
- 发布使用`force:false`，不强推。
- 发布后快照不匹配则报错，而不是输出成功。**此时ref可能已更新，不会自动回滚。**
- 合成凭据标记、非UTF-8及不支持的文件模式拒绝。

结果：8个Python测试方法通过；本轮完整18组作者回归通过（15 Node＋3 Chrome）。这是确定场景补证，不是安全审计、GitHub并发事务或所有失败分支穷尽测试。同步前后两次读head不构成原子compare-and-swap；GitHub非强推约束仍有其服务端语义，不能承诺任意竞争下都无更新风险。网络中断后的实际远端状态需重新读取确认，不能盲目重试或宣称回滚。

## 真正未完成的项目（不能用自造数据结项）

1. **真实制造与本项目链身份**：零预算限制保持。已有非零单端费用观察，未确认可用免费路径；不签名、不广播、不充值。[费用证据](tapeweave-zero-budget-check-2026-10-17.md)。
2. **真实链上宿主消费**：已有只读求值＋本地事务工具，不等于链上状态消费；尚无本项目交易回执和真实费用／延迟。
3. **独立参与任务及实际设备**：任务表已备，尚无可确认参与者结果；作者Chrome不是真人、手机或系统剪贴板验收。[任务表](../research/tapeweave/demo/VALIDATION.md)。
4. **演示视频及投稿**：有180秒脚本，没有已完成录制和正式表单提交；需要真实素材、个人资料与最终内容确认。工程授权不制造这些资料。

因此准确状态是：**本地首版主要工程已实现并通过本轮作者回归，真实集成与参赛执行尚未完成。** 不宣称“全部开发及参赛交付完成”、不抬高历史70分、不承诺获奖，也不承诺本轮结束后后台推进。
