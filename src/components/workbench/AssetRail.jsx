import { ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react';
import { usePresetStore } from '../../stores/usePresetStore.js';
import styles from './Workbench.module.css';

export function AssetRail() {
  const assets = usePresetStore((state) => state.preset.assets);
  const selectedAssetId = usePresetStore((state) => state.selectedAssetId);
  const selectAsset = usePresetStore((state) => state.selectAsset);
  const updateAsset = usePresetStore((state) => state.updateAsset);
  const moveAsset = usePresetStore((state) => state.moveAsset);

  return (
    <aside className={styles.assetRail} aria-label="Source image sequence">
      <div className={styles.panelTitle}>
        <h2>Sources</h2>
        <span>{assets.filter((asset) => asset.enabled).length}/{assets.length}</span>
      </div>
      <div className={styles.assetList}>
        {assets.map((asset, index) => (
          <article key={asset.id} className={asset.id === selectedAssetId ? styles.assetSelected : styles.assetCard}>
            <button type="button" className={styles.assetPreview} onClick={() => selectAsset(asset.id)}>
              <img src={asset.previewUrl} alt="" />
            </button>
            <div className={styles.assetMeta}>
              <input
                aria-label={`Label for ${asset.id}`}
                value={asset.label}
                onChange={(event) => updateAsset(asset.id, { label: event.target.value })}
              />
              <span>{index + 1} · {asset.width}x{asset.height} · {asset.cropMode}</span>
            </div>
            <div className={styles.assetActions}>
              <button type="button" onClick={() => moveAsset(asset.id, -1)} title="Move source up">
                <ChevronUp size={15} aria-hidden="true" />
              </button>
              <button type="button" onClick={() => moveAsset(asset.id, 1)} title="Move source down">
                <ChevronDown size={15} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => updateAsset(asset.id, { enabled: !asset.enabled })}
                title={asset.enabled ? 'Disable source' : 'Enable source'}
              >
                {asset.enabled ? <Eye size={15} aria-hidden="true" /> : <EyeOff size={15} aria-hidden="true" />}
              </button>
            </div>
          </article>
        ))}
      </div>
    </aside>
  );
}
