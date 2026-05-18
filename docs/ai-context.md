# AI Contributor Context

Status: canonical context  
Last updated: 2026-05-18

This repository contains the whole local Deforum effect prototype for NMS-SHG Conclusion Space creative tuning, including the React/Vite workbench, source assets, preset/export logic, local Automatic1111 Deforum runtime under `render-tools/`, model matrix, and rendered review evidence.

## Current Goal

Build and evaluate a local end-to-end Deforum effect prototype that lets Etienne tune Deforum-style image morph presets, render comparison passes locally, and review/export results without editing raw JSON by hand.

## Product Constraints

- The first screen is the tuning bench, not a landing page.
- The source canvas is `1680x720`, aspect ratio `7:3`.
- Do not assume `16:9` or crop away panoramic edges.
- Keep images, prompts, presets, models, and generated outputs local.
- Do not hardcode production show-control addresses, credentials, final model paths, or IPs.
- Treat the app as a prototype workbench, not the final production renderer.

## Tech Stack

- React + Vite.
- Named exports.
- Zustand for shared preset, timeline, queue, and take state.
- CSS Modules plus `src/styles/tokens.css`.
- Vitest for unit/contract tests.
- Playwright CLI for E2E smoke tests.

## Important Files

- `docs/deforum-control-ui-prd-spec.md`: source PRD/spec.
- `config/model-options.json`: canonical model profile matrix.
- `src/config/defaultPreset.js`: default exportable preset and seeded source assets.
- `src/services/presetSchema.js`: export validation rules.
- `src/services/renderAdapter.js`: render adapter boundary.
- `src/services/mockRenderAdapter.js`: deterministic mock render path.
- `src/services/a1111DeforumAdapter.js`: local Automatic1111 Deforum preset translator.
- `render-tools/`: ignored local backend runtime folder containing Automatic1111, Deforum, FFmpeg, checkpoints, venv, and generated render outputs.
- `src/components/workbench/`: reviewer workbench UI.
- `docs/local-render-setup.md`: verified local backend setup notes.
- `docs/todo.md`: canonical next-step checklist.
- `docs/decisions.md`: implementation and project decisions.
- `docs/evals/`: evaluation reports.

## Verification

Run:

```bash
pnpm install
pnpm build
pnpm test
pnpm exec playwright test
git diff --check
```

The Playwright smoke test starts the Vite dev server if `http://127.0.0.1:5173/` is not already reachable.

Start the backend from this repo before running the real Automatic1111/Deforum path:

```bash
cd render-tools/stable-diffusion-webui
./webui-user.bat
```

Then run:

```bash
RUN_REAL_DEFORUM=1 pnpm exec playwright test
```

## Current Known Gap

The current real backend path is a local Automatic1111 Deforum preset translator backed by the in-repo ignored `render-tools/` runtime. Runtime comparison is proven for SD 1.5, RealVisXL V5.0, and Juggernaut XL v9, but the adapter still needs output artifact validation and SDXL Base/SDXL Refiner compatibility investigation. A full production-grade Deforum preset exporter is still future work.

Use `docs/todo.md` for the active next-step list.
