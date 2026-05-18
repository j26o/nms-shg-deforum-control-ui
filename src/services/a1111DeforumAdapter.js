const allowedParams = [
  'batch_name',
  'W',
  'H',
  'max_frames',
  'fps',
  'steps',
  'seed',
  'sampler',
  'animation_mode',
  'use_depth_warping',
  'diffusion_cadence',
  'skip_video_creation',
  'make_gif',
  'delete_imgs',
  'prompts',
];

export function createDeforumSmokeSettings(preset) {
  const frames = Math.min(12, Math.max(4, Math.round(preset.target.fps * 0.2)));
  const prompt = preset.timeline[0]?.prompt ?? preset.prompt.positive;

  return {
    batch_name: `${preset.presetName}-api-smoke`,
    W: 256,
    H: 128,
    max_frames: frames,
    fps: Math.min(8, preset.target.fps),
    steps: Math.min(8, preset.generation.steps),
    seed: preset.generation.seed,
    sampler: 'Euler',
    animation_mode: '2D',
    use_depth_warping: false,
    diffusion_cadence: 1,
    skip_video_creation: false,
    make_gif: false,
    delete_imgs: false,
    prompts: {
      0: `${prompt} --neg ${preset.prompt.negative}`,
    },
  };
}

export async function getDeforumApiStatus() {
  const response = await fetch('/a1111/deforum/api_version');
  if (!response.ok) {
    throw new Error(`Deforum API status failed: ${response.status}`);
  }
  return response.json();
}

export async function queueA1111DeforumSmokeRender(preset) {
  const settings = createDeforumSmokeSettings(preset);
  const params = new URLSearchParams({
    settings_json: JSON.stringify(settings),
    allowed_params: allowedParams.join(';'),
  });
  const startedAt = performance.now();
  const response = await fetch(`/a1111/deforum/run?${params.toString()}`, {
    method: 'POST',
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Deforum render failed: ${response.status} ${text}`);
  }

  const result = await response.json();
  return {
    id: `a1111-${Date.now()}`,
    status: 'complete',
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    estimateSeconds: Math.max(1, Math.round((performance.now() - startedAt) / 1000)),
    outputPath: result.outdir,
    error: '',
    logs: [
      'Submitted via Automatic1111 Deforum simple API.',
      `Frames: ${settings.max_frames}`,
      `Output: ${result.outdir}`,
    ],
    renderConfig: {
      presetName: preset.presetName,
      model: preset.model,
      target: {
        ...preset.target,
        previewResolution: [settings.W, settings.H],
      },
      timeline: preset.timeline,
      generation: {
        ...preset.generation,
        sampler: settings.sampler,
        steps: settings.steps,
      },
      output: preset.output,
    },
  };
}
