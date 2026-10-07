# NIH/NIDDK Body Weight Planner model

Public model service files retrieved from https://www.niddk.nih.gov/bwp/services/
on October 6, 2026: baseline.js, bodychange.js, bodymodel.js, dailyparams.js,
intervention.js. Original equations and comments are preserved. These are used
by `scripts/calculate-energy.cjs` in a VM context with no network/file APIs.
This project is not endorsed by NIH.

The wrapper follows the site's appController.js goal calculation: automatic RMR
and body-fat estimates, unchanged physical activity, default carbohydrate and
sodium assumptions, target convergence tolerance 0.001 kg, and maintenance
calculated from the modeled body composition after goal attainment. The wrapper
explicitly fixes the constructor's false-sex fallback for female inputs.

PAL 1.5 is a provisional mapping from daily walking/standing (light work) and no
additional intentional leisure exercise. It is not a measured energy expenditure.
Do not mix PAL values with activity multipliers from a different calculator.
Model outputs are estimates; the deadline does not guarantee an outcome.

Source and guidance: https://www.niddk.nih.gov/bwp
Activity mapping: https://www.niddk.nih.gov/bwp/controllers/palDialogController.js
Goal calculation: https://www.niddk.nih.gov/bwp/controllers/appController.js
