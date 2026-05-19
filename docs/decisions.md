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

## 2026-05-19: Show Startup Readiness Before The Workbench

Decision: Add a full-screen startup/loading view before the workbench mounts. It checks the Vite workbench server, Local A1111 Deforum API through `/a1111-deforum/status`, and the Hugging Face proxy through `/hf-deforum/status`. If Local A1111 is not ready within the short startup window, the UI can continue in UI-only preview mode.

Reason: The reviewer needs visible feedback while local services are booting, but `pnpm dev` must remain frontend-only and should not hang the UI when the GPU backend is intentionally offline.

## 2026-05-19: Route A1111 Deforum Through A Local Body Bridge

Decision: Route `Render Deforum` through the local Vite bridge at `/a1111-deforum/run`. The browser sends reviewed settings in a JSON body; the bridge prefers the Deforum batch API at `/deforum_api/batches` and polls the job status. It only falls back to the older query-only simple API when the batch API is missing.

Reason: The 24-image default prompt-node payload is too large for browser URL/query transport and can trigger HTTP 431 before the render reaches Deforum. A body-based local bridge keeps the full image-keyframe payload intact while preserving the existing A1111 backend.

## 2026-05-19: Label Mock Preview Takes As Simulated

Decision: `Render preview` creates a saved simulated take for UI review, including an inline simulated visual preview, but does not write a media file or display a fake output path. Only real backend renders should display output file paths or artifact URLs.

Reason: Showing a placeholder `outputs/previews/*.webm` path made the mock preview look like a real generated file. The prototype should keep fast preview metadata useful without implying a render artifact exists.

## 2026-05-19: Show Persistent Backend Server Status

Decision: Add a persistent backend status chip in the workbench toolbar. Local A1111 status is checked through `/a1111-deforum/status`, Hugging Face status through `/hf-deforum/status`, and the real render button is disabled when the selected backend is offline or not configured.

Reason: A failed real Deforum render can otherwise look like a generic UI error. The reviewer needs to know whether the selected backend server is reachable before sending a long image-keyframe render payload.

## 2026-05-19: Keep Render Tools Outside Vite Frontend Scanning

Decision: Configure Vite to use `index.html` as the dependency optimisation entry, deny static serving from `render-tools/`, ignore `render-tools/` in file watching, and block browser requests for paths under `/render-tools/`.

Reason: The project-local Automatic1111 runtime contains Gradio frontend assets and Python environment files. Those files are backend/runtime assets, not React app source, and Vite can otherwise try to resolve Gradio optional imports such as `bufferutil`.

## 2026-05-19: Use Centre Preview For Rendered Output

Decision: The centre preview panel is the primary rendered-output surface. Real backend MP4 artifacts are exposed through `/render-artifacts/*`, played in the centre panel, and the fullscreen control opens the playable artifact or fullscreen preview frame.

Reason: Showing only source images in the main preview while burying real output paths in Takes made the prototype feel like the render had no visible result. Creative review needs a stable 7:3 output viewport first, with file paths as supporting metadata.
