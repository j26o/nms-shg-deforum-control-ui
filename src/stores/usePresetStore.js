import { create } from 'zustand';
import { createDefaultPreset } from '../config/defaultPreset.js';
import { getModelById } from '../config/modelOptions.js';
import { queueA1111DeforumRender } from '../services/a1111DeforumAdapter.js';
import { queueHuggingFaceDeforumRender } from '../services/huggingFaceDeforumAdapter.js';
import { queueMockRender, createTakeFromJob } from '../services/mockRenderAdapter.js';

const defaultPreset = createDefaultPreset();

function createAssetId() {
  return `image-custom-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function createTimelineSegmentForAsset(asset, timeline, prompt) {
  const last = timeline[timeline.length - 1];
  const fromFrame = last ? last.toFrame + 1 : 0;
  return {
    id: `segment-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    fromFrame,
    toFrame: fromFrame + 119,
    sourceImageId: asset.id,
    prompt:
      prompt ??
      [
        `Use ${asset.label} as the primary visual reference frame.`,
        'Preserve the pre-rendered image composition, atmosphere, silhouettes, and panoramic edges.',
      ].join(' '),
    negativePrompt: 'low detail, text artifacts, flicker, broken geometry, hard crop',
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

export const usePresetStore = create((set, get) => ({
  preset: defaultPreset,
  selectedAssetId: defaultPreset.assets[0]?.id,
  selectedSegmentId: defaultPreset.timeline[0]?.id,
  jobs: [],
  takes: [],
  backendError: '',
  renderBackend: 'a1111-deforum',
  compareModelIds: [defaultPreset.model.modelId],

  updatePresetName: (presetName) => set((state) => ({ preset: { ...state.preset, presetName } })),
  updateGroupValue: (group, key, value) => set((state) => ({ preset: updateNested(state.preset, group, key, value) })),
  updateTargetValue: (key, value) => set((state) => ({ preset: updateNested(state.preset, 'target', key, value) })),
  setRenderBackend: (renderBackend) => set({ renderBackend }),
  selectAsset: (assetId) => set({ selectedAssetId: assetId }),
  selectSegment: (segmentId) => set({ selectedSegmentId: segmentId }),
  setModelProfile: (modelId) =>
    set((state) => {
      const model = getModelById(modelId);
      return {
        preset: {
          ...state.preset,
          model: {
            modelId: model.id,
            label: model.label,
            repository: model.repository,
            file: model.file,
            license: model.license,
            status: model.status,
            risk: model.risk,
          },
        },
        compareModelIds: state.compareModelIds.includes(modelId) ? state.compareModelIds : [modelId],
      };
    }),
  setRuntimeModelProfile: (modelId) =>
    set((state) => {
      const model = getModelById(modelId);
      return {
        preset: {
          ...state.preset,
          model: {
            modelId: model.id,
            label: model.label,
            repository: model.repository,
            file: model.file,
            license: model.license,
            status: model.status,
            risk: model.risk,
          },
        },
        compareModelIds: [modelId],
      };
    }),
  toggleCompareModel: (modelId) =>
    set((state) => ({
      compareModelIds: state.compareModelIds.includes(modelId)
        ? state.compareModelIds.filter((id) => id !== modelId)
        : [...state.compareModelIds, modelId],
    })),
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
      const segment = createTimelineSegmentForAsset(asset, state.preset.timeline, state.preset.prompt?.positive);
      return {
        preset: {
          ...state.preset,
          assets: [...state.preset.assets, asset],
          timeline: [...state.preset.timeline, segment],
        },
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
        preset: { ...state.preset, assets, timeline },
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
      const fromFrame = last ? last.toFrame + 1 : 0;
      const segment = {
        id: `segment-${Date.now()}`,
        fromFrame,
        toFrame: fromFrame + 119,
        sourceImageId: state.selectedAssetId ?? state.preset.assets[0]?.id,
        prompt: state.preset.prompt.positive,
        negativePrompt: state.preset.prompt.negative,
        transitionMode: 'sequential-morph',
      };
      return {
        preset: { ...state.preset, timeline: [...state.preset.timeline, segment] },
        selectedSegmentId: segment.id,
      };
    }),
  duplicateSegment: (segmentId) =>
    set((state) => {
      const source = state.preset.timeline.find((segment) => segment.id === segmentId);
      if (!source) return state;
      const duplicate = {
        ...source,
        id: `segment-${Date.now()}`,
        fromFrame: source.toFrame + 1,
        toFrame: source.toFrame + (source.toFrame - source.fromFrame) + 1,
      };
      return {
        preset: { ...state.preset, timeline: [...state.preset.timeline, duplicate] },
        selectedSegmentId: duplicate.id,
      };
    }),
  updateSegment: (segmentId, patch) =>
    set((state) => ({
      preset: {
        ...state.preset,
        timeline: state.preset.timeline.map((segment) => (segment.id === segmentId ? { ...segment, ...patch } : segment)),
      },
    })),
  deleteSegment: (segmentId) =>
    set((state) => {
      const timeline = state.preset.timeline.filter((segment) => segment.id !== segmentId);
      return {
        preset: { ...state.preset, timeline },
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
      return { preset: { ...state.preset, timeline } };
    }),
  queueRender: () => {
    const state = get();
    const selectedModels = state.compareModelIds.length ? state.compareModelIds : [state.preset.model.modelId];
    const jobs = selectedModels.map((modelId) => queueMockRender(state.preset, getModelById(modelId)));
    const takes = jobs.map(createTakeFromJob);
    set((current) => ({ jobs: [...jobs, ...current.jobs], takes: [...takes, ...current.takes] }));
  },
  queueDeforumRender: async () => {
    const { preset, renderBackend } = get();
    set({ backendError: '' });
    try {
      const job =
        renderBackend === 'huggingface-deforum'
          ? await queueHuggingFaceDeforumRender(preset)
          : await queueA1111DeforumRender(preset);
      const take = createTakeFromJob(job);
      set((current) => ({ jobs: [job, ...current.jobs], takes: [take, ...current.takes] }));
      return job;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      set({ backendError: message });
      throw error;
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
