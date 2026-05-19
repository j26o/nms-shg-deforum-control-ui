import { afterEach, describe, expect, it, vi } from 'vitest';
import { createDefaultPreset } from '../config/defaultPreset.js';
import { getModelById } from '../config/modelOptions.js';
import { createHuggingFaceDeforumPayload, queueHuggingFaceDeforumRender } from './huggingFaceDeforumAdapter.js';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('hugging face deforum adapter', () => {
  it('creates a credential-free Deforum image-keyframe payload', () => {
    const preset = createDefaultPreset();
    const payload = createHuggingFaceDeforumPayload(preset, getModelById('realvisxl-v5'));

    expect(payload.backend).toBe('huggingface-deforum');
    expect(payload.target.previewResolution).toEqual([896, 384]);
    expect(payload.target.maxFrames).toBe(480);
    expect(payload.target.fps).toBe(60);
    expect(payload.output.format).toBe('mp4');
    expect(payload.model.file).toBe('RealVisXL_V5.0_fp16.safetensors');
    expect(payload.assets).toHaveLength(preset.assets.length);
    expect(payload.timeline).toHaveLength(preset.timeline.length);
    expect(payload.timeline[0].sourceImageId).toBe(payload.assets[0].id);
    expect(payload.timeline[0].prompt).toContain('visionary future Singapore cityscape');
    expect(payload.timeline[0].prompt).toContain('image-reference source for this keyframe');
    expect(payload.timeline[0].promptText).toContain('--neg');
    expect(JSON.stringify(payload)).not.toContain('hf_');
  });

  it('resolves creative prompt guides into the remote generation payload', () => {
    const preset = {
      ...createDefaultPreset(),
      timeline: [
        {
          id: 'node-maritime-guide',
          fromFrame: 0,
          toFrame: 0,
          sourceImageId: 'image-001',
          creativeGuideId: 'deep-night-maritime-horizon-band',
          transitionMode: 'image-reference-node',
        },
      ],
    };
    const payload = createHuggingFaceDeforumPayload(preset);

    expect(payload.timeline[0].creativeGuideId).toBe('deep-night-maritime-horizon-band');
    expect(payload.timeline[0].creativeGuideLabel).toBe('Deep Night Maritime Horizon Band');
    expect(payload.timeline[0].prompt).toContain('Extreme long-distance maritime view');
    expect(payload.timeline[0].promptText).toContain('--neg vanishing perspective');
  });

  it('submits through the local proxy and returns normalized take job metadata', async () => {
    const preset = createDefaultPreset();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        jobId: 'hf-job-001',
        status: 'complete',
        artifactUrl: 'https://example.test/output.mp4',
        settingsFilePath: 'https://example.test/settings.json',
        frameCount: 240,
        fps: 24,
        renderDurationMs: 120000,
        settings: {
          backend: 'huggingface-deforum',
          target: { maxFrames: 240 },
        },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const job = await queueHuggingFaceDeforumRender(preset, getModelById('sd15-baseline'), { pollIntervalMs: 0 });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    const body = JSON.parse(init.body);

    expect(url).toBe('/hf-deforum/jobs');
    expect(init.headers).not.toHaveProperty('authorization');
    expect(body.backend).toBe('huggingface-deforum');
    expect(body.assets[0].path).toContain('assets/images/source/');
    expect(job.backend).toBe('huggingface-deforum');
    expect(job.remoteJobId).toBe('hf-job-001');
    expect(job.outputPath).toBe('https://example.test/output.mp4');
    expect(job.backendSettingsFilePath).toBe('https://example.test/settings.json');
    expect(job.renderSettings.backend).toBe('huggingface-deforum');
  });

  it('polls unfinished remote jobs until completion', async () => {
    const preset = createDefaultPreset();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ jobId: 'hf-job-002', status: 'queued' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          jobId: 'hf-job-002',
          status: 'complete',
          outputPath: 'hf://artifact/hf-job-002.mp4',
        }),
      });
    vi.stubGlobal('fetch', fetchMock);

    const job = await queueHuggingFaceDeforumRender(preset, undefined, { pollIntervalMs: 0, maxPolls: 2 });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][0]).toBe('/hf-deforum/jobs/hf-job-002');
    expect(job.status).toBe('complete');
    expect(job.outputPath).toBe('hf://artifact/hf-job-002.mp4');
  });
});
