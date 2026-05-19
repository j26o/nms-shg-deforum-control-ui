# Eval: End-To-End Final Output Video

Date: 2026-05-19
Artifact scope: local A1111 Deforum backend, React/Vite workbench, generated frame output, review MP4
Evaluator: Codex
Status: Pass with caveat

## Eval Methodology

- Checked current repo state and confirmed `config/model-options.json` parses.
- Started the project-local Automatic1111 Deforum backend from `render-tools/stable-diffusion-webui/webui-user.bat`.
- Started a controlled Vite server on `http://127.0.0.1:5199/` with:
  - `A1111_BASE_URL=http://127.0.0.1:7860`
  - `VITE_SOURCE_ASSET_ROOT=D:\nms-shg-deforum-control-ui-main\assets\images\source`
- Drove the UI with Playwright:
  - backend: Local A1111
  - model: `sd15-baseline`
  - preview resolution: `896x384`
  - timeline reduced to 3 source-image segments to avoid the then-current oversized query-string failure with the default 24-image timeline
  - duration: 3 seconds
  - steps: 16
- Verified generated frames and stitched a review MP4 with the bundled FFmpeg after A1111 produced frames/settings but did not leave its own MP4 artifact.

## Criteria

| Area | Result | Notes |
|---|---|---|
| Source faithfulness | Pass | The render used committed source images under `assets/images/source/` through the UI preset contract. |
| Scope control | Pass | This is local prototype evidence only, not production renderer approval. |
| UI/config usefulness | Pass with caveat | The UI successfully submitted a reduced real Deforum job and showed the backend output folder. At the time of this eval, the default 24-image timeline made the old `/a1111/deforum/run` query transport too large for Vite; this has since been addressed with the `/a1111-deforum/run` body bridge. |
| Model comparison | Pass with caveat | This run used only `sd15-baseline` for a fast end-to-end output check. |
| 1680x720 handling | Pass | Source images remained `1680x720`; preview output was `896x384`, preserving 7:3. |
| Windows setup | Pass | The run used the project-local Windows backend, FFmpeg, and Vite setup. |
| Evidence quality | Pass with caveat | A reviewable MP4 exists. A1111 generated frames and settings but did not create its expected MP4 artifact, so FFmpeg stitching was performed manually from the generated frames. |

## Results

Primary review video:

```text
D:\nms-shg-deforum-control-ui-main\outputs\previews\e2e-small-timeline-20260519105335.mp4
```

Video metadata from `ffprobe`:

```text
width: 896
height: 384
fps: 24
duration: 2.916667 seconds
frames: 70
size: 2,382,867 bytes
```

Generated frame/settings folder:

```text
D:\nms-shg-deforum-control-ui-main\render-tools\stable-diffusion-webui\outputs\img2img-images\1de32e54bbca4b0a948d98bf144287c6
```

Settings file:

```text
D:\nms-shg-deforum-control-ui-main\render-tools\stable-diffusion-webui\outputs\img2img-images\1de32e54bbca4b0a948d98bf144287c6\20260519105335_settings.txt
```

Run details:

| Field | Value |
|---|---|
| Model profile | `sd15-baseline` |
| Checkpoint | `v1-5-pruned-emaonly.safetensors` |
| Seed | `123456` |
| Preview resolution | `896x384` |
| Source segments | 3 |
| Source image set | Last three UI timeline segments after reduction: Source 22, Source 23, Source 24 from `20260512` |
| Render frames requested | 72 |
| Frame files available | 70 PNG frames |
| FFmpeg output | `outputs/previews/e2e-small-timeline-20260519105335.mp4` |

## Weaknesses

- At the time of this eval, the default 24-image timeline could not be submitted through the old A1111 query adapter because Vite returned HTTP 431 for the oversized request. Later implementation moved browser submission to the `/a1111-deforum/run` body bridge.
- A1111 generated PNG frames and settings for the successful reduced run, but its built-in stitch step did not leave the expected MP4. The review video was created manually from the generated frames with the bundled FFmpeg.
- The reduced timeline kept the last three source segments after repeated UI deletes, so the proof video is a valid real-output smoke artifact but not a curated final creative take.
- The first attempted render hit a stale/incorrect UI server and produced unrelated frames with a default Deforum prompt. Those frames are not counted as review evidence.

## Recommended Improvements

- Retest the full 24-image default timeline through the `/a1111-deforum/run` body bridge.
- Add artifact validation: a real take should not be marked complete unless a nonzero MP4 or expected frame sequence exists.
- Add a post-render fallback stitch step or diagnose why A1111/Deforum did not leave the MP4 despite generating frames.
- Add a purpose-built "review render" preset that selects 2-4 curated source images without needing manual timeline deletion.

## Revised Notes

The end-to-end local UI-to-A1111 path can produce reviewable video output when the timeline is reduced to a small image-keyframe set. The generated review MP4 is available under `outputs/previews/` for inspection. The run also confirms two implementation gaps that should be fixed before treating real backend output as reliable: oversized A1111 query payloads and missing MP4 artifact validation/stitching.
