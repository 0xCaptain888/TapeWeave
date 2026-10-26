# TapeWeave — English demo

This edition is newly recorded with the English product interface, English chapter titles, English captions and synthetic male English narration (Microsoft en-US-GuyNeural). It does not replace the original Chinese-interface edition.

- Video: `TapeWeave-Final-Demo.mp4`
- Optional subtitle upload: `TapeWeave-English.srt` (captions are also burned into the video)
- Cover image: `TapeWeave-Thumbnail.jpg`
- Capture evidence: `recording-observations.json`
- Measured scene timings: `video-timeline.json`

The footage shows real browser operations. Mainnet transaction evidence is historical; the public RPC verification is a fresh read. No wallet signature or new transaction is generated for filming. Two receiving applications are author-built examples, not independently adopted integrations.

To reproduce from the repository root, run `record-demo.mjs` and then `assemble-demo.py` from the parent directory with `TAPEWEAVE_VIDEO_LANGUAGE=en`. The original narration MP3 assets are local production intermediates and are not committed. Runtime dependencies and browser paths are documented in those scripts.
