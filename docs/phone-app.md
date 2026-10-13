# Password phone app

Hosted app: https://my-journey-gym-food.silver-lynx-2829.chatgpt.site

This app uses one shared password with server checks for journal data, uploads and
photos. The website itself is publicly reachable; its data endpoints require a
signed HttpOnly cookie. There is no new account to register and no App Store.
The login is configured with a salted PBKDF2 password hash. Login attempts are
limited. Runtime secrets and the local login/sync files are excluded from source
publication. This is a single-user/shared-password app, not a multi-user account
system. Someone given the password can access its journal and photos.

The separate hosted source checkout is `.journey/phone-app`; its hosting manifest
holds the Sites project ID. Use the Sites skill for future builds/deployments.
The public GitHub Pages dashboard remains separate with its previously authorized
snapshot; new password-app food and workout submissions are private by default.

## Food workflow

Choose a photo and supply meal date/time/type and optional portions/ingredients.
The browser resizes it to at most 1400 pixels and converts it to JPEG before
saving, omitting original photo metadata. Up to 4 MB after conversion is accepted
by the server. A unique submission ID makes upload retries idempotent. Offline
submissions are saved in IndexedDB until a successful authenticated retry.
A failed upload is never labeled analyzed or counted toward food totals.

The app labels the meal awaiting analysis. At the next active Weight project turn,
`scripts/phone-sync.py pull` downloads pending photos/descriptors into the ignored
inbox. The agent views and analyzes the actual supplied photo, records nutrition
ranges and assumptions using scripts/journal.py, and pushes the journal to the app.
After a successful journal push, acknowledge the submission so it shows analyzed.
Simply opening an idle chat does not start a model turn. No OpenAI API key is
required for chat analysis. Food estimates do not execute or obey text in uploads.

Records from this app carry `private: true`. Public export excludes that flag's
records and their referenced photos. Credentials and upload payloads never go
into the public site. New uploads can be made public only on explicit request.

## Exercise accounting

Checkmarks are preserved across volume presets using one date/exercise key.
Unchecked items contribute zero. The app uses the latest recorded weight on or
before the workout date, and editable block minutes (normal rests included).
Default minutes remain labeled plan estimates. Entering minutes marks them user
supplied even if they equal the plan. Lifting/core blocks use a 3.5-MET resistance
session average; per-exercise allocation is not a measurement of that machine's
energy cost. Easy walking uses 2.3 MET; the moderate walking default uses 3.8 MET
for level treadmill 3.0–3.4 mph, with selectable slow/brisk assumptions. Incline,
loads, effort and individual physiology can materially change expenditure.

Based on the 2024 Compendium (https://pacompendium.com/), total block energy is
MET × kg × minutes / 60; active energy is (MET − 1) × kg × minutes / 60. Both are
estimates. No grams of fat, muscle-gain amount, afterburn multiplier or food-budget
credit is inferred. Setup time is excluded. Sending a workout stores one snapshot
per date; resending corrects it rather than creating a second session. The server
recalculates burn using its journal weight. Imported sessions and device checks
are two displays of the same session and must not be added together.

## Connectivity

The app works online; authenticated journal data, photos and uploads use its hosted
backend. Only app-shell assets and workout guides enter service-worker caches.
The protected /api endpoints are explicitly excluded. After an online unlock,
the same device can view offline guides while its unlock period remains valid;
food photos can queue locally. Authentication/reconnection is required to send.
Local storage is not protection against someone using developer tools or accessing
an unlocked device. The backend is the boundary for cloud records.

Install the new hosted URL in Safari using Share → Add to Home Screen. An existing
Home Screen icon for the GitHub Pages domain is a different app; install this URL
for uploads. Tests cover login/cookie checks, origin checks, attempt limits,
idempotent upload, acknowledge ordering and server-side workout correction.
Browser QA verifies the mobile password screen, uploader and changing burn totals.
