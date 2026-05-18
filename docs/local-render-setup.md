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

The React app has a `Render Deforum` action that calls:

```text
/a1111/deforum/run
```

Vite proxies `/a1111` to:

```text
http://127.0.0.1:7860
```

If the Deforum backend cannot resolve repository-relative source asset paths directly, set `VITE_SOURCE_ASSET_ROOT` to a backend-visible absolute path for `assets/images/source/` before starting Vite.

Run the real backend E2E test with:

```powershell
$env:RUN_REAL_DEFORUM='1'
pnpm exec playwright test --reporter=list
```
