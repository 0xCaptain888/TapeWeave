// UI copy only. Never translate serialized evidence, user input or contract data.
export const messages = Object.fromEntries(`
主导航|Main navigation
作品交付|Create & deliver
作品管理|Manage works
规则工作室|Rule studio
行为挑战|Behavior challenge
TapeWeave 互动作品交付|TapeWeave — Create & deliver
让你的想法，|Turn your ideas into
成为可交付的互动。|interactions you can deliver.
制作一个可运行的互动作品，复制作品包给接收者；接收者可以试用、记录问题，开发者也可以接入自己的页面。当前仅本地有限规则，不发交易，不上传数据。|Build a runnable interaction and share its package. Recipients can try it and report issues; developers can integrate it into their own pages. This is a local finite-rule prototype: no transactions or uploads.
编辑与管理作品 ↗|Edit & manage works ↗
开发者接入指南 ↗|Developer integration guide ↗
体验双应用互动展览 ↗|Try the two-application exhibit ↗
查看真实主网运行与实时状态 ↗|View mainnet runs & live state ↗
本地创作工作台 · 无钱包 · 不上传数据|Local workbench · No wallet · No uploads
01 / 设计行为|01 / Design a behavior
作品名称|Work title
接收者应如何使用、预期发生什么|Instructions and expected behavior
行为模板|Behavior template
蓄能释放：先补能，再触发；释放后消耗能量|Charge & release: charge, then trigger; release consumes energy
交替响应：第一次触发有效，第二次无效，循环交替|Alternating: first trigger works, second does not; repeat
使用高级工作室创作包|Use an advanced studio artifact
高级：导入自定义创作包|Advanced: import a custom artifact
仅custom使用，最多16 KiB|Custom template only; maximum 16 KiB
展示场景|Presentation scene
点亮灯泡：有效请求时亮一下|Lamp: light up for an effective request
揭开内容：有效请求后保持揭开|Reveal: keep content revealed after an effective request
生成作品并预览|Generate & preview
两个场景由作者自编，只展示同一行为的不同效果，不代表已有独立应用接入。自定义规则仍受单状态位、两个输入的限制。|Both scenes are author-built examples of different effects from one behavior, not independent integrations. Custom rules are limited to one state bit and two inputs.
03 / 分享与接收|03 / Share & receive
作品包（复制分享；不含成绩）|Work package (shareable; no scores)
复制作品包|Copy work package
接收者粘贴作品包（最多32 KiB）|Paste a received package (maximum 32 KiB)
校验并试用（从零开始）|Validate & try from zero
已有进度？先比较接收的新版本|Have progress? Compare the received version first
比较当前作品与粘贴包|Compare current work with pasted package
进度处理|Progress handling
请选择|Choose an option
保留步骤（仅同规则、同场景）|Keep steps (same rule and scene only)
明确从零开始|Explicitly restart from zero
确认采用已比较版本|Apply the compared version
升级前的旧局备份（应用成功后生成，请手动复制）|Previous session backup (generated after applying; copy manually)
这是接收者手动选择，不查询远程最新版，不认证发布者。规则或场景改变不迁移旧状态；保留步骤会重算，不授予新奖励。旧局备份不是自动回退入口。|The recipient chooses manually. No remote updates or publisher authentication. Changed rules or scenes cannot inherit old state. Kept steps are recomputed without granting rewards. The backup is not an automatic rollback.
仅生成或导入成功后替换试用作品。校验失败保留原试用；修改制作字段会清空旧交付并停用旧预览。成功装载会开始新的本机执行存档；需保留旧进度时先恢复，不要重新装载。不会自动运行导入内容中的代码。|Only a successful build or import replaces the trial. Invalid imports preserve it; editing clears the old delivery and disables its preview. Loading starts a new local journal. Restore first to keep progress. Imported code is never executed.
02 / 交互预览|02 / Interaction preview
尚未装载作品|No work loaded
执行对照|Execution baseline
电路字节计算|Circuit byte evaluation
普通共享真值表（同等规则）|Shared truth table (equivalent rules)
重新试用|Restart trial
恢复本机执行存档|Restore local execution
等待作品|Waiting for a work
按钮每次推进一步；补能本步不触发。灯泡只在本步有效时亮，揭开场景在本次试用中保持效果。规则只返回请求，实际效果由页面决定；最多64步。|Each click advances one step. Charging does not trigger in that step. The lamp lights only for an effective step; reveal persists for the trial. Rules return requests; the page decides the effect. Maximum 64 steps.
本次试用过程（本地、未认证）|Trial trace (local, unauthenticated)
步|Step
旧态|Old state
触发|Trigger
补能|Charge
新态|Next state
请求|Request
等待|Wait
04 / 反馈与验收|04 / Feedback & acceptance
符合我的预期|Meets my expectations
不符合预期|Does not meet expectations
尚未完成|Not completed
实际用途、观察、遇到的问题和获得的帮助|Actual use, observations, issues and help received
生成本地验收记录|Generate local acceptance record
复制验收记录|Copy acceptance record
记录只由填写者自报，无身份认证、上传或签名；计算一致不证明真实使用、独立采用、付费或商业价值。分享前请移除个人信息。|Records are self-reported: no identity verification, upload or signature. Consistent computation does not establish real use, independent adoption, payment or commercial value. Remove personal information before sharing.
已复制|Copied
请手动复制已选中的文本|Please copy the selected text manually
💡 灯亮了|💡 Lamp on
○ 灯未亮|○ Lamp off
✦ 内容已揭开|✦ Content revealed
▧ 内容尚未揭开|▧ Content not revealed
制作字段已修改，当前试用已暂停。可点击上方“恢复本机执行存档”恢复原进度；尚未保存的内存试用无法恢复。|Fields changed; the trial is paused. Use Restore local execution to recover saved progress. Unsaved in-memory trials cannot be restored.
已同步默认使用说明；请检查作品名称和展示场景是否合适。|Default instructions updated. Check the title and presentation scene.
已保留自定义说明；请检查说明和作品名称是否符合新模板。|Custom instructions preserved. Check that the instructions and title match the new template.
已校验并开启接收者试用；作品未经身份认证。|Validated; recipient trial started. Publisher identity is not authenticated.
浏览器存储不可用，本次仅内存运行|Browser storage unavailable; this session runs in memory only
浏览器存储不可用|Browser storage unavailable
没有本机执行存档|No local execution saved
已重算并恢复本机存档；不是认证使用记录|Local execution recomputed and restored; this is not authenticated usage
其他页面已更改存档，请先恢复最新存档|Another page changed the save. Restore the latest save first.
生成的是自报记录，不是独立采用或认证成绩。|This is a self-reported record, not independent adoption or an authenticated score.
请先装载或恢复当前作品|Load or restore a work first
当前局已变化，请重新比较|The current session changed. Compare again.
已保留并重算原步骤；旧局备份已生成|Steps preserved and recomputed; previous session backup generated
已从零开始；旧局备份已生成|Restarted from zero; previous session backup generated
TapeWeave 作品管理|TapeWeave — Manage works
编辑、保存与复核作品|Edit, save & review works
返回作品试用与交付|Back to create & deliver
。所有数据仅在本浏览器，清理站点数据会丢失；请复制作品包备份。版本号是本机库内序号，不是认证身份或链上版本。|. Data stays in this browser and is lost when site data is cleared. Copy packages as backups. Version numbers are local library indexes, not authenticated identities or onchain versions.
1. 条件与动作编辑|1. Edit conditions & actions
每行描述“处于这个状态、收到这些输入时，下一步是什么状态、是否请求效果”。补能和触发可以同时输入；作品试用页的按钮每次只给一个输入。初始状态固定为未蓄能。请求不等于权限授权。|Each row defines the next state and effect request for a state and inputs. Charge and trigger can be simultaneous; trial buttons supply one input at a time. Initial state is uncharged. A request is not authorization.
名称|Name
说明|Description
场景|Scene
灯泡|Lamp
揭开|Reveal
当前状态|Current state
下一状态|Next state
效果请求|Effect request
生成作品包|Generate work package
作品包／待保存包|Work package / package to save
编辑条件会清空旧包。生成后复制到作品页即可试用；下方装载版本只装载包，不恢复玩家进度。|Editing clears the old package. Copy a generated package to the work page to try it. Loading a library version loads its package, not player progress.
2. 本机作品库与版本|2. Local library & versions
库内标识（自己命名，同标识追加版本）|Library ID (choose a name; same ID appends a version)
保存新版本|Save new version
刷新列表|Refresh list
比较与回退|Compare & roll back
列表中选择比较基准，再比较任意版本。回退会追加一个内容相同的新版本，不删除历史；不会迁移执行状态或更新接收方。|Choose a baseline in the list, then compare any version. Rollback appends a new version with the old content without deleting history. It does not migrate execution state or update recipients.
复制备份与空库恢复|Copy backup & restore an empty library
生成作品库备份|Generate library backup
未认证归档文本（复制到自己的安全位置，恢复时粘贴）|Unauthenticated archive (copy to a safe location; paste to restore)
校验并恢复到空库|Validate & restore into an empty library
只允许空库恢复，失败不覆盖；没有合并、删除、自动上传或认证。执行进度不在作品库归档中。|Restore is allowed only into an empty library. Failure never overwrites data. No merge, deletion, automatic upload or authentication. Execution progress is not included.
最多100件作品、每件20版。不自动更新接收方，不覆盖旧版本；包内容相同则拒绝重复保存。本地存储不是跨标签页原子事务或安全备份。|Up to 100 works, 20 versions each. No recipient auto-updates or old-version overwrites. Identical content cannot be saved twice. Browser storage is not a cross-tab atomic transaction or secure backup.
3. 复核接收者返回的记录|3. Review a recipient record
粘贴验收JSON（最多64 KiB）|Paste acceptance JSON (maximum 64 KiB)
仅复核，不装载|Verify only; do not load
只重算轨迹及核对字段。自报结果和观察不认证，不能证明接收者身份、真实使用或付费。|Only traces and fields are recomputed. Self-reported outcomes and observations are not authenticated and do not prove recipient identity, real use or payment.
已蓄能|Charged
未蓄能|Uncharged
不请求|No request
请求效果|Request effect
编辑已改变，请重新生成|Edits changed. Generate again.
已生成；复制到作品页试用，或保存新版本。|Generated. Copy to the work page to try, or save a new version.
TapeWeave · 互动展览实验|TapeWeave — Interactive exhibit experiment
返回创作工作台|Back to workbench
借一束光，|Borrow a light.
把故事带到下一站。|Carry the story to the next stop.
一件作者制作的互动微展览 · 约两分钟 · 无钱包|An author-built interactive micro-exhibit · About two minutes · No wallet
实验任务：在展签应用中领取能量、揭开故事；在纪念印章应用中领取能量、兑换一枚印章。两个应用装载相同作品行为，但状态和资源独立。它们都是作者示例，不是独立团队采用。|Task: charge and reveal a story in the exhibit, then charge and claim a stamp at the post office. Both load the same behavior but keep independent state and resources. These are author-built examples, not independent adoption.
你的观展路线|Your exhibit route
点击“开始全新任务”，从第一站借光。|Click Start a new journey and borrow a light at the first stop.
完成标准：A揭开故事，B获得虚拟印章。两站各自领取能量；不是把A的余额带到B。|Complete both: reveal the story in A and receive a virtual stamp in B. Charge separately at each stop; A's balance does not carry into B.
开始观展|Begin the exhibit
作品包（可留空使用默认蓄能行为）|Work package (leave blank for default charge behavior)
公平执行对照|Equivalent execution baseline
电路字节|Circuit bytes
普通共享真值表|Shared truth table
开始全新任务|Start a new journey
路线提示按默认蓄能规则编写；自定义包可能不满足任务，需检查轨迹，不保证完成。两种模式使用相同接口、输入和应用规则；不会证明TapeOut更快或更有价值。模式改变后必须重新开始。无钱包、上传或真实兑换。|Route hints assume the default charge rule. Custom packages may not complete the task; inspect the trace. Both modes use the same interface, inputs and app rules, without proving TapeOut faster or more valuable. Restart after changing modes. No wallet, upload or real redemption.
第一站 / 借光书屋|Stop 1 / The Light Library
应用A · 互动展签|Application A · Interactive exhibit
灯还没有亮|The light is not on yet
在这里借一束光，照见被折起的故事。|Borrow a light to reveal a story folded away.
你可以重复查看故事，但只在首次有效请求时揭开。先领取能量，再揭开。|You can revisit the story, but it reveals only on the first effective request. Charge first, then reveal.
领取能量|Collect energy
揭开故事|Reveal the story
第二站 / 回声邮局|Stop 2 / The Echo Post Office
应用B · 纪念印章|Application B · Commemorative stamp
回声|Echo
空白的纪念页|A blank keepsake page
邮局有自己的能量与一枚虚拟印章。书屋的进度不会替你领取。|The post office has its own energy and one virtual stamp. Library progress does not claim it for you.
本地虚拟纪念物 · 无资产或兑换价值|Local virtual keepsake · No asset or redemption value
本次实验仅一枚库存。行为有效也不能绕过应用库存；没有库存时不推进规则。|This experiment has one stamp in stock. An effective request cannot bypass inventory. An empty stock does not advance the rule.
兑换纪念印章|Claim the commemorative stamp
这件作品展示了什么？|What does this work demonstrate?
书屋把有效请求变成故事，邮局把同一请求变成印章；作者交付的是行为，应用保留内容、库存和权限。这里两站均由作者制作，尚无独立采用证据，普通共享方案也可以完成相同任务。|The library turns a request into a story; the post office turns the same request into a stamp. Creators deliver behavior; applications retain content, inventory and permissions. Both examples are author-built, without independent adoption evidence. Ordinary shared code can perform the same task.
回到工作台，制作并交付自己的行为 ↗|Back to the workbench: create & deliver your own behavior ↗
展开同一行为与两站的逐步轨迹|Expand the shared behavior and both step-by-step traces
生成本次未认证实验记录|Generate unauthenticated experiment record
记录是作者应用在本浏览器计算的轨迹，非玩家身份认证、独立采用、链上回执或商业收益。用普通方案完成同任务后，应另行记录学习、帮助、失败与维护成本；这里不自动生成比较结论。|Records are traces computed by the author's apps in this browser, not authenticated players, independent adoption, onchain receipts or revenue. Record learning, assistance, failures and maintenance costs separately for the ordinary baseline; no comparative conclusion is generated here.
接收者复核记录|Recipient record verification
粘贴上方记录，重新计算两站行为、故事状态和邮局库存；不改变当前任务。耗时只核格式，不证明实际用时；计算一致也不证明真人、独立采用或链上消费。|Paste the record to recompute both behaviors, story state and stamp inventory without changing the current task. Elapsed time is checked only for format. Consistency does not prove a real person, independent adoption or onchain consumption.
待复核JSON|JSON to verify
实验记录|Experiment record
完成的应用任务数|Completed application tasks
正在重新计算…|Recomputing…
计算一致，但未认证；不证明实际用时或独立采用。|Computation matches, but is unauthenticated; it does not prove actual duration or independent adoption.
复核失败：|Verification failed: 
光不是被带走，而是被再次点亮|Light is not taken away; it is lit again
有人把一束光折进纸页。书屋用它照见故事，邮局用它留下回声。相同的点亮方式，在不同地方成为不同的作品。|Someone folded a light into a page. The library reveals a story; the post office leaves an echo. The same behavior becomes a different work in each place.
回声 · 已留念|Echo · Keepsake received
你在邮局留下了一枚虚拟回声印章。库存已用完，再多行为请求也不能增加印章。|You received a virtual Echo stamp. Stock is now empty; additional requests cannot create more stamps.
两站完成：同一行为，不同效果，各自状态。|Both stops complete: one behavior, different effects, independent state.
第一站已有能量，点击“揭开故事”。|Stop 1 is charged. Click Reveal the story.
第一站：先领取能量，再揭开故事。|Stop 1: collect energy, then reveal the story.
第二站已有能量，点击“兑换纪念印章”。|Stop 2 is charged. Click Claim the commemorative stamp.
第一站已完成。第二站需要单独领取能量，再兑换印章。|Stop 1 complete. Collect energy separately at Stop 2, then claim the stamp.
可生成本次记录，或切换普通真值表，从零完成同一任务。记录不证明身份或商业价值。|Generate a record, or switch to the shared truth table and repeat from zero. Records do not prove identity or commercial value.
故事：把一个互动想法交到另一位创作者手中。|Story: deliver an interactive idea to another creator.
故事尚未揭开|Story not yet revealed
库存已空；应用拒绝，规则不推进|Stock is empty; the application rejects the request without advancing the rule
行为发出有效请求，由本站决定效果。|The behavior made an effective request; this application decides the effect.
本步没有有效请求；默认蓄能规则需先领取能量，再使用。|No effective request this step. The default rule requires charging before use.
TapeWeave AA 钱包入口|TapeWeave — AA wallet
普通钱包与主网记录|Ordinary wallet & mainnet evidence
插件／Android 验收|Plugin / Android acceptance
使用 AA 钱包运行行为卡|Run behavior cards with an AA wallet
此入口适配支持 EIP-5792 2.0.0 的已部署合约账户，在 X Layer 主网（196）逐笔运行。钱包负责构造、签名和提交；网页不持有私钥，也不会自动升级账户。普通 EOA 使用|This entry supports deployed smart accounts with EIP-5792 2.0.0 on X Layer mainnet (196), one operation at a time. The wallet constructs, signs and submits. This page holds no private keys and never upgrades an account automatically. Ordinary EOAs should use the
普通钱包入口|ordinary wallet entry
。官方 OnchainOS 工具账户不一定通过浏览器插件暴露相同地址或能力。|. An official OnchainOS tool account may not expose the same address or capabilities through a browser extension.
连接与能力检测|Connection & capabilities
检测到的钱包|Detected wallet
Connect Wallet · 检测 AA 能力|Connect Wallet · Check AA capabilities
正在初始化。连接不发送交易。|Initializing. Connecting does not submit a transaction.
正在检查浏览器入口…|Checking browser support…
只读检测连接问题|Diagnose connection (read-only)
复制诊断报告|Copy diagnostic report
查看公开连接诊断（不含签名）|View public connection diagnostics (no signatures)
诊断只读取钱包已授权账户、网络、账户代码及能力，不申请签名、不发送交易、不上传报告。若返回普通／未部署账户，使用|Diagnostics read authorized accounts, network, account code and capabilities only. No signature, transaction or upload. For ordinary or undeployed accounts, use the
；若 AA 能力不支持，使用对应官方 AA 工具，不要反复重发。|; if AA capabilities are unsupported, use the appropriate official AA tool. Do not repeatedly resubmit.
钱包必须已支持本链的原子调用能力。返回“需要升级”、不支持方法、未部署或普通账户时停止；不自动改用 eth_sendTransaction 或请求账户升级。|The wallet must already support atomic calls on this chain. Stop if it requires an upgrade, lacks the method, or returns an undeployed or ordinary account. No fallback to eth_sendTransaction or account-upgrade request.
一局四步，每笔单独确认|Four-step run; confirm each operation
模拟并预览新局|Simulate & preview a new run
读取会话|Read session
建议顺序：等待 → 等待 → 触发 → 触发。|Suggested sequence: Wait → Wait → Trigger → Trigger.
我会在钱包界面核对最终费用、账户和调用；本页只模拟内部宿主调用，未取得完整 UserOperation 签名前模拟及总费用。|I will check final fees, account and call in the wallet. This page simulates only the internal host call, not the full unsigned UserOperation or total fee.
确认并打开 AA 钱包|Confirm & open AA wallet
只发一笔零价值宿主调用，没有代币授权。gas 及赞助资格由钱包决定，本页不承诺免费。不能把内部 eth_call 成功当作完整 AA 验证、费用通过或签名成功。|One zero-value host call, with no token approval. The wallet determines gas and sponsorship; this page does not promise free execution. A successful internal eth_call does not prove complete AA validation, approved fees or signing success.
待处理请求与恢复|Pending request & recovery
没有待处理请求|No pending request
向原钱包查询请求状态|Query request status from the original wallet
手动恢复：真实链上交易哈希|Manual recovery: actual onchain transaction hash
核对并绑定交易哈希|Check & bind transaction hash
核验已绑定的 AA 回执|Verify bound AA receipt
先保存请求 ID 再打开钱包。刷新、拒绝以外的异常或不明结果都保留意图，不重复发送；钱包状态仅提供候选哈希，必须另外从公共 RPC 核验。钱包终止或链上回滚时保留记录供人工处理，不自动解锁发送。|The request ID is saved before opening the wallet. Refreshes, non-rejection errors and unknown outcomes preserve the intent without resending. Wallet status provides only a candidate hash, which must be checked through public RPC. Terminated or reverted operations remain for manual review; sending is not automatically unlocked.
本页只接受固定 EntryPoint v0.7 的成功 UserOperation；宿主事件必须位于原 AA 的操作日志区间，并核对版本、完整宿主代码、规范块与至少两块深度。不会重新验证签名，也不支持任意批量调用、其他 EntryPoint 或钱包专有接口。|Only successful UserOperations at the pinned EntryPoint v0.7 are accepted. Host events must fall within the original AA operation's log range; version, full host code, canonical block and at least two-block depth are checked. Signatures are not reverified. Arbitrary batches, other EntryPoints and proprietary wallet interfaces are unsupported.
导出本机 AA 回执记录|Export local AA receipt records
已核验结果先写本机历史，再清除意图。历史与导出只含公开操作信息，未签名且不是插件／真人身份认证。不要清站点数据来解决未知交易。|Verified results are saved locally before clearing the intent. History and exports contain public operation data only; they are unsigned and do not authenticate a plugin or person. Do not clear site data to resolve an unknown transaction.
兼容性、恢复和实际验收说明|Compatibility, recovery & real acceptance guide
填写实际插件／Android 验收|Record actual plugin / Android acceptance
`.trim().split('\n').map(line => { const at=line.indexOf('|'); return [line.slice(0,at),line.slice(at+1)]; }));
Object.assign(messages,Object.fromEntries(`
TapeWeave 主网运行与实时读取|TapeWeave — Mainnet runs & live reads
两张卡，真实主网运行|Two cards. Real mainnet runs.
已完成 AA 钱包部署与两局主网交互。你可以用自己的插件钱包开启独立会话，也可以不连接钱包，只读取下方的历史记录。|An AA wallet deployed the host and completed two mainnet runs. Start your own session with a browser wallet, or inspect the historical evidence below without connecting.
AA 钱包原生调用入口|AA wallet native-call entry
真实插件／Android 验收|Actual plugin / Android acceptance
用自己的钱包玩一局|Play a run with your own wallet
普通插件账户 · X Layer 主网（196）。每笔先模拟、预览费用，再由你在钱包确认。建议顺序：等待 → 等待 → 触发 → 触发。AA／委托账户请使用|Ordinary browser accounts · X Layer mainnet (196). Each call is simulated and its fee previewed before you confirm in the wallet. Suggested order: Wait → Wait → Trigger → Trigger. AA / delegated accounts should use
官方钱包工具|official wallet tools
钱包|Wallet
检测并连接钱包|Detect & connect wallet
切换至 X Layer|Switch to X Layer
未连接钱包|Wallet not connected
行为卡|Behavior card
蓄能卡|Charge card
交替卡|Alternating card
预览新局|Preview a new run
我的会话 ID|My session ID
读取我的会话|Read my session
开局后读取链上状态；每局四步。|Read onchain state after opening; four steps per run.
预览等待|Preview Wait
预览触发|Preview Trigger
确认并打开钱包|Confirm & open wallet
连接钱包后开始；不会自动签名或发送。|Connect to begin. No automatic signatures or submissions.
待处理交易|Pending transaction
从钱包历史复制交易哈希|Copy a transaction hash from wallet history
绑定恢复哈希|Bind recovery hash
核验交易回执|Verify transaction receipt
待处理记录保存在本机。结果不明时不能重发；请保留站点数据。浏览器关闭后可回到本页继续核验。|Pending records are stored locally. Do not resend an unknown outcome or clear site data. Return here after reopening the browser to continue verification.
我的会话与交易历史|My sessions & transaction history
正在读取本机记录…|Reading local records…
当前账户的会话|Sessions for the current account
读取所选会话并续用|Read & continue selected session
查看本机交易记录|View local transaction records
从链上发现已有会话（只读、分段扫描）|Discover onchain sessions (read-only, bounded scans)
只查询固定宿主、当前钱包账户的开局事件。公共端点每段最多100块，不自动扫描全链；查询失败不推进起点。可填入已知开局交易附近的区块，发现后选择会话并重新读取状态。|Queries open events for the pinned host and current account only, up to 100 blocks per segment. No automatic full-chain scan; a failed scan does not advance the cursor. Start near a known opening transaction, then select and read a discovered session.
起始区块（十进制）|Start block (decimal)
本段区块数|Blocks in this segment
扫描当前账户的下一段|Scan next segment for this account
导出／合并历史备份|Export / merge history backup
备份是未签名的本机缓存。导入不恢复发送权限，不覆盖待处理交易；同哈希冲突或损坏数据拒绝合并。最多500笔回执、1000个发现会话、1 MiB。|Backups are unsigned local caches. Import does not restore sending permission or overwrite pending transactions. Conflicting hashes or corrupt data cannot merge. Limits: 500 receipts, 1,000 discovered sessions, 1 MiB.
生成历史备份|Generate history backup
校验并合并粘贴的备份|Validate & merge pasted backup
复制备份，或在这里粘贴完整 JSON|Copy the backup, or paste complete JSON here
操作、恢复与验证边界|Operation, recovery & verification limits
· 主网操作可能需要 gas；历史 AA 交易的 0 费用不代表普通插件账户免费。|· Mainnet operations may require gas. Zero fees for historical AA transactions do not make ordinary wallet calls free.
主网交易记录 · 2026-10-26|Mainnet transaction evidence · 2026-10-26
正在载入公开运行记录…|Loading public run evidence…
行为卡／会话|Card / session
训练分数|Training score
开门次数／余钥匙|Doors opened / keys remaining
下载公开回执与运行记录 JSON|Download public receipts & run JSON
部署、费用及复核说明|Deployment, fees & verification guide
这是作者发布的历史快照，不是独立用户或签名凭据。完整核验工具重新获取部署、事件与历史状态；本页实时读取只核当前运行时代码及当前会话，不重新验证 11 笔历史交易。|This author-published historical snapshot is not independent-user or signature evidence. The full verifier retrieves deployment, events and historical state. Live reads here check current runtime code and sessions, not all 11 historical transactions.
实时读取链上会话|Read a live onchain session
选择已运行的会话后点击读取，不需要连接钱包。默认宿主会与公开记录中的完整运行时代码逐字节对比；自填候选地址只做未认证读取。|Choose a completed session and read without a wallet. The default host is compared byte-for-byte with the published full runtime code. Custom addresses receive unauthenticated reads only.
读取蓄能卡会话|Read charge-card session
读取交替卡会话|Read alternating-card session
宿主地址|Host address
会话ID|Session ID
从公共 RPC 读取固定块会话|Read session at a pinned block via public RPC
用两个端点交叉核验（只读）|Cross-check two endpoints (read-only)
交叉核验仅支持已发布宿主，不需要连接钱包。比较两个公开端点在同一固定块的哈希、完整宿主代码与会话状态；失败不会降级成“两端一致”。两端可能共享基础设施，不代表独立信任或最终性证明。|Cross-checking supports the published host without a wallet. It compares the same block hash, full runtime and session across two public endpoints. Failure is not downgraded to agreement. Endpoints may share infrastructure; this is not independent trust or finality proof.
开发者：生成调用草案（不发送）|Developers: draft a call (do not send)
此工具只生成草案，不签名、不广播；上方钱包试玩需要单独确认。|This tool only drafts calls; no signing or broadcast. Wallet gameplay above requires separate confirmation.
操作|Operation
开局|Open run
动作|Action
审查卡|Reviewed card
蓄能 ID1|Charge ID1
交替 ID2|Alternating ID2
预期版本|Expected version
生成未验证草案|Generate unverified draft
草案不代表模拟通过。真实发送前核对钱包、最新版本、模拟和费用；过期版本必须失败，不能自动改版本重发。只读是单 RPC 观察，不是独立提供商共识。|A draft is not a passed simulation. Check the wallet, latest version, simulation and fees before sending. Stale versions must fail, not be silently updated and resent. Single-RPC reads are not independent provider consensus.
部署后操作与完整回执核验工具|Post-deployment operations & full receipt verifier
本地行为工作室|Local behavior studio
未发送调用草案|Unsent call draft
等待公开记录载入|Waiting for public evidence
部署交易|Deployment transaction
历史运行快照已载入；实时状态尚未读取。|Historical snapshot loaded; live state has not been read yet.
运行记录载入失败：|Failed to load run evidence: 
仅生成草案，宿主身份未验证；没有发送或模拟。|Draft only. Host identity is unverified; no submission or simulation.
响应过大|Response too large
RPC响应错误|Invalid RPC response
非法交易哈希|Invalid transaction hash
记录格式错误|Invalid evidence format
交易记录不完整|Incomplete transaction evidence
会话记录错误|Invalid session evidence
不是X Layer196|Network is not X Layer 196
TapeWeave 插件与 Android 验收|TapeWeave — Plugin & Android acceptance
普通钱包|Ordinary wallet
AA 钱包|AA wallet
打开作品页|Open workbench
插件与 Android 实际验收|Actual plugin & Android acceptance
先实际执行，再填写观察。所有条目初始为“未完成”；本页不会操作钱包、自动判通过或上传。填写内容只在你点击保存草稿后保存在本机；换类型前先导出，清站点数据会丢失。不要填写个人身份、助记词、私钥或其他秘密。桌面模拟／移动视口不算 Android 真机。|Perform each task before recording observations. All items begin incomplete. This page does not operate a wallet, automatically pass tasks or upload data. Save drafts explicitly; export before changing task type. Clearing site data loses drafts. Do not enter identity details, recovery phrases, private keys or secrets. Desktop emulation is not an actual Android device.
验收任务|Acceptance task
Android 真机九项|Nine actual Android checks
真实普通钱包插件|Actual ordinary wallet extension
真实 AA 钱包原生调用|Actual AA native wallet calls
设备型号与实际系统|Device model & actual operating system
浏览器与钱包版本|Browser & wallet versions
被测提交 SHA|Tested commit SHA
我确实使用了上述实际设备／插件执行所填项目，保留失败和未完成结果。|I used the stated actual device / extension for these tasks, retaining failed and incomplete results.
保存本机草稿|Save local draft
恢复本机草稿|Restore local draft
校验并生成验收 JSON|Validate & generate acceptance JSON
正在初始化…|Initializing…
设备、插件和观察均为自报，不认证独立身份；填写哈希不会自动重验回执。链上通过仍须在钱包页点击核验或重跑公开工具。不能把未执行项改成通过来填满表格。|Device, extension and observations are self-reported, not independent identity verification. Entering a hash does not reverify its receipt. Verify onchain outcomes on the wallet page or with the public tools. Never mark unperformed tasks as passed to complete the form.
Android 九项完整步骤|Full nine-step Android guide
AA 与真实插件验收说明|AA & actual extension acceptance guide
恢复本机执行存档（初始化中）|Restore local execution (initializing)
成功操作后保存到本浏览器；恢复时重算全部步骤。清站点数据会丢失。检测到其他页修改则拒绝覆盖；不是跨页原子事务或认证备份。|Successful actions save in this browser; restoring recomputes every step. Clearing site data loses the save. Changes from another page prevent overwriting. This is not a cross-tab atomic transaction or authenticated backup.
结果|Outcome
请选择，不默认通过|Choose an outcome; no default pass
TapeWeave 人工验收记录|TapeWeave — Manual acceptance records
人工验收记录 · 未认证|Manual acceptance · Unauthenticated
打开工作室|Open studio
完整验收步骤|Full acceptance steps
本页仅整理你实际观察到的结果，不执行测试、不判定独立身份、不上传或自动保存。不要填姓名、联系方式或任何钱包秘密。刷新将丢失内容；提交前请复制保存。|Record actual observations only. This page does not run tests, verify independent identities, upload or autosave. Do not enter names, contact details or wallet secrets. Refreshing loses content; copy it before leaving.
手机任务：默认蓄能卡0011（等、等、触发、触发），预期训练2／门1剩1钥匙；另记录刷新和实际复制粘贴。独立玩家须先预测，再操作，普通模式同规则对照。没有执行或没有同意时，不得记为通过。|Mobile task: default charge card 0011 (Wait, Wait, Trigger, Trigger), expecting training 2 / doors 1 / keys 1. Also record refresh and actual copy/paste. Independent players predict before acting; the ordinary mode is an equivalent baseline. Unperformed or unconsented tests cannot pass.
角色|Role
作者实际手机|Author on actual phone
非作者玩家|Non-author player
创作者|Creator
开发者|Developer
已取得非作者参与者同意（不记录其身份）|Non-author participant consent obtained (identity not recorded)
设备／系统／浏览器|Device / OS / browser
执行模式|Execution mode
字节|Bytes
普通模式|Ordinary mode
两者均实际体验|Actually tried both
操作前预测|Prediction before acting
实际动作及模式顺序|Actual actions & mode order
实际结果（包括分数、资源、刷新、复制等）|Actual results (scores, resources, refresh, copy, etc.)
所需帮助／失败／未完成项（没有则明确写无）|Help needed / failures / incomplete tasks (state none if applicable)
本次任务通过|This task passed
失败|Failed
未完成|Incomplete
生成未认证记录|Generate unauthenticated record
复制记录|Copy record
文字、勾选和角色都可以自报或伪造；本JSON不是独立采用证明、成绩认证或链回执。生成时间也不认证观察时间。失败记录应保留，不为比赛改成通过。|Text, checkboxes and roles are self-reported and can be fabricated. This JSON is not independent adoption, authenticated scores or an onchain receipt. Generation time does not authenticate observation time. Retain failures; do not change them to pass for a contest.
TapeWeave 有限行为工作室|TapeWeave — Finite behavior studio
有限行为工作室 · 实验版|Finite behavior studio · Experimental
第一次使用？先到|First time? Go to the
互动作品交付页|create & deliver page
命名、预览、分享和接收作品；此页用于高级规则编辑。|to name, preview, share and receive works. This page is for advanced rule editing.
编辑真实行为表，编译本地NAND/LATCH字节，在训练与钥匙门宿主中消费。无钱包、无链身份、可导出／装载有限行为创作包，不兼容旧固定两卡挑战包。|Edit behavior tables, compile local NAND/LATCH bytes, and consume them in training and key-door hosts. No wallet or chain identity. Export / import finite-rule artifacts; these are incompatible with the old fixed-card challenge packages.
返回固定挑战|Back to fixed-card challenge
模板|Template
蓄能|Charge
交替|Alternating
行序：旧状态×4＋触发×2＋补能。只编辑下一状态和请求；不能编辑宿主权限。|Row order: old state × 4 + trigger × 2 + charge. Edit only next state and request, not host permissions.
旧状态|Old state
行为单步预览|Single-step behavior preview
预览当前编辑表，不开启新局、不推进或保存。请求不等于宿主奖励；补能只影响计算，不保证本拍触发。|Preview the current table without opening, advancing or saving a run. A request is not a host reward; charging affects computation but does not guarantee a trigger in this step.
预览这一拍（不提交）|Preview this step (do not submit)
编译并开启新局|Compile & start a new run
执行|Execution
字节求值|Byte evaluation
修改执行模式或编译会清零两宿主。编辑表后必须重新编译才可执行。门宿主仅第2／4回合遇门，初始两把钥匙，有效开门才扣钥匙；训练消费每次请求。该差异仅是作者设计，不是真实玩法验证。|Changing mode or compiling resets both hosts. Recompile after editing. The door host encounters doors only in rounds 2 and 4, starts with two keys and spends a key only on a successful opening. Training consumes each request. This is author-designed, not validated gameplay.
重新读取存档（放弃未保存编辑）|Reload saved run (discard unsaved edits)
逐拍双宿主记录|Step-by-step dual-host trace
请求不是奖励：钥匙门仅在有门且有钥匙时产生效果。以下仅为当前本地局的未认证记录；编辑或重新开启会清空显示，恢复存档会重算。|A request is not a reward: the key-door host needs both a door and a key. These are unauthenticated local traces. Editing or restarting clears the view; restoring recomputes it.
训练与钥匙门的逐拍计算|Training & key-door step computation
宿主|Host
回合|Round
遇门|Door encountered
实际效果|Actual effect
生成的行为制品|Generated behavior artifact
chain_identity为null。摘要仅识别字节；导出不包含可信成绩。同源localStorage可用时自动保存编译配置与动作，刷新重算恢复；编辑使旧存档失效，重编译清零。保存不可用时提示内存模式。检测到存档被其他页面更改时拒绝操作；可点击“重新读取存档”放弃未保存编辑并重新加载当前同源存档。其他页面更新时会主动提示；这不是原子锁，仍请勿多标签同时操作：不提供跨标签锁或SQLite事务。任何行为表不等于安全规则。|chain_identity is null. The digest identifies bytes, not trusted scores. When localStorage is available, compiled settings and actions autosave; refresh recomputes them. Editing invalidates the save; recompiling resets it. Storage failures use memory mode. Cross-page changes block actions: reload the save to discard edits. This is not an atomic lock or SQLite transaction; avoid simultaneous tabs. Behavior tables are not security policies.
复制创作包|Copy artifact package
装载创作包|Load an artifact package
仅接受本工作室编译的有限行为表、匹配字节和摘要；不是任意网表上传。全部校验后才清零装载，失败保留当前局；无成绩、认证或链身份。JSON重复键取最后值。|Accepts only studio-compiled finite behavior tables with matching bytes and digests, not arbitrary netlists. Full validation precedes resetting; failure preserves the current run. No scores, authentication or chain identity. Duplicate JSON keys use the last value.
粘贴创作包（最多16 KiB）|Paste artifact package (maximum 16 KiB)
校验并装载创作包|Validate & load artifact
双宿主回放|Dual-host replay
完成四回合后生成未认证回放，包含行为制品、动作、模式与两个宿主结果。任何人均可自造合法记录，计算一致不证明玩家、时间或链消费。复核不装载、不改变当前局；JSON重复键取最后值。|After four rounds, generate an unauthenticated replay containing the artifact, actions, mode and both host results. Anyone can construct a valid record; consistency does not prove player identity, time or onchain consumption. Verification does not load or change the run. Duplicate JSON keys use the last value.
生成四回合双宿主回放|Generate four-round dual-host replay
复制双宿主回放|Copy dual-host replay
粘贴回放复核（最多32 KiB）|Paste replay to verify (maximum 32 KiB)
粘贴回放的复核明细（非当前局、未认证）|Pasted replay verification (not the current run; unauthenticated)
本地行为制品JSON|Local behavior artifact JSON
`.trim().split('\n').map(line=>{const at=line.indexOf('|');return[line.slice(0,at),line.slice(at+1)];})));
// The following groups also cover the advanced local-only demonstration pages.
Object.assign(messages,Object.fromEntries(`
TapeWeave 本地持久宿主|TapeWeave — Local persistent host
本地持久宿主 · SQLite|Local persistent host · SQLite
仅通过本机Node服务运行。不是GitHub Pages后端、账户服务或认证成绩；不连接钱包、不写链。两宿主同一SQLite事务提交，工作室localStorage与这里不自动同步。|Runs only through a local Node service, not a GitHub Pages backend, account service or authenticated score. No wallet or chain writes. Both hosts commit in one SQLite transaction. Studio localStorage does not sync here.
建立或恢复会话|Create or restore a session
会话ID（字母、数字、下划线、连字符，最多80字符）|Session ID (letters, digits, underscores, hyphens; up to 80 characters)
新会话执行模式|New session execution mode
粘贴工作室创作包（最多16 KiB）|Paste studio artifact (maximum 16 KiB)
校验并新建（不覆盖同名）|Validate & create (never overwrite)
读取已有会话|Read existing session
模式仅在新建时生效，已有会话配置固定。刷新后读取本标签页最后一次已加载会话；无删除接口。|Mode applies only to new sessions; existing settings are fixed. Refresh reads this tab's last loaded session. No delete endpoint.
此数据库的已保存会话|Saved sessions in this database
刷新列表（前50项）|Refresh list (first 50)
下一页|Next page
尚未读取列表。仅显示ID、进度与模式，不认证玩家或链身份。|List not loaded. Shows ID, progress and mode only; no player or chain identity authentication.
持久双宿主|Persistent dual hosts
尚未加载|Not loaded
重试上次未确认命令|Retry the last unconfirmed command
提交失败不猜测是否落库：保留命令ID及原载荷，禁用新动作，先重试。重试返回原回执，再读取最新快照；不会把旧回执当成当前版本。多个页面同版本提交时至多一条新命令成功，旧版本冲突须读取最新会话。|Do not guess whether a failed submission committed. Keep the command ID and payload, disable new actions and retry first. Retry returns the original receipt, then reads the latest snapshot. An old receipt is not the current version. At most one new command at a given version succeeds across tabs; read the latest session after a conflict.
当前已读取快照（非认证历史）|Current snapshot (not authenticated history)
效果|Effect
回放交付|Replay delivery
生成已完成会话回放|Generate completed-session replay
复制回放|Copy replay
复制后可在工作室或离线CLI复核。计算一致不证明作者、玩家、时间或链消费。|Verify the copied replay in the studio or offline CLI. Consistency does not prove author, player, time or onchain consumption.
浏览器保留本地访问凭据及待确认命令于本标签页sessionStorage；停止Node服务后凭据失效。若存储不可用则拒绝提交，避免刷新丢失重试信息；同源脚本或本机其他进程仍可能获取凭据。本机凭据不是账户认证，请勿分享启动URL。|Local access credentials and pending commands remain in this tab's sessionStorage. Credentials expire when Node stops. Storage failure blocks submissions to preserve retry data across refreshes. Same-origin scripts or local processes may still access credentials. This is not account authentication; do not share the launch URL.
TapeWeave · 行为挑战|TapeWeave — Behavior challenge
先预测，再让行为说话。|Predict first. Let the behavior respond.
同一行为字节，四回合挑战，逐拍解释。|One behavior artifact. Four rounds. Every step explained.
本地实验 · 无钱包 · 无链上制造或消费 · 非独立采用证据|Local experiment · No wallet · No onchain manufacture or consumption · Not independent adoption
进入有限行为工作室：编辑8行转换表、编译字节、双宿主消费|Open the finite behavior studio: edit eight transitions, compile bytes, run two hosts
（独立实验档，不兼容下方固定包）|(Separate experiment format; incompatible with fixed packages below)
1 / 选择挑战|1 / Choose a challenge
蓄能：先蓄能，再触发|Charge: charge first, then trigger
交替：触发一次输出，再次休息|Alternating: trigger an output, then rest
训练：本拍请求生效|Training: this step's request takes effect
花园：上拍请求生效（接入实验）|Garden: previous request takes effect (integration experiment)
窗口|Window
执行方式|Execution mode
普通公式（同规则对照）|Ordinary formula (equivalent rules)
两卡均从状态0开始。第1、3回合补能；蓄能卡同拍补能不代表立即输出。设置变化将开新局。|Both cards begin in state 0. Rounds 1 and 3 charge. Same-step charging does not immediately produce an output on the charge card. Changing settings starts a new run.
制品与证据|Artifact & evidence
2 / 先猜第一拍|2 / Predict the first step
旧状态0，触发1，补能1。电路本拍请求是？|Old state 0, trigger 1, charge 1. What does the circuit request this step?
预测 0|Predict 0
预测 1|Predict 1
先选一个答案，再开始挑战。|Choose an answer before starting.
3 / 四回合操作|3 / Four rounds of actions
等待（trigger 0）|Wait (trigger 0)
触发（trigger 1）|Trigger (trigger 1)
重新挑战|Restart challenge
拍|Step
生效|Effective
得分|Score
系统最优参考（不是玩家成绩）|System optimum reference (not a player score)
4 / 交付挑战包|4 / Deliver the challenge package
填写作品说明，生成当前卡片、宿主与窗口的JSON。包不含玩家成绩、作者认证或链上身份。复制后可交给本地Python执行器核对，也可粘贴回此页重新装载。导入仅接受固定两卡、零初态与固定预测题，不接受任意网表。|Describe the work and generate JSON for the current card, host and window. No player scores, author authentication or chain identity. Check the copied package with the local Python runner, or paste it here. Imports accept only the two fixed cards, zero initial state and fixed prediction, not arbitrary netlists.
作品标题|Work title
行为说明|Behavior description
先预测，再操作；请求与实际效果由回放分别解释。|Predict, then act. The replay distinguishes requests from actual effects.
生成挑战包|Generate challenge package
挑战包JSON（可选择并复制）|Challenge JSON (select & copy)
粘贴挑战包JSON（最多64 KiB）|Paste challenge JSON (maximum 64 KiB)
校验并装载|Validate & load
成功装载后本局清零、需要重新预测；失败不改变当前挑战。不会执行说明中的HTML或脚本。重复JSON键采用最后一项，与Python入口的拒绝策略不同。|Successful loading resets the run and requires a new prediction. Failure preserves the challenge. Descriptions never execute HTML or scripts. Duplicate JSON keys use the last value, unlike the Python entry's rejection policy.
5 / 交付本局回放|5 / Deliver this run's replay
完成四回合后，生成包含当前说明、配置、动作与逐拍结果的可复制JSON。它是未认证、可编辑的本地记录，不是玩家研究、链回执或排行榜凭证。修改配置或文字后旧JSON会清空。|After four rounds, generate copyable JSON with the description, settings, actions and trace. This editable, unauthenticated local record is not player research, an onchain receipt or a leaderboard credential. Editing settings or text clears it.
生成四回合回放|Generate four-round replay
回放JSON（可选择并复制）|Replay JSON (select & copy)
复核一份回放|Verify a replay
粘贴回放JSON（最多64 KiB）|Paste replay JSON (maximum 64 KiB)
复核不会改变当前挑战。计算一致不证明记录来自真实玩家；普通公式与电路字节模式均可复核。重复JSON键取最后值。|Verification does not change the challenge. Consistency does not prove a real player. Both ordinary-formula and circuit-byte replays can be verified. Duplicate JSON keys use the last value.
花园只展示延迟映射，不宣称玩法已验证。普通公式拥有同等操作与回放。页面无保存、认证或链回执；刷新会清空本局。|The garden demonstrates delayed mapping, not validated gameplay. The ordinary formula has equivalent actions and replays. No saving, authentication or onchain receipts; refresh clears the run.
TapeWeave 本机作品执行|TapeWeave — Local work execution
TapeWeave · 本机持久执行|TapeWeave · Local persistent execution
旧四回合宿主|Legacy four-round host
交付的作品，刷新后继续。|Delivered works. Continue after refresh.
本页仅由Node24本机服务运行，作品与日志保存在仓库外SQLite；不是Pages后端、公开服务、钱包或认证。最多64步；这里只记录效果请求，不执行奖励。使用Node启动的完整URL进入。|Runs only with the local Node24 service. Works and journals are stored in SQLite outside the repository, not a Pages backend, public service, wallet or authentication. Maximum 64 steps. Only effect requests are recorded; no rewards are executed. Use the complete launch URL from Node.
1 / 创建或恢复|1 / Create or restore
会话标识|Session ID
完整作品包|Complete work package
普通真值表|Ordinary truth table
创建新会话|Create new session
列出前100个会话|List first 100 sessions
创建不覆盖同名局；读取不推进。列表不是实时更新，超出100项请按标识读取。|Creating never overwrites an existing ID; reading does not advance it. Lists are not live. Read IDs directly beyond the first 100.
2 / 执行与确认|2 / Execute & confirm
重试原待确认命令|Retry the original pending command
发送前将命令ID及参数保存到标签页，超时不换ID。待确认时禁止切换或创建；明确版本冲突会读取最新快照后要求重新选择动作。清除标签页存储会失去未确认命令，不能据此断言交易未提交。|Save command ID and arguments before sending; do not change the ID after a timeout. Pending commands block switching or creating sessions. A confirmed version conflict reads the latest snapshot and requires choosing the action again. Clearing tab storage loses pending commands and does not prove they were uncommitted.
查看逐步执行日志|View step-by-step execution journal
手动复制保存；此记录不是验收签名、玩家成绩或链上回执。数据库不能作为普通作品文件分享。|Copy manually to save. This is not a signed acceptance, player score or onchain receipt. Do not share the database as a work file.
TapeWeave — 行为电路实验|TapeWeave — Behavior circuit experiment
编辑行为电路，在两个独立宿主中观察状态、请求与效果。|Edit behavior circuits and inspect state, requests and effects in two separate hosts.
试玩入口|Demo entry points
进入行为工作室|Open behavior studio
进入固定行为挑战|Open fixed-card challenge
当前边界|Current limits
本页是本地计算原型，不连接钱包、不写链。制品链身份为空，回放未认证。普通共享模式提供同等规则。|This page is a local computation prototype: no wallet or chain writes. Artifacts have no chain identity; replays are unauthenticated. Shared-code mode provides equivalent rules.
工作室进度仅保存在当前浏览器，未同步SQLite或其他设备。请勿输入秘密或个人敏感信息。|Studio progress stays in this browser; no SQLite or cross-device sync. Do not enter secrets or sensitive personal information.
尚未完成真实TapeOut制造、X Layer宿主消费、独立用户验证和参赛视频。|This legacy local entry does not itself demonstrate TapeOut manufacture, X Layer host consumption, independent user validation or the submission video. Use the main workbench and mainnet evidence page for current integration scope.
`.trim().split('\n').map(line=>{const at=line.indexOf('|');return[line.slice(0,at),line.slice(at+1)];})));
Object.assign(messages,Object.fromEntries(`
作品已生成。可复制给接收者；不是链上发布。|Work generated. Copy it for a recipient; it has not been published onchain.
参考包读取失败|Failed to read reference package
预测正确|Correct prediction
预测不同|Prediction differs
请先预测|Make a prediction first
使用上拍请求|Uses the previous step's request
使用本拍请求|Uses this step's request
末拍新请求不在本局成熟。|The last step's new request does not mature in this run.
已生成当前配置快照；复制JSON保存为文件后可用play_challenge.py执行。不是链上制品或安全认证。|Settings snapshot generated. Copy the JSON to a file for play_challenge.py. This is not an onchain artifact or security certification.
已装载挑战包，本局从零开始；请重新预测。执行模式保持当前选择，说明仅为文本。|Package loaded; the run starts from zero. Predict again. Execution mode is unchanged; descriptions are plain text.
非法块号|Invalid block number
非法区块|Invalid block
候选地址没有代码|Candidate address has no deployed code
宿主运行时代码与公开版本不符|Host runtime differs from the published version
核验期间区块发生变化|The block changed during verification
当前会话与历史最终状态一致|Current session matches the recorded final state
当前会话未匹配历史最终状态|Current session does not match the recorded final state
单端读取完成，未验证宿主身份、未推进状态。|Single-endpoint read complete. Host identity is unverified; state was not advanced.
读取失败：|Read failed: 
RPC 响应过大|RPC response too large
公共 RPC 请求失败；请重新读取，勿重复发送|Public RPC request failed. Read again; do not resend a transaction.
；稍后可重新读取，交易不会自动重发|; read again later. The transaction will not be resent automatically.
回执核验完成，但历史未能保存；待处理记录仍保留，请备份后重新核验。|Receipt verified, but history could not be saved. The pending record is retained. Back up before verifying again.
AA 入口有待处理请求，请先在 AA 页面核验或恢复；不能重复发送|The AA entry has a pending request. Verify or recover it there first; do not resend.
尚无交易哈希。请检查钱包历史，找到后填入；不会自动重发。|No transaction hash yet. Find it in wallet history and paste it here. No automatic resend.
待处理记录无法读取，已阻止发送。请保留站点数据并检查钱包历史。|Pending record unreadable; sending is blocked. Preserve site data and check wallet history.
本局完成。可以切换卡片后开始新局。|Run complete. Switch cards to start a new run.
操作失败|Operation failed
链上发现|Discovered onchain
回滚|Reverted
历史读取失败：|Failed to read history: 
浏览器不支持跨标签操作锁，请使用当前版本 Chrome／Edge|This browser lacks cross-tab locks. Use a current Chrome / Edge version.
另一页面正在处理钱包记录，请等待后重试|Another page is processing wallet records. Wait, then retry.
浏览器钱包|Browser wallet
未检测到钱包。请在安装了 OKX／MetaMask 插件的浏览器打开，或在钱包 DApp 浏览器打开本页|No wallet detected. Open in a browser with the OKX / MetaMask extension, or a wallet DApp browser.
钱包环境已改变，请重新连接；待处理记录仍保留|Wallet environment changed. Reconnect; pending records are preserved.
连接成功。选择卡片并预览开局，或填入属于你的会话 ID 恢复。每笔都需要单独确认。|Connected. Choose a card and preview a new run, or enter your session ID to restore. Confirm every operation separately.
未检测到插件钱包|No wallet extension detected
切网请求已完成，请重新连接钱包|Network switch requested. Reconnect the wallet.
选择已改变，请读取会话或预览新局|Selection changed. Read a session or preview a new run.
会话选择已改变，请重新读取|Session selection changed. Read it again.
会话已读取，所属账户和完整宿主代码已核对。|Session read; account ownership and full host code checked.
请先读取会话|Read the session first
开新局|Open new run
请核对预览，再点击“确认并打开钱包”。只做宿主函数模拟，不是完整 UserOperation 模拟。|Check the preview, then click Confirm & open wallet. Only the host function is simulated, not the full UserOperation.
正在重新预检并等待钱包确认；请勿关闭页面或重复发送|Rechecking and awaiting wallet confirmation. Do not close the page or resend.
已发送。交易哈希已保存在本机，请点击“核验交易回执”：|Submitted. Hash saved locally. Click Verify transaction receipt: 
已上链，等待至少两个区块深度后再次核验|Included onchain. Wait for at least two-block depth, then verify again.
交易待确认；稍后再次核验，不会自动重发|Transaction pending. Verify again later; no automatic resend.
。请重新读取状态后预览新操作。|. Read state again before previewing another action.
；连接对应账户后可续用|; connect the matching account to continue
同块另有后续动作，展示的是块末状态。|A later action exists in the same block; this is end-of-block state.
交易哈希已与原账户、调用及 nonce 绑定，请核验回执|Hash bound to the original account, call and nonce. Verify the receipt.
已重新读取历史会话的链上状态，可按当前版本继续操作|Historical session state refreshed from chain. Continue at the current version.
已生成本机历史备份，请复制保存。仅含已核验回执与发现的会话，不含待处理意图或钱包秘密。|History backup generated. Copy it to save. Contains verified receipts and discovered sessions only, no pending intents or wallet secrets.
备份超过 1 MiB|Backup exceeds 1 MiB
备份已合并；没有签名认证。选择会话并重新读取链上状态后再继续。待处理交易保持原记录。|Backup merged without signature authentication. Select and reread the session before continuing. Pending transactions are unchanged.
点击再次扫描可继续下一段。|Click Scan again to continue the next segment.
已到本次查询的链头。|Reached the chain head for this query.
另一页面修改了待处理记录；请核验交易后继续|Another page changed the pending record. Verify the transaction before continuing.
实际结果|Actual outcome
实际通过|Actually passed
实际失败|Actually failed
实际操作、结果或失败（通过／失败必填）|Actual steps, outcome or failure (required for pass / fail)
此项实际交易哈希|Actual transaction hash for this item
类型已切换，条目重新标为未完成。之前保存的草稿没有自动覆盖。|Task type changed; items reset to incomplete. Previously saved drafts were not overwritten automatically.
已生成实际观察记录；结果没有独立认证，复制保存后交回本次任务。|Observation record generated without independent authentication. Copy and return it for this task.
草稿保存失败|Failed to save draft
草稿已保存在本机；不等于通过，也没有上传。|Draft saved locally. This does not mean passed or uploaded.
没有保存过草稿|No saved draft
草稿超限|Draft exceeds size limit
已恢复自报草稿；继续实际执行未完成项。|Self-reported draft restored. Perform the incomplete tasks.
已复制，请保存或回传。|Copied. Save it or send it back.
系统未允许自动复制，已选中文本，请手动复制；不能记自动复制通过。|Automatic copying was denied. Text selected; copy manually. Do not mark automatic copy as passed.
先在真实设备执行；未执行项保留未完成。|Test on the actual device first. Leave unperformed tasks incomplete.
已生成未认证备份；请手动复制，执行存档不包含在内。|Unauthenticated backup generated. Copy manually; execution saves are not included.
请先选择比较基准|Choose a comparison baseline first
AA RPC 响应过大|AA RPC response too large
AA 只读 RPC 请求失败|AA read-only RPC request failed
记录无法读取。停止发送；请保留站点数据。|Record unreadable. Stop sending; preserve site data.
普通钱包入口有待处理交易，先核验后再操作。|The ordinary wallet has a pending transaction. Verify it before continuing.
AA 操作失败|AA operation failed
需要支持 Web Locks 的当前浏览器|A current browser supporting Web Locks is required
另一页面正在处理钱包，请等待|Another page is processing the wallet. Please wait.
插件钱包|Wallet extension
先检测钱包，再逐笔预览；检测不会请求签名。|Detect the wallet, then preview each call. Detection does not request a signature.
钱包选择已改变，请重新诊断|Wallet selection changed. Run diagnostics again.
只读诊断已生成，没有请求连接授权、签名或发送交易。复制报告可继续排查。|Read-only diagnostic generated without requesting connection permission, signatures or transactions. Copy it for troubleshooting.
请先生成诊断|Generate a diagnostic first
已复制公开账户与兼容性诊断；不含钱包原始错误、能力原文或秘密。|Public account and compatibility diagnostic copied. No raw wallet errors, raw capability payload or secrets included.
自动复制被拒绝，已选中诊断，请手动复制。|Automatic copy denied. Diagnostic selected; copy it manually.
未检测到插件，请在已安装钱包的浏览器或钱包 DApp 浏览器打开|No extension detected. Open in a browser with the wallet installed, or in a wallet DApp browser.
AA 账户或网络改变，请重新连接；原意图保留|AA account or network changed. Reconnect; the original intent is preserved.
钱包声明本链支持 EIP-5792，且账户已有合约代码。请逐笔预览并在钱包核对；尚未证明该插件真实签名或兼容所有 AA。|The wallet reports EIP-5792 support on this chain and the account has deployed code. Preview and check each call in the wallet. This does not prove actual extension signing or compatibility with all AAs.
没有可用钱包|No wallet available
切网请求完成，请重新连接|Network switch requested. Reconnect.
会话选择改变|Session selection changed
已从链上读取此账户会话|Account session read from chain
核对预览，勾选费用提示后点击确认；钱包仍会要求你确认。|Check the preview, acknowledge the fee notice, then confirm. The wallet will still ask for confirmation.
请先阅读并确认费用边界|Read and acknowledge the fee limits first
AA 请求已提交给钱包；请查询状态，不能重复发送|AA request submitted to the wallet. Query its status; do not resend.
钱包仍在处理，稍后手动查询；不重发|Wallet still processing. Query manually later; do not resend.
候选交易已通过链上事件核验并绑定，请点击核验回执保存历史|Candidate transaction checked against onchain events and bound. Verify its receipt to save history.
交易尚未确认，请稍后重查|Transaction not confirmed yet. Check again later.
恢复哈希已按原账户、调用事件和 UOP 区间核对绑定，请核验保存|Recovery hash checked and bound to the original account, call events and UOP range. Verify to save.
等待确认及至少两块深度；不重发|Waiting for confirmation and at least two-block depth. Do not resend.
已生成本机 AA 回执导出，不含待处理请求或钱包秘密，请复制保存|Local AA receipt export generated, excluding pending requests and wallet secrets. Copy it to save.
当前网页未检测到钱包接口。若使用 Codex 内置浏览器，请复制本页地址到已安装并启用钱包扩展的 Chrome；不要向网页提供私钥。|No wallet interface detected. If using the embedded browser, copy this URL into Chrome with the wallet extension enabled. Never provide a private key to this page.
连接钱包检测能力；连接本身不发送交易。|Connect to check capabilities. Connecting does not submit a transaction.
已复制。仅本地未认证JSON，不含链身份。|Copied. Local unauthenticated JSON only; no chain identity.
剪贴板不可用，已选中文本，请手动复制。|Clipboard unavailable. Text selected; copy manually.
钥匙门|Key door
训练|Training
行为已修改，请编译开启新局。|Behavior changed. Compile to start a new run.
字节与行为表不一致|Bytes do not match the behavior table
请先编译|Compile first
请先完成四回合|Complete four rounds first
配置或输入已变化，请重新导入。|Settings or inputs changed. Import again.
装载未完成，请查看错误。|Load incomplete. Check the error.
创作包已装载，双宿主清零；执行模式保持原选择。未认证，无链身份。|Artifact loaded; both hosts reset. Execution mode is unchanged. Unauthenticated, with no chain identity.
存档已被其他页面更改，请刷新恢复后再操作；可点击“重新读取存档”。|Another page changed the save. Restore before acting; use Reload saved run.
已生成自报记录，未核验身份或实际体验。|Self-reported record generated. Identity and actual use have not been verified.
已复制未认证记录。|Unauthenticated record copied.
复制不可用，已选中文本，请手动复制。|Copy unavailable. Text selected; copy manually.
`.trim().split('\n').map(line=>{const at=line.indexOf('|');return[line.slice(0,at),line.slice(at+1)];})));
Object.assign(messages,Object.fromEntries(`
基准：|Baseline: 
恢复失败：|Restore failed: 
无法读取作品库：|Cannot read library: 
未保存：|Not saved: 
预览失败：|Preview failed: 
导入失败：|Import failed: 
存档恢复失败：|Save restoration failed: 
执行失败：|Execution failed: 
本地凭据／标签页存储不可用：|Local credentials / tab storage unavailable: 
当前交易参数的 gas 费用上限：|Gas fee cap for these transaction parameters: 
账户：|Account: 
宿主：|Host: 
X Layer 主网（196）|X Layer mainnet (196)
原生币转入：0 OKB；无代币授权|Native value: 0 OKB; no token approvals
60 秒内有效。钱包若修改费用，须重新核对钱包提示。普通插件账户不承诺赞助费用。|Valid for 60 seconds. If the wallet changes fees, review them again. Sponsorship is not promised for ordinary accounts.
转入价值：0 OKB，无代币授权|Value: 0 OKB; no token approvals
内部调用 eth_call 已通过；完整 UserOperation 模拟及总费用尚未取得|Internal eth_call passed; full UserOperation simulation and total fees are not available
钱包将决定 nonce、gas、赞助和最终费用，请在钱包内核对|The wallet determines nonce, gas, sponsorship and final fees. Check them in the wallet.
预览 60 秒有效；每次只发一条调用，不升级账户|Preview valid for 60 seconds; one call at a time, no account upgrades
等待输入|Waiting for input
请填写标题、使用说明，并选择支持的场景|Enter a title and instructions, and choose a supported scene
未知模板|Unknown template
作品包超过32 KiB或不是文本|Work package exceeds 32 KiB or is not text
尚未粘贴作品包，请复制完整作品包后再试；原试用进度未改变|No package pasted. Copy the complete package and try again. Existing trial progress is unchanged.
作品包不是有效JSON，内容可能没有复制完整；请重新复制整个作品包后再试，原试用进度未改变|Invalid package JSON; the copy may be incomplete. Copy the entire package and retry. Existing progress is unchanged.
作品包格式或证据标记不合法|Invalid package format or evidence marker
创作包超过16 KiB|Artifact package exceeds 16 KiB
非法创作包字段|Invalid artifact package fields
创作包字节、摘要或证据标记不匹配|Artifact bytes, digest or evidence marker do not match
未知执行模式|Unknown execution mode
旧版本、非法输入或超过64步|Stale version, invalid input or more than 64 steps
请选择验收结果并填写实际观察（最多64步）|Choose an acceptance outcome and enter actual observations (up to 64 steps)
非法操作记录|Invalid action record
操作记录计算不一致|Action record computation does not match
执行存档超过128 KiB|Execution save exceeds 128 KiB
执行存档格式不合法|Invalid execution save format
执行命令不合法|Invalid execution command
执行存档计算不一致|Execution save computation does not match
命令ID冲突|Command ID conflict
作品库过大|Library too large
作品库损坏|Library corrupted
作品库条目损坏|Library entry corrupted
作品版本损坏|Work version corrupted
找不到目标版本|Target version not found
仅允许恢复到空作品库|Restore is allowed only into an empty library
归档超过2 MiB|Archive exceeds 2 MiB
归档格式错误|Invalid archive format
作品库已变化，请刷新后重试|Library changed. Refresh and retry.
请填写库内作品标识（最多80字符）|Enter a library work ID (up to 80 characters)
最多100件作品|Maximum 100 works
每件作品最多20版|Maximum 20 versions per work
内容未变，不新增版本|Content unchanged; no new version created
记录超过64 KiB|Record exceeds 64 KiB
记录字段或计算不一致|Record fields or computation do not match
请选择保留进度或从零开始|Choose whether to keep progress or restart from zero
规则或场景已变化，只能显式从零开始|Rule or scene changed; explicitly restart from zero
RPC 数量格式错误|Invalid RPC quantity format
本机待处理记录损坏；请保留备份并检查交易，不能直接重发|Local pending record corrupted. Keep a backup and inspect the transaction; do not resend.
待处理交易哈希格式错误|Invalid pending transaction hash
待处理操作错误|Invalid pending operation
待处理卡片错误|Invalid pending card
待处理调用不符|Pending call mismatch
待处理 gas 错误|Invalid pending gas
待处理会话不符|Pending session mismatch
待处理会话损坏|Pending session corrupted
没有可用的钱包接口|No wallet interface available
钱包没有返回账户|Wallet returned no account
请先连接钱包|Connect the wallet first
请切换至 X Layer（196），然后重新连接|Switch to X Layer (196), then reconnect
钱包账户或网络已改变，请重新连接并预览|Wallet account or network changed. Reconnect and preview again.
钱包环境已改变，请重新预览|Wallet environment changed. Preview again.
本机待处理记录过大|Local pending record too large
待处理记录保存失败；不能发送|Failed to save pending record; sending blocked
RPC 区块格式错误|Invalid RPC block format
区块发生变化，请重新核验|Block changed. Verify again.
主网宿主代码与已审查版本不符|Mainnet host code differs from the reviewed version
公共 RPC 网络错误|Public RPC network mismatch
这局属于另一个账户|This run belongs to another account
先核验待处理交易；不能重复发送|Verify the pending transaction first; do not resend
当前入口仅支持普通插件账户；AA／委托账户请使用已有官方钱包工具|This entry supports ordinary extension accounts only. Use official wallet tools for AA / delegated accounts.
会话账户、卡片或版本已改变；请读取当前会话|Session account, card or version changed. Read the current session.
开局模拟返回值错误|Unexpected open-run simulation result
动作模拟返回值错误|Unexpected action simulation result
gas 估算超出宿主范围|Gas estimate exceeds the host limit
钱包还有未完成交易，请先处理|Resolve unfinished wallet transactions first
已有操作正在处理中|An operation is already in progress
预览已过期，请重新模拟|Preview expired. Simulate again.
已有待处理交易，请先核验|A transaction is pending. Verify it first.
账户已改变|Account changed
预检失败|Preflight failed
预检期间预览已过期，请重新模拟|Preview expired during preflight. Simulate again.
另一页面已有待处理操作，请先核验|Another page has a pending operation. Verify it first.
你已取消签名；没有自动重试|You cancelled signing. No automatic retry.
钱包返回不明结果。请检查钱包历史并填入交易哈希；不要重发。|Unknown wallet outcome. Check wallet history and enter the transaction hash; do not resend.
钱包未返回合法交易哈希；请从钱包历史恢复，不要重发|Wallet returned no valid hash. Recover it from history; do not resend.
预览已过期|Preview expired
账户类型已改变|Account type changed
会话已推进，请重新读取；不会自动更新版本重发|Session advanced. Read it again; the version will not be silently changed and resent.
账户 nonce 已改变，请重新预览|Account nonce changed. Preview again.
当前费用高于预览，请重新模拟|Current fee exceeds the preview. Simulate again.
gas 已超过预览，请重新模拟|Gas exceeds the preview. Simulate again.
发送前模拟失败|Pre-submission simulation failed
没有待处理交易|No pending transaction
请填写完整的交易哈希|Enter the complete transaction hash
已有交易哈希，不能替换|Existing transaction hash cannot be replaced
交易与待处理账户、宿主、调用或 nonce 不符|Transaction does not match the pending account, host, call or nonce
请先从钱包历史恢复交易哈希|Recover the transaction hash from wallet history first
RPC 网络不符|RPC network mismatch
交易回执身份不符|Transaction receipt identity mismatch
交易所在区块不符|Transaction block mismatch
回执状态错误|Invalid receipt status
回执日志错误|Invalid receipt logs
需要唯一的宿主事件|Exactly one host event is required
事件区块或交易不符|Event block or transaction mismatch
事件会话错误|Invalid event session
开局事件不符|Open event mismatch
动作事件与预期输出不符|Action event differs from expected output
回执所在块的会话状态不符|Session state mismatch at the receipt block
本机待处理记录已改变，请重新核验|Local pending record changed. Verify again.
请使用Node启动时输出的完整URL|Use the complete URL printed when Node starts
请使用启动URL|Use the launch URL
存在待确认命令，请先处理原会话|A command is pending. Resolve its original session first.
先重试或读取待确认命令的原会话，不能新建|Retry or read the pending command's original session before creating another
没有待确认命令|No pending command
该命令因版本冲突未提交，已读取最新快照；请重新选择动作|Command not committed due to a version conflict. Latest snapshot read; choose the action again.
原命令因版本冲突未提交，已刷新；请重新选择动作|Original command not committed due to a version conflict. Snapshot refreshed; choose the action again.
原命令已确认，已读取最新快照；未认证、无链动作|Original command confirmed; latest snapshot read. Unauthenticated; no onchain action.
已读取持久快照；未认证、无链身份。|Persistent snapshot read; unauthenticated, no chain identity.
读取中…|Reading…
没有已保存会话。|No saved sessions.
列表读取失败；未改变当前会话。|Failed to read list. Current session unchanged.
已复制未认证回放。|Unauthenticated replay copied.
剪贴板不可用，已选中，请手动复制。|Clipboard unavailable. Text selected; copy manually.
请求失败|Request failed
执行记录JSON|Execution record JSON
`.trim().split('\n').map(line=>{const at=line.indexOf('|');return[line.slice(0,at),line.slice(at+1)];})));
Object.assign(messages,Object.fromEntries(`
触摸与排版|Touch & layout
在实际 Android 手机竖屏触摸作品页控件、展开折叠；横屏后再回竖屏。记录键盘遮挡、误触及页面溢出。|On an actual Android phone, touch the work controls and expand / collapse sections in portrait. Rotate to landscape and back. Record keyboard overlap, accidental taps and overflow.
系统剪贴板|System clipboard
生成“手机作品v1”，实际点击复制并长按系统粘贴。权限拒绝与手动复制另记，不能算自动复制通过。|Create a work named Phone work v1. Tap Copy and long-press to paste using the system clipboard. Record permission denial or manual copy separately, not as an automatic-copy pass.
导入与试用|Import & trial
实际粘贴装载蓄能＋lamp 包，补能→触发，应第2步 request1、灯亮。本人粘贴不能记为独立接收者。|Paste and load a charge + lamp package. Charge → Trigger should produce request 1 at step 2 and light the lamp. Self-pasting does not count as an independent recipient.
刷新恢复|Refresh & restore
刷新后点击恢复本机执行存档，应仍第2步、标题v1；再触发到第3步 request0，不能用重新生成代替恢复。|Refresh and restore local execution. Expect step 2 and title v1. Trigger again for step 3, request 0. Regenerating is not restoring.
元数据更新保留|Preserve progress through metadata updates
只改 title 为v2，比较后保留进度，仍第3步；复制旧局备份。改回标题时步数也应保留。|Change only the title to v2. Compare and preserve progress at step 3; copy the old-session backup. Changing the title back should also preserve the step.
规则改变清零|Reset after rule changes
改成交替规则并尝试保留，应拒绝且原局不变；明确选择从零后0步，连续触发应请求1／0。|Change to the alternating rule and try preserving progress. It must reject without changing the run. Explicitly restart at step 0; consecutive triggers should request 1 / 0.
管理库追加回退|Append-only library rollback
在新标识保存v1／v2，回退v1应追加v3，保留历史；刷新后仍有三版。不测试已有重要作品。|Under a new ID, save v1 and v2. Rolling back to v1 must append v3 and preserve history. All three remain after refresh. Do not use an important existing work.
错误不覆盖|Invalid imports never overwrite
修改包的SHA后导入，应拒绝且原作品／进度不变；普通模式有效包仍可运行。|Change the package SHA and import. It must reject without changing the work or progress. A valid package must still run in ordinary mode.
展览触摸与复核|Exhibit touch & verification
真机实际走完书屋／邮局两站，生成回放并粘贴复核。记录触摸、滚动、资源和复制问题。|Complete both the library and post office on the actual phone. Generate and verify a replay. Record touch, scroll, resource and copy issues.
真实插件连接|Actual extension connection
使用实际 OKX／MetaMask 插件连接；记录钱包版本，确认连接本身没有交易或签名。|Connect with an actual OKX / MetaMask extension. Record the wallet version; confirm that connection itself creates no transaction or signature.
网络与账户核对|Network & account check
在 X Layer 196 核对实际连接账户；网络不符时页面应停止，不用更改RPC返回值模拟。|On X Layer 196, check the actual connected account. A wrong network must stop the page; do not simulate this by changing RPC responses.
钱包拒签|Reject wallet signing
预览开局后在真实钱包点击拒绝，页面应显示取消，不留成功回执、不自动重发。|Preview an opening, then reject it in the real wallet. The page should show cancellation, with no successful receipt or automatic resend.
真实确认与回执|Actual confirmation & receipt
重新预览，在真实钱包核对最终费用并确认；取得自己的新交易哈希，页面核验成功。填写该哈希。|Preview again, review final fees in the real wallet and confirm. Obtain your own new transaction hash and verify it on the page. Record that hash.
刷新与续用|Refresh & continue
核验后刷新，连接同一账户，从我的会话重新读链续用；不重复发送已经完成的操作。|After verification, refresh and reconnect the same account. Read your session from chain to continue; do not resend completed operations.
账户变化保护|Account-change protection
有预览时切换账户或网络，预览应失效；恢复原环境后必须重新预览。|Change account or network with an active preview. The preview must become invalid; restoring the original environment still requires a new preview.
真实 AA 能力|Actual AA capabilities
实际钱包返回本链原生调用 supported，账户已有合约代码；钱包名称或本地mock不能替代。|The real wallet must report native-call support on this chain and the account must have deployed code. A wallet name or local mock is not evidence.
AA 预览|AA preview
当前AA的宿主内部调用模拟通过；钱包界面核对实际费用／赞助。内部模拟不能当完整UOP模拟。|Simulate the current AA's internal host call and check actual fees / sponsorship in the wallet. Internal simulation is not full UOP simulation.
AA 拒签|Reject AA signing
在实际钱包拒绝一次，不产生成功记录，不自动发起第二次请求。|Reject once in the actual wallet. No success record or automatic second request should be created.
真实 AA 请求|Actual AA request
实际确认 wallet_sendCalls 请求，返回原请求ID；填写自己的新链上交易哈希。|Confirm an actual wallet_sendCalls request and obtain the original request ID. Record your own new onchain transaction hash.
请求恢复|Request recovery
刷新后通过原钱包请求ID查询或手动哈希恢复；待处理时阻止重复发送。|After refresh, query the original wallet request ID or recover by hash. Pending requests must block resending.
成功 UOP 绑定|Successful UOP binding
本页实际核对固定EntryPoint的成功事件、原AA sender、宿主日志区间和块末状态，填写该哈希。|Verify the successful event at the pinned EntryPoint, original AA sender, host log range and end-of-block state on this page. Record the hash.
四步与版本|Four steps & versions
逐笔完成四步，核对两场景结果；旧版本停止，不暗中换版本重发。|Complete four steps one at a time and check both scene outcomes. Stale versions must stop, not be silently changed and resent.
非法验收类型|Invalid acceptance type
填写实际被测提交SHA|Enter the actual tested commit SHA
验收条目不完整|Acceptance items incomplete
条目或结果错误|Invalid item or result
通过／失败项须填写实际观察|Pass / fail items require actual observations
链上操作通过项须填写真实交易哈希|Passing onchain actions require an actual transaction hash
全部通过须确认实际设备／插件已执行|All-pass reports require confirming actual device / extension execution
请填写设备与系统|Enter the device and operating system
请填写浏览器／钱包版本|Enter the browser / wallet version
请填写被测版本|Enter the tested version
`.trim().split('\n').map(line=>{const at=line.indexOf('|');return[line.slice(0,at),line.slice(at+1)];})));
Object.assign(messages,Object.fromEntries(`
AA 本机记录字段错误|Invalid local AA record fields
AA 前置状态错误|Invalid AA precondition state
AA 本机记录损坏；保留记录并核查钱包，不能重发|Local AA record corrupted. Preserve it and inspect the wallet; do not resend.
AA 调用不符|AA call mismatch
AA 开局字段错误|Invalid AA open-run fields
AA 会话身份错误|Invalid AA session identity
钱包能力格式错误|Invalid wallet capability format
AA 日志与交易／区块不符|AA logs do not match the transaction / block
AA 回执、EntryPoint、区块深度或发送时间边界不符|AA receipt, EntryPoint, block depth or submission-time boundary mismatch
AA 日志序号重复|Duplicate AA log index
需要唯一宿主事件，不能认领批量或其他会话|Exactly one host event is required; batches or other sessions cannot be claimed
AA 事件会话错误|Invalid AA event session
AA 开局事件不符|AA open event mismatch
AA 动作事件不符|AA action event mismatch
AA 块末会话状态不符|AA end-of-block session state mismatch
宿主事件不属于此 AA 的 UserOperation 区间|Host event is outside this AA's UserOperation range
UserOperation 未成功|UserOperation was not successful
AA 历史回执格式错误|Invalid AA history receipt format
AA 历史回执账户不符|AA history receipt account mismatch
AA 历史超限|AA history exceeds limit
AA 历史格式错误|Invalid AA history format
AA 历史意图不符|AA history intent mismatch
AA 历史重复|Duplicate AA history entry
AA 待处理记录过大|AA pending record too large
AA 待处理意图保存失败；停止发送|Failed to save pending AA intent; sending stopped
AA 入口需要已部署的合约账户；未部署／普通 EOA／委托账户使用对应入口|AA entry requires a deployed smart account. Use the appropriate entry for undeployed, ordinary EOA or delegated accounts.
AA 账户已改变|AA account changed
AA 会话已改变，请重新读取和预览|AA session changed. Read and preview again.
AA 内部调用模拟失败|AA internal call simulation failed
先处理已有 AA 或普通钱包交易，不能重复发送|Resolve existing AA or ordinary wallet transactions first; do not resend
AA 会话所属或版本不符|AA session ownership or version mismatch
AA 操作进行中|AA operation in progress
AA 预览已过期|AA preview expired
已有待处理交易|A transaction is already pending
AA 预检期间预览过期|AA preview expired during preflight
另一页面已有待处理交易|Another page has a pending transaction
你已拒绝 AA 钱包确认；没有自动重试|You rejected AA wallet confirmation. No automatic retry.
AA 钱包结果不明；保留请求 ID，从钱包查询或恢复，不能重发|Unknown AA wallet outcome. Keep the request ID and query or recover through the wallet; do not resend.
钱包没有返回原请求 ID；请人工恢复交易哈希，不能自动重发|Wallet returned no original request ID. Recover the transaction hash manually; no automatic resend.
没有 AA 待处理请求|No pending AA request
请连接原 AA 账户查询|Connect the original AA account to query
钱包 AA 状态格式不符；原意图仍保留|Invalid wallet AA status format; original intent preserved
钱包未返回唯一成功回执，请检查钱包；原意图保留，不重发|Wallet did not return a unique successful receipt. Inspect the wallet. Original intent preserved; do not resend.
需要 AA 意图与完整交易哈希|AA intent and complete transaction hash required
已有 AA 交易哈希不能替换|Existing AA transaction hash cannot be replaced
RPC 网络错误|RPC network mismatch
AA 候选交易哈希不符|AA candidate transaction hash mismatch
AA 交易不在规范块|AA transaction is not in the canonical block
AA 回执没有唯一宿主会话|AA receipt has no unique host session
AA 意图已被其他页面修改|Another page changed the AA intent
先查询钱包状态或恢复哈希|Query wallet status or recover the hash first
AA 待处理记录已改变|AA pending record changed
AA 意图与回执不符|AA intent and receipt mismatch
AA 历史记录冲突；待处理意图保留|AA history conflict; pending intent preserved
AA 历史已满，请先备份后人工处理|AA history full. Back up before resolving manually.
AA 历史已由另一页面修改|Another page changed AA history
AA 历史保存失败|Failed to save AA history
`.trim().split('\n').map(line=>{const at=line.indexOf('|');return[line.slice(0,at),line.slice(at+1)];})));
