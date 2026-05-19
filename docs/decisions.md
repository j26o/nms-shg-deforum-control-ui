# Decisions

This file records product and implementation decisions for the Deforum effect prototype.

## 2026-05-18: Use Browser-Local React Prototype First

Decision: Build the first executable pass as a React + Vite browser app, not Electron.

Reason: The PRD asks for a local tuning bench, and the first review needs fast UI iteration more than packaged desktop filesystem access. Electron can be added later if local file pickers, kiosk packaging, or fullscreen deployment become required.

## 2026-05-18: Keep Renderer Behind A Mock Adapter

Decision: Implement `src/services/renderAdapter.js` and `src/services/mockRenderAdapter.js` before integrating a real Deforum backend.

Reason: At scaffold time the adapter target was still open. The UI, config export, render queue, and take comparison could be reviewed independently while preserving a replaceable boundary. The first real backend target was later selected as Automatic1111 Deforum.

## 2026-05-18: Preserve 1680x720 As The Source Contract

Decision: Validate enabled source assets as `1680x720` unless explicitly marked as crop or pad tests.

Reason: The supplied exercise assets are panoramic `7:3`; preserving that frame avoids accidental `16:9` assumptions and keeps exported presets aligned with the PRD.

## 2026-05-18: Use One Canonical AI Context File

Decision: `AGENTS.md`, `CLAUDE.md`, and `GEMINI.md` point to `docs/ai-context.md` instead of duplicating instructions.

Reason: Multiple assistant-specific files drift quickly. A single source keeps repo context consistent while still supporting common tool conventions.

## 2026-05-18: Keep Local Render Runtime Inside The Prototype Folder

Decision: The local Automatic1111, Deforum, FFmpeg, checkpoint, venv, and generated-output runtime lives under project-root `render-tools/`.

Reason: This project is the whole Deforum effect prototype, not only a UI shell. Keeping the runtime folder inside the prototype makes setup, path references, generated evidence, and handoff clearer while `.gitignore` prevents large model/backend artifacts from being committed.

## 2026-05-18: Use Automatic1111 Deforum As First Real Backend

Decision: Use Automatic1111 WebUI with `sd-webui-deforum` as the first local render backend and expose a minimal `Render Deforum` UI action through a Vite `/a1111` proxy.

Reason: This matches the PRD reference workflow, runs locally on the RTX 4090 PC, and lets the prototype verify real Deforum API connectivity before a fuller adapter contract is built.

## 2026-05-18: Translate Presets Into Deforum Schedules

Decision: Map reviewed presets into Deforum `prompts`, `init_images`, and schedule strings inside `src/services/a1111DeforumAdapter.js`, while keeping source-image paths local and configurable through `VITE_SOURCE_ASSET_ROOT` when the backend cannot resolve the repo-relative path directly.

Reason: The installed Deforum simple API only copies keys that exist in its default settings, and the prototype needs an offline-friendly way to hand prompt keyframes and image sequences to the backend without inventing a separate transport format.

## 2026-05-18: Keep Real Backend Test Opt-In

Decision: The Playwright smoke test only clicks the real `Render Deforum` path when `RUN_REAL_DEFORUM=1`.

Reason: Regular UI checks should remain fast and independent of a running GPU backend. The opt-in test gives concrete backend evidence when Automatic1111 is running.

## 2026-05-18: Compare One Runtime Model Per Render

Decision: Use a single-choice runtime model control in the workbench instead of selecting multiple comparison models at once.

Reason: The local Deforum backend renders one checkpoint schedule per job. One-at-a-time selection keeps runtime evidence, output paths, checkpoint metadata, and failed artifact detection unambiguous for each take.

## 2026-05-18: Plan Hugging Face Only As A Deforum-Compatible Backend

Decision: Treat Hugging Face as an optional future backend only when it can run the same image-keyframe Deforum-style preset contract as the local Automatic1111 path.

Reason: The prototype's purpose is Deforum-like animation tuning from supplied pre-rendered images. A generic prompt-only text-to-video API would not validate the same controls, source-image retention, frame schedules, model comparison, or MP4 handoff contract.

Status: Approved direction. Future implementation should build the Hugging Face path around the simplified UI preset contract and backend-specific translation, keeping local Automatic1111 as the comparison baseline and fallback.

## 2026-05-19: Make Prompt JSON Nodes The Left Workflow Rail

Decision: Remove the manual source-image rail from the primary workbench and use the left column for frame-keyed Prompt JSON Nodes. The app discovers bundled images from `assets/images/source/**/*.png`, and each expanded node lets the reviewer select one of those images, set the frame number, apply a creative prompt guide, edit the positive prompt, edit `--neg` parameters, and preview the chosen image thumbnail.

Reason: The current exercise uses a fixed set of pre-rendered 1680x720 images committed to the repo. Etienne's main task is to choose which image drives each Deforum keyframe and tune the prompt payload, not manage source files during review. This also keeps the exported schedule close to the Automatic1111 Deforum JSON shape.

## 2026-05-19: Surface Preview Render Feedback In UI

Decision: `Render preview` now drives visible render state: busy buttons, a progress bar, a status popup, queue messaging, and failure text through the same render notice pattern used for backend errors.

Reason: Silent render actions make the prototype hard to evaluate. Even the mock preview path should confirm that the app accepted the render request, built the prompt payload, and saved a take.
