# TapeWeave — Submission copy

Prepared: October 26, 2026. This is a submission-ready text pack, not a claim that the form has been submitted. Personal fields and a public uploaded video URL still require the entrant's input.

## Project name

TapeWeave

## Tagline

Create a behavior once. Deliver it as a package. Verify how each application uses it.

## Short description

TapeWeave is a public-source interaction delivery prototype for creators and developers. It packages finite behavior rules with a content digest, lets receiving applications run and replay them, and demonstrates a real X Layer host that consumes TapeOut computation. Creators can edit, share, version, restore and check interactive works without connecting a wallet. The onchain demo publishes deployment and two complete runs covering 11 real AA transactions. Applications retain their own permissions and resources; a rule output is a request, not an entitlement. Ordinary truth-table execution is included as a fair baseline.

## Problem and solution

An interaction specification can be difficult to hand over: a video shows the intended effect, but not the precise state transition, version or failure behavior. TapeWeave makes a small interaction executable and inspectable. A creator delivers a behavior package; a receiver runs it in an application, records the trace and can return a replay for recomputation. Content edits and rule changes are treated differently, and corrupted packages do not replace a valid session.

The intended users are creators handing off interactive behavior and developers integrating it into their own applications. Independent adoption and reduced integration cost remain hypotheses to test, not established customer results.

## Working features

- Finite condition/action editor and a byte-based NAND/LATCH experiment representation, with ordinary truth-table execution as a baseline.
- Portable work packages, two local receiving scenes, replay validation and local execution recovery.
- Local version history, comparison, append-only rollback and explicit receiver-side upgrades.
- Two author-built application examples with separate state, permissions and inventory.
- Node 24 / SQLite local persistence adapter and integration documentation; this is not a public multiuser backend.
- Real X Layer host deployment through an AA wallet and CreateX, followed by two complete four-step runs.
- Ordinary EOA web wallet flow, explicit preview/confirmation, pending request recovery and receipt checks.
- Separate EIP-5792 AA web adapter with capability gating, fixed EntryPoint v0.7, request IDs and UOP event verification.
- Read-only connection diagnostics and structured manual acceptance records.

## TapeOut and X Layer integration

The deployed host uses a pinned TapeOut processor and fixed, reviewed charge/alternating behaviors. The public evidence contains the deployed host runtime, 11 transaction references, successful UOP bindings and expected session outcomes. This does not mean arbitrary user-edited rules have been manufactured onchain. The local editor and fixed onchain host are distinct scopes.

- Chain: X Layer mainnet, chain ID 196.
- Host: `0x440c3CC7DdD50566126754199Df7336499eE1E20`.
- Public evidence: https://0xcaptain888.github.io/TapeWeave/research/tapeweave/demo/mainnet-evidence.json
- Detailed run: https://github.com/0xCaptain888/TapeWeave/blob/main/docs/tapeweave-mainnet-run-2026-10-26.md

The video shows historical transaction evidence and a new public RPC read. It does not show a new wallet signature. Browser AA compatibility/signing acceptance is separate from the historical official-wallet run. An internal `eth_call` is not a complete independently simulated UserOperation.

## Why this is different

The project focuses on the handoff between a creator's rule and an application's actual effect: one package, explicit transitions, separate application state, recoverable execution and checkable outputs. It does not assume that token ownership grants an effect or that a circuit request can bypass application inventory. The ordinary-code baseline is deliberately retained, so future developer trials can measure whether the packaging and checking workflow is worth using.

## Current validation and limitations

- Published evidence: 11 historical AA mainnet transactions for host deployment and two complete runs.
- Automated checks cover rule parity, malformed imports, versions, recovery, wallet fixtures, public reads and browser behavior. Test counts must be tied to the corresponding CI commit rather than treated as adoption evidence.
- Ordinary plugin signing: user-reported success; the provided preview alone is not independently verified transaction evidence.
- Android nine-item task: closed at the user's request; per-item device observations have not been independently verified. Do not present this as an independently passed hardware test.
- No claim of independent customers, revenue, publisher authentication, formal security audit or superiority to ordinary shared code.

## Next milestone

Have an independent developer integrate the same package into a real application, measure implementation and maintenance effort against ordinary shared code, and publish the results, including failures. Further engineering includes complete independent UOP simulation, publisher signatures and a carefully scoped route for custom onchain rules.

## Links

- GitHub: https://github.com/0xCaptain888/TapeWeave
- Live workbench: https://0xcaptain888.github.io/TapeWeave/research/tapeweave/demo/work.html
- Mainnet evidence page: https://0xcaptain888.github.io/TapeWeave/research/tapeweave/demo/chain.html
- AA web entry: https://0xcaptain888.github.io/TapeWeave/research/tapeweave/demo/native.html
- Integration guide: https://github.com/0xCaptain888/TapeWeave/blob/main/research/tapeweave/demo/WORK-INTEGRATION.md
- Demo video: upload `english/TapeWeave-Final-Demo.mp4` to YouTube, then enter the public or unlisted watch URL. Do not submit a local path.

## Team / personal fields — confirm before submission

- Builder handle: 0xCaptain (previously supplied by the user; confirm the team name for this event).
- Legal name, nationality, contact email, Telegram, team size, background, eligibility and ability to attend: must be confirmed by the entrant; do not infer from another event or a logged-in account.
- Reuse and development timeline: repository contains earlier research and implementation history. Preserve it and disclose reused components if requested; do not recreate history or claim all work was done during a narrower period.
- Submit only after replacing the video field and checking official eligibility and attendance terms.
