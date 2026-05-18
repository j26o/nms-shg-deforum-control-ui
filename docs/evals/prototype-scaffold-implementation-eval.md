# Eval: Prototype Scaffold Implementation

Date: 2026-05-18
Artifact scope: React/Vite scaffold, workbench UI, preset schema, mock render adapter, export flow, AI context files, decisions log, and verification setup
Evaluator: Codex using `deforum-prototype-eval`
Status: Pass with caveats; partially superseded by `docs/evals/backend-deforum-smoke-eval.md`

## Eval Methodology

Inspected the current repo state after implementing the PRD/spec execution pass.

Deterministic checks run:

- `git status -sb`
- `git remote -v`
- `Get-ChildItem -Recurse -File assets\images\source`
- `Get-Content -Raw config\model-options.json | ConvertFrom-Json`
- PowerShell/System.Drawing image dimension check for all source PNGs
- `pnpm build`
- `pnpm test`
- `pnpm exec playwright test --reporter=list`
- `git diff --check`

Windows equivalents were used for `find`, `jq`, and `sips` because this workspace is running in PowerShell.

## Criteria

| Area | Result |
|---|---|
| Source faithfulness | Pass |
| Scope control | Pass |
| UI/config usefulness | Pass |
| Model comparison | Pass with caveat |
| 1680x720 handling | Pass |
| Windows setup | Pass with caveat |
| Evidence quality | Pass with caveat |

## Results

Source faithfulness: The implementation follows `docs/deforum-control-ui-prd-spec.md` and uses the existing source assets and model matrix. The PRD's 7:3 canvas, local-only workflow, export contract, and replaceable adapter boundary are represented in code and docs.

Scope control: The app remains a prototype workbench. It does not claim to be the final renderer and does not include production show-control endpoints. At scaffold-eval time, the real render adapter was still a future decision; that decision was later made in favour of Automatic1111 Deforum for the first backend path.

UI/config usefulness: The first screen is a dense tuning bench with source rail, 7:3 preview, timeline, grouped controls, model selection, mock queue, take comparison, and export actions. Frequent values use sliders, selects, toggles, and compact inputs.

Model comparison: `config/model-options.json` still contains 5 profiles and the UI can queue the same preset against multiple selected models. Caveat: model metadata was not changed in this pass, and production approval is not claimed.

1680x720 handling: 24 source PNGs were found under `assets/images/source/`; all checked as `1680x720`. The preset schema validates `target.sourceResolution` as `[1680, 720]`, `target.aspectRatio` as `7:3`, and rejects enabled assets with unexpected dimensions unless marked as crop/pad tests.

Windows setup: `pnpm install`, `pnpm build`, `pnpm test`, and Playwright CLI smoke testing work on this Windows workspace. Caveat: Playwright's ESM config path hung in this environment, so the repo uses a minimal CommonJS `playwright.config.cjs` and starts Vite from the test when needed.

Evidence quality at the time of this scaffold eval: Build, unit tests, E2E smoke, JSON parsing, asset dimension checks, and whitespace checks passed. Caveat at that time: rendered-output evidence was limited to deterministic mock job and take metadata. This caveat was later addressed for a tiny backend smoke render in `docs/evals/backend-deforum-smoke-eval.md`.

## Weaknesses

- The full real render adapter is not implemented.
- No 5-10 second review-sized Deforum or img2img preview clip has been rendered.
- The default asset list in `src/config/defaultPreset.js` seeds 6 of the 24 available source images; full import/discovery is still future work.
- Playwright coverage is a smoke test, not a full workflow regression suite.
- The app uses browser downloads for export; a packaged local file writer would require Electron or another local bridge.

## Recommended Improvements

- Expand the selected first adapter target, Automatic1111 Deforum, beyond the current smoke path.
- Add local source-folder discovery or import controls instead of only seeded default assets.
- Add persistence for draft presets and take notes.
- Add a real preview-render evidence report once the first backend adapter can produce a short clip.
- Expand Playwright tests for timeline reorder/delete, export download payloads, and model matrix queueing.

## Revised Notes

The prototype is ready for UI/config review and first backend adapter work. It is not ready for production renderer handoff until a real local adapter produces review-sized preview clips with model, seed, prompt schedule, render duration, and output-path evidence.
