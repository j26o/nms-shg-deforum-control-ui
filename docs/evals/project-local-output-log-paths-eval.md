# Eval: Project-Local Output And Log Paths

Date: 2026-05-18
Artifact scope: `outputs/` folder contract, generated log handling, Automatic1111 output location, docs/context references
Evaluator: Codex
Status: Pass

## Eval Methodology

- Searched tracked project files for stale external runtime roots and output/log references.
- Verified `outputs/README.md`, `outputs/logs/`, `outputs/previews/`, and `outputs/exports/` exist under the project root.
- Moved existing dev-server logs from project-root `outputs/` into `outputs/logs/`.
- Updated `.gitignore` so generated log/output contents are ignored while the output folder structure and README remain tracked.
- Confirmed a representative Automatic1111 MP4 remains ignored under `render-tools/stable-diffusion-webui/outputs/`.
- Confirmed docs and context files now state that logs and output evidence stay inside this project folder.

## Criteria

| Area | Result |
|---|---|
| Source faithfulness | Pass. Claims are based on local file checks, `rg`, `git status`, and `git check-ignore`. |
| Scope control | Pass. The update only changes output/log location policy and docs. |
| UI/config usefulness | Pass. The workbench default output folder remains project-local at `outputs/previews`. |
| Model comparison | Pass with caveat. Existing render evidence remains under project-local `render-tools/stable-diffusion-webui/outputs/`; model behavior was not retested in this eval. |
| 1680x720 handling | Pass with caveat. This change does not alter source assets or render dimensions. |
| Windows setup | Pass. Setup now creates `outputs/logs`, `outputs/previews`, and `outputs/exports` in the project folder. |
| Evidence quality | Pass. Generated logs and render outputs are project-local and ignored from Git; tracked README/gitkeep files document the expected structure. |

## Results

Tracked project-local output contract:

- `outputs/README.md`
- `outputs/logs/.gitkeep`
- `outputs/previews/.gitkeep`
- `outputs/exports/.gitkeep`

Ignored generated local files:

- `outputs/logs/dev-server.out.log`
- `outputs/logs/dev-server.err.log`
- `render-tools/stable-diffusion-webui/outputs/img2img-images/6ab04b53915a489d9ce7c61be3b7bc36/20260518210954.mp4`

Reference checks:

- No tracked files contain the previous external `D:\NMS-SHG` runtime root.
- `README.md`, `docs/ai-context.md`, `docs/local-render-setup.md`, `docs/windows-setup.md`, and `outputs/README.md` define project-local output/log locations.
- The local output policy is now: app/run logs under `outputs/logs/`, lightweight previews under `outputs/previews/`, exports under `outputs/exports/`, and Automatic1111 render artifacts under `render-tools/stable-diffusion-webui/outputs/`.

## Weaknesses

- This does not add automatic log writing for every future command; it defines and verifies the project-local destinations.
- `render-tools/` and generated output contents remain ignored, so Git tracks the folder policy and eval evidence, not the large generated files themselves.

## Recommended Improvements

- When adding scripts for backend startup or E2E runs, redirect stdout/stderr to `outputs/logs/`.
- Add artifact validation to the real render adapter so take metadata can point to verified project-local MP4/settings files.

## Revised Notes

- Generated output logs should stay inside this repository folder, not in external project folders.
- The tracked files document the folder structure; generated logs and videos remain local and ignored.
