import { modelOptions } from '../../config/modelOptions.js';
import { defaultSettingPresetId, getThematicSettingPreset, thematicSettingPresets } from '../../config/thematicSettingPresets.js';
import { usePresetStore } from '../../stores/usePresetStore.js';
import styles from './Workbench.module.css';

const samplers = ['DPM++ 2M Karras', 'Euler a', 'DDIM', 'UniPC'];
const schedulers = ['Karras', 'Exponential', 'Simple', 'Normal'];
const previewSizes = ['896x384', '1344x576', '1680x720'];
const cameraPaths = ['locked-source-morph', 'slow-push', 'float-through', 'locked-off', 'orbit-drift'];
const renderQualities = ['fast-preview', 'review-preview', 'final-exercise'];
const midjourneyLikeModelId = 'juggernaut-xl-v9';

const controlDescriptions = {
  modelProfile: 'Selects the checkpoint used by the backend render. Juggernaut XL v9 is the closest configured option to a polished Midjourney-like concept-art look; RealVisXL remains the default for source-faithful realism.',
  thematicPreset: 'Applies a themed bundle of model, generation, morph, motion, and look settings. Sample frame match is tuned to stay closest to the supplied images.',
  sampler: 'Controls the diffusion sampling algorithm. DPM++ 2M Karras is the current balanced default for stable image-to-image quality.',
  scheduler: 'Controls how denoising changes over each generation step. Karras usually gives smooth detail buildup.',
  steps: 'Sets how many diffusion passes are used per generated frame. Higher values can improve detail but increase render time.',
  cfgScale: 'Controls prompt strength. Higher values push the text prompt harder; lower values let source images dominate.',
  seed: 'Locks the random starting point so repeated renders are easier to compare.',
  previewResolution: 'Sets the render preview size while preserving the 7:3 source aspect ratio.',
  sourceStrength: 'Controls how strongly each selected source image pulls its keyframe. Higher values keep the render closer to the supplied images.',
  denoise: 'Controls how much the model is allowed to redraw the source frame. Lower values preserve image identity.',
  imageDecay: 'Controls how quickly source-image influence fades through the morph. Lower values reduce abstract drift.',
  transitionFrames: 'Controls how many frames Deforum spends tweening between image keyframes.',
  structuralLock: 'Controls how much composition, skyline, and geometry should stay fixed to the source frames.',
  fogMaskAssistance: 'Keeps the preset marked for mist/fog-aware masking assistance in future backend refinements.',
  zoom: 'Adds a continuous camera push. Keep at 1 for locked source-frame morphs.',
  panX: 'Moves the frame horizontally over time. Keep at 0 to avoid losing panoramic edges.',
  panY: 'Moves the frame vertically over time. Keep at 0 to preserve the source horizon and waterline.',
  rotation: 'Rotates the rendered view. Keep at 0 for stable architectural horizons.',
  depthWarp: 'Enables 3D-like depth movement when above 0. This can add parallax but can also distort source geometry.',
  cameraPath: 'Names the motion style. locked-source-morph is the conservative default for preserving supplied frames.',
  cadence: 'Controls how often diffusion regenerates frames. Lower cadence improves consistency for image-reference morphs.',
  positivePrompt: 'Shared creative direction added to the image-keyframe prompt schedule.',
  negativePrompt: 'Shared guardrails for artifacts and unwanted visual drift.',
  contrast: 'Adjusts tonal separation in the generated look.',
  fogEmphasis: 'Controls how strongly the preset asks for mist and atmospheric layering.',
  bloom: 'Controls the amount of glow around bright city lights.',
  grain: 'Adds texture/noise to reduce overly clean synthetic output.',
  renderQuality: 'Labels the intended render pass quality for review and handoff.',
  duration: 'Sets the preview clip length in seconds.',
  outputFolder: 'Sets where lightweight mock preview exports are labelled. Real A1111 artifacts are written under render-tools.',
  handoffNotes: 'Freeform notes for the reviewer or production integrator.',
};

function FieldDescription({ children }) {
  return children ? <small className={styles.controlDescription}>{children}</small> : null;
}

function SliderField({ label, value, min, max, step, onChange, description }) {
  return (
    <label className={styles.controlField}>
      <span>
        {label}
        <strong>{value}</strong>
      </span>
      <FieldDescription>{description}</FieldDescription>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}

function SelectField({ label, value, options, onChange, description }) {
  return (
    <label className={styles.controlField}>
      <span>{label}</span>
      <FieldDescription>{description}</FieldDescription>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value ?? option} value={option.value ?? option}>
            {option.label ?? option}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextField({ label, value, onChange, multiline = false, description }) {
  return (
    <label className={styles.controlField}>
      <span>{label}</span>
      <FieldDescription>{description}</FieldDescription>
      {multiline ? (
        <textarea value={value} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input value={value} onChange={(event) => onChange(event.target.value)} />
      )}
    </label>
  );
}

function ControlGroup({ title, children }) {
  return (
    <section className={styles.controlGroup}>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

export function ControlsPanel() {
  const preset = usePresetStore((state) => state.preset);
  const updateGroupValue = usePresetStore((state) => state.updateGroupValue);
  const updateTargetValue = usePresetStore((state) => state.updateTargetValue);
  const setModelProfile = usePresetStore((state) => state.setModelProfile);
  const applySettingPreset = usePresetStore((state) => state.applySettingPreset);
  const selectedModel = modelOptions.models.find((model) => model.id === preset.model.modelId) ?? modelOptions.models[0];
  const midjourneyLikeModel = modelOptions.models.find((model) => model.id === midjourneyLikeModelId);
  const selectedSettingPreset = getThematicSettingPreset(preset.settingPresetId ?? defaultSettingPresetId);

  const setPreviewSize = (value) => {
    updateTargetValue('previewResolution', value.split('x').map(Number));
  };

  return (
    <aside className={styles.controlsPanel} aria-label="Deforum controls">
      <ControlGroup title="Generation">
        <SelectField
          label="Thematic preset"
          value={selectedSettingPreset.id}
          options={thematicSettingPresets.map((settingPreset) => ({
            value: settingPreset.id,
            label: settingPreset.label,
          }))}
          onChange={applySettingPreset}
          description={controlDescriptions.thematicPreset}
        />
        <div className={styles.settingPresetNote}>
          <strong>{selectedSettingPreset.label}</strong>
          <span>{selectedSettingPreset.description}</span>
        </div>
        <SelectField
          label="Model profile"
          value={preset.model.modelId}
          options={modelOptions.models.map((model) => ({
            value: model.id,
            label: `${model.label}${model.id === midjourneyLikeModelId ? ' - closest to Midjourney' : ''}`,
          }))}
          onChange={setModelProfile}
          description={controlDescriptions.modelProfile}
        />
        <div className={styles.modelNote}>
          <strong>{preset.model.label}</strong>
          <span>Strong at: {selectedModel.strongAt ?? selectedModel.expectedStrength}</span>
          <span>Midjourney fit: {selectedModel.midjourneyFit}</span>
          <span>{preset.model.status}</span>
          <p>{preset.model.risk}</p>
        </div>
        <div className={styles.modelStrengthList} aria-label="Model strengths">
          <strong>Model strengths</strong>
          <ul>
            {modelOptions.models.map((model) => (
              <li key={model.id}>
                <span>{model.label}</span>
                <small>{model.strongAt ?? model.expectedStrength}</small>
              </li>
            ))}
          </ul>
          {midjourneyLikeModel ? <p>Closest to Midjourney: {midjourneyLikeModel.label} for cinematic, polished, high-impact concept art.</p> : null}
        </div>
        <SelectField
          label="Sampler"
          value={preset.generation.sampler}
          options={samplers}
          onChange={(value) => updateGroupValue('generation', 'sampler', value)}
          description={controlDescriptions.sampler}
        />
        <SelectField
          label="Scheduler"
          value={preset.generation.scheduler}
          options={schedulers}
          onChange={(value) => updateGroupValue('generation', 'scheduler', value)}
          description={controlDescriptions.scheduler}
        />
        <SliderField
          label="Steps"
          min={10}
          max={60}
          step={1}
          value={preset.generation.steps}
          onChange={(value) => updateGroupValue('generation', 'steps', value)}
          description={controlDescriptions.steps}
        />
        <SliderField
          label="CFG scale"
          min={1}
          max={14}
          step={0.5}
          value={preset.generation.cfgScale}
          onChange={(value) => updateGroupValue('generation', 'cfgScale', value)}
          description={controlDescriptions.cfgScale}
        />
        <TextField
          label="Seed"
          value={String(preset.generation.seed)}
          onChange={(value) => updateGroupValue('generation', 'seed', Number(value))}
          description={controlDescriptions.seed}
        />
        <SelectField
          label="Preview resolution"
          value={preset.target.previewResolution.join('x')}
          options={previewSizes}
          onChange={setPreviewSize}
          description={controlDescriptions.previewResolution}
        />
      </ControlGroup>

      <ControlGroup title="Image Morph">
        <SliderField
          label="Source strength"
          min={0}
          max={1}
          step={0.01}
          value={preset.imageMorph.sourceImageStrength}
          onChange={(value) => updateGroupValue('imageMorph', 'sourceImageStrength', value)}
          description={controlDescriptions.sourceStrength}
        />
        <SliderField
          label="Denoise"
          min={0}
          max={1}
          step={0.01}
          value={preset.imageMorph.denoiseStrength}
          onChange={(value) => updateGroupValue('imageMorph', 'denoiseStrength', value)}
          description={controlDescriptions.denoise}
        />
        <SliderField
          label="Image decay"
          min={0}
          max={1}
          step={0.01}
          value={preset.imageMorph.imageInfluenceDecay}
          onChange={(value) => updateGroupValue('imageMorph', 'imageInfluenceDecay', value)}
          description={controlDescriptions.imageDecay}
        />
        <SliderField
          label="Transition frames"
          min={12}
          max={180}
          step={1}
          value={preset.imageMorph.transitionDuration}
          onChange={(value) => updateGroupValue('imageMorph', 'transitionDuration', value)}
          description={controlDescriptions.transitionFrames}
        />
        <SliderField
          label="Structural lock"
          min={0}
          max={1}
          step={0.01}
          value={preset.imageMorph.structuralLockStrength}
          onChange={(value) => updateGroupValue('imageMorph', 'structuralLockStrength', value)}
          description={controlDescriptions.structuralLock}
        />
        <label className={styles.toggleField}>
          <input
            type="checkbox"
            checked={preset.imageMorph.fogMaskAssistance}
            onChange={(event) => updateGroupValue('imageMorph', 'fogMaskAssistance', event.target.checked)}
          />
          <span>
            Fog/mask assistance
            <small>{controlDescriptions.fogMaskAssistance}</small>
          </span>
        </label>
      </ControlGroup>

      <ControlGroup title="Motion">
        <SliderField
          label="Zoom"
          min={0.95}
          max={1.12}
          step={0.001}
          value={preset.motion.zoom}
          onChange={(value) => updateGroupValue('motion', 'zoom', value)}
          description={controlDescriptions.zoom}
        />
        <SliderField
          label="Pan X"
          min={-0.08}
          max={0.08}
          step={0.001}
          value={preset.motion.panX}
          onChange={(value) => updateGroupValue('motion', 'panX', value)}
          description={controlDescriptions.panX}
        />
        <SliderField
          label="Pan Y"
          min={-0.08}
          max={0.08}
          step={0.001}
          value={preset.motion.panY}
          onChange={(value) => updateGroupValue('motion', 'panY', value)}
          description={controlDescriptions.panY}
        />
        <SliderField
          label="Rotation"
          min={-5}
          max={5}
          step={0.1}
          value={preset.motion.rotation}
          onChange={(value) => updateGroupValue('motion', 'rotation', value)}
          description={controlDescriptions.rotation}
        />
        <SliderField
          label="Depth warp"
          min={0}
          max={1}
          step={0.01}
          value={preset.motion.depthWarpStrength}
          onChange={(value) => updateGroupValue('motion', 'depthWarpStrength', value)}
          description={controlDescriptions.depthWarp}
        />
        <SelectField
          label="Camera path"
          value={preset.motion.cameraPathPreset}
          options={cameraPaths}
          onChange={(value) => updateGroupValue('motion', 'cameraPathPreset', value)}
          description={controlDescriptions.cameraPath}
        />
        <SliderField
          label="Cadence"
          min={1}
          max={8}
          step={1}
          value={preset.motion.cadence}
          onChange={(value) => updateGroupValue('motion', 'cadence', value)}
          description={controlDescriptions.cadence}
        />
      </ControlGroup>

      <ControlGroup title="Prompt">
        <TextField
          label="Positive prompt"
          multiline
          value={preset.prompt.positive}
          onChange={(value) => updateGroupValue('prompt', 'positive', value)}
          description={controlDescriptions.positivePrompt}
        />
        <TextField
          label="Negative prompt"
          multiline
          value={preset.prompt.negative}
          onChange={(value) => updateGroupValue('prompt', 'negative', value)}
          description={controlDescriptions.negativePrompt}
        />
      </ControlGroup>

      <ControlGroup title="Look">
        <SliderField
          label="Contrast"
          min={0.7}
          max={1.5}
          step={0.01}
          value={preset.look.contrast}
          onChange={(value) => updateGroupValue('look', 'contrast', value)}
          description={controlDescriptions.contrast}
        />
        <SliderField
          label="Fog emphasis"
          min={0}
          max={1}
          step={0.01}
          value={preset.look.fogEmphasis}
          onChange={(value) => updateGroupValue('look', 'fogEmphasis', value)}
          description={controlDescriptions.fogEmphasis}
        />
        <SliderField
          label="Bloom"
          min={0}
          max={1}
          step={0.01}
          value={preset.look.bloom}
          onChange={(value) => updateGroupValue('look', 'bloom', value)}
          description={controlDescriptions.bloom}
        />
        <SliderField
          label="Grain"
          min={0}
          max={0.3}
          step={0.01}
          value={preset.look.grain}
          onChange={(value) => updateGroupValue('look', 'grain', value)}
          description={controlDescriptions.grain}
        />
      </ControlGroup>

      <ControlGroup title="Output">
        <SelectField
          label="Render quality"
          value={preset.output.renderQuality}
          options={renderQualities}
          onChange={(value) => updateGroupValue('output', 'renderQuality', value)}
          description={controlDescriptions.renderQuality}
        />
        <SliderField
          label="Duration"
          min={3}
          max={30}
          step={1}
          value={preset.output.previewDuration}
          onChange={(value) => updateGroupValue('output', 'previewDuration', value)}
          description={controlDescriptions.duration}
        />
        <TextField
          label="Output folder"
          value={preset.output.outputFolder}
          onChange={(value) => updateGroupValue('output', 'outputFolder', value)}
          description={controlDescriptions.outputFolder}
        />
        <TextField
          label="Handoff notes"
          multiline
          value={preset.output.productionNotes}
          onChange={(value) => updateGroupValue('output', 'productionNotes', value)}
          description={controlDescriptions.handoffNotes}
        />
      </ControlGroup>
    </aside>
  );
}
