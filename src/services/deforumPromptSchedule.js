import { getCreativePromptGuide } from '../config/creativePromptGuides.js';

export function resolveSegmentPromptFields(segment, fallbackPositive = '', fallbackNegative = '') {
  const guide = getCreativePromptGuide(segment.creativeGuideId);
  return {
    prompt: segment.prompt ?? guide?.prompt ?? fallbackPositive,
    negativePrompt: segment.negativePrompt ?? guide?.negativePrompt ?? fallbackNegative,
    creativeGuideId: guide?.id ?? segment.creativeGuideId ?? '',
    creativeGuideLabel: guide?.label ?? '',
  };
}

export function createDeforumPromptText(segment, fallbackPositive = '', fallbackNegative = '') {
  const resolved = resolveSegmentPromptFields(segment, fallbackPositive, fallbackNegative);
  const positive = resolved.prompt.trim();
  const negative = resolved.negativePrompt.trim();

  if (!negative || positive.includes('--neg')) {
    return positive;
  }

  return `${positive} --neg ${negative}`.trim();
}

export function createDeforumPromptSchedule(presetOrConfig) {
  const fallbackPositive = presetOrConfig.prompt?.positive ?? '';
  const fallbackNegative = presetOrConfig.prompt?.negative ?? '';
  const timeline =
    presetOrConfig.timeline?.length > 0
      ? presetOrConfig.timeline
      : [{ fromFrame: 0, prompt: fallbackPositive, negativePrompt: fallbackNegative }];

  return Object.fromEntries(
    [...timeline]
      .sort((left, right) => left.fromFrame - right.fromFrame)
      .map((segment) => [String(segment.fromFrame), createDeforumPromptText(segment, fallbackPositive, fallbackNegative)]),
  );
}
