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

## Complete Entertainer score and fingering

The player now bundles Mutopia’s public-domain reproduction of the 1902 edition
of The Entertainer, with its complete PDF, unmodified MIDI and LilyPond source.
The practice dataset contains all 2,621 MIDI notes, including unfolded repeats,
across 152 performed 2/4 measures. Eleven selectable sections follow the source’s
form and endings; these performed measure numbers differ from the 92 printed
measures because repeats are unfolded. The second B pass follows Mutopia MIDI
without applying the printed “Repeat 8va” instruction. The PDF retains that
instruction. Files, attribution and provenance are in `site/scores/entertainer/`.
Regenerate the bundled dataset with `node scripts/build-entertainer.cjs`.

Hand assignment follows the source MIDI staffs, with the cross-staff introduction
split according to the LilyPond voices. Right/left hand modes retain chords;
right-hand top-line and left-hand bottom-line modes reduce each onset to one pitch
for microphone practice. Microphone detection now covers C1–C7; actual acoustic
reliability still depends on the instrument and room. Notes can be paged through
without marking them as played. Preview schedules the entire selected practice,
rather than cutting off after 48 groups. Reconnecting an input resumes the current
attempt; Restart practice explicitly clears it. Passes are stored per part and
section so a section pass does not imply passing the whole piece.

The optional fingering overlay copies checked annotations from Roger Galloway’s
fingered edition. The complete annotated PDF is also available. Untranscribed
notes stay blank; no generated fingering or hand-position coaching is added.

## Two-hand engraved score and moving-sheet practice

The Entertainer now defaults to both hands. Original PDF pages are displayed
inside the piano page, with a four-page selector. A matching interactive score
is engraved from the same LilyPond source with repeats unfolded. It preserves
notation, rests, ties, beams, accidentals, dynamics, and both staves; it is not
a MIDI approximation of the staff. `piano-engraving.js` contains six practice
pages, 30 cropped systems, and notehead timing/pitch attributes. Tests verify
that every MIDI attack has a matching engraved notehead and that motion stays
continuous across system boundaries.

Practice type 1 waits for the correct pitches. Each correct note in a chord
turns green; the group advances only after every required pitch is played.
Practice type 2 moves the grand staff left past a fixed playhead, with a piano
keyboard underneath, following the user’s Simply Piano video reference. It has
a four-beat visual count-in, adjustable 30–200 BPM tempo and MIDI attack
assessment within 160 ms of an onset. Incorrect attacks and missed groups
affect the result. Holding a note cannot satisfy a repeated attack. A timed
pass is saved separately from a waiting-mode pass. Note release lengths and
expression are not graded. Timed moving notation is currently enabled for
the fully engraved Entertainer; other/imported MIDI scores retain sheet mode.
Microphone mode remains single-note-only and cannot assess both-hand chords.

Preview and optional live MIDI monitoring use 88 recorded FluidR3 acoustic
grand-piano samples, bundled locally under CC BY 3.0. There is no oscillator
piano fallback. Attribution and source links are in
`site/audio/grand-piano/README.md`. Demos never create a pass. Audio uses the
Web Audio clock for both scheduling and animation, and stops when the page
is hidden or the user stops playback. No microphone recordings are saved.

Regenerate engraving with LilyPond 2.24.4 (portable official macOS binary used
for this build) and `site/scores/entertainer/practice.ly`, using SVG backend and
`-dno-point-and-click`. Then run `python3 scripts/build-piano-engraving.py
/path/to/svg-output-directory`. Original JPEG previews are rendered directly
from the unchanged PDF with Poppler. The compiled artifacts are bundled so
visitors need neither LilyPond nor an online engraving service.

Fingering displays only Roger Galloway's annotations. The four-page viewer shows
the complete CC BY-SA 4.0 fingered edition. The interactive overlay contains the
selected checked transcription; untranscribed notes stay blank. No generated
fingerings, movement coach or extra keyboard finger labels are shown.


The piano repertoire now has 26 playable selections across seven approximate study levels,
from simple two-hand learning arrangements to concert repertoire. Each level
covers technique, reading, listening, common harmony and readiness checks. Each
piece has prerequisites, a transferable pattern, a focused exercise and five
self-checks. These are authored learning suggestions, not official exam grades
or professional certification. Self-checks use a separate browser storage key;
they do not alter the chat learning journal or its selected piece.

25 newly bundled complete practice scores load on selection, alongside The
Entertainer. Sheet mode and moving mode use the engraved score, both hands,
local MIDI/microphone input and the sampled grand piano. Original PDF pages and
source files are bundled with attribution and licensing in each score folder.
Printed fingerings remain as provided by each edition; editions with no
fingerings are identified, and no generated fingerings are added. Ode to Joy,
Twinkle, Twinkle and Frère Jacques are explicitly identified as simple learning
arrangements, rather than original piano compositions.

To regenerate the library, copy each bundled `practice.ly` and `original.ly` into
an output directory named for its piece id. Compile `practice.ly` there using
LilyPond 2.24.4 with `-dbackend=svg -dno-point-and-click -o practice`. Then run
`node scripts/read-piano-library-midi.cjs OUTPUT_DIRECTORY` and
`python3 scripts/build-piano-library.py OUTPUT_DIRECTORY` from the repository.
The builder keeps source fingerings, maps MIDI grace timing to the corresponding
engraved heads, and retains source voice ownership for cross-staff hand
assignments. Clementi’s three movements are concatenated for the player and
combined MIDI, with individual movement files also retained.

Earlier Moonlight and A-minor Waltz lessons remain clearly labeled study references,
with source links and no bundled practice-player claim.

Full-score playback preserves leading and trailing rests and each movement’s
complete MIDI timeline. Note assessment still grades attacks, not sustained
release length, pedal or musical expression.
