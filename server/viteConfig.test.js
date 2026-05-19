import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('vite frontend config', () => {
  it('does not scan or serve the local Automatic1111 runtime as frontend source', () => {
    const configSource = readFileSync(join(process.cwd(), 'vite.config.js'), 'utf8');

    expect(configSource).toContain("entries: ['index.html']");
    expect(configSource).toContain("exclude: ['bufferutil', 'utf-8-validate']");
    expect(configSource).toContain("deny: ['render-tools', 'render-tools/**']");
    expect(configSource).toContain("ignored: ['**/render-tools/**', '**/outputs/**']");
    expect(configSource).toContain("requestPath.includes('/render-tools/')");
  });
});
