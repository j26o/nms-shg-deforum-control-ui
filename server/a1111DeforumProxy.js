import { createRenderArtifactUrl, inspectRenderOutputDirectory } from './renderArtifactProxy.js';
import { spawn } from 'node:child_process';
import { access, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

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

function resolveSourceAssetPath(assetPath, projectRoot = process.cwd()) {
  if (!assetPath || assetPath.includes('://') || path.isAbsolute(assetPath)) {
    return assetPath;
  }

  const normalizedAssetPath = assetPath.replace(/[\\/]/g, path.sep);
  const sourcePrefix = ['assets', 'images', 'source'].join(path.sep);
  if (!normalizedAssetPath.startsWith(sourcePrefix)) {
    return assetPath;
  }

  const absolutePath = path.resolve(projectRoot, normalizedAssetPath);
  const sourceRoot = path.resolve(projectRoot, 'assets', 'images', 'source');
  const relative = path.relative(sourceRoot, absolutePath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Source asset path is outside assets/images/source: ${assetPath}`);
  }

  return absolutePath;
}

function normalizeDeforumAssetPaths(settings, projectRoot = process.cwd()) {
  const normalized = { ...settings };

  if (normalized.init_image) {
    normalized.init_image = resolveSourceAssetPath(normalized.init_image, projectRoot);
  }

  if (typeof normalized.init_images === 'string' && normalized.init_images.trim()) {
    try {
      const initImages = JSON.parse(normalized.init_images);
      normalized.init_images = JSON.stringify(
        Object.fromEntries(Object.entries(initImages).map(([frame, assetPath]) => [frame, resolveSourceAssetPath(String(assetPath), projectRoot)])),
        null,
        4,
      );
    } catch {
      normalized.init_images = normalized.init_images;
    }
  }

  return normalized;
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

async function pathExists(filePath) {
  await access(filePath);
  return filePath;
}

function getA1111Img2ImgOutputRoot(env = process.env) {
  return env.A1111_IMG2IMG_OUTPUT_DIR || path.resolve(process.cwd(), 'render-tools', 'stable-diffusion-webui', 'outputs', 'img2img-images');
}

async function doesPathExist(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function createUniqueBatchName(batchName, env = process.env) {
  const baseName = String(batchName || 'deforum-render').trim() || 'deforum-render';
  const outputRoot = getA1111Img2ImgOutputRoot(env);
  let candidate = baseName;
  let suffix = 1;

  while (await doesPathExist(path.join(outputRoot, candidate))) {
    suffix += 1;
    candidate = `${baseName}-${String(suffix).padStart(2, '0')}`;
  }

  return candidate;
}

async function ensureUniqueBatchName(settings, env = process.env) {
  return {
    ...settings,
    batch_name: await createUniqueBatchName(settings.batch_name, env),
  };
}

async function findFfmpegExecutable(env = process.env) {
  const candidates = [
    env.FFMPEG_PATH,
    env.FFMPEG_BINARY,
    path.resolve(process.cwd(), 'render-tools', 'ffmpeg', 'ffmpeg-8.1.1-full_build', 'bin', 'ffmpeg.exe'),
  ].filter(Boolean);

  for (const candidate of candidates) {
    try {
      return await pathExists(candidate);
    } catch {
      // Try the next configured candidate before falling back to PATH.
    }
  }

  return process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg';
}

async function createA1111OptionsOverrides(env = process.env) {
  const overrides = {};

  try {
    overrides.deforum_ffmpeg_location = await findFfmpegExecutable(env);
  } catch {
    // Deforum will fall back to its configured option or PATH.
  }

  return overrides;
}

async function readFrameSequenceFps(sequence) {
  const settingsPath = path.join(sequence.directory, `${sequence.stem}_settings.txt`);

  try {
    const settings = JSON.parse(await readFile(settingsPath, 'utf8'));
    const fps = Number(settings.fps);
    return Number.isFinite(fps) && fps > 0 ? fps : 24;
  } catch {
    return 24;
  }
}

function runFfmpegStitch(ffmpegPath, sequence, fps, env = process.env) {
  const timeoutMs = Number(env.A1111_DEFORUM_FFMPEG_TIMEOUT_MS || 120000);
  const args = [
    '-y',
    '-hide_banner',
    '-loglevel',
    'error',
    '-framerate',
    String(fps),
    '-start_number',
    String(sequence.firstFrame),
    '-i',
    sequence.framePattern,
    '-c:v',
    'libx264',
    '-pix_fmt',
    'yuv420p',
    '-movflags',
    '+faststart',
    sequence.outputPath,
  ];

  return new Promise((resolve, reject) => {
    const child = spawn(ffmpegPath, args, {
      cwd: sequence.directory,
      windowsHide: true,
    });
    const chunks = [];
    let settled = false;
    const timer = timeoutMs > 0
      ? globalThis.setTimeout(() => {
          settled = true;
          child.kill('SIGTERM');
          reject(new Error(`FFmpeg fallback stitch timed out after ${timeoutMs}ms.`));
        }, timeoutMs)
      : null;

    const collect = (chunk) => {
      chunks.push(Buffer.from(chunk));
      while (Buffer.concat(chunks).length > 4000) {
        chunks.shift();
      }
    };

    child.stdout.on('data', collect);
    child.stderr.on('data', collect);
    child.on('error', (error) => {
      if (settled) return;
      settled = true;
      if (timer) globalThis.clearTimeout(timer);
      reject(error);
    });
    child.on('close', (code) => {
      if (settled) return;
      settled = true;
      if (timer) globalThis.clearTimeout(timer);
      if (code === 0) {
        resolve();
        return;
      }
      const output = Buffer.concat(chunks).toString('utf8').trim();
      reject(new Error(`FFmpeg fallback stitch failed with exit code ${code}.${output ? ` ${output}` : ''}`));
    });
  });
}

async function stitchMissingVideoArtifact(outdir, inspection, env = process.env) {
  if (env.A1111_DEFORUM_DISABLE_FFMPEG_FALLBACK === '1') {
    return null;
  }

  const sequence = inspection.latestFrameSequence;
  if (!sequence || sequence.frameCount === 0) {
    return null;
  }

  const existingOutput = await stat(sequence.outputPath).catch(() => null);
  if (existingOutput?.isFile() && existingOutput.size > 0) {
    return {
      filePath: sequence.outputPath,
      fileName: path.basename(sequence.outputPath),
      size: existingOutput.size,
      modifiedMs: existingOutput.mtimeMs,
    };
  }

  const ffmpegPath = await findFfmpegExecutable(env);
  const fps = await readFrameSequenceFps(sequence);
  await runFfmpegStitch(ffmpegPath, sequence, fps, env);

  const outputStat = await stat(sequence.outputPath);
  if (!outputStat.isFile() || outputStat.size <= 0) {
    throw new Error(`FFmpeg fallback stitch did not create a non-empty MP4 at ${sequence.outputPath}.`);
  }

  return {
    filePath: sequence.outputPath,
    fileName: path.basename(sequence.outputPath),
    size: outputStat.size,
    modifiedMs: outputStat.mtimeMs,
    stitchedFromFrames: true,
    frameCount: sequence.frameCount,
    fps,
    outdir,
  };
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

async function inspectA1111Output(outdir, env = process.env, options = {}) {
  const inspection = await inspectRenderOutputDirectory(outdir).catch(() => ({
    exists: false,
    videoCount: 0,
    frameCount: 0,
    settingsCount: 0,
    latestVideo: null,
    latestFrameSequence: null,
  }));
  const videoArtifact = inspection.latestVideo ?? (options.stitchFrames
    ? await stitchMissingVideoArtifact(outdir, inspection, env).catch((error) => {
        inspection.stitchError = error instanceof Error ? error.message : String(error);
        return null;
      })
    : null);

  return {
    ...inspection,
    artifactPath: videoArtifact?.filePath ?? '',
    artifactUrl: videoArtifact ? createRenderArtifactUrl(videoArtifact.filePath) : '',
    artifactFileName: videoArtifact?.fileName ?? '',
  };
}

function throwMissingArtifactError(outdir, inspection) {
  const details = [
    `No MP4 artifact was created in ${outdir || '<unknown output folder>'}.`,
    `Found ${inspection.frameCount} frame image${inspection.frameCount === 1 ? '' : 's'} and ${inspection.settingsCount} settings file${inspection.settingsCount === 1 ? '' : 's'}.`,
  ];

  if (inspection.settingsCount > 0 && inspection.frameCount === 0) {
    details.push('Deforum saved the settings txt but did not generate frames. Check the Automatic1111 terminal for the backend error.');
  }

  if (inspection.stitchError) {
    details.push(`Frame-to-MP4 fallback also failed: ${inspection.stitchError}`);
  }

  const error = new Error(details.join(' '));
  error.status = 502;
  error.stage = 'artifact-validation';
  throw error;
}

async function submitFullDeforumApi(settings, env) {
  const baseUrl = getA1111BaseUrl(env);
  const normalizedSettings = await ensureUniqueBatchName(normalizeDeforumAssetPaths(settings), env);
  const optionsOverrides = await createA1111OptionsOverrides(env);
  const response = await fetch(createA1111Url(baseUrl, '/deforum_api/batches'), {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      deforum_settings: normalizedSettings,
      options_overrides: optionsOverrides,
    }),
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

    const outdir = job.outdir || job.output_path || '';
    if (outdir) {
      const inspection = await inspectA1111Output(outdir, env);
      if (inspection.artifactUrl) {
        return {
          ...job,
          outdir,
          artifactPath: inspection.artifactPath,
          artifactUrl: inspection.artifactUrl,
          artifactFileName: inspection.artifactFileName,
          artifactInspection: inspection,
        };
      }
    }

    if (isCompleteStatus(job.status) || isCompleteStatus(job.phase)) {
      const inspection = await inspectA1111Output(outdir, env, { stitchFrames: true });
      if (inspection.artifactUrl) {
        return {
          ...job,
          outdir,
          artifactPath: inspection.artifactPath,
          artifactUrl: inspection.artifactUrl,
          artifactFileName: inspection.artifactFileName,
          artifactInspection: inspection,
        };
      }
      throwMissingArtifactError(outdir, inspection);
    }

    if (isFailedStatus(job.status) || isFailedStatus(job.phase)) {
      throw new Error(`Deforum job failed: ${job.message || job.error || job.raw || job.status || job.phase}`);
    }

    if (pollIntervalMs > 0) {
      await sleep(pollIntervalMs);
    }
  }

  throw new Error(`Deforum job timed out after ${maxPolls} polls.`);
}

async function submitSimpleDeforumApi(payload, env) {
  const settings = payload.settings ?? payload.settings_json;
  const normalizedSettings = await ensureUniqueBatchName(
    typeof settings === 'string' ? normalizeDeforumAssetPaths(JSON.parse(settings)) : normalizeDeforumAssetPaths(settings),
    env,
  );
  const settingsJson = JSON.stringify(normalizedSettings);
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

  let result;
  try {
    result = JSON.parse(text);
  } catch {
    return { raw: text };
  }

  const outdir = result.outdir || result.output_path || '';
  const inspection = await inspectA1111Output(outdir, env, { stitchFrames: true });
  if (!inspection.artifactUrl) {
    throwMissingArtifactError(outdir, inspection);
  }
  return {
    ...result,
    artifactPath: inspection.artifactPath,
    artifactUrl: inspection.artifactUrl,
    artifactFileName: inspection.artifactFileName,
    artifactInspection: inspection,
  };
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
      const outdir = batch.outdir || batch.output_path || '';
      const inspection = await inspectA1111Output(outdir, env, { stitchFrames: true });
      if (!inspection.artifactUrl) {
        throwMissingArtifactError(outdir, inspection);
      }
      return {
        ...batch,
        outdir,
        artifactPath: inspection.artifactPath,
        artifactUrl: inspection.artifactUrl,
        artifactFileName: inspection.artifactFileName,
        artifactInspection: inspection,
        api: 'deforum-api',
      };
    }
    const job = await pollFullDeforumJob(jobId, env);
    const outdir = job.outdir || job.output_path || batch.outdir || '';
    const inspection = job.artifactInspection ?? (await inspectA1111Output(outdir, env, { stitchFrames: true }));
    if (!inspection.artifactUrl) {
      throwMissingArtifactError(outdir, inspection);
    }
    return {
      ...job,
      outdir,
      artifactPath: inspection.artifactPath,
      artifactUrl: inspection.artifactUrl,
      artifactFileName: inspection.artifactFileName,
      artifactInspection: inspection,
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
    createJsonResponse(response, isFetchConnectionError(error) ? 503 : error?.status || 500, {
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
