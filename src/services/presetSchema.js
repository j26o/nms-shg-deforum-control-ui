const SOURCE_WIDTH = 1680;
const SOURCE_HEIGHT = 720;

export function validateAsset(asset) {
  const errors = [];

  if (!asset.id) errors.push('Asset is missing id.');
  if (!asset.path) errors.push(`${asset.id ?? 'Asset'} is missing path.`);
  if (asset.path && /^(?:[a-z]+:)?\/\//i.test(asset.path)) {
    errors.push(`${asset.id} must use a local relative path.`);
  }
  if (asset.path && /^[A-Za-z]:[\\/]/.test(asset.path)) {
    errors.push(`${asset.id} must not use an absolute Windows path.`);
  }
  if (asset.enabled !== false) {
    const isExpectedSource = asset.width === SOURCE_WIDTH && asset.height === SOURCE_HEIGHT;
    const isCropPadTest = asset.cropMode === 'crop-test' || asset.cropMode === 'pad-test';
    if (!isExpectedSource && !isCropPadTest) {
      errors.push(`${asset.id} must be 1680x720 or explicitly marked as a crop/pad test.`);
    }
  }

  return errors;
}

export function validatePreset(preset) {
  const errors = [];

  if (!preset.schemaVersion) errors.push('Preset is missing schemaVersion.');
  if (!preset.presetName) errors.push('Preset is missing presetName.');
  if (preset.target?.aspectRatio !== '7:3') errors.push('Preset target must preserve 7:3 aspect ratio.');
  if (preset.target?.sourceResolution?.[0] !== SOURCE_WIDTH || preset.target?.sourceResolution?.[1] !== SOURCE_HEIGHT) {
    errors.push('Preset sourceResolution must be 1680x720.');
  }
  if (!preset.model?.modelId || !preset.model?.repository || !preset.model?.file || !preset.model?.license) {
    errors.push('Preset export must include modelId, repository, file, and license.');
  }

  const assetIds = new Set((preset.assets ?? []).map((asset) => asset.id));
  preset.assets?.forEach((asset) => errors.push(...validateAsset(asset)));
  preset.timeline?.forEach((segment) => {
    if (!assetIds.has(segment.sourceImageId)) {
      errors.push(`${segment.id} references missing source image ${segment.sourceImageId}.`);
    }
    if (!Number.isInteger(segment.fromFrame) || !Number.isInteger(segment.toFrame) || segment.toFrame < segment.fromFrame) {
      errors.push(`${segment.id} has an invalid frame range.`);
    }
  });

  return { valid: errors.length === 0, errors };
}

export function createExportablePreset(preset) {
  const validation = validatePreset(preset);
  if (!validation.valid) {
    throw new Error(validation.errors.join('\n'));
  }

  return {
    ...preset,
    exportedAt: new Date().toISOString(),
  };
}
