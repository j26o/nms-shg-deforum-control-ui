# Export Format

Status: implemented draft  
Last updated: 2026-05-18

The prototype exports two review artifacts:

- reviewed preset JSON;
- human-readable Markdown report.

The JSON is generated from the current preset after schema validation. The Markdown report includes:

- preset name and export timestamp;
- source, preview, review, and final resolution notes;
- model id, repository, checkpoint file, licence, and status;
- timeline frame ranges and prompts;
- enabled source assets;
- candidate take metadata when one is marked;
- production handoff notes.

The report is for review and handoff discussion. The JSON remains the machine-readable contract consumed by future render adapters.
