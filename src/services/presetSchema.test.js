import { describe, expect, it } from 'vitest';
import { createDefaultPreset } from '../config/defaultPreset.js';
import { exportDeforumSettingsJson, exportPresetJson, exportPresetReport } from './exportPreset.js';
import { validateAsset, validatePreset } from './presetSchema.js';

describe('preset schema contract', () => {
  it('accepts the default 7:3 preset with model metadata', () => {
    const preset = createDefaultPreset();
    const result = validatePreset(preset);

    expect(result.valid).toBe(true);
    expect(preset.target.sourceResolution).toEqual([1680, 720]);
    expect(preset.target.aspectRatio).toBe('7:3');
    expect(preset.model.repository).toBeTruthy();
    expect(preset.model.file).toMatch(/\.safetensors$/);
  });

  it('rejects absolute paths and unexpected source dimensions', () => {
    const errors = validateAsset({
      id: 'image-bad',
      path: 'D:\\renders\\source.png',
      enabled: true,
      width: 1920,
      height: 1080,
      cropMode: 'contain-7x3',
    });

    expect(errors).toContain('image-bad must not use an absolute Windows path.');
    expect(errors).toContain('image-bad must be 1680x720 or explicitly marked as a crop/pad test.');
  });

  it('exports JSON and a readable report with model and take metadata', () => {
    const preset = createDefaultPreset();
    const json = JSON.parse(exportPresetJson(preset));
    const report = exportPresetReport(preset, {
      id: 'take-001',
      model: preset.model,
      seed: preset.generation.seed,
      previewResolution: preset.target.previewResolution,
      renderDurationMs: 9000,
    });

    expect(json.model.modelId).toBe('sd15-baseline');
    expect(report).toContain('take-001');
    expect(report).toContain(preset.model.file);
  });

  it('exports candidate Deforum settings with backend metadata', () => {
    const preset = createDefaultPreset();
    const exported = JSON.parse(
      exportDeforumSettingsJson({
        id: 'take-real-001',
        jobId: 'a1111-001',
        backend: 'a1111-deforum',
        model: preset.model,
        checkpointFile: preset.model.file,
        seed: preset.generation.seed,
        previewResolution: preset.target.previewResolution,
        frameCount: 240,
        fps: 24,
        renderDurationMs: 453000,
        outputPath: 'D:\\outputs\\runid',
        settingsFilePath: 'D:\\stable-diffusion-webui\\runid.txt',
        outputSettingsPattern: 'D:\\outputs\\runid\\*_settings.txt',
        outputVideoPattern: 'D:\\outputs\\runid\\*.mp4',
        renderSettings: {
          W: 896,
          H: 384,
          max_frames: 240,
          prompts: {
            0: 'prompt --neg negative',
          },
        },
      }),
    );

    expect(exported.backend).toBe('a1111-deforum');
    expect(exported.settings.max_frames).toBe(240);
    expect(exported.settingsFilePath).toContain('runid.txt');
  });
});
