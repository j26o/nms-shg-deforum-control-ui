# Eval: Source Faithfulness Output Review

Date: 2026-05-19
Artifact scope: latest local Deforum MP4 output, saved Deforum settings, default preset source-faithfulness tuning
Evaluator: Codex using `deforum-prototype-eval`
Status: Fail for latest MP4 source faithfulness; revised defaults implemented

## Eval Methodology

Reviewed the user-provided frame screenshot and inspected the latest saved Deforum settings for:

```text
render-tools/stable-diffusion-webui/outputs/img2img-images/future-wall-morph-study-01-deforum/20260519195919.mp4
render-tools/stable-diffusion-webui/outputs/img2img-images/future-wall-morph-study-01-deforum/20260519195919_settings.txt
```

Ran deterministic checks after the preset changes:

```powershell
pnpm test
pnpm build
```

## Criteria

| Area | Result |
|---|---|
| Source faithfulness | Fail for the reviewed MP4 |
| Scope control | Pass |
| UI/config usefulness | Pass with caveat |
| Model comparison | Pass with caveat |
| 1680x720 handling | Pass |
| Windows setup | Pass with caveat |
| Evidence quality | Pass with caveat |

## Results

The reviewed MP4 does not resemble the supplied source frames. The screenshot shows high-contrast abstract linework/mosaic geometry instead of the maritime skyline/waterfront source compositions.

The saved settings indicate this render was not produced from the latest source-faithful defaults:

- checkpoint: `v1-5-pruned-emaonly.safetensors`
- resolution: `896x384`
- frames/FPS: `480` frames at `60` fps
- prompt schedule: old inline per-keyframe creative direction plus `--neg`
- animation mode: `3D`
- depth warping: enabled
- zoom/pan: `zoom 1.02`, `translation_y -0.01`, `translation_z 1.99`
- denoise: `strength_schedule 0: (0.38)`
- noise/image decay: `noise_schedule 0: (0.18)`
- guided tween span: `tweening_frames_schedule 0: (10)`
- source image strength: `image_strength_schedule 0: (0.84)`

The default preset has been changed to bias toward image-keyframe retention:

- source image strength `0.96`
- denoise `0.18`
- image influence decay/noise `0.04`
- structural lock `0.92`
- 2D mode by disabling default depth warp
- no default zoom/pan drift
- cadence `1`
- guided tween span `42`
- prompt node wording that names the selected source image as the required target and blocks invented city geometry, abstract line art, and mosaic patterns

## Weaknesses

- The latest MP4 proves a stale or older-running UI/backend session can still produce unusable output even after source assets and negative prompts are configured.
- No new MP4 has been rendered from the revised source-faithful defaults yet.
- The separate Local A1111 batch blocker for 3+ guided images still prevents a clean full 8-image RealVisXL artifact in the current backend session.

## Recommended Improvements

- Restart the UI/backend before the next creative render so the latest preset and RealVisXL default are loaded.
- Rerun a short controlled RealVisXL pass and inspect its saved settings before spending time on a full review render.
- If the 8-image looper path continues to fail, test a pairwise two-source morph/stitch path so each segment can be forced toward its target image.

## Revised Notes

The complaint is valid: the reviewed output should not be used as creative evidence. The code now defaults to a more conservative image-reference morph setup, but the next decision depends on a fresh render from the restarted app/backend.
