# TapeWeave / reviewer quickstart

## No wallet: approximately two minutes

1. Open https://0xcaptain888.github.io/TapeWeave/research/tapeweave/demo/work.html?lang=en in a normal browser tab.
2. Keep Charge & release and the lamp scene, then click **Generate & preview**.
3. Click **Charge** and **Trigger**. The second step requests the effect; the lamp lights. Trigger again: no recharge, so no new effect.
4. Copy the work package, paste into the receiving field and click **Validate & try from zero**. A successful import starts at zero. Charge and trigger again.
5. Refresh and explicitly choose **Restore local execution**. The two recorded actions are recomputed and restored. Do not generate a new work instead of restoring.
6. Corrupt the digest in a copy, not the only backup, and attempt import. Validation must fail without replacing the valid session.

## Same behavior, different application outcomes

Open https://0xcaptain888.github.io/TapeWeave/research/tapeweave/demo/exhibit.html?lang=en. Start, charge/reveal in A and charge/redeem in B. Expect two completed tasks and zero remaining stamp stock. Both are author-built samples, not independent integrations or real redeemable assets.

## Real chain evidence, no wallet required

Open https://0xcaptain888.github.io/TapeWeave/research/tapeweave/demo/chain.html?lang=en. Inspect the 11 historical transaction links. Read charge session1: version4, training2, door1, remaining key1. Read alternating session2: version4, training1, door0, remaining keys2. The page distinguishes published historical snapshots from new RPC reads. A two-endpoint comparison does not establish independent providers or finality.

## Reproducibility

English video source snapshot: `62e30e5792f56b132def67a9e3aea6e638466f92`. See the [English video](english/TapeWeave-Final-Demo.mp4) and its [capture observations](english/recording-observations.json). The recording uses the public HTTPS demo and does not substitute wallet providers or RPC replies. Node24 required for SQLite tests.

```sh
node research/tapeweave/demo/check.mjs
CHROME=/path/to/chrome node research/tapeweave/demo/check.mjs --browser
```

For chain reproduction, follow `docs/tapeweave-mainnet-run-2026-10-26.md` and its verifier instructions. No private key is needed for public verification. Do not run signing/deployment tools to reproduce a readonly result.

## Important boundaries

Local packages and traces are not signed identities. Current onchain host supports two fixed reviewed cards; local editor rules are not automatically manufactured. AA web signing needs a compatible deployed smart account and explicit wallet confirmation. Independent developer adoption, full independent UOP simulation and commercial value remain unproven.
