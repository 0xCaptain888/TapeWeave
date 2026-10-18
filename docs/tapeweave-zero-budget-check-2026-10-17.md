# TapeWeave 零预算制造：实际只读检查

访问日期：2026-10-17，America/Los_Angeles（保存记录的UTC为2026-10-18，两者不冲突）。没有签名、广播或充值。

## 结论

**当前不能在零预算条件下宣称可以制造。** 第一RPC在固定块返回非零工厂创建费与样本流片费；第二RPC连接失败，双端核对未完成。不能把失败写成双RPC一致，也不能把单个历史样本推导为全部处理器的现价或完整制造报价。

## 来源与方法

- [官方前端bundle](https://tapeout.net/app/assets/index-BtJs_b-c.js)，本轮重新下载，SHA-256 `47fe0a3293428795cab83a43f2fd8c9da23650cb388963dbbfd116ee11f24c20`。从X Layer配置定位工厂，读取ABI字符串确认`deployFee()`、`cpuAt(uint256)`、`TAPEOUT_FEE()`、`transistors()`及`mintPrice()`。
- 函数选择器用本机已安装`@noble/hashes`的Ethereum Keccak计算，未新增项目依赖；不是FIPS SHA3。
- [RPC一](https://rpc.xlayer.tech)通过`eth_blockNumber`取得块`0x46207a4`，随后所有合约读取固定在该块。
- [RPC二](https://xlayerrpc.okx.com)在本轮Node读取中`fetch failed`，重试一次仍失败。没有换源伪装成第二独立端点。
- [保存的完整记录](../research/tapeweave/manufacturing-fees-2026-10-17.json)：8条成功响应，随后失败，`matched:false`、`transactions_sent:false`。它是作者保存的RPC文本，不是签名或来源认证。

## 单端结果（未完成双端确认）

|读取项|结果|范围限制|
|---|---:|---|
|工厂创建费|6600000000000000原生最小单位，按18位为0.0066 OKB|指定块工厂返回，不是总制造成本|
|注册处理器数量|364|索引0仅为可观察样本，不是随机取样或本项目所有|
|样本流片费|1300000000000000原生最小单位，按18位为0.0013 OKB|样本处理器返回，不保证其他处理器、当前块或特殊资格相同|
|样本晶体管mintPrice|0|只是一项价格；不代表协议费、授权、供给和使用资格均为零|

不相加伪造本项目完整报价，不给未经查询的美元等值。创建新处理器未必是唯一实现路径，但样本流片费本身已非零，不能因为mintPrice为0就忽略该费。没有证明不存在任何免费赞助／特殊处理器；只是**目前未验证出可用零费用路径**。

## 可重复工具

```sh
node research/tapeweave/demo/check-manufacturing-fees.mjs HISTORICAL_BLOCK_HEX > /tmp/tapeweave-fees.json
```

固定官方前端工厂和两个公开RPC，仅调用chainId／getCode／eth_call；没有钱包、发送、估Gas、state override或自动充值。必须指定历史块，不接受latest。任何失败退出非零并保留已读取记录。即使某样本返回零，也不会自动放行制造：未知费用／权限仍须确认。

本轮执行：语法检查通过；非法块在网络请求前拒绝；真实RPC两次均取得第一端8条响应后第二端失败。未运行本轮全套Node或Chrome，不沿用历史全套通过为本轮结论。没有制造、项目绑定、真实宿主交易、独立任务、视频或投稿新证据。

## 执行边界

用户已授权开发与后续真实集成，专用账户已建；限制不是开发授权缺失，而是**费用上限零且尚无可用零费路径**。本轮据此停止写链。后续可以继续离线工程／免费只读核验；不得绕过预算、借用别人电路冒充本项目或自动充值。真实交易仍需展示具体目标、用途和费用并遵循钱包确认流程。
