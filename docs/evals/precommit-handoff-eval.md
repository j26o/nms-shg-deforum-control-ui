# Eval: Precommit Handoff Audit

Date: 2026-05-18
Artifact scope: Repository documentation, context files, todo list, UI scaffold, and local backend integration notes
Evaluator: Codex using `deforum-prototype-eval`
Status: Pass with caveats

## Eval Methodology

Checked the repository for stale or unsupported claims before committing and pushing.

Deterministic checks run:

- `git status -sb`
- `git remote -v`
- `pnpm build`
- `pnpm test`
- `pnpm exec playwright test --reporter=list`
- `$env:RUN_REAL_DEFORUM='1'; pnpm exec playwright test --reporter=list`
- `git diff --check`
- `Invoke-RestMethod http://127.0.0.1:7860/deforum/api_version`
- file existence checks for the SD 1.5 checkpoint and verified Deforum smoke MP4
- text audit with `rg` for stale scaffold-only phrases and production-approval claims

## Criteria

| Area | Result |
|---|---|
| Source faithfulness | Pass |
| Scope control | Pass |
| UI/config usefulness | Pass |
| Model comparison | Pass with caveat |
| 1680x720 handling | Pass |
| Windows setup | Pass |
| Evidence quality | Pass with caveat |

## Results

The shared assistant context now points to `docs/ai-context.md`, with active next steps in `docs/todo.md` and decisions in `docs/decisions.md`. `AGENTS.md`, `CLAUDE.md`, and `GEMINI.md` intentionally avoid duplicated project instructions.

Outdated scaffold-only claims were revised. The repo now consistently states that:

- the default preview path is mock metadata;
- the first real backend path is Automatic1111 Deforum;
- the real backend path is currently a smoke adapter, not a full preset translator;
- a tiny 4-frame Deforum smoke render succeeded;
- no 5-10 second review-sized render has been completed yet;
- no model is claimed as production-approved without review.

## Weaknesses

- `sdxl-base` and other comparison checkpoints are not downloaded yet.
- The real backend adapter does not yet map the full exported preset contract into Deforum settings.
- The verified backend video is a tiny smoke render, not a creative-review render.

## Recommended Improvements

- Work from `docs/todo.md`.
- Prioritize the full preset-to-Deforum mapping and the first `896x384`, 5-10 second source-image render.
- Add adapter translation unit tests before broadening backend behavior.

## Revised Notes

The repository is ready for the initial commit and push. Remaining caveats are explicit and not represented as completed work.
