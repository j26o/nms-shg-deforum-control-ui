import { AlertTriangle, CheckCircle2, LoaderCircle, Server } from 'lucide-react';
import styles from './Workbench.module.css';

function StatusIcon({ status }) {
  if (status === 'ready') return <CheckCircle2 size={18} aria-hidden="true" />;
  if (status === 'checking') return <LoaderCircle size={18} className={styles.spinIcon} aria-hidden="true" />;
  return <AlertTriangle size={18} aria-hidden="true" />;
}

export function StartupScreen({ startupState, canContinue, onContinue }) {
  return (
    <main className={styles.startupScreen} aria-label="Server startup">
      <section className={styles.startupPanel} role="status" aria-live="polite">
        <div className={styles.startupBrand}>
          <Server size={28} aria-hidden="true" />
          <div>
            <h1>Starting Deforum Control UI</h1>
            <p>{startupState.message}</p>
          </div>
        </div>

        <div className={styles.startupProgress} aria-label="Server startup progress">
          <span style={{ width: `${startupState.progress}%` }} />
        </div>

        <ol className={styles.startupStepList}>
          {startupState.steps.map((step) => (
            <li key={step.id} className={styles[`startupStep_${step.status}`]}>
              <StatusIcon status={step.status} />
              <div>
                <strong>{step.label}</strong>
                <span>{step.detail}</span>
              </div>
            </li>
          ))}
        </ol>

        <button type="button" className={styles.secondaryButton} onClick={onContinue} disabled={!canContinue}>
          Continue in UI-only mode
        </button>
      </section>
    </main>
  );
}
