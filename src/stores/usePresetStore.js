import { create } from 'zustand';
import {
  DEFAULT_NODE_SPACING_SECONDS,
  createDefaultPreset,
  defaultCreativeDirectionNegativePrompt,
  getComputedDurationSeconds,
  retimeTimelineByNodeSpacing,
} from '../config/defaultPreset.js';
import { getModelById } from '../config/modelOptions.js';
import { getThematicSettingPreset } from '../config/thematicSettingPresets.js';
import { queueA1111DeforumRender } from '../services/a1111DeforumAdapter.js';
import { queueHuggingFaceDeforumRender } from '../services/huggingFaceDeforumAdapter.js';
import { queueMockRender, createTakeFromJob } from '../services/mockRenderAdapter.js';

const defaultPreset = createDefaultPreset();

function wait(ms) {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, ms);
  });
}

function createAssetId() {
  return `image-custom-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function getPresetFps(preset) {
  return Number(preset.motion?.fps ?? preset.target?.fps) || 60;
}

function applyComputedTiming(preset) {
  const fps = getPresetFps(preset);
  const previewDuration = getComputedDurationSeconds(preset.timeline, fps);
  return {
    ...preset,
    target: {
      ...preset.target,
      fps,
      durationSeconds: previewDuration,
    },
    motion: {
      ...preset.motion,
      fps,
    },
    output: {
      ...preset.output,
      previewDuration,
      renderRange: [0, Math.max(0, Math.round(fps * previewDuration) - 1)],
    },
  };
}

function retimePreset(preset, fps = getPresetFps(preset)) {
  return applyComputedTiming({
    ...preset,
    target: {
      ...preset.target,
      fps,
    },
    motion: {
      ...preset.motion,
      fps,
    },
    timeline: retimeTimelineByNodeSpacing(preset.timeline, fps, DEFAULT_NODE_SPACING_SECONDS),
  });
}

function createTimelineSegmentForAsset(asset, timeline, prompt, fps = 60) {
  const last = timeline[timeline.length - 1];
  const frameSpan = Math.max(1, Math.round(fps * DEFAULT_NODE_SPACING_SECONDS));
  const fromFrame = last ? last.fromFrame + frameSpan : 0;
  return {
    id: `segment-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    fromFrame,
    toFrame: fromFrame + frameSpan - 1,
    sourceImageId: asset.id,
    prompt:
      prompt ??
      [
        `${asset.label} is the required target image for this keyframe.`,
        'Match the selected source frame composition, skyline, architecture, atmosphere, silhouettes, lighting, waterline, and 1680x720 panoramic edges.',
        'Do not invent a new city, new geometry, abstract line art, mosaic patterns, or a different camera angle.',
        'Morph smoothly into the next referenced source image with restrained 2D motion while keeping the source-frame identity dominant.',
      ].join(' '),
    negativePrompt: defaultCreativeDirectionNegativePrompt,
    transitionMode: 'image-reference-morph',
  };
}

function updateNested(object, group, key, value) {
  return {
    ...object,
    [group]: {
      ...object[group],
      [key]: value,
    },
  };
}

function applyGroupPatch(currentGroup, patch = {}) {
  return {
    ...currentGroup,
    ...patch,
  };
}

function createModelState(model) {
  return {
    modelId: model.id,
    label: model.label,
    repository: model.repository,
    file: model.file,
    license: model.license,
    status: model.status,
    risk: model.risk,
  };
}

export const usePresetStore = create((set, get) => ({
  preset: defaultPreset,
  selectedAssetId: defaultPreset.assets[0]?.id,
  selectedSegmentId: defaultPreset.timeline[0]?.id,
  jobs: [],
  takes: [],
  backendError: '',
  renderStatus: 'idle',
  renderProgress: 0,
  renderMessage: '',
  renderBackend: 'a1111-deforum',

  updatePresetName: (presetName) => set((state) => ({ preset: { ...state.preset, presetName } })),
  updateGroupValue: (group, key, value) => set((state) => ({ preset: updateNested(state.preset, group, key, value) })),
  updateTargetValue: (key, value) => set((state) => ({ preset: updateNested(state.preset, 'target', key, value) })),
  setRenderBackend: (renderBackend) => set({ renderBackend }),
  applySettingPreset: (settingPresetId) =>
    set((state) => {
      const settingPreset = getThematicSettingPreset(settingPresetId);
      return {
        preset: {
          ...state.preset,
          settingPresetId: settingPreset.id,
          generation: applyGroupPatch(state.preset.generation, settingPreset.generation),
          imageMorph: applyGroupPatch(state.preset.imageMorph, settingPreset.imageMorph),
          motion: applyGroupPatch(state.preset.motion, settingPreset.motion),
          look: applyGroupPatch(state.preset.look, settingPreset.look),
        },
      };
    }),
  setFps: (fpsValue) =>
    set((state) => {
      const fps = Math.max(1, Math.round(Number(fpsValue) || getPresetFps(state.preset)));
      return {
        preset: retimePreset(state.preset, fps),
      };
    }),
  selectAsset: (assetId) => set({ selectedAssetId: assetId }),
  selectSegment: (segmentId) => set({ selectedSegmentId: segmentId }),
  setModelProfile: (modelId) =>
    set((state) => {
      const model = getModelById(modelId);
      return {
        preset: {
          ...state.preset,
          model: createModelState(model),
        },
      };
    }),
  updateAsset: (assetId, patch) =>
    set((state) => ({
      preset: {
        ...state.preset,
        assets: state.preset.assets.map((asset) => (asset.id === assetId ? { ...asset, ...patch } : asset)),
      },
    })),
  addAsset: (assetDraft) =>
    set((state) => {
      const asset = {
        id: createAssetId(),
        label: assetDraft.label || `Source ${String(state.preset.assets.length + 1).padStart(2, '0')} / custom`,
        path: assetDraft.path,
        previewUrl: assetDraft.previewUrl || assetDraft.path,
        enabled: true,
        focalPoint: assetDraft.focalPoint ?? [0.5, 0.45],
        cropMode: assetDraft.cropMode || 'contain-7x3',
        width: Number(assetDraft.width) || state.preset.target.sourceResolution[0],
        height: Number(assetDraft.height) || state.preset.target.sourceResolution[1],
      };
      const segment = createTimelineSegmentForAsset(asset, state.preset.timeline, state.preset.prompt?.positive, getPresetFps(state.preset));
      const preset = applyComputedTiming({
        ...state.preset,
        assets: [...state.preset.assets, asset],
        timeline: [...state.preset.timeline, segment],
      });
      return {
        preset,
        selectedAssetId: asset.id,
        selectedSegmentId: segment.id,
      };
    }),
  removeAsset: (assetId) =>
    set((state) => {
      const assets = state.preset.assets.filter((asset) => asset.id !== assetId);
      const timeline = state.preset.timeline.filter((segment) => segment.sourceImageId !== assetId);
      const selectedAssetId = state.selectedAssetId === assetId ? assets[0]?.id : state.selectedAssetId;
      const selectedSegmentId = timeline.some((segment) => segment.id === state.selectedSegmentId) ? state.selectedSegmentId : timeline[0]?.id;
      return {
        preset: applyComputedTiming({ ...state.preset, assets, timeline }),
        selectedAssetId,
        selectedSegmentId,
      };
    }),
  moveAsset: (assetId, direction) =>
    set((state) => {
      const assets = [...state.preset.assets];
      const index = assets.findIndex((asset) => asset.id === assetId);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= assets.length) return state;
      [assets[index], assets[target]] = [assets[target], assets[index]];
      return { preset: { ...state.preset, assets } };
    }),
  addSegment: () =>
    set((state) => {
      const last = state.preset.timeline[state.preset.timeline.length - 1];
      const frameSpan = Math.max(1, Math.round(getPresetFps(state.preset) * DEFAULT_NODE_SPACING_SECONDS));
      const fromFrame = last ? last.fromFrame + frameSpan : 0;
      const segment = {
        id: `segment-${Date.now()}`,
        fromFrame,
        toFrame: fromFrame + frameSpan - 1,
        sourceImageId: state.selectedAssetId ?? state.preset.assets[0]?.id,
        prompt: state.preset.prompt.positive,
        negativePrompt: state.preset.prompt.negative,
        transitionMode: 'sequential-morph',
      };
      return {
        preset: applyComputedTiming({ ...state.preset, timeline: [...state.preset.timeline, segment] }),
        selectedAssetId: segment.sourceImageId,
        selectedSegmentId: segment.id,
      };
    }),
  duplicateSegment: (segmentId) =>
    set((state) => {
      const source = state.preset.timeline.find((segment) => segment.id === segmentId);
      if (!source) return state;
      const frameSpan = Math.max(1, Math.round(getPresetFps(state.preset) * DEFAULT_NODE_SPACING_SECONDS));
      const fromFrame = source.fromFrame + frameSpan;
      const duplicate = {
        ...source,
        id: `segment-${Date.now()}`,
        fromFrame,
        toFrame: fromFrame + frameSpan - 1,
      };
      return {
        preset: applyComputedTiming({ ...state.preset, timeline: [...state.preset.timeline, duplicate] }),
        selectedAssetId: duplicate.sourceImageId,
        selectedSegmentId: duplicate.id,
      };
    }),
  updateSegment: (segmentId, patch) =>
    set((state) => {
      const frameSpan = Math.max(1, Math.round(getPresetFps(state.preset) * DEFAULT_NODE_SPACING_SECONDS));
      const timeline = state.preset.timeline.map((segment) => {
          if (segment.id !== segmentId) return segment;
          const next = { ...segment, ...patch };
          if (Object.prototype.hasOwnProperty.call(patch, 'fromFrame') && !Object.prototype.hasOwnProperty.call(patch, 'toFrame')) {
            next.toFrame = next.fromFrame + frameSpan - 1;
          }
          return next;
        });
      return {
        preset: applyComputedTiming({
          ...state.preset,
          timeline,
        }),
      };
    }),
  deleteSegment: (segmentId) =>
    set((state) => {
      const timeline = state.preset.timeline.filter((segment) => segment.id !== segmentId);
      return {
        preset: applyComputedTiming({ ...state.preset, timeline }),
        selectedSegmentId: timeline[0]?.id,
      };
    }),
  moveSegment: (segmentId, direction) =>
    set((state) => {
      const timeline = [...state.preset.timeline];
      const index = timeline.findIndex((segment) => segment.id === segmentId);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= timeline.length) return state;
      [timeline[index], timeline[target]] = [timeline[target], timeline[index]];
      return { preset: retimePreset({ ...state.preset, timeline }) };
    }),
  queueRender: async () => {
    set({
      backendError: '',
      renderStatus: 'running',
      renderProgress: 15,
      renderMessage: 'Preview render queued.',
    });
    try {
      await wait(180);
      set({ renderProgress: 45, renderMessage: 'Building image-keyframe prompt payload.' });
      await wait(180);
      const state = get();
      const jobs = [queueMockRender(state.preset, getModelById(state.preset.model.modelId))];
      const takes = jobs.map(createTakeFromJob);
      set((current) => ({
        jobs: [...jobs, ...current.jobs],
        takes: [...takes, ...current.takes],
        renderStatus: 'complete',
        renderProgress: 100,
        renderMessage: `Preview render complete: ${takes.length} take${takes.length === 1 ? '' : 's'} saved.`,
      }));
      await wait(900);
      if (get().renderStatus === 'complete') {
        set({ renderStatus: 'idle', renderProgress: 0, renderMessage: '' });
      }
      return jobs;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      set({
        backendError: message,
        renderStatus: 'error',
        renderProgress: 0,
        renderMessage: `Preview render failed: ${message}`,
      });
      return [];
    }
  },
  queueDeforumRender: async () => {
    const { preset, renderBackend } = get();
    set({
      backendError: '',
      renderStatus: 'running',
      renderProgress: 20,
      renderMessage: renderBackend === 'huggingface-deforum' ? 'Sending Deforum payload to Hugging Face.' : 'Sending Deforum payload to Local A1111.',
    });
    try {
      const job =
        renderBackend === 'huggingface-deforum'
          ? await queueHuggingFaceDeforumRender(preset)
          : await queueA1111DeforumRender(preset);
      const take = createTakeFromJob(job);
      set((current) => ({
        jobs: [job, ...current.jobs],
        takes: [take, ...current.takes],
        renderStatus: 'complete',
        renderProgress: 100,
        renderMessage: `${renderBackend === 'huggingface-deforum' ? 'Hugging Face' : 'Local A1111'} render complete.`,
      }));
      return job;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      set({
        backendError: message,
        renderStatus: 'error',
        renderProgress: 0,
        renderMessage: `Deforum render failed: ${message}`,
      });
      return null;
    }
  },
  markCandidate: (takeId) =>
    set((state) => ({
      takes: state.takes.map((take) => ({ ...take, candidate: take.id === takeId })),
    })),
  updateTakeNotes: (takeId, notes) =>
    set((state) => ({
      takes: state.takes.map((take) => (take.id === takeId ? { ...take, notes } : take)),
    })),
}));
