# Eval: Comparison Model Backend Setup

Date: 2026-05-18
Artifact scope: `config/model-options.json`, `docs/model-options.md`, local Automatic1111 checkpoint folder, backend model refresh/load checks
Evaluator: Codex using `deforum-prototype-eval`
Status: Pass with caveats

## Eval Methodology

Checked the existing Automatic1111 model folder, authenticated Hugging Face CLI status, local Git ignore policy for model files, and the configured model matrix. Downloaded missing checkpoint files with `hf download` into:

```text
D:\nms-shg-deforum-control-ui-main\render-tools\stable-diffusion-webui\models\Stable-diffusion
```

After download, refreshed the Automatic1111 checkpoint list through:

```powershell
Invoke-RestMethod -Method Post http://127.0.0.1:7860/sdapi/v1/refresh-checkpoints
```

Then load-tested each configured checkpoint through `/sdapi/v1/options` and restored SD 1.5 as the active default checkpoint.

## Criteria

| Area | Result |
|---|---|
| Source faithfulness | Pass |
| Scope control | Pass |
| UI/config usefulness | Pass |
| Model comparison | Pass with caveat |
| 1680x720 handling | Pass |
| Windows setup | Pass |
| Evidence quality | Pass |

## Results

Downloaded and verified checkpoint files:

| Model ID | File | Size |
|---|---|---:|
| `sd15-baseline` | `v1-5-pruned-emaonly.safetensors` | 3.97 GB |
| `sdxl-base` | `sd_xl_base_1.0.safetensors` | 6.46 GB |
| `realvisxl-v5` | `RealVisXL_V5.0_fp16.safetensors` | 6.46 GB |
| `juggernaut-xl-v9` | `Juggernaut-XL_v9_RunDiffusionPhoto_v2.safetensors` | 6.62 GB |
| `sdxl-refiner` | `sd_xl_refiner_1.0.safetensors` | 5.66 GB |

Automatic1111 backend load-test results:

| Checkpoint | Result | Reported active checkpoint | Load time |
|---|---|---|---:|
| `v1-5-pruned-emaonly.safetensors` | Loaded | `v1-5-pruned-emaonly.safetensors` | 0.1s |
| `sd_xl_base_1.0.safetensors` | Loaded | `sd_xl_base_1.0.safetensors [31e35c80fc]` | 9.6s |
| `RealVisXL_V5.0_fp16.safetensors` | Loaded | `RealVisXL_V5.0_fp16.safetensors [6a35a78557]` | 9.2s |
| `Juggernaut-XL_v9_RunDiffusionPhoto_v2.safetensors` | Loaded | `Juggernaut-XL_v9_RunDiffusionPhoto_v2.safetensors [c9e3e68f89]` | 8.6s |
| `sd_xl_refiner_1.0.safetensors` | Loaded | `sd_xl_refiner_1.0.safetensors [7440042bbd]` | 8.7s |

Final active checkpoint after verification:

```text
v1-5-pruned-emaonly.safetensors [6ce0161689]
```

Git policy check: `.gitignore` excludes `*.safetensors`, so downloaded model weights remain outside Git.

## Weaknesses

- Load-tested means Automatic1111 can see and load the checkpoint. It does not prove each checkpoint produces a usable Deforum animation.
- SDXL Base, RealVisXL, Juggernaut XL, and SDXL Refiner still need runtime render comparison passes using the workbench model radio control.
- Juggernaut XL remains prototype-only until licence review confirms whether production use is acceptable.
- SDXL Refiner is available to the backend, but it is not a primary Deforum animation model and may only be useful in workflows that explicitly support refinement.

## Recommended Improvements

- Run one short `896x384` Deforum pass per installed comparison model using the same preset, seed, and source images.
- Record output path, render duration, settings payload, visual notes, and candidate take metadata for each model.
- Keep SD 1.5 as the fallback default until an SDXL-class model demonstrates better morph stability.
- Add model-specific caveats to the workbench if SDXL or refiner checkpoints require different generation settings.

## Revised Notes

The backend is now prepared for runtime model comparison. The next work is comparative rendering and qualitative scoring, not additional download/setup.
