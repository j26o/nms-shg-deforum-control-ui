# Eval: Prototype Readiness Gap Check

Date: 2026-05-19
Artifact scope: React/Vite workbench, docs, model config, source assets, adapter contracts, current verification path
Evaluator: Codex
Status: Pass with caveats

## Eval Methodology

- Read `docs/ai-context.md`, `docs/todo.md`, `docs/decisions.md`, `docs/deforum-control-ui-prd-spec.md`, `docs/model-options.md`, and current implementation files under `src/`, `server/`, and `tests/`.
- Checked repo state with `git status -sb`.
- Ran deterministic checks:
  - `git diff --check`
  - `jq . config/model-options.json` attempted, but `jq` is not installed in this Windows environment.
  - `node -e "JSON.parse(...)"` used as the JSON validation fallback.
  - PowerShell/.NET image dimension check for all `assets/images/source/**/*.png`.
- Ran verification:
  - `pnpm test`
  - `pnpm build`
  - `pnpm exec playwright test`

## Criteria

| Area | Result | Notes |
|---|---|---|
| Source faithfulness | Pass | Remaining claims are grounded in current docs, implementation, tests, and existing eval evidence. |
| Scope control | Pass | The repo still frames the app as a prototype workbench, not the final production renderer. |
| UI/config usefulness | Pass with caveat | The main workbench now uses Prompt JSON Nodes as the left workflow rail, with folder-discovered source images, node thumbnails, 7:3 preview, controls, backend selector, render feedback, takes, and exports. Caveats: review polish and stronger workflow tests remain. |
| Model comparison | Pass with caveat | SD 1.5, RealVisXL V5.0, and Juggernaut XL v9 have comparison evidence. SDXL Base and SDXL Refiner still need backend compatibility investigation. |
| 1680x720 handling | Pass | All 24 source PNGs checked as `1680x720`; default preset and schema preserve `7:3`. |
| Windows setup | Pass with caveat | Standard app verification works on Windows. Real backend setup remains dependent on the local ignored `render-tools/` runtime. |
| Evidence quality | Pass with caveat | Mock/UI verification is current. Real backend evidence exists from prior evals, but the adapter still trusts backend completion without validating MP4/frame artifacts. |

## Results

- Working baseline is healthy: valid model JSON fallback parse, clean whitespace check, 24 source PNGs at `1680x720`, 13 Vitest tests passing, production build passing, and 1 Playwright smoke test passing.
- The prototype already covers the main PRD surface: Prompt JSON Nodes, image-keyframe selection from folder-discovered source assets, creative-director prompt guides, frame/key prompt editing, dense control panel, model profile selection, local A1111 render action, optional Hugging Face adapter path, render progress feedback, take metadata, candidate marking, and JSON/report/settings exports.
- The most important remaining blocker is artifact validation. A real backend job should not become a successful take until the app confirms a non-empty MP4 or generated frames/settings file exist.
- The second major blocker is SDXL compatibility. Existing evidence says SDXL Base and SDXL Refiner load in Automatic1111 but produce settings without frames or MP4 through the current Deforum path.
- The third major blocker is the unimplemented remote Hugging Face runtime. The local proxy and frontend adapter exist, but `HF_DEFORUM_ENDPOINT_URL` still needs a real Deforum-compatible endpoint or private Space/API.
- The real-backend Playwright path still needs a controlled server environment, a longer timeout, and artifact assertions so it tests completed render output instead of only backend reachability.

## Weaknesses

- The local A1111 adapter infers output path patterns from the backend response but does not check the filesystem for actual MP4/frame output before returning `complete`.
- The Hugging Face adapter can poll and normalize remote job results, but no real endpoint has been verified against the image-keyframe preset contract.
- `tests/deforum-control-ui.spec.ts` is a useful smoke test, not a full workflow regression suite. It does not assert downloaded export payload contents, real artifact existence, timeline reorder/delete behavior, or backend failure states.
- `docs/deforum-control-ui-prd-spec.md` still has unchecked "Done" criteria even where implementation and verification now appear complete. That can confuse handoff status.
- The source rail was removed in favour of Prompt JSON Nodes; future workflow tests should focus on node image selection, guide application, and exported prompt payloads.
- Production readiness remains intentionally unapproved for model/licence choices, especially Juggernaut XL v9 and any remote Hugging Face deployment.

## Recommended Improvements

1. Add output artifact validation in the real render path.
   - Validate local A1111 output directories for at least one nonzero MP4 or generated frame sequence.
   - Store verified artifact paths and file metadata in the take.
   - Mark jobs failed when the backend returns an output folder without render artifacts.

2. Fix the real-backend Playwright path.
   - Start Vite with known `VITE_SOURCE_ASSET_ROOT` and backend env.
   - Wait for review-length renders long enough or use a shorter deterministic real-backend fixture.
   - Assert artifact existence, not only a visible `stable-diffusion-webui` path.

3. Investigate SDXL Base and SDXL Refiner Deforum failure mode.
   - Use a minimal direct Deforum API payload.
   - Capture Automatic1111 console logs.
   - Decide whether SDXL needs model-specific settings, a different backend, or should be hidden from reviewer comparison until fixed.

4. Decide the ControlNet/no-ControlNet path.
   - Either document the current no-ControlNet Deforum API patches as the expected local setup or install ControlNet and retest source-locking behavior.

5. Complete the optional Hugging Face backend only if it can produce the same Deforum-compatible output.
   - Provide `HF_DEFORUM_ENDPOINT_URL`.
   - Verify MP4 output with the same preset, seed, source images, and preview resolution.
   - Add a Hugging Face vs local A1111 eval after the first remote artifact exists.

6. Tighten reviewer polish and handoff docs.
   - Update PRD "Done" checklist status or move completion tracking into `docs/todo.md`.
   - Expand Playwright coverage for export payloads, prompt node editing, backend errors, and candidate take export.

## Revised Notes

The prototype is ready for continued internal tuning and mock-workflow review. It is not ready to be treated as a reliable render handoff tool until real backend artifact validation, SDXL compatibility decisions, and the real-backend Playwright path are fixed. The Hugging Face path should remain optional and labelled unverified until a dedicated endpoint or private Space/API produces MP4 artifacts from the same image-keyframe preset contract.
