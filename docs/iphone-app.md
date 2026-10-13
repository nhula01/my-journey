# My Journey on iPhone

My Journey is an installable web app hosted at https://nhula01.github.io/my-journey/.
There is no App Store submission, Apple developer membership, signed IPA, or device
profile to install. Safari adds the app to the Home Screen; the manifest requests
standalone display. This is a web app rather than a native iOS binary.

Open the URL in Safari, choose Share (sometimes inside the page menu), then Add to
Home Screen. Enable Open as Web App if offered and tap Add. If the action is
missing, use Edit Actions in Safari's Share menu. The in-page Install app button
shows these instructions. Browsers supporting beforeinstallprompt can display
their own install prompt. No programmatic Safari install prompt exists.

Apple instructions: https://support.apple.com/guide/iphone/iphea86e5236/ios
WebKit manifest behavior: https://webkit.org/blog/13878/

## What works offline

After a successful online setup, the app shell, workout prescriptions, muscle
maps and per-device checklist are available offline. The latest successfully
fetched public journal snapshot is cached and labeled when used as a fallback.
Embedded YouTube videos, external references, and meal photos need internet.
Offline availability depends on the browser retaining website storage.

Checklists use existing localStorage keys; nothing is converted into a completed
exercise log. Safari and the installed app can have separate storage, and
checkmarks do not sync across devices. Installing does not import Safari checks.
New meal, measurement or exercise records continue to be logged in project chat
and appear after public export and deployment. There is no direct chat connector
or new data-entry backend in the installed app.

## Updates and privacy

The service worker caches an explicit, versioned list of assets, scoped correctly
to the GitHub Pages subdirectory. A new shell waits while the current version is
open. Update & reload activates it on request; closing all app windows also lets
the browser activate it. On changes to shell resources, bump VERSION in sw.js and
its ASSETS list to match the head's versioned URLs. Keep stable public-data cache
across upgrades. Public journal uses network first with a labeled cache fallback.

Only the authorized public journal.json is cached. /api/ and /journal-photos/
are excluded explicitly. Private local records never enter service-worker caches.
Third-party responses and videos are not cached. Unrelated same-origin pages and
other projects' caches are left alone. Offline mode does not add authentication
to this already-public site.

## Verification

Use tests/pwa.test.cjs for a manifest/asset contract and mocked service-worker
tests, including scoped navigation, private exclusions, offline fallbacks and
non-disruptive updates. Browser QA covers mobile layout and the install guide.
An actual iPhone is required to verify Safari's native installation sheet and
standalone launch; desktop responsive mode cannot simulate that system UI.
