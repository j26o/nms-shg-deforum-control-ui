import { getDefaultModel } from './modelOptions.js';
import { defaultSettingPresetId, getThematicSettingPreset } from './thematicSettingPresets.js';

const DEFAULT_SOURCE_IMAGE_COUNT = 8;
const DEFAULT_FPS = 60;
const DEFAULT_DURATION_SECONDS = 8;

export const defaultCreativeDirectionPrompt = [
  'A visionary future Singapore cityscape across Marina Bay, featuring NS Square floating civic platform, curved waterfront grandstand, Wetlands by the Bay with lush layered greenery and waterways, and the Singapore Founders Memorial with sculptural contemporary architecture.',
  'Blend iconic elements like Marina Bay Sands, Gardens by the Bay Supertrees, and advanced sustainable eco-architecture with vertical greenery and organic forms.',
  'Atmospheric mist and particle-based fluid simulations flow across the scene, forming wave-like motion layers inspired by ocean currents and wind, with soft volumetric fog, drifting haze, and dynamic particle trails.',
  'Extreme long-distance maritime view, island as a flat horizontal band across the entire frame, deep night scene, seen sideways from far offshore over calm dark open ocean.',
  'Black night sky, dark open sea, city the only source of light, ultra-long telephoto compression, orthographic flat horizon band, no vanishing perspective, zero depth recession, purely horizontal layered composition.',
  'Dense atmospheric mist flows in thick horizontal bands across the island at night, dissolving building edges into soft watercolor bleeds, with deep navy and midnight blue washes, warm amber and soft pink light glowing from within the mist.',
  'Wide cinematic 1680x720 panoramic frame, ethereal, nostalgic, sci-fi realism, long exposure softness.',
].join(' ');

export const defaultCreativeDirectionNegativePrompt = [
  'text',
  'watermark',
  'logo',
  'hard black border',
  'cropped panorama',
  'duplicated skyline',
  'broken skyline',
  'melted buildings',
  'jagged silhouettes',
  'harsh ink outlines',
  'white contour lines',
  'neon edge tracing',
  'posterized edges',
  'starfield',
  'white speckle particles',
  'bokeh dots',
  'road lanes',
  'highway perspective',
  'strong vanishing point',
  'close foreground objects',
  'street-level view',
  'bright daylight',
  'harsh sunlight',
  'oversaturated cyan',
  'crushed blacks',
  'blown highlights',
  'flicker',
  'low detail',
  'noisy water reflections',
  'text artifacts',
  'broken geometry',
].join(', ');

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
    defaultCreativeDirectionPrompt,
    `${asset.label} is the required target image for this keyframe.`,
    'Match the selected source frame composition, skyline, architecture, atmosphere, silhouettes, lighting, waterline, and 1680x720 panoramic edges.',
    'Do not invent a new city, new geometry, abstract line art, mosaic patterns, or a different camera angle.',
    'Morph smoothly into the next referenced source image with restrained 2D motion while keeping the source-frame identity dominant.',
  ].join(' ');
}

export function createDefaultAssets() {
  return sourceImages.slice(0, DEFAULT_SOURCE_IMAGE_COUNT).map((source, index) => ({
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

export function createDefaultTimeline(assets = createDefaultAssets(), { fps = DEFAULT_FPS, previewDuration = DEFAULT_DURATION_SECONDS } = {}) {
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
      negativePrompt: defaultCreativeDirectionNegativePrompt,
      transitionMode: index === 0 ? 'image-reference-start' : 'image-reference-morph',
    };
  });
}

export function createDefaultPreset() {
  const model = getDefaultModel();
  const assets = createDefaultAssets();
  const settingPreset = getThematicSettingPreset(defaultSettingPresetId);

  return {
    schemaVersion: '0.1.0',
    presetName: 'future-wall-morph-study-01',
    settingPresetId: settingPreset.id,
    target: {
      sourceResolution: [1680, 720],
      previewResolution: [896, 384],
      reviewPreviewResolution: [1344, 576],
      finalResolution: [1680, 720],
      aspectRatio: '7:3',
      fps: DEFAULT_FPS,
      durationSeconds: DEFAULT_DURATION_SECONDS,
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
    timeline: createDefaultTimeline(assets, { fps: DEFAULT_FPS, previewDuration: DEFAULT_DURATION_SECONDS }),
    generation: {
      sampler: 'DPM++ 2M Karras',
      scheduler: 'Karras',
      steps: settingPreset.generation.steps,
      cfgScale: settingPreset.generation.cfgScale,
      seedMode: 'fixed',
      seed: 123456,
    },
    imageMorph: {
      sourceImageStrength: settingPreset.imageMorph.sourceImageStrength,
      denoiseStrength: settingPreset.imageMorph.denoiseStrength,
      imageInfluenceDecay: settingPreset.imageMorph.imageInfluenceDecay,
      transitionDuration: settingPreset.imageMorph.transitionDuration,
      transitionEasing: 'ease-in-out',
      holdFramesBeforeMorph: settingPreset.imageMorph.holdFramesBeforeMorph,
      structuralLockStrength: settingPreset.imageMorph.structuralLockStrength,
      fogMaskAssistance: true,
    },
    motion: {
      zoom: settingPreset.motion.zoom,
      panX: settingPreset.motion.panX,
      panY: settingPreset.motion.panY,
      rotation: settingPreset.motion.rotation,
      depthWarpStrength: settingPreset.motion.depthWarpStrength,
      cameraPathPreset: settingPreset.motion.cameraPathPreset,
      loopMode: 'loopable-return',
      cadence: settingPreset.motion.cadence,
      fps: DEFAULT_FPS,
    },
    prompt: {
      positive: defaultCreativeDirectionPrompt,
      negative: defaultCreativeDirectionNegativePrompt,
      stylePreset: 'image-reference-morph',
      interpolationMode: 'weighted-keyframes',
    },
    look: {
      contrast: settingPreset.look.contrast,
      fogEmphasis: settingPreset.look.fogEmphasis,
      bloom: settingPreset.look.bloom,
      grain: settingPreset.look.grain,
      vignette: settingPreset.look.vignette,
      monochromeToColourBias: settingPreset.look.monochromeToColourBias,
    },
    output: {
      previewDuration: DEFAULT_DURATION_SECONDS,
      renderRange: [0, DEFAULT_FPS * DEFAULT_DURATION_SECONDS - 1],
      outputFormat: 'webm',
      outputFolder: 'outputs/previews',
      takeNotes: '',
      productionNotes: '',
      renderQuality: 'fast-preview',
    },
  };
}
