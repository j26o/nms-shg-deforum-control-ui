# Render Adapter Contract

Status: mock adapter plus Automatic1111 Deforum preset translator implemented
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
