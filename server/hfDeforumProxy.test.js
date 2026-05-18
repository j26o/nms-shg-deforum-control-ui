// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { getHuggingFaceToken, normaliseHuggingFaceJobResponse } from './hfDeforumProxy.js';

describe('hf deforum proxy helpers', () => {
  it('uses explicit environment tokens without exposing token details in job normalization', async () => {
    const token = await getHuggingFaceToken({ HF_TOKEN: 'hf_test_secret' });
    const normalized = normaliseHuggingFaceJobResponse({
      jobId: 'job-001',
      status: 'complete',
      artifactUrl: 'https://example.test/out.mp4',
      settings: { backend: 'huggingface-deforum' },
    });

    expect(token).toBe('hf_test_secret');
    expect(JSON.stringify(normalized)).not.toContain('hf_test_secret');
    expect(normalized.jobId).toBe('job-001');
    expect(normalized.outputPath).toBe('https://example.test/out.mp4');
    expect(normalized.renderSettings.backend).toBe('huggingface-deforum');
  });
});
