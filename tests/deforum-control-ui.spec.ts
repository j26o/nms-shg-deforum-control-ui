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
  const args = process.platform === 'win32' ? ['/c', 'pnpm.cmd', 'dev:ui', '--', '--port', '5173'] : ['dev:ui', '--', '--port', '5173'];
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

  await expect(page.getByRole('main', { name: 'Server startup' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Starting Deforum Control UI' })).toBeVisible();
  await expect(page.getByLabel('Server startup progress')).toBeVisible();
  const continueButton = page.getByRole('button', { name: 'Continue in UI-only mode' });
  if (await continueButton.isVisible()) {
    await expect(continueButton).toBeEnabled({ timeout: 10_000 });
    await continueButton.click();
  }

  await expect(page.getByText('Deforum Control UI')).toBeVisible();
  await expect(page.getByLabel('Seven by three preview frame')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Sources' })).toHaveCount(0);

  const promptNodes = page.getByLabel('Prompt JSON nodes');
  await expect(promptNodes.getByRole('heading', { name: 'Prompt JSON Nodes' })).toBeVisible();
  await expect(promptNodes.getByText('8 folder images loaded')).toBeVisible();
  await expect(promptNodes.getByAltText(/preview/i).first()).toBeVisible();

  const backendSelect = page.getByLabel('Backend', { exact: true });
  await expect(backendSelect).toHaveValue('a1111-deforum');
  await expect(page.getByLabel('Backend server status')).toBeVisible();
  await backendSelect.selectOption('huggingface-deforum');
  await expect(page.getByRole('button', { name: /Render HF Deforum/i })).toBeVisible();
  await backendSelect.selectOption('a1111-deforum');

  await page.getByLabel('Deforum controls').getByLabel('Model profile').selectOption('sdxl-base');
  await expect(page.locator('strong').filter({ hasText: 'SDXL Base 1.0' })).toBeVisible();
  await expect(page.getByRole('radio', { name: 'SDXL Base 1.0' })).toHaveCount(0);

  await expect(promptNodes.getByLabel('Active node prompt')).toHaveValue(/visionary future Singapore cityscape/);
  await expect(promptNodes.getByLabel('Active node prompt')).toHaveValue(/Extreme long-distance maritime view/);
  await expect(promptNodes.getByLabel('Active node negative params')).toHaveValue(/strong vanishing point/);

  await promptNodes.getByRole('button', { name: 'Node', exact: true }).click();
  await promptNodes.getByLabel('Active node frame').fill('30');
  await promptNodes.getByLabel('Active node image').selectOption({ index: 1 });
  await expect(promptNodes.getByAltText(/preview/i).first()).toBeVisible();
  await promptNodes.getByLabel('Active node prompt').fill('a beautiful coconut');
  await promptNodes.getByLabel('Active node negative params').fill('photo, realistic');
  await expect(promptNodes.getByLabel('Prompt payload JSON')).toHaveValue(/"30": "a beautiful coconut --neg photo, realistic"/);

  await page.getByRole('button', { name: /Render preview/i }).click();
  await expect(page.getByRole('status')).toContainText(/Render in progress|Render complete/);
  await expect(page.getByLabel(/Render progress|Queue progress/).first()).toBeVisible();
  await expect(page.getByRole('status')).toContainText(/Preview render complete/);
  await expect(page.getByText('complete').first()).toBeVisible();
  await expect(page.getByText('Simulated preview', { exact: true })).toBeVisible();
  await expect(page.getByAltText(/simulated preview/i)).toBeVisible();
  await expect(page.getByText(/simulated preview only/i).first()).toBeVisible();
  await expect(page.getByText(/outputs\/previews\/.*\.webm/)).toHaveCount(0);
  await expect(page.getByText('1 saved')).toBeVisible();
  await expect(page.getByRole('button', { name: /Render Deforum/i })).toBeVisible();

  if (process.env.RUN_REAL_DEF0RUM === '1' || process.env.RUN_REAL_DEFORUM === '1') {
    await expect(page.getByRole('button', { name: /Render Deforum/i })).toBeEnabled({ timeout: 15_000 });
    await page.getByRole('button', { name: /Render Deforum/i }).click();
    await expect(page.getByText(/stable-diffusion-webui/i).first()).toBeVisible({ timeout: 120_000 });
  }

  await expect(page.getByTitle('Export reviewed JSON')).toBeVisible();
  await expect(page.getByTitle('Export readable report')).toBeVisible();
});
