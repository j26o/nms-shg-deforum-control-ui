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
    expect(settings.max_frames).toBe(240);
    expect(settings.sampler).toBe('DPM++ 2M Karras');
    expect(settings.cfg_scale_schedule).toBe('0: (7)');
    expect(settings.seed_behavior).toBe('fixed');
    expect(settings.animation_mode).toBe('3D');
    expect(settings.use_depth_warping).toBe(true);
    expect(settings.diffusion_cadence).toBe(2);
    expect(Object.keys(settings.prompts)).toHaveLength(preset.assets.length);
    expect(settings.prompts['0']).toContain('primary visual reference frame');
    expect(settings.prompts['0']).toContain('--neg');

    const initImages = JSON.parse(settings.init_images);
    expect(Object.keys(initImages)).toEqual(Object.keys(settings.prompts));
    expect(initImages['0']).toMatch(/assets[\\/]images[\\/]source[\\/]/);
    expect(Object.values(initImages)).toHaveLength(preset.assets.length);
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
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const job = await queueA1111DeforumRender(preset);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    const requestUrl = new URL(url, 'http://127.0.0.1:5173');
    const settings = JSON.parse(requestUrl.searchParams.get('settings_json'));

    expect(init).toEqual({ method: 'POST' });
    expect(requestUrl.pathname).toBe('/a1111/deforum/run');
    expect(requestUrl.searchParams.get('allowed_params')).toContain('init_images');
    expect(settings.prompts['0']).toContain('--neg');
    expect(settings.prompts['0']).toContain('primary visual reference frame');
    expect(settings.init_images).toMatch(/assets[\\/]images[\\/]source[\\/]/);
    expect(job.status).toBe('complete');
    expect(job.outputPath).toBe('D:/nms-shg-deforum-control-ui-main/render-tools/stable-diffusion-webui/outputs/img2img-images/runid');
    expect(job.backendSettingsFilePath).toBe('D:/nms-shg-deforum-control-ui-main/render-tools/stable-diffusion-webui/runid.txt');
    expect(job.outputSettingsPattern).toBe('D:/nms-shg-deforum-control-ui-main/render-tools/stable-diffusion-webui/outputs/img2img-images/runid/*_settings.txt');
    expect(job.outputVideoPattern).toBe('D:/nms-shg-deforum-control-ui-main/render-tools/stable-diffusion-webui/outputs/img2img-images/runid/*.mp4');
    expect(Object.keys(job.renderSettings.prompts)).toHaveLength(preset.assets.length);
  });
});
