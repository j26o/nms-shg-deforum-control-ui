export function createDeforumPromptText(segment, fallbackPositive = '', fallbackNegative = '') {
  const positive = (segment.prompt ?? fallbackPositive).trim();
  const negative = (segment.negativePrompt ?? fallbackNegative).trim();

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
