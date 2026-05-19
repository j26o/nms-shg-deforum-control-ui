import { createQueuedJob } from './renderAdapter.js';

function getSimulatedPreview(renderConfig) {
  const firstSegment = renderConfig.timeline[0];
  const firstAsset =
    renderConfig.assets.find((asset) => asset.id === firstSegment?.sourceImageId) ?? renderConfig.assets.find((asset) => asset.enabled !== false);

  if (!firstAsset) {
    return null;
  }

  return {
    type: 'simulated-image-reference-preview',
    sourceImageId: firstAsset.id,
    label: firstAsset.label,
    thumbnailUrl: firstAsset.previewUrl,
    frame: firstSegment?.fromFrame ?? 0,
    note: 'Animated UI preview only. No media file was written.',
  };
}

export function queueMockRender(preset, modelOverride) {
  const job = createQueuedJob(preset, modelOverride);
  const modelId = job.renderConfig.model.modelId ?? job.renderConfig.model.id;
  const seed = job.renderConfig.generation.seed;
  const simulatedPreview = getSimulatedPreview(job.renderConfig);

  return {
    ...job,
    status: 'complete',
    completedAt: new Date().toISOString(),
    outputPath: '',
    previewLabel: `${preset.presetName}-${modelId}-${seed}`,
    simulatedPreview,
    logs: [
      ...job.logs,
      `Using model ${modelId}.`,
      `Preview ${preset.target.previewResolution.join('x')} at ${preset.target.fps} fps.`,
      'Mock renderer produced simulated preview metadata; no media file was written.',
    ],
  };
}

export function createTakeFromJob(job) {
  const config = job.renderConfig;
  const renderSettings = job.renderSettings ?? null;
  return {
    id: `take-${Date.now()}`,
    jobId: job.id,
    candidate: false,
    model: config.model,
    seed: config.generation.seed,
    previewResolution: config.target.previewResolution,
    checkpointFile: config.model.file ?? '',
    backend: job.backend ?? 'mock',
    status: job.status,
    fps: renderSettings?.fps ?? config.target.fps ?? config.motion?.fps,
    frameCount: renderSettings?.max_frames,
    settingsFilePath: job.backendSettingsFilePath ?? '',
    outputSettingsPattern: job.outputSettingsPattern ?? '',
    outputVideoPattern: job.outputVideoPattern ?? '',
    renderDurationMs: job.estimateSeconds * 1000,
    outputPath: job.outputPath,
    artifactUrl: job.artifactUrl ?? '',
    previewLabel: job.previewLabel ?? '',
    simulatedPreview: job.simulatedPreview ?? null,
    hasFileArtifact: Boolean(job.outputPath || job.artifactUrl),
    remoteJobId: job.remoteJobId ?? '',
    renderSettings,
    logs: job.logs,
    notes: '',
    createdAt: job.completedAt ?? new Date().toISOString(),
  };
}
