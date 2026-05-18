# Decisions

This file records product and implementation decisions for the Deforum Control UI prototype.

## 2026-05-18: Use Browser-Local React Prototype First

Decision: Build the first executable pass as a React + Vite browser app, not Electron.

Reason: The PRD asks for a local tuning bench, and the first review needs fast UI iteration more than packaged desktop filesystem access. Electron can be added later if local file pickers, kiosk packaging, or fullscreen deployment become required.

## 2026-05-18: Keep Renderer Behind A Mock Adapter

Decision: Implement `src/services/renderAdapter.js` and `src/services/mockRenderAdapter.js` before integrating a real Deforum backend.

Reason: At scaffold time the adapter target was still open. The UI, config export, render queue, and take comparison could be reviewed independently while preserving a replaceable boundary. The first real backend target was later selected as Automatic1111 Deforum.

## 2026-05-18: Preserve 1680x720 As The Source Contract

Decision: Validate enabled source assets as `1680x720` unless explicitly marked as crop or pad tests.

Reason: The supplied exercise assets are panoramic `7:3`; preserving that frame avoids accidental `16:9` assumptions and keeps exported presets aligned with the PRD.

## 2026-05-18: Use One Canonical AI Context File

Decision: `AGENTS.md`, `CLAUDE.md`, and `GEMINI.md` point to `docs/ai-context.md` instead of duplicating instructions.

Reason: Multiple assistant-specific files drift quickly. A single source keeps repo context consistent while still supporting common tool conventions.

## 2026-05-18: Use Automatic1111 Deforum As First Real Backend

Decision: Use Automatic1111 WebUI with `sd-webui-deforum` as the first local render backend and expose a minimal `Render Deforum` UI action through a Vite `/a1111` proxy.

Reason: This matches the PRD reference workflow, runs locally on the RTX 4090 PC, and lets the prototype verify real Deforum API connectivity before a fuller adapter contract is built.

## 2026-05-18: Keep Real Backend Test Opt-In

Decision: The Playwright smoke test only clicks the real `Render Deforum` path when `RUN_REAL_DEFORUM=1`.

Reason: Regular UI checks should remain fast and independent of a running GPU backend. The opt-in test gives concrete backend evidence when Automatic1111 is running.
