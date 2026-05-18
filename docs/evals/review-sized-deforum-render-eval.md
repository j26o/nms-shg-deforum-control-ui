# Eval: Review-Sized Deforum Render

Date: 2026-05-18
Artifact scope: `src/services/a1111DeforumAdapter.js`, local Automatic1111 Deforum render output, source asset path handling, review-sized render evidence
Evaluator: Codex using `deforum-prototype-eval`
Status: Pass with caveats

## Eval Methodology

Ran the upgraded Automatic1111 Deforum adapter through the React workbench using a dedicated Vite dev server on `http://127.0.0.1:5174/` with:

```powershell
$env:VITE_SOURCE_ASSET_ROOT='D:\nms-shg-deforum-control-ui-main\assets\images\source'
pnpm exec vite --host 127.0.0.1 --port 5174 --strictPort
```

The render used the default preset source sequence and the local SD 1.5 baseline backend. After render completion, inspected the output folder, saved Deforum settings, MP4 metadata, and sampled first/middle/late frames.

Deterministic checks run:

```powershell
pnpm test
pnpm build
git diff --check
Get-Content -Raw config/model-options.json | ConvertFrom-Json
System.Drawing dimension check for assets/images/source/**/*.png
ffprobe on the generated MP4
```

## Criteria

| Area | Result |
|---|---|
| Source faithfulness | Pass |
| Scope control | Pass |
| UI/config usefulness | Pass with caveat |
| Model comparison | Pass with caveat |
| 1680x720 handling | Pass |
| Windows setup | Pass |
| Evidence quality | Pass |

## Results

Backend status: Automatic1111 Deforum API responded at `/deforum/api_version` with version `1.0`.

Render output:

```text
D:\nms-shg-deforum-control-ui-main\render-tools\stable-diffusion-webui\outputs\img2img-images\212cc514c0ec4739ad0006bc4d46195f\20260518192237.mp4
```

Settings file:

```text
D:\nms-shg-deforum-control-ui-main\render-tools\stable-diffusion-webui\outputs\img2img-images\212cc514c0ec4739ad0006bc4d46195f\20260518192237_settings.txt
```

Run metadata:

- model profile: `sd15-baseline`
- checkpoint file: `v1-5-pruned-emaonly.safetensors`
- resolution: `896x384`
- source aspect: `7:3`
- duration: `9.916667s`
- video frames: `238`
- Deforum `max_frames`: `240`
- fps: `24`
- steps: `25`
- seed: `123456`
- sampler: `DPM++ 2M Karras`
- animation mode: `3D`
- depth warping: `true`
- diffusion cadence: `2`
- render wall time through the UI: about `453s`
- output MP4 size: `15045951` bytes

Prompt schedule:

- `0`: monochrome mist landscape prompt plus negative prompt
- `120`: dense futuristic city architecture prompt plus negative prompt
- `240`: dense futuristic city architecture prompt plus negative prompt

Source images:

- `assets/images/source/20260430/..._6a54c52c-a453-47d3-adee-34f15cbcdbba_0.png`
- `assets/images/source/20260430/..._6a54c52c-a453-47d3-adee-34f15cbcdbba_1.png`
- `assets/images/source/20260430/..._6a54c52c-a453-47d3-adee-34f15cbcdbba_2.png`

Quality review:

- Composition stability: starts as a coherent panoramic mist/water landscape, then becomes unstable by the middle frames.
- Source identity retention: weak after the first segment; the second and third source images pull the run into high-contrast graphic abstraction.
- Morph smoothness: technically continuous, but visual identity changes abruptly around the source-image transitions.
- Future Wall fit: the first frame direction is usable; the later outlined mosaic look is not yet aligned with the desired poetic Future Wall render style.
- Architecture detail: later frames contain strong architectural silhouettes, but they are too posterized and outlined for this preset.
- Render speed: about 7.5 minutes for one 10-second `896x384` SD 1.5 pass, acceptable for prototype evidence but too slow for frequent iteration at current settings.
- Production viability: prototype-only evidence; not suitable for production handoff yet.

## Weaknesses

- The upgraded adapter successfully maps prompt and source-image schedules, but the default `denoiseStrength`, `sourceImageStrength`, depth warp, and guided-image transition values are too aggressive for stable identity retention.
- The UI currently saves the returned output path in take metadata, but does not yet expose the Deforum settings file path or exported settings payload in the take card/export flow.
- Only SD 1.5 has been validated locally. SDXL Base and other comparison models remain pending.
- The render relied on `VITE_SOURCE_ASSET_ROOT` for backend-visible source paths. This should stay documented because the A1111 backend cannot resolve Vite module asset URLs or repo-relative paths by itself.

## Recommended Improvements

- Add a "review render" preset or macro that lowers denoise/depth warp and limits frames before running expensive preview tests.
- Persist `renderSettings`, settings file path, checkpoint file, frame count, and render wall time in take metadata.
- Export the Deforum settings payload alongside the reviewed preset JSON.
- Run another `896x384` pass with lower denoise and weaker depth warp before testing SDXL Base.
- Add visual evidence thumbnails or a contact sheet beside eval reports if the generated frames can remain outside Git.

## Revised Notes

The next implementation priority is take metadata and settings export. The real backend path is no longer a smoke call: it can drive a multi-source, frame-keyed Deforum render from the workbench, but the first review-sized output shows the current default values need tuning before creative review.
