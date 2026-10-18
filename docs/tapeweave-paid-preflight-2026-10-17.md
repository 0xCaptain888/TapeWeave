# TapeWeave 付费执行前核验

访问日期：2026-10-17（America/Los_Angeles）；RPC探针起始UTC为2026-10-18T06:32:20.674Z，补充读取随后执行。用户已允许付费并要求先核验目标、权限和完整费用；旧零预算约束被本次授权替代，但尚无金额上限或具体交易确认。本轮全程只读，没有充值、授权、签名或广播。

## 目标与来源

重新读取[官方主站](https://tapeout.net/)及其引用的[客户端bundle](https://tapeout.net/app/assets/index-BtJs_b-c.js)，SHA-256仍为`47fe0a3293428795cab83a43f2fd8c9da23650cb388963dbbfd116ee11f24c20`。前端配置X Layer196制造工厂为`0x1f09daefa827f02cbb40967cc91b259763760761`；这是官方前端指向的地址，不等于已完成源代码／升级权限审计。

从[RPC一](https://rpc.xlayer.tech)读取当时最新块号`0x4621264`，合约读取统一固定该块。[RPC二](https://xlayerrpc.okx.com)在Node中fetch failed，curl补充请求均连接重置；没有双端确认。原始成功响应、revert和传输失败保存在[记录](../research/tapeweave/paid-preflight-2026-10-17.json)。仅历史快照，不承诺后续交易时不变。

## 实测费用：不是完整预算

|项目|单端固定块结果|适用边界|
|---|---|---|
|工厂deployFee|0.0066 OKB|创建处理器的费用，不是全部制造费用|
|工厂protocolFee|0.00066 OKB|独立getter；不能不核调用逻辑就再叠加到每一笔|
|cpuAt(0)样本TAPEOUT_FEE|0.0013 OKB|他人处理器样本，不是本项目新处理器承诺|
|样本晶体管mintPrice|0 OKB|不代表铸造总付款为零|
|样本晶体管protocolFee|0.00066 OKB|前端显示按交易收协议费；须核实际mint数量／种类与调用value|
|eth_gasPrice|20,000,001 wei/gas|补充读取时的非固定块报价；未估gas，不是总网络费用|

样本处理器`0x839bdd6fa7a66416a609a735e11de5411b98574e`、晶体管`0xbe0eee424c49d44592e4d498740f5b031ef8e26d`只是费用观察，未被选作本项目付费目标。前端ABI含createCPU、mint、tapeout及ERC1155 setApprovalForAll；X Layer前端质量档minSupplyCap=10000、minMintPrice=0是客户端观察，不当作链上强制条件。免Gas／后端赞助资格尚未对具体交易核验；RPC非零gasPrice也不能单独证明钱包赞助不可用。

完整支出须按实际交易逐项列：创建CPU；NAND与LATCH铸造（数量×单价及每笔协议费）；必要的ERC1155授权；每枚电路流片；宿主合约部署；宿主初始化／各拍调用；必要的授权撤销；各笔网络费用及失败交易缓冲。普通共享实现对照若上链也须单列。不得将0.0066＋0.0013当完整报价。

## 权限核验及风险

- 工厂runtime呈现读取EIP-1967实现槽后delegatecall的代理结构；固定块该槽返回候选实现`0x74956236ab64ed143933040b4137e8a352e4d17b`。
- 工厂owner()返回`0xb3d85b42a045c1a88d800cad0f55d2566a4d3138`。尚未核验该地址是EOA、multisig或timelock，也未核源码、升级入口、角色、暂停及改费权限；owner getter不等于完整权限图。
- 对样本处理器直接调用implementation()返回execution reverted，不能据此断言无代理或不可升级。此前beacon观察也不是当前安全保证。
- 若mint／tapeout确需setApprovalForAll，将授予对应处理器对该ERC1155集合的操作权限，不是只授权一枚电路。必须先核burn路径、接收方和撤销流程；本轮未授权任何operator。
- 新宿主合约尚未实现／部署，地址、管理员权限、升级策略、调用认证、资源约束及gas都未知，不能给其伪造审计结论或部署报价。

## 后续只读补证：实现及owner均有代码

同日继续在同一固定块、同一成功RPC读取，保存[完整补充响应](../research/tapeweave/permission-followup-2026-10-17.json)，本节没有重新取得最新块或双端确认。

- 工厂实现候选`eth_getCode`非空；工厂owner地址的`eth_getCode`也非空。因此不能将owner称为个人EOA，也不能仅凭有代码称为多签或timelock；其成员、门槛和控制路径仍未核。
- 工厂EIP-1967 admin槽返回零。这只排除了该块该槽存在非零值，不证明工厂无管理员或不可升级。
- 直接对实现调用`proxiableUUID()`返回EIP-1967实现槽；通过工厂代理调用同函数revert（错误数据`0xe07c8dba`）。这些与UUPS式调用上下文约束相容，但没有源码不能确认`upgradeToAndCall`授权逻辑、谁能改费或是否有延时，不能当作安全通过。
- 尝试Sourcify链196、该实现地址的`full_match`与`partial_match` metadata路径，均HTTP404。这只说明这两个查询路径未取得源码，不证明别处没有验证源码，也不表示部署不安全。

未调用任何升级、转移所有权或授权函数。此轮仅新增只读证据和文档，未改应用源码，未重跑应用测试；JSON解析及diff检查单列，不冒充权限审计。

## 当前结论与下一执行门槛

**付费可行性核验有进展，目标已定位，但完整费用与权限仍未核完，暂不进入交易。** 缺项包括：独立RPC确认；工厂／处理器／晶体管实现源码与升级权限；本项目制造参数和网表资源精确用量；新处理器费用；宿主实现与测试；Account 2的当前余额／钱包赞助资格；每笔精确calldata、value、模拟及gas估算。没有读取钱包凭据或假设资金已到账。

用户下一步只需给出本阶段**累计最高支出（OKB）**；不要发送私钥、助记词或令牌。金额上限用于约束后续方案，并不要求立即充值。得到完整交易清单及模拟结果后，再确认具体交易；金额未定不阻碍继续源码与本地合约开发，但不广播。
