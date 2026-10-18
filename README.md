# TapeWeave

**可编辑行为规则、双宿主消费与可复核交付包的原型。** 创作八行行为表，编译为有限NAND／LATCH字节，在训练和钥匙门两个宿主中运行，并导出、复核创作包与逐拍回放。

当前状态（2026-10-18）：静态试玩、本地SQLite宿主、只读链工具及本地Solidity测试已开发；已在X Layer制造两枚电路并保存单RPC只读求值证据。**真实链上宿主尚未部署，商业需求／付费／留存尚未验证，不是完整参赛作品。**

## 在线试玩（GitHub Pages）

- [行为创作工作室](https://0xcaptain888.github.io/TapeWeave/research/tapeweave/demo/studio.html)：编辑行为表、编译、双宿主／普通公式对照、回放与本地恢复。
- [固定行为挑战](https://0xcaptain888.github.io/TapeWeave/research/tapeweave/demo/index.html)：四回合预测、挑战包导入与回放复核。
- [人工验收记录](https://0xcaptain888.github.io/TapeWeave/research/tapeweave/demo/validation.html)：记录真实观察，生成未认证JSON；不上传、不自动保存，不认证独立身份。
- [未部署宿主接入准备](https://0xcaptain888.github.io/TapeWeave/research/tapeweave/demo/chain.html)：非零地址调用草案和候选地址只读，无默认地址、钱包签名或发送按钮。不是已核验合约入口。

Pages只提供静态文件，不运行Node／SQLite，也不会部署Solidity合约。工作室进度保存在浏览器同源localStorage，不自动同步设备或SQLite。清除浏览器数据可能丢失进度；勿输入秘密或个人敏感信息。真实RPC/CORS、系统剪贴板、实际手机与独立体验仍待验收；桌面Chrome通过不等于上述验证完成。

## 已开发部分与运行入口

| 部分 | 能力／入口 | 边界 |
|---|---|---|
| 静态前端 | [试玩指南](research/tapeweave/demo/README.md) | 固定有限规则，不支持任意网表或完整TAP协议 |
| 本地持久宿主 | [SQLite运行、归档与恢复](research/tapeweave/demo/PERSISTENCE.md) | Node24、本机事务及重试；不是公开多用户服务 |
| 独立接入材料 | [时序、责任与失败边界](research/tapeweave/INTEGRATION.md) | 接入指南不是独立团队已采用的证据 |
| RPC读取与本地提交 | [RPC宿主工具](research/tapeweave/demo/RPC-HOST.md) | 不发送交易；双端历史绑定仍有失败记录 |
| Solidity宿主与离线创建包 | [源码、测试和准备工具](contracts/README.md) | Mock本地EVM通过；尚无官方Account2创建／模拟适配器，不可据准备包广播 |
| 已制造电路 | [制造报告](docs/tapeweave-manufacture-2026-10-18.md)、[只读验证](docs/tapeweave-manufactured-validation-2026-10-18.md) | pulse ID1、alternating ID2；真实电路不等于真实宿主消费 |

### 本地静态运行

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

打开 `http://127.0.0.1:8000/research/tapeweave/demo/studio.html`。不要将数据库、WAL、SHM、钱包资料或秘密文件放进仓库／静态服务目录。SQLite服务请按上表专门指南启动，不用静态服务代替。

### 验证

```sh
node research/tapeweave/demo/check.mjs
# 本机安装Chrome时：
node research/tapeweave/demo/check.mjs --browser
```

SQLite模块要求Node24。2026-10-18完整回归：**22组Node／Chrome及两次Python发布保护（普通、-O）通过**。另三组合约测试通过：离线准备、完整initcode本地部署／runtime核对、32局128拍及五种失败回滚；外部Solidity依赖和命令见[合约README](contracts/README.md)，不安装进本仓库。所有结果为作者自测；剪贴板／RPC部分使用替身，合约处理器使用Mock，不是审计、官方AA模拟或独立采用。

## 商业方向与交付状态

目标假设：帮助需要跨应用复用行为规则的开发者降低接入与回归成本；不是再增加一个交易工具。普通共享模块／共享合约是公平强对照，目前没有客户、付费或留存证据。

- [最新完成与剩余阻塞](docs/tapeweave-completion-status-2026-10-18.md)
- [统一审核包与证据边界](docs/tapeweave-review-package-2026-10-18.md)
- [商业价值复核](docs/tapeweave-commercial-validation-2026-10-18.md)／[未执行验证任务单](docs/tapeweave-commercial-pilot-2026-10-18.md)
- [TapeOut官方规则研究及来源](docs/tapeout-research-2026-10-17.md)
- [研究收敛结论](docs/tapeout-final-research-decision-2026-10-17.md)

此前链上累计实付0.01052 OKB，真实广播仍暂停。支持TEE／AA部署作为用户指定开发前提，不等于已取得适用当前账户的具体官方接口。未部署、无真实宿主动作回执、无视频成片或投稿确认。历史70分仅为设计基线，不是完成率、官方评分或获奖概率。

早期本地制品的`chain_identity=null`保留，不因后来制造成功而改写旧证据。回放未认证；摘要／重算一致不证明身份或真实历史。研究目录含被替代的历史方案，当前状态以上方最新完成报告及审核包为准。

## 发布与许可

公开发布仓库仅为[0xCaptain888/TapeWeave](https://github.com/0xCaptain888/TapeWeave)。GitHub Pages从`main`根目录提供静态文件；不会替用户运行本地服务或发送链上交易。发布同步排除Python缓存和私有运行数据；不包含数据库、凭据、node_modules。

第三方片段的原有许可文件保留；本仓库未额外授予统一开源许可证。
