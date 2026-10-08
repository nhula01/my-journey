# My Journey

Two pages, following MyBook's paper-and-notebook design: a nutrition/weight
dashboard and a piano practice journal.

## Run

```sh
python3 scripts/server.py
```

Open http://127.0.0.1:8008. No installation or build step is needed.

## Food logged in this project

Share food descriptions, portions, drinks and meal photos in the project chat.
The assistant analyzes them, saves calories and macros with uncertainty ranges,
and records practical meal-specific suggestions in `.journey/journal.json`.
`AGENTS.md` documents the workflow for future chats in this workspace.

The weight dashboard reads the private project journal through `/api/journal`
and refreshes every 30 seconds. It has calories, protein, carbs, fat, fiber,
calorie/macro target progress (when targets are supplied), food cards, suggestions,
weight/BMI/goal statistics and historical nutrition/weight charts. It has no daily
check-in form. Unknown nutrition is not counted as zero; partial totals are marked.
The assistant must actually save each chat log; the website does not read chat
messages on its own. This workflow does not need an API key.

Correct a meal using the same meal ID. Log different meals using distinct IDs.
The update helper validates records and replaces corrections so food is not counted
twice. Nutrition sources are `estimate`, `label`, or `user`; units are kcal and g.
Measurements are kg and cm.

```sh
python3 scripts/journal.py meals /path/to/meal.json
python3 scripts/journal.py measurements /path/to/measurement.json
python3 scripts/journal.py reflections /path/to/day-reflection.json
python3 scripts/journal.py goals /path/to/goals.json
python3 scripts/journal.py validate
```

Private food photos belong in `.journey/photos/`. The server exposes only image
filenames under `/journal-photos/`, never arbitrary files. Back up `.journey/`
to preserve your project logs. Old browser-based weight entries remain stored in
IndexedDB but are not mixed into this project dashboard; no sample records are
used as real measurements. Piano practice still uses browser storage and its
existing export/import backup controls.

## GitHub Pages

The workflow publishes only `site/`. `.journey/` is gitignored and stays private.
The user has authorized publishing the journal records and referenced meal photos.
`python3 scripts/export-public-journal.py --publish` exports only the journal display
fields and referenced photos to `site/`. Commit and push that snapshot to update
GitHub Pages. `.journey/` itself, credentials and unrelated files remain excluded.
Public records can be read by anyone, including through the GitHub repository.

Once GitHub CLI is authenticated, `sh scripts/publish.sh` creates the public
`my-journey` repository, pushes the site, configures Pages, and starts deployment.
It stops if a repository with that name already exists. Expected address:
https://nhula01.github.io/my-journey/.

## Verify

```sh
node --check site/weight.js
node --check site/app.js
node --test tests/nutrition.test.cjs
python3 -m unittest discover -s tests -v
```

## Daily calorie planning and exercise

The weight dashboard separately shows estimated calories to maintain current
weight, reach the goal, and maintain goal weight. The calculation uses the NIH
Body Weight Planner's public equations locally, without submitting personal
measurements to NIH. Inputs and activity assumptions are saved with the private
plan. Plans are marked stale when recorded weight or goals change. Recalculate
with `scripts/calculate-energy.cjs` after updating relevant inputs; see
`scripts/nih-model/README.md` for assumptions and provenance.

Workouts supplied in chat are saved with `python3 scripts/journal.py activities`.
Sessions include ID, date, title, minutes, and optionally burn calories with a
source. Workout burn is displayed separately and is never automatically added
to the food calorie budget.

## Piano learning workflow (current)

The main piano page now centers on learning from pieces and other people:
source/contributor, tip, what you learned, what you tried, and what happened.
Each logged day may include one suggested next theory/technique topic, its reason,
a short exercise and a success check. Resource links are attributed; reported
advice is distinguished from independently reviewed source content. This flow
does not require video/audio analysis.

Log entries using `python3 scripts/journal.py pianoLearning record.json`.
`pianoFocus` stores the current piece and an initial plan separately from completed
learning days. Selecting a piece does not invent a learning log. The Entertainer
is the current selection; the original versus simplified arrangement remains
unconfirmed. Old recordings remain accessible under optional references.

## Guided piano repertoire

The piano studio includes eight repertoire paths, from Ode to Joy to Clair de lune,
with score preparation, a piece-specific skill, hands-together practice and phrasing.
The Entertainer remains available alongside the classical library. A browser metronome
supports 30–200 BPM. Self-checks and library selection stay in this browser’s local
storage; they are not completed journal entries or automatic accuracy scores.
Use a separately chosen score; no sheet music or MIDI assessment is bundled.

## Interactive score practice

The piano page now has a note-following player with three built-in public-domain
opening excerpts (Ode to Joy, Für Elise and Bach’s C-major Prelude). They are
practice excerpts, not complete editions. Load a standard format 0/1 `.mid` file
(up to 2 MB and 20,000 notes) to practice another or a complete song. Imported
files stay in memory on your device and are not uploaded. The part selector takes
the highest or lowest note at each onset, or all simultaneous notes for MIDI
chord practice; it does not identify a musical voice across overlapping tracks.
The staff displays pitches and approximate note durations with labels, without
reconstructing the source score’s meter, phrasing, rests, ties or full engraving.

Connect a MIDI keyboard with Web MIDI, or allow microphone access for single-note
pitch detection from C2 to C6. Microphone audio is analyzed locally with Web Audio,
not recorded or uploaded; acoustic accuracy depends on the instrument and room.
Unsupported APIs, denied permissions and disconnected keyboards show actionable
messages. MIDI and microphone access require a secure origin (the public HTTPS
site or localhost) and browser support. See [Web MIDI](https://developer.mozilla.org/en-US/docs/Web/API/Web_MIDI_API)
and [microphone access](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia).

Wait-for-note mode highlights the next note group and advances only on matching
pitches; repeated notes require a release. Finishing an excerpt with at least 90%
pitch accuracy (correct groups divided by groups plus wrong attacks) saves a pass
in browser storage for built-in excerpts. Rhythm, note lengths and expression
are not graded. Imported files are not persisted. Browser passes are separate
from the private chat journal and do not create practice records.

Verify the parser, pitch detector, repeated notes, chords, input adapters, pass
threshold and device cleanup with `node --test tests/piano-*.test.cjs`. Synthetic
audio and simulated MIDI verify the software; real hardware needs user testing.
