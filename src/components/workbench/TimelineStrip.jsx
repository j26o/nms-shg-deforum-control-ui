import { Copy, Plus, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { usePresetStore } from '../../stores/usePresetStore.js';
import styles from './Workbench.module.css';

export function TimelineStrip() {
  const preset = usePresetStore((state) => state.preset);
  const selectedSegmentId = usePresetStore((state) => state.selectedSegmentId);
  const selectSegment = usePresetStore((state) => state.selectSegment);
  const addSegment = usePresetStore((state) => state.addSegment);
  const duplicateSegment = usePresetStore((state) => state.duplicateSegment);
  const deleteSegment = usePresetStore((state) => state.deleteSegment);
  const moveSegment = usePresetStore((state) => state.moveSegment);
  const updateSegment = usePresetStore((state) => state.updateSegment);

  return (
    <section className={styles.timelinePanel} aria-label="Frame based timeline">
      <div className={styles.panelTitle}>
        <h2>Timeline</h2>
        <button type="button" className={styles.smallCommand} onClick={addSegment}>
          <Plus size={15} aria-hidden="true" />
          Segment
        </button>
      </div>
      <div className={styles.timelineStrip}>
        {preset.timeline.map((segment) => {
          const asset = preset.assets.find((item) => item.id === segment.sourceImageId);
          const selected = segment.id === selectedSegmentId;
          return (
            <article key={segment.id} className={selected ? styles.segmentSelected : styles.segmentCard}>
              <button type="button" className={styles.segmentMain} onClick={() => selectSegment(segment.id)}>
                <span>{segment.fromFrame}-{segment.toFrame}</span>
                <strong>{asset?.label ?? segment.sourceImageId}</strong>
                <small>{segment.transitionMode}</small>
              </button>
              {selected ? (
                <div className={styles.segmentEditor}>
                  <label>
                    From
                    <input
                      type="number"
                      value={segment.fromFrame}
                      onChange={(event) => updateSegment(segment.id, { fromFrame: Number(event.target.value) })}
                    />
                  </label>
                  <label>
                    To
                    <input
                      type="number"
                      value={segment.toFrame}
                      onChange={(event) => updateSegment(segment.id, { toFrame: Number(event.target.value) })}
                    />
                  </label>
                  <label>
                    Prompt
                    <textarea
                      value={segment.prompt}
                      onChange={(event) => updateSegment(segment.id, { prompt: event.target.value })}
                    />
                  </label>
                  <div className={styles.segmentActions}>
                    <button type="button" onClick={() => moveSegment(segment.id, -1)} title="Move segment left">
                      <ChevronLeft size={15} aria-hidden="true" />
                    </button>
                    <button type="button" onClick={() => moveSegment(segment.id, 1)} title="Move segment right">
                      <ChevronRight size={15} aria-hidden="true" />
                    </button>
                    <button type="button" onClick={() => duplicateSegment(segment.id)} title="Duplicate segment">
                      <Copy size={15} aria-hidden="true" />
                    </button>
                    <button type="button" onClick={() => deleteSegment(segment.id)} title="Delete segment">
                      <Trash2 size={15} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
