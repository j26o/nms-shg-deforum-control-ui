import { describe, expect, it } from 'vitest';
import { createDefaultPreset } from '../config/defaultPreset.js';
import { getModelById } from '../config/modelOptions.js';
import { normaliseRenderConfig } from './renderAdapter.js';
import { createTakeFromJob, queueMockRender } from './mockRenderAdapter.js';

describe('render adapter contract', () => {
  it('normalises preset data without exposing UI-only state', () => {
    const preset = createDefaultPreset();
    const config = normaliseRenderConfig(preset, getModelById('sdxl-base'));

    expect(config.model.id).toBe('sdxl-base');
    expect(config.target.aspectRatio).toBe('7:3');
    expect(config.assets.length).toBe(8);
    expect(config.timeline.length).toBe(config.assets.length);
    expect(config.timeline[0].prompt).toContain('visionary future Singapore cityscape');
    expect(config.timeline[0].prompt).toContain('image-reference source for this keyframe');
    expect(config.timeline.at(-1).toFrame).toBe(479);
  });

  it('creates deterministic mock job metadata and comparable takes', () => {
    const preset = createDefaultPreset();
    const job = queueMockRender(preset, getModelById('realvisxl-v5'));
    const take = createTakeFromJob(job);

    expect(job.status).toBe('complete');
    expect(job.outputPath).toBe('');
    expect(job.previewLabel).toContain('realvisxl-v5');
    expect(job.simulatedPreview.thumbnailUrl).toBeTruthy();
    expect(take.model.id).toBe('realvisxl-v5');
    expect(take.backend).toBe('mock');
    expect(take.hasFileArtifact).toBe(false);
    expect(take.simulatedPreview.label).toContain('Source');
    expect(take.checkpointFile).toBe('RealVisXL_V5.0_fp16.safetensors');
    expect(take.previewResolution).toEqual([896, 384]);
    expect(take.renderDurationMs).toBeGreaterThan(0);
  });
});
