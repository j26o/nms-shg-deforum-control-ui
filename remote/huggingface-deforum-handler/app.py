import base64
import json
import os
import shutil
import time
import uuid
from pathlib import Path
from threading import Lock
from typing import Any

import requests
from fastapi import BackgroundTasks, FastAPI, Header, HTTPException, Response
from fastapi.responses import FileResponse, JSONResponse

COMPLETE_STATUSES = {"succeeded", "success", "complete", "completed", "done"}
FAILED_STATUSES = {"failed", "error", "cancelled", "canceled"}

JOBS_DIR = Path(os.environ.get("HF_DEFORUM_JOBS_DIR", "/tmp/hf-deforum-jobs"))
A1111_BASE_URL = os.environ.get("HF_DEFORUM_A1111_BASE_URL", "").rstrip("/")
RENDER_MODE = os.environ.get("HF_DEFORUM_RENDER_MODE", "a1111").lower()
ALLOW_FALLBACK_MORPH = os.environ.get("HF_DEFORUM_ALLOW_FALLBACK_MORPH", "0") == "1"
POLL_INTERVAL_SECONDS = float(os.environ.get("HF_DEFORUM_A1111_POLL_INTERVAL_SECONDS", "2"))
MAX_POLLS = int(os.environ.get("HF_DEFORUM_A1111_MAX_POLLS", "3600"))
FALLBACK_MAX_FRAMES = int(os.environ.get("HF_DEFORUM_FALLBACK_MAX_FRAMES", "120"))

JOBS: dict[str, dict[str, Any]] = {}
JOBS_LOCK = Lock()

app = FastAPI(title="NMS SHG Hugging Face Deforum Endpoint", version="0.1.0")


def now_ms() -> int:
    return int(time.time() * 1000)


def write_json(path: Path, payload: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def job_dir(job_id: str) -> Path:
    return JOBS_DIR / job_id


def public_job(job: dict[str, Any]) -> dict[str, Any]:
    return {
        "jobId": job["jobId"],
        "status": job["status"],
        "frameCount": job.get("frameCount"),
        "fps": job.get("fps"),
        "renderDurationMs": job.get("renderDurationMs"),
        "settingsFilePath": job.get("settingsFilePath", ""),
        "renderSettings": job.get("renderSettings"),
        "warnings": job.get("warnings", []),
        "logs": job.get("logs", []),
        "error": job.get("error", ""),
    }


def save_job(job: dict[str, Any]) -> None:
    with JOBS_LOCK:
        JOBS[job["jobId"]] = job
    write_json(job_dir(job["jobId"]) / "status.json", job)


def load_job(job_id: str) -> dict[str, Any]:
    with JOBS_LOCK:
        if job_id in JOBS:
            return JOBS[job_id]

    status_path = job_dir(job_id) / "status.json"
    if not status_path.exists():
        raise HTTPException(status_code=404, detail=f"Unknown job id: {job_id}")

    job = read_json(status_path)
    with JOBS_LOCK:
        JOBS[job_id] = job
    return job


def update_job(job_id: str, **updates: Any) -> dict[str, Any]:
    job = load_job(job_id)
    job.update(updates)
    save_job(job)
    return job


def as_int(value: Any, fallback: int) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return fallback


def as_float(value: Any, fallback: float) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return fallback


def number_schedule(value: Any, fallback: float = 0) -> str:
    numeric_value = as_float(value, fallback)
    rendered = int(numeric_value) if numeric_value.is_integer() else round(numeric_value, 4)
    return f"0: ({rendered})"


def string_schedule(value: str) -> str:
    return f"0: ({json.dumps(value)})"


def prompt_text(segment: dict[str, Any]) -> str:
    if segment.get("promptText"):
        return str(segment["promptText"])

    positive = str(segment.get("prompt", "")).strip()
    negative = str(segment.get("negativePrompt", "")).strip()
    if negative:
        return f"{positive} --neg {negative}".strip()
    return positive


def decode_assets(payload: dict[str, Any], destination: Path) -> dict[str, Path]:
    assets_dir = destination / "assets"
    assets_dir.mkdir(parents=True, exist_ok=True)
    asset_paths: dict[str, Path] = {}

    for asset in payload.get("assets", []):
        asset_id = asset.get("id")
        data_base64 = asset.get("dataBase64")
        if not asset_id or not data_base64:
            continue

        mime_type = asset.get("mimeType", "image/png")
        extension = ".jpg" if mime_type in {"image/jpeg", "image/jpg"} else ".png"
        output_path = assets_dir / f"{asset_id}{extension}"
        output_path.write_bytes(base64.b64decode(data_base64))
        asset_paths[asset_id] = output_path

    return asset_paths


def create_deforum_settings(payload: dict[str, Any], asset_paths: dict[str, Path], job_id: str) -> dict[str, Any]:
    target = payload.get("target", {})
    generation = payload.get("generation", {})
    motion = payload.get("motion", {})
    image_morph = payload.get("imageMorph", {})
    look = payload.get("look", {})
    model = payload.get("model", {})
    preview_resolution = target.get("previewResolution") or target.get("finalResolution") or target.get("sourceResolution") or [896, 384]
    fps = as_int(target.get("fps") or motion.get("fps"), 24)
    max_frames = max(1, as_int(target.get("maxFrames"), max(1, round(as_float(target.get("durationSeconds"), 10) * fps))))

    prompts: dict[str, str] = {}
    init_images: dict[str, str] = {}
    for segment in payload.get("timeline", []):
        frame_key = str(as_int(segment.get("fromFrame"), 0))
        prompts[frame_key] = prompt_text(segment)
        source_image_id = segment.get("sourceImageId")
        if source_image_id in asset_paths:
            init_images[frame_key] = str(asset_paths[source_image_id])

    if not prompts:
        prompts["0"] = str(payload.get("prompt", {}).get("positive", ""))

    if not init_images and asset_paths:
        first_id = next(iter(asset_paths))
        init_images["0"] = str(asset_paths[first_id])

    checkpoint = model.get("file") or model.get("modelId") or model.get("id") or ""
    seed = as_int(generation.get("seed"), -1)
    steps = max(1, as_int(generation.get("steps"), 25))
    cfg_scale = as_float(generation.get("cfgScale"), 7)
    denoise_strength = min(1, max(0, as_float(image_morph.get("denoiseStrength"), 0.5)))
    source_strength = min(1, max(0, as_float(image_morph.get("sourceImageStrength"), denoise_strength)))
    depth_strength = as_float(motion.get("depthWarpStrength"), 0)
    use_depth_warping = depth_strength > 0

    return {
        "batch_name": f"{payload.get('presetName', 'hf-deforum')}-{job_id}",
        "W": as_int(preview_resolution[0] if len(preview_resolution) > 0 else None, 896),
        "H": as_int(preview_resolution[1] if len(preview_resolution) > 1 else None, 384),
        "max_frames": max_frames,
        "fps": fps,
        "steps": steps,
        "seed": seed,
        "sampler": generation.get("sampler") or "Euler",
        "seed_behavior": "random" if generation.get("seedMode") == "random" else "fixed",
        "use_init": bool(init_images),
        "strength": denoise_strength,
        "init_image": next(iter(init_images.values()), ""),
        "prompts": prompts,
        "positive_prompts": payload.get("prompt", {}).get("positive", ""),
        "negative_prompts": payload.get("prompt", {}).get("negative", ""),
        "animation_mode": "3D" if use_depth_warping else "2D",
        "border": "replicate",
        "angle": number_schedule(motion.get("rotation"), 0),
        "zoom": number_schedule(motion.get("zoom"), 1),
        "translation_x": number_schedule(motion.get("panX"), 0),
        "translation_y": number_schedule(motion.get("panY"), 0),
        "translation_z": number_schedule(1.75 + (as_float(motion.get("zoom"), 1) - 1) * 12 if use_depth_warping else 1.75),
        "rotation_3d_x": number_schedule(0),
        "rotation_3d_y": number_schedule(0),
        "rotation_3d_z": number_schedule(motion.get("rotation"), 0),
        "strength_schedule": number_schedule(denoise_strength),
        "image_strength_schedule": number_schedule(source_strength),
        "noise_schedule": number_schedule(image_morph.get("imageInfluenceDecay"), 0.35),
        "cfg_scale_schedule": number_schedule(cfg_scale),
        "steps_schedule": number_schedule(steps),
        "sampler_schedule": string_schedule(str(generation.get("sampler") or "Euler")),
        "seed_schedule": "0:(s)",
        "diffusion_cadence": max(1, as_int(motion.get("cadence"), 1)),
        "use_depth_warping": use_depth_warping,
        "midas_weight": min(1, max(0, depth_strength if use_depth_warping else 0.2)),
        "color_coherence": "LAB" if as_float(look.get("monochromeToColourBias"), 0) > 0.5 else "None",
        "enable_checkpoint_scheduling": bool(checkpoint),
        "checkpoint_schedule": string_schedule(str(checkpoint)),
        "use_looper": len(init_images) > 1,
        "hybrid_generate_inputframes": bool(init_images),
        "hybrid_use_first_frame_as_init_image": bool(init_images),
        "hybrid_use_init_image": bool(init_images),
        "init_images": json.dumps(init_images, indent=4),
        "skip_video_creation": False,
        "make_gif": False,
        "delete_imgs": False,
    }


def request_json(method: str, url: str, **kwargs: Any) -> dict[str, Any]:
    response = requests.request(method, url, timeout=60, **kwargs)
    text = response.text
    if not response.ok:
        raise RuntimeError(f"{method} {url} failed: {response.status_code} {text}")

    try:
        return response.json()
    except ValueError:
        return {"raw": text}


def is_complete(value: Any) -> bool:
    return str(value or "").lower() in COMPLETE_STATUSES


def is_failed(value: Any) -> bool:
    return str(value or "").lower() in FAILED_STATUSES


def find_latest_mp4(output_dir: Path) -> Path | None:
    if not output_dir.exists():
        return None

    mp4s = sorted(output_dir.rglob("*.mp4"), key=lambda item: item.stat().st_mtime, reverse=True)
    return mp4s[0] if mp4s else None


def copy_artifact_from_a1111(job_id: str, result: dict[str, Any]) -> Path | None:
    for value in [result.get("outputPath"), result.get("output_path"), result.get("video_path"), result.get("artifact"), result.get("outdir")]:
        if not value:
            continue

        candidate = Path(str(value))
        if candidate.is_file() and candidate.suffix.lower() == ".mp4":
            artifact = job_dir(job_id) / "artifact.mp4"
            shutil.copy2(candidate, artifact)
            return artifact

        if candidate.is_dir():
            latest = find_latest_mp4(candidate)
            if latest:
                artifact = job_dir(job_id) / "artifact.mp4"
                shutil.copy2(latest, artifact)
                return artifact

    return None


def submit_a1111_deforum(settings: dict[str, Any], job_id: str) -> dict[str, Any]:
    if not A1111_BASE_URL:
        raise RuntimeError("HF_DEFORUM_A1111_BASE_URL is not configured.")

    batch = request_json("POST", f"{A1111_BASE_URL}/deforum_api/batches", json={"deforum_settings": settings})
    remote_job_id = (batch.get("job_ids") or [None])[0] or batch.get("job_id")
    if not remote_job_id:
        artifact = copy_artifact_from_a1111(job_id, batch)
        return {**batch, "artifactPath": str(artifact) if artifact else ""}

    result: dict[str, Any] = {}
    for _ in range(MAX_POLLS):
        result = request_json("GET", f"{A1111_BASE_URL}/deforum_api/jobs/{remote_job_id}")
        if result.get("outdir") or result.get("output_path") or is_complete(result.get("status")) or is_complete(result.get("phase")):
            artifact = copy_artifact_from_a1111(job_id, result)
            return {**result, "batchResponse": batch, "remoteJobId": remote_job_id, "artifactPath": str(artifact) if artifact else ""}

        if is_failed(result.get("status")) or is_failed(result.get("phase")):
            raise RuntimeError(f"Deforum job failed: {result}")

        time.sleep(POLL_INTERVAL_SECONDS)

    raise RuntimeError(f"Deforum job timed out after {MAX_POLLS} polls.")


def fit_image(image: Any, width: int, height: int) -> Any:
    from PIL import Image

    source = image.convert("RGB")
    source_ratio = source.width / source.height
    target_ratio = width / height
    if source_ratio > target_ratio:
        resized_height = height
        resized_width = round(height * source_ratio)
    else:
        resized_width = width
        resized_height = round(width / source_ratio)

    resized = source.resize((resized_width, resized_height), Image.Resampling.LANCZOS)
    left = max(0, (resized_width - width) // 2)
    top = max(0, (resized_height - height) // 2)
    return resized.crop((left, top, left + width, top + height))


def render_fallback_morph(payload: dict[str, Any], settings: dict[str, Any], asset_paths: dict[str, Path], job_id: str) -> tuple[Path, int]:
    import imageio.v2 as imageio
    import numpy as np
    from PIL import Image

    width = settings["W"]
    height = settings["H"]
    fps = settings["fps"]
    max_frames = min(settings["max_frames"], FALLBACK_MAX_FRAMES)
    timeline = sorted(payload.get("timeline", []), key=lambda item: as_int(item.get("fromFrame"), 0))
    keyed_images: list[tuple[int, Any]] = []

    for segment in timeline:
        source_id = segment.get("sourceImageId")
        if source_id not in asset_paths:
            continue
        keyed_images.append((as_int(segment.get("fromFrame"), 0), fit_image(Image.open(asset_paths[source_id]), width, height)))

    if not keyed_images and asset_paths:
        first_path = next(iter(asset_paths.values()))
        keyed_images.append((0, fit_image(Image.open(first_path), width, height)))

    if not keyed_images:
        raise RuntimeError("Fallback morph renderer requires at least one image asset.")

    artifact = job_dir(job_id) / "artifact.mp4"
    with imageio.get_writer(artifact, fps=fps, codec="libx264", quality=8, macro_block_size=16) as writer:
        for frame_index in range(max_frames):
            current_index = 0
            for index, (key_frame, _) in enumerate(keyed_images):
                if key_frame <= frame_index:
                    current_index = index

            current_frame, current_image = keyed_images[current_index]
            next_frame, next_image = keyed_images[min(current_index + 1, len(keyed_images) - 1)]
            blend = 0 if next_frame <= current_frame else min(1, max(0, (frame_index - current_frame) / (next_frame - current_frame)))
            frame = Image.blend(current_image, next_image, blend)
            writer.append_data(np.asarray(frame))

    return artifact, max_frames


def run_job(job_id: str, payload: dict[str, Any]) -> None:
    started_at = now_ms()
    try:
        update_job(job_id, status="running", logs=["Decoded submitted image-keyframe payload."])
        directory = job_dir(job_id)
        asset_paths = decode_assets(payload, directory)
        settings = create_deforum_settings(payload, asset_paths, job_id)
        settings_path = directory / "settings.json"
        write_json(settings_path, settings)

        warnings: list[str] = []
        logs = [f"Prepared {len(asset_paths)} source image assets.", f"Frames: {settings['max_frames']}", f"FPS: {settings['fps']}"]
        artifact: Path | None = None
        upstream: dict[str, Any] = {}
        frame_count = settings["max_frames"]

        if RENDER_MODE == "a1111":
            upstream = submit_a1111_deforum(settings, job_id)
            artifact_value = upstream.get("artifactPath")
            artifact = Path(artifact_value) if artifact_value else None

        if (not artifact or not artifact.exists()) and ALLOW_FALLBACK_MORPH:
            artifact, frame_count = render_fallback_morph(payload, settings, asset_paths, job_id)
            warnings.append("Used fallback keyframe morph renderer. This is for endpoint smoke tests only, not final Deforum quality evaluation.")

        if not artifact or not artifact.exists():
            raise RuntimeError("Render completed without an MP4 artifact.")

        update_job(
            job_id,
            status="complete",
            frameCount=frame_count,
            fps=settings["fps"],
            renderDurationMs=now_ms() - started_at,
            renderSettings=settings,
            settingsFilePath=str(settings_path),
            artifactPath=str(artifact),
            warnings=warnings,
            logs=logs,
            upstream=upstream,
        )
    except Exception as error:
        update_job(
            job_id,
            status="failed",
            renderDurationMs=now_ms() - started_at,
            warnings=[],
            logs=[str(error)],
            error=str(error),
        )


@app.get("/")
def root() -> dict[str, Any]:
    return {"backend": "huggingface-deforum", "routes": ["/health", "/jobs", "/jobs/{job_id}", "/jobs/{job_id}/artifact"]}


@app.get("/health")
def health() -> dict[str, Any]:
    return {
        "backend": "huggingface-deforum",
        "renderMode": RENDER_MODE,
        "a1111Configured": bool(A1111_BASE_URL),
        "fallbackMorphEnabled": ALLOW_FALLBACK_MORPH,
    }


@app.post("/jobs")
def create_job(payload: dict[str, Any], background_tasks: BackgroundTasks, authorization: str | None = Header(default=None)) -> JSONResponse:
    del authorization
    if payload.get("backend") != "huggingface-deforum":
        raise HTTPException(status_code=400, detail="Expected backend=huggingface-deforum.")

    job_id = uuid.uuid4().hex
    directory = job_dir(job_id)
    directory.mkdir(parents=True, exist_ok=True)
    write_json(directory / "payload.json", payload)

    job = {
        "jobId": job_id,
        "status": "queued",
        "createdAt": now_ms(),
        "warnings": [],
        "logs": ["Queued Hugging Face Deforum render job."],
    }
    save_job(job)

    if os.environ.get("HF_DEFORUM_SYNC_JOBS", "0") == "1":
        run_job(job_id, payload)
    else:
        background_tasks.add_task(run_job, job_id, payload)

    return JSONResponse(public_job(load_job(job_id)))


@app.get("/jobs/{job_id}")
def get_job(job_id: str, authorization: str | None = Header(default=None)) -> dict[str, Any]:
    del authorization
    return public_job(load_job(job_id))


@app.get("/jobs/{job_id}/artifact")
def get_artifact(job_id: str, authorization: str | None = Header(default=None)) -> Response:
    del authorization
    job = load_job(job_id)
    artifact = Path(job.get("artifactPath", ""))
    if job.get("status") != "complete" or not artifact.exists():
        raise HTTPException(status_code=404, detail="Artifact is not ready.")

    return FileResponse(artifact, media_type="video/mp4", filename=f"{job_id}.mp4")
