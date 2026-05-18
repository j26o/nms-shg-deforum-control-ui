import modelOptions from '../../config/model-options.json';

export { modelOptions };

export function getModelById(modelId) {
  return modelOptions.models.find((model) => model.id === modelId) ?? modelOptions.models[0];
}

export function getDefaultModel() {
  return getModelById(modelOptions.defaultModelId);
}
