# TapeOut 电路赛道扩围：编译、证明、执行与真实采用

> 研究及所有下列来源访问日期：**2026-10-17，America/Los_Angeles**。响应“继续直到找到为止”，本轮从网站交付转向协议核心电路生态。只读 GitHub GET、官网 GET；没有安装或执行第三方代码、连接钱包、调用付费端点、联系维护者或写链。**发现新的具体候选与重要竞品，但尚未找到满足用户全部要求的选题。**不把检索到的项目自述当作独立客户、审计或今天的链上事实。

> **后续用户反馈后的创新主推：**[TapeWeave原生创新方案](tapeout-native-innovation-2026-10-17.md)。根据“新赛道、未来接入与创新重要”的最新要求，改为明确推荐跨应用可执行电路能力的小范围验证；不再要求先有两个客户才允许创新探索。下文TapeAction第一顺位是前轮研究历史，不是当前主推；已有竞品仍是对照基础，不是创新禁区。TapeWeave也未被写成已完成或已满足全部大奖门槛。

## 一、本轮真正改变了什么

此前研究深入了 DeWEB，但**未充分覆盖已经出现的电路应用竞争格局**。本轮 GitHub 仓库搜索 `TapeOut NAND`、`TapeOut circuit`、`TapeOut PoD`，返回总数分别18、71、0；前两项各请求第一页30条，存在芯片同名噪声，不能当作完整生态清单或需求统计。[S1]

对12个仓库尝试获取元数据、默认分支提交、README及递归树：11个成功；`novus77/CircuitGuard-Capsule` 后续读取遇404，不能据搜索摘要推断其当前实现。另对其中4个仓库读取11份关键文档／源码。**这些样本说明“电路编译”“行为等价”“神经元上链”“规则门禁”“博弈竞技”已经有具体实现或实现主张，不应再作为未经检索的独特创意。**[S2–S12]

这也纠正了研究方法：先查现有项目的完整机制与限制，再决定能否复用用户资产；不能因为用户有 agent-control-plane，就默认“Agent规则电路”是空白。

## 二、固定提交的竞争格局

以下“已有”分为已读源码结构和项目方自述，**不表示本轮运行或认证项目**。搜索结果、部署记录均不表示已报名本期、符合活动期新增要求或获得过奖。

| 项目 | 固定提交 | 已读材料与观察 | 对选题的约束 |
|---|---|---|---|
| GateX | `911207db3ce8bdab94ff7d9a5a2494cbb6b60f12` | README、verification、protocol-limitations、compiler.ts、simulator.ts；有独立AST解释与网表路径、NAND/LATCH编译源码 | “可读规则→电路→检查”不是新空白；双RPC、制品身份与证据分层也已有设计 |
| Covenant | `296d77053266b85cdeaccf7b562dc2f4a27c8d4e` | README、tapc的synth.py／prove.py／difftest.py；可见综合、等价证明、属性证明及差分路径 | 通用“Verilog编译器＋形式验证”不能主张首创；链外状态与执行封装也有竞品 |
| Cerebr | `47f5744dc2a76fabaa3fb8372b0d1dd265123ef3` | README、neuron.ts、neuro-netlist.test.ts；可见神经元编译与网表测试代码 | “神经网络编成NAND”“多种构造择优”已有竞争 |
| C3S | `0b301445966e840b21fe31955733be7d6d9f670c` | README、LIMITATIONS、FIRMWARE | 生物反射电路、穷举与时序证明已有自述；证明电路等价并不能证明生物模型真实 |
| NAND Arena | `3e4732eac4b82e3ed7749b2e431b45a2caa398cd` | README及树 | 已有NAND/LATCH机器人竞赛与逐拍VM对照自述；不是空白游戏赛道 |
| TapeOutTank | `d5d030c4ce09ed13f5e981ee2da7f6cf70588d51` | README及树 | 已有电路坦克、真人对战、回放技术演示自述 |
| CircuitDesk | `ea27e5eed1362ced23203d175d73fa68bd44cf33` | README及树 | 引导式小电路工作台、真值表、费用／签名分层已出现；README明确当时自有主网发布未完成 |
| TapeSafe | `1c03f2f32f2f908bb63ffd7254cf5c1d071a2aa9` | README及树 | 团队审批电路已有项目自述 |
| DRAWAGENT | `30c4c5876abab4e75aef02942b9989a473e9a246` | README及树 | 抽签／投票电路已有主张；未验证随机性、权限或结算安全 |
| NANDY MemeFuse | `37bce93b83752eb3698291fd45fd1d561f1d4ca9` | README及树 | 64输入穷举与信号规则已有自述；“Meme信号电路”不是天然差异 |
| Circuit City | `1de6095653ecb29429c14bff91ef5df69350ad2d` | README及树 | 能源交易规则电路已有演示自述；不能从演示推断真实能源市场 |

### 2.1 GateX：不能把状态机验证重新包装成新机会

其 `docs/verification.md` 明确区分AST解释、编译后解码网表模拟、协议回读和实时求值；README称有两个已制造电路、双提供者全域比较以及RuleGate会话状态。[S2]

源码读取支持“存在独立编译和模拟路径”；**256样例／提供者、交易、全域一致等仍为仓库记录，本轮没有重新执行或查询链上确认。**协议限制文档明确：`step()`是只读计算，协议本身不提供权威工作流状态；RuleGate另存状态，只允许会话创建钱包推进，不持有资金、未审计。[S2]

因此“Agent先审批再执行”不能仅靠电路显示绿灯；但也不能把已有RuleGate忽略后宣称没人解决状态持久化。

### 2.2 Covenant：工具链和执行封装均需正面比较

`prove.py` 可读到 `equiv_yosys`、`equiv_z3`、`equiv_netlists_z3`、`prove_properties`、`check_z3`；有 `proved / failed / timeout / error` 状态，Z3 `unknown`不作成功。`synth.py`与`difftest.py`提供综合及对照实现代码。[S3]

README称其无owner内核在固定边界内执行电路分配，另有Verilog→NAND/LATCH、SAT／Z3证明、十个错误变体检测等；**本轮没有运行验证，也没有据此作安全保证**。作者非常明确地写“adoption zero”，只有团队自发的两个Token、分配流入均为0。它说明功能实现与真实需求／付费采用是两件事，不说明其未来一定没有价值。[S3]

### 2.3 Cerebr与C3S：不能将可验证计算等同于现实正确

Cerebr自述多种神经元构造择门数最少、全域对照、链上游戏和Agent；README的“四个外部领取钱包／一个外部流片”属于作者自述，未核实钱包独立性、后续留存和付费，**不算已验证市场**。[S4]

C3S限制文档写明没有部署；电路复现量化教师不证明教师符合生物现实；部分模型假设被其自己的反证削弱。README与限制文件描述不同层面，不能把“Circuit Agent”字样直接读成已上线链上产品。[S5]

## 三、官网 PoD 新读到了什么，什么仍没有读到

本轮成功取得官网页面引用的JS资源 `https://tapeout.net/pod/assets/main-C1q9aWV9.js`（813,703字节），仅静态阅读，没有执行。[S13]

可见界面文本与调用路径：

- 题库页请求 `pod-taskbank.json`、`pod-refimpl.json`、`pod-templates.json`；有参考网表准备与下载／流片流程。
- 公式页面描述 `C = A·d³`，面积中LATCH按6个NAND折算，工本权重另为1；页面描述任务首创取更小C，有反例审查、撤销和恢复槽位机制。
- 文本描述抽样校验并非穷举；有已登记反例集合与反例审查界面。**“自动找反例＋一键挑战”不能忽略已有审查流程后称完全空白。**
- 包含BLIF导入帮助及Yosys／ABC提示；仅说明bundle包含相关功能文本，不证明该页面所有入口可用或完整编译器实现。
- 该页有 **BNB Smart Chain**、BSC区块时间与网络选择文本；不能由PoD材料推出本期X Layer部署或比赛资格。

尝试GET上述题库、参考实现、配置、统计、probe、版本等7个JSON地址，均返回 **403**。因此未取得实时任务总数、参考成本、当前榜位、链上代码、可用反例或实际收益。bundle中的278等回退值不能当作今日链上任务数；**不绕过访问控制、不根据页面公式承诺挖矿收入。**

由此，PoD优化器可能有天然协议相关性，但“参考实现可被普遍击败”“维护者需要新优化器”“可用于X Layer参赛”都未证实。

## 四、从新证据得出的三个候选，而非三个已立项产品

### 候选一：TapeAction——从批准电路到不可重放的实际动作边界

**本轮最值得继续查证的候选，不是已符合全部要求的推荐。**

- **具体对象：**有限的一类Agent资产动作，按精确的chainId、执行器、账户、目标、方法、数额、nonce和期限绑定批准；在真实执行入口读取电路结果、验证权限、消费nonce、执行动作并记录回执。一个批准只能用于绑定的动作。
- **潜在差异：**不止“电路通过”，而是可观察地拒绝换目标、换金额、换链、重放和绕过入口。演示应让同一个审批结果在合法动作成功、篡改动作失败。
- **可复用用户资产：**agent-control-plane的策略／会话／回执结构、relaybond-okx的EIP-712经验；原研究已指出金额`Number`、Merkle叶与immutable verifier约束，必须重做或明确排除，不能直接声称安全可复用。[S14]
- **强替代与竞品：**GateX＋RuleGate、Covenant执行封装，以及普通Solidity权限合约、智能账户策略与会话密钥。TapeOut电路也可能只是多一层成本。需要明确规则持有人／更换权限与调用方真实强制执行，不能只把哈希放电路外后称电路验证了完整calldata。
- **尚缺：**两个独立实际接入者的具体绕过／重放失败与成本；现有智能账户策略为何不足；精确数据宽度／溢出和可变长数据绑定方案；电路更换与代理升级信任模型；无资产风险的测试证据。公开代码不能代替接入意愿。
- **停止条件：**普通权限模块更简单，或只增加一条验证／局部适配即足够，则贡献现有项目，不做独立大奖平台。

### 候选二：TapeCost——带等价约束的面积／深度多目标优化

- **对象：**输入真实电路，输出语义等价、但门数／深度／实际求值gas有可衡量改善的网表；同时报告制造成本和实际调用开销，而不只优化一个纸面分数。
- **可能价值：**把优化前后网表、工具版本、反例／证明与测量放在同一个可复现证据包，帮助开发者决定是否重新流片。
- **已有覆盖：**Yosys／ABC、Covenant编译证明、Cerebr门数择优、官网BLIF路径与PoD参考网表。仅给这些工具套UI不足以形成壁垒。
- **必须新增证据：**独立真实项目的代表性电路，在相同工具版本／语义／边界下，比已有流程有稳定改进，且收益覆盖制造及迁移成本。深度下降不自动证明EVM gas下降；不能用一份合成电路的极端优化作平均收益。
- **停止条件：**没有真实公开样本可合法取得，或默认ABC与已有tapc已达到同等结果，则不立项。PoD的BNB收益不是X Layer市场证据。

### 候选三：TapeWitness——从抽样通过到可解释的错误见证

- **对象：**针对明确规格／参考电路，从候选网表生成最小可解释错误输入；离线复核后由用户自行决定是否使用官方审查流程。
- **可能价值：**把形式工具的反例变成可读步骤，清楚区分组合等价、任意状态单步、复位可达轨迹与时间属性。
- **强反证：**GateX已有全域检查，Covenant已有SAT／Z3与差分路径，C3S有时序证明自述，PoD已有反例审查与登记。工具不能从零推导未给定的业务正确性，也不能将超时标成通过。
- **必须新增证据：**既有工具确实漏掉、但合法规格可确定的真实错误；独立维护者愿意采用；不是只让现有SAT输出更漂亮。REF、升级、资源上限等语义必须锁定。
- **停止条件：**只是现有证明器的导出插件，降为贡献；未经确认不得批量上链挑战、获取奖励或发布漏洞指控。

### 五维排序（仅研究优先级，不评分）

| 顺位 | 候选 | 规则匹配度 | 原创性 | 可实现性 | 演示效果 | 夺奖潜力判断 |
|---|---|---|---|---|---|---|
| 1 | TapeAction | 需真实TapeOut＋X Layer闭环；暂无实现 | 端到端动作绑定可形成差异，但竞争强 | 范围能收窄，安全和集成难度高 | 允许／篡改／重放对照直观 | 最值得查证；真实需求与不可替代性未过关 |
| 2 | TapeCost | 优化器可直接服务电路，但PoD材料不能代替本期资格 | 已有综合和优化，需测出真实增益 | 可以先离线；证明与gas测量不可省 | 前后成本对照清楚 | 无可复现实例前不能声称优势 |
| 3 | TapeWitness | 电路工具相关，但无需上链也可能已足够 | 已有验证与反例机制，差异最窄 | 小范围解释器可做，通用时序困难 | 错误定位可视化较强 | 当前更像已有工具贡献 |

**当前明确选择：优先继续查TapeAction的真实执行边界，不批准完整开发。**这是新的电路方向调查顺序，不是把先前三个DeWEB方向改名；先前兼容／会话／RPC的证据仍保留，但不再无限加自造夹具。没有真实重要需求，不能把这里的第一顺位写成“已找到夺奖方向”。

## 五、下一轮应直接检验什么

1. 先只读核对GateX的RuleGate权限、Covenant的电路消费边界，以及用户现有Agent策略执行路径；判断是否只是已经解决的问题。禁止从README限制直接推定可利用漏洞。
2. 查公开具体集成／问题记录：谁需要把可验证规则强制作用于资产动作，哪一步当前失效，现有权限模块为何不足。两个仓库不自动等于两个团队，两名作者也不自动等于两名客户。
3. 若没有需求和简单方案反证，不写新协议和完整前端。若发现可信接入对象，再提交最小技术验证范围；联系、实际资产操作、账户使用与部署另行取得授权。
4. TapeCost与TapeWitness只保留可核对的样本调查，不能一边宣称尚无证据一边扩建三套产品。

这轮6个仓库的Issue列表请求中，GateX返回3个作者自己开的PR；另5个返回空列表。[S15] **只能说明这些请求未提供外部问题证据，不能说没有用户、没有缺陷或没有需求。**

## 六、来源索引与阅读边界

所有来源访问日期均为2026-10-17。固定链接便于复核；未运行任何下列第三方安装、测试、部署或证明脚本。源码存在不等于证明结果成立，文档交易不等于本轮链上验证。

- **[S1]** GitHub仓库搜索：[TapeOut NAND](https://api.github.com/search/repositories?q=TapeOut%20NAND&per_page=30)、[TapeOut circuit](https://api.github.com/search/repositories?q=TapeOut%20circuit&per_page=30)、[TapeOut PoD](https://api.github.com/search/repositories?q=TapeOut%20PoD&per_page=30)。检索有时间性、排序及首屏限制。
- **[S2]** [GateX固定树](https://github.com/AjKadri/GateX/tree/911207db3ce8bdab94ff7d9a5a2494cbb6b60f12)、[验证模型](https://github.com/AjKadri/GateX/blob/911207db3ce8bdab94ff7d9a5a2494cbb6b60f12/docs/verification.md)、[协议限制](https://github.com/AjKadri/GateX/blob/911207db3ce8bdab94ff7d9a5a2494cbb6b60f12/docs/protocol-limitations.md)、[编译器](https://github.com/AjKadri/GateX/blob/911207db3ce8bdab94ff7d9a5a2494cbb6b60f12/src/compiler/compiler.ts)、[模拟器](https://github.com/AjKadri/GateX/blob/911207db3ce8bdab94ff7d9a5a2494cbb6b60f12/src/compiler/simulator.ts)。RuleGate此轮仅读README与限制说明，未读合约，不判断安全。
- **[S3]** [Covenant固定树／README](https://github.com/OoJae/covenant/tree/296d77053266b85cdeaccf7b562dc2f4a27c8d4e)、[prove.py](https://github.com/OoJae/covenant/blob/296d77053266b85cdeaccf7b562dc2f4a27c8d4e/chips/tools/tapc/prove.py)、[synth.py](https://github.com/OoJae/covenant/blob/296d77053266b85cdeaccf7b562dc2f4a27c8d4e/chips/tools/tapc/synth.py)、[difftest.py](https://github.com/OoJae/covenant/blob/296d77053266b85cdeaccf7b562dc2f4a27c8d4e/chips/tools/tapc/difftest.py)。没有重新核验README记载的交易、证明与收入。
- **[S4]** [Cerebr固定树／README](https://github.com/NetLayerLabs/Cerebr/tree/47f5744dc2a76fabaa3fb8372b0d1dd265123ef3)、[neuron.ts](https://github.com/NetLayerLabs/Cerebr/blob/47f5744dc2a76fabaa3fb8372b0d1dd265123ef3/sdk/src/neuro/neuron.ts)、[网表测试](https://github.com/NetLayerLabs/Cerebr/blob/47f5744dc2a76fabaa3fb8372b0d1dd265123ef3/sdk/test/neuro-netlist.test.ts)。
- **[S5]** [C3S固定树／README](https://github.com/BruceLanLan/c3s-reflex-circuits/tree/0b301445966e840b21fe31955733be7d6d9f670c)、[限制](https://github.com/BruceLanLan/c3s-reflex-circuits/blob/0b301445966e840b21fe31955733be7d6d9f670c/docs/LIMITATIONS.md)、[固件文档](https://github.com/BruceLanLan/c3s-reflex-circuits/blob/0b301445966e840b21fe31955733be7d6d9f670c/docs/FIRMWARE.md)。
- **[S6]** [NAND Arena](https://github.com/neromtoobad/nand-arena/tree/3e4732eac4b82e3ed7749b2e431b45a2caa398cd)。
- **[S7]** [TapeOutTank](https://github.com/tizerluo/tapeouttank/tree/d5d030c4ce09ed13f5e981ee2da7f6cf70588d51)。
- **[S8]** [CircuitDesk](https://github.com/diveyreadytodive-star/circuitdesk-ignix-tapeout/tree/ea27e5eed1362ced23203d175d73fa68bd44cf33)。其README引用其他活动，不是本期规则来源。
- **[S9]** [TapeSafe](https://github.com/kin684660-commits/TapeSafe/tree/1c03f2f32f2f908bb63ffd7254cf5c1d071a2aa9)。
- **[S10]** [DRAWAGENT](https://github.com/memeshee/drawagent/tree/30c4c5876abab4e75aef02942b9989a473e9a246)。
- **[S11]** [NANDY MemeFuse](https://github.com/congge918/nandy-memefuse/tree/37bce93b83752eb3698291fd45fd1d561f1d4ca9)。
- **[S12]** [Circuit City](https://github.com/259906573-ship-it/circuit-city/tree/1de6095653ecb29429c14bff91ef5df69350ad2d)。
- **[S13]** [PoD页面](https://tapeout.net/pod)、[本轮取得的JS资源](https://tapeout.net/pod/assets/main-C1q9aWV9.js)。非稳定SDK；JSON读取403不能推断服务宕机或不存在。
- **[S14]** [用户资产与官方规则历史研究](tapeout-research-2026-10-17.md)。本轮没有重审全部用户资产，也没有重抓完整比赛规则。
- **[S15]** 六个仓库的GitHub `issues?state=all&per_page=100` GET：AjKadri/GateX、OoJae/covenant、NetLayerLabs/Cerebr、BruceLanLan/c3s-reflex-circuits、neromtoobad/nand-arena、tizerluo/tapeouttank；GateX三条均为PR，其余返回空数组，不代表全生态调查。
