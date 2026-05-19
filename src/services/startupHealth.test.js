import { afterEach, describe, expect, it, vi } from 'vitest';
import { runStartupChecks } from './startupHealth.js';

afterEach(() => {
  vi.restoreAllMocks();
});

function jsonResponse(body) {
  return {
    ok: true,
    json: async () => body,
  };
}

describe('startup health checks', () => {
  it('marks local A1111 ready when Deforum API responds', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url) => {
        if (url === '/a1111-deforum/status') return Promise.resolve(jsonResponse({ ready: true, apiVersion: '1.0' }));
        if (url === '/hf-deforum/status') return Promise.resolve(jsonResponse({ configured: false }));
        return Promise.reject(new Error(`Unexpected URL ${url}`));
      }),
    );

    const result = await runStartupChecks({ timeoutMs: 50 });
    expect(result.phase).toBe('complete');
    expect(result.steps.find((step) => step.id === 'a1111')?.status).toBe('ready');
    expect(result.steps.find((step) => step.id === 'hf')?.status).toBe('optional');
  });

  it('allows UI-only mode when local A1111 is not ready', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url) => {
        if (url === '/hf-deforum/status') return Promise.resolve(jsonResponse({ configured: false }));
        return Promise.reject(new Error(`Offline ${url}`));
      }),
    );

    const result = await runStartupChecks({ timeoutMs: 0 });
    expect(result.phase).toBe('complete');
    expect(result.steps.find((step) => step.id === 'a1111')?.status).toBe('offline');
    expect(result.message).toBe('Startup checks complete.');
  });
});
