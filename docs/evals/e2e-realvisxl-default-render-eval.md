# Eval: RealVisXL Default End-To-End Render

Date: 2026-05-19
Artifact scope: RealVisXL default model setting, React workbench E2E path, Local A1111 Deforum render path, source assets, prompt payload compaction
Evaluator: Codex
Status: Pass with caveat for app/UI checks; fail for full real Deforum artifact generation

## Eval Methodology

- Inspected `git status -sb`, `config/model-options.json`, and `assets/images/source/**/*.png`.
- Verified `config/model-options.json` parses as JSON and now has `defaultModelId: "realvisxl-v5"`.
- Checked all 24 source PNGs with .NET image metadata; no non-`1680x720` assets were reported.
- Confirmed Local A1111 Deforum API responds at `http://127.0.0.1:7860/deforum/api_version`.
- Verified current RealVisXL model metadata from Hugging Face: repository `SG161222/RealVisXL_V5.0`, task/model tags include text-to-image/diffusers/safetensors/SDXL pipeline, and license is `openrail++`: https://huggingface.co/SG161222/RealVisXL_V5.0
- Ran deterministic checks: `git diff --check`, `pnpm test`, `pnpm build`, and `pnpm exec playwright test`.
- Ran a fresh UI-driven Local A1111 pass on `http://127.0.0.1:5206/` without changing the model dropdown.
- Ran direct Deforum batch API repros to isolate preparation failures.

## Criteria

| Area | Result | Notes |
|---|---|---|
| Source faithfulness | Pass | Findings are grounded in repo files, generated job JSON, screenshots, and live Deforum job status. |
| Scope control | Pass | Changes remain prototype/backend-adapter focused and do not claim production readiness. |
| UI/config usefulness | Pass | The UI starts with RealVisXL V5.0 selected by default and keeps 8 prompt nodes. |
| Model comparison | Pass with caveat | RealVisXL metadata was checked from Hugging Face; production approval is not claimed. |
| 1680x720 handling | Pass | Source assets remain `1680x720`; preview remains `896x384`; default render target remains 8 seconds at 60 fps. |
| Windows setup | Pass with caveat | Local A1111 is reachable, but the current live Deforum looper/batch behavior blocks the default 8-image render. |
| Evidence quality | Pass with caveat | UI screenshots and job JSON are saved, but no new MP4 artifact was produced. |

## Results

Deterministic checks:

- `git diff --check`: pass with CRLF warnings only.
- `config/model-options.json` JSON parse: pass.
- Source image dimensions: pass, 24 PNGs checked with no non-`1680x720` failures.
- `pnpm test`: pass, 30 tests.
- `pnpm build`: pass.
- `pnpm exec playwright test`: pass, 1 smoke test.

UI-driven RealVisXL render evidence:

- Evidence JSON: `outputs/logs/e2e-realvisxl-2026-05-19-102139661-result.json`
- Before screenshot: `outputs/logs/e2e-realvisxl-2026-05-19-102139661-before-render.png`
- After screenshot: `outputs/logs/e2e-realvisxl-2026-05-19-102139661-after-render.png`
- UI default model value: `realvisxl-v5`
- UI default model label visible: `RealVisXL V5.0`
- Render button: `Render Deforum`
- Backend result: failed, `Deforum render failed: 500 Deforum job failed: Invalid arguments.`

Latest failed UI job:

- Job evidence: `outputs/logs/e2e-realvisxl-latest-job.json`
- Job ID: `batch(226918402)-0`
- Model checkpoint schedule: `0: ("RealVisXL_V5.0_fp16.safetensors")`
- Frames/FPS: `480` frames at `60` fps
- Resolution: `896x384`
- Seed: `123456`
- Source images: 8 guided image keyframes
- Failure: `FAILED`, phase `PREPARING`, message `Invalid arguments.`
- Output artifact: none

Direct API repros:

- One guided image reached `GENERATING`, then failed with `Generation error`; evidence `outputs/logs/e2e-realvisxl-minimal-job.json`.
- Two guided images reached `GENERATING`, then failed with `Generation error`; evidence `outputs/logs/e2e-realvisxl-2key-job.json`.
- Three or more guided images failed in `PREPARING` with `Invalid arguments`; evidence `outputs/logs/e2e-realvisxl-key-threshold.json` and `outputs/logs/e2e-realvisxl-3key-wide-spacing-job.json`.
- An eight-keyframe quick repro failed in `PREPARING`; evidence `outputs/logs/e2e-realvisxl-8key-spaced-job.json`.

## Weaknesses

- The full default 8-image RealVisXL path does not produce an MP4 yet.
- The live Deforum batch API does not expose a useful traceback through job status; it reports only `Invalid arguments.` for preparation failures.
- The existing committed Playwright smoke test verifies UI behavior and mock rendering, but does not yet provide a stable automated real-backend assertion for multi-minute renders.
- The direct repro suggests the current blocker is the guided-image/looper batch path for 3+ source images, not the model dropdown or the negative-prompt syntax.

## Recommended Improvements

- Add a focused adapter/backend test mode that can submit 3+ guided images with tiny frame counts and capture the backend traceback.
- Investigate Deforum looper constraints for `init_images` with 3+ keys in `/deforum_api/batches`; compare against the older successful 8-image local run.
- Consider a fallback strategy that renders pairwise two-image morphs and stitches segments until the 8-image looper path is stable.
- Update the real-backend Playwright path to use a shorter controlled render fixture and preserve screenshots/job JSON on failure.
- Keep RealVisXL as the UI default for review, but do not mark the full default render path ready until a non-empty MP4 is produced.

## Revised Notes

The RealVisXL default configuration is correctly wired in the UI and test/build smoke checks pass. The Local A1111 adapter now compacts shared prompt guidance into Deforum-native positive/negative fields, which keeps the request cleaner. However, the current live Deforum backend still rejects the default 8-image guided render before generation, so this eval does not produce a reviewable video artifact. The next engineering step is to fix or route around the 3+ guided-image looper/batch preparation failure.
