import { spawn } from 'node:child_process';
import { createWriteStream, existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, '..');
const a1111BaseUrl = process.env.A1111_BASE_URL || 'http://127.0.0.1:7860';
const a1111BackendDir = join(repoRoot, 'render-tools', 'stable-diffusion-webui');
const a1111Launcher = join(a1111BackendDir, 'webui-user.bat');
const sourceAssetRoot = join(repoRoot, 'assets', 'images', 'source');
const logDir = join(repoRoot, 'outputs', 'logs');
const startTimeoutMs = Number(process.env.A1111_START_TIMEOUT_MS || 10 * 60 * 1000);
const pollIntervalMs = 2500;

let ownedBackendProcess;
let viteProcess;

function commandForPnpm(args) {
  if (process.platform === 'win32') {
    return {
      command: process.env.ComSpec || 'cmd.exe',
      args: ['/c', 'pnpm.cmd', ...args],
    };
  }

  return {
    command: 'pnpm',
    args,
  };
}

async function fetchJson(pathname, timeoutMs = 3000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(new URL(pathname, a1111BaseUrl), {
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.json();
  } finally {
    clearTimeout(timer);
  }
}

async function isA1111Ready() {
  try {
    await fetchJson('/deforum/api_version');
    await fetchJson('/sdapi/v1/sd-models');
    return true;
  } catch {
    return false;
  }
}

function startA1111Backend() {
  if (process.platform !== 'win32') {
    throw new Error('Automatic1111 launcher automation is currently configured for Windows webui-user.bat.');
  }

  if (!existsSync(a1111Launcher)) {
    throw new Error(`Automatic1111 launcher not found at ${a1111Launcher}`);
  }

  mkdirSync(logDir, { recursive: true });
  const logPath = join(logDir, 'a1111-dev-backend.log');
  const logStream = createWriteStream(logPath, { flags: 'a' });

  console.log(`[dev] Starting Automatic1111 Deforum backend from ${a1111BackendDir}`);
  console.log(`[dev] Backend log: ${logPath}`);

  const child = spawn(process.env.ComSpec || 'cmd.exe', ['/c', 'webui-user.bat'], {
    cwd: a1111BackendDir,
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });

  child.stdout.pipe(logStream);
  child.stderr.pipe(logStream);

  child.once('exit', (code, signal) => {
    if (!viteProcess?.killed) {
      console.error(`[dev] Automatic1111 backend exited before Vite stopped. code=${code ?? 'none'} signal=${signal ?? 'none'}`);
    }
  });

  ownedBackendProcess = child;
}

async function ensureA1111Backend() {
  if (process.env.SKIP_A1111_START === '1') {
    console.log('[dev] SKIP_A1111_START=1 set; skipping Automatic1111 startup check.');
    return;
  }

  if (await isA1111Ready()) {
    console.log(`[dev] Automatic1111 Deforum backend is already running at ${a1111BaseUrl}`);
    return;
  }

  startA1111Backend();
  const startedAt = Date.now();

  while (Date.now() - startedAt < startTimeoutMs) {
    if (await isA1111Ready()) {
      console.log(`[dev] Automatic1111 Deforum backend is ready at ${a1111BaseUrl}`);
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error(`Timed out waiting for Automatic1111 Deforum backend at ${a1111BaseUrl}`);
}

function startVite() {
  const { command, args } = commandForPnpm(['exec', 'vite', '--host', '127.0.0.1']);
  const env = {
    ...process.env,
    A1111_BASE_URL: a1111BaseUrl,
    VITE_SOURCE_ASSET_ROOT: process.env.VITE_SOURCE_ASSET_ROOT || sourceAssetRoot,
  };

  console.log(`[dev] Starting Vite UI server with VITE_SOURCE_ASSET_ROOT=${env.VITE_SOURCE_ASSET_ROOT}`);

  viteProcess = spawn(command, args, {
    cwd: repoRoot,
    env,
    stdio: 'inherit',
    windowsHide: true,
  });

  viteProcess.once('exit', (code, signal) => {
    cleanup();
    process.exit(code ?? (signal ? 1 : 0));
  });
}

function killProcessTree(child) {
  if (!child || child.killed) {
    return;
  }

  if (process.platform === 'win32') {
    spawn('taskkill', ['/pid', String(child.pid), '/t', '/f'], {
      stdio: 'ignore',
      windowsHide: true,
    });
    return;
  }

  child.kill('SIGTERM');
}

function cleanup() {
  killProcessTree(viteProcess);
  killProcessTree(ownedBackendProcess);
}

process.once('SIGINT', () => {
  cleanup();
  process.exit(130);
});

process.once('SIGTERM', () => {
  cleanup();
  process.exit(143);
});

try {
  await ensureA1111Backend();
  startVite();
} catch (error) {
  cleanup();
  console.error(`[dev] ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
