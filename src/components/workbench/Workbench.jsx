import { useEffect, useState } from 'react';
import { Activity, Braces, Download, FileJson, Layers, Play, RefreshCw, Save, Server } from 'lucide-react';
import { modelOptions } from '../../config/modelOptions.js';
import { checkBackendStatus, createInitialBackendStatus } from '../../services/backendStatus.js';
import { exportDeforumSettingsJson, exportPresetJson, exportPresetReport, downloadTextFile } from '../../services/exportPreset.js';
import { validatePreset } from '../../services/presetSchema.js';
import { usePresetStore } from '../../stores/usePresetStore.js';
import { ControlsPanel } from './ControlsPanel.jsx';
import { PreviewPanel } from './PreviewPanel.jsx';
import { PromptNodesPanel } from './PromptNodesPanel.jsx';
import styles from './Workbench.module.css';

export function Workbench() {
  const preset = usePresetStore((state) => state.preset);
  const jobs = usePresetStore((state) => state.jobs);
  const takes = usePresetStore((state) => state.takes);
  const queueRender = usePresetStore((state) => state.queueRender);
  const queueDeforumRender = usePresetStore((state) => state.queueDeforumRender);
  const renderBackend = usePresetStore((state) => state.renderBackend);
  const renderStatus = usePresetStore((state) => state.renderStatus);
  const renderProgress = usePresetStore((state) => state.renderProgress);
  const renderMessage = usePresetStore((state) => state.renderMessage);
  const setRenderBackend = usePresetStore((state) => state.setRenderBackend);
  const updatePresetName = usePresetStore((state) => state.updatePresetName);
  const markCandidate = usePresetStore((state) => state.markCandidate);
  const updateTakeNotes = usePresetStore((state) => state.updateTakeNotes);
  const validation = validatePreset(preset);
  const backendError = usePresetStore((state) => state.backendError);
  const candidateTake = takes.find((take) => take.candidate);
  const renderBusy = renderStatus === 'running';
  const showRenderNotice = renderStatus !== 'idle' || Boolean(backendError);
  const [statusRefreshTick, setStatusRefreshTick] = useState(0);
  const [backendStatus, setBackendStatus] = useState(() => createInitialBackendStatus(renderBackend));
  const backendStatusClassName = [styles.backendStatus, styles[`backendStatus_${backendStatus.status}`]].filter(Boolean).join(' ');
  const realBackendUnavailable = backendStatus.status === 'offline' || backendStatus.status === 'not-configured';
  const realRenderDisabled = renderBusy || realBackendUnavailable;

  useEffect(() => {
    let cancelled = false;
    let controller;

    const runCheck = (showChecking = false) => {
      controller?.abort();
      controller = new AbortController();
      if (showChecking) {
        setBackendStatus(createInitialBackendStatus(renderBackend));
      }
      void checkBackendStatus(renderBackend, controller.signal).then((nextStatus) => {
        if (!cancelled) {
          setBackendStatus(nextStatus);
        }
      });
    };

    runCheck(true);
    const intervalId = globalThis.setInterval(runCheck, 8000);

    return () => {
      cancelled = true;
      controller?.abort();
      globalThis.clearInterval(intervalId);
    };
  }, [renderBackend, statusRefreshTick]);

  const handleExportJson = () => {
    downloadTextFile(`${preset.presetName}.json`, exportPresetJson(preset));
  };

  const handleExportReport = () => {
    downloadTextFile(`${preset.presetName}-report.md`, exportPresetReport(preset, candidateTake), 'text/markdown');
  };

  const handleExportDeforumSettings = () => {
    downloadTextFile(`${preset.presetName}-deforum-settings.json`, exportDeforumSettingsJson(candidateTake));
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
          <label className={styles.backendSelect}>
            <span>Backend</span>
            <select aria-label="Backend" value={renderBackend} onChange={(event) => setRenderBackend(event.target.value)}>
              <option value="a1111-deforum">Local A1111</option>
              <option value="huggingface-deforum">Hugging Face</option>
            </select>
          </label>
          <div className={backendStatusClassName} aria-label="Backend server status" title={backendStatus.detail}>
            <Server size={15} aria-hidden="true" />
            <span className={styles.statusDot} aria-hidden="true" />
            <div>
              <strong>{backendStatus.label}</strong>
              <span>{backendStatus.status === 'not-configured' ? 'not configured' : backendStatus.status}</span>
            </div>
            <button type="button" onClick={() => setStatusRefreshTick((tick) => tick + 1)} title="Refresh backend status" aria-label="Refresh backend status">
              <RefreshCw size={14} aria-hidden="true" />
            </button>
          </div>
          <button type="button" className={styles.iconButton} title="Save preset draft">
            <Save size={17} aria-hidden="true" />
          </button>
          <button type="button" className={styles.primaryButton} onClick={() => void queueRender()} disabled={renderBusy}>
            <Play size={17} aria-hidden="true" />
            Render preview
          </button>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => void queueDeforumRender()}
            disabled={realRenderDisabled}
            title={realBackendUnavailable ? backendStatus.detail : undefined}
          >
            <Play size={17} aria-hidden="true" />
            {renderBackend === 'huggingface-deforum' ? 'Render HF Deforum' : 'Render Deforum'}
          </button>
          <button type="button" className={styles.iconButton} onClick={handleExportJson} title="Export reviewed JSON">
            <FileJson size={17} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={styles.iconButton}
            onClick={handleExportDeforumSettings}
            title="Export Deforum settings"
            disabled={!candidateTake?.renderSettings}
          >
            <Braces size={17} aria-hidden="true" />
          </button>
          <button type="button" className={styles.iconButton} onClick={handleExportReport} title="Export readable report">
            <Download size={17} aria-hidden="true" />
          </button>
        </div>
      </header>

      <main className={styles.grid}>
        <PromptNodesPanel />
        <section className={styles.centerStack} aria-label="Preview">
          <PreviewPanel />
        </section>
        <ControlsPanel />
      </main>

      {showRenderNotice ? (
        <aside className={styles.renderNotice} role={renderStatus === 'error' || backendError ? 'alert' : 'status'} aria-live="polite">
          <div>
            <strong>{renderStatus === 'error' || backendError ? 'Render failed' : renderBusy ? 'Render in progress' : 'Render complete'}</strong>
            <span>{renderMessage || backendError}</span>
          </div>
          {renderBusy || renderStatus === 'complete' ? (
            <div className={styles.progressTrack} aria-label="Render progress">
              <span style={{ width: `${renderProgress}%` }} />
            </div>
          ) : null}
        </aside>
      ) : null}

      <aside className={styles.bottomBar} aria-label="Render queue and take comparison">
        <section className={styles.statusPanel}>
          <div className={styles.panelHeader}>
            <Activity size={17} aria-hidden="true" />
            <h2>Queue</h2>
          </div>
          {jobs.length === 0 ? (
            <div className={styles.queueStatus}>
              <p className={styles.emptyText}>{renderMessage || 'No preview jobs queued.'}</p>
              {renderBusy ? (
                <div className={styles.progressTrack} aria-label="Queue progress">
                  <span style={{ width: `${renderProgress}%` }} />
                </div>
              ) : null}
            </div>
          ) : (
            <ol className={styles.jobList}>
              {jobs.slice(0, 4).map((job) => (
                <li key={job.id}>
                  <strong>{job.renderConfig.model.modelId ?? job.renderConfig.model.id}</strong>
                  <span>{job.status}</span>
                  <small>{job.outputPath || 'Simulated preview only'}</small>
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
                  {take.simulatedPreview ? (
                    <figure className={styles.simulatedPreview}>
                      <img src={take.simulatedPreview.thumbnailUrl} alt={`${take.simulatedPreview.label} simulated preview`} />
                      <figcaption>
                        <strong>Simulated preview</strong>
                        <span>{take.simulatedPreview.label}</span>
                      </figcaption>
                    </figure>
                  ) : null}
                  <div>
                    <strong>{take.model.modelId ?? take.model.id}</strong>
                    <span>{take.previewResolution.join('x')} / seed {take.seed}</span>
                    <span>{take.backend} / {take.checkpointFile || 'checkpoint pending'}</span>
                    <span>
                      {take.frameCount ? `${take.frameCount} frames` : 'frames pending'} / {take.fps ? `${take.fps} fps` : 'fps pending'} /{' '}
                      {take.renderDurationMs}ms
                    </span>
                    {take.hasFileArtifact ? (
                      <small>{take.outputPath || take.artifactUrl}</small>
                    ) : (
                      <small>{take.previewLabel ? `${take.previewLabel} / simulated preview only` : 'Simulated preview only - no file written'}</small>
                    )}
                    {take.settingsFilePath ? <small>{take.settingsFilePath}</small> : null}
                    {take.outputSettingsPattern ? <small>{take.outputSettingsPattern}</small> : null}
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
