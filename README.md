# TapeWeave

可编辑行为电路与双宿主消费的本地实验。创作八行行为表，编译为有限 NAND／LATCH 字节，在训练和钥匙门两个宿主中运行，并导出、复核创作包与回放。

- [行为工作室](research/tapeweave/demo/studio.html)
- [固定行为挑战](research/tapeweave/demo/index.html)
- [运行与测试指南](research/tapeweave/demo/README.md)
- [SQLite持久宿主](research/tapeweave/demo/PERSISTENCE.md)（Node 24，本地运行，不是网页后端）
- [研究与升级状态](docs/tapeweave-upgrade-roadmap-2026-10-17.md)
- [TapeOut官方规则研究](docs/tapeout-research-2026-10-17.md)

## 运行

在仓库根目录执行 `python3 -m http.server 8000 --bind 127.0.0.1`，打开对应试玩路径。不要将数据库、WAL、SHM或秘密文件放入静态服务目录。

测试：`node research/tapeweave/demo/check.mjs`；本机有Chrome时可加 `--browser`。SQLite模块要求Node 24。

## 公开试玩边界

GitHub Pages仅提供静态文件；工作室进度保存在浏览器同源localStorage，不会自动同步SQLite或其他设备。勿输入秘密或个人敏感信息。

本项目尚未完成真实TapeOut制造、X Layer宿主消费、真人价值验证或参赛视频。制品链身份为null，回放未认证；摘要与重算一致不证明身份或真实历史。普通共享实现提供同等规则，不宣称TapeOut独占业务价值。历史研究和设计分不是完成度或获奖概率。

研究包含被后续结论替代的历史方案，当前状态以升级状态文档为准。第三方片段的原有许可文件保留；此仓库未额外授予统一开源许可证。
