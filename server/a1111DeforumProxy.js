const MAX_BODY_BYTES = 5 * 1024 * 1024;
const DEFAULT_POLL_INTERVAL_MS = 2000;
const DEFAULT_MAX_POLLS = 3600;

const COMPLETE_STATUSES = new Set(['succeeded', 'success', 'complete', 'completed', 'done']);
const FAILED_STATUSES = new Set(['failed', 'error', 'cancelled', 'canceled']);

function getA1111BaseUrl(env = process.env) {
  return env.A1111_BASE_URL || 'http://127.0.0.1:7860';
}

function createJsonResponse(response, statusCode, payload) {
  response.statusCode = statusCode;
  response.setHeader('content-type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(payload));
}

async function readJsonBody(request) {
  const chunks = [];
  let size = 0;

  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      throw new Error('A1111 Deforum request body is too large.');
    }
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

function createA1111Url(baseUrl, routePath) {
  return `${baseUrl.replace(/\/+$/, '')}/${routePath.replace(/^\/+/, '')}`;
}

function isFetchConnectionError(error) {
  const message = error instanceof Error ? error.message : String(error);
  return message === 'fetch failed' || message.includes('ECONNREFUSED') || message.includes('UND_ERR_CONNECT_TIMEOUT');
}

function createA1111UnavailableMessage(baseUrl) {
  return [
    `Local A1111 backend is not reachable at ${baseUrl}.`,
    'Start it with `pnpm dev:backend` from this prototype folder, or start Automatic1111 manually with the Deforum extension enabled.',
  ].join(' ');
}

function sleep(ms) {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, ms);
  });
}

async function readUpstreamJson(response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function isCompleteStatus(value) {
  return COMPLETE_STATUSES.has(String(value ?? '').toLowerCase());
}

function isFailedStatus(value) {
  return FAILED_STATUSES.has(String(value ?? '').toLowerCase());
}

async function submitFullDeforumApi(settings, env) {
  const baseUrl = getA1111BaseUrl(env);
  const response = await fetch(createA1111Url(baseUrl, '/deforum_api/batches'), {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({ deforum_settings: settings }),
  });
  const json = await readUpstreamJson(response);

  if (!response.ok) {
    const message = json.message || json.error || json.raw || response.statusText;
    const error = new Error(`Deforum batch API failed: ${response.status} ${message}`);
    error.status = response.status;
    error.stage = 'submit';
    throw error;
  }

  return json;
}

async function pollFullDeforumJob(jobId, env) {
  const baseUrl = getA1111BaseUrl(env);
  const pollIntervalMs = Number(env.A1111_DEFORUM_POLL_INTERVAL_MS || DEFAULT_POLL_INTERVAL_MS);
  const maxPolls = Number(env.A1111_DEFORUM_MAX_POLLS || DEFAULT_MAX_POLLS);

  for (let index = 0; index < maxPolls; index += 1) {
    const response = await fetch(createA1111Url(baseUrl, `/deforum_api/jobs/${encodeURIComponent(jobId)}`));
    const job = await readUpstreamJson(response);

    if (!response.ok) {
      const message = job.message || job.error || job.raw || response.statusText;
      throw new Error(`Deforum job status failed: ${response.status} ${message}`);
    }

    if (job.outdir || job.output_path || isCompleteStatus(job.status) || isCompleteStatus(job.phase)) {
      return job;
    }

    if (isFailedStatus(job.status) || isFailedStatus(job.phase)) {
      throw new Error(`Deforum job failed: ${job.message || job.status || job.phase}`);
    }

    if (pollIntervalMs > 0) {
      await sleep(pollIntervalMs);
    }
  }

  throw new Error(`Deforum job timed out after ${maxPolls} polls.`);
}

async function submitSimpleDeforumApi(payload, env) {
  const settings = payload.settings ?? payload.settings_json;
  const settingsJson = typeof settings === 'string' ? settings : JSON.stringify(settings);
  const allowedParams = Array.isArray(payload.allowedParams)
    ? payload.allowedParams.join(';')
    : payload.allowed_params || payload.allowedParams || '';
  const params = new URLSearchParams({
    settings_json: settingsJson,
    allowed_params: allowedParams,
  });
  const baseUrl = getA1111BaseUrl(env);
  const response = await fetch(`${createA1111Url(baseUrl, '/deforum/run')}?${params.toString()}`, {
    method: 'POST',
  });
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`Deforum render failed: ${response.status} ${text}`);
  }

  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

export async function checkA1111DeforumStatus(env = process.env) {
  const baseUrl = getA1111BaseUrl(env);

  try {
    const apiVersionResponse = await fetch(createA1111Url(baseUrl, '/deforum/api_version'));
    const apiVersion = await readUpstreamJson(apiVersionResponse);

    if (!apiVersionResponse.ok) {
      return {
        backend: 'a1111-deforum',
        configured: true,
        ready: false,
        status: 'offline',
        baseUrl,
        error: `Deforum API status failed: ${apiVersionResponse.status} ${apiVersion.message || apiVersion.error || apiVersion.raw || apiVersionResponse.statusText}`,
      };
    }

    let modelCount = null;
    try {
      const modelsResponse = await fetch(createA1111Url(baseUrl, '/sdapi/v1/sd-models'));
      if (modelsResponse.ok) {
        const models = await readUpstreamJson(modelsResponse);
        modelCount = Array.isArray(models) ? models.length : null;
      }
    } catch {
      modelCount = null;
    }

    return {
      backend: 'a1111-deforum',
      configured: true,
      ready: true,
      status: 'ready',
      baseUrl,
      apiVersion: apiVersion.version ?? apiVersion.api_version ?? apiVersion,
      modelCount,
    };
  } catch (error) {
    return {
      backend: 'a1111-deforum',
      configured: true,
      ready: false,
      status: 'offline',
      baseUrl,
      error: isFetchConnectionError(error) ? createA1111UnavailableMessage(baseUrl) : error instanceof Error ? error.message : String(error),
    };
  }
}

export async function submitA1111DeforumRun(payload, env = process.env) {
  const settings = payload.settings ?? payload.settings_json;
  if (!settings) {
    throw new Error('Missing Deforum settings payload.');
  }

  if (env.A1111_DEFORUM_USE_SIMPLE_API === '1') {
    return submitSimpleDeforumApi(payload, env);
  }

  try {
    const batch = await submitFullDeforumApi(settings, env);
    const jobId = batch.job_ids?.[0] ?? batch.job_id;
    if (!jobId) {
      return { ...batch, api: 'deforum-api' };
    }
    const job = await pollFullDeforumJob(jobId, env);
    return {
      ...job,
      outdir: job.outdir || job.output_path || batch.outdir || '',
      api: 'deforum-api',
      batchId: batch.batch_id,
      jobId,
      batchResponse: batch,
    };
  } catch (error) {
    const canFallback = error?.stage === 'submit' && (error?.status === 404 || error?.status === 405);
    if (env.A1111_DEFORUM_DISABLE_SIMPLE_FALLBACK === '1' || !canFallback) {
      throw error;
    }
    return submitSimpleDeforumApi(payload, env);
  }
}

export async function handleA1111DeforumProxyRequest(request, response, env = process.env) {
  try {
    const requestUrl = new URL(request.url ?? '/', 'http://127.0.0.1');
    const pathName = requestUrl.pathname;
    const baseUrl = getA1111BaseUrl(env);

    if (request.method === 'GET' && pathName === '/a1111-deforum/status') {
      const status = await checkA1111DeforumStatus(env);
      createJsonResponse(response, 200, status);
      return;
    }

    if (request.method === 'GET' && pathName === '/a1111-deforum/api_version') {
      const upstream = await fetch(createA1111Url(baseUrl, '/deforum/api_version'));
      const text = await upstream.text();
      response.statusCode = upstream.status;
      response.setHeader('content-type', upstream.headers.get('content-type') ?? 'application/json; charset=utf-8');
      response.end(text);
      return;
    }

    if (request.method === 'POST' && pathName === '/a1111-deforum/run') {
      const payload = await readJsonBody(request);
      const result = await submitA1111DeforumRun(payload, env);
      createJsonResponse(response, 200, result);
      return;
    }

    createJsonResponse(response, 404, { error: 'Unknown A1111 Deforum proxy route.' });
  } catch (error) {
    const baseUrl = getA1111BaseUrl(env);
    const message = isFetchConnectionError(error)
      ? createA1111UnavailableMessage(baseUrl)
      : error instanceof Error
        ? error.message
        : String(error);
    createJsonResponse(response, isFetchConnectionError(error) ? 503 : 500, {
      error: message,
      backend: 'a1111-deforum',
      baseUrl,
    });
  }
}

export function createA1111DeforumProxyPlugin(env = process.env) {
  return {
    name: 'a1111-deforum-body-proxy',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        if (!request.url?.startsWith('/a1111-deforum')) {
          next();
          return;
        }

        handleA1111DeforumProxyRequest(request, response, env);
      });
    },
  };
}
