import { getDefaultModel } from './modelOptions.js';

const sourceImageModules = import.meta.glob('../../assets/images/source/**/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
});

const sourceImages = Object.entries(sourceImageModules)
  .sort(([leftPath], [rightPath]) => leftPath.localeCompare(rightPath))
  .map(([modulePath, previewUrl]) => ({
    path: modulePath.replace('../../', ''),
    previewUrl,
  }));

function getSourceDate(path) {
  return path.match(/assets\/images\/source\/([^/]+)\//)?.[1] ?? 'source';
}

function createImageReferencePrompt(asset) {
  return [
    `Use ${asset.label} as the primary visual reference frame.`,
    'Preserve the pre-rendered image composition, skyline, atmosphere, silhouettes, and 1680x720 panoramic edges.',
    'Blend smoothly into the next referenced source image with restrained Deforum motion.',
  ].join(' ');
}

export function createDefaultAssets() {
  return sourceImages.map((source, index) => ({
    id: `image-${String(index + 1).padStart(3, '0')}`,
    path: source.path,
    previewUrl: source.previewUrl,
    label: `Source ${String(index + 1).padStart(2, '0')} / ${getSourceDate(source.path)}`,
    enabled: true,
    focalPoint: [0.5, 0.45],
    cropMode: 'contain-7x3',
    width: 1680,
    height: 720,
  }));
}

export function createDefaultTimeline(assets = createDefaultAssets(), { fps = 24, previewDuration = 10 } = {}) {
  const enabledAssets = assets.filter((asset) => asset.enabled !== false);
  const totalFrames = Math.max(1, Math.round(fps * previewDuration));
  const frameSpan = Math.max(1, Math.floor(totalFrames / Math.max(1, enabledAssets.length)));

  return enabledAssets.map((asset, index) => {
    const fromFrame = Math.min(index * frameSpan, totalFrames - 1);
    const toFrame = index === enabledAssets.length - 1 ? totalFrames - 1 : Math.min((index + 1) * frameSpan - 1, totalFrames - 1);
    return {
      id: `segment-${String(index + 1).padStart(3, '0')}`,
      fromFrame,
      toFrame,
      sourceImageId: asset.id,
      prompt: createImageReferencePrompt(asset),
      negativePrompt: 'low detail, text artifacts, flicker, broken geometry, hard crop',
      transitionMode: index === 0 ? 'image-reference-start' : 'image-reference-morph',
    };
  });
}

export function createDefaultPreset() {
  const model = getDefaultModel();
  const assets = createDefaultAssets();

  return {
    schemaVersion: '0.1.0',
    presetName: 'future-wall-morph-study-01',
    target: {
      sourceResolution: [1680, 720],
      previewResolution: [896, 384],
      reviewPreviewResolution: [1344, 576],
      finalResolution: [1680, 720],
      aspectRatio: '7:3',
      fps: 24,
      durationSeconds: 15,
    },
    model: {
      modelId: model.id,
      label: model.label,
      repository: model.repository,
      file: model.file,
      license: model.license,
      status: model.status,
      risk: model.risk,
    },
    assets,
    timeline: createDefaultTimeline(assets, { fps: 24, previewDuration: 10 }),
    generation: {
      sampler: 'DPM++ 2M Karras',
      scheduler: 'Karras',
      steps: 25,
      cfgScale: 7,
      seedMode: 'fixed',
      seed: 123456,
    },
    imageMorph: {
      sourceImageStrength: 0.84,
      denoiseStrength: 0.38,
      imageInfluenceDecay: 0.18,
      transitionDuration: 10,
      transitionEasing: 'ease-in-out',
      holdFramesBeforeMorph: 2,
      structuralLockStrength: 0.78,
      fogMaskAssistance: true,
    },
    motion: {
      zoom: 1.02,
      panX: 0,
      panY: -0.01,
      rotation: 0,
      depthWarpStrength: 0.3,
      cameraPathPreset: 'slow-push',
      loopMode: 'loopable-return',
      cadence: 2,
      fps: 24,
    },
    prompt: {
      positive:
        'image-reference driven Future Wall morph using the selected pre-rendered source frame at each keyframe; preserve 1680x720 composition and panoramic edges',
      negative: 'text, watermark, flicker, edge collapse, low detail, duplicated objects',
      stylePreset: 'image-reference-morph',
      interpolationMode: 'weighted-keyframes',
    },
    look: {
      contrast: 1.1,
      fogEmphasis: 0.6,
      bloom: 0.2,
      grain: 0.05,
      vignette: 0.12,
      monochromeToColourBias: 0.45,
    },
    output: {
      previewDuration: 10,
      renderRange: [0, 359],
      outputFormat: 'webm',
      outputFolder: 'outputs/previews',
      takeNotes: '',
      productionNotes: '',
      renderQuality: 'fast-preview',
    },
  };
}
