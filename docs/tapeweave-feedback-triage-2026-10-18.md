# 已收到测试记录：范围与修复分流

接收日期：2026-10-18（America/Los_Angeles）；原记录日期：2026-10-19（Asia/Shanghai）。两者保留各自时区，不改写原测试日期。

## 原始材料

- ![ANDROID-01.md](attachment:attachments/TYuUSaRB5IRcLAwGrZIzT/EcszO0__9zQI64bRAqMx0.md)
- ![NOVICE-01.md](attachment:attachments/TYuUSaRB5IRcLAwGrZIzT/Ql4Be1R7UtqiLc4H7dl8P.md)
- ![RECORD-01.md](attachment:attachments/TYuUSaRB5IRcLAwGrZIzT/L18uI6-HnFqVPJsUkoqHZ.md)
- ![desktop-exhibit-evid.jpg](attachment:attachments/TYuUSaRB5IRcLAwGrZIzT/8scX77fH-ahJ96jbwW5Yb.jpg)
- ![novice-empty-error.jpg](attachment:attachments/TYuUSaRB5IRcLAwGrZIzT/CYT7NhSZUioL0c0qfv2TP.jpg)
- ![trust-tamper-rejecte.jpg](attachment:attachments/TYuUSaRB5IRcLAwGrZIzT/O0XIyBNuOw6qXfGvS7i-9.jpg)

## 执行者归属更正（依用户最新确认）

用户明确更正：这些反馈来自真人用户测试。本整理采用“用户确认的真人桌面测试反馈”，不再将其结论归为AI模拟。原附件及TRUST-01原文曾写AI执行／模拟，与最新确认存在表述冲突；此处公开记录更正依据，而非静默删除原文或冒充已独立核验身份。不收集私人身份材料。真人测试不等于独立开发者已接入，也不等于Android真机已完成。

已读记录，不再要求重复提交。发布SHA和Chrome版本未知，不补造。附件是原始记录，以下整理不覆盖首次失败。

## 已有结果

- ANDROID-01：Android九项均incomplete；桌面补充实际覆盖复制、试用、刷新恢复、标题保留、规则变化拒保留、追加回退、错误SHA保护和展览复核。不能把这些推广为手机通过。
- NOVICE-01：空输入和残缺JSON拒绝且保留原局，但英文错误提示体验fail；误改制作字段会暂停试用，恢复有效，但指引不足；64步上限及稳定后恢复在所测样例中有效。
- RECORD-01：独立开发者接入incomplete，没有自己的页面或接入代码；真人执行桌面测试的归属按用户最新确认更正。作者页面试用不算独立接入或普通方案成本比较。
- 展览截图：显示两站完成与篡改库存拒绝；只是所示样例，不认证实际用时或采用。
- 新增篡改截图：管理页显示“复核失败：操作记录计算不一致”，属于预期拒绝。标题包含HTML探针字符串不等于已证明执行或完整XSS防护；截图不能证明当前局不变，也没有配套完整攻击记录。

## 后续收到的T01—T12结构化记录

用户在本任务直接粘贴了12个case，随后补齐TRUST-01叙述报告：2026-10-19上海时间、谨慎接收者角色、macOS桌面Chrome（原文写AI模拟，现按用户最新确认登记为真人测试）、页面控件黑盒操作及只读DOM检查。浏览器版本、发布SHA及可靠分段计时仍未知。它补充了前述篡改截图的上下文，但不扩展为完整安全审计。

- T01—T06：作品层认证标记、chain_identity、artifact证据、request与字节不一致、非二进制next、未知scene均被拒；所回传标题与第1步状态保持基准值。仅支持这些样例中的拒绝及可见状态保护，不证明所有存储字段均无变化。
- T07：有效HTML文本探针包被装载到第0步，标题可见为文本；回传svgInserted／boldInserted为false。合法装载从零符合既有设计，不应把它误判成失败导入覆盖。
- T08：有效两步记录显示计算一致但未认证；标题及观察中的SVG／b探针没有插入DOM（回传svgInserted／boldInserted／noteInserted均false）。仅支持所测文本展示路径，不是全面XSS保证。
- T09—T11：记录伪造认证、轨迹request和old篡改分别拒绝，与截图一致；这是预期保护，无需为拒绝本身修改实现。
- T12：只改自报结果与观察后仍计算一致，符合当前产品边界。这些文字可由填写者改写，不受来源认证；不能把原pass或后改fail当成已核验真实使用证据。

TRUST-01另记录：复核后回work恢复仍为探针作品byte第2步，未覆盖执行存档；随后重新装载干净基准包并补能，最终存档为“来源检查基准”、byte第1步、状态1。此为原执行者回传观察，不是本轮重新执行的证明。

结论：接收并保留12例的成功保护观察，没有已确认漏洞需要据此修改；真人归属按用户确认登记，不新增独立身份核验、采用或安全认证声明。它们不改变Android及独立接入incomplete结论。

## 本轮最小修复

| 问题 | 处理 | 边界 |
|---|---|---|
| UX-01 默认说明与模板不一致 | 切预设同步仍为默认值的说明；保留自定义说明并提醒检查名称／说明 | 不自动覆盖作者标题，不保证自定义内容符合规则 |
| UX-02 空包／残缺JSON英文错误 | 区分空内容、JSON语法错误、结构错误，给中文补救提示 | 不猜具体错误字段；校验失败仍不装载、不写新局 |
| UX-03 编辑后预览停用缺恢复提示 | 在预览就近说明暂停及恢复入口，提示未存内存局不可恢复 | 不取消停用保护，不自动恢复或覆盖作者编辑 |

本轮仅有作者自动回归，不将修复写成原执行者已复测通过。

## 保留而非声称修复

- OBS-01：刷新立即恢复首次未生效，稳定后重试有效；原因未知，未确认产品缺陷，不声称已修复。
- 首次访问ERR_CONNECTION_CLOSED：重载成功，未定位网络或产品归因。
- 已追加升级：初始化完成后将章节DOM阅读／键盘顺序同步为01／02／03／04，保留原双栏布局；恢复按钮在模块处理器就绪前禁用并显示初始化中，避免过早点击没有处理器。新增作者Chrome断言覆盖就绪状态及阅读顺序。这是对OBS-01可能时机的防护，不等于确认其根因或已由原执行者复测；网络加载失败仍未定位。
- Android真机与独立接入仍incomplete；不重复要求已做过的桌面流程。
- Account 2部署及广播继续暂停；无新交易、外联、收费或投稿。
