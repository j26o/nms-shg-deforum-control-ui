# Eval: Render Tools Project-Root Migration

Date: 2026-05-18
Artifact scope: `render-tools/` folder move, backend path references, context docs, setup docs, model config, local runtime launcher
Evaluator: Codex
Status: Pass with caveats

## Eval Methodology

- Moved the previous external `render-tools` folder to `D:\nms-shg-deforum-control-ui-main\render-tools`.
- Stopped active old-path WebUI/Python processes before moving the folder.
- Added `render-tools/` to `.gitignore` so the nested WebUI checkout, venv, model checkpoints, FFmpeg build, and generated render outputs stay local and are not committed.
- Searched tracked files for stale references to the previous external runtime root and its slash variants.
- Searched docs for wording that framed the repository as only a UI prototype.
- Verified the new backend folder, FFmpeg executable, Deforum extension folder, model directory, model checkpoint files, and representative render evidence paths exist after the move.
- Updated the ignored local runtime launcher `render-tools/stable-diffusion-webui/webui-user.bat` so its FFmpeg path points to the new project-local folder.

## Criteria

| Area | Result |
|---|---|
| Source faithfulness | Pass. Claims in this report are based on local file searches and `Test-Path`/model file checks. |
| Scope control | Pass. Docs now identify this repo as the full local Deforum effect prototype, not only a UI shell. |
| UI/config usefulness | Pass. `config/model-options.json` now points to the project-local checkpoint folder. |
| Model comparison | Pass. All five configured `.safetensors` checkpoint files exist at the moved model directory. |
| 1680x720 handling | Pass with caveat. This migration did not change source assets or image dimensions; prior asset checks remain valid. |
| Windows setup | Pass. Setup docs now place `render-tools/` inside the project folder and warn not to commit runtime artifacts. |
| Evidence quality | Pass. Existing eval output paths were rewritten to the moved folder and representative MP4/settings paths exist. |

## Results

Verified moved paths:

| Path | Result |
|---|---|
| `D:\nms-shg-deforum-control-ui-main\render-tools\stable-diffusion-webui` | Exists |
| `D:\nms-shg-deforum-control-ui-main\render-tools\stable-diffusion-webui\extensions\deforum` | Exists |
| `D:\nms-shg-deforum-control-ui-main\render-tools\ffmpeg\ffmpeg-8.1.1-full_build\bin\ffmpeg.exe` | Exists |
| `D:\nms-shg-deforum-control-ui-main\render-tools\stable-diffusion-webui\models\Stable-diffusion` | Exists |
| Previous external `render-tools` folder | Does not exist after move |

Verified model files in the moved checkpoint folder:

- `v1-5-pruned-emaonly.safetensors`
- `sd_xl_base_1.0.safetensors`
- `RealVisXL_V5.0_fp16.safetensors`
- `Juggernaut-XL_v9_RunDiffusionPhoto_v2.safetensors`
- `sd_xl_refiner_1.0.safetensors`

Reference checks:

- No tracked files contain stale references to the previous external runtime root after the documentation/config rewrite.
- No tracked docs contain the checked UI-only framing phrases after the wording rewrite.
- `README.md`, `docs/ai-context.md`, and `docs/decisions.md` now explicitly state that this repository is the whole Deforum effect prototype and that `render-tools/` is project-local but ignored by Git.
- `config/model-options.json` points to `D:\nms-shg-deforum-control-ui-main\render-tools\stable-diffusion-webui\models\Stable-diffusion`.
- Representative moved render evidence files exist for smoke, review-sized, comparison, and end-to-end eval outputs.

## Weaknesses

- `render-tools/` is intentionally ignored, so the launcher path fix inside `render-tools/stable-diffusion-webui/webui-user.bat` is a local runtime correction and will not be included in the Git commit.
- Existing eval reports still describe historical render results. Their output paths were updated to the moved local folder so the evidence remains reachable, but the reports were not otherwise rewritten.
- The real backend should be restarted from the new folder before the next render test.

## Recommended Improvements

- Keep `render-tools/` ignored, but document any required local runtime edits in `docs/local-render-setup.md`.
- On the next backend run, start `render-tools/stable-diffusion-webui/webui-user.bat` from the project-local path and confirm `/deforum/api_version` responds.
- Add artifact validation to the real adapter so future evals do not rely only on backend output directory strings.

## Revised Notes

- The repo is now documented as the full Deforum effect prototype.
- The project-local runtime folder is `D:\nms-shg-deforum-control-ui-main\render-tools`.
- The previous external runtime folder has been moved and no longer exists.
