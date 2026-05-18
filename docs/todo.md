# Todo

Status: active next steps  
Last updated: 2026-05-18

## Next Implementation Steps

- [ ] Expand `src/services/a1111DeforumAdapter.js` from a smoke adapter into a fuller preset-to-Deforum translator.
- [ ] Map timeline prompt segments into Deforum `prompts` with frame indexes.
- [ ] Map UI generation controls into Deforum settings: sampler, steps, CFG schedule, seed, FPS, preview resolution, and max frames.
- [ ] Map motion controls into Deforum schedules: zoom, pan X/Y, rotation, cadence, and depth-warp toggle.
- [ ] Map source images into a guided-image or init-image workflow using local paths from `assets/images/source`.
- [ ] Run a 5-10 second review test at `896x384` using 2-4 source images and fixed seed.
- [ ] Save real backend take metadata in the UI: model checkpoint, seed, resolution, render duration, output path, and settings file path.
- [ ] Export the actual Deforum settings payload alongside the reviewed preset JSON.
- [ ] Add an eval report for the first review-sized render under `docs/evals/`.
- [ ] Decide whether to keep the no-ControlNet Deforum API patches or install ControlNet for the backend path.
- [ ] Download and test the next comparison model after SD 1.5, starting with `sdxl-base`.
- [ ] Add tests for adapter setting translation without requiring the live GPU backend.

## Current Verified Baseline

- React/Vite UI builds and passes unit and Playwright smoke tests.
- Automatic1111 WebUI runs locally at `http://127.0.0.1:7860`.
- Deforum API responds at `/deforum/api_version`.
- SD 1.5 baseline checkpoint is installed and loaded.
- A 4-frame `256x128` Deforum smoke render succeeded.
- The optional real-backend Playwright path passes with `RUN_REAL_DEFORUM=1`.
