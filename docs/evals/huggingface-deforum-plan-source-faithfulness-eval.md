# Eval: Hugging Face Deforum Plan Source Faithfulness

Date: 2026-05-18  
Artifact scope: image-keyframe default UI update, approved Hugging Face Deforum backend plan, context files, adapter contract, PRD, decisions, todo list  
Evaluator: Codex  
Status: Pass with caveats

## Eval Methodology

- Applied the KR+D AI eval workflow from `docs/evals/AI-Evals-Research-Report.md` in the parent KR+D repo.
- Checked local source files, docs, and tests for claims about default source images, Deforum backend behaviour, Hugging Face scope, and credential handling.
- Verified current Hugging Face documentation pages referenced by the plan:
  - `https://huggingface.co/docs/inference-providers/index`
  - `https://huggingface.co/docs/inference-providers/en/tasks/text-to-video`
  - `https://huggingface.co/docs/huggingface_hub/main/guides/inference`
  - `https://discuss.huggingface.co/t/image-to-image-stable-diffusion-inference-endpoint/24438`
- Ran deterministic checks:
  - `find assets/images/source -type f -name '*.png' | wc -l`
  - `rg -n "Deforum CLI|generic text-to-video|prompt-only|Hugging Face|Inference Endpoint|Space/API|HF_TOKEN|approved direction|image-keyframe" README.md docs src tests`
  - `pnpm test`
  - `pnpm build`
  - `pnpm exec playwright test`
  - `git diff --check`

## Criteria

| Area | Result |
|---|---|
| Source faithfulness | Pass. Hugging Face capability claims are limited to provider support for image/video tasks, text-to-video being prompt-led, endpoint/client usage, and custom-handler planning as a proposed implementation path. |
| Hallucination / invented fragments | Pass with caveat. No unsupported implemented capability is claimed. The plan clearly labels Hugging Face as approved direction and future implementation, not as an existing working backend. |
| UI/config usefulness | Pass. The default preset now loads all 24 bundled PNGs and maps them into image-reference timeline keyframes. |
| Deforum scope control | Pass. Docs repeatedly reject generic prompt-only text-to-video as an acceptable substitute for the Deforum-like image-keyframe workflow. |
| Credential safety | Pass. Plan requires a proxy and states `HF_TOKEN` must not be exposed in browser JavaScript or committed files. |
| 1680x720 handling | Pass. The source asset count is 24 PNGs, and the preset/tests continue to preserve the 7:3 source contract. |
| Context freshness | Pass. `docs/ai-context.md`, PRD, decisions, todo, README, and render adapter contract now point to the approved Hugging Face Deforum direction. |
| Verification | Pass. Unit tests, build, Playwright smoke, and whitespace checks pass. |

## Results

Deterministic checks:

- Source asset count: `24` PNG files under `assets/images/source/`.
- `pnpm test`: passed, 3 test files, 8 tests.
- `pnpm build`: passed.
- `pnpm exec playwright test`: passed, 1 test.
- `git diff --check`: passed.

Source-backed claims:

- Hugging Face Inference Providers support image and video generation task categories through client SDKs and providers.
- Hugging Face text-to-video is prompt-led by default, so it is not enough by itself for this prototype's frame-keyed source-image workflow.
- Hugging Face InferenceClient can call dedicated endpoint URLs, which supports the planned private endpoint/proxy direction.
- Custom diffusion/image-to-image endpoint behaviour may require a custom handler or wrapper; this is treated as a future implementation task, not an existing repo feature.

Local source-backed implementation state:

- `src/config/defaultPreset.js` now uses `import.meta.glob('../../assets/images/source/**/*.png')` so the default asset list follows the bundled source folder instead of a hand-picked subset.
- `src/config/defaultPreset.js` maps each enabled source image into a default timeline segment with an image-reference prompt.
- `src/components/workbench/TimelineStrip.jsx` adds an explicit `Image reference` dropdown for selected timeline segments.
- `src/components/workbench/Workbench.module.css` constrains overflow so the longer image-keyframe timeline does not cover the control panel.
- `docs/huggingface-deforum-backend-plan.md` is marked as an approved implementation plan, not completed work.

Hallucination check:

- No committed file claims the Hugging Face endpoint, proxy, or `huggingface-deforum` adapter already exists.
- No committed file claims stock text-to-video can satisfy the Deforum requirement.
- The previously over-specific phrase `Deforum CLI code` was removed and replaced with the more accurate `Deforum-compatible render path`.
- `docs/ai-context.md` now explicitly states that the Hugging Face path is approved as a plan only and has not been implemented.

## Weaknesses

- The Hugging Face implementation remains unproven until an actual endpoint or private Space/API is created and tested with the same image-keyframe preset.
- The custom-handler path is plausible and planned, but the exact Hugging Face deployment shape needs implementation-time verification against the selected runtime.
- No remote render artifact exists yet, so MP4 output for `huggingface-deforum` is an acceptance requirement rather than evidence.
- The local A1111 adapter still lacks artifact validation, so successful API completion can still differ from successful MP4/frame creation.

## Recommended Improvements

- Implement the Hugging Face path behind a credential-safe proxy before exposing it as an enabled UI option.
- Add a backend capability response so the UI can show whether the remote endpoint supports depth warp, sampler mapping, checkpoint selection, image keyframes, and MP4 output.
- Add artifact validation to both local A1111 and future Hugging Face adapters before marking a take complete.
- Run a side-by-side eval against the same preset, seed, preview size, source images, and model where feasible once the Hugging Face backend exists.

## Revised Notes

- The approved architecture is: simplified UI preset -> backend-specific Deforum translator -> MP4 output plus settings/take metadata.
- Local Automatic1111 remains the verified baseline and fallback.
- Hugging Face is approved only as `huggingface-deforum`, a future Deforum-compatible remote backend. It is not a generic text-to-video shortcut.
