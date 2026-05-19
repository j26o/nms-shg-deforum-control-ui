# Todo

Status: active next steps  
Last updated: 2026-05-19

## Next Implementation Steps

- [x] Expand `src/services/a1111DeforumAdapter.js` from a smoke adapter into a fuller preset-to-Deforum translator.
- [x] Map prompt JSON nodes into Deforum `prompts` with frame indexes.
- [x] Map UI generation controls into Deforum settings: sampler, steps, CFG schedule, seed, FPS, preview resolution, and max frames.
- [x] Map motion controls into Deforum schedules: zoom, pan X/Y, rotation, cadence, and depth-warp toggle.
- [x] Map source images into a guided-image or init-image workflow using local paths from `assets/images/source`.
- [x] Run a 5-10 second review test at `896x384` using 2-4 source images and fixed seed.
- [x] Save real backend take metadata in the UI: model checkpoint, seed, resolution, render duration, output path, and settings file path.
- [x] Export the actual Deforum settings payload alongside the reviewed preset JSON.
- [x] Add an eval report for the first review-sized render under `docs/evals/`.
- [x] Install ControlNet for the backend path and keep ControlNet disabled in the default prototype payload.
- [x] Download and test the next comparison model after SD 1.5, starting with `sdxl-base`.
- [x] Select one runtime comparison model at a time through the single Generation model profile dropdown.
- [x] Run comparative runtime renders for installed model profiles and record eval evidence.
- [x] Add tests for adapter setting translation without requiring the live GPU backend.
- [x] Move the local `render-tools/` runtime into the project root and update path/context docs.
- [x] Keep generated logs and output evidence inside project-local `outputs/` or `render-tools/stable-diffusion-webui/outputs/` folders.
- [x] Add output artifact validation so real backend jobs fail when no video output is created.
- [x] Set the initial creative-review preset to 8 source images, 8 seconds, 60 fps, and default creative-direction prompts plus source-asset-specific `--neg` guardrails on every node.
- [x] Make RealVisXL V5.0 the default model profile for new presets.
- [x] Move Local A1111 negative prompt guardrails into Deforum's native negative prompt field while keeping UI/Hugging Face prompt payloads visible with `--neg`.
- [x] Run E2E/default RealVisXL eval and capture the current Local A1111 Deforum failure evidence.
- [x] Tighten default source-faithfulness settings after the stale SD 1.5 output drifted into abstract outlined mosaic imagery instead of the supplied source frames.
- [ ] Restart the UI/backend from the latest commit and rerun a clean RealVisXL render to verify the source-faithful defaults are actually used.
- [ ] Fix or work around the current Deforum looper/batch limit where 3+ guided images fail in `PREPARING` with `Invalid arguments`.
- [ ] Investigate SDXL Base and SDXL Refiner Deforum compatibility with a smaller direct API repro and captured backend logs.
- [ ] Update the real-backend Playwright path to control its Vite server environment and wait long enough for a completed render artifact.
- [ ] Complete the approved optional Hugging Face Deforum backend plan in `docs/huggingface-deforum-backend-plan.md`.
- [x] Add a Hugging Face backend selector state with a credential-safe local proxy and Deforum-compatible endpoint contract.
- [x] Add the local `huggingface-deforum` frontend adapter and Vite proxy.
- [x] Provide the remote Hugging Face endpoint or private Space/API runtime for `HF_DEFORUM_ENDPOINT_URL`.
- [x] Deploy private Hugging Face Docker Space `robaldovino/nms-shg-deforum-endpoint` and verify local proxy smoke MP4 artifact retrieval.
- [ ] Connect the deployed Hugging Face Space to a reachable A1111 Deforum backend through `HF_DEFORUM_A1111_BASE_URL`.
- [ ] Run a Hugging Face vs local Automatic1111 eval using the same image-keyframe preset and MP4 artifact checks.

## Current Verified Baseline

- React/Vite UI builds and passes unit and Playwright smoke tests.
- Automatic1111 WebUI runs locally at `http://127.0.0.1:7860`.
- Deforum API responds at `/deforum/api_version`.
- RealVisXL V5.0 is the default model profile for new workbench presets; SD 1.5 remains installed and selectable as the compatibility fallback.
- SDXL Base, RealVisXL V5.0, Juggernaut XL v9, and SDXL Refiner checkpoints are installed and load-tested in Automatic1111.
- A 4-frame `256x128` Deforum smoke render succeeded.
- A 10-second `896x384` SD 1.5 review render succeeded with 3 source images and fixed seed.
- Comparative runtime renders produced 10-second `896x384` MP4s for SD 1.5, RealVisXL V5.0, and Juggernaut XL v9; SDXL Base and SDXL Refiner produced settings files but no frames or MP4.
- A controlled end-to-end browser-to-Deforum RealVisXL run produced a 10-second `896x384` MP4, but the automated real-backend Playwright assertion timed out before the backend finished.
- The optional real-backend Playwright path reaches the backend with `RUN_REAL_DEFORUM=1`, but its current assertion timeout is too short for the review-length RealVisXL render.
- Local A1111 batch payloads now include Deforum `options_overrides`, legacy scale/prompt fields, disabled ControlNet slot defaults, compact per-keyframe prompts, shared `animation_prompts_positive`, and native `animation_prompts_negative` values.
- The initial workbench preset now starts with 8 source images over 8 seconds at 60 fps, producing 480 Deforum frames before any user edits, with source-asset-specific negative prompts applied to each node.
- The default morph settings are source-faithful by default and visible on page load in the right-side Deforum controls: source image strength `0.96`, denoise `0.18`, image influence decay/noise `0.04`, structural lock `0.92`, no default depth warp, no default zoom/pan drift, `locked-source-morph` camera path, cadence `1`, and 42 guided tween frames.
- Latest E2E eval: the UI confirms RealVisXL as the default and normal tests pass, but the live Local A1111 Deforum render still fails before artifact creation. Direct repros show 2 guided images reach `GENERATING`, while 3+ guided images fail in `PREPARING` with `Invalid arguments`.
- Latest source-faithfulness review: the MP4 at `render-tools/stable-diffusion-webui/outputs/img2img-images/future-wall-morph-study-01-deforum/20260519195919.mp4` is not representative of the current defaults. Its saved settings used stale SD 1.5, old inline prompts, 3D depth warp, higher denoise/noise, and camera drift.
