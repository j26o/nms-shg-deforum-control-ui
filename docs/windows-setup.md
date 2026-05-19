# Windows Setup Instructions

Use this on the target Windows computer before implementing or running the full Deforum effect prototype.

Target machine from the supplied screenshot:

- Windows 11 Pro
- Intel Core i9-13900K
- 64 GB RAM
- NVIDIA GeForce RTX 4090, 24 GB
- Large local SSD storage

These steps prepare one local prototype workspace containing:

1. the React/Vite tuning workbench;
2. the local Deforum render backend under project-root `render-tools/`;
3. local source assets, model checkpoints, generated render evidence, and export outputs.

## 1. Pick A Working Folder

Use a short local path without spaces. This keeps Stable Diffusion, Python, and render scripts calmer on Windows.

Recommended project folder:

```powershell
mkdir D:\nms-shg-deforum-control-ui-main\render-tools
mkdir D:\nms-shg-deforum-control-ui-main\outputs
mkdir D:\nms-shg-deforum-control-ui-main\outputs\logs
mkdir D:\nms-shg-deforum-control-ui-main\outputs\previews
mkdir D:\nms-shg-deforum-control-ui-main\outputs\exports
cd D:\nms-shg-deforum-control-ui-main
```

If the machine has only `C:`, use:

```powershell
mkdir C:\nms-shg-deforum-control-ui-main
mkdir C:\nms-shg-deforum-control-ui-main\render-tools
mkdir C:\nms-shg-deforum-control-ui-main\outputs
mkdir C:\nms-shg-deforum-control-ui-main\outputs\logs
mkdir C:\nms-shg-deforum-control-ui-main\outputs\previews
mkdir C:\nms-shg-deforum-control-ui-main\outputs\exports
cd C:\nms-shg-deforum-control-ui-main
```

## 2. Update GPU Driver

1. Open NVIDIA App or GeForce Experience.
2. Install the latest NVIDIA Studio Driver or Game Ready Driver approved for the machine.
3. Restart Windows.
4. Open PowerShell and verify the GPU is visible:

```powershell
nvidia-smi
```

Expected result: the RTX 4090 appears with driver details and no error.

## 3. Install Base Developer Tools

Open PowerShell as Administrator.

Install Git:

```powershell
winget install --id Git.Git -e --source winget
```

Install Node.js LTS:

```powershell
winget install --id OpenJS.NodeJS.LTS -e --source winget
```

Install Python 3.10 for Stable Diffusion compatibility:

```powershell
winget install --id Python.Python.3.10 -e --source winget
```

Install FFmpeg:

```powershell
winget install --id Gyan.FFmpeg -e --source winget
```

Close PowerShell, open a new PowerShell window, then verify:

```powershell
git --version
node --version
npm --version
python --version
ffmpeg -version
```

## 4. Enable pnpm

The prototype frontend should use `pnpm`.

```powershell
corepack enable
corepack prepare pnpm@latest --activate
pnpm --version
```

If `corepack` is not available, use:

```powershell
npm install -g pnpm
pnpm --version
```

## 5. Get The Prototype Files

Use whichever route matches how this prototype repo is made available on the Windows PC.

### Option A: Clone From Git

```powershell
cd D:\
git clone <PROTOTYPE_REPO_URL> nms-shg-deforum-control-ui-main
cd D:\nms-shg-deforum-control-ui-main
```

Replace `<PROTOTYPE_REPO_URL>` with the real repo URL.

### Option B: Copy From Shared Drive Or USB

1. Copy the prototype folder to `D:\nms-shg-deforum-control-ui-main`.
2. Open PowerShell:

```powershell
cd D:\nms-shg-deforum-control-ui-main
```

## 6. Confirm Current Prototype State

The prototype now includes a React/Vite workbench, source assets, model configuration, local Automatic1111 Deforum adapter, and an ignored `render-tools/` backend runtime folder.

Check:

```powershell
dir
dir docs
```

Expected result:

- `README.md`
- `docs\deforum-control-ui-prd-spec.md`
- `docs\windows-setup.md`

If `package.json` does not exist, the checkout is incomplete.

## 7. Run The UI

Once `package.json` exists in this folder:

```powershell
cd D:\nms-shg-deforum-control-ui-main
pnpm install
pnpm dev
```

`pnpm dev` starts the local UI only. It does not launch Stable Diffusion or Automatic1111.

Use the explicit backend-aware launcher only when you want the project-local Automatic1111 Deforum backend to start or be checked before Vite:

```powershell
pnpm dev:backend
```

`pnpm dev:backend` uses `render-tools\stable-diffusion-webui\webui-user.bat`, waits for the backend APIs, and sets the source-image root for real renders.

Open the local URL printed by Vite, usually:

```text
http://localhost:5173
```

In a second PowerShell window, run checks:

```powershell
pnpm build
pnpm test
pnpm exec playwright test
```

`pnpm dev:ui` is also available as a compatibility alias for frontend-only development.

## 8. Prepare A Local Deforum Backend

This is required for the `Render Deforum` action and for the explicit `pnpm dev:backend` startup path. Mock-only frontend review can use `pnpm dev` or `pnpm dev:ui`, but the project itself owns both the workbench and the local runtime.

Verified first backend: AUTOMATIC1111 Stable Diffusion WebUI with the Deforum extension, because the reference tutorial uses a Deforum-style control surface.

Create or enter the project-local `render-tools` folder:

```powershell
cd D:\nms-shg-deforum-control-ui-main\render-tools
git clone https://github.com/AUTOMATIC1111/stable-diffusion-webui.git
cd stable-diffusion-webui
```

Run the first-time installer:

```powershell
.\webui-user.bat
```

Wait for the first run to finish. It may take a while because it creates a Python environment and downloads dependencies.

When the WebUI is running, open:

```text
http://127.0.0.1:7860
```

Stop the WebUI before installing the extension.

Install Deforum:

```powershell
cd D:\nms-shg-deforum-control-ui-main\render-tools\stable-diffusion-webui
git clone https://github.com/deforum-art/sd-webui-deforum extensions\deforum
.\webui-user.bat
```

After restart, confirm the WebUI has a Deforum tab or extension entry.

For the verified local setup, also enable the APIs in `webui-user.bat`:

```bat
set COMMANDLINE_ARGS=--api --deforum-api --deforum-simple-api
```

## 9. Add A Model Checkpoint

The WebUI needs at least one Stable Diffusion model checkpoint. Use only models that KR+D is allowed to use for this project.

Place model files here:

```text
D:\nms-shg-deforum-control-ui-main\render-tools\stable-diffusion-webui\models\Stable-diffusion\
```

Use `.safetensors` where possible.

Do not commit model licences, API tokens, client-private images, credentials, checkpoint files, venv files, or generated render outputs. The project-local `render-tools/` folder is intentionally ignored by Git.

The prototype model matrix is documented in:

```text
docs\model-options.md
config\model-options.json
```

Install the Hugging Face CLI:

```powershell
python -m pip install -U huggingface_hub
huggingface-cli login
```

Some Hugging Face models require accepting terms in the browser before CLI download works.

Set the model folder:

```powershell
$MODEL_DIR = "D:\nms-shg-deforum-control-ui-main\render-tools\stable-diffusion-webui\models\Stable-diffusion"
```

Download fallback models for comparison:

```powershell
huggingface-cli download stable-diffusion-v1-5/stable-diffusion-v1-5 v1-5-pruned-emaonly.safetensors --local-dir $MODEL_DIR
huggingface-cli download stabilityai/stable-diffusion-xl-base-1.0 sd_xl_base_1.0.safetensors --local-dir $MODEL_DIR
huggingface-cli download SG161222/RealVisXL_V5.0 RealVisXL_V5.0_fp16.safetensors --local-dir $MODEL_DIR
huggingface-cli download RunDiffusion/Juggernaut-XL-v9 Juggernaut-XL_v9_RunDiffusionPhoto_v2.safetensors --local-dir $MODEL_DIR
huggingface-cli download stabilityai/stable-diffusion-xl-refiner-1.0 sd_xl_refiner_1.0.safetensors --local-dir $MODEL_DIR
```

Restart Automatic1111 after downloading. Confirm the checkpoints appear in the WebUI checkpoint dropdown before launching a prototype render.

Production caution: `juggernaut-xl-v9` is included for prototype comparison only until its model-card restrictions are reviewed for the intended production use.

## 10. Create Local Asset Folders

The exercise source images are tracked in Git under:

```text
assets\images\source\
```

They are 1680x720 PNG files. The UI and Deforum setup should treat them as a 7:3 source canvas.

Inside the prototype folder, create local output folders:

```powershell
cd D:\nms-shg-deforum-control-ui-main
New-Item -ItemType Directory -Force assets\images\source
New-Item -ItemType Directory -Force outputs\logs
New-Item -ItemType Directory -Force outputs\previews
New-Item -ItemType Directory -Force outputs\exports
```

After cloning or copying the repo, confirm source images are present:

```powershell
dir assets\images\source
```

If additional exercise source images are added later, put them under a dated folder inside:

```text
assets\images\source\
```

Do not commit generated videos, model files, runtime logs, or temporary render outputs to Git. Keep those files inside the project folder under `outputs\` or `render-tools\stable-diffusion-webui\outputs\`, not in external project folders.

## 11. Recommended First Test

Use two to four pre-generated images first. Keep the preview short so the team can iterate quickly.

Suggested first render settings:

| Setting | Starter value |
|---|---|
| Source resolution | 1680 x 720 |
| Fast preview resolution | 896 x 384 |
| Review preview resolution | 1344 x 576 |
| Final exercise config resolution | 1680 x 720, if the selected backend supports it |
| Aspect ratio | 7:3 |
| Duration | 5-10 seconds |
| FPS | 12-24 |
| Steps | 20-25 |
| CFG scale | 6-8 |
| Seed mode | Fixed |
| Denoise strength | 0.45-0.65 |
| Cadence | 2 |
| First model pass | `sd15-baseline`, then `sdxl-base` |
| Comparison models | `realvisxl-v5`, `juggernaut-xl-v9`, optional `sdxl-refiner` |
| Output format | MP4 preview plus exported JSON |

Only move to longer or higher-resolution tests after a short preview renders successfully.

If the selected Deforum or Stable Diffusion backend rejects 1680x720 because it wants 64-pixel multiples, render tests at `896x384` or `1344x576`, then upscale or pad/crop the candidate back to the 1680x720 source frame for review.

## 12. Troubleshooting

### `nvidia-smi` is not recognised

Restart Windows after the NVIDIA driver install. If it still fails, reinstall the NVIDIA driver.

### `python` or `git` is not recognised

Close and reopen PowerShell. If it still fails, reinstall the missing tool and make sure it is added to `PATH`.

### `pnpm` is not recognised

Run:

```powershell
corepack enable
corepack prepare pnpm@latest --activate
```

If that fails:

```powershell
npm install -g pnpm
```

### WebUI starts but no Deforum tab appears

Check that this folder exists:

```text
D:\nms-shg-deforum-control-ui-main\render-tools\stable-diffusion-webui\extensions\deforum\
```

Then restart `webui-user.bat`.

### Preview renders are too slow

Lower resolution first, then lower steps, duration, and FPS. Keep final-quality settings for overnight or queued renders.

### Disk fills quickly

Clean old previews from:

```text
D:\nms-shg-deforum-control-ui-main\outputs\
```

and:

```text
D:\nms-shg-deforum-control-ui-main\render-tools\stable-diffusion-webui\outputs\
```

Keep only candidate renders and their exported JSON reports.

## 13. Setup Checklist

- [x] NVIDIA driver updated and `nvidia-smi` works.
- [x] Git works.
- [x] Node.js works.
- [x] Python 3.10 works through `py -3.10`.
- [x] FFmpeg works through the local portable install documented in `docs\local-render-setup.md`.
- [x] pnpm works.
- [x] Deforum effect prototype folder is on the Windows PC.
- [x] Source images folder exists at `assets\images\source`.
- [x] The exercise images are present and verified as 1680x720.
- [ ] Hugging Face CLI works, if additional model downloads are needed.
- [x] `sd15-baseline` checkpoint is downloaded and loaded.
- [x] `sdxl-base` checkpoint is downloaded and loaded.
- [x] Optional comparison checkpoints are downloaded and load-tested for prototype review; production use still needs licence review where noted.
- [x] UI app is scaffolded.
- [x] AUTOMATIC1111 WebUI launches.
- [x] Deforum extension appears in WebUI/API extension list.
- [x] Tiny 4-frame Deforum smoke render succeeds.
- [ ] First 5-10 second review preview render succeeds.

## 14. Source Links

- Git for Windows: `https://git-scm.com/install/windows`
- Microsoft Node.js on Windows guidance: `https://learn.microsoft.com/en-us/windows/dev-environment/javascript/nodejs-on-windows`
- Python on Windows guidance: `https://learn.microsoft.com/en-us/windows/python/`
- AUTOMATIC1111 WebUI: `https://github.com/AUTOMATIC1111/stable-diffusion-webui`
- AUTOMATIC1111 NVIDIA install guide: `https://github.com/AUTOMATIC1111/stable-diffusion-webui/wiki/Install-and-Run-on-NVidia-GPUs`
- Deforum extension: `https://github.com/deforum-art/sd-webui-deforum`
- Stable Diffusion 1.5: `https://huggingface.co/stable-diffusion-v1-5/stable-diffusion-v1-5`
- SDXL Base 1.0: `https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0`
- SDXL Refiner 1.0: `https://huggingface.co/stabilityai/stable-diffusion-xl-refiner-1.0`
- RealVisXL V5.0: `https://huggingface.co/SG161222/RealVisXL_V5.0`
- Juggernaut XL v9: `https://huggingface.co/RunDiffusion/Juggernaut-XL-v9`
