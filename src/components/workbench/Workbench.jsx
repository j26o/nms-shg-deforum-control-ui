import { Activity, Download, FileJson, Layers, Play, Save } from 'lucide-react';
import { modelOptions } from '../../config/modelOptions.js';
import { exportPresetJson, exportPresetReport, downloadTextFile } from '../../services/exportPreset.js';
import { validatePreset } from '../../services/presetSchema.js';
import { usePresetStore } from '../../stores/usePresetStore.js';
import { AssetRail } from './AssetRail.jsx';
import { ControlsPanel } from './ControlsPanel.jsx';
import { PreviewPanel } from './PreviewPanel.jsx';
import { TimelineStrip } from './TimelineStrip.jsx';
import styles from './Workbench.module.css';

export function Workbench() {
  const preset = usePresetStore((state) => state.preset);
  const jobs = usePresetStore((state) => state.jobs);
  const takes = usePresetStore((state) => state.takes);
  const queueRender = usePresetStore((state) => state.queueRender);
  const queueDeforumRender = usePresetStore((state) => state.queueDeforumRender);
  const updatePresetName = usePresetStore((state) => state.updatePresetName);
  const markCandidate = usePresetStore((state) => state.markCandidate);
  const updateTakeNotes = usePresetStore((state) => state.updateTakeNotes);
  const validation = validatePreset(preset);
  const backendError = usePresetStore((state) => state.backendError);
  const candidateTake = takes.find((take) => take.candidate);

  const handleExportJson = () => {
    downloadTextFile(`${preset.presetName}.json`, exportPresetJson(preset));
  };

  const handleExportReport = () => {
    downloadTextFile(`${preset.presetName}-report.md`, exportPresetReport(preset, candidateTake), 'text/markdown');
  };

  return (
    <div className={styles.shell}>
      <header className={styles.toolbar}>
        <div className={styles.brand}>
          <Layers size={20} aria-hidden="true" />
          <span>Deforum Control UI</span>
        </div>
        <label className={styles.nameField}>
          <span className={styles.visuallyHidden}>Preset name</span>
          <input value={preset.presetName} onChange={(event) => updatePresetName(event.target.value)} />
        </label>
        <div className={styles.toolbarActions}>
          <button type="button" className={styles.iconButton} title="Save preset draft">
            <Save size={17} aria-hidden="true" />
          </button>
          <button type="button" className={styles.primaryButton} onClick={queueRender}>
            <Play size={17} aria-hidden="true" />
            Render preview
          </button>
          <button type="button" className={styles.secondaryButton} onClick={() => void queueDeforumRender()}>
            <Play size={17} aria-hidden="true" />
            Render Deforum
          </button>
          <button type="button" className={styles.iconButton} onClick={handleExportJson} title="Export reviewed JSON">
            <FileJson size={17} aria-hidden="true" />
          </button>
          <button type="button" className={styles.iconButton} onClick={handleExportReport} title="Export readable report">
            <Download size={17} aria-hidden="true" />
          </button>
        </div>
      </header>

      <main className={styles.grid}>
        <AssetRail />
        <section className={styles.centerStack} aria-label="Preview and timeline">
          <PreviewPanel />
          <TimelineStrip />
        </section>
        <ControlsPanel />
      </main>

      <aside className={styles.bottomBar} aria-label="Render queue and take comparison">
        <section className={styles.statusPanel}>
          <div className={styles.panelHeader}>
            <Activity size={17} aria-hidden="true" />
            <h2>Queue</h2>
          </div>
          {jobs.length === 0 ? (
            <p className={styles.emptyText}>No preview jobs queued.</p>
          ) : (
            <ol className={styles.jobList}>
              {jobs.slice(0, 4).map((job) => (
                <li key={job.id}>
                  <strong>{job.renderConfig.model.modelId ?? job.renderConfig.model.id}</strong>
                  <span>{job.status}</span>
                  <small>{job.outputPath}</small>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className={styles.takesPanel}>
          <div className={styles.panelHeader}>
            <h2>Takes</h2>
            <span>{takes.length} saved</span>
          </div>
          {takes.length === 0 ? (
            <p className={styles.emptyText}>Mock renders create comparable takes with model, seed, resolution, and duration.</p>
          ) : (
            <div className={styles.takeGrid}>
              {takes.map((take) => (
                <article key={take.id} className={take.candidate ? styles.takeCandidate : styles.takeCard}>
                  <div>
                    <strong>{take.model.modelId ?? take.model.id}</strong>
                    <span>{take.previewResolution.join('x')} / seed {take.seed}</span>
                    <small>{take.outputPath}</small>
                  </div>
                  <textarea
                    aria-label={`Notes for ${take.id}`}
                    value={take.notes}
                    placeholder="Take notes"
                    onChange={(event) => updateTakeNotes(take.id, event.target.value)}
                  />
                  <button type="button" onClick={() => markCandidate(take.id)}>
                    Mark candidate
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className={styles.statusPanel}>
          <div className={styles.panelHeader}>
            <h2>Contract</h2>
            <span>{validation.valid ? 'Valid' : 'Needs fixes'}</span>
          </div>
          <p className={styles.emptyText}>
            {backendError ||
            (validation.valid
              ? `Model matrix loaded: ${modelOptions.models.length} profiles, 7:3 export contract intact.`
              : validation.errors[0])}
          </p>
        </section>
      </aside>
    </div>
  );
}
