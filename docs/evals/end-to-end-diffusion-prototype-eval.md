# Eval: End-To-End Diffusion Prototype Test

Date: 2026-05-18
Artifact scope: React workbench, mock render path, Automatic1111 Deforum backend path, source assets, generated RealVisXL render artifact
Evaluator: Codex
Status: Pass with caveats

## Eval Methodology

- Confirmed repo state with `git status -sb`.
- Parsed `config/model-options.json`.
- Checked all PNG source assets under `assets/images/source/` for pixel dimensions.
- Confirmed Deforum backend availability at `http://127.0.0.1:7860/deforum/api_version`.
- Ran unit tests, production build, and standard Playwright browser E2E.
- Stopped a stale Vite server on `5173`, reset the backend checkpoint to SD 1.5, then reran the opt-in real backend Playwright path with `VITE_SOURCE_ASSET_ROOT` set.
- Inspected the newest Deforum output folder, settings file, first/middle/final frames, and MP4 metadata.

## Criteria

| Area | Result |
|---|---|
| Source faithfulness | Pass. Evidence is grounded in local test output, generated Deforum settings, frames, and MP4 metadata. |
| Scope control | Pass. Results are prototype validation only, not production approval. |
| UI/config usefulness | Pass with caveat. The workbench can drive mock and real backend paths, but the real E2E test needs longer waiting and artifact validation. |
| Model comparison | Pass with caveat. The E2E run used RealVisXL V5.0; SDXL Base and SDXL Refiner remain known compatibility gaps from the runtime comparison eval. |
| 1680x720 handling | Pass. All source PNGs inspected in `assets/images/source/` are `1680x720`; backend preview output remained `896x384`. |
| Windows setup | Pass. Backend API, checkpoint folder, frontend commands, and FFmpeg probe path are working on the local Windows setup. |
| Evidence quality | Pass with caveat. A real MP4 and 238 frames exist, but Playwright marked the real path failed because the in-test wait was shorter than the render duration. |

## Results

Deterministic checks:

| Check | Result |
|---|---|
| `config/model-options.json` parse | Pass |
| Source PNG dimensions | Pass, all inspected PNGs are `1680x720` |
| `git diff --check` | Pass with Windows CRLF warnings only |
| `pnpm test` | Pass, 3 files and 8 tests |
| `pnpm build` | Pass |
| `pnpm exec playwright test --reporter=list` | Pass, 1 browser E2E test |
| `RUN_REAL_DEFORUM=1 pnpm exec playwright test --reporter=list --timeout=600000` against stale server | Browser assertion pass, but produced settings only because the app was served without the absolute source asset root |
| Controlled `RUN_REAL_DEFORUM=1` rerun after restarting Vite with `VITE_SOURCE_ASSET_ROOT` | Playwright failed after about 120 seconds, but the backend continued and produced a complete render artifact |

Real backend render evidence:

| Field | Value |
|---|---|
| Model profile | `realvisxl-v5` |
| Checkpoint schedule | `RealVisXL_V5.0_fp16.safetensors` |
| Source root | `D:\nms-shg-deforum-control-ui-main\assets\images\source` |
| Output folder | `D:\nms-shg-deforum-control-ui-main\render-tools\stable-diffusion-webui\outputs\img2img-images\6ab04b53915a489d9ce7c61be3b7bc36` |
| MP4 | `D:\nms-shg-deforum-control-ui-main\render-tools\stable-diffusion-webui\outputs\img2img-images\6ab04b53915a489d9ce7c61be3b7bc36\20260518210954.mp4` |
| Settings file | `D:\nms-shg-deforum-control-ui-main\render-tools\stable-diffusion-webui\outputs\img2img-images\6ab04b53915a489d9ce7c61be3b7bc36\20260518210954_settings.txt` |
| Root settings file | `D:\nms-shg-deforum-control-ui-main\render-tools\stable-diffusion-webui\6ab04b53915a489d9ce7c61be3b7bc36.txt` |
| Resolution | `896x384` |
| Duration | `9.916667s` |
| Frame rate | `24 fps` |
| Frame count | `238` PNG frames and `238` MP4 frames |
| MP4 size | `9,885,346` bytes |
| Seed | `123456` |
| Prompt keys | `0`, `120`, `240`, `360` |

Qualitative frame review:

- First frame has coherent mist, water, and distant monument silhouettes with strong Future Wall atmosphere.
- Middle frame drifts heavily into blue/black graphic panel shapes and loses most source-image identity.
- Final frame is crisp but highly abstract, with radial forms and object fragments replacing the original landscape composition.

## Weaknesses

- The real backend Playwright assertion waits 120 seconds, which is too short for the current RealVisXL `896x384`, 240-frame render.
- The app can connect to a stale Vite server, causing `VITE_SOURCE_ASSET_ROOT` to be missing and producing backend settings with relative source paths.
- The real adapter still reports UI completion based on API response/output directory rather than requiring an MP4 or nonzero frame count.
- Visual output is not yet stable enough for stakeholder review because mid and late frames lose source identity.

## Recommended Improvements

- Update the real-backend E2E test to control the dev server environment and wait for either a completed artifact or an explicit adapter failure.
- Add artifact validation to the adapter before a take can be marked `complete`.
- Add a shorter real-backend smoke preset for CI/manual E2E, separate from review-length 240-frame renders.
- Tune motion and image-lock settings before the next creative review pass.

## Revised Notes

- The diffusion prototype is end-to-end functional from browser UI through Automatic1111 Deforum to a real MP4 artifact.
- The automated real-backend Playwright result is currently a test harness failure, not a render failure, when run against the controlled fresh server.
- A stale frontend server can invalidate backend path testing; future real E2E runs should either stop existing Vite servers first or use a unique port.
