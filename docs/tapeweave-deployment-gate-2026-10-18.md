# AA部署核验与最短交付验收

执行／访问日期：2026-10-18。本轮没有签名、广播、授权或资金支出；累计历史实付仍0.01052 OKB，累计0.05 OKB暂停复核线保持，不增加高风险授权。

## 明确部署阻塞

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

## 待用户参与的最短步骤

1. **真机（约5分钟）**：用实际手机打开静态试玩的工作室，记录型号、系统、浏览器；默认蓄能执行等待等待触发触发，观察训练2／门1；刷新恢复，试复制并实际粘贴。记录布局、触摸和剪贴板是否成功，不用桌面窄屏替代。
2. **独立玩家（约5分钟）**：取得一名非作者同意后，按demo/VALIDATION.md先预测再执行，保留帮助和失败；普通模式使用同样规则，交错顺序，不把学会第二遍视为电路优势。
3. **独立创作者／开发者**：创作者交付一个包给另一人复核；开发者按INTEGRATION.md消费制品并记录疑问。本人两窗口不算独立交付，调用作者引擎不算独立求值器。可先只填已完成角色，其余保持未知，不虚构。
4. **视频及投稿**：先收集真实体验和部署状态，再按已有180秒脚本录屏，明确本地／真实制造／未部署分层。尚无视频成片、报名身份及最终提交确认，不代写成已完成。

以上任务不要求在聊天提供私人联系方式、私钥或凭据，也不授权代替参与者反馈。源码完成、测试通过和制造成功不会自动提高历史70分或证明获奖竞争力。
