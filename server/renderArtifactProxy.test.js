import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createRenderArtifactUrl, findLatestVideoArtifact } from './renderArtifactProxy.js';

const testRoot = path.join(process.cwd(), 'outputs', '.artifact-proxy-test');

afterEach(async () => {
  await rm(testRoot, { recursive: true, force: true });
});

describe('render artifact proxy helpers', () => {
  it('finds the newest non-empty video artifact in project output folders', async () => {
    await mkdir(testRoot, { recursive: true });
    const oldVideo = path.join(testRoot, 'old.mp4');
    const latestVideo = path.join(testRoot, 'latest.mp4');
    await writeFile(oldVideo, 'old');
    await writeFile(latestVideo, 'latest-video');

    const artifact = await findLatestVideoArtifact(testRoot);

    expect(artifact.filePath).toBe(latestVideo);
    expect(artifact.fileName).toBe('latest.mp4');
    expect(createRenderArtifactUrl(artifact.filePath)).toBe(`/render-artifacts/file?path=${encodeURIComponent(latestVideo)}`);
  });

  it('rejects paths outside project output folders', async () => {
    await expect(findLatestVideoArtifact(path.dirname(process.cwd()))).rejects.toThrow(/outside project render output folders/);
  });
});
