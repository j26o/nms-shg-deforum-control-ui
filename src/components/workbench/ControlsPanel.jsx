import { modelOptions } from '../../config/modelOptions.js';
import { usePresetStore } from '../../stores/usePresetStore.js';
import styles from './Workbench.module.css';

const samplers = ['DPM++ 2M Karras', 'Euler a', 'DDIM', 'UniPC'];
const schedulers = ['Karras', 'Exponential', 'Simple', 'Normal'];
const previewSizes = ['896x384', '1344x576', '1680x720'];
const cameraPaths = ['slow-push', 'float-through', 'locked-off', 'orbit-drift'];
const renderQualities = ['fast-preview', 'review-preview', 'final-exercise'];

function SliderField({ label, value, min, max, step, onChange }) {
  return (
    <label className={styles.controlField}>
      <span>
        {label}
        <strong>{value}</strong>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}

function SelectField({ label, value, options, onChange }) {
  return (
    <label className={styles.controlField}>
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function TextField({ label, value, onChange, multiline = false }) {
  return (
    <label className={styles.controlField}>
      <span>{label}</span>
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
  const setRuntimeModelProfile = usePresetStore((state) => state.setRuntimeModelProfile);
  const compareModelIds = usePresetStore((state) => state.compareModelIds);

  const setPreviewSize = (value) => {
    updateTargetValue('previewResolution', value.split('x').map(Number));
  };

  return (
    <aside className={styles.controlsPanel} aria-label="Deforum controls">
      <ControlGroup title="Generation">
        <SelectField
          label="Model profile"
          value={preset.model.modelId}
          options={modelOptions.models.map((model) => model.id)}
          onChange={setModelProfile}
        />
        <div className={styles.modelNote}>
          <strong>{preset.model.label}</strong>
          <span>{preset.model.status}</span>
          <p>{preset.model.risk}</p>
        </div>
        <div className={styles.compareList} role="radiogroup" aria-label="Runtime model test">
          {modelOptions.models.map((model) => (
            <label key={model.id}>
              <input
                type="radio"
                name="runtime-model-test"
                checked={(compareModelIds[0] ?? preset.model.modelId) === model.id}
                onChange={() => setRuntimeModelProfile(model.id)}
              />
              {model.label}
            </label>
          ))}
        </div>
        <SelectField
          label="Sampler"
          value={preset.generation.sampler}
          options={samplers}
          onChange={(value) => updateGroupValue('generation', 'sampler', value)}
        />
        <SelectField
          label="Scheduler"
          value={preset.generation.scheduler}
          options={schedulers}
          onChange={(value) => updateGroupValue('generation', 'scheduler', value)}
        />
        <SliderField
          label="Steps"
          min={10}
          max={60}
          step={1}
          value={preset.generation.steps}
          onChange={(value) => updateGroupValue('generation', 'steps', value)}
        />
        <SliderField
          label="CFG scale"
          min={1}
          max={14}
          step={0.5}
          value={preset.generation.cfgScale}
          onChange={(value) => updateGroupValue('generation', 'cfgScale', value)}
        />
        <TextField
          label="Seed"
          value={String(preset.generation.seed)}
          onChange={(value) => updateGroupValue('generation', 'seed', Number(value))}
        />
        <SelectField
          label="Preview resolution"
          value={preset.target.previewResolution.join('x')}
          options={previewSizes}
          onChange={setPreviewSize}
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
        />
        <SliderField
          label="Denoise"
          min={0}
          max={1}
          step={0.01}
          value={preset.imageMorph.denoiseStrength}
          onChange={(value) => updateGroupValue('imageMorph', 'denoiseStrength', value)}
        />
        <SliderField
          label="Transition frames"
          min={12}
          max={180}
          step={1}
          value={preset.imageMorph.transitionDuration}
          onChange={(value) => updateGroupValue('imageMorph', 'transitionDuration', value)}
        />
        <SliderField
          label="Structural lock"
          min={0}
          max={1}
          step={0.01}
          value={preset.imageMorph.structuralLockStrength}
          onChange={(value) => updateGroupValue('imageMorph', 'structuralLockStrength', value)}
        />
        <label className={styles.toggleField}>
          <input
            type="checkbox"
            checked={preset.imageMorph.fogMaskAssistance}
            onChange={(event) => updateGroupValue('imageMorph', 'fogMaskAssistance', event.target.checked)}
          />
          Fog/mask assistance
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
        />
        <SliderField
          label="Pan X"
          min={-0.08}
          max={0.08}
          step={0.001}
          value={preset.motion.panX}
          onChange={(value) => updateGroupValue('motion', 'panX', value)}
        />
        <SliderField
          label="Pan Y"
          min={-0.08}
          max={0.08}
          step={0.001}
          value={preset.motion.panY}
          onChange={(value) => updateGroupValue('motion', 'panY', value)}
        />
        <SliderField
          label="Rotation"
          min={-5}
          max={5}
          step={0.1}
          value={preset.motion.rotation}
          onChange={(value) => updateGroupValue('motion', 'rotation', value)}
        />
        <SliderField
          label="Depth warp"
          min={0}
          max={1}
          step={0.01}
          value={preset.motion.depthWarpStrength}
          onChange={(value) => updateGroupValue('motion', 'depthWarpStrength', value)}
        />
        <SelectField
          label="Camera path"
          value={preset.motion.cameraPathPreset}
          options={cameraPaths}
          onChange={(value) => updateGroupValue('motion', 'cameraPathPreset', value)}
        />
        <SliderField
          label="Cadence"
          min={1}
          max={8}
          step={1}
          value={preset.motion.cadence}
          onChange={(value) => updateGroupValue('motion', 'cadence', value)}
        />
      </ControlGroup>

      <ControlGroup title="Prompt">
        <TextField
          label="Positive prompt"
          multiline
          value={preset.prompt.positive}
          onChange={(value) => updateGroupValue('prompt', 'positive', value)}
        />
        <TextField
          label="Negative prompt"
          multiline
          value={preset.prompt.negative}
          onChange={(value) => updateGroupValue('prompt', 'negative', value)}
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
        />
        <SliderField
          label="Fog emphasis"
          min={0}
          max={1}
          step={0.01}
          value={preset.look.fogEmphasis}
          onChange={(value) => updateGroupValue('look', 'fogEmphasis', value)}
        />
        <SliderField
          label="Bloom"
          min={0}
          max={1}
          step={0.01}
          value={preset.look.bloom}
          onChange={(value) => updateGroupValue('look', 'bloom', value)}
        />
        <SliderField
          label="Grain"
          min={0}
          max={0.3}
          step={0.01}
          value={preset.look.grain}
          onChange={(value) => updateGroupValue('look', 'grain', value)}
        />
      </ControlGroup>

      <ControlGroup title="Output">
        <SelectField
          label="Render quality"
          value={preset.output.renderQuality}
          options={renderQualities}
          onChange={(value) => updateGroupValue('output', 'renderQuality', value)}
        />
        <SliderField
          label="Duration"
          min={3}
          max={30}
          step={1}
          value={preset.output.previewDuration}
          onChange={(value) => updateGroupValue('output', 'previewDuration', value)}
        />
        <TextField
          label="Output folder"
          value={preset.output.outputFolder}
          onChange={(value) => updateGroupValue('output', 'outputFolder', value)}
        />
        <TextField
          label="Handoff notes"
          multiline
          value={preset.output.productionNotes}
          onChange={(value) => updateGroupValue('output', 'productionNotes', value)}
        />
      </ControlGroup>
    </aside>
  );
}
