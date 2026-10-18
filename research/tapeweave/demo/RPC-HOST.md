# 只读RPC求值 → 本地持久双宿主

更新／来源访问日期：2026-10-17（America/Los_Angeles）。本轮工程实现，不等于真实链上宿主交易。

## 已实现

`rpc-host.mjs`导出`connectRpcHost(store, session, binding, read?)`：

1. 先对指定制品、处理器、ID、历史块完成双RPC的24条绑定检查。
2. 要求SQLite已有会话使用相同行为表与字节模式，普通模式保留原本地同等功能，不冒充RPC模式。
3. 每拍按两个宿主各自旧态，在两个固定RPC分别调用`step`（共4次），严格解析ABI并核对下一状态与请求。
4. 全部匹配后才调用既有SQLite事务提交。网络等待期间不持有数据库锁；竞争写者由版本检查拒绝，不能覆盖已提交局。
5. 返回RPC观察和本地回执，始终`authenticated:false`、`host_transactions:false`。RPC记录不是认证来源，历史块不是当前实现保证。

新增`decodeStep`共享严格ABI解析。不支持REF、任意网表、钱包签名、制造、发送交易或链上持久状态。两个宿主实际效果仍由本地规则决定，RPC只求值电路。重复／未知提交结果应先通过原持久宿主读取回执与最新快照，不能把旧RPC观察称为新提交。

## 启动

需Node24，在仓库根目录，DB放仓库外。先用`host-cli.mjs import`新建字节模式会话（见[PERSISTENCE.md](PERSISTENCE.md)），然后：

```sh
node research/tapeweave/demo/play-rpc-host.mjs \
  /tmp/tapeweave-rpc.sqlite SESSION ARTIFACT_FILE \
  PROCESSOR CIRCUIT_UINT64 BLOCK_HEX 0011 run1 \
  > /tmp/tapeweave-rpc-observation.json
```

大写参数必须替换为真实项目绑定，不提供冒充项目的默认电路。拒绝`latest`。已完成的动作必须与请求四位序列一致；中途失败不回滚此前成功拍，不自动重开、不覆盖会话。输出可能包含公开处理器和制品信息，不含钱包凭据。网络失败时退出非零，数据库保留已成功提交的前缀，先`host-cli show`确认状态。输出重定向不得覆盖输入或数据库。

本轮测试：14组Node＋3组Chrome统一17组通过，RPC部分仅注入合成响应，覆盖四拍训练2／门1、传输或ABI失败不提交、等待期间竞争写者保留、普通会话拒绝。未指定实际项目处理器，**未跑真实RPC宿主局**，不代表真实制造、链上交易、独立采用、实际手机或系统剪贴板通过。

## 零费用制造检查的外部观察

用户已选择现有身份新增专用开发账户，已完成账户创建；上限为零，不充值。此信息不将钱包身份或凭据发布到仓库。

本轮重新访问：

- [主站](https://tapeout.net/)返回HTML，引用下列bundle。
- [前端bundle](https://tapeout.net/app/assets/index-BtJs_b-c.js)成功读取，SHA-256 `47fe0a3293428795cab83a43f2fd8c9da23650cb388963dbbfd116ee11f24c20`。
- `https://tapeout.net/app/`本轮HTTP404，不能据此说主站或bundle都不可用。

bundle可见`createCPU(...) payable`、`deployFee()`、`tapeout(bytes,uint32,uint32) payable`、`TAPEOUT_FEE()`以及晶体管`mint`／`mintPrice`接口；X Layer前端流片费校验常量为`1300000000000000`原生最小单位（仅前端静态观察，**不是本轮链上实测报价**）。界面同时有先买晶体管、再付协议费的步骤与失败／待确认分支。

结论：不能从“网络免Gas”推导“制造零成本”；目前没有可确认的零费用制造路径。未因前端常量自动发出任何交易，也不通过借用他人电路、测试网或伪造记录补齐制造证据。当前合约费用、零费赞助资格与权限仍待只读核验；若有非零金额或无法确认，停止而非充值。继续保留未完成状态，不把开发授权当作放宽预算。

## 余项不是代码可替代的通过记录

- 真实项目制造身份、目标合约安全检查、具体交易确认与零费用路径。
- 本项目真实RPC局及链上宿主交易、回执、费用／延迟（两者不同）。
- 同意参与的真人任务和独立接入；[VALIDATION.md](VALIDATION.md)仍待填写真实结果。
- 真实素材的≤180秒视频、参赛个人资料及资格确认、正式提交回执。

本轮不宣称“一次性全部参赛开发完成”，也不提高70分历史设计基线。
