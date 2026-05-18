# Deforum Prototype Config Contract

Status: implemented draft  
Last updated: 2026-05-18

The exported preset JSON is the durable handoff between the tuning workbench and any render adapter.

Required invariants:

- `schemaVersion` is present.
- `target.sourceResolution` is `[1680, 720]`.
- `target.aspectRatio` is `7:3`.
- every enabled source image uses a local relative path;
- enabled source images are `1680x720` unless explicitly marked as a crop or pad test;
- `model.modelId`, `model.repository`, `model.file`, and `model.license` are saved in every export;
- timeline segments use frame indexes and reference an existing source image id.

The current implementation validates these rules in `src/services/presetSchema.js`.

Source images remain as local files under `assets/images/source/`. Generated clips, exports, model checkpoints, and temporary render output remain outside Git by default through `.gitignore`.
