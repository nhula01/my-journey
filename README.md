# My Journey

Two pages, following MyBook's paper-and-notebook design: a nutrition/weight
dashboard. Piano has moved to [OpenPiano](https://nhula01.github.io/openpiano/).

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


## Piano moved

The piano studio is maintained in its own [OpenPiano repository](https://github.com/nhula01/openpiano). My Journey no longer publishes piano scores or learning records. Existing private journal records are retained locally.
