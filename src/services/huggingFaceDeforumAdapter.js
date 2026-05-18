import { normaliseRenderConfig } from './renderAdapter.js';

const COMPLETED_STATUSES = new Set(['complete', 'completed', 'succeeded', 'success', 'done']);
const FAILED_STATUSES = new Set(['failed', 'error', 'cancelled', 'canceled']);

function getPreviewResolution(renderConfig) {
  return renderConfig.target.previewResolution ?? renderConfig.target.finalResolution ?? renderConfig.target.sourceResolution;
}

function getMaxFrames(renderConfig) {
  const fps = renderConfig.motion?.fps ?? renderConfig.target?.fps ?? 24;
  const previewSeconds = renderConfig.output?.previewDuration ?? renderConfig.target?.durationSeconds ?? 10;
  return Math.max(1, Math.round(previewSeconds * fps));
}

function createEndpointAssets(renderConfig) {
  const referencedAssetIds = new Set(renderConfig.timeline.map((segment) => segment.sourceImageId).filter(Boolean));
  return renderConfig.assets
    .filter((asset) => referencedAssetIds.has(asset.id))
    .map((asset) => ({
      id: asset.id,
      path: asset.path,
      uploadRef: asset.path,
      label: asset.label,
      width: asset.width,
      height: asset.height,
      cropMode: asset.cropMode,
      focalPoint: asset.focalPoint,
    }));
}

function createEndpointTimeline(renderConfig) {
  const fallbackPositive = renderConfig.prompt?.positive ?? '';
  const fallbackNegative = renderConfig.prompt?.negative ?? '';
  return renderConfig.timeline.map((segment) => ({
    id: segment.id,
    fromFrame: segment.fromFrame,
    toFrame: segment.toFrame,
    sourceImageId: segment.sourceImageId,
    prompt: segment.prompt ?? fallbackPositive,
    negativePrompt: segment.negativePrompt ?? fallbackNegative,
    transitionMode: segment.transitionMode,
  }));
}

export function createHuggingFaceDeforumPayload(preset, modelOverride) {
  const renderConfig = normaliseRenderConfig(preset, modelOverride);
  const previewResolution = getPreviewResolution(renderConfig);
  const fps = renderConfig.motion?.fps ?? renderConfig.target?.fps ?? 24;
  const maxFrames = getMaxFrames(renderConfig);

  return {
    schemaVersion: '0.1.0',
    backend: 'huggingface-deforum',
    presetName: renderConfig.presetName,
    target: {
      sourceResolution: renderConfig.target.sourceResolution,
      previewResolution,
      finalResolution: renderConfig.target.finalResolution,
      aspectRatio: renderConfig.target.aspectRatio,
      fps,
      durationSeconds: renderConfig.output?.previewDuration ?? renderConfig.target?.durationSeconds,
      maxFrames,
    },
    model: {
      modelId: renderConfig.model?.modelId ?? renderConfig.model?.id,
      label: renderConfig.model?.label,
      repository: renderConfig.model?.repository,
      file: renderConfig.model?.file,
      license: renderConfig.model?.license,
      status: renderConfig.model?.status,
    },
    assets: createEndpointAssets(renderConfig),
    timeline: createEndpointTimeline(renderConfig),
    generation: {
      sampler: renderConfig.generation?.sampler,
      scheduler: renderConfig.generation?.scheduler,
      steps: renderConfig.generation?.steps,
      cfgScale: renderConfig.generation?.cfgScale,
      seedMode: renderConfig.generation?.seedMode,
      seed: renderConfig.generation?.seed,
    },
    imageMorph: renderConfig.imageMorph,
    motion: {
      zoom: renderConfig.motion?.zoom,
      panX: renderConfig.motion?.panX,
      panY: renderConfig.motion?.panY,
      rotation: renderConfig.motion?.rotation,
      depthWarpStrength: renderConfig.motion?.depthWarpStrength,
      cameraPathPreset: renderConfig.motion?.cameraPathPreset,
      loopMode: renderConfig.motion?.loopMode,
      cadence: renderConfig.motion?.cadence,
      fps,
    },
    prompt: renderConfig.prompt,
    look: renderConfig.look,
    output: {
      format: 'mp4',
      artifactPolicy: 'return-url-or-download',
      previewDuration: renderConfig.output?.previewDuration,
      renderRange: renderConfig.output?.renderRange,
      renderQuality: renderConfig.output?.renderQuality,
      takeNotes: renderConfig.output?.takeNotes,
      productionNotes: renderConfig.output?.productionNotes,
    },
  };
}

function isComplete(status) {
  return COMPLETED_STATUSES.has(String(status).toLowerCase());
}

function isFailed(status) {
  return FAILED_STATUSES.has(String(status).toLowerCase());
}

async function fetchJson(url, init) {
  const response = await fetch(url, init);
  const json = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(json.error ?? `Hugging Face Deforum request failed: ${response.status}`);
  }

  return json;
}

async function pollHuggingFaceJob(jobId, { pollIntervalMs = 2000, maxPolls = 90 } = {}) {
  let latest = null;

  for (let index = 0; index < maxPolls; index += 1) {
    latest = await fetchJson(`/hf-deforum/jobs/${encodeURIComponent(jobId)}`);
    if (isComplete(latest.status)) {
      return latest;
    }

    if (isFailed(latest.status)) {
      throw new Error(`Hugging Face Deforum job failed: ${latest.status}`);
    }

    if (pollIntervalMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
    }
  }

  throw new Error(`Hugging Face Deforum job timed out after ${maxPolls} polls.`);
}

function normalizeCompletedResult(result, submittedResult, payload) {
  return {
    ...submittedResult,
    ...result,
    jobId: result.jobId ?? submittedResult.jobId,
    status: result.status ?? submittedResult.status,
    renderSettings: result.renderSettings ?? result.settings ?? submittedResult.renderSettings ?? payload,
  };
}

export async function queueHuggingFaceDeforumRender(preset, modelOverride, options = {}) {
  const renderConfig = normaliseRenderConfig(preset, modelOverride);
  const payload = createHuggingFaceDeforumPayload(preset, modelOverride);
  const createdAt = new Date().toISOString();
  const startedAt = performance.now();

  const submitted = await fetchJson('/hf-deforum/jobs', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const completed = isComplete(submitted.status) || !submitted.jobId ? submitted : await pollHuggingFaceJob(submitted.jobId, options);
  const result = normalizeCompletedResult(completed, submitted, payload);
  const completedAt = new Date().toISOString();
  const estimateSeconds = Math.max(1, Math.round((performance.now() - startedAt) / 1000));
  const previewResolution = getPreviewResolution(renderConfig);

  return {
    id: `hf-${result.jobId || Date.now()}`,
    status: isComplete(result.status) ? 'complete' : result.status ?? 'submitted',
    createdAt,
    completedAt,
    estimateSeconds,
    outputPath: result.outputPath || result.artifactUrl || (result.jobId ? `/hf-deforum/jobs/${encodeURIComponent(result.jobId)}/artifact` : ''),
    error: '',
    logs: [
      'Submitted via Hugging Face Deforum proxy.',
      `Model: ${renderConfig.model.modelId ?? renderConfig.model.id}`,
      `Resolution: ${previewResolution.join('x')}`,
      `Frames: ${payload.target.maxFrames}`,
      `Source images: ${payload.assets.length}`,
      ...(result.warnings ?? []).map((warning) => `Warning: ${warning}`),
      ...(result.logs ?? []),
    ],
    renderConfig,
    renderSettings: result.renderSettings ?? payload,
    backend: 'huggingface-deforum',
    backendResponse: result.raw ?? result,
    backendSettingsFilePath: result.settingsFilePath ?? '',
    outputSettingsPattern: result.settingsFilePath ?? result.settingsUrl ?? '',
    outputVideoPattern: result.artifactUrl ?? result.outputPath ?? '',
    remoteJobId: result.jobId ?? '',
    artifactUrl: result.artifactUrl ?? '',
  };
}
