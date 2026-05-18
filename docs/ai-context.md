# AI Contributor Context

Status: canonical context  
Last updated: 2026-05-18

This repository contains the whole local Deforum effect prototype for NMS-SHG Conclusion Space creative tuning, including the React/Vite workbench, source assets, preset/export logic, local Automatic1111 Deforum runtime under `render-tools/`, model matrix, and rendered review evidence.

## Current Goal

Build and evaluate a local end-to-end Deforum effect prototype that lets Etienne tune Deforum-style image morph presets, render comparison passes locally, and review/export results without editing raw JSON by hand. The current UI default is image-reference led: all bundled 1680x720 source PNGs are loaded into the asset rail and mapped into the default timeline as image keyframes.

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
- Zustand for shared preset, timeline, queue, and take state.
- CSS Modules plus `src/styles/tokens.css`.
- Vitest for unit/contract tests.
- Playwright CLI for E2E smoke tests.

## Important Files

- `docs/deforum-control-ui-prd-spec.md`: source PRD/spec.
- `config/model-options.json`: canonical model profile matrix.
- `src/config/defaultPreset.js`: default exportable preset, all bundled source assets, and image-keyframe default timeline.
- `src/services/presetSchema.js`: export validation rules.
- `src/services/renderAdapter.js`: render adapter boundary.
- `src/services/mockRenderAdapter.js`: deterministic mock render path.
- `src/services/a1111DeforumAdapter.js`: local Automatic1111 Deforum preset translator.
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

The current verified real backend path is a local Automatic1111 Deforum preset translator backed by the in-repo ignored `render-tools/` runtime. Runtime comparison is proven for SD 1.5, RealVisXL V5.0, and Juggernaut XL v9, but the adapter still needs output artifact validation and SDXL Base/SDXL Refiner compatibility investigation. The Hugging Face path now has a local proxy and frontend adapter, but no remote endpoint/Space runtime has been verified yet. A full production-grade Deforum preset exporter is still future work.

Use `docs/todo.md` for the active next-step list.
