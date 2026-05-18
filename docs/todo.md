# Todo

Status: active next steps  
Last updated: 2026-05-18

## Next Implementation Steps

- [x] Expand `src/services/a1111DeforumAdapter.js` from a smoke adapter into a fuller preset-to-Deforum translator.
- [x] Map timeline prompt segments into Deforum `prompts` with frame indexes.
- [x] Map UI generation controls into Deforum settings: sampler, steps, CFG schedule, seed, FPS, preview resolution, and max frames.
- [x] Map motion controls into Deforum schedules: zoom, pan X/Y, rotation, cadence, and depth-warp toggle.
- [x] Map source images into a guided-image or init-image workflow using local paths from `assets/images/source`.
- [x] Run a 5-10 second review test at `896x384` using 2-4 source images and fixed seed.
- [x] Save real backend take metadata in the UI: model checkpoint, seed, resolution, render duration, output path, and settings file path.
- [x] Export the actual Deforum settings payload alongside the reviewed preset JSON.
- [x] Add an eval report for the first review-sized render under `docs/evals/`.
- [ ] Decide whether to keep the no-ControlNet Deforum API patches or install ControlNet for the backend path.
- [x] Download and test the next comparison model after SD 1.5, starting with `sdxl-base`.
- [x] Select one runtime comparison model at a time through the workbench model radio control.
- [x] Run comparative runtime renders for installed model profiles and record eval evidence.
- [x] Add tests for adapter setting translation without requiring the live GPU backend.
- [x] Move the local `render-tools/` runtime into the project root and update path/context docs.
- [x] Keep generated logs and output evidence inside project-local `outputs/` or `render-tools/stable-diffusion-webui/outputs/` folders.
- [ ] Add output artifact validation so real backend jobs fail when no video or frame output is created.
- [ ] Investigate SDXL Base and SDXL Refiner Deforum compatibility with a smaller direct API repro and captured backend logs.
- [ ] Update the real-backend Playwright path to control its Vite server environment and wait long enough for a completed render artifact.
- [ ] Complete the approved optional Hugging Face Deforum backend plan in `docs/huggingface-deforum-backend-plan.md`.
- [x] Add a Hugging Face backend selector state with a credential-safe local proxy and Deforum-compatible endpoint contract.
- [x] Add the local `huggingface-deforum` frontend adapter and Vite proxy.
- [ ] Provide the remote Hugging Face endpoint or private Space/API runtime for `HF_DEFORUM_ENDPOINT_URL`.
- [ ] Run a Hugging Face vs local Automatic1111 eval using the same image-keyframe preset and MP4 artifact checks.

## Current Verified Baseline

- React/Vite UI builds and passes unit and Playwright smoke tests.
- Automatic1111 WebUI runs locally at `http://127.0.0.1:7860`.
- Deforum API responds at `/deforum/api_version`.
- SD 1.5 baseline checkpoint is installed and loaded.
- SDXL Base, RealVisXL V5.0, Juggernaut XL v9, and SDXL Refiner checkpoints are installed and load-tested in Automatic1111.
- A 4-frame `256x128` Deforum smoke render succeeded.
- A 10-second `896x384` SD 1.5 review render succeeded with 3 source images and fixed seed.
- Comparative runtime renders produced 10-second `896x384` MP4s for SD 1.5, RealVisXL V5.0, and Juggernaut XL v9; SDXL Base and SDXL Refiner produced settings files but no frames or MP4.
- A controlled end-to-end browser-to-Deforum RealVisXL run produced a 10-second `896x384` MP4, but the automated real-backend Playwright assertion timed out before the backend finished.
- The optional real-backend Playwright path reaches the backend with `RUN_REAL_DEFORUM=1`, but its current assertion timeout is too short for the review-length RealVisXL render.
