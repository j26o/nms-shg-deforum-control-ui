const BACKEND_LABELS = {
  'a1111-deforum': 'Local A1111',
  'huggingface-deforum': 'Hugging Face',
};

async function readJsonResponse(response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function createFetchFailureStatus(backend, error) {
  const label = BACKEND_LABELS[backend] ?? backend;
  return {
    backend,
    label,
    status: 'offline',
    ready: false,
    detail: `${label} status check failed: ${error instanceof Error ? error.message : String(error)}`,
  };
}

export function createInitialBackendStatus(backend = 'a1111-deforum') {
  return {
    backend,
    label: BACKEND_LABELS[backend] ?? backend,
    status: 'checking',
    ready: false,
    detail: 'Checking server...',
  };
}

export async function checkBackendStatus(backend = 'a1111-deforum', signal) {
  if (backend === 'huggingface-deforum') {
    try {
      const response = await fetch('/hf-deforum/status', { signal });
      const json = await readJsonResponse(response);

      if (!response.ok) {
        return {
          backend,
          label: BACKEND_LABELS[backend],
          status: 'offline',
          ready: false,
          detail: json.error || json.raw || `Status check failed: ${response.status}`,
        };
      }

      if (json.configured && json.realDeforumReady) {
        return {
          backend,
          label: BACKEND_LABELS[backend],
          status: 'ready',
          ready: true,
          detail: 'Proxy and real Deforum endpoint are ready.',
        };
      }

      if (json.configured && json.health?.fallbackMorphEnabled) {
        return {
          backend,
          label: BACKEND_LABELS[backend],
          status: 'not-configured',
          ready: false,
          detail: 'Hugging Face endpoint is in smoke fallback mode. It returns crossfade MP4s, not real Deforum renders.',
        };
      }

      if (json.configured && json.health?.a1111Configured === false) {
        return {
          backend,
          label: BACKEND_LABELS[backend],
          status: 'not-configured',
          ready: false,
          detail: 'Hugging Face endpoint is configured, but no remote A1111 Deforum backend is attached.',
        };
      }

      if (json.configured && json.health?.error) {
        return {
          backend,
          label: BACKEND_LABELS[backend],
          status: 'offline',
          ready: false,
          detail: `Hugging Face endpoint health check failed: ${json.health.error}`,
        };
      }

      return {
        backend,
        label: BACKEND_LABELS[backend],
        status: 'not-configured',
        ready: false,
        detail: json.endpointConfigured || json.tokenConfigured ? 'Proxy online; endpoint setup is incomplete.' : 'Proxy online; endpoint not configured.',
      };
    } catch (error) {
      return createFetchFailureStatus(backend, error);
    }
  }

  try {
    const response = await fetch('/a1111-deforum/status', { signal });
    const json = await readJsonResponse(response);

    if (response.ok && json.ready) {
      const version = typeof json.apiVersion === 'string' ? json.apiVersion : json.apiVersion?.version;
      return {
        backend,
        label: BACKEND_LABELS[backend],
        status: 'ready',
        ready: true,
        detail: version ? `Deforum API ready: ${version}` : 'Deforum API ready.',
        baseUrl: json.baseUrl,
      };
    }

    return {
      backend,
      label: BACKEND_LABELS[backend],
      status: 'offline',
      ready: false,
      detail: json.error || json.raw || `Status check failed: ${response.status}`,
      baseUrl: json.baseUrl,
    };
  } catch (error) {
    return createFetchFailureStatus(backend, error);
  }
}
