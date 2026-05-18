# Eval: Hugging Face Deforum Local Adapter

Date: 2026-05-18  
Artifact scope: `server/hfDeforumProxy.js`, `src/services/huggingFaceDeforumAdapter.js`, backend selector UI, tests, docs/context updates  
Evaluator: Codex  
Status: Pass with remote-runtime caveat

## Eval Methodology

- Verified the implementation keeps Hugging Face behind a local proxy and does not expose `HF_TOKEN` in browser code.
- Checked that the frontend adapter sends the simplified image-keyframe preset contract rather than Automatic1111-specific settings.
- Ran automated checks:
  - `pnpm test`
  - `pnpm build`
  - `pnpm exec playwright test`
  - `git diff --check`
- Ran a live proxy status smoke with `HF_TOKEN_NAME=nms-shg` and no `HF_DEFORUM_ENDPOINT_URL`.

## Criteria

| Area | Result |
|---|---|
| Credential safety | Pass. Browser code only calls `/hf-deforum/*`; the proxy reads `HF_TOKEN`, `HUGGING_FACE_HUB_TOKEN`, or a named CLI cache token server-side. |
| Deforum scope control | Pass. Payload backend is `huggingface-deforum`, output format is `mp4`, and the adapter preserves image-keyframe timeline data. |
| A1111 fallback preservation | Pass. `a1111-deforum` remains the default selected real backend. |
| UI usefulness | Pass. Toolbar exposes `Local A1111` and `Hugging Face` backend choices and changes the render button label for the selected backend. |
| Remote runtime evidence | Not yet available. No Hugging Face endpoint/Space URL has been configured or tested. |
| Verification | Pass. Unit tests, build, Playwright smoke, and whitespace checks pass. |

## Results

Implemented:

- `server/hfDeforumProxy.js`
  - `GET /hf-deforum/status`
  - `POST /hf-deforum/jobs`
  - `GET /hf-deforum/jobs/:id`
  - `GET /hf-deforum/jobs/:id/artifact`
- `src/services/huggingFaceDeforumAdapter.js`
  - payload creation from `normaliseRenderConfig()`
  - job submission through the local proxy
  - polling for asynchronous jobs
  - normalized take metadata with backend id `huggingface-deforum`
- UI backend selector in `src/components/workbench/Workbench.jsx`.
- `.env.example` with `HF_TOKEN_NAME=nms-shg`, `HF_DEFORUM_ENDPOINT_URL`, and endpoint path settings.

Verification output:

- `pnpm test`: 5 test files, 12 tests passed.
- `pnpm build`: passed.
- `pnpm exec playwright test`: 1 test passed.
- `git diff --check`: passed.
- Live proxy smoke: `tokenConfigured: true`, `endpointConfigured: false`, `configured: false`, token name `nms-shg`.

## Weaknesses

- No remote Hugging Face endpoint or Space runtime is implemented in this repo yet.
- No real Hugging Face MP4 artifact has been generated.
- The proxy assumes a Deforum-compatible endpoint contract with `/jobs`-style routes unless overridden by environment variables.
- Large image-keyframe submissions may be heavy because the proxy attaches base64 image data for referenced source images by default.

## Recommended Improvements

- Build or configure the actual Hugging Face endpoint/Space and set `HF_DEFORUM_ENDPOINT_URL`.
- Add a small remote smoke payload with 3 source images, 3-5 seconds, and `896x384` output.
- Add artifact validation after the endpoint returns MP4 output.
- Add a Hugging Face-vs-A1111 comparison eval once the first remote MP4 exists.

## Revised Notes

- The local integration layer is ready for a Deforum-compatible remote endpoint.
- The prototype should still use local Automatic1111 as the verified baseline until the remote runtime produces MP4 evidence.
