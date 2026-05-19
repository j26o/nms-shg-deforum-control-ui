import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createRenderArtifactUrl, findLatestFrameSequence, findLatestVideoArtifact } from './renderArtifactProxy.js';

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

  it('finds the newest Deforum frame sequence in project output folders', async () => {
    await mkdir(testRoot, { recursive: true });
    await writeFile(path.join(testRoot, '20260519120000_000000000.png'), 'frame-0');
    await writeFile(path.join(testRoot, '20260519120000_000000001.png'), 'frame-1');
    await writeFile(path.join(testRoot, '20260519120100_000000005.png'), 'newer-frame');

    const sequence = await findLatestFrameSequence(testRoot);

    expect(sequence.stem).toBe('20260519120100');
    expect(sequence.firstFrame).toBe(5);
    expect(sequence.latestFrame).toBe(5);
    expect(sequence.frameCount).toBe(1);
    expect(sequence.framePattern).toBe(path.join(testRoot, '20260519120100_%09d.png'));
    expect(sequence.outputPath).toBe(path.join(testRoot, '20260519120100.mp4'));
  });
});
