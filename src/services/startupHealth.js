const DEFAULT_BACKEND_WAIT_MS = 4500;
const POLL_INTERVAL_MS = 650;

function sleep(ms) {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, ms);
  });
}

function createStep(id, label, status = 'waiting', detail = '') {
  return { id, label, status, detail };
}

function updateStep(steps, id, patch) {
  return steps.map((step) => (step.id === id ? { ...step, ...patch } : step));
}

function getProgress(steps) {
  const weights = {
    ready: 1,
    optional: 1,
    offline: 1,
    checking: 0.45,
    waiting: 0.15,
  };
  const total = steps.reduce((sum, step) => sum + (weights[step.status] ?? 0), 0);
  return Math.min(100, Math.round((total / steps.length) * 100));
}

async function fetchJson(url, signal) {
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`.trim());
  }
  return response.json();
}

async function checkHuggingFaceProxy(signal) {
  try {
    const status = await fetchJson('/hf-deforum/status', signal);
    if (status.configured) {
      return { status: 'ready', detail: 'Proxy and endpoint configured.' };
    }
    if (status.tokenConfigured || status.endpointConfigured) {
      return { status: 'optional', detail: 'Proxy online; endpoint setup is incomplete.' };
    }
    return { status: 'optional', detail: 'Proxy online; Hugging Face backend is not configured.' };
  } catch (error) {
    return {
      status: 'offline',
      detail: `Hugging Face proxy not responding: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

async function waitForA1111(signal, timeoutMs) {
  const startedAt = performance.now();

  while (performance.now() - startedAt < timeoutMs) {
    try {
      const status = await fetchJson('/a1111/deforum/api_version', signal);
      return {
        status: 'ready',
        detail: `Local Deforum API ready${status.version ? `: ${status.version}` : '.'}`,
      };
    } catch {
      await sleep(POLL_INTERVAL_MS);
    }
  }

  return {
    status: 'offline',
    detail: 'Local A1111 Deforum is not ready. UI-only preview mode is available.',
  };
}

export function createInitialStartupState() {
  const steps = [
    createStep('workbench', 'Workbench server', 'ready', 'Vite UI is serving the app.'),
    createStep('a1111', 'Local A1111 Deforum', 'checking', 'Waiting for /deforum/api_version.'),
    createStep('hf', 'Hugging Face proxy', 'checking', 'Checking local credential-safe proxy.'),
  ];

  return {
    phase: 'checking',
    message: 'Starting local render services...',
    progress: getProgress(steps),
    steps,
  };
}

export async function runStartupChecks({ onUpdate, signal, timeoutMs = DEFAULT_BACKEND_WAIT_MS } = {}) {
  let steps = createInitialStartupState().steps;

  const emit = (message, phase = 'checking') => {
    onUpdate?.({
      phase,
      message,
      progress: getProgress(steps),
      steps,
    });
  };

  emit('Starting local render services...');

  const [a1111, huggingFace] = await Promise.all([waitForA1111(signal, timeoutMs), checkHuggingFaceProxy(signal)]);

  steps = updateStep(steps, 'a1111', a1111);
  emit(a1111.status === 'ready' ? 'Local Deforum backend is ready.' : 'Continuing with UI-only preview mode.');

  steps = updateStep(steps, 'hf', huggingFace);
  emit('Startup checks complete.', 'complete');

  return {
    phase: 'complete',
    message: 'Startup checks complete.',
    progress: 100,
    steps,
  };
}
