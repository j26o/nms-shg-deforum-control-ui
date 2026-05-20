import { mkdir, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { checkA1111DeforumStatus, submitA1111DeforumRun } from './a1111DeforumProxy.js';

const testOutputRoot = path.join(process.cwd(), 'outputs', '.a1111-proxy-test');
const ffmpegPath = path.join(process.cwd(), 'render-tools', 'ffmpeg', 'ffmpeg-8.1.1-full_build', 'bin', 'ffmpeg.exe');

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  return rm(testOutputRoot, { recursive: true, force: true });
});

describe('a1111 deforum body proxy', () => {
  it('reports local Deforum status through the A1111 bridge', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ version: '1.0' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify([{ title: 'sd15' }]),
      });
    vi.stubGlobal('fetch', fetchMock);

    const status = await checkA1111DeforumStatus({ A1111_BASE_URL: 'http://127.0.0.1:7860' });

    expect(status.ready).toBe(true);
    expect(status.status).toBe('ready');
    expect(status.apiVersion).toBe('1.0');
    expect(fetchMock.mock.calls[0][0]).toBe('http://127.0.0.1:7860/deforum/api_version');
  });

  it('returns actionable status text when local A1111 is unreachable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('fetch failed')));

    const status = await checkA1111DeforumStatus({ A1111_BASE_URL: 'http://127.0.0.1:7860' });

    expect(status.ready).toBe(false);
    expect(status.status).toBe('offline');
    expect(status.error).toContain('Local A1111 backend is not reachable');
    expect(status.error).toContain('pnpm dev:backend');
  });

  it('submits body settings through the Deforum batch API and polls for output', async () => {
    const img2imgOutputRoot = path.join(testOutputRoot, 'img2img-images');
    const outputDir = path.join(testOutputRoot, 'full-run');
    await mkdir(path.join(img2imgOutputRoot, 'future-wall-morph-study-01-deforum'), { recursive: true });
    await mkdir(outputDir, { recursive: true });
    await writeFile(path.join(outputDir, 'render.mp4'), 'mp4-data');

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 202,
        text: async () => JSON.stringify({ batch_id: 'batch-001', job_ids: ['job-001'] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ id: 'job-001', status: 'SUCCEEDED', outdir: outputDir }),
      });
    vi.stubGlobal('fetch', fetchMock);

    const result = await submitA1111DeforumRun(
      {
        settings: {
          batch_name: 'future-wall-morph-study-01-deforum',
          prompts: { 0: 'future city --neg text' },
          init_images: '{"0":"assets/images/source/test.png"}',
        },
        allowedParams: ['prompts', 'init_images'],
      },
      {
        A1111_BASE_URL: 'http://127.0.0.1:7860',
        A1111_DEFORUM_POLL_INTERVAL_MS: '0',
        A1111_DEFORUM_MAX_POLLS: '1',
        A1111_IMG2IMG_OUTPUT_DIR: img2imgOutputRoot,
        FFMPEG_PATH: process.execPath,
      },
    );

    const [submitUrl, submitInit] = fetchMock.mock.calls[0];
    const [, statusInit] = fetchMock.mock.calls[1];
    const submitBody = JSON.parse(submitInit.body);

    expect(result.outdir).toBe(outputDir);
    expect(result.artifactUrl).toContain('/render-artifacts/file?path=');
    expect(result.artifactFileName).toBe('render.mp4');
    expect(result.api).toBe('deforum-api');
    expect(result.jobId).toBe('job-001');
    expect(submitUrl).toBe('http://127.0.0.1:7860/deforum_api/batches');
    expect(submitInit.method).toBe('POST');
    expect(submitInit.headers).toEqual({ 'content-type': 'application/json' });
    expect(submitBody.options_overrides).toEqual({ deforum_ffmpeg_location: process.execPath });
    expect(submitBody.deforum_settings.batch_name).toBe('future-wall-morph-study-01-deforum-02');
    expect(submitBody.deforum_settings.prompts['0']).toContain('future city');
    expect(JSON.parse(submitBody.deforum_settings.init_images)['0']).toBe(path.resolve(process.cwd(), 'assets/images/source/test.png'));
    expect(statusInit).toBeUndefined();
  });

  it('increments batch names past existing numbered output folders', async () => {
    const img2imgOutputRoot = path.join(testOutputRoot, 'img2img-numbered');
    const outputDir = path.join(testOutputRoot, 'numbered-run');
    await mkdir(path.join(img2imgOutputRoot, 'future-wall-morph-study-01-deforum'), { recursive: true });
    await mkdir(path.join(img2imgOutputRoot, 'future-wall-morph-study-01-deforum-02'), { recursive: true });
    await mkdir(outputDir, { recursive: true });
    await writeFile(path.join(outputDir, 'render.mp4'), 'mp4-data');

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 202,
        text: async () => JSON.stringify({ batch_id: 'batch-001b', job_ids: ['job-001b'] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ id: 'job-001b', status: 'SUCCEEDED', outdir: outputDir }),
      });
    vi.stubGlobal('fetch', fetchMock);

    await submitA1111DeforumRun(
      {
        settings: {
          batch_name: 'future-wall-morph-study-01-deforum',
          prompts: { 0: 'future city' },
        },
        allowedParams: ['batch_name', 'prompts'],
      },
      {
        A1111_BASE_URL: 'http://127.0.0.1:7860',
        A1111_DEFORUM_POLL_INTERVAL_MS: '0',
        A1111_DEFORUM_MAX_POLLS: '1',
        A1111_IMG2IMG_OUTPUT_DIR: img2imgOutputRoot,
      },
    );

    const submitBody = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(submitBody.deforum_settings.batch_name).toBe('future-wall-morph-study-01-deforum-03');
  });

  it('fails completed jobs when Deforum only writes settings files', async () => {
    const outputDir = path.join(testOutputRoot, 'settings-only-run');
    await mkdir(outputDir, { recursive: true });
    await writeFile(path.join(outputDir, '20260519143000_settings.txt'), 'settings');

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 202,
        text: async () => JSON.stringify({ batch_id: 'batch-002', job_ids: ['job-002'] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ id: 'job-002', status: 'SUCCEEDED', outdir: outputDir }),
      });
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      submitA1111DeforumRun(
        {
          settings: { prompts: { 0: 'future city' } },
          allowedParams: ['prompts'],
        },
        { A1111_BASE_URL: 'http://127.0.0.1:7860', A1111_DEFORUM_POLL_INTERVAL_MS: '0', A1111_DEFORUM_MAX_POLLS: '1' },
      ),
    ).rejects.toThrow(/settings txt but did not generate frames/);
  });

  it('does not stitch partial frames before the Deforum job is complete', async () => {
    const outputDir = path.join(testOutputRoot, 'running-frame-run');
    await mkdir(outputDir, { recursive: true });
    await writeFile(path.join(outputDir, '20260519143000_000000000.png'), 'frame');

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 202,
        text: async () => JSON.stringify({ batch_id: 'batch-003', job_ids: ['job-003'] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ id: 'job-003', status: 'RUNNING', outdir: outputDir }),
      });
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      submitA1111DeforumRun(
        {
          settings: { prompts: { 0: 'future city' } },
          allowedParams: ['prompts'],
        },
        {
          A1111_BASE_URL: 'http://127.0.0.1:7860',
          A1111_DEFORUM_POLL_INTERVAL_MS: '0',
          A1111_DEFORUM_MAX_POLLS: '1',
          FFMPEG_PATH: path.join(testOutputRoot, 'missing-ffmpeg.exe'),
        },
      ),
    ).rejects.toThrow(/timed out/);
  });

  it('falls back to the query-only simple API when the batch API is missing', async () => {
    const img2imgOutputRoot = path.join(testOutputRoot, 'simple-img2img');
    const outputDir = path.join(testOutputRoot, 'simple-run');
    await mkdir(path.join(img2imgOutputRoot, 'future-wall-morph-study-01-deforum'), { recursive: true });
    await mkdir(outputDir, { recursive: true });
    await writeFile(path.join(outputDir, 'simple.mp4'), 'mp4-data');

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: async () => JSON.stringify({ error: 'missing' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ outdir: outputDir }),
      });
    vi.stubGlobal('fetch', fetchMock);

    const result = await submitA1111DeforumRun(
      {
        settings: {
          batch_name: 'future-wall-morph-study-01-deforum',
          prompts: { 0: 'future city --neg text' },
          init_images: '{"0":"assets/images/source/test.png"}',
        },
        allowedParams: ['prompts', 'init_images'],
      },
      { A1111_BASE_URL: 'http://127.0.0.1:7860', A1111_IMG2IMG_OUTPUT_DIR: img2imgOutputRoot },
    );

    const [simpleUrl, simpleInit] = fetchMock.mock.calls[1];
    const upstreamUrl = new URL(simpleUrl);
    const settings = JSON.parse(upstreamUrl.searchParams.get('settings_json'));

    expect(result.outdir).toBe(outputDir);
    expect(result.artifactFileName).toBe('simple.mp4');
    expect(simpleInit).toEqual({ method: 'POST' });
    expect(upstreamUrl.href).toContain('http://127.0.0.1:7860/deforum/run?');
    expect(upstreamUrl.searchParams.get('allowed_params')).toBe('prompts;init_images');
    expect(settings.batch_name).toBe('future-wall-morph-study-01-deforum-02');
    expect(settings.prompts['0']).toContain('future city');
    expect(JSON.parse(settings.init_images)['0']).toBe(path.resolve(process.cwd(), 'assets/images/source/test.png'));
  });

  it('retries multi-image generation errors as adjacent Deforum segments', async () => {
    const img2imgOutputRoot = path.join(testOutputRoot, 'chunk-img2img');
    const segmentOneDir = path.join(testOutputRoot, 'segment-one');
    const segmentTwoDir = path.join(testOutputRoot, 'segment-two');
    await mkdir(segmentOneDir, { recursive: true });
    await mkdir(segmentTwoDir, { recursive: true });
    spawnSync(ffmpegPath, ['-y', '-f', 'lavfi', '-i', 'color=c=black:s=16x16:d=0.1', '-pix_fmt', 'yuv420p', path.join(segmentOneDir, 'segment-one.mp4')]);
    spawnSync(ffmpegPath, ['-y', '-f', 'lavfi', '-i', 'color=c=white:s=16x16:d=0.1', '-pix_fmt', 'yuv420p', path.join(segmentTwoDir, 'segment-two.mp4')]);

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 202,
        text: async () => JSON.stringify({ batch_id: 'batch-full', job_ids: ['job-full'] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ id: 'job-full', status: 'FAILED', phase: 'GENERATING', message: 'Generation error.' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 202,
        text: async () => JSON.stringify({ batch_id: 'batch-seg-1', job_ids: ['job-seg-1'] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ id: 'job-seg-1', status: 'SUCCEEDED', outdir: segmentOneDir }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 202,
        text: async () => JSON.stringify({ batch_id: 'batch-seg-2', job_ids: ['job-seg-2'] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ id: 'job-seg-2', status: 'SUCCEEDED', outdir: segmentTwoDir }),
      });
    vi.stubGlobal('fetch', fetchMock);

    const result = await submitA1111DeforumRun(
      {
        settings: {
          batch_name: 'future-wall-morph-study-01-deforum',
          prompts: { 0: 'source one', 60: 'source two', 120: 'source three' },
          init_images: JSON.stringify({
            0: 'assets/images/source/one.png',
            60: 'assets/images/source/two.png',
            120: 'assets/images/source/three.png',
          }),
        },
        allowedParams: ['prompts', 'init_images'],
      },
      {
        A1111_BASE_URL: 'http://127.0.0.1:7860',
        A1111_DEFORUM_POLL_INTERVAL_MS: '0',
        A1111_DEFORUM_MAX_POLLS: '1',
        A1111_IMG2IMG_OUTPUT_DIR: img2imgOutputRoot,
        FFMPEG_PATH: ffmpegPath,
      },
    );

    const firstSegmentBody = JSON.parse(fetchMock.mock.calls[2][1].body).deforum_settings;
    const secondSegmentBody = JSON.parse(fetchMock.mock.calls[4][1].body).deforum_settings;

    expect(result.api).toBe('deforum-api-chunked');
    expect(result.chunkedFallback).toBe(true);
    expect(result.artifactFileName).toBe('stitched.mp4');
    expect(result.segmentResults).toHaveLength(2);
    expect(firstSegmentBody.batch_name).toContain('seg-01');
    expect(firstSegmentBody.max_frames).toBe(60);
    expect(Object.keys(JSON.parse(firstSegmentBody.init_images))).toEqual(['0', '59']);
    expect(secondSegmentBody.batch_name).toContain('seg-02');
    expect(secondSegmentBody.max_frames).toBe(60);
  });
});
