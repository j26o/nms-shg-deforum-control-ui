import { createQueuedJob } from './renderAdapter.js';

export function queueMockRender(preset, modelOverride) {
  const job = createQueuedJob(preset, modelOverride);
  const modelId = job.renderConfig.model.modelId ?? job.renderConfig.model.id;
  const seed = job.renderConfig.generation.seed;

  return {
    ...job,
    status: 'complete',
    completedAt: new Date().toISOString(),
    outputPath: '',
    previewLabel: `${preset.presetName}-${modelId}-${seed}`,
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
    hasFileArtifact: Boolean(job.outputPath || job.artifactUrl),
    remoteJobId: job.remoteJobId ?? '',
    renderSettings,
    logs: job.logs,
    notes: '',
    createdAt: job.completedAt ?? new Date().toISOString(),
  };
}
