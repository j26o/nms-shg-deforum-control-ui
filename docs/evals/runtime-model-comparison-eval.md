# Eval: Runtime Model Comparison Render

Date: 2026-05-18
Artifact scope: Workbench runtime model selection, local Automatic1111 Deforum backend renders, installed comparison checkpoints
Evaluator: Codex
Status: Pass with caveats

## Eval Methodology

- Used the workbench runtime model control to launch one real Deforum render per configured model profile.
- Backend: `http://127.0.0.1:7860`, Deforum API version `1.0`.
- Source images: three `1680x720` PNGs from `assets/images/source/20260430/`.
- Prompt schedule: frame `0` monochrome mist landscape, frame `120` dense futuristic city architecture, frame `240` dense futuristic city architecture.
- Shared settings: seed `123456`, `896x384`, `24 fps`, `max_frames=240`, `steps=25`, sampler `DPM++ 2M Karras`, checkpoint scheduling enabled.
- Reviewed output directories, generated MP4 metadata with `ffprobe`, and inspected first, middle, and final frames for successful renders.

Automation caveat: the comparison attempt was intended to shorten duration and steps through UI sliders, but the saved Deforum settings remained `max_frames=240` and `steps=25`. Treat these as full review-length runtime renders, not abbreviated 3-second tests.

## Criteria

| Area | Result |
|---|---|
| Source faithfulness | Pass. Evidence is grounded in local settings files, frame output, MP4 metadata, and inspected frames. |
| Scope control | Pass. This remains prototype runtime evidence, not production model approval. |
| UI/config usefulness | Pass with caveat. Radio selection correctly changed checkpoint schedules, but the real-backend adapter/UI needs artifact validation. |
| Model comparison | Pass with caveat. Three profiles produced comparable artifacts; SDXL Base and SDXL Refiner did not produce frames or video. |
| 1680x720 handling | Pass. Source images remained `1680x720`; render fallback stayed `896x384` with the intended 7:3 aspect ratio. |
| Windows setup | Pass. Local backend, checkpoint paths, FFmpeg probe, and frontend flow are executable on the target Windows machine. |
| Evidence quality | Pass with caveat. Successful renders have MP4/frame evidence; failed SDXL profiles only have settings files and require backend log capture in a future pass. |

## Results

| Profile | Checkpoint schedule | UI wall time | Artifact result | Output path | Qualitative judgement |
|---|---:|---:|---|---|---|
| `sd15-baseline` | `v1-5-pruned-emaonly.safetensors` | 192s | MP4, 238 PNG frames, `896x384`, `9.916667s`, 24 fps, 15,496,401 bytes | `D:\nms-shg-deforum-control-ui-main\render-tools\stable-diffusion-webui\outputs\img2img-images\e7998dc6eefd401f8c27b2cda6260e33\20260518201523.mp4` | Starts with a readable mist landscape and architecture, then collapses into high-contrast outlined abstraction by the midpoint and final frame. |
| `sdxl-base` | `sd_xl_base_1.0.safetensors` | 10s | No MP4, 0 PNG frames, settings file only | `D:\nms-shg-deforum-control-ui-main\render-tools\stable-diffusion-webui\outputs\img2img-images\2ccb6c3185f5491b84736614b7c010d8\20260518201836_settings.txt` | Runtime failure for comparative rendering. The UI returned completion even though no render artifact was created. |
| `realvisxl-v5` | `RealVisXL_V5.0_fp16.safetensors` | 268s | MP4, 238 PNG frames, `896x384`, `9.916667s`, 24 fps, 8,630,159 bytes | `D:\nms-shg-deforum-control-ui-main\render-tools\stable-diffusion-webui\outputs\img2img-images\7188518296fb4e34b1d4740a142be7b0\20260518201846.mp4` | Strongest first-frame photographic atmosphere, but later frames drift into graphic abstraction with weak source identity retention. |
| `juggernaut-xl-v9` | `Juggernaut-XL_v9_RunDiffusionPhoto_v2.safetensors` | 269s | MP4, 238 PNG frames, `896x384`, `9.916667s`, 24 fps, 8,676,743 bytes | `D:\nms-shg-deforum-control-ui-main\render-tools\stable-diffusion-webui\outputs\img2img-images\0da50ae01ea448c28853802c18b41abd\20260518202314.mp4` | Similar to RealVisXL with a strong first frame and better crispness, but still loses composition into stylized panel-like abstraction over time. |
| `sdxl-refiner` | `sd_xl_refiner_1.0.safetensors` | 9s | No MP4, 0 PNG frames, settings file only | `D:\nms-shg-deforum-control-ui-main\render-tools\stable-diffusion-webui\outputs\img2img-images\17ba380339bd4a58bea3ca9b9fbaf7c8\20260518202743_settings.txt` | Runtime failure for comparative rendering. The refiner is not currently usable as a standalone Deforum comparison profile with these settings. |

## Weaknesses

- The adapter currently trusts the Deforum API response and output directory metadata even when no MP4 or frames exist.
- SDXL Base and SDXL Refiner produced settings files but no render artifacts, so their runtime failure mode needs backend log capture and a smaller direct API repro.
- Successful renders preserve the opening source mood but do not retain enough composition stability for Future Wall review. Mid and late frames become outlined, abstract, and visually disconnected from the source set.
- The workbench controls are usable manually, but automated slider changes did not alter persisted render settings in this runtime pass.
- Juggernaut XL v9 remains prototype-only until license and deployment rights are explicitly approved.

## Recommended Improvements

- Add output artifact validation to the real adapter: require at least one generated video or a nonzero frame count before marking a take successful.
- Add a backend compatibility investigation for SDXL Base and SDXL Refiner using a minimal Deforum API payload and captured Automatic1111 console logs.
- Add direct numeric inputs or more testable control handlers for duration and steps, so runtime evals can reliably run shorter comparisons.
- Tune schedules for composition retention before using any model output for stakeholder review: lower motion intensity, reduce denoise/strength drift, and consider ControlNet or another source-locking strategy.
- Keep `realvisxl-v5` and `juggernaut-xl-v9` as the leading visual candidates, but do not treat either as production-ready based on this pass.

## Revised Notes

- Runtime model selection is wired through to checkpoint scheduling in Deforum settings. The current UI uses the single Generation model profile dropdown for this.
- A successful UI completion is not equivalent to a successful backend render until artifact validation exists.
- Comparative runtime rendering is now proven for SD 1.5, RealVisXL V5.0, and Juggernaut XL v9 on the local backend.
- SDXL Base and SDXL Refiner are installed and loadable in Automatic1111, but failed this Deforum runtime comparison because no frames or MP4 were created.
