# Source Assets

Status: exercise assets added
Canonical folder: `assets/images/source/`

## Current Asset Set

The current exercise image set contains 24 PNG files:

- `assets/images/source/20260430/` - 10 files
- `assets/images/source/20260512/` - 14 files

All files were checked locally and are:

- width: 1680 px
- height: 720 px
- aspect ratio: 7:3

## UI Implications

The prototype workbench and render backend should treat 1680x720 as the source canvas:

- preserve the full 7:3 frame in the centre preview;
- show safe-frame guides against the full 1680x720 image;
- avoid 16:9 layout assumptions;
- default image crop mode to `contain-7x3`;
- store source, preview, review-preview, and final resolution in exported presets.

## Deforum / Render Setup Implications

Use these initial render sizes:

| Use | Resolution | Notes |
|---|---:|---|
| Source review | 1680x720 | Matches the provided PNGs. |
| Fast preview | 896x384 | 7:3 and 64-pixel aligned. |
| Review preview | 1344x576 | 7:3 and 64-pixel aligned. |
| Final exercise config | 1680x720 | Use when the selected backend accepts it. |

Some Stable Diffusion and Deforum backends prefer dimensions divisible by 64. If 1680x720 is rejected, render at `1344x576` for review passes and upscale or pad/crop back to 1680x720 for comparison.

## Git Policy

These source PNGs are part of the exercise and are tracked in Git.

Generated videos, preview renders, model checkpoints, temporary outputs, and local render folders remain ignored.
