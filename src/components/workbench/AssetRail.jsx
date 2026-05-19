import { useState } from 'react';
import { ChevronDown, ChevronUp, Eye, EyeOff, FilePlus2, PanelLeftClose, PanelLeftOpen, Pencil, Trash2, X } from 'lucide-react';
import { usePresetStore } from '../../stores/usePresetStore.js';
import styles from './Workbench.module.css';

const defaultDraft = {
  label: '',
  path: 'assets/images/source/',
  previewUrl: '',
  cropMode: 'contain-7x3',
  width: 1680,
  height: 720,
};

function getPreviewUrlFromPath(path) {
  if (!path) return '';
  if (path.startsWith('blob:') || path.startsWith('data:') || path.startsWith('http://') || path.startsWith('https://') || path.startsWith('/')) {
    return path;
  }
  return `/${path.replace(/^\/+/, '')}`;
}

function getFileLabel(fileName) {
  return fileName.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ');
}

export function AssetRail() {
  const assets = usePresetStore((state) => state.preset.assets);
  const selectedAssetId = usePresetStore((state) => state.selectedAssetId);
  const selectAsset = usePresetStore((state) => state.selectAsset);
  const updateAsset = usePresetStore((state) => state.updateAsset);
  const addAsset = usePresetStore((state) => state.addAsset);
  const removeAsset = usePresetStore((state) => state.removeAsset);
  const moveAsset = usePresetStore((state) => state.moveAsset);
  const [collapsed, setCollapsed] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editingAssetId, setEditingAssetId] = useState('');
  const [draft, setDraft] = useState(defaultDraft);

  const enabledCount = assets.filter((asset) => asset.enabled).length;
  const railClassName = collapsed ? `${styles.assetRail} ${styles.assetRailCollapsed}` : styles.assetRail;

  const handleDraftChange = (key, value) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const handleManualAdd = () => {
    const path = draft.path.trim();
    if (!path) return;
    addAsset({
      ...draft,
      path,
      previewUrl: draft.previewUrl.trim() || getPreviewUrlFromPath(path),
    });
    setDraft(defaultDraft);
    setAdding(false);
    setCollapsed(false);
  };

  const handleFileAdd = (event) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    files.forEach((file) => {
      const path = `${draft.path.replace(/[\\/]+$/, '')}/${file.name}`;
      addAsset({
        label: getFileLabel(file.name),
        path,
        previewUrl: URL.createObjectURL(file),
        cropMode: draft.cropMode,
        width: draft.width,
        height: draft.height,
      });
    });
    event.target.value = '';
    setAdding(false);
    setCollapsed(false);
  };

  const handlePathUpdate = (asset, path) => {
    updateAsset(asset.id, {
      path,
      previewUrl: asset.previewUrl?.startsWith('blob:') ? asset.previewUrl : getPreviewUrlFromPath(path),
    });
  };

  return (
    <aside className={railClassName} aria-label="Source image sequence">
      <div className={styles.panelTitle}>
        <div>
          <h2>Sources</h2>
          <span>{enabledCount}/{assets.length}</span>
        </div>
        <div className={styles.panelTitleActions}>
          <button type="button" className={styles.iconButton} onClick={() => setAdding((value) => !value)} title="Add source image">
            {adding ? <X size={16} aria-hidden="true" /> : <FilePlus2 size={16} aria-hidden="true" />}
          </button>
          <button
            type="button"
            className={styles.iconButton}
            onClick={() => setCollapsed((value) => !value)}
            title={collapsed ? 'Expand source images' : 'Collapse source images'}
          >
            {collapsed ? <PanelLeftOpen size={16} aria-hidden="true" /> : <PanelLeftClose size={16} aria-hidden="true" />}
          </button>
        </div>
      </div>

      {collapsed ? (
        <button type="button" className={styles.collapsedSourceSummary} onClick={() => setCollapsed(false)}>
          {assets.find((asset) => asset.id === selectedAssetId)?.label ?? 'No source selected'}
        </button>
      ) : null}

      {!collapsed && adding ? (
        <section className={styles.assetAddPanel} aria-label="Add source image">
          <label>
            Source path
            <input value={draft.path} onChange={(event) => handleDraftChange('path', event.target.value)} />
          </label>
          <label>
            Label
            <input value={draft.label} onChange={(event) => handleDraftChange('label', event.target.value)} />
          </label>
          <label>
            Preview URL
            <input value={draft.previewUrl} onChange={(event) => handleDraftChange('previewUrl', event.target.value)} />
          </label>
          <div className={styles.assetSizeFields}>
            <label>
              Width
              <input type="number" value={draft.width} onChange={(event) => handleDraftChange('width', Number(event.target.value))} />
            </label>
            <label>
              Height
              <input type="number" value={draft.height} onChange={(event) => handleDraftChange('height', Number(event.target.value))} />
            </label>
          </div>
          <label>
            Crop
            <select value={draft.cropMode} onChange={(event) => handleDraftChange('cropMode', event.target.value)}>
              <option value="contain-7x3">Contain 7:3</option>
              <option value="cover-7x3">Cover 7:3</option>
              <option value="pad-test">Pad test</option>
              <option value="crop-test">Crop test</option>
            </select>
          </label>
          <div className={styles.assetAddActions}>
            <label className={styles.filePickerButton}>
              <FilePlus2 size={15} aria-hidden="true" />
              Files
              <input type="file" accept="image/*" multiple onChange={handleFileAdd} />
            </label>
            <button type="button" className={styles.smallCommand} onClick={handleManualAdd}>
              <FilePlus2 size={15} aria-hidden="true" />
              Add path
            </button>
          </div>
        </section>
      ) : null}

      {!collapsed ? (
        <div className={styles.assetList}>
          {assets.map((asset, index) => {
            const selected = asset.id === selectedAssetId;
            const editing = selected && editingAssetId === asset.id;
            return (
              <article key={asset.id} className={selected ? styles.assetSelected : styles.assetCard} data-source-label={asset.label}>
                <button type="button" className={styles.assetPreview} onClick={() => selectAsset(asset.id)}>
                  <img src={asset.previewUrl} alt="" />
                </button>
                <div className={styles.assetMeta}>
                  <input
                    aria-label={`Label for ${asset.id}`}
                    value={asset.label}
                    onChange={(event) => updateAsset(asset.id, { label: event.target.value })}
                  />
                  <span>{index + 1} / {asset.width}x{asset.height} / {asset.cropMode}</span>
                  {editing ? (
                    <div className={styles.assetEditor}>
                      <label>
                        Source path
                        <input value={asset.path} onChange={(event) => handlePathUpdate(asset, event.target.value)} />
                      </label>
                      <div className={styles.assetSizeFields}>
                        <label>
                          Width
                          <input type="number" value={asset.width} onChange={(event) => updateAsset(asset.id, { width: Number(event.target.value) })} />
                        </label>
                        <label>
                          Height
                          <input type="number" value={asset.height} onChange={(event) => updateAsset(asset.id, { height: Number(event.target.value) })} />
                        </label>
                      </div>
                      <label>
                        Crop
                        <select value={asset.cropMode} onChange={(event) => updateAsset(asset.id, { cropMode: event.target.value })}>
                          <option value="contain-7x3">Contain 7:3</option>
                          <option value="cover-7x3">Cover 7:3</option>
                          <option value="pad-test">Pad test</option>
                          <option value="crop-test">Crop test</option>
                        </select>
                      </label>
                    </div>
                  ) : null}
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
                  <button
                    type="button"
                    onClick={() => {
                      selectAsset(asset.id);
                      setEditingAssetId(editing ? '' : asset.id);
                    }}
                    title={editing ? 'Close source editor' : 'Edit source'}
                  >
                    <Pencil size={15} aria-hidden="true" />
                  </button>
                  <button type="button" onClick={() => removeAsset(asset.id)} title="Remove source">
                    <Trash2 size={15} aria-hidden="true" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </aside>
  );
}
