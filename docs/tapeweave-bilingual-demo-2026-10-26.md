# TapeWeave bilingual demo

Implemented October 26, 2026. Local implementation and regression results; not a deployment receipt.

## Usage

- Select 中文 or English in the page header.
- Add `?lang=en` or `?lang=zh` to any demo HTML page for a direct language entry. An explicit URL wins over the stored browser preference. With neither, Chinese remains the default.
- Same-origin HTML navigation carries the chosen language. No remote translation service, API key or upload is used.
- Both languages share the same application implementation and evidence, not two independently maintained copies.

## Coverage and boundaries

The shared catalog covers the eleven main demo HTML pages and repository landing page: create/deliver, manage, studio, challenge, exhibit, chain, native AA, manual/device acceptance and both local persistence interfaces. It includes headings, navigation, controls, explanatory text, accessibility labels and common dynamic states, import errors and wallet warnings.

Untouched sample title/instructions are localized once on initial English load. After that, text fields are creator content. A language switch never rewrites entered text, imported packages, JSON evidence, session records, hashes or user observations. Existing Chinese titles in imported packages remain Chinese. Technical JSON diagnostic values and Markdown guides retain their original language; these are not translated into synthetic evidence. Third-party wallet / RPC errors outside the catalog remain original rather than being hidden or fabricated. The developer pilot starter is not a main demo page and retains its original minimal implementation.

The UI adapter uses exact text mappings plus bounded dynamic-message patterns. It does not replace application `innerHTML`, intercept requests, alter event handlers or change wallet / contract code. A MutationObserver applies the current language to later UI status updates. UI text records preserve their original source for reversible Chinese/English switching. Code should not use translated display text for application decisions.

## Validation

```sh
node research/tapeweave/demo/test-i18n.mjs
node research/tapeweave/demo/test-i18n-browser.mjs
node research/tapeweave/demo/check.mjs
```

The browser suite covers eleven pages, English/Chinese round trips, dynamic trial status, corrupt import rejection, language-carrying navigation, user-content and execution-storage preservation, and 320/390px layouts. These are desktop automated browser checks, not Android hardware or actual wallet signing acceptance. `check.mjs --browser` includes the bilingual suite in future CI runs.

Local results: the 29-suite offline gate and both Python publishing-guard runs passed. The dedicated bilingual Chrome suite and original work-page Chrome regression passed with the cached headless Chromium single-process workaround. A full browser run reached the ordinary-wallet fixture but did not obtain its expected completion marker in that workaround; do not report the complete browser gate as passed. Normal multi-process Chrome CI remains the full acceptance gate after publication. No actual wallet signature or Android hardware test was performed for this language change.

Previously generated video files are not automatically rewritten by this change. An all-English product recording should be recorded again from the English entry after deployment if required for submission.

## Publishing

No push, external upload or Pages deployment is implied by local edits. Once the source is pushed and Pages finishes, verify both direct entries, dynamically updated text, state preservation and wallet disclaimers on the public site before calling the live demo updated.
