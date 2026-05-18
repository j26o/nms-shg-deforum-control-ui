# Export Format

Status: implemented draft  
Last updated: 2026-05-18

The prototype exports three review artifacts:

- reviewed preset JSON;
- Deforum settings JSON for a marked real-backend candidate take;
- human-readable Markdown report.

The JSON is generated from the current preset after schema validation. The Markdown report includes:

- preset name and export timestamp;
- source, preview, review, and final resolution notes;
- model id, repository, checkpoint file, licence, and status;
- timeline frame ranges and prompts;
- enabled source assets;
- candidate take metadata when one is marked, including backend, checkpoint file, seed, frame count, FPS, render duration, output path, and settings file path;
- production handoff notes.

The Deforum settings JSON is generated from the selected candidate take's stored `renderSettings` payload. It includes the original translated Deforum settings plus take metadata such as backend, checkpoint file, output path, settings file path, frame count, and render duration.

The report is for review and handoff discussion. The JSON remains the machine-readable contract consumed by future render adapters.
