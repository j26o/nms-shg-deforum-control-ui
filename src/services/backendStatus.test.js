import { afterEach, describe, expect, it, vi } from 'vitest';
import { checkBackendStatus, createInitialBackendStatus } from './backendStatus.js';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function jsonResponse(body, ok = true, status = 200) {
  return {
    ok,
    status,
    text: async () => JSON.stringify(body),
  };
}

describe('backend status service', () => {
  it('creates a checking state for the selected backend', () => {
    expect(createInitialBackendStatus('huggingface-deforum')).toMatchObject({
      backend: 'huggingface-deforum',
      label: 'Hugging Face',
      status: 'checking',
      ready: false,
    });
  });

  it('maps Local A1111 ready status into toolbar metadata', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ ready: true, apiVersion: '1.0' })));

    const status = await checkBackendStatus('a1111-deforum');

    expect(status.ready).toBe(true);
    expect(status.status).toBe('ready');
    expect(status.detail).toContain('1.0');
  });

  it('maps Hugging Face partial setup into not configured state', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ configured: false, tokenConfigured: true, endpointConfigured: false })));

    const status = await checkBackendStatus('huggingface-deforum');

    expect(status.ready).toBe(false);
    expect(status.status).toBe('not-configured');
    expect(status.detail).toContain('incomplete');
  });

  it('maps Hugging Face smoke fallback mode into not configured state', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({
          configured: true,
          realDeforumReady: false,
          health: {
            renderMode: 'a1111',
            a1111Configured: false,
            fallbackMorphEnabled: true,
          },
        }),
      ),
    );

    const status = await checkBackendStatus('huggingface-deforum');

    expect(status.ready).toBe(false);
    expect(status.status).toBe('not-configured');
    expect(status.detail).toContain('crossfade MP4s');
  });

  it('maps Hugging Face real Deforum health into ready state', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({
          configured: true,
          realDeforumReady: true,
          health: {
            renderMode: 'a1111',
            a1111Configured: true,
            fallbackMorphEnabled: false,
          },
        }),
      ),
    );

    const status = await checkBackendStatus('huggingface-deforum');

    expect(status.ready).toBe(true);
    expect(status.status).toBe('ready');
    expect(status.detail).toContain('real Deforum');
  });
});
