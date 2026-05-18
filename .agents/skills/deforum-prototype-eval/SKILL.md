---
name: deforum-prototype-eval
description: >
  Evaluate the NMS-SHG Deforum Control UI prototype, including PRD/spec updates,
  Windows setup guidance, model fallback configuration, source asset handling,
  rendered preview evidence, and AI-assisted implementation changes. Use this
  skill whenever a user asks to run eval, audit quality, review generated output,
  compare Deforum model results, or check whether prototype changes are ready for
  review, commit, or handoff.
---

# Deforum Prototype Eval

Use this skill to evaluate changes in the Deforum Control UI prototype before they
are treated as ready for review or handoff.

## Scope

Evaluate artifacts in this repo:

- `docs/deforum-control-ui-prd-spec.md`
- `docs/windows-setup.md`
- `docs/source-assets.md`
- `docs/model-options.md`
- `config/model-options.json`
- `assets/images/source/`
- rendered preview evidence, when available
- implementation files, once the app scaffold exists

Save eval reports under:

```text
docs/evals/
```

## Required Source Checks

Before scoring, inspect the current repo state:

```bash
git status -sb
find assets/images/source -type f
jq . config/model-options.json
```

For model-related changes, verify current model metadata from primary sources
where possible:

- Hugging Face model page/API for repository, file name, and licence.
- Model card notes for usage restrictions.
- Local docs for prototype-only or production-review caveats.

Do not claim a model is production-approved unless a project decision explicitly
records that approval.

## Deterministic Checks

Run these checks when applicable:

```bash
git diff --check
jq . config/model-options.json
find assets/images/source -type f -iname '*.png' -print0 | xargs -0 sips -g pixelWidth -g pixelHeight
```

Expected asset baseline:

- PNG source images live under `assets/images/source/`.
- Exercise source images are `1680x720`.
- The UI/spec preserves the `7:3` source canvas.
- Generated videos, checkpoints, and temporary render outputs are not committed.

## Contextual Review Rubric

Score each area as `Pass`, `Pass with caveat`, or `Fail`.

| Area | What To Check |
|---|---|
| Source faithfulness | Claims are grounded in repo files, supplied assets, model sources, or explicit assumptions. |
| Scope control | The update stays prototype-focused and does not imply final production integration. |
| UI/config usefulness | Future implementation can turn the spec into controls without guessing. |
| Model comparison | Model metadata, licence notes, and comparison rubric are present for each option. |
| 1680x720 handling | Source canvas, preview sizes, and Deforum fallback sizes remain consistent. |
| Windows setup | Setup steps are executable on the target Windows PC and avoid secrets in docs. |
| Evidence quality | Rendered preview claims are backed by files, metadata, or screenshots/contact sheets. |

## Report Template

Use this structure for eval reports:

```markdown
# Eval: [Artifact Or Change Name]

Date: YYYY-MM-DD
Artifact scope:
Evaluator:
Status:

## Eval Methodology

## Criteria

## Results

## Weaknesses

## Recommended Improvements

## Revised Notes
```

## Render Output Review

When actual Deforum preview clips exist, include:

- source image set used;
- model profile;
- checkpoint file;
- prompt schedule;
- seed;
- preview resolution;
- render duration;
- output path;
- short qualitative judgement.

Use the model comparison criteria from `docs/model-options.md`:

- composition stability;
- source identity retention;
- morph smoothness;
- Future Wall fit;
- architecture detail;
- render speed;
- production viability.

## Completion Rule

An eval is complete only when:

- deterministic checks have run or blockers are stated;
- contextual criteria have pass/caveat/fail results;
- unsupported claims are labelled as assumptions;
- production-use caveats are explicit;
- the report is saved in `docs/evals/`.
