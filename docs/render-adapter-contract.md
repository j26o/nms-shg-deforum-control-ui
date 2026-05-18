# Render Adapter Contract

Status: mock adapter plus Automatic1111 Deforum preset translator implemented; Hugging Face Deforum backend planned
Last updated: 2026-05-18

The UI talks to render engines through a normalised config rather than engine-specific payloads.

`normaliseRenderConfig(preset, modelOverride)` returns:

- preset name;
- selected model metadata;
- target resolutions and aspect ratio;
- enabled assets;
- enabled frame-based timeline segments;
- generation, image morph, motion, prompt, look, and output groups.

`queueMockRender(preset, modelOverride)` currently creates deterministic placeholder job metadata:

- job id;
- status;
- estimated duration;
- output path;
- model id;
- preview resolution;
- log lines.

Real backend jobs may additionally include:

- backend id;
- translated render settings;
- backend settings file path;
- output settings/video file patterns;
- backend response payload.

The selected runtime model profile is passed into Deforum as a frame-0 checkpoint schedule. A real render will only succeed when that checkpoint file is installed in the local Automatic1111 model folder.

This mock path is intentional. It lets Etienne review the control surface, queue behaviour, take metadata, and export contract without requiring the GPU backend.

The current real-backend path is a local Automatic1111 Deforum preset translator in `src/services/a1111DeforumAdapter.js`. It turns the reviewed preset into Deforum `prompts`, `init_images`, and render schedules, then posts the translated settings JSON to the local API and receives an output path. Take metadata stores the translated settings payload and inferred settings/output file locations for export and review.

## Planned Hugging Face Deforum Backend

The planned Hugging Face path must use the same normalised preset contract and remain Deforum-compatible. It should not be a generic text-to-video adapter.

Expected backend id:

```text
huggingface-deforum
```

Expected behaviour:

- submit frame-keyed source images and prompts to a dedicated Hugging Face Inference Endpoint or private Space/API;
- run a Deforum-style image-to-image animation backend remotely;
- return MP4 output by default;
- preserve seed, FPS, preview resolution, max frames, motion schedules, model profile, and source-image timeline metadata;
- store remote job id, endpoint id/name, output artifact URL/path, settings payload, render duration, and logs in the same take metadata flow as local A1111 renders;
- call Hugging Face through a local/server proxy so `HF_TOKEN` is never exposed in browser JavaScript.

Implementation plan:

```text
docs/huggingface-deforum-backend-plan.md
```
