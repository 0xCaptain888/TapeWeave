# 本地持久宿主：SQLite与命令回执

日期：2026-10-17。作者离线实现，无外部事实或新增链证据。

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

本地有文件写权限的人能篡改配置与动作并重算回执；恢复比对只发现计算不一致，不认证历史。数据库文件损坏、磁盘故障、备份恢复与所有操作系统断电语义未全面验证。SIGKILL测试不等于物理断电测试。若备份运行中数据库，应使用SQLite备份机制或停写关闭后按SQLite要求操作，不只复制一个活动DB文件。

`beforeCommit`仅供故障注入测试，调用方不得传入不可信代码。此模块是本地开发接口，不是公网安全边界。
