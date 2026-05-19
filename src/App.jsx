import { useEffect, useState } from 'react';
import { StartupScreen } from './components/workbench/StartupScreen.jsx';
import { Workbench } from './components/workbench/Workbench.jsx';
import { createInitialStartupState, runStartupChecks } from './services/startupHealth.js';

export function App() {
  const [startupState, setStartupState] = useState(createInitialStartupState);
  const [showWorkbench, setShowWorkbench] = useState(false);
  const [canContinue, setCanContinue] = useState(false);

  useEffect(() => {
    const abortController = new AbortController();
    const continueTimer = globalThis.setTimeout(() => setCanContinue(true), 1600);

    runStartupChecks({
      signal: abortController.signal,
      onUpdate: setStartupState,
    })
      .then((result) => {
        setStartupState(result);
        setCanContinue(true);
        globalThis.setTimeout(() => setShowWorkbench(true), 650);
      })
      .catch((error) => {
        if (abortController.signal.aborted) return;
        setStartupState((current) => ({
          ...current,
          phase: 'error',
          message: error instanceof Error ? error.message : String(error),
          progress: 100,
        }));
        setCanContinue(true);
      });

    return () => {
      abortController.abort();
      globalThis.clearTimeout(continueTimer);
    };
  }, []);

  if (!showWorkbench) {
    return <StartupScreen startupState={startupState} canContinue={canContinue} onContinue={() => setShowWorkbench(true)} />;
  }

  return <Workbench />;
}
