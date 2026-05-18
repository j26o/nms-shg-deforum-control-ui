# Eval: Backend Deforum Smoke Setup

Date: 2026-05-18
Artifact scope: Windows backend setup, Automatic1111 WebUI, Deforum extension, SD 1.5 checkpoint, UI real-backend smoke path
Evaluator: Codex using `deforum-prototype-eval`
Status: Pass with caveats

## Eval Methodology

Inspected and exercised the local backend on the Windows RTX 4090 machine.

Checks run:

- `nvidia-smi`
- `py -0p`
- local portable FFmpeg verification
- Automatic1111 launch with `--api --deforum-api --deforum-simple-api`
- `Invoke-RestMethod http://127.0.0.1:7860/sdapi/v1/sd-models`
- `Invoke-RestMethod http://127.0.0.1:7860/sdapi/v1/extensions`
- `Invoke-RestMethod http://127.0.0.1:7860/deforum/api_version`
- tiny A1111 `txt2img` API render
- tiny Deforum API render
- `RUN_REAL_DEFORUM=1 pnpm exec playwright test --reporter=list`

## Criteria

| Area | Result |
|---|---|
| Source faithfulness | Pass |
| Scope control | Pass |
| UI/config usefulness | Pass with caveat |
| Model comparison | Pass with caveat |
| 1680x720 handling | Pass with caveat |
| Windows setup | Pass |
| Evidence quality | Pass |

## Results

Windows setup: Python 3.10 is available through `py -3.10`; NVIDIA RTX 4090 is visible through `nvidia-smi`; FFmpeg is available through a local portable install under `D:\NMS-SHG\render-tools\ffmpeg`.

Backend: Automatic1111 WebUI launches at `http://127.0.0.1:7860` with API enabled. Deforum extension is installed, enabled, and reports API version `1.0` and extension version `5d63a339`.

Model: SD 1.5 baseline checkpoint is installed and loaded:

```text
v1-5-pruned-emaonly.safetensors [6ce0161689]
```

Render evidence: A tiny Deforum API run succeeded:

```text
D:\NMS-SHG\render-tools\stable-diffusion-webui\outputs\img2img-images\deforum-control-ui-smoke-patched2\20260518121912.mp4
```

Run metadata:

- model: `v1-5-pruned-emaonly.safetensors [6ce0161689]`
- resolution: `256x128`
- frames: `4`
- fps: `4`
- steps: `4`
- seed: `12345`
- execution time reported by Deforum API: about `2.05s`

UI evidence: The real-backend Playwright path passed with `RUN_REAL_DEFORUM=1`, clicking `Render Deforum` and receiving a local Automatic1111 output path in the workbench queue.

## Weaknesses

- The real UI adapter is currently a smoke path, not a complete translation of the full exported preset contract.
- The verified Deforum render is low resolution and only 4 frames.
- Only the SD 1.5 baseline checkpoint is installed; SDXL, RealVisXL, Juggernaut XL, and SDXL Refiner remain pending.
- The local Deforum extension has no-ControlNet compatibility patches. Those should be tracked if the extension is upgraded.
- The Vite proxy is a development-time bridge. A packaged desktop build would need a local backend bridge or CORS strategy.

## Recommended Improvements

- Expand `a1111DeforumAdapter.js` to map full timeline, motion, look, and source-image fields into Deforum settings.
- Add a 5-10 second `896x384` render using two source images from `assets/images/source`.
- Add model-matrix downloads and run the same preset across SDXL Base and RealVisXL.
- Preserve backend logs and render metadata beside candidate exports.
- Decide whether to install ControlNet or keep the no-ControlNet Deforum patch as the expected local setup.

## Revised Notes

The backend is now ready for prototype-level Deforum UI testing. It is not yet a production renderer path.
