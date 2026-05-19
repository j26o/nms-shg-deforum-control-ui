import { createExportablePreset } from './presetSchema.js';

export function exportPresetJson(preset) {
  return JSON.stringify(createExportablePreset(preset), null, 2);
}

export function exportDeforumSettingsJson(candidateTake) {
  if (!candidateTake?.renderSettings) {
    throw new Error('No Deforum settings are available for the selected candidate take.');
  }

  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      takeId: candidateTake.id,
      jobId: candidateTake.jobId,
      backend: candidateTake.backend,
      model: candidateTake.model,
      checkpointFile: candidateTake.checkpointFile,
      seed: candidateTake.seed,
      previewResolution: candidateTake.previewResolution,
      frameCount: candidateTake.frameCount,
      fps: candidateTake.fps,
      renderDurationMs: candidateTake.renderDurationMs,
      outputPath: candidateTake.outputPath,
      settingsFilePath: candidateTake.settingsFilePath,
      outputSettingsPattern: candidateTake.outputSettingsPattern,
      outputVideoPattern: candidateTake.outputVideoPattern,
      settings: candidateTake.renderSettings,
    },
    null,
    2,
  );
}

export function exportPresetReport(preset, candidateTake) {
  const exportable = createExportablePreset(preset);
  const take = candidateTake ?? null;
  const enabledAssets = exportable.assets.filter((asset) => asset.enabled !== false);
  const candidateLines = take
    ? [
        `- ID: ${take.id}`,
        `- Backend: ${take.backend ?? 'unknown'}`,
        `- Model: ${take.model.modelId ?? take.model.id}`,
        `- Checkpoint: ${take.checkpointFile ?? take.model.file ?? 'unknown'}`,
        `- Seed: ${take.seed}`,
        `- Preview: ${take.previewResolution.join('x')}`,
        `- Frames/FPS: ${take.frameCount ?? 'unknown'} / ${take.fps ?? 'unknown'}`,
        `- Render duration: ${take.renderDurationMs}ms`,
        `- Output: ${take.outputPath ?? 'unknown'}`,
        `- Settings file: ${take.settingsFilePath || 'not available'}`,
        `- Output settings pattern: ${take.outputSettingsPattern || 'not available'}`,
      ]
    : ['- No candidate take selected.'];

  return [
    `# ${exportable.presetName}`,
    '',
    `Exported: ${exportable.exportedAt}`,
    `Schema: ${exportable.schemaVersion}`,
    `Aspect: ${exportable.target.aspectRatio} (${exportable.target.sourceResolution.join('x')})`,
    `Preview: ${exportable.target.previewResolution.join('x')} / Review: ${exportable.target.reviewPreviewResolution.join('x')}`,
    '',
    '## Model',
    '',
    `- ID: ${exportable.model.modelId}`,
    `- Repository: ${exportable.model.repository}`,
    `- Checkpoint: ${exportable.model.file}`,
    `- Licence: ${exportable.model.license}`,
    `- Status: ${exportable.model.status}`,
    '',
    '## Prompt Nodes',
    '',
    ...exportable.timeline.map(
      (segment) =>
        `- ${segment.fromFrame}: ${segment.sourceImageId} | ${segment.prompt}${segment.negativePrompt ? ` --neg ${segment.negativePrompt}` : ''}`,
    ),
    '',
    '## Assets',
    '',
    ...enabledAssets.map((asset) => `- ${asset.id}: ${asset.path}`),
    '',
    '## Candidate Take',
    '',
    ...candidateLines,
    '',
    '## Production Notes',
    '',
    exportable.output.productionNotes || 'No production handoff notes entered.',
  ].join('\n');
}

export function downloadTextFile(filename, content, mimeType = 'application/json') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
