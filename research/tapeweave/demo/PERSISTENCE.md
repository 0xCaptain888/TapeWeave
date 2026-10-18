# 本地持久宿主：SQLite与命令回执

日期：2026-10-17。作者离线实现，无外部事实或新增链证据。

## 新增本地网页接入（Node 24，2026-10-17）

在仓库根目录运行（数据库必须位于仓库之外，父目录须已存在）：

```sh
node research/tapeweave/demo/local-server.mjs /tmp/tapeweave-web.sqlite 8787
```

打开终端输出的完整`http://127.0.0.1:8787/#…`地址。仅本机监听，不发布网络服务；停止按Ctrl+C。启动凭据每次重新生成，旧凭据不再有效。切勿分享完整URL；页面读取fragment后移除地址栏凭据，存于本标签页sessionStorage。存储不可用时拒绝提交。重启服务后使用新URL，同一数据库与会话ID可继续读取。

1. 在静态工作室复制创作包，粘贴到本地页。输入新会话ID、选择byte或plain并新建；同名不覆盖。
2. 等待、等待、触发、触发；默认包应训练2、门1、剩1钥匙，逐拍8行。两宿主同一SQLite事务提交。
3. 刷新自动读取最后加载会话；模式来自持久配置，不取新建选择器。已有命令ID重试返回原回执后再读最新快照，不重复推进。
4. 完成四拍生成回放并复制，可交工作室或CLI复核；未完成不能导出。剪贴板失败选中文本供手动复制。
5. 请求结果不确定时保留命令ID和载荷于sessionStorage，禁用新动作；点击重试。明确旧版本拒绝时重试会清理该未提交命令并读取最新快照；其他错误保留命令，不猜测是否提交。关闭标签页可能丢失待确认信息，SQLite仍保留已提交命令。

接口限POST JSON、24 KiB请求、16 KiB创作包；精确字段、固定同源Origin／Host及随机启动凭据，拒绝跨源访问，不开放CORS。仅白名单HTML／JS／CSS可读取，数据库及服务源码不通过HTTP公开。数据库路径与已有WAL／SHM拒绝符号链接；这不抵御本机恶意进程、路径竞态或同源脚本入侵，不是账户权限、安全审计或可公开部署方案。禁止反向代理到公网。没有网页会话列表、删除、自动同步工作室localStorage、多人权限或HTTP备份恢复服务；本地CLI逻辑备份见下文。

作者测试：首次统一15组通过（12组Node、3组Chrome）；添加HTTP客户端10秒超时后最终统一复跑在工作室探针120秒超时，单独重跑工作室及持久网页均通过，不能称最终同一次15组通过。HTTP覆盖双模式、去重、冲突、重启、导出复核及Host／Origin／凭据／请求／静态边界；真实Chrome覆盖两模式新建四拍、回放导出、刷新恢复、丢回执后重试不重复提交及320px布局。不是实际手机、系统剪贴板或独立采用验证。历史下述“无网页接入”只描述旧CLI阶段；公开Pages仍不能运行SQLite。

## 新增：本地逻辑备份与恢复

新增`archive-host.mjs`，不是复制活动SQLite主文件，而是在一致读事务内重算全部会话并导出配置、命令ID、版本、动作与双宿主回执。支持未完成局续跑及旧命令重试；普通模式获得同等支持。不含钱包、启动凭据、认证身份或RPC来源证明。

```sh
# macOS下/tmp可能是符号链接，使用其真实目录/private/tmp；其他系统用真实外部目录
node research/tapeweave/demo/archive-host.mjs backup /private/tmp/tapeweave-web.sqlite /private/tmp/tapeweave-archive.json
node research/tapeweave/demo/archive-host.mjs restore /private/tmp/tapeweave-restored.sqlite /private/tmp/tapeweave-archive.json
node research/tapeweave/demo/host-cli.mjs /private/tmp/tapeweave-restored.sqlite show SESSION
```

源库必须存在，备份文件必须不存在；恢复目标DB及WAL／SHM必须不存在，拒绝覆盖和合并。归档先严格UTF-8读取（2 MiB），精确字段及最多100会话、每局4命令，逐局从零重算核对后才创建目标。恢复全部会话处于一个SQLite事务，失败回滚；CLI失败清理本次新建目标。输出文件权限0600；源库及归档均要求仓库外真实父目录，拒绝符号链接路径。需要先建立输出父目录，不向静态服务公开文件。不要用shell重定向覆盖DB或归档。

一致读只表示导出时点，之后新提交不自动进入旧备份；备份后继续操作不会被镜像。工具使用SQLite打开源库，可能维护WAL，不是文件系统只读。归档包含完整行为及动作，请自行安全保存；它是未认证逻辑记录，不是数据库字节备份、可信历史或物理灾难恢复保证。不能抵御本机恶意进程／路径竞态；没有加密、定时任务、公网恢复接口或自动删库。

本轮统一18组作者测试通过（15 Node＋3 Chrome），新增覆盖两模式部分局备份恢复、旧ID重试不重复推进、续跑完成、同名拒绝、损坏拒绝且不创建库、事务异常回滚。首次专项因macOS `/tmp`指向真实目录而被安全限制拒绝；测试改用真实目录后通过，没有放宽路径校验。Chrome通过仍不等于手机、系统剪贴板或独立采用；也不解释前轮启动超时。

## 运行（Node 24，内置node:sqlite）

在仓库根目录执行，下列数据库路径由你指定。不要放在公开静态服务目录；DB、WAL、SHM文件均可能含完整行为与动作记录。无需安装依赖、RPC或钱包。

```sh
node research/tapeweave/demo/host-cli.mjs /tmp/tapeweave.sqlite create demo pulse byte
node research/tapeweave/demo/host-cli.mjs /tmp/tapeweave.sqlite act demo a 0 0
node research/tapeweave/demo/host-cli.mjs /tmp/tapeweave.sqlite act demo b 1 0
node research/tapeweave/demo/host-cli.mjs /tmp/tapeweave.sqlite act demo c 2 1
node research/tapeweave/demo/host-cli.mjs /tmp/tapeweave.sqlite act demo d 3 1
node research/tapeweave/demo/host-cli.mjs /tmp/tapeweave.sqlite show demo
```

预期训练score 2，钥匙门score 1、resource 1。每次CLI重新打开数据库，因此最后查询跨进程恢复。普通对照使用另一个SESSION并`create other pulse plain`。

读取存档时重新校验配置的精确字段、布尔模式及八行整数位表；非法JSON、额外字段或损坏配置会拒绝读取、动作与重试，不自动修复。此检查不认证配置来源。

相同SESSION、相同命令ID、version、trigger重试先重算核对当前完整日志，再返回原回执，不增加回合；日志损坏时拒绝（包括重试的那条回执看似正常、但另一条已损坏的情况），不修复或覆盖原日志；相同ID更改payload拒绝。换新ID但沿用旧version也拒绝。完成四拍后仍可重取已有命令回执，不能提交第五拍。

## 导入自定义创作包

```sh
node research/tapeweave/demo/host-cli.mjs /tmp/tapeweave-custom.sqlite import custom research/tapeweave/demo/creator-artifact-example.json byte
```

也可将路径换成工作室导出的16 KiB以内创作包，模式用`plain`获得同等规则对照。导入先严格UTF-8读取、重编译并核对字节／SHA，校验失败不会打开或创建数据库；成功创建零态新会话，不导入成绩或网页进度。同名会话拒绝且不覆盖；随后用上文`act`／`show`流程操作。导入仅连接创作包配置与SQLite，不是浏览器自动同步。数据库路径不能与输入包相同，也应远离静态服务目录。

作者专项使用非模板“请求恒1、下一状态恒0”，以两模式分别导入、逐命令重开、查询并与离线回放结果比对；重复会话拒绝不改原局、坏摘要不创建数据库均通过。它复用作者引擎，不是独立求值验证。

## 导出完成局的未认证回放

```sh
node research/tapeweave/demo/host-cli.mjs /tmp/tapeweave-custom.sqlite export custom > /tmp/tapeweave-durable-replay.json
node research/tapeweave/demo/verify-creator.mjs replay /tmp/tapeweave-durable-replay.json
```

仅接受已完成四拍的会话；先在一致读事务内重算并核对日志，再从固定配置和动作生成现有创作回放schema，字节／普通模式均支持。可粘贴到工作室“仅复核，不装载”。它不追加动作、不更改会话；打开SQLite仍沿用初始化／WAL设置，不是文件系统只读工具，勿对只读归档直接运行。未完成局或日志计算不一致时退出1，不输出回放；shell重定向可能已创建空输出文件，不能仅看文件存在判断成功。不要把输出重定向到数据库、WAL、SHM或输入包。

回放不携带可认证的会话ID、命令ID或时间，只含重算所需配置、动作和结果，`authenticated:false`且链身份null。任何可写数据库的人仍能重造一致日志，导出不证明真实提交历史。作者专项验证两模式导出→现有验证器往返、导出不推进会话、未完局和损坏receipt拒绝；不是独立验证或链回执。

## API及事务

`openStore(path)`提供`create(id,{next,request,plain})`、`act(id,{id,version,trigger})`、`snapshot(id)`及`close()`。API支持编译器接受的八行行为表；CLI可选两个模板或导入经过校验的创作包。create后不支持更新配置，换卡必须新建会话。

- 单个动作事务使用BEGIN IMMEDIATE，锁内检查命令ID、读取日志、重建两个宿主、计算并插入一份包含双宿主状态的回执，再COMMIT。任一计算或插入失败则ROLLBACK。
- 每个会话版本唯一、命令ID唯一；WAL、synchronous FULL、busy_timeout 5000。超过锁等待报错，调用方用同命令重试；不承诺无锁等待或无限重试。
- 当前最多四条动作，恢复时从零重算并比对保存回执；读取快照也使用事务。没有额外可漂移的物化score字段。
- 离线测试覆盖关闭重开、成功提交后重取回执、提交前SIGKILL回滚、两个真实子进程争用同version（仅一个成功），以及注入提交前异常的回滚。

## 不代表什么

此适配器**没有接入浏览器工作室**；网页另有同源localStorage保存编译配置与动作，刷新时重算恢复；那不是此SQLite适配器，不能继承其事务保证。CLI与SQLite用于开发者离线接入，不是网页持久化产品。没有HTTP服务、账户、授权、签名、历史真实性、钱包、链消费或跨数据库事务。浏览器保存模式先重算两个候选并写入单个localStorage键，再发布内存状态；写入失败不推进当前局，但不提供跨标签CAS、账户隔离或SQLite的原子事务。内存回退模式仍顺序调用。

本地有文件写权限的人能篡改配置与动作并重算回执；恢复比对只发现计算不一致，不认证历史。新增逻辑归档恢复已做作者测试，但数据库物理损坏、磁盘故障与所有操作系统断电语义未全面验证。SIGKILL测试不等于物理断电测试。若备份运行中数据库，应使用SQLite备份机制或停写关闭后按SQLite要求操作，不只复制一个活动DB文件。

`beforeCommit`仅供故障注入测试，调用方不得传入不可信代码。此模块是本地开发接口，不是公网安全边界。
