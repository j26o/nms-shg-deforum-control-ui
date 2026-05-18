import { getDefaultModel } from './modelOptions.js';

const sourceImages = [
  {
    path: 'assets/images/source/20260430/kingsmendigitalexperience_httpss.mj.runtRaOGJpbHmk_httpss.mj._6a54c52c-a453-47d3-adee-34f15cbcdbba_0.png',
    previewUrl: new URL(
      '../../assets/images/source/20260430/kingsmendigitalexperience_httpss.mj.runtRaOGJpbHmk_httpss.mj._6a54c52c-a453-47d3-adee-34f15cbcdbba_0.png',
      import.meta.url,
    ).href,
  },
  {
    path: 'assets/images/source/20260430/kingsmendigitalexperience_httpss.mj.runtRaOGJpbHmk_httpss.mj._6a54c52c-a453-47d3-adee-34f15cbcdbba_1.png',
    previewUrl: new URL(
      '../../assets/images/source/20260430/kingsmendigitalexperience_httpss.mj.runtRaOGJpbHmk_httpss.mj._6a54c52c-a453-47d3-adee-34f15cbcdbba_1.png',
      import.meta.url,
    ).href,
  },
  {
    path: 'assets/images/source/20260430/kingsmendigitalexperience_httpss.mj.runtRaOGJpbHmk_httpss.mj._6a54c52c-a453-47d3-adee-34f15cbcdbba_2.png',
    previewUrl: new URL(
      '../../assets/images/source/20260430/kingsmendigitalexperience_httpss.mj.runtRaOGJpbHmk_httpss.mj._6a54c52c-a453-47d3-adee-34f15cbcdbba_2.png',
      import.meta.url,
    ).href,
  },
  {
    path: 'assets/images/source/20260430/kingsmendigitalexperience_httpss.mj.runtRaOGJpbHmk_httpss.mj._6a54c52c-a453-47d3-adee-34f15cbcdbba_3.png',
    previewUrl: new URL(
      '../../assets/images/source/20260430/kingsmendigitalexperience_httpss.mj.runtRaOGJpbHmk_httpss.mj._6a54c52c-a453-47d3-adee-34f15cbcdbba_3.png',
      import.meta.url,
    ).href,
  },
  {
    path: 'assets/images/source/20260430/kingsmendigitalexperience_httpss.mj.runtRaOGJpbHmk_httpss.mj._68952bf3-a981-440f-887e-75762f1e9c16_0.png',
    previewUrl: new URL(
      '../../assets/images/source/20260430/kingsmendigitalexperience_httpss.mj.runtRaOGJpbHmk_httpss.mj._68952bf3-a981-440f-887e-75762f1e9c16_0.png',
      import.meta.url,
    ).href,
  },
  {
    path: 'assets/images/source/20260430/kingsmendigitalexperience_httpss.mj.runtRaOGJpbHmk_httpss.mj._68952bf3-a981-440f-887e-75762f1e9c16_1.png',
    previewUrl: new URL(
      '../../assets/images/source/20260430/kingsmendigitalexperience_httpss.mj.runtRaOGJpbHmk_httpss.mj._68952bf3-a981-440f-887e-75762f1e9c16_1.png',
      import.meta.url,
    ).href,
  },
];

export function createDefaultAssets() {
  return sourceImages.map((source, index) => ({
    id: `image-${String(index + 1).padStart(3, '0')}`,
    path: source.path,
    previewUrl: source.previewUrl,
    label: `Source ${String(index + 1).padStart(2, '0')}`,
    enabled: true,
    focalPoint: [0.5, 0.45],
    cropMode: 'contain-7x3',
    width: 1680,
    height: 720,
  }));
}

export function createDefaultTimeline(assets = createDefaultAssets()) {
  return assets.slice(0, 3).map((asset, index) => {
    const fromFrame = index * 120;
    return {
      id: `segment-${String(index + 1).padStart(3, '0')}`,
      fromFrame,
      toFrame: fromFrame + 119,
      sourceImageId: asset.id,
      prompt:
        index === 0
          ? 'monochrome mist landscape, strong silhouettes, poetic future wall composition'
          : 'dense futuristic city architecture, atmospheric depth, stable panoramic composition',
      negativePrompt: 'low detail, text artifacts, flicker, broken geometry, hard crop',
      transitionMode: index === 0 ? 'hold-then-morph' : 'sequential-morph',
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
    timeline: createDefaultTimeline(assets),
    generation: {
      sampler: 'DPM++ 2M Karras',
      scheduler: 'Karras',
      steps: 25,
      cfgScale: 7,
      seedMode: 'fixed',
      seed: 123456,
    },
    imageMorph: {
      sourceImageStrength: 0.78,
      denoiseStrength: 0.52,
      imageInfluenceDecay: 0.35,
      transitionDuration: 72,
      transitionEasing: 'ease-in-out',
      holdFramesBeforeMorph: 24,
      structuralLockStrength: 0.65,
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
      positive: 'poetic panoramic future wall, mist, architecture emerging from landscape, stable silhouette language',
      negative: 'text, watermark, flicker, edge collapse, low detail, duplicated objects',
      stylePreset: 'mist-to-city',
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
