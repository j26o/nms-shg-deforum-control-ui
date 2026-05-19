import { createReadStream } from 'node:fs';
import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const VIDEO_EXTENSIONS = new Set(['.mp4', '.webm', '.mov']);

function createJsonResponse(response, statusCode, payload) {
  response.statusCode = statusCode;
  response.setHeader('content-type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(payload));
}

function getProjectRoot() {
  return process.cwd();
}

function getAllowedRoots(projectRoot = getProjectRoot()) {
  return [
    path.resolve(projectRoot, 'outputs'),
    path.resolve(projectRoot, 'render-tools', 'stable-diffusion-webui', 'outputs'),
  ];
}

function normaliseCandidatePath(candidatePath, projectRoot = getProjectRoot()) {
  const normalized = candidatePath.replace(/\\/g, path.sep);
  return path.isAbsolute(normalized) ? path.normalize(normalized) : path.resolve(projectRoot, normalized);
}

function assertSafeArtifactPath(candidatePath, projectRoot = getProjectRoot()) {
  if (!candidatePath || candidatePath.includes('\0')) {
    throw new Error('Missing artifact path.');
  }

  const absolutePath = normaliseCandidatePath(candidatePath, projectRoot);
  const allowed = getAllowedRoots(projectRoot).some((root) => {
    const relative = path.relative(root, absolutePath);
    return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
  });

  if (!allowed) {
    throw new Error('Artifact path is outside project render output folders.');
  }

  return absolutePath;
}

function getContentType(filePath) {
  switch (path.extname(filePath).toLowerCase()) {
    case '.mp4':
      return 'video/mp4';
    case '.webm':
      return 'video/webm';
    case '.mov':
      return 'video/quicktime';
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.txt':
      return 'text/plain; charset=utf-8';
    case '.json':
      return 'application/json; charset=utf-8';
    default:
      return 'application/octet-stream';
  }
}

function getRange(request, fileSize) {
  const range = request.headers.range;
  if (!range) return null;

  const match = /^bytes=(\d*)-(\d*)$/.exec(range);
  if (!match) return null;

  const start = match[1] ? Number(match[1]) : 0;
  const end = match[2] ? Number(match[2]) : fileSize - 1;
  if (!Number.isFinite(start) || !Number.isFinite(end) || start > end || start < 0 || end >= fileSize) {
    return null;
  }

  return { start, end };
}

export function createRenderArtifactUrl(filePath) {
  if (!filePath) return '';
  return `/render-artifacts/file?path=${encodeURIComponent(filePath)}`;
}

export async function findLatestVideoArtifact(outputDirectory, projectRoot = getProjectRoot()) {
  if (!outputDirectory) return null;

  const safeDirectory = assertSafeArtifactPath(outputDirectory, projectRoot);
  const directoryStat = await stat(safeDirectory).catch(() => null);
  if (!directoryStat?.isDirectory()) {
    return null;
  }

  const entries = await readdir(safeDirectory, { withFileTypes: true });
  const candidates = await Promise.all(
    entries
      .filter((entry) => entry.isFile() && VIDEO_EXTENSIONS.has(path.extname(entry.name).toLowerCase()))
      .map(async (entry) => {
        const filePath = path.join(safeDirectory, entry.name);
        const fileStat = await stat(filePath);
        return {
          filePath,
          fileName: entry.name,
          size: fileStat.size,
          modifiedMs: fileStat.mtimeMs,
        };
      }),
  );

  return candidates.filter((candidate) => candidate.size > 0).sort((left, right) => right.modifiedMs - left.modifiedMs)[0] ?? null;
}

export async function handleRenderArtifactRequest(request, response, projectRoot = getProjectRoot()) {
  try {
    const requestUrl = new URL(request.url ?? '/', 'http://127.0.0.1');

    if (request.method === 'GET' && requestUrl.pathname === '/render-artifacts/latest-video') {
      const directory = requestUrl.searchParams.get('dir') ?? '';
      const artifact = await findLatestVideoArtifact(directory, projectRoot);
      createJsonResponse(response, artifact ? 200 : 404, {
        found: Boolean(artifact),
        path: artifact?.filePath ?? '',
        url: artifact ? createRenderArtifactUrl(artifact.filePath) : '',
        fileName: artifact?.fileName ?? '',
        size: artifact?.size ?? 0,
      });
      return;
    }

    if (request.method === 'GET' && requestUrl.pathname === '/render-artifacts/file') {
      const filePath = assertSafeArtifactPath(requestUrl.searchParams.get('path') ?? '', projectRoot);
      const fileStat = await stat(filePath);
      if (!fileStat.isFile()) {
        createJsonResponse(response, 404, { error: 'Artifact is not a file.' });
        return;
      }

      response.statusCode = 200;
      response.setHeader('content-type', getContentType(filePath));
      response.setHeader('accept-ranges', 'bytes');

      const range = getRange(request, fileStat.size);
      if (range) {
        response.statusCode = 206;
        response.setHeader('content-range', `bytes ${range.start}-${range.end}/${fileStat.size}`);
        response.setHeader('content-length', String(range.end - range.start + 1));
        createReadStream(filePath, range).pipe(response);
        return;
      }

      response.setHeader('content-length', String(fileStat.size));
      createReadStream(filePath).pipe(response);
      return;
    }

    createJsonResponse(response, 404, { error: 'Unknown render artifact route.' });
  } catch (error) {
    createJsonResponse(response, 404, { error: error instanceof Error ? error.message : String(error) });
  }
}

export function createRenderArtifactProxyPlugin(projectRoot = getProjectRoot()) {
  return {
    name: 'render-artifact-proxy',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        if (!request.url?.startsWith('/render-artifacts')) {
          next();
          return;
        }

        void handleRenderArtifactRequest(request, response, projectRoot);
      });
    },
  };
}
