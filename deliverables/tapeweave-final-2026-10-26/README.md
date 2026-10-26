# TapeWeave final demo and submission pack

Prepared October 26, 2026. These files are included in the repository publication, not a YouTube upload or a submission receipt.

## Ready-to-use files

- `TapeWeave-Final-Demo.mp4`: real browser walkthrough, English male synthetic narration, burned-in English captions, 1920 × 1080. See `video-timeline.json` for the measured duration; the release must remain below 180 seconds.
- `TapeWeave-English.srt`: optional English subtitle track for YouTube.
- `TapeWeave-Thumbnail.jpg`: actual demo frame, not a fabricated product mockup.
- `SUBMISSION-EN.md`: English project description, problem, differentiation, integration, evidence and roadmap.
- `JUDGE-QUICKSTART.md`: no-wallet reviewer path and chain reproduction pointers.
- `SUBMISSION-CHECKLIST-ZH.md`: actual form fields, missing personal details and final checks.
- `YOUTUBE-EN.md`: ready-to-copy upload title and description.
- `recording-observations.json`: capture provenance and real public RPC result.
- `TapeWeave-Submission-Pack.zip`: compact bundle of final media and submission documents.

## Provenance and limits

Repository snapshot: `85ade0dcb9063d2cf7a9dbd7905a5b67fce119bd`. Public demo source: `https://0xcaptain888.github.io/TapeWeave/research/tapeweave/demo/`.

The screen capture performs real clicks and reads on the public product. English chapter banners are filming overlays, not shipped UI. Microsoft `en-US-GuyNeural` supplies synthetic male narration; this is not a recording of a human voice actor. A small uniform tempo adjustment keeps the deliverable within the official three-minute cap. Captions are sentence/chunk aligned to narration timing, not manually word-aligned.

No new blockchain signature, deployment or payment is requested during filming. Eleven displayed mainnet transactions are historical published evidence; the charge-card check is a fresh read. No wallet provider or RPC response is substituted. The current host covers fixed reviewed behaviors, not arbitrary locally edited onchain rules. Android task closure at the user's request is not independent hardware verification.

## What remains outside this delivery

Upload the MP4 to YouTube as Public or Unlisted, verify playback, add SRT if desired, and copy the resulting URL into the form. The entrant must supply or confirm name, nationality, contact information, team details and eligibility. Repository publication is separate from YouTube upload, social posting and form submission. This recording predates the bilingual UI update: narration, chapter banners and captions are English, but the recorded product UI is Chinese.

## Regeneration

`scenes.json`, `make-voice.py`, `record-demo.mjs` and `assemble-demo.py` preserve the script and production process. Paths are specific to this workstation; rendering requires Playwright, Chromium, ffmpeg, Python/Pillow and Edge TTS. Intermediate MP3, WEBM and `raw/` files are retained locally but are not included in the submission ZIP. The package contains no private keys or API credentials.
