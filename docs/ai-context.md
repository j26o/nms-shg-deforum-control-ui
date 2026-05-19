# AI Contributor Context

Status: canonical context  
Last updated: 2026-05-19

This repository contains the whole local Deforum effect prototype for NMS-SHG Conclusion Space creative tuning, including the React/Vite workbench, source assets, preset/export logic, local Automatic1111 Deforum runtime under `render-tools/`, model matrix, and rendered review evidence.

## Current Goal

Build and evaluate a local end-to-end Deforum effect prototype that lets Etienne tune Deforum-style image morph presets, render comparison passes locally, and review/export results without editing raw JSON by hand. The current UI default is image-reference led: all bundled 1680x720 source PNGs are read from `assets/images/source/**/*.png`, shown through frame-keyed Prompt JSON Nodes, and exported as Deforum-compatible prompt schedules.

## Product Constraints

- The first screen is the tuning bench, not a landing page.
- The source canvas is `1680x720`, aspect ratio `7:3`.
- Do not assume `16:9` or crop away panoramic edges.
- Keep images, prompts, presets, models, and generated outputs local.
- Keep generated logs and output evidence inside this project folder: app/run logs under `outputs/logs/`, exports under `outputs/exports/`, previews under `outputs/previews/`, and Automatic1111 artifacts under `render-tools/stable-diffusion-webui/outputs/`.
- Do not hardcode production show-control addresses, credentials, final model paths, or IPs.
- Treat the app as a prototype workbench, not the final production renderer.
- The approved Hugging Face direction is optional `huggingface-deforum`: a credential-safe Deforum-compatible backend that consumes the same simplified image-keyframe preset contract. Do not replace it with generic prompt-only text-to-video. The local proxy and frontend adapter exist; the remote endpoint/Space runtime still needs to be provided through `HF_DEFORUM_ENDPOINT_URL`.

## Tech Stack

- React + Vite.
- Named exports.
- Zustand for shared preset, prompt-node, queue, and take state.
- CSS Modules plus `src/styles/tokens.css`.
- Vitest for unit/contract tests.
- Playwright CLI for E2E smoke tests.

## Important Files

- `docs/deforum-control-ui-prd-spec.md`: source PRD/spec.
- `config/model-options.json`: canonical model profile matrix.
- `src/config/defaultPreset.js`: default exportable preset, all bundled source assets, and image-keyframe prompt node defaults.
- `src/config/creativePromptGuides.js`: creative director prompt guide presets and negative guardrails for per-node application.
- `src/services/startupHealth.js`: startup readiness checks for Vite, Local A1111 Deforum, and the Hugging Face proxy.
- `src/services/backendStatus.js`: persistent toolbar backend status checks for Local A1111 and Hugging Face.
- `src/components/workbench/StartupScreen.jsx`: boot/loading screen shown while startup checks run.
- `src/components/workbench/PromptNodesPanel.jsx`: frame-keyed prompt JSON node editor.
- `src/services/presetSchema.js`: export validation rules.
- `src/services/renderAdapter.js`: render adapter boundary.
- `src/services/mockRenderAdapter.js`: deterministic mock render path.
- `src/services/a1111DeforumAdapter.js`: local Automatic1111 Deforum preset translator.
- `server/a1111DeforumProxy.js`: local body bridge for A1111 Deforum render submission; avoids browser query-string 431 failures.
- `src/services/huggingFaceDeforumAdapter.js`: Hugging Face Deforum payload builder and proxy-backed job adapter.
- `server/hfDeforumProxy.js`: local Vite middleware proxy for Hugging Face credentials, image attachment, job submit/poll, and artifact download.
- `docs/huggingface-deforum-backend-plan.md`: approved plan for an optional Hugging Face Deforum-compatible endpoint/proxy path.
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

Start the normal local dev path from this repo:

```bash
pnpm dev
```

`pnpm dev` starts the React/Vite workbench only. It must not launch Stable Diffusion or Automatic1111.

Use the explicit backend-aware launcher only when a real local A1111 render path is needed:

```bash
pnpm dev:backend
```

`pnpm dev:backend` starts or verifies the local Automatic1111 Deforum backend before starting Vite.

Then run:

```bash
RUN_REAL_DEFORUM=1 pnpm exec playwright test
```

## Current Known Gap

The current verified real backend path is a local Automatic1111 Deforum preset translator backed by the in-repo ignored `render-tools/` runtime. Runtime comparison is proven for SD 1.5, RealVisXL V5.0, and Juggernaut XL v9, but the adapter still needs output artifact validation and SDXL Base/SDXL Refiner compatibility investigation. The Hugging Face path now has a local proxy and frontend adapter, but no remote endpoint/Space runtime has been verified yet. A full production-grade Deforum preset exporter is still future work.

Use `docs/todo.md` for the active next-step list.
