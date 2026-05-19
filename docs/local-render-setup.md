# Local Render Setup

Status: Automatic1111 + Deforum backend verified  
Last updated: 2026-05-18

## Installed Backend

Automatic1111 WebUI is installed inside this project folder at:

```text
D:\nms-shg-deforum-control-ui-main\render-tools\stable-diffusion-webui
```

Deforum extension is installed at:

```text
D:\nms-shg-deforum-control-ui-main\render-tools\stable-diffusion-webui\extensions\deforum
```

Portable FFmpeg is installed at:

```text
D:\nms-shg-deforum-control-ui-main\render-tools\ffmpeg\ffmpeg-8.1.1-full_build\bin\ffmpeg.exe
```

The WebUI launcher is configured in `webui-user.bat` with:

```bat
set PYTHON=py -3.10
set COMMANDLINE_ARGS=--api --deforum-api --deforum-simple-api
set PATH=D:\nms-shg-deforum-control-ui-main\render-tools\ffmpeg\ffmpeg-8.1.1-full_build\bin;%PATH%
```

`render-tools/` is intentionally ignored by Git because it contains the nested WebUI checkout, Python environment, model checkpoints, FFmpeg build, and generated render outputs.

Project-level logs and handoff files should stay under:

```text
D:\nms-shg-deforum-control-ui-main\outputs\
```

Use:

- `outputs\logs\` for frontend dev-server logs, Playwright/manual run logs, and local execution notes.
- `outputs\previews\` for lightweight preview artifacts produced by the workbench.
- `outputs\exports\` for reviewed preset JSON and readable reports.

Automatic1111 Deforum frames, settings files, root settings logs, and MP4s stay inside:

```text
D:\nms-shg-deforum-control-ui-main\render-tools\stable-diffusion-webui\outputs\
```

## Models

The backend has five verified checkpoints in the Automatic1111 model folder:

```text
D:\nms-shg-deforum-control-ui-main\render-tools\stable-diffusion-webui\models\Stable-diffusion\
```

Verified files:

- `v1-5-pruned-emaonly.safetensors`
- `sd_xl_base_1.0.safetensors`
- `RealVisXL_V5.0_fp16.safetensors`
- `Juggernaut-XL_v9_RunDiffusionPhoto_v2.safetensors`
- `sd_xl_refiner_1.0.safetensors`

Automatic1111 loaded each checkpoint successfully through `/sdapi/v1/options`. After verification, the active checkpoint was restored to:

```text
v1-5-pruned-emaonly.safetensors [6ce0161689]
```

## Local Compatibility Notes

The upstream Automatic1111 bootstrap expected the removed repository URL:

```text
https://github.com/Stability-AI/stablediffusion.git
```

This setup overrides it to a reachable mirror with the expected `ldm.modules.midas` tree:

```bat
set STABLE_DIFFUSION_REPO=https://github.com/story-squad/stable-diffusion-stability-ai.git
set STABLE_DIFFUSION_COMMIT_HASH=acd43cce7206e8a8e3386badf65a94a6c18b94ef
```

The local Deforum extension also has two no-ControlNet compatibility patches so Deforum API jobs can run without installing ControlNet.

## Verified Commands

Generic A1111 API:

```powershell
Invoke-RestMethod http://127.0.0.1:7860/sdapi/v1/sd-models
Invoke-RestMethod http://127.0.0.1:7860/sdapi/v1/extensions
```

Deforum API:

```powershell
Invoke-RestMethod http://127.0.0.1:7860/deforum/api_version
Invoke-RestMethod http://127.0.0.1:7860/deforum/version
```

## Verified Outputs

A tiny Deforum smoke render succeeded:

```text
D:\nms-shg-deforum-control-ui-main\render-tools\stable-diffusion-webui\outputs\img2img-images\deforum-control-ui-smoke-patched2\20260518121912.mp4
```

Settings:

- model: `v1-5-pruned-emaonly.safetensors [6ce0161689]`
- resolution: `256x128`
- frames: `4`
- fps: `4`
- steps: `4`
- seed: `12345`
- mode: `2D`
- execution time reported by Deforum API: about `2.05s`

## UI Integration

The React app has a `Render Deforum` action that calls the local body bridge:

```text
/a1111-deforum/run
```

It also polls the backend status bridge:

```text
/a1111-deforum/status
```

The toolbar status chip uses that route to show whether the selected backend is ready, offline, or not configured. If it says Local A1111 is offline, start `pnpm dev:backend` or start Automatic1111 manually with the Deforum extension enabled, then refresh the status chip.

The bridge submits the settings JSON to the Deforum batch API when available:

```text
http://127.0.0.1:7860/deforum_api/batches
```

This avoids sending the full 24-image settings payload through the browser URL. If the batch API is unavailable, the bridge can fall back to the older query-only simple API at `http://127.0.0.1:7860/deforum/run`.

Use the UI-only dev launcher from the repo root:

```powershell
pnpm dev
```

This command starts Vite only. It does not launch Stable Diffusion or Automatic1111.

The Vite config intentionally blocks `render-tools/` from static serving, dependency optimisation, and file watching. That local folder contains Automatic1111 and Gradio runtime files, not React app source. If Vite tries to resolve imports such as `bufferutil` from a path under `render-tools\stable-diffusion-webui\venv\Lib\site-packages\gradio\...`, restart after pulling the latest config and clear Vite's cache if needed:

```powershell
Remove-Item -Recurse -Force node_modules\.vite -ErrorAction SilentlyContinue
pnpm dev
```

Use the explicit backend-aware launcher only when you want the project to start or verify the local A1111 backend:

```powershell
pnpm dev:backend
```

`pnpm dev:backend` checks the A1111 Deforum API, starts `render-tools\stable-diffusion-webui\webui-user.bat` if the backend is not already running, waits for `/deforum/api_version` and `/sdapi/v1/sd-models`, sets `VITE_SOURCE_ASSET_ROOT` to the project `assets/images/source/` folder when it is not already set, and then starts Vite.

Useful overrides:

```powershell
$env:A1111_BASE_URL='http://127.0.0.1:7860'
$env:A1111_START_TIMEOUT_MS='600000'
$env:SKIP_A1111_START='1'
pnpm dev:backend
```

`pnpm dev:ui` remains as a compatibility alias for the UI-only Vite startup.

Run the real backend E2E test with:

```powershell
$env:RUN_REAL_DEFORUM='1'
pnpm exec playwright test --reporter=list
```
