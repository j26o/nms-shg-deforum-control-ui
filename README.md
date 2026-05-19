# Deforum Effect Prototype

Status: executable end-to-end prototype scaffold
Owner: Etienne Chia for creative tuning; Roland Baldovino for technical planning  
Created: 2026-05-16

## Purpose

This repository contains the whole local Deforum effect prototype for NMS-SHG Conclusion Space creative tuning: the React/Vite workbench, source assets, preset/export logic, local Automatic1111 Deforum runtime, model matrix, and generated review evidence.

The tuning bench reads the committed pre-generated 1680x720 images, lets Etienne assign them to frame-keyed Prompt JSON Nodes, adjust motion and diffusion parameters through a modern UI, compare rendered passes, and export a final configuration for the NMS-SHG Conclusion Space visual system.

The prototype is a development workbench, not a final show-control build. Its job is to make the creative parameters reviewable before the production Conclusion Space renderer is locked.

## Source Evidence Used

- Supplied target PC screenshot: Windows 11 Pro, Intel Core i9-13900K, 64 GB RAM, NVIDIA GeForce RTX 4090 24 GB, multi-touch support.
- KR+D Developer Guidelines Notion database:
  - Section 1, Development Principles.
  - Section 4, Web Apps: React + Vite Standards.
  - Section 6, TouchDesigner: Project Standards.
  - Section 8, Specs: Spec-First Development.
- Fresh analysis of the supplied YouTube references:
  - `https://www.youtube.com/watch?v=djP6KkNy0aE`
  - `https://www.youtube.com/watch?v=h_-DZxn2P5U`

Per request, the effect notes in this prototype plan come from a fresh pass over the supplied YouTube references and extracted frames, not from the existing in-repo effect-analysis material.

## Plan

Read the PRD/spec plan here:

- `docs/deforum-control-ui-prd-spec.md`
- `docs/windows-setup.md`
- `docs/source-assets.md`
- `docs/model-options.md`
- `docs/local-render-setup.md`
- `docs/huggingface-deforum-backend-plan.md`
- `docs/todo.md`
- `docs/ai-context.md`
- `docs/decisions.md`
- `config/model-options.json`
- `.agents/skills/deforum-prototype-eval/SKILL.md`

## Assumptions And Known Gaps

- The prototype can run locally on the supplied RTX 4090 PC for short preview renders.
- The current exercise source assets are 1680x720 PNGs, so the tuning workbench and renderer settings should use a 7:3 canvas and avoid 16:9 assumptions.
- Model choice is part of the exercise: the UI should expose the configured fallback model profiles so the same Deforum setup can be compared across checkpoints.
- Final production resolution, projection mapping, and TouchDesigner integration details are still to be confirmed.
- This plan assumes local-only assets and local render jobs. No cloud generation, visitor data, production network addresses, or credentials are part of the prototype.
- The renderer adapter should remain replaceable: Automatic1111 Deforum is the current in-repo runtime under `render-tools/`, while a Hugging Face Deforum-compatible endpoint, ComfyUI, a custom img2img loop, or a TouchDesigner-facing playback/export path can be swapped behind the same adapter contract later.
- The Hugging Face path is planned only for actual Deforum-like output from the same image-keyframe preset contract, not for generic prompt-only text-to-video generation.

## How To Run It

The first executable React + Vite workbench now exists as part of the full local effect prototype. It implements the PRD/spec workbench shape with a local mock render adapter, model-profile dropdown, 7:3 preview frame, frame-keyed Prompt JSON Nodes with image thumbnails and creative prompt guides, render progress feedback, take metadata, export actions, and a real Automatic1111 Deforum backend path.

Set up the Windows target PC first using:

- `docs/windows-setup.md`
- `docs/local-render-setup.md`

### 1. Confirm The Backend Launcher

The normal UI dev command does not start Automatic1111. Confirm the backend launcher exists before using `pnpm dev:backend`:

```powershell
cd D:\nms-shg-deforum-control-ui-main\render-tools\stable-diffusion-webui
Test-Path .\webui-user.bat
```

The launcher should include these backend flags in `webui-user.bat`:

```bat
set COMMANDLINE_ARGS=--api --deforum-api --deforum-simple-api
```

You can still verify or start the backend manually when debugging:

```powershell
Invoke-RestMethod http://127.0.0.1:7860/deforum/api_version
Invoke-RestMethod http://127.0.0.1:7860/sdapi/v1/sd-models
```

### 2. Start The UI And Backend

Open PowerShell from this repo:

```powershell
cd D:\nms-shg-deforum-control-ui-main
pnpm install
pnpm dev
```

`pnpm dev` starts the React/Vite workbench only. It does not launch Stable Diffusion or Automatic1111.

Use the backend-aware launcher only when you intentionally want the local Automatic1111 Deforum runtime as well:

```powershell
pnpm dev:backend
```

`pnpm dev:backend` checks `http://127.0.0.1:7860`, starts `render-tools\stable-diffusion-webui\webui-user.bat` if needed, waits for the Deforum and Stable Diffusion APIs, sets `VITE_SOURCE_ASSET_ROOT` to the project source-image folder, then starts Vite.

The dev server defaults to:

```text
http://127.0.0.1:5173
```

Use `Render preview` for the fast mock path. Use `Render Deforum` after `pnpm dev:backend` reports the backend is ready, or after you manually start Automatic1111.

Frontend-only development and smoke tests can use:

```powershell
pnpm dev:ui
```

### 3. Run Checks

Mock/UI checks:

```powershell
pnpm test
pnpm exec playwright test
```

Real backend Playwright path:

```powershell
$env:RUN_REAL_DEFORUM='1'
pnpm exec playwright test --reporter=list
```

Build check:

```powershell
pnpm build
git diff --check
```

## Implemented In This Pass

- React + Vite scaffold with named exports.
- CSS token file and dense workbench layout.
- Asset rail seeded from `assets/images/source/`.
- 1680x720 / 7:3 preview frame with safe-frame guides.
- Model profile control populated from `config/model-options.json`.
- Generation, Image Morph, Motion, Prompt, Look, and Output controls.
- Frame-keyed prompt JSON nodes with source-image selection, frame numbers, prompt text, and `--neg` params.
- Mock render adapter that creates queue jobs and comparable take metadata.
- Automatic1111 Deforum preset translator via the `Render Deforum` toolbar action.
- Exportable reviewed JSON plus readable Markdown report.
- Vitest contract tests and Playwright CLI smoke test.

## Current Adapter Status

The default preview action still uses deterministic mock metadata for fast UI review. The `Render Deforum` action calls the selected real backend. `Local A1111` uses the Automatic1111 Deforum backend when it is running at `http://127.0.0.1:7860`; `Hugging Face` uses the local `/hf-deforum/*` proxy and requires `HF_DEFORUM_ENDPOINT_URL` plus a valid `HF_TOKEN` or named Hugging Face CLI token.

Backend runtime files live under `render-tools/` inside this project folder and are ignored by Git because they include a nested WebUI checkout, Python environment, model checkpoints, and generated render outputs. Backend setup details are in `docs/local-render-setup.md`.

Project-level logs and handoff artifacts should stay under `outputs/` in this repo. Use `outputs/logs/` for run logs, `outputs/previews/` for lightweight preview artifacts, and `outputs/exports/` for reviewed JSON/report exports. Automatic1111 render evidence stays under `render-tools/stable-diffusion-webui/outputs/`.

## Next Steps

The active implementation checklist is maintained in:

- `docs/todo.md`

## Production Relevance

This prototype can inform production work if it produces:

- approved parameter presets,
- a clear exported config schema,
- before/after render comparisons,
- performance evidence on the target PC,
- and a documented mapping from creative controls to the final Conclusion Space renderer.

It should not be copied into `05-production/` until the exported presets and runtime integration path are reviewed and frozen through the project release process.
