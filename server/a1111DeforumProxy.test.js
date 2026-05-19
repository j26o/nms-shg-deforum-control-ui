import { afterEach, describe, expect, it, vi } from 'vitest';
import { submitA1111DeforumRun } from './a1111DeforumProxy.js';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('a1111 deforum body proxy', () => {
  it('submits body settings through the Deforum batch API and polls for output', async () => {
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
        text: async () => JSON.stringify({ id: 'job-001', status: 'SUCCEEDED', outdir: 'D:/outputs/run-001' }),
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
      { A1111_BASE_URL: 'http://127.0.0.1:7860', A1111_DEFORUM_POLL_INTERVAL_MS: '0', A1111_DEFORUM_MAX_POLLS: '1' },
    );

    const [submitUrl, submitInit] = fetchMock.mock.calls[0];
    const [, statusInit] = fetchMock.mock.calls[1];
    const submitBody = JSON.parse(submitInit.body);

    expect(result.outdir).toBe('D:/outputs/run-001');
    expect(result.api).toBe('deforum-api');
    expect(result.jobId).toBe('job-001');
    expect(submitUrl).toBe('http://127.0.0.1:7860/deforum_api/batches');
    expect(submitInit.method).toBe('POST');
    expect(submitInit.headers).toEqual({ 'content-type': 'application/json' });
    expect(submitBody.deforum_settings.prompts['0']).toContain('future city');
    expect(statusInit).toBeUndefined();
  });

  it('falls back to the query-only simple API when the batch API is missing', async () => {
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
        text: async () => JSON.stringify({ outdir: 'D:/outputs/simple-run-001' }),
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

    expect(result.outdir).toBe('D:/outputs/simple-run-001');
    expect(simpleInit).toEqual({ method: 'POST' });
    expect(upstreamUrl.href).toContain('http://127.0.0.1:7860/deforum/run?');
    expect(upstreamUrl.searchParams.get('allowed_params')).toBe('prompts;init_images');
    expect(settings.prompts['0']).toContain('future city');
  });
});
