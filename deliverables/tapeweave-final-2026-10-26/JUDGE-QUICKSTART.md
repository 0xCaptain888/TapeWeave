# TapeWeave / reviewer quickstart

## No wallet: approximately two minutes

1. Open https://0xcaptain888.github.io/TapeWeave/research/tapeweave/demo/work.html in a normal browser tab.
2. Keep charge-and-release (`蓄能释放`) and lamp (`点亮灯泡`), then generate (`生成作品并预览`).
3. Click charge (`补能`) and trigger (`触发`). The second step requests the effect; the lamp lights. Trigger again: no recharge, so no new effect.
4. Copy the work package, paste into the receiving field and validate (`校验并试用`). A successful import starts at zero. Charge and trigger again.
5. Refresh and explicitly restore (`恢复本机执行存档`). The two recorded actions are recomputed and restored. Do not generate a new work instead of restoring.
6. Corrupt the digest in a copy, not the only backup, and attempt import. Validation must fail without replacing the valid session.

## Same behavior, different application outcomes

Open https://0xcaptain888.github.io/TapeWeave/research/tapeweave/demo/exhibit.html. Start, charge/reveal in A and charge/redeem in B. Expect two completed tasks and zero remaining stamp stock. Both are author-built samples, not independent integrations or real redeemable assets.

## Real chain evidence, no wallet required

Open https://0xcaptain888.github.io/TapeWeave/research/tapeweave/demo/chain.html. Inspect the 11 historical transaction links. Read charge session1: version4, training2, door1, remaining key1. Read alternating session2: version4, training1, door0, remaining keys2. The page distinguishes published historical snapshots from new RPC reads. A two-endpoint comparison does not establish independent providers or finality.

## Reproducibility

Source snapshot for video: `85ade0dcb9063d2cf7a9dbd7905a5b67fce119bd`. The recording uses the public HTTPS demo and does not substitute wallet providers or RPC replies. Node24 required for SQLite tests.

```sh
node research/tapeweave/demo/check.mjs
CHROME=/path/to/chrome node research/tapeweave/demo/check.mjs --browser
```

For chain reproduction, follow `docs/tapeweave-mainnet-run-2026-10-26.md` and its verifier instructions. No private key is needed for public verification. Do not run signing/deployment tools to reproduce a readonly result.

## Important boundaries

Local packages and traces are not signed identities. Current onchain host supports two fixed reviewed cards; local editor rules are not automatically manufactured. AA web signing needs a compatible deployed smart account and explicit wallet confirmation. Independent developer adoption, full independent UOP simulation and commercial value remain unproven.
