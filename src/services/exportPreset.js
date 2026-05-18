import { createExportablePreset } from './presetSchema.js';

export function exportPresetJson(preset) {
  return JSON.stringify(createExportablePreset(preset), null, 2);
}

export function exportPresetReport(preset, candidateTake) {
  const exportable = createExportablePreset(preset);
  const take = candidateTake ?? null;
  const enabledAssets = exportable.assets.filter((asset) => asset.enabled !== false);

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
    '## Timeline',
    '',
    ...exportable.timeline.map(
      (segment) =>
        `- ${segment.fromFrame}-${segment.toFrame}: ${segment.sourceImageId} | ${segment.transitionMode} | ${segment.prompt}`,
    ),
    '',
    '## Assets',
    '',
    ...enabledAssets.map((asset) => `- ${asset.id}: ${asset.path}`),
    '',
    '## Candidate Take',
    '',
    take
      ? `- ${take.id}: ${take.model.modelId ?? take.model.id}, seed ${take.seed}, ${take.previewResolution.join('x')}, ${take.renderDurationMs}ms`
      : '- No candidate take selected.',
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
