# CI #239: Standard desktop viewport for future browser tests

Approved policy: **1920 x 1080 Chromium viewport content pixels** (not the
physical desktop display). All new browser test entrypoints must use this
single desktop viewport. New product UI should support ordinary long-text
wrapping, scrolling, reachable controls and unobstructed math tools at
this viewport; new small-screen or mobile-layout matrices are not required.

## Legacy tests remain unchanged

The grandfathering cutoff is accepted main commit
0231280c506309f3487f0d4a8dfe2f266068a9bf. Browser scripts that existed
at that commit retain ALL of their original size cases (including 1440x900,
1280x720, 980x760, 620x800 and any special sizes), assertions, screenshots,
history and evidence, without any rewrite or reduction. They continue to
run in the existing Required/Fallback workflows as before. Keeping old tests
also means an old small-viewport UI check can still report a failure after
future product changes; such failures must be reviewed separately.

This policy does not require a migration of old test scripts. In particular,
the old 86-invocation snapshot in PR #245 remains a historical inventory,
not a list of future supported window sizes.

## New Chromium test entrypoints

Use the CommonJS helper at tests/helpers/standard-desktop-viewport.cjs.
From a test at the tests/ root, a typical setup is:

    const {chromium} = require(process.env.MATH_PLAYWRIGHT_MODULE || 'playwright');
    const {newDesktopContext, STANDARD_DESKTOP_VIEWPORT} =
      require('./helpers/standard-desktop-viewport.cjs');

    const browser = await chromium.launch({headless: true});
    const context = await newDesktopContext(browser, {
      reducedMotion: 'reduce', serviceWorkers: 'allow'
    });

For ESM, import the CommonJS helper as the default module and destructure.
For nested tests, adjust the relative helper import path.

Every independent browser context in a NEW test uses newDesktopContext.
Never call browser.newContext directly or setViewportSize, and do not supply
inline dimensions to the viewport option. The helper enforces 1920x1080
even when an explicit viewport option is supplied.

## Required evidence and CI

Mathematical correctness, original operations, wrong-to-correct workflows,
negative tests, source provenance, retries, learning history, State-v2,
backup/restore, offline and Service Worker safety, P10, original artifacts
and independently inspectable receipts are NOT relaxed. Only future
redundant viewport coverage is omitted.

Required static-checks run scripts/check-new-browser-viewports.mjs.
It reads tracked tests/scripts from the accepted cutoff commit (full Git
history via checkout fetch-depth: 0), then checks new browser-test entrypoints
on every subsequent run. Old paths are exempt. Newly created browser scripts
must import and use the standard helper, and direct context creation,
inline viewports or page.setViewportSize fail the check. Node tests verify
acceptance, rejection, legacy exemption and the helper's runtime contract.
This is source-level enforcement, not a replacement for real Chromium
browser evidence.
