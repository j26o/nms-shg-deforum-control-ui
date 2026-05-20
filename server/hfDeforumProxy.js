import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import path from 'node:path';

const DEFAULT_TOKEN_NAME = 'nms-shg';
const DEFAULT_SUBMIT_PATH = '/jobs';
const DEFAULT_STATUS_PATH_TEMPLATE = '/jobs/:id';
const DEFAULT_ARTIFACT_PATH_TEMPLATE = '/jobs/:id/artifact';
const DEFAULT_HEALTH_PATH = '/health';
const MAX_BODY_BYTES = 20 * 1024 * 1024;

function createJsonResponse(response, statusCode, payload) {
  response.statusCode = statusCode;
  response.setHeader('content-type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(payload));
}

function trimSlashes(value) {
  return value.replace(/^\/+|\/+$/g, '');
}

function createEndpointUrl(baseUrl, routePath) {
  const normalizedBase = baseUrl.replace(/\/+$/, '');
  if (!routePath) return normalizedBase;
  return `${normalizedBase}/${trimSlashes(routePath)}`;
}

function fillPathTemplate(template, jobId) {
  return template.replace(':id', encodeURIComponent(jobId));
}

async function readJsonBody(request) {
  const chunks = [];
  let size = 0;

  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      throw new Error('Request body is too large.');
    }
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

async function readNamedTokenFromCache(tokenName = DEFAULT_TOKEN_NAME) {
  const tokenFile = path.join(homedir(), '.cache', 'huggingface', 'stored_tokens');
  let content = '';

  try {
    content = await readFile(tokenFile, 'utf8');
  } catch {
    return '';
  }

  let activeSection = '';
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    const sectionMatch = line.match(/^\[(.+)]$/);
    if (sectionMatch) {
      activeSection = sectionMatch[1];
      continue;
    }

    if (activeSection !== tokenName || !line.includes('=')) {
      continue;
    }

    const [, value] = line.split('=');
    const token = value?.trim();
    if (token?.startsWith('hf_')) {
      return token;
    }
  }

  return '';
}

export async function getHuggingFaceToken(env = process.env) {
  const explicitToken = env.HF_TOKEN || env.HUGGING_FACE_HUB_TOKEN || env.HUGGINGFACE_TOKEN;
  if (explicitToken) {
    return explicitToken;
  }

  return readNamedTokenFromCache(env.HF_TOKEN_NAME || DEFAULT_TOKEN_NAME);
}

function getEndpointConfig(env = process.env) {
  return {
    endpointUrl: env.HF_DEFORUM_ENDPOINT_URL || '',
    submitPath: env.HF_DEFORUM_SUBMIT_PATH || DEFAULT_SUBMIT_PATH,
    statusPathTemplate: env.HF_DEFORUM_STATUS_PATH_TEMPLATE || DEFAULT_STATUS_PATH_TEMPLATE,
    artifactPathTemplate: env.HF_DEFORUM_ARTIFACT_PATH_TEMPLATE || DEFAULT_ARTIFACT_PATH_TEMPLATE,
    healthPath: env.HF_DEFORUM_HEALTH_PATH || DEFAULT_HEALTH_PATH,
    includeImageData: env.HF_DEFORUM_INCLUDE_IMAGE_DATA !== '0',
  };
}

function assertEndpointConfigured(config) {
  if (!config.endpointUrl) {
    throw new Error('HF_DEFORUM_ENDPOINT_URL is not configured.');
  }
}

function assertSafeAssetPath(assetPath, projectRoot) {
  if (!assetPath || path.isAbsolute(assetPath) || assetPath.includes('://')) {
    throw new Error(`Unsafe asset path: ${assetPath || '<empty>'}`);
  }

  const absolutePath = path.resolve(projectRoot, assetPath);
  const sourceRoot = path.resolve(projectRoot, 'assets', 'images', 'source');
  const relative = path.relative(sourceRoot, absolutePath);

  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Asset path is outside assets/images/source: ${assetPath}`);
  }

  return absolutePath;
}

function getReferencedAssetIds(payload) {
  return new Set((payload.timeline ?? []).map((segment) => segment.sourceImageId).filter(Boolean));
}

async function enrichPayloadWithImageData(payload, { projectRoot = process.cwd(), includeImageData = true } = {}) {
  if (!includeImageData) {
    return payload;
  }

  const referencedAssetIds = getReferencedAssetIds(payload);
  const assets = await Promise.all(
    (payload.assets ?? []).map(async (asset) => {
      if (!referencedAssetIds.has(asset.id)) {
        return asset;
      }

      const absolutePath = assertSafeAssetPath(asset.path, projectRoot);
      const file = await readFile(absolutePath);
      return {
        ...asset,
        dataBase64: file.toString('base64'),
        mimeType: 'image/png',
      };
    }),
  );

  return {
    ...payload,
    assets,
  };
}

async function forwardJson(url, { method = 'GET', token, body } = {}) {
  const response = await fetch(url, {
    method,
    headers: {
      authorization: `Bearer ${token}`,
      accept: 'application/json, video/mp4, application/octet-stream',
      ...(body ? { 'content-type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const contentType = response.headers.get('content-type') ?? '';
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Hugging Face endpoint failed: ${response.status} ${text}`);
  }

  if (contentType.includes('application/json')) {
    return response.json();
  }

  const arrayBuffer = await response.arrayBuffer();
  return {
    status: 'complete',
    artifactContentType: contentType,
    artifactBase64: Buffer.from(arrayBuffer).toString('base64'),
  };
}

async function readEndpointHealth(config, token) {
  if (!config.endpointUrl || !token) {
    return null;
  }

  try {
    return await forwardJson(createEndpointUrl(config.endpointUrl, config.healthPath), { token });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function isRealDeforumEndpoint(health) {
  return Boolean(
    health &&
      !health.error &&
      String(health.renderMode ?? '').toLowerCase() === 'a1111' &&
      health.a1111Configured === true &&
      health.fallbackMorphEnabled !== true,
  );
}

export function normaliseHuggingFaceJobResponse(result, fallback = {}) {
  const jobId = result.jobId ?? result.id ?? result.runId ?? fallback.jobId ?? '';
  const status = result.status ?? result.state ?? (result.artifactUrl || result.outputPath || result.artifactBase64 ? 'complete' : 'submitted');

  return {
    jobId,
    status,
    outputPath: result.outputPath ?? result.artifactUrl ?? result.url ?? '',
    artifactUrl: result.artifactUrl ?? result.outputUrl ?? result.url ?? '',
    settingsFilePath: result.settingsFilePath ?? result.settingsUrl ?? '',
    frameCount: result.frameCount ?? result.frames ?? result.max_frames,
    fps: result.fps,
    renderDurationMs: result.renderDurationMs ?? result.durationMs,
    renderSettings: result.renderSettings ?? result.settings ?? result.payload ?? null,
    renderMode: result.renderMode ?? result.mode ?? '',
    artifactKind: result.artifactKind ?? '',
    isFallbackMorph: Boolean(result.isFallbackMorph),
    warnings: result.warnings ?? [],
    logs: result.logs ?? [],
    raw: result,
  };
}

async function handleSubmit(request, response, env) {
  const config = getEndpointConfig(env);
  assertEndpointConfigured(config);
  const token = await getHuggingFaceToken(env);
  if (!token) {
    throw new Error('No Hugging Face token available. Set HF_TOKEN or store a named token with HF_TOKEN_NAME.');
  }

  const body = await readJsonBody(request);
  const payload = await enrichPayloadWithImageData(body, { includeImageData: config.includeImageData });
  const result = await forwardJson(createEndpointUrl(config.endpointUrl, config.submitPath), {
    method: 'POST',
    token,
    body: payload,
  });

  createJsonResponse(response, 200, normaliseHuggingFaceJobResponse(result));
}

async function handleStatus(jobId, response, env) {
  const config = getEndpointConfig(env);
  assertEndpointConfigured(config);
  const token = await getHuggingFaceToken(env);
  if (!token) {
    throw new Error('No Hugging Face token available. Set HF_TOKEN or store a named token with HF_TOKEN_NAME.');
  }

  const routePath = fillPathTemplate(config.statusPathTemplate, jobId);
  const result = await forwardJson(createEndpointUrl(config.endpointUrl, routePath), { token });
  createJsonResponse(response, 200, normaliseHuggingFaceJobResponse(result, { jobId }));
}

async function handleArtifact(jobId, response, env) {
  const config = getEndpointConfig(env);
  assertEndpointConfigured(config);
  const token = await getHuggingFaceToken(env);
  if (!token) {
    throw new Error('No Hugging Face token available. Set HF_TOKEN or store a named token with HF_TOKEN_NAME.');
  }

  const routePath = fillPathTemplate(config.artifactPathTemplate, jobId);
  const url = createEndpointUrl(config.endpointUrl, routePath);
  const upstream = await fetch(url, {
    headers: {
      authorization: `Bearer ${token}`,
      accept: 'video/mp4, application/octet-stream',
    },
  });

  if (!upstream.ok) {
    const text = await upstream.text();
    throw new Error(`Hugging Face artifact fetch failed: ${upstream.status} ${text}`);
  }

  response.statusCode = 200;
  response.setHeader('content-type', upstream.headers.get('content-type') ?? 'video/mp4');
  response.end(Buffer.from(await upstream.arrayBuffer()));
}

export async function handleHuggingFaceDeforumRequest(request, response, env = process.env) {
  try {
    const requestUrl = new URL(request.url ?? '/', 'http://127.0.0.1');
    const pathName = requestUrl.pathname;

    if (request.method === 'GET' && pathName === '/hf-deforum/status') {
      const config = getEndpointConfig(env);
      const token = await getHuggingFaceToken(env);
      const endpointConfigured = Boolean(config.endpointUrl);
      const tokenConfigured = Boolean(token);
      const health = endpointConfigured && tokenConfigured ? await readEndpointHealth(config, token) : null;
      const realDeforumReady = isRealDeforumEndpoint(health);
      createJsonResponse(response, 200, {
        configured: Boolean(endpointConfigured && tokenConfigured),
        endpointConfigured,
        tokenConfigured,
        tokenName: env.HF_TOKEN_NAME || DEFAULT_TOKEN_NAME,
        backend: 'huggingface-deforum',
        realDeforumReady,
        health,
      });
      return;
    }

    if (request.method === 'POST' && pathName === '/hf-deforum/jobs') {
      await handleSubmit(request, response, env);
      return;
    }

    const statusMatch = pathName.match(/^\/hf-deforum\/jobs\/([^/]+)$/);
    if (request.method === 'GET' && statusMatch) {
      await handleStatus(statusMatch[1], response, env);
      return;
    }

    const artifactMatch = pathName.match(/^\/hf-deforum\/jobs\/([^/]+)\/artifact$/);
    if (request.method === 'GET' && artifactMatch) {
      await handleArtifact(artifactMatch[1], response, env);
      return;
    }

    createJsonResponse(response, 404, { error: 'Unknown Hugging Face Deforum proxy route.' });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    createJsonResponse(response, message.includes('not configured') ? 503 : 500, {
      error: message,
      backend: 'huggingface-deforum',
    });
  }
}

export function createHuggingFaceDeforumProxyPlugin(env = process.env) {
  return {
    name: 'hf-deforum-proxy',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        if (!request.url?.startsWith('/hf-deforum')) {
          next();
          return;
        }

        void handleHuggingFaceDeforumRequest(request, response, env);
      });
    },
  };
}
