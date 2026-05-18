import { createQueuedJob } from './renderAdapter.js';

export function queueMockRender(preset, modelOverride) {
  const job = createQueuedJob(preset, modelOverride);
  const modelId = job.renderConfig.model.modelId ?? job.renderConfig.model.id;
  const seed = job.renderConfig.generation.seed;

  return {
    ...job,
    status: 'complete',
    completedAt: new Date().toISOString(),
    outputPath: `${preset.output.outputFolder}/${preset.presetName}-${modelId}-${seed}.webm`,
    logs: [
      ...job.logs,
      `Using model ${modelId}.`,
      `Preview ${preset.target.previewResolution.join('x')} at ${preset.target.fps} fps.`,
      'Mock renderer produced deterministic placeholder metadata.',
    ],
  };
}

export function createTakeFromJob(job) {
  const config = job.renderConfig;
  return {
    id: `take-${Date.now()}`,
    jobId: job.id,
    candidate: false,
    model: config.model,
    seed: config.generation.seed,
    previewResolution: config.target.previewResolution,
    renderDurationMs: job.estimateSeconds * 1000,
    outputPath: job.outputPath,
    notes: '',
    createdAt: job.completedAt ?? new Date().toISOString(),
  };
}
