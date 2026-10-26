# AA部署核验与最短交付验收

> 历史部署门槛记录。2026-10-26已通过官方AA钱包调用CreateX完成宿主部署与两局主网交互；下文的创建路径阻塞不是当前状态。仍缺完整UOP独立模拟、双RPC与实际验收，见[当前状态总表](tapeweave-current-status-2026-10-26.md)及[真实主网报告](tapeweave-mainnet-run-2026-10-26.md)。

> **2026-10-26 后续更新：**用户明确授权后，`AA → CreateX → CREATE2` 已完成真实主网部署及两卡四拍，合计 11 笔交易全部核验通过，新增实付 0 OKB。见[主网运行记录](tapeweave-mainnet-run-2026-10-26.md)与[适配说明](tapeweave-createx-deployment-2026-10-26.md)。下文保留原始时间线，“当前阻塞／暂停”均指原记录日期；不再表示现状。历史累计 0.01052 OKB 与 0.05 OKB 预算复核线保留。独立完整 UOP 模拟、双提供商、真机与独立采用仍无完成声明。

执行／访问日期：2026-10-18。本轮没有签名、广播、授权或资金支出；累计历史实付仍0.01052 OKB，累计0.05 OKB暂停复核线保持，不增加高风险授权。

## 用户确认后的审核门状态

用户明确停止真实宿主部署。外部阻塞：**缺少官方 Account 2 CREATE 路径**；不得继续未知factory、伪造to、私钥导出或其他绕过。非部署交付物、EVM复跑证据、只读两电路证据、部署准备包、未发送支持模板及最短人工验收见[审核包](tapeweave-review-package-2026-10-18.md)。本轮停在审核门；真实部署、手机／独立体验、视频与投稿不标完成。累计实付保持0.01052 OKB。

## 当前结论（以此为准）

本页按核验顺序保留历史失败；**最新已读到X Layer Hardhat／Foundry部署正文及Agentic Wallet快速开始／技能正文**，不再以官网全部不可读或Hardhat超时作为当前阻塞。两份部署教程使用私钥签名方式，仍没有取得适用于当前OnchainOS账户的合约创建载荷、调用入口及模拟依据。普通链部署教程不能解除本任务的账户路径限制。

研究报告、两枚真实电路制造、单RPC求值、本地双宿主、未部署合约与本地测试均已有交付；**真实宿主部署／消费、手机与独立体验、视频及最终投稿仍未完成**。“继续直至完成”不改变无依据停止部署、不得导出私钥及0.05 OKB暂停线。后续解除部署阻塞需要官方提供当前账户可用且可预检／模拟的具体创建路径；若官方说明不支持，则按不支持处理，不再重试普通私钥教程冒充解决方案。

## 明确部署阻塞（首次核验记录）

当前安装的OnchainOS CLI `wallet contract-call --help`明确写EVM需要`--to`，没有创建参数。这只能证明当前命令未公开暴露创建接口，**不能证明当前AA账户底层绝对不支持CREATE**。

官方开发文档入口 https://web3.okx.com/onchainos/dev-docs/ 本轮curl访问25秒超时，未取得正文；另一次尝试的`/wallet-api/contract-call`路径10秒超时，该路径本身未获官方导航证实，不当成已存在页面引用。当地安装的官方技能wallet参考也未提供EVM合约创建API。没有核验到可用于本账户的官方SDK创建方法、参数、预检与模拟规则。

因此结论是：**账户contract creation能力未知，准确官方调用方式未知，部署及其模拟暂阻塞**。不猜API、不使用未知factory／CREATE2部署器／中转服务，不伪造带to的创建调用，不读取或导出私钥。必须取得OKX／OnchainOS一手部署文档或可核来源及版本的官方SDK，核账户兼容性、构造参数、预计费用和模拟后，才允许真实部署。不能仅凭一般ERC-4337可扩展性推断此账户支持。

## 不依赖部署的本轮完成项

- `contracts/test-host.mjs`新增两卡×16动作序列，共32局、128个动作交易的本地EVM穷举，与普通公式逐拍核对状态、训练分、门分和资源。仍为作者Mock处理器测试，不是链上消费或独立实现。
- 原五种处理器故障的实际本地失败交易回滚、身份、nonce和隔离检查继续通过；本轮未修改合约逻辑，不构成审计。
- 新[链上接入准备页](../research/tapeweave/demo/chain.html)：无默认地址；仅生成开局／动作calldata草案，或显式输入候选地址后从单RPC固定块读取。无钱包、发送、自动重试、费用支付；显示verified_host=false。它不校验运行时代码来源，恶意合约也可能返回相似数据，因此草案绝不能直接当可发送交易。
- 新ABI测试及既有非浏览器统一回归通过。后续同日补测：`test-chain-browser.mjs`在真实Chrome加载生产页面与模块，以作者替身RPC验证草案清空、只读成功／失败、配置改变后丢弃延迟响应；没有真实RPC、CORS、平台预览或手机结论。该探针已加入`check.mjs --browser`，但本次仅单独运行新增探针，不冒称整套浏览器回归通过。SQLite本地服务白名单未扩大，准备页通过静态预览／Pages入口打开，不在durable本地服务提供。

同日再次访问官方入口（curl HEAD，15秒）仍超时；没有新增创建接口证据，也没有为此发出钱包交易。

## 后续核验与完整回归（同日）

为区别普通EOA部署示例与当前OnchainOS AA账户接口，只读尝试访问GitHub候选API路径 https://api.github.com/repos/okx/onchainos-skills 和 https://api.github.com/repos/okx/js-wallet-sdk 的仓库元数据（访问日期2026-10-18）。未认证请求均返回403 rate limit exceeded；使用已有环境凭据再次只读请求，两者均TLS握手超时，未取得仓库元数据、SDK版本或接口正文。因此这两个名称仅为**待核验候选路径**，不据此确认其存在、官方维护关系或当前AA创建支持；也未安装或执行其中任何SDK。没有新的一手部署依据，部署继续阻塞，零新增支出。

随后实际运行`node research/tapeweave/demo/check.mjs --browser`：**20组Node／Chrome测试＋两次Python发布保护运行（普通／-O）全部通过**，包括新增接入页的替身RPC Chrome探针、固定挑战、工作室和SQLite页面。该完整运行替代上文“本次仅单独运行新增探针”的阶段状态，但不改变测试的作者控制性质，不证明真实RPC／CORS、手机、独立参与或安全审计；合约EVM测试仍是前轮单独通过，不计入这20组。

## 原始文件通道补证（同日后续）

GitHub API失败不代表仓库文件不可读。本次改用`raw.githubusercontent.com`成功取得下列`main`分支文本（访问日期2026-10-18）：

| 一手文本路径 | 读取结果与SHA-256 |
|---|---|
| [OKX命名空间下的技能README](https://raw.githubusercontent.com/okx/onchainos-skills/main/README.md) | 列出钱包技能、合约调用及交易网关；`24d7071f5d2b3855c83d669dc193c61ff1768d49051ba5ff8b25c4308de79d51` |
| [wallet参考](https://raw.githubusercontent.com/okx/onchainos-skills/main/skills/okx-agentic-wallet/references/wallet.md) | 描述contract-call与TEE签名；`3f0d2b6e3fc7732dfe3aeb37bcb1e2ff762d4b905217f2f6aa56c844338519ef` |
| [wallet CLI参考](https://raw.githubusercontent.com/okx/onchainos-skills/main/skills/okx-agentic-wallet/references/wallet-cli-reference.md) | contract-call参数表将`--to`列为EVM／Solana必需；`98e1a5016eb7e04e309885f036c09b00681268e6812ae2e77f7300710e86337f` |

这是对“尚未取得候选仓库正文”的后续更新，不抹去之前的API失败。分支URL可变，散列仅标识本次读取文本，不是固定提交、安装版本或安全认证。README提供的范围描述不能替代账户兼容性证明；本次定向检查wallet参考和CLI参考的创建／部署／模拟相关内容，**没有找到当前AA账户可用的合约创建方法、创建载荷格式及其模拟流程**。CLI命令总览将`--to`写成方括号，但参数表明确EVM／Solana必需，不能将总览的可选语法误当EVM创建支持。

因此部署门槛仍未通过，但阻塞描述已收窄为“已取得钱包参考，仍缺AA创建的一手支持”，而非“所有官方候选文件均不可读”。没有调用钱包、安装SDK、签名或广播，累计实付不变。本轮仅文档补证，未修改应用，也未重新运行上节已通过的完整测试。

## 第二候选SDK的适用性核验（同日）

后续成功读取[OKX Web3 JS Wallet SDK README](https://raw.githubusercontent.com/okx/js-wallet-sdk/main/README.md)（访问日期2026-10-18，SHA-256：`c14cba92f43b1f679348ff7dc982d239a2dfa1e577d173ae5ce8166e3e22f714`）。这更新了前文第二候选仓库尚未读到正文的阶段状态。

该README将产品定位为多链**离线交易创建与签名**工具。其Ethereum示例在`getNewAddress`和`signTransaction`参数中传入`privateKey`，并使用`to`、`nonce`、`gasPrice`、`gasLimit`及`chainId`构建交易。它没有在此示例中提供当前OnchainOS托管／TEE账户的调用方式、AA创建能力或创建模拟路径。**官方命名空间下的SDK不自动等于当前账户可用的部署通道**；不能将普通私钥签名示例移植为当前账户操作，更不能据此导出私钥、另建账户或迁移资金。

该结论仅限已读取的README，不宣称整个SDK没有AA支持或不支持EVM创建。另试探`packages/coin-ethereum/README.md`返回404；该路径未经目录核验，不能据其404判断包不存在。本次没有安装或运行SDK，没有调用钱包、签名、广播或新增支出；应用及完整回归状态不变。真实部署仍等待明确适用于当前账户的官方创建与模拟依据。

## 直接访问OKX／X Layer官网补证（同日后续）

按用户要求，本次直接访问官网，而非只看GitHub。访问日期2026-10-18，均为只读，无钱包调用或新增支出。

**访问过程不能简化为官网全部不可读：**初次Python请求OnchainOS文档根入口、X Layer首页及试探的`/xlayer/docs/developer/`返回403；web_fetch对前三个入口超时。之后使用浏览器风格User-Agent，`https://web3.okx.com/xlayer/docs/`成功重定向到下表第一项，OnchainOS产品页及Build X活动页也取得HTTP 200。没有绕过登录、验证码或权限控制。由成功页面的导航继续取得下列正文：

| 官网一手来源 | 本次读到的事实 | 原始HTML SHA-256 |
|---|---|---|
| [X Layer开发者文档](https://web3.okx.com/onchainos/dev-docs/xlayer/developer/build-on-xlayer/about-xlayer) | 导航明确分开部署合约、验证合约、RPC、Flashblocks等文档 | `7fbf2f9564cee31729b62d19b5ae88eb1b4b917ca65eaa5e2655e98aec2ae134` |
| [Deploy a smart contract](https://web3.okx.com/onchainos/dev-docs/xlayer/developer/deploy-a-smart-contract/deploying-contract) | 提供Hardhat、Foundry、Truffle三种部署指南入口 | `3da93d18ea2858dbab3795135019da84eeeea8d33d85d80dec441ad130e2a2bd` |
| [Agentic Wallet介绍](https://web3.okx.com/onchainos/dev-docs/wallet/agentic-wallet) | 官方陈述TEE生成／存储／签名、Agent不能访问私钥、执行前风险模拟与评分、支持X Layer等链 | `3c52a924acd3c80a5f9230b3f6ec9cda60cf529baf1fe39426b1ff01c02189fd` |

**新事实与仍缺证据：**X Layer官网确有合约部署指南，不能再笼统说“没有官方部署文档”；但部署指南索引没有说明如何让当前OnchainOS账户发起CREATE。沿索引访问[Hardhat指南](https://web3.okx.com/onchainos/dev-docs/xlayer/developer/deploy-a-smart-contract/deploy-with-hardhat)20秒超时，未读到正文，不能推断其具体签名方式。钱包介绍的“可签名／提交交易”及“执行前模拟”也不等于公开了当前账户合约创建载荷与模拟接口。**一般X Layer部署能力与当前账户可用创建通道仍须分开核验。**

Agentic Wallet页面还宣称“Zero Gas on X Layer”。这属于官网产品口径，本轮未核其适用条件；不能覆盖本项目已记录的0.01052 OKB累计实付、承诺未来零费用或解释已有收费构成。页面安全宣传不是本项目或账户的安全审计。此次成功正文含导航／产品说明，但没有取得满足现有部署门槛的账户创建依据，故继续不部署、不导出私钥、不换未知factory。仅更新文档，未修改应用或重跑此前完整测试。

## 部署正文核验完成：当前账户路径仍未知（同日最新）

本次沿已确认的官网导航重试，四页均HTTP 200，访问日期2026-10-18：

| 一手来源 | 正文内容与适用性 | 原始HTML SHA-256 |
|---|---|---|
| [Hardhat部署](https://web3.okx.com/onchainos/dev-docs/xlayer/developer/deploy-a-smart-contract/deploy-with-hardhat) | 自述为X Layer测试网教程；网络配置`accounts: [privateKey1, privateKey2, ...]`，使用`getContractFactory`／`deploy` | `1b414e4c4023f9b967f208dacc71304e9d0a025fb527198f88dcb748b90567cc` |
| [Foundry部署](https://web3.okx.com/onchainos/dev-docs/xlayer/developer/deploy-a-smart-contract/deploy-with-foundry) | 自述为测试网教程；明确要求`forge create --rpc-url HTTP_URL --private-key PRIVATE_KEY`，示例交互同样使用私钥 | `6ddf66610a2e49da9064a8685a0f7142dfa3f26e1abed030cf4457446e94d2ab` |
| [Agentic Wallet快速开始](https://web3.okx.com/onchainos/dev-docs/wallet/agentic-quickstart) | 介绍持有资产、签名与提交交易，链接安装和首个Agent指南；没有在此页给出合约创建参数 | `3e207a789866669df8819cabb1c8b200b501f4eaeea6710f9be497d58c60b7f6` |
| [Agentic Wallet技能](https://web3.okx.com/onchainos/dev-docs/wallet/agentic-wallet-skills) | 展示登录、子钱包、余额、安全检测、转账、历史及“检查Gas→模拟→扫描→执行→跟踪”；没有在此页给出当前账户CREATE调用 | `ac4323fd2aa85c64125d7cb99cf11178d332f47fa70ae1a7521225d3c8ecbb0c` |

这是对上节Hardhat超时的后续替代，不是新的部署成功。未执行网页安装、测试网示例、私钥配置或任何交易。教程的测试网地址、示例锁款及旧工具版本不移植到本项目主网配置；Hardhat配置名`xlayer`与示例命令`--network XLayer`大小写还存在文本不一致，不原样运行。两份教程证明官方有普通私钥方式的部署指导，**不证明当前TEE／AA账户支持同样流程，也不证明其绝不支持CREATE**。

截至本轮，针对这些官网正文的阅读已完成，仍缺的是账户专用接口依据，而不是重复运行本地测试。本文仅文档更新，`git diff --check`通过；不宣称新增应用回归、模拟、手机结果或独立采用。没有钱包调用及新增支出。

## 待用户参与的最短步骤

1. **真机（约5分钟）**：用实际手机打开静态试玩的工作室，记录型号、系统、浏览器；默认蓄能执行等待等待触发触发，观察训练2／门1；刷新恢复，试复制并实际粘贴。记录布局、触摸和剪贴板是否成功，不用桌面窄屏替代。
2. **独立玩家（约5分钟）**：取得一名非作者同意后，按demo/VALIDATION.md先预测再执行，保留帮助和失败；普通模式使用同样规则，交错顺序，不把学会第二遍视为电路优势。
3. **独立创作者／开发者**：创作者交付一个包给另一人复核；开发者按INTEGRATION.md消费制品并记录疑问。本人两窗口不算独立交付，调用作者引擎不算独立求值器。可先只填已完成角色，其余保持未知，不虚构。
4. **视频及投稿**：先收集真实体验和部署状态，再按已有180秒脚本录屏，明确本地／真实制造／未部署分层。尚无视频成片、报名身份及最终提交确认，不代写成已完成。

以上任务不要求在聊天提供私人联系方式、私钥或凭据，也不授权代替参与者反馈。源码完成、测试通过和制造成功不会自动提高历史70分或证明获奖竞争力。
