# TapeWeave

![TapeWeave — interwoven green and purple ribbons](research/tapeweave/demo/logo.svg)

**Portable interactive behavior. Verifiable execution. Application-owned outcomes.**

TapeWeave lets creators package finite interaction rules, replay them across compatible applications, and inspect how each input becomes an application-controlled outcome. The prototype combines TapeOut circuit experiments with verifiable X Layer mainnet integration.

**[Try the English demo](https://0xcaptain888.github.io/TapeWeave/research/tapeweave/demo/work.html?lang=en)** · **[中文 Demo](https://0xcaptain888.github.io/TapeWeave/research/tapeweave/demo/work.html?lang=zh)** · **[Watch English demo · YouTube · 2:57](https://www.youtube.com/watch?v=yAIqXygFKH0)** · **[Mainnet evidence](https://0xcaptain888.github.io/TapeWeave/research/tapeweave/demo/chain.html?lang=en)**

No wallet or tokens are needed for the local interaction demo or public chain reads. Optional wallet actions require explicit confirmation.

## Try it in two minutes

1. Open the [English workbench](https://0xcaptain888.github.io/TapeWeave/research/tapeweave/demo/work.html?lang=en). Keep the **Charge & release** template and lamp scene; click **Generate & preview**.
2. Click **Charge**, then **Trigger**. The lamp lights. Trigger again without recharging: the rule requests no new effect.
3. Copy the generated work package into the receiving field and click **Validate & try from zero**. Import starts a fresh session rather than importing someone else's score.
4. Charge and trigger again, refresh the page, then choose **Restore local execution**. Recovery recomputes saved actions.
5. Open the [two-application exhibit](https://0xcaptain888.github.io/TapeWeave/research/tapeweave/demo/exhibit.html?lang=en) to see the same behavior reveal a story and request a local keepsake. Each application retains its own state and resources.

For a longer review, try a corrupted digest and inspect the [mainnet evidence page](https://0xcaptain888.github.io/TapeWeave/research/tapeweave/demo/chain.html?lang=en). [Reviewer quickstart](deliverables/tapeweave-final-2026-10-26/JUDGE-QUICKSTART.md).

## What works today

- **Create and deliver:** named works, finite rule templates/custom rules, visible effects, portable packages and validation that preserves the current session on failure.
- **Replay and recover:** inspect input/state/request traces, explicitly restore local execution, compare versions and perform append-only rollback.
- **Keep application control:** the same behavior can request different outcomes; a request cannot bypass application inventory or permissions. Two author-built receiving applications demonstrate this separation.
- **Compare with a baseline:** ordinary shared truth-table execution is available for comparison. Circuit representation is not assumed to be inherently better.
- **Verify chain evidence:** inspect 11 historical X Layer transactions and perform fresh public RPC reads of the deployed host and recorded sessions.
- **Choose a language:** Chinese/English interface with language-preserving navigation. Switching languages does not translate imported packages, change progress or send transactions.

## Why TapeOut + X Layer?

The experiment is about delivering and inspecting behavior, not moving scores or assets between games. Applications must explicitly integrate the rules and decide what effects they permit.

| Component | Role in the current prototype |
|---|---|
| TapeOut | Circuit experiments and a finite interaction-rule representation; not a complete implementation of arbitrary netlists or the full TAP protocol |
| TapeWeave | Package delivery, receiving application adapters, execution traces, validation and recovery |
| X Layer | A deployed host consuming two fixed reviewed cards, with real transaction evidence and public verification |

Conceptually: **creator rule → portable package → compatible application → application-controlled effect → replayable evidence**.

Local edited rules are **not** automatically manufactured or deployed onchain. The mainnet host currently supports two fixed reviewed cards. Ordinary shared code can also solve many of these problems; comparative integration cost and developer demand remain to be measured.

## Real X Layer evidence

Network: **X Layer mainnet, chain ID 196**. Host: [`0x440c3CC7DdD50566126754199Df7336499eE1E20`](https://www.oklink.com/xlayer/address/0x440c3CC7DdD50566126754199Df7336499eE1E20).

The recorded AA wallet deployment used **ERC-4337 → CreateX → CREATE2**. Deployment, two session opens and eight steps account for **11 real transactions**.

| Recorded session | Steps | Training | Doors opened | Keys left |
|---|---:|---:|---:|---:|
| Charge card · session 1 | 4 | 2 | 1 | 1 |
| Alternating card · session 2 | 4 | 1 | 0 | 2 |

[Public verifier UI](https://0xcaptain888.github.io/TapeWeave/research/tapeweave/demo/chain.html?lang=en) · [Transaction, fee and reproduction report](docs/tapeweave-mainnet-run-2026-10-26.md).

Published historical snapshots and new RPC reads are shown separately. A fresh read does not prove a new signature. Two matching endpoints do not establish independent providers or finality.

## Demo and submission materials

- **[Watch the English demo on YouTube](https://www.youtube.com/watch?v=yAIqXygFKH0):** English interface, English synthetic male narration, chapter titles and burned captions. Original video: 177.2205 seconds, 1080p. [Download MP4](deliverables/tapeweave-final-2026-10-26/english/TapeWeave-Final-Demo.mp4) · [SRT](deliverables/tapeweave-final-2026-10-26/english/TapeWeave-English.srt) · [Thumbnail](deliverables/tapeweave-final-2026-10-26/english/TapeWeave-Thumbnail.jpg) · [Quality checks](deliverables/tapeweave-final-2026-10-26/english/QUALITY-CHECK.md).
- [English project description](deliverables/tapeweave-final-2026-10-26/SUBMISSION-EN.md) · [Reviewer quickstart](deliverables/tapeweave-final-2026-10-26/JUDGE-QUICKSTART.md).
- [Original materials bundle](deliverables/tapeweave-final-2026-10-26/TapeWeave-Submission-Pack.zip): earlier Chinese-interface video with English narration/subtitles. Use the separate English edition above for the latest video.

The entrant has supplied the YouTube demo link above. Event submission is a separate step and is not claimed complete here. Filming used actual browser operations and a fresh read-only RPC check, without new signatures or transactions.

## Current scope and limitations

Status date: **2026-10-26**. This is a **public-source interaction delivery prototype**, not a production marketplace, universal automation engine or proven cross-game economy.

- **Adoption:** the two receiving applications are author-built. Independent developer adoption, revenue, recurring demand and an advantage over ordinary shared code are not established.
- **Identity and permissions:** package digests check content consistency, not publisher identity. Recomputed traces do not authenticate players, observations or ownership. Effect requests are not asset entitlements.
- **Wallets:** ordinary-plugin signing has user-reported success. The AA web signing flow is implemented; actual browser AA compatibility/acceptance is separate from the historical official-tool AA transactions. Independent full UserOperation simulation remains outstanding. No automatic signing, account upgrade or silent fallback is promised.
- **Android:** the nine-item task was closed at the user's request; device details and item-by-item observations were not supplied. This is not independent evidence of nine passed checks.
- **Persistence:** browser recovery and the Node 24/SQLite adapter are local features, not a publicly hosted multiuser backend. Browser storage is not an authenticated backup.
- **Safety:** production security or audited suitability is not claimed. Unknown wallet requests must be reconciled, not blindly resent.

Detailed engineering status and historical observations: [current status](docs/tapeweave-current-status-2026-10-26.md), [wallet compatibility/recovery](research/tapeweave/demo/AA-WALLET.md), and [archived development history](docs/tapeweave-readme-history-2026-10-26.md).

## 中文说明

TapeWeave 探索让创作者设计的有限互动规则，成为可以交付、接入和重新检查的“行为卡”。共享的是规则，不是其他应用的分数、钥匙或权限。应用开发者仍需主动接入，并自行决定允许哪些效果。

先打开[中文作品页](https://0xcaptain888.github.io/TapeWeave/research/tapeweave/demo/work.html?lang=zh)，生成作品，点击“补能 → 触发”，再试用导入和刷新恢复。无需钱包或买币。进阶使用[规则工作室](https://0xcaptain888.github.io/TapeWeave/research/tapeweave/demo/studio.html?lang=zh)；链上操作与本地试玩分开，任何签名都需用户确认。

目前已完成双语界面、规则交付与恢复、两个自编应用示例，以及真实 X Layer 宿主部署和两卡交互。独立团队采用、商业价值、完整 UOP 独立模拟和 Android 逐项证据仍有待验证。[英文 Demo 已提供 YouTube 观看入口](https://www.youtube.com/watch?v=yAIqXygFKH0)，提交报名仍是独立步骤。

## Run locally

Serve this repository as static files:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Open `http://127.0.0.1:8000/research/tapeweave/demo/work.html?lang=en`.

Run checks:

```sh
node research/tapeweave/demo/check.mjs
# With a compatible local Chrome installation:
node research/tapeweave/demo/check.mjs --browser
```

Node 24 is required for SQLite functionality. Keep databases, WAL/SHM files and credentials **outside the repository and static-serving directory**. GitHub Pages serves static content only; it does not run the SQLite service.

## Developer documentation

| Guide | Contents |
|---|---|
| [Work integration](research/tapeweave/demo/WORK-INTEGRATION.md) | Work packages, receiving adapters and ordinary-code baseline |
| [Demo implementation](research/tapeweave/demo/README.md) | Finite NAND/LATCH execution and implementation limits |
| [Persistence](research/tapeweave/demo/PERSISTENCE.md) | Local SQLite transactions, backup and recovery |
| [Integration boundaries](research/tapeweave/INTEGRATION.md) | Timing, ownership and failure boundaries |
| [Contracts](contracts/README.md) | Contract tests, CreateX deployment and verification |
| [Mainnet report](docs/tapeweave-mainnet-run-2026-10-26.md) | Eleven transactions, fees and public reproduction |
| [Wallet guide](research/tapeweave/demo/WALLET-PLAY.md) | Ordinary plugin sessions, receipts and unknown-request recovery |
| [AA guide](research/tapeweave/demo/AA-WALLET.md) | Account capabilities, confirmation and UserOperation checks |
| [Bilingual UI](docs/tapeweave-bilingual-demo-2026-10-26.md) | Language behavior, package preservation and regression checks |
| [Development archive](docs/tapeweave-readme-history-2026-10-26.md) | Earlier feature notes, test runs and stage-specific limitations |

## Source and licensing

Source code is publicly available. Existing third-party license notices remain in place; this repository does **not** currently grant an additional repository-wide open-source license. Do not infer unrestricted reuse rights from public visibility. A licensing decision is separate from this documentation update.
