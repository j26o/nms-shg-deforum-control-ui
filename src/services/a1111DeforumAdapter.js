import { normaliseRenderConfig } from './renderAdapter.js';
import { createDeforumPromptSchedule } from './deforumPromptSchedule.js';

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function formatNumberSchedule(value) {
  if (!Number.isFinite(value)) {
    return `0: (${value})`;
  }

  const rounded = Number.isInteger(value) ? value : Number.parseFloat(value.toFixed(4));
  return `0: (${rounded})`;
}

function formatStringSchedule(value) {
  return `0: (${JSON.stringify(value)})`;
}

function getPreviewResolution(renderConfig) {
  return renderConfig.target.previewResolution ?? renderConfig.target.finalResolution ?? renderConfig.target.sourceResolution;
}

function getEnabledAssets(renderConfig) {
  return (renderConfig.assets ?? []).filter((asset) => asset.enabled !== false && asset.path);
}

function resolveSourceAssetPath(path) {
  const sourceAssetRoot = import.meta.env.VITE_SOURCE_ASSET_ROOT?.trim();
  if (!sourceAssetRoot || /^[A-Za-z]:[\\/]/.test(path) || path.startsWith('\\\\')) {
    return path;
  }

  const normalizedRoot = sourceAssetRoot.replace(/[\\/]+$/, '');
  const normalizedPath = path.replace(/^assets[\\/]images[\\/]source[\\/]/, '').replace(/[\\/]+/g, '\\');
  return `${normalizedRoot}\\${normalizedPath}`;
}

function createPromptSchedule(renderConfig) {
  return createDeforumPromptSchedule(renderConfig);
}

function createInitImageSchedule(renderConfig) {
  const assetsById = new Map(getEnabledAssets(renderConfig).map((asset) => [asset.id, asset]));
  const segments = renderConfig.timeline.length > 0 ? renderConfig.timeline : [];

  const schedule = Object.fromEntries(
    segments
      .map((segment) => {
        const asset = assetsById.get(segment.sourceImageId);
        if (!asset) {
          return null;
        }

        return [String(segment.fromFrame), resolveSourceAssetPath(asset.path)];
      })
      .filter(Boolean),
  );

  if (Object.keys(schedule).length > 0) {
    return schedule;
  }

  const firstAsset = getEnabledAssets(renderConfig)[0];
  if (!firstAsset) {
    return {};
  }

  return { 0: resolveSourceAssetPath(firstAsset.path) };
}

function createSeedBehavior(seedMode) {
  switch (seedMode) {
    case 'random':
    case 'random_per_take':
      return 'random';
    case 'scheduled':
    case 'schedule':
      return 'schedule';
    case 'fixed':
    default:
      return 'fixed';
  }
}

function inferA1111OutputPaths(outdir) {
  if (!outdir) {
    return {
      settingsFilePath: '',
      outputSettingsPattern: '',
      outputVideoPattern: '',
    };
  }

  const separator = outdir.includes('\\') ? '\\' : '/';
  const normalizedOutdir = outdir.replace(/[\\/]+/g, separator);
  const parts = normalizedOutdir.split(separator).filter(Boolean);
  const runId = parts.at(-1) ?? '';
  const outputsIndex = parts.findIndex((part) => part.toLowerCase() === 'outputs');
  const root =
    outputsIndex > 0
      ? `${normalizedOutdir.startsWith(separator) ? separator : ''}${parts.slice(0, outputsIndex).join(separator)}`
      : '';

  return {
    settingsFilePath: root && runId ? `${root}${separator}${runId}.txt` : '',
    outputSettingsPattern: `${normalizedOutdir}${separator}*_settings.txt`,
    outputVideoPattern: `${normalizedOutdir}${separator}*.mp4`,
  };
}

export function createDeforumRenderSettings(preset, modelOverride) {
  const renderConfig = normaliseRenderConfig(preset, modelOverride);
  const previewResolution = getPreviewResolution(renderConfig);
  const fps = renderConfig.motion?.fps ?? renderConfig.target?.fps ?? 24;
  const previewSeconds = renderConfig.output?.previewDuration ?? renderConfig.target?.durationSeconds ?? 10;
  const maxFrames = Math.max(1, Math.round(previewSeconds * fps));
  const promptSchedule = createPromptSchedule(renderConfig);
  const initImages = createInitImageSchedule(renderConfig);
  const hasInitImages = Object.keys(initImages).length > 0;
  const useDepthWarping = (renderConfig.motion?.depthWarpStrength ?? 0) > 0;
  const sourceImageStrength = clamp(renderConfig.imageMorph?.sourceImageStrength ?? renderConfig.imageMorph?.denoiseStrength ?? 0.75, 0, 1);
  const denoiseStrength = clamp(renderConfig.imageMorph?.denoiseStrength ?? 0.5, 0, 1);
  const imageInfluenceDecay = clamp(renderConfig.imageMorph?.imageInfluenceDecay ?? 0.35, 0, 1);
  const transitionDuration = Math.max(1, Math.round(renderConfig.imageMorph?.transitionDuration ?? 72));
  const structuralLockStrength = clamp(renderConfig.imageMorph?.structuralLockStrength ?? 0.65, 0, 1);
  const modelId = renderConfig.model?.modelId ?? renderConfig.model?.id ?? '';
  const sampler = renderConfig.generation?.sampler ?? 'Euler';
  const steps = Math.max(1, Math.round(renderConfig.generation?.steps ?? 25));
  const cfgScale = Number(renderConfig.generation?.cfgScale ?? 7);
  const seed = Number(renderConfig.generation?.seed ?? -1);
  const rotation = Number(renderConfig.motion?.rotation ?? 0);
  const panX = Number(renderConfig.motion?.panX ?? 0);
  const panY = Number(renderConfig.motion?.panY ?? 0);
  const zoom = Number(renderConfig.motion?.zoom ?? 1);
  const cadence = Math.max(1, Math.round(renderConfig.motion?.cadence ?? 1));
  const cameraPathPreset = renderConfig.motion?.cameraPathPreset ?? 'None';

  const settings = {
    batch_name: `${renderConfig.presetName}-deforum`,
    W: previewResolution[0],
    H: previewResolution[1],
    max_frames: maxFrames,
    fps,
    steps,
    seed,
    sampler,
    seed_behavior: createSeedBehavior(renderConfig.generation?.seedMode),
    seed_iter_N: 1,
    use_init: hasInitImages,
    strength: denoiseStrength,
    strength_0_no_init: true,
    init_image: hasInitImages ? Object.values(initImages)[0] : '',
    use_mask: false,
    use_alpha_as_mask: false,
    prompts: promptSchedule,
    positive_prompts: renderConfig.prompt?.positive ?? '',
    negative_prompts: renderConfig.prompt?.negative ?? '',
    animation_mode: useDepthWarping ? '3D' : '2D',
    border: 'replicate',
    angle: formatNumberSchedule(rotation),
    zoom: formatNumberSchedule(zoom),
    translation_x: formatNumberSchedule(panX),
    translation_y: formatNumberSchedule(panY),
    translation_z: formatNumberSchedule(useDepthWarping ? 1.75 + (zoom - 1) * 12 : 1.75),
    transform_center_x: formatNumberSchedule(0.5),
    transform_center_y: formatNumberSchedule(0.5),
    rotation_3d_x: formatNumberSchedule(0),
    rotation_3d_y: formatNumberSchedule(0),
    rotation_3d_z: formatNumberSchedule(rotation),
    enable_perspective_flip: false,
    perspective_flip_theta: formatNumberSchedule(0),
    perspective_flip_phi: formatNumberSchedule(0),
    perspective_flip_gamma: formatNumberSchedule(0),
    perspective_flip_fv: formatNumberSchedule(53),
    noise_schedule: formatNumberSchedule(imageInfluenceDecay),
    strength_schedule: formatNumberSchedule(denoiseStrength),
    contrast_schedule: formatNumberSchedule(renderConfig.look?.contrast ?? 1),
    cfg_scale_schedule: formatNumberSchedule(cfgScale),
    enable_steps_scheduling: false,
    steps_schedule: formatNumberSchedule(steps),
    fov_schedule: formatNumberSchedule(70),
    aspect_ratio_schedule: formatNumberSchedule(1),
    aspect_ratio_use_old_formula: false,
    near_schedule: formatNumberSchedule(200),
    far_schedule: formatNumberSchedule(10000),
    seed_schedule: createSeedBehavior(renderConfig.generation?.seedMode) === 'schedule' ? formatNumberSchedule(seed) : `0:(s)`,
    pix2pix_img_cfg_scale_schedule: formatNumberSchedule(1.5),
    enable_subseed_scheduling: false,
    subseed_schedule: formatNumberSchedule(seed),
    subseed_strength_schedule: formatNumberSchedule(0),
    enable_sampler_scheduling: false,
    sampler_schedule: formatStringSchedule(sampler),
    use_noise_mask: false,
    mask_schedule: formatStringSchedule('{video_mask}'),
    noise_mask_schedule: formatStringSchedule('{video_mask}'),
    enable_checkpoint_scheduling: Boolean(renderConfig.model?.file),
    checkpoint_schedule: formatStringSchedule(renderConfig.model?.file ?? modelId),
    enable_clipskip_scheduling: false,
    clipskip_schedule: formatNumberSchedule(2),
    enable_noise_multiplier_scheduling: true,
    noise_multiplier_schedule: formatNumberSchedule(1.05),
    resume_from_timestring: false,
    resume_timestring: '',
    enable_ddim_eta_scheduling: false,
    ddim_eta_schedule: formatNumberSchedule(0),
    enable_ancestral_eta_scheduling: false,
    ancestral_eta_schedule: formatNumberSchedule(1),
    amount_schedule: formatNumberSchedule(0.1),
    kernel_schedule: formatNumberSchedule(5),
    sigma_schedule: formatNumberSchedule(1),
    threshold_schedule: formatNumberSchedule(0),
    color_coherence: renderConfig.look?.monochromeToColourBias > 0.5 ? 'LAB' : 'None',
    color_coherence_image_path: '',
    color_coherence_video_every_N_frames: 1,
    color_force_grayscale: false,
    legacy_colormatch: false,
    diffusion_cadence: cadence,
    optical_flow_cadence: 'None',
    cadence_flow_factor_schedule: formatNumberSchedule(1),
    optical_flow_redo_generation: 'None',
    redo_flow_factor_schedule: formatNumberSchedule(1),
    diffusion_redo: '0',
    noise_type: 'perlin',
    perlin_octaves: 4,
    perlin_persistence: 0.5,
    use_depth_warping: useDepthWarping,
    depth_algorithm: 'Midas-3-Hybrid',
    midas_weight: useDepthWarping ? clamp(renderConfig.motion?.depthWarpStrength ?? 0.3, 0, 1) : 0.2,
    padding_mode: 'border',
    sampling_mode: 'bicubic',
    save_depth_maps: false,
    video_init_path: '',
    extract_nth_frame: 1,
    extract_from_frame: 0,
    extract_to_frame: -1,
    overwrite_extracted_frames: false,
    use_mask_video: false,
    video_mask_path: '',
    hybrid_comp_alpha_schedule: formatNumberSchedule(0.5),
    hybrid_comp_mask_blend_alpha_schedule: formatNumberSchedule(0.5),
    hybrid_comp_mask_contrast_schedule: formatNumberSchedule(1),
    hybrid_comp_mask_auto_contrast_cutoff_high_schedule: formatNumberSchedule(100),
    hybrid_comp_mask_auto_contrast_cutoff_low_schedule: formatNumberSchedule(0),
    hybrid_flow_factor_schedule: formatNumberSchedule(1),
    hybrid_generate_inputframes: hasInitImages,
    hybrid_generate_human_masks: 'None',
    hybrid_use_first_frame_as_init_image: hasInitImages,
    hybrid_motion: 'None',
    hybrid_motion_use_prev_img: false,
    hybrid_flow_consistency: false,
    hybrid_consistency_blur: 2,
    hybrid_flow_method: 'RAFT',
    hybrid_composite: 'None',
    hybrid_use_init_image: hasInitImages,
    hybrid_comp_mask_type: 'None',
    hybrid_comp_mask_inverse: false,
    hybrid_comp_mask_equalize: 'None',
    hybrid_comp_mask_auto_contrast: false,
    hybrid_comp_save_extra_frames: false,
    parseq_manifest: '',
    parseq_use_deltas: true,
    parseq_non_schedule_overrides: true,
    use_looper: hasInitImages && Object.keys(initImages).length > 1,
    init_images: JSON.stringify(initImages, null, 4),
    image_strength_schedule: formatNumberSchedule(sourceImageStrength),
    blendFactorMax: formatNumberSchedule(sourceImageStrength),
    blendFactorSlope: formatNumberSchedule(imageInfluenceDecay),
    tweening_frames_schedule: formatNumberSchedule(transitionDuration),
    color_correction_factor: formatNumberSchedule(structuralLockStrength),
    cn_1_overwrite_frames: true,
    cn_1_vid_path: '',
    cn_1_mask_vid_path: '',
    cn_1_enabled: false,
    cn_1_low_vram: false,
    cn_1_pixel_perfect: false,
    cn_1_module: 'none',
    cn_1_model: 'None',
    cn_1_weight: formatNumberSchedule(1),
    cn_1_guidance_start: formatNumberSchedule(0),
    cn_1_guidance_end: formatNumberSchedule(1),
    cn_1_processor_res: 64,
    cn_1_threshold_a: 64,
    cn_1_threshold_b: 64,
    cn_1_resize_mode: 'Inner Fit (Scale to Fit)',
    cn_1_control_mode: 'Balanced',
    cn_1_loopback_mode: false,
    cn_2_overwrite_frames: true,
    cn_2_vid_path: '',
    cn_2_mask_vid_path: '',
    cn_2_enabled: false,
    cn_2_low_vram: false,
    cn_2_pixel_perfect: false,
    cn_2_module: 'none',
    cn_2_model: 'None',
    cn_2_weight: formatNumberSchedule(1),
    cn_2_guidance_start: formatNumberSchedule(0),
    cn_2_guidance_end: formatNumberSchedule(1),
    cn_2_processor_res: 64,
    cn_2_threshold_a: 64,
    cn_2_threshold_b: 64,
    cn_2_resize_mode: 'Inner Fit (Scale to Fit)',
    cn_2_control_mode: 'Balanced',
    cn_2_loopback_mode: false,
    cn_3_overwrite_frames: true,
    cn_3_vid_path: '',
    cn_3_mask_vid_path: '',
    cn_3_enabled: false,
    cn_3_low_vram: false,
    cn_3_pixel_perfect: false,
    cn_3_module: 'none',
    cn_3_model: 'None',
    cn_3_weight: formatNumberSchedule(1),
    cn_3_guidance_start: formatNumberSchedule(0),
    cn_3_guidance_end: formatNumberSchedule(1),
    cn_3_processor_res: 64,
    cn_3_threshold_a: 64,
    cn_3_threshold_b: 64,
    cn_3_resize_mode: 'Inner Fit (Scale to Fit)',
    cn_3_control_mode: 'Balanced',
    cn_3_loopback_mode: false,
    cn_4_overwrite_frames: true,
    cn_4_vid_path: '',
    cn_4_mask_vid_path: '',
    cn_4_enabled: false,
    cn_4_low_vram: false,
    cn_4_pixel_perfect: false,
    cn_4_module: 'none',
    cn_4_model: 'None',
    cn_4_weight: formatNumberSchedule(1),
    cn_4_guidance_start: formatNumberSchedule(0),
    cn_4_guidance_end: formatNumberSchedule(1),
    cn_4_processor_res: 64,
    cn_4_threshold_a: 64,
    cn_4_threshold_b: 64,
    cn_4_resize_mode: 'Inner Fit (Scale to Fit)',
    cn_4_control_mode: 'Balanced',
    cn_4_loopback_mode: false,
    skip_video_creation: false,
    make_gif: false,
    delete_imgs: false,
  };

  return settings;
}

export async function getDeforumApiStatus() {
  const response = await fetch('/a1111-deforum/api_version');
  if (!response.ok) {
    throw new Error(`Deforum API status failed: ${response.status}`);
  }
  return response.json();
}

async function readDeforumError(response) {
  const text = await response.text();
  try {
    const json = JSON.parse(text);
    return json.error || json.message || text;
  } catch {
    return text;
  }
}

export async function queueA1111DeforumRender(preset, modelOverride) {
  const renderConfig = normaliseRenderConfig(preset, modelOverride);
  const settings = createDeforumRenderSettings(preset, modelOverride);
  const createdAt = new Date().toISOString();
  const startedAt = performance.now();
  const response = await fetch('/a1111-deforum/run', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      settings,
      allowedParams: Object.keys(settings),
    }),
  });

  if (!response.ok) {
    const message = await readDeforumError(response);
    throw new Error(`Deforum render failed: ${response.status} ${message}`);
  }

  const result = await response.json();
  const completedAt = new Date().toISOString();
  const estimateSeconds = Math.max(1, Math.round((performance.now() - startedAt) / 1000));
  const outputPaths = inferA1111OutputPaths(result.outdir);

  return {
    id: `a1111-${Date.now()}`,
    status: 'complete',
    createdAt,
    completedAt,
    estimateSeconds,
    outputPath: result.outdir,
    error: '',
    logs: [
      'Submitted via Automatic1111 Deforum simple API.',
      `Model: ${renderConfig.model.modelId ?? renderConfig.model.id}`,
      `Resolution: ${settings.W}x${settings.H}`,
      `Frames: ${settings.max_frames}`,
      `Prompt keys: ${Object.keys(settings.prompts ?? {}).join(', ')}`,
      `Source images: ${Object.keys(JSON.parse(settings.init_images || '{}')).length}`,
      `Output: ${result.outdir}`,
    ],
    renderConfig,
    renderSettings: settings,
    backend: 'a1111-deforum',
    backendResponse: result,
    backendSettingsFilePath: outputPaths.settingsFilePath,
    outputSettingsPattern: outputPaths.outputSettingsPattern,
    outputVideoPattern: outputPaths.outputVideoPattern,
  };
}

export async function queueA1111DeforumSmokeRender(preset, modelOverride) {
  return queueA1111DeforumRender(preset, modelOverride);
}
