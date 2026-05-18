# Deforum Control UI Prototype

Status: executable prototype scaffold  
Owner: Etienne Chia for creative tuning; Roland Baldovino for technical planning  
Created: 2026-05-16

## Purpose

This prototype defines a local tuning bench for Deforum-style image morphing so Etienne can load multiple pre-generated images, adjust motion and diffusion parameters through a modern UI, compare rendered passes, and export a final configuration for the NMS-SHG Conclusion Space visual system.

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
- `docs/todo.md`
- `docs/ai-context.md`
- `docs/decisions.md`
- `config/model-options.json`
- `.agents/skills/deforum-prototype-eval/SKILL.md`

## Assumptions And Known Gaps

- The prototype can run locally on the supplied RTX 4090 PC for short preview renders.
- The current exercise source assets are 1680x720 PNGs, so the tuning UI should use a 7:3 canvas and avoid 16:9 assumptions.
- Model choice is part of the exercise: the UI should expose the configured fallback model profiles so the same Deforum setup can be compared across checkpoints.
- Final production resolution, projection mapping, and TouchDesigner integration details are still to be confirmed.
- This plan assumes local-only assets and local render jobs. No cloud generation, visitor data, production network addresses, or credentials are part of the prototype.
- The renderer adapter should remain replaceable: Automatic1111 Deforum, ComfyUI, a custom img2img loop, or a TouchDesigner-facing playback/export path can be swapped behind the same UI contract.

## How To Run It

The first executable React + Vite prototype scaffold now exists. It implements the PRD/spec workbench shape with a local mock render adapter, model-profile dropdown, 7:3 preview frame, timeline segments, take metadata, and export actions.

Set up the Windows target PC first using:

- `docs/windows-setup.md`

Install and run:

```bash
pnpm install
pnpm dev
pnpm test
pnpm exec playwright test
```

The dev server defaults to:

```text
http://127.0.0.1:5173
```

## Implemented In This Pass

- React + Vite scaffold with named exports.
- CSS token file and dense workbench layout.
- Asset rail seeded from `assets/images/source/`.
- 1680x720 / 7:3 preview frame with safe-frame guides.
- Model profile control populated from `config/model-options.json`.
- Generation, Image Morph, Motion, Prompt, Look, and Output controls.
- Frame-based prompt/image timeline with add, duplicate, reorder, and delete actions.
- Mock render adapter that creates queue jobs and comparable take metadata.
- Automatic1111 Deforum smoke adapter via the `Render Deforum` toolbar action.
- Exportable reviewed JSON plus readable Markdown report.
- Vitest contract tests and Playwright CLI smoke test.

## Current Adapter Status

The default preview action still uses deterministic mock metadata for fast UI review. The `Render Deforum` action calls a local Automatic1111 Deforum backend when it is running at `http://127.0.0.1:7860`.

Backend setup details are in `docs/local-render-setup.md`.

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
