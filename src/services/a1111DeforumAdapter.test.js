import { afterEach, describe, expect, it, vi } from 'vitest';
import { createDefaultPreset } from '../config/defaultPreset.js';
import { getModelById } from '../config/modelOptions.js';
import { createDeforumRenderSettings, queueA1111DeforumRender } from './a1111DeforumAdapter.js';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('a1111 deforum adapter', () => {
  it('translates the reviewed preset into Deforum settings', () => {
    const preset = createDefaultPreset();
    const settings = createDeforumRenderSettings(preset, getModelById('sdxl-base'));

    expect(settings.W).toBe(896);
    expect(settings.H).toBe(384);
    expect(settings.max_frames).toBe(480);
    expect(settings.fps).toBe(60);
    expect(settings.sampler).toBe('DPM++ 2M Karras');
    expect(settings.scale).toBe(7);
    expect(settings.cfg_scale_schedule).toBe('0: (7)');
    expect(settings.seed_behavior).toBe('fixed');
    expect(settings.animation_mode).toBe('3D');
    expect(settings.use_depth_warping).toBe(true);
    expect(settings.diffusion_cadence).toBe(2);
    expect(Object.keys(settings.prompts)).toHaveLength(8);
    expect(settings.prompts['0']).not.toContain('visionary future Singapore cityscape');
    expect(settings.prompts['0']).toContain('image-reference source for this keyframe');
    expect(settings.prompts['0']).not.toContain('--neg');
    expect(settings.animation_prompts_positive).toContain('Extreme long-distance maritime view');
    expect(settings.animation_prompts_negative).toContain('strong vanishing point');
    expect(settings.controlnet_enabled).toBe(false);
    expect(settings.cn_1_overwrite_frames).toBe('');
    expect(settings.cn_1_loopback_mode).toBe('');
    expect(settings.cn_5_model).toBe('None');

    const initImages = JSON.parse(settings.init_images);
    expect(Object.keys(initImages)).toEqual(Object.keys(settings.prompts));
    expect(initImages['0']).toMatch(/assets[\\/]images[\\/]source[\\/]/);
    expect(Object.values(initImages)).toHaveLength(8);
    expect(settings.sampler_schedule).toBe('0: ("DPM++ 2M Karras")');
    expect(settings.enable_checkpoint_scheduling).toBe(true);
    expect(settings.checkpoint_schedule).toBe('0: ("sd_xl_base_1.0.safetensors")');
  });

  it('posts the translated settings to the Deforum run endpoint', async () => {
    const preset = createDefaultPreset();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        outdir: 'D:/nms-shg-deforum-control-ui-main/render-tools/stable-diffusion-webui/outputs/img2img-images/runid',
        artifactUrl: '/render-artifacts/file?path=D%3A%2Fout.mp4',
        artifactPath: 'D:/out.mp4',
        artifactFileName: 'out.mp4',
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const job = await queueA1111DeforumRender(preset);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(init.body);
    const settings = body.settings;

    expect(url).toBe('/a1111-deforum/run');
    expect(init.method).toBe('POST');
    expect(init.headers).toEqual({ 'content-type': 'application/json' });
    expect(body.allowedParams).toContain('init_images');
    expect(settings.prompts['0']).not.toContain('--neg');
    expect(settings.prompts['0']).not.toContain('visionary future Singapore cityscape');
    expect(settings.prompts['0']).toContain('image-reference source for this keyframe');
    expect(settings.animation_prompts_positive).toContain('visionary future Singapore cityscape');
    expect(settings.animation_prompts_negative).toContain('strong vanishing point');
    expect(settings.init_images).toMatch(/assets[\\/]images[\\/]source[\\/]/);
    expect(job.status).toBe('complete');
    expect(job.outputPath).toBe('D:/nms-shg-deforum-control-ui-main/render-tools/stable-diffusion-webui/outputs/img2img-images/runid');
    expect(job.artifactUrl).toBe('/render-artifacts/file?path=D%3A%2Fout.mp4');
    expect(job.artifactPath).toBe('D:/out.mp4');
    expect(job.artifactFileName).toBe('out.mp4');
    expect(job.backendSettingsFilePath).toBe('D:/nms-shg-deforum-control-ui-main/render-tools/stable-diffusion-webui/runid.txt');
    expect(job.outputSettingsPattern).toBe('D:/nms-shg-deforum-control-ui-main/render-tools/stable-diffusion-webui/outputs/img2img-images/runid/*_settings.txt');
    expect(job.outputVideoPattern).toBe('D:/nms-shg-deforum-control-ui-main/render-tools/stable-diffusion-webui/outputs/img2img-images/runid/*.mp4');
    expect(Object.keys(job.renderSettings.prompts)).toHaveLength(8);
  });

  it('moves inline --neg prompt nodes into the Deforum negative field', () => {
    const preset = {
      ...createDefaultPreset(),
      timeline: [
        {
          id: 'node-001',
          fromFrame: 60,
          toFrame: 60,
          sourceImageId: 'image-001',
          prompt: 'a beautiful coconut --neg photo, realistic',
          negativePrompt: 'ignored duplicate',
          transitionMode: 'image-reference-node',
        },
      ],
    };
    const settings = createDeforumRenderSettings(preset);

    expect(settings.prompts).toEqual({
      60: 'a beautiful coconut',
    });
    expect(settings.animation_prompts_negative).toContain('photo');
    expect(settings.animation_prompts_negative).toContain('realistic');
  });

  it('resolves creative prompt guides into Deforum prompt schedules', () => {
    const preset = {
      ...createDefaultPreset(),
      timeline: [
        {
          id: 'node-creative-guide',
          fromFrame: 0,
          toFrame: 0,
          sourceImageId: 'image-001',
          creativeGuideId: 'future-marina-bay-fluid-memory',
          transitionMode: 'image-reference-node',
        },
      ],
    };
    const settings = createDeforumRenderSettings(preset);

    expect(settings.prompts['0']).toContain('visionary future Singapore cityscape');
    expect(settings.prompts['0']).not.toContain('--neg');
    expect(settings.animation_prompts_positive).toContain('visionary future Singapore cityscape');
    expect(settings.animation_prompts_negative).toContain('hard frame');
  });
});
