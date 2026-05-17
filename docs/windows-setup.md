# Windows Setup Instructions

Use this on the target Windows computer before implementing or running the Deforum Control UI prototype.

Target machine from the supplied screenshot:

- Windows 11 Pro
- Intel Core i9-13900K
- 64 GB RAM
- NVIDIA GeForce RTX 4090, 24 GB
- Large local SSD storage

These steps prepare the machine for two lanes:

1. the React/Vite tuning UI;
2. an optional local Deforum-type render backend.

## 1. Pick A Working Folder

Use a short local path without spaces. This keeps Stable Diffusion, Python, and render scripts calmer on Windows.

Recommended:

```powershell
mkdir D:\NMS-SHG
mkdir D:\NMS-SHG\prototype
mkdir D:\NMS-SHG\render-tools
mkdir D:\NMS-SHG\outputs
cd D:\NMS-SHG
```

If the machine has only `C:`, use:

```powershell
mkdir C:\NMS-SHG
mkdir C:\NMS-SHG\prototype
mkdir C:\NMS-SHG\render-tools
mkdir C:\NMS-SHG\outputs
cd C:\NMS-SHG
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

The prototype UI should use `pnpm`.

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

Use whichever route matches how the KR+D repo is made available on the Windows PC.

### Option A: Clone From Git

```powershell
cd D:\NMS-SHG\prototype
git clone <KR+D_REPO_URL> KRD
cd KRD\projects\NMS-SHG\04-development\prototypes\deforum-control-ui
```

Replace `<KR+D_REPO_URL>` with the real repo URL.

### Option B: Copy From Shared Drive Or USB

1. Copy the `KR+D` workspace folder into `D:\NMS-SHG\prototype\KRD`.
2. Open PowerShell:

```powershell
cd D:\NMS-SHG\prototype\KRD\projects\NMS-SHG\04-development\prototypes\deforum-control-ui
```

## 6. Confirm Current Prototype State

At the time this setup guide was written, this prototype folder contains the plan but not the app code yet.

Check:

```powershell
dir
dir docs
```

Expected result:

- `README.md`
- `docs\deforum-control-ui-prd-spec.md`
- `docs\windows-setup.md`

If `package.json` does not exist yet, the app has not been scaffolded. Implement task `T1: Prototype Scaffold` from `docs\deforum-control-ui-prd-spec.md` before trying to run the UI.

## 7. Run The UI After It Is Scaffolded

Once `package.json` exists in this folder:

```powershell
cd D:\NMS-SHG\prototype\KRD\projects\NMS-SHG\04-development\prototypes\deforum-control-ui
pnpm install
pnpm dev
```

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

## 8. Prepare A Local Deforum Backend

This is optional for the first UI scaffold. Do it when the render adapter work starts.

Recommended first backend: AUTOMATIC1111 Stable Diffusion WebUI with the Deforum extension, because the reference tutorial uses a Deforum-style control surface.

Create a render-tools folder:

```powershell
cd D:\NMS-SHG\render-tools
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
cd D:\NMS-SHG\render-tools\stable-diffusion-webui
git clone https://github.com/deforum-art/sd-webui-deforum extensions\deforum
.\webui-user.bat
```

After restart, confirm the WebUI has a Deforum tab or extension entry.

## 9. Add A Model Checkpoint

The WebUI needs at least one Stable Diffusion model checkpoint. Use a model that KR+D is allowed to use for this project.

Place model files here:

```text
D:\NMS-SHG\render-tools\stable-diffusion-webui\models\Stable-diffusion\
```

Use `.safetensors` where possible.

Do not store model licences, API tokens, client-private images, or credentials in the prototype repo.

## 10. Create Local Asset Folders

The exercise source images are tracked in Git under:

```text
assets\images\source\
```

They are 1680x720 PNG files. The UI and Deforum setup should treat them as a 7:3 source canvas.

Inside the prototype folder, create local output folders:

```powershell
cd D:\NMS-SHG\prototype\KRD\projects\NMS-SHG\04-development\prototypes\deforum-control-ui
New-Item -ItemType Directory -Force assets\images\source
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

Do not commit generated videos, model files, or temporary render outputs to Git.

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
D:\NMS-SHG\render-tools\stable-diffusion-webui\extensions\deforum\
```

Then restart `webui-user.bat`.

### Preview renders are too slow

Lower resolution first, then lower steps, duration, and FPS. Keep final-quality settings for overnight or queued renders.

### Disk fills quickly

Clean old previews from:

```text
D:\NMS-SHG\outputs\
```

and:

```text
deforum-control-ui\outputs\previews\
```

Keep only candidate renders and their exported JSON reports.

## 13. Setup Checklist

- [ ] NVIDIA driver updated and `nvidia-smi` works.
- [ ] Git works.
- [ ] Node.js LTS works.
- [ ] Python 3.10 works.
- [ ] FFmpeg works.
- [ ] pnpm works.
- [ ] Prototype folder is on the Windows PC.
- [ ] Source images folder exists at `assets\images\source`.
- [ ] The exercise images are present and verified as 1680x720.
- [ ] UI app is scaffolded or ready to be scaffolded.
- [ ] Optional: AUTOMATIC1111 WebUI launches.
- [ ] Optional: Deforum extension appears in WebUI.
- [ ] Optional: first 5-10 second preview render succeeds.

## 14. Source Links

- Git for Windows: `https://git-scm.com/install/windows`
- Microsoft Node.js on Windows guidance: `https://learn.microsoft.com/en-us/windows/dev-environment/javascript/nodejs-on-windows`
- Python on Windows guidance: `https://learn.microsoft.com/en-us/windows/python/`
- AUTOMATIC1111 WebUI: `https://github.com/AUTOMATIC1111/stable-diffusion-webui`
- AUTOMATIC1111 NVIDIA install guide: `https://github.com/AUTOMATIC1111/stable-diffusion-webui/wiki/Install-and-Run-on-NVidia-GPUs`
- Deforum extension: `https://github.com/deforum-art/sd-webui-deforum`
