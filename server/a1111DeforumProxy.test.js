import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { checkA1111DeforumStatus, submitA1111DeforumRun } from './a1111DeforumProxy.js';

const testOutputRoot = path.join(process.cwd(), 'outputs', '.a1111-proxy-test');

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
    const outputDir = path.join(testOutputRoot, 'full-run');
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
          prompts: { 0: 'future city --neg text' },
          init_images: '{"0":"assets/images/source/test.png"}',
        },
        allowedParams: ['prompts', 'init_images'],
      },
      {
        A1111_BASE_URL: 'http://127.0.0.1:7860',
        A1111_DEFORUM_POLL_INTERVAL_MS: '0',
        A1111_DEFORUM_MAX_POLLS: '1',
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
    expect(submitBody.deforum_settings.prompts['0']).toContain('future city');
    expect(JSON.parse(submitBody.deforum_settings.init_images)['0']).toBe(path.resolve(process.cwd(), 'assets/images/source/test.png'));
    expect(statusInit).toBeUndefined();
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
    const outputDir = path.join(testOutputRoot, 'simple-run');
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
          prompts: { 0: 'future city --neg text' },
          init_images: '{"0":"assets/images/source/test.png"}',
        },
        allowedParams: ['prompts', 'init_images'],
      },
      { A1111_BASE_URL: 'http://127.0.0.1:7860' },
    );

    const [simpleUrl, simpleInit] = fetchMock.mock.calls[1];
    const upstreamUrl = new URL(simpleUrl);
    const settings = JSON.parse(upstreamUrl.searchParams.get('settings_json'));

    expect(result.outdir).toBe(outputDir);
    expect(result.artifactFileName).toBe('simple.mp4');
    expect(simpleInit).toEqual({ method: 'POST' });
    expect(upstreamUrl.href).toContain('http://127.0.0.1:7860/deforum/run?');
    expect(upstreamUrl.searchParams.get('allowed_params')).toBe('prompts;init_images');
    expect(settings.prompts['0']).toContain('future city');
    expect(JSON.parse(settings.init_images)['0']).toBe(path.resolve(process.cwd(), 'assets/images/source/test.png'));
  });
});
