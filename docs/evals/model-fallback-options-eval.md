# Eval: Deforum Model Fallback Options

Date: 2026-05-17  
Artifact scope: `config/model-options.json`, `docs/model-options.md`, `docs/deforum-control-ui-prd-spec.md`, `docs/windows-setup.md`, `README.md`  
Evaluator: Codex using KR+D AI eval workflow  
Status: Pass with production-use caveats

## Eval Methodology

This eval follows the KR+D AI eval directive pattern:

- deterministic checks for required files, JSON validity, required model metadata, setup instructions, and formatting;
- source-grounding checks against primary model pages/API metadata;
- contextual judgement for whether the model matrix is useful for Etienne's Deforum-style 1680x720 comparison workflow;
- scope-control checks to ensure the update does not imply production approval or ship model binaries.

No render-quality judgement was made because no model downloads or output renders were run in this pass. Visual quality must be evaluated later from actual preview clips.

## Criteria

| ID | Criterion | Type | Pass Target |
|---|---|---|---|
| C1 | Model choices are source-grounded | Deterministic/source | Each option has repository, file, licence, status, and source URL. |
| C2 | UI/config contract supports model comparison | Deterministic | Model profile is a config-driven Generation control and exported presets/takes keep model metadata. |
| C3 | Windows setup is actionable | Deterministic | Includes download folder, Hugging Face CLI setup, commands, restart/check steps, and licence caution. |
| C4 | 1680x720 exercise constraints are preserved | Deterministic/contextual | Model setup does not regress the 7:3 source canvas constraints. |
| C5 | Scope and risk are controlled | Contextual | Prototype-only, licence-review, and no-model-binaries guardrails remain explicit. |
| C6 | Implementation usefulness | Contextual | A future developer can add the dropdown and comparison workflow without guessing model names or metadata. |

## Results

| Criterion | Result | Evidence |
|---|---|---|
| C1 | Pass | `config/model-options.json` includes five model profiles with repository, checkpoint file, licence, status, intended use, expected strength, and risk. Source links are listed in `docs/model-options.md`. |
| C2 | Pass | `docs/deforum-control-ui-prd-spec.md` adds FR-14 and FR-15, the config contract includes a `model` block, and task updates require the Generation model dropdown and take metadata. |
| C3 | Pass | `docs/windows-setup.md` adds Hugging Face CLI install/login, exact download commands, model folder path, restart check, and setup checklist items. |
| C4 | Pass | Existing `1680x720` / `7:3` guidance remains in the PRD/spec, source-assets doc, and first-test settings; model preview options still use `896x384` and `1344x576`. |
| C5 | Pass with caveat | Model files remain ignored by Git; `juggernaut-xl-v9` is labelled prototype-only until licence review; docs warn not to store model files or credentials in repo. |
| C6 | Pass | `config/model-options.json` is machine-readable and `docs/model-options.md` defines the comparison rubric and workflow. |

## Weaknesses

- No actual preview renders were produced, so the model ranking is a test matrix rather than evidence of best output quality.
- Some model downloads may require manual Hugging Face terms acceptance and a valid token.
- `juggernaut-xl-v9` has model-card business/API-use restrictions; it is useful for visual comparison but should not be treated as production-approved.
- Backend compatibility can vary between Automatic1111, Forge, ComfyUI, and Deforum versions, especially for SDXL/refiner workflows.

## Recommended Improvements

1. Render the same 5-10 second preset through `sd15-baseline` and `sdxl-base` first.
2. Promote only promising outputs to `realvisxl-v5` and `juggernaut-xl-v9`.
3. Capture per-take metadata: model ID, checkpoint file, seed, prompt schedule, preview size, render time, VRAM notes, and output path.
4. Add screenshot/contact-sheet evidence to a future eval report after real renders exist.
5. Get explicit production licence approval before using any community fine-tuned checkpoint in final delivery.

## Revised Notes

The model fallback update is appropriate for prototype planning and setup. It should be considered complete for documentation/config purposes, but not complete as a visual-quality decision until Etienne reviews rendered clips from the actual target machine.
