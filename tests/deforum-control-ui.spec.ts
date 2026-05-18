import { expect, test } from '@playwright/test';
import { spawn, type ChildProcess } from 'node:child_process';

const appUrl = 'http://127.0.0.1:5173/';
let devServer: ChildProcess | undefined;

async function canReachApp() {
  try {
    const response = await fetch(appUrl);
    return response.ok;
  } catch {
    return false;
  }
}

async function waitForApp() {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 60_000) {
    if (await canReachApp()) return;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Timed out waiting for ${appUrl}`);
}

test.beforeAll(async () => {
  if (await canReachApp()) return;
  const command = process.platform === 'win32' ? process.env.ComSpec ?? 'cmd.exe' : 'pnpm';
  const args = process.platform === 'win32' ? ['/c', 'pnpm.cmd', 'dev', '--', '--port', '5173'] : ['dev', '--', '--port', '5173'];
  devServer = spawn(command, args, {
    cwd: process.cwd(),
    stdio: 'ignore',
    windowsHide: true,
  });
  await waitForApp();
});

test.afterAll(() => {
  devServer?.kill();
});

test('loads workbench, edits controls, queues mock render, and exposes export actions', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto(appUrl);

  await expect(page.getByText('Deforum Control UI')).toBeVisible();
  await expect(page.getByLabel('Seven by three preview frame')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Sources' })).toBeVisible();
  await expect(page.getByLabel('Backend')).toHaveValue('a1111-deforum');
  await page.getByLabel('Backend').selectOption('huggingface-deforum');
  await expect(page.getByRole('button', { name: /Render HF Deforum/i })).toBeVisible();
  await page.getByLabel('Backend').selectOption('a1111-deforum');

  await page.getByLabel('Deforum controls').getByLabel('Model profile').selectOption('sdxl-base');
  await expect(page.locator('strong').filter({ hasText: 'SDXL Base 1.0' })).toBeVisible();
  await expect(page.getByRole('radio', { name: 'SDXL Base 1.0' })).toBeChecked();
  await page.getByRole('radio', { name: 'RealVisXL V5.0' }).check();
  await expect(page.locator('strong').filter({ hasText: 'RealVisXL V5.0' })).toBeVisible();

  await page.getByRole('button', { name: 'Segment', exact: true }).click();
  await expect(page.getByText(/240-359/)).toHaveCount(1);

  await page.getByRole('button', { name: /Render preview/i }).click();
  await expect(page.getByText('complete').first()).toBeVisible();
  await expect(page.getByText(/saved/)).toBeVisible();
  await expect(page.getByRole('button', { name: /Render Deforum/i })).toBeVisible();

  if (process.env.RUN_REAL_DEF0RUM === '1' || process.env.RUN_REAL_DEFORUM === '1') {
    await page.getByRole('button', { name: /Render Deforum/i }).click();
    await expect(page.getByText(/stable-diffusion-webui/i).first()).toBeVisible({ timeout: 120_000 });
  }

  await expect(page.getByTitle('Export reviewed JSON')).toBeVisible();
  await expect(page.getByTitle('Export readable report')).toBeVisible();
});
