# AI Contributor Context

Status: canonical context  
Last updated: 2026-05-19

This repository contains the whole local Deforum effect prototype for NMS-SHG Conclusion Space creative tuning, including the React/Vite workbench, source assets, preset/export logic, local Automatic1111 Deforum runtime under `render-tools/`, model matrix, and rendered review evidence.

## Current Goal

Build and evaluate a local end-to-end Deforum effect prototype that lets Etienne tune Deforum-style image morph presets, render comparison passes locally, and review/export results without editing raw JSON by hand. The current UI default is image-reference led: RealVisXL V5.0 is the default model profile, and the first 8 bundled 1680x720 source PNGs from `assets/images/source/**/*.png` are shown through frame-keyed Prompt JSON Nodes, with the approved creative direction and source-asset-specific negative prompt applied by default on every node, and exported as Deforum-compatible prompt schedules.

## Product Constraints

- The first screen is the tuning bench, not a landing page.
- The source canvas is `1680x720`, aspect ratio `7:3`.
- Do not assume `16:9` or crop away panoramic edges.
- Keep images, prompts, presets, models, and generated outputs local.
- Keep generated logs and output evidence inside this project folder: app/run logs under `outputs/logs/`, exports under `outputs/exports/`, previews under `outputs/previews/`, and Automatic1111 artifacts under `render-tools/stable-diffusion-webui/outputs/`.
- Keep `render-tools/` outside the React/Vite frontend graph. It is ignored by Git and denied/ignored in Vite config so Gradio runtime assets are not parsed as app source.
- Do not hardcode production show-control addresses, credentials, final model paths, or IPs.
- Treat the app as a prototype workbench, not the final production renderer.
- The approved Hugging Face direction is optional `huggingface-deforum`: a credential-safe Deforum-compatible backend that consumes the same simplified image-keyframe preset contract. Do not replace it with generic prompt-only text-to-video. The local proxy, frontend adapter, and private Docker Space endpoint exist; the deployed Space currently runs smoke fallback mode until it can reach a remote A1111 Deforum backend through `HF_DEFORUM_A1111_BASE_URL`.

## Tech Stack

- React + Vite.
- Named exports.
- Zustand for shared preset, prompt-node, queue, and take state.
- CSS Modules plus `src/styles/tokens.css`.
- Vitest for unit/contract tests.
- Playwright CLI for E2E smoke tests.

## Important Files

- `docs/deforum-control-ui-prd-spec.md`: source PRD/spec.
- `config/model-options.json`: canonical model profile matrix; `realvisxl-v5` is the current default.
- `src/config/defaultPreset.js`: default exportable 8-image, 8-second, 60 fps preset with creative-direction prompt, source-asset-specific negative prompt, and image-keyframe node defaults.
- `src/config/creativePromptGuides.js`: legacy creative director prompt guide definitions retained for older saved presets and adapter compatibility.
- `src/services/startupHealth.js`: startup readiness checks for Vite, Local A1111 Deforum, and the Hugging Face proxy.
- `src/services/backendStatus.js`: persistent toolbar backend status checks for Local A1111 and Hugging Face.
- `src/components/workbench/StartupScreen.jsx`: boot/loading screen shown while startup checks run.
- `src/components/workbench/PromptNodesPanel.jsx`: frame-keyed prompt JSON node editor.
- `src/components/workbench/PreviewPanel.jsx`: centre preview surface for source-frame review and playable real render output.
- `src/services/presetSchema.js`: export validation rules.
- `src/services/renderAdapter.js`: render adapter boundary.
- `src/services/mockRenderAdapter.js`: deterministic mock render path.
- `src/services/a1111DeforumAdapter.js`: local Automatic1111 Deforum preset translator.
- `server/a1111DeforumProxy.js`: local body bridge for A1111 Deforum render submission; avoids browser query-string 431 failures and submits Deforum batch jobs with `options_overrides`.
- `server/renderArtifactProxy.js`: safe local artifact bridge for project output videos and generated render files.
- `src/services/huggingFaceDeforumAdapter.js`: Hugging Face Deforum payload builder and proxy-backed job adapter.
- `server/hfDeforumProxy.js`: local Vite middleware proxy for Hugging Face credentials, image attachment, job submit/poll, and artifact download.
- `remote/huggingface-deforum-handler/`: private Docker Space/API runtime for the optional Hugging Face Deforum backend.
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

The current verified real backend path is a local Automatic1111 Deforum preset translator backed by the in-repo ignored `render-tools/` runtime. Runtime comparison is proven for SD 1.5, RealVisXL V5.0, and Juggernaut XL v9, and RealVisXL V5.0 is now the default model profile for new presets. The adapter now requires a non-empty MP4 artifact before reporting a real A1111 job as complete; settings-only Deforum outputs are treated as failed/incomplete renders. The local A1111 payload includes Deforum batch `options_overrides`, legacy prompt/scale fields, disabled ControlNet defaults, compact per-keyframe prompts, shared creative direction in `animation_prompts_positive`, and native `animation_prompts_negative` values instead of repeating a long inline `--neg` block in every local Deforum scheduled prompt. The default source preset now prioritizes source-frame retention over generative drift and the right-side Deforum controls show those values on page load: each node labels its selected image as the required keyframe target, default denoise/noise are lowered, source image strength and structural lock are raised, 3D/depth warp is disabled, zoom/pan drift is removed, `locked-source-morph` is the default camera path, and the tween span is lengthened for an 8-image, 8-second, 60 fps review pass. The latest E2E eval shows the UI/default-model path works, but the live Deforum looper/batch path still rejects the default 8-image guided schedule with `Invalid arguments` during `PREPARING`; a 2-image guided repro reaches `GENERATING`, while 3+ guided images fail preparation in the current backend session. A later stale-session SD 1.5 render did create an MP4, but its output drifted into abstract outlined mosaic imagery because it used the older inline prompt schedule, 3D depth warp, higher denoise/noise, and camera drift settings; do not treat that clip as evidence for the current RealVisXL source-faithful defaults. The target Windows setup should install ControlNet even when the default prototype render keeps it disabled. SDXL Base/SDXL Refiner compatibility still needs investigation. The Hugging Face path now has a local proxy, frontend adapter, and deployed private Space smoke endpoint, but no remote real Deforum MP4 render has been verified yet. A full production-grade Deforum preset exporter is still future work.

Use `docs/todo.md` for the active next-step list.
