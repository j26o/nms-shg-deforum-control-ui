---
title: NMS SHG Deforum Endpoint
emoji: 🎬
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 7860
pinned: false
---

# Hugging Face Deforum Endpoint

This private Docker Space/API implements the optional `huggingface-deforum` backend contract used by the local workbench proxy.

Routes:

- `GET /health`
- `POST /jobs`
- `GET /jobs/{jobId}`
- `GET /jobs/{jobId}/artifact`

The normal runtime path wraps an Automatic1111 WebUI instance with `sd-webui-deforum` and the Deforum batch API enabled. The service decodes image-keyframe assets sent by the local proxy, writes them to the Space filesystem, translates the shared preset payload into Deforum settings, submits the job, and exposes the resulting MP4 artifact.

## Required Variables

```text
HF_DEFORUM_A1111_BASE_URL=http://host-or-service:7860
HF_DEFORUM_RENDER_MODE=a1111
HF_DEFORUM_JOBS_DIR=/data/jobs
```

`HF_DEFORUM_A1111_BASE_URL` must point to a Deforum-enabled Automatic1111 backend reachable from the Space runtime. This repository does not commit WebUI, checkpoints, extensions, or generated media.

## Smoke-Test Fallback

For endpoint plumbing only, set:

```text
HF_DEFORUM_ALLOW_FALLBACK_MORPH=1
```

Fallback output crossfades submitted keyframe images into an MP4 and is marked with a warning in job metadata. It is not acceptable evidence for the final Hugging Face Deforum eval.

## Local Proxy

Set the workbench proxy to the Space URL:

```powershell
$env:HF_DEFORUM_ENDPOINT_URL="https://robaldovino-nms-shg-deforum-endpoint.hf.space"
$env:HF_TOKEN="hf_xxx"
pnpm dev
```
