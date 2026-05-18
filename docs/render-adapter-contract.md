# Render Adapter Contract

Status: mock adapter plus Automatic1111 Deforum smoke adapter implemented  
Last updated: 2026-05-18

The UI talks to render engines through a normalised config rather than engine-specific payloads.

`normaliseRenderConfig(preset, modelOverride)` returns:

- preset name;
- selected model metadata;
- target resolutions and aspect ratio;
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

This mock path is intentional. It lets Etienne review the control surface, queue behaviour, take metadata, and export contract without requiring the GPU backend.

The current real-backend path is a small Automatic1111 Deforum smoke adapter in `src/services/a1111DeforumAdapter.js`. It proves the UI can call the local Deforum API and receive an output path. It is not yet a complete preset-to-Deforum translator.
