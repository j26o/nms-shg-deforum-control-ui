export function normaliseRenderConfig(preset, modelOverride) {
  const model = modelOverride ?? preset.model;
  const timeline = [...preset.timeline]
    .filter((segment) => {
      const asset = preset.assets.find((item) => item.id === segment.sourceImageId);
      return asset?.enabled !== false;
    })
    .sort((left, right) => left.fromFrame - right.fromFrame);

  return {
    presetName: preset.presetName,
    model,
    target: preset.target,
    assets: preset.assets.filter((asset) => asset.enabled !== false),
    timeline,
    generation: preset.generation,
    imageMorph: preset.imageMorph,
    motion: preset.motion,
    prompt: preset.prompt,
    look: preset.look,
    output: preset.output,
  };
}

export function createQueuedJob(preset, modelOverride) {
  const renderConfig = normaliseRenderConfig(preset, modelOverride);
  return {
    id: `job-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    status: 'queued',
    createdAt: new Date().toISOString(),
    estimateSeconds: Math.max(8, Math.round(renderConfig.output.previewDuration * 1.7)),
    outputPath: '',
    error: '',
    logs: ['Queued mock render job.'],
    renderConfig,
  };
}
