# Eval: Dev Backend Startup

Date: 2026-05-19
Artifact scope: `pnpm dev` startup flow, Vite proxy configuration, Playwright dev-server startup, README/local setup docs
Evaluator: Codex
Status: Pass with caveat

## Eval Methodology

- Reviewed existing run instructions in `README.md`, `docs/local-render-setup.md`, `docs/windows-setup.md`, and `docs/ai-context.md`.
- Added `scripts/dev-with-backend.mjs` to check or start the local Automatic1111 Deforum backend before Vite starts.
- Updated `package.json` so `pnpm dev` runs the backend-aware launcher and `pnpm dev:ui` remains available for frontend-only development.
- Updated Vite proxy configuration to read `A1111_BASE_URL`, defaulting to `http://127.0.0.1:7860`.
- Updated Playwright smoke startup to use `pnpm dev:ui` so regular UI tests do not boot the GPU backend.
- Ran deterministic and app checks.

## Criteria

| Area | Result | Notes |
|---|---|---|
| Source faithfulness | Pass | The launcher targets the documented project-local `render-tools/stable-diffusion-webui/webui-user.bat` path and existing A1111 API endpoints. |
| Scope control | Pass | This only changes local development startup; it does not imply production renderer readiness. |
| UI/config usefulness | Pass | `pnpm dev` now ensures A1111 is ready and sets `VITE_SOURCE_ASSET_ROOT` before starting Vite. |
| Model comparison | Not applicable | No model metadata or comparison behavior changed. |
| 1680x720 handling | Pass | Source assets remain unchanged and all checked PNGs are still `1680x720`. |
| Windows setup | Pass with caveat | The launcher is Windows-oriented because the verified backend uses `webui-user.bat`. |
| Evidence quality | Pass with caveat | Syntax, build, unit tests, Playwright smoke, JSON parse, whitespace, and asset dimensions passed. The full `pnpm dev` backend boot was not run to avoid starting the long-running GPU runtime during this check. |

## Results

- `pnpm dev` now:
  - checks `/deforum/api_version` and `/sdapi/v1/sd-models`;
  - starts `render-tools\stable-diffusion-webui\webui-user.bat` if A1111 is not already running;
  - writes backend logs to `outputs\logs\a1111-dev-backend.log`;
  - sets `VITE_SOURCE_ASSET_ROOT` to `assets\images\source` when not already set;
  - starts Vite after the backend is ready.
- `pnpm dev:ui` preserves the previous frontend-only Vite startup path.
- `A1111_BASE_URL`, `A1111_START_TIMEOUT_MS`, and `SKIP_A1111_START` provide local overrides for non-default setups.
- Playwright smoke tests now start `pnpm dev:ui` to avoid accidentally launching the backend during ordinary frontend checks.

## Weaknesses

- The new launcher does not prove MP4/frame artifact creation; that remains part of the existing real-render artifact validation gap.
- The full backend-aware `pnpm dev` command was not executed in this eval because it can start a long-running GPU backend process.
- Hugging Face remote runtime startup is not handled here; the local Hugging Face proxy is still part of Vite and still requires a configured remote endpoint.

## Recommended Improvements

- Add a short real-backend startup smoke check once the local machine is ready to boot A1111 during verification.
- Pair this with output artifact validation so real render completion means a verified MP4 or frame sequence exists.
- Consider adding a `pnpm backend:status` command if backend health checks become a frequent operator task.

## Revised Notes

The UI startup path is now safer for local reviewer use: `pnpm dev` waits for the local Deforum backend before exposing the UI. Use `pnpm dev:ui` for fast frontend-only development and Playwright smoke tests.
