import { useMemo } from 'react';
import { Maximize2 } from 'lucide-react';
import { usePresetStore } from '../../stores/usePresetStore.js';
import styles from './Workbench.module.css';

export function PreviewPanel() {
  const preset = usePresetStore((state) => state.preset);
  const selectedAssetId = usePresetStore((state) => state.selectedAssetId);
  const selectedAsset = useMemo(
    () => preset.assets.find((asset) => asset.id === selectedAssetId) ?? preset.assets[0],
    [preset.assets, selectedAssetId],
  );

  return (
    <section className={styles.previewPanel} aria-label="Seven by three preview frame">
      <div className={styles.previewHeader}>
        <div>
          <h1>{selectedAsset?.label}</h1>
          <span>{preset.target.sourceResolution.join('x')} safe frame · preview {preset.target.previewResolution.join('x')}</span>
        </div>
        <Maximize2 size={18} aria-hidden="true" />
      </div>
      <div className={styles.previewFrame}>
        {selectedAsset ? <img src={selectedAsset.previewUrl} alt={selectedAsset.label} /> : null}
        <div className={styles.safeFrame} aria-hidden="true" />
        <div className={styles.centerLineX} aria-hidden="true" />
        <div className={styles.centerLineY} aria-hidden="true" />
      </div>
    </section>
  );
}
