# Model Options For Deforum Effect Review

Status: prototype model matrix
Last updated: 2026-05-17
Config source: `config/model-options.json`

## Purpose

The Deforum effect should not lock to one checkpoint too early. Different Stable Diffusion checkpoints can produce very different morph stability, architecture detail, cinematic tone, and flicker behaviour from the same 1680x720 source images.

The prototype UI should expose model choice as a Generation control so Etienne can render the same prompt/image/timeline preset through multiple models and compare candidate takes side by side.

## UI Requirement

Add a `Model profile` dropdown in the Generation control group.

The UI should:

- load options from `config/model-options.json`;
- show label, intended use, licence status, and risk note for the selected model;
- store `modelId`, `repository`, `file`, and `license` in every exported preset;
- allow the same preset to be queued against multiple selected models;
- tag each output take with model metadata for comparison.

## Recommended Model Matrix

| Model ID | Model | Download file | Licence | Prototype role | Notes |
|---|---|---|---|---|---|
| `sd15-baseline` | Stable Diffusion 1.5 | `v1-5-pruned-emaonly.safetensors` | CreativeML OpenRAIL-M | Deforum compatibility baseline | Fastest fallback and most likely to work with classic Deforum workflows. |
| `sdxl-base` | Stable Diffusion XL Base 1.0 | `sd_xl_base_1.0.safetensors` | OpenRAIL++ | Neutral high-detail fallback | Stronger prompt/detail baseline for panoramic morph tests. |
| `realvisxl-v5` | RealVisXL V5.0 | `RealVisXL_V5.0_fp16.safetensors` | OpenRAIL++ | Photoreal skyline/architecture pass | Useful to test realism, lighting, and city detail. |
| `juggernaut-xl-v9` | Juggernaut XL v9 | `Juggernaut-XL_v9_RunDiffusionPhoto_v2.safetensors` | CreativeML OpenRAIL-M plus model-card business/API-use restrictions | Cinematic architecture pass | Prototype-only until licence review confirms production suitability. |
| `sdxl-refiner` | SDXL Refiner 1.0 | `sd_xl_refiner_1.0.safetensors` | OpenRAIL++ | Optional finishing stage | Not the primary Deforum animation model; use only where the backend supports refiner workflows. |

## Download Folder

Place `.safetensors` files in the Automatic1111 checkpoint folder:

```text
D:\NMS-SHG\render-tools\stable-diffusion-webui\models\Stable-diffusion\
```

Model files remain ignored by Git.

## Download Commands

Install the Hugging Face CLI:

```powershell
python -m pip install -U huggingface_hub
huggingface-cli login
```

Some models require opening the Hugging Face model page and accepting terms before CLI download works.

Set the local model directory:

```powershell
$MODEL_DIR = "D:\NMS-SHG\render-tools\stable-diffusion-webui\models\Stable-diffusion"
```

Download the baseline and fallback models:

```powershell
huggingface-cli download stable-diffusion-v1-5/stable-diffusion-v1-5 v1-5-pruned-emaonly.safetensors --local-dir $MODEL_DIR
huggingface-cli download stabilityai/stable-diffusion-xl-base-1.0 sd_xl_base_1.0.safetensors --local-dir $MODEL_DIR
huggingface-cli download SG161222/RealVisXL_V5.0 RealVisXL_V5.0_fp16.safetensors --local-dir $MODEL_DIR
huggingface-cli download RunDiffusion/Juggernaut-XL-v9 Juggernaut-XL_v9_RunDiffusionPhoto_v2.safetensors --local-dir $MODEL_DIR
huggingface-cli download stabilityai/stable-diffusion-xl-refiner-1.0 sd_xl_refiner_1.0.safetensors --local-dir $MODEL_DIR
```

Restart Automatic1111 after downloading, then confirm the checkpoints appear in the WebUI model dropdown.

## Comparison Workflow

1. Pick one source-image sequence from `assets/images/source/`.
2. Use the same prompt schedule, seed, motion settings, and preview size across all models.
3. Render at `896x384` first.
4. Promote promising models to `1344x576`.
5. Compare takes using the rubric below.
6. Export the final candidate config with model metadata included.

## Comparison Rubric

Score each model from 1 to 5:

| Criterion | What To Check |
|---|---|
| Composition stability | Does the 7:3 frame stay stable without edge collapse or unwanted cropping? |
| Source identity retention | Do the source image landmarks survive long enough during the morph? |
| Morph smoothness | Is there flicker, tearing, or sudden style snapping? |
| Future Wall fit | Does the look feel poetic, atmospheric, and suitable for the Conclusion Space? |
| Architecture detail | Are skyline/building forms legible without becoming noisy? |
| Render speed | Is iteration fast enough for review sessions on the RTX 4090? |
| Production viability | Are licence, setup, and backend support acceptable for the intended use? |

## Source Links

- Stable Diffusion 1.5: `https://huggingface.co/stable-diffusion-v1-5/stable-diffusion-v1-5`
- SDXL Base 1.0: `https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0`
- SDXL Refiner 1.0: `https://huggingface.co/stabilityai/stable-diffusion-xl-refiner-1.0`
- RealVisXL V5.0: `https://huggingface.co/SG161222/RealVisXL_V5.0`
- Juggernaut XL v9: `https://huggingface.co/RunDiffusion/Juggernaut-XL-v9`
