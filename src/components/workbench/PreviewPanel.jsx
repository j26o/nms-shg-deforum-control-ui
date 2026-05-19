import { useMemo, useRef } from 'react';
import { Maximize2 } from 'lucide-react';
import { usePresetStore } from '../../stores/usePresetStore.js';
import styles from './Workbench.module.css';

function isPlayableMediaUrl(value = '') {
  return Boolean(value) && (/^https?:\/\//.test(value) || value.startsWith('/') || value.startsWith('blob:'));
}

export function PreviewPanel() {
  const preset = usePresetStore((state) => state.preset);
  const selectedAssetId = usePresetStore((state) => state.selectedAssetId);
  const takes = usePresetStore((state) => state.takes);
  const previewFrameRef = useRef(null);
  const selectedAsset = useMemo(
    () => preset.assets.find((asset) => asset.id === selectedAssetId) ?? preset.assets[0],
    [preset.assets, selectedAssetId],
  );
  const latestRenderTake = useMemo(
    () => takes.find((take) => take.artifactUrl || (take.backend !== 'mock' && take.outputPath)),
    [takes],
  );
  const mediaUrl = latestRenderTake?.artifactUrl || (isPlayableMediaUrl(latestRenderTake?.outputPath) ? latestRenderTake.outputPath : '');
  const outputPath = latestRenderTake?.artifactPath || latestRenderTake?.outputPath || latestRenderTake?.outputVideoPattern || '';
  const title = latestRenderTake ? `Rendered output / ${latestRenderTake.model.modelId ?? latestRenderTake.model.id}` : selectedAsset?.label;
  const subtitle = latestRenderTake
    ? `${latestRenderTake.previewResolution.join('x')} output · ${latestRenderTake.frameCount ?? 'frames pending'} frames · ${latestRenderTake.fps ?? preset.target.fps} fps`
    : `${preset.target.sourceResolution.join('x')} safe frame · preview ${preset.target.previewResolution.join('x')}`;

  const handleFullscreen = () => {
    if (mediaUrl) {
      window.open(mediaUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    void previewFrameRef.current?.requestFullscreen?.();
  };

  return (
    <section className={styles.previewPanel} aria-label="Seven by three preview frame">
      <div className={styles.previewHeader}>
        <div>
          <h1>{title}</h1>
          <span>{subtitle}</span>
        </div>
        <button type="button" className={styles.previewIconButton} onClick={handleFullscreen} title={mediaUrl ? 'Open rendered video' : 'Open preview fullscreen'}>
          <Maximize2 size={18} aria-hidden="true" />
        </button>
      </div>
      <div className={styles.previewFrame} ref={previewFrameRef}>
        {mediaUrl ? (
          <video src={mediaUrl} controls playsInline aria-label="Rendered Deforum output video" />
        ) : selectedAsset ? (
          <img src={selectedAsset.previewUrl} alt={selectedAsset.label} />
        ) : null}
        {!mediaUrl && latestRenderTake ? (
          <div className={styles.outputMissing}>
            <strong>Output video not found yet</strong>
            <span>{outputPath || 'The backend returned no playable video artifact.'}</span>
          </div>
        ) : null}
        {!mediaUrl ? (
          <>
            <div className={styles.safeFrame} aria-hidden="true" />
            <div className={styles.centerLineX} aria-hidden="true" />
            <div className={styles.centerLineY} aria-hidden="true" />
          </>
        ) : null}
      </div>
      {latestRenderTake ? (
        <div className={styles.outputLocation} aria-label="Rendered output location">
          <strong>{mediaUrl ? 'Playing rendered output' : 'Render output location'}</strong>
          <span>{outputPath || mediaUrl}</span>
        </div>
      ) : null}
    </section>
  );
}
