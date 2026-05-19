import { Copy, Plus, Trash2 } from 'lucide-react';
import { createDeforumPromptSchedule } from '../../services/deforumPromptSchedule.js';
import { usePresetStore } from '../../stores/usePresetStore.js';
import styles from './Workbench.module.css';

export function PromptNodesPanel() {
  const preset = usePresetStore((state) => state.preset);
  const selectedSegmentId = usePresetStore((state) => state.selectedSegmentId);
  const selectSegment = usePresetStore((state) => state.selectSegment);
  const addSegment = usePresetStore((state) => state.addSegment);
  const duplicateSegment = usePresetStore((state) => state.duplicateSegment);
  const deleteSegment = usePresetStore((state) => state.deleteSegment);
  const updateSegment = usePresetStore((state) => state.updateSegment);
  const promptPayload = JSON.stringify(createDeforumPromptSchedule(preset), null, 2);

  return (
    <section className={styles.controlGroup} aria-label="Prompt JSON nodes">
      <div className={styles.groupHeader}>
        <h2>Prompt JSON Nodes</h2>
        <button type="button" className={styles.smallCommand} onClick={addSegment}>
          <Plus size={15} aria-hidden="true" />
          Node
        </button>
      </div>

      <div className={styles.promptNodeList}>
        {[...preset.timeline]
          .sort((left, right) => left.fromFrame - right.fromFrame)
          .map((node) => {
            const asset = preset.assets.find((item) => item.id === node.sourceImageId);
            const selected = node.id === selectedSegmentId;
            return (
              <article key={node.id} className={selected ? styles.promptNodeSelected : styles.promptNodeCard}>
                <button type="button" className={styles.promptNodeSummary} onClick={() => selectSegment(node.id)}>
                  <strong>{node.fromFrame}</strong>
                  <span>{asset?.label ?? node.sourceImageId}</span>
                </button>
                {selected ? (
                  <div className={styles.promptNodeEditor}>
                    <label>
                      Frame
                      <input
                        type="number"
                        aria-label="Active node frame"
                        value={node.fromFrame}
                        onChange={(event) => updateSegment(node.id, { fromFrame: Number(event.target.value) })}
                      />
                    </label>
                    <label>
                      Image
                      <select
                        aria-label="Active node image"
                        value={node.sourceImageId}
                        onChange={(event) => updateSegment(node.id, { sourceImageId: event.target.value })}
                      >
                        {preset.assets.map((assetOption) => (
                          <option key={assetOption.id} value={assetOption.id}>
                            {assetOption.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Prompt
                      <textarea
                        aria-label="Active node prompt"
                        value={node.prompt}
                        onChange={(event) => updateSegment(node.id, { prompt: event.target.value })}
                      />
                    </label>
                    <label>
                      --neg
                      <textarea
                        aria-label="Active node negative params"
                        value={node.negativePrompt}
                        onChange={(event) => updateSegment(node.id, { negativePrompt: event.target.value })}
                      />
                    </label>
                    <div className={styles.segmentActions}>
                      <button type="button" onClick={() => duplicateSegment(node.id)} title="Duplicate prompt node">
                        <Copy size={15} aria-hidden="true" />
                      </button>
                      <button type="button" onClick={() => deleteSegment(node.id)} title="Delete prompt node">
                        <Trash2 size={15} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}
      </div>

      <label className={styles.promptPayloadPreview}>
        Prompt payload
        <textarea readOnly aria-label="Prompt payload JSON" value={promptPayload} />
      </label>
    </section>
  );
}
