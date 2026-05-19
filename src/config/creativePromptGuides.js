export const creativePromptGuides = [
  {
    id: 'future-marina-bay-fluid-memory',
    label: 'Future Marina Bay Fluid Memory',
    prompt:
      'A visionary future Singapore cityscape across Marina Bay, featuring NS Square floating civic platform, curved waterfront grandstand, Wetlands by the Bay with lush layered greenery and waterways, and the Singapore Founders Memorial with sculptural contemporary architecture. Blend iconic elements like Marina Bay Sands, Gardens by the Bay Supertrees, and advanced sustainable eco-architecture with vertical greenery and organic forms. Atmospheric mist and particle-based fluid simulations flow across the scene, forming wave-like motion layers inspired by ocean currents and wind, with soft volumetric fog, drifting haze, and dynamic particle trails. The mist behaves like a fluid system swirling, diffusing, and evolving across the skyline and water surface, partially revealing and concealing the city. Water reflects the city lights with subtle distortion and painterly diffusion. The composition is wide and cinematic, with strong depth and layered spatial atmosphere. Edges of the image dissolve into soft mist and particle diffusion, with blurred boundaries and no hard frame, as if the city is emerging from fog and memory. Elegant, immersive, exhibition-quality visual, blending realism with generative fluid aesthetics',
    negativePrompt:
      'hard frame, harsh crop, dry air, flat atmosphere, text artifacts, watermark, broken skyline, low detail, over-sharpened edges, rigid geometry',
  },
  {
    id: 'deep-night-maritime-horizon-band',
    label: 'Deep Night Maritime Horizon Band',
    prompt:
      'Extreme long-distance maritime view, island as a flat horizontal band across the entire frame, deep night scene. Futuristic Singapore skyline at deep night, seen sideways from far offshore over calm dark open ocean. Black night sky, dark open sea, city the only source of light. Ultra-long telephoto compression, orthographic flat horizon band, no vanishing perspective, zero depth recession, purely horizontal layered composition. The entire scene is a flat compressed strip - dark ocean in the foreground, razor-thin island band glowing against the night across the middle, deep black sky above - nothing rises above the horizon strip. Inland districts visible as layered geometric forms - futuristic HDB public housing blocks, each warping into a different sculptural form - spherical residential volumes, angular cuboids, pyramidal faceted masses, trapezoidal blocks, twisted spiraling towers, looping cylindrical forms - all in red and white painted concrete with balcony grilles and open corridor walkways, each form morphing and connecting organically into the next, all compressed flat within the thin horizon band. At ground level, translucent prism-like cuboid structures glow softly as hawker centers - semi-transparent faceted volumes with warm amber light bleeding through glassy walls, tiny silhouetted figures inside and outside. Nestled between buildings, large organic leaf-shaped canopy roofs shelter open-air hawker tables, warm amber light pooling underneath, small clusters of people gathered in the glow, all flattened within the horizon strip. Dense atmospheric mist flows in thick horizontal bands across the island at night, dissolving all building edges into soft watercolor bleeds, deep navy and midnight blue watercolor washes dominant, with warm amber and soft pink light glowing from within the mist, colors pooling like wet ink on damp paper against the dark night sky. City lights reflect faintly as broken glimmering streaks across the dark still sea surface. Light shafts pierce glowing mist like loose brushstrokes against the black sky. Wide cinematic frame, flat geographic survey view, everything compressed into a single horizontal band. Nocturnal, deep night atmosphere, ethereal, nostalgic, sci-fi realism, long exposure softness.',
    negativePrompt:
      'vanishing perspective, tall skyline above horizon strip, bright daylight, close foreground perspective, hard edges, high saturation, deep perspective recession, text, watermark, broken geometry',
  },
];

export function getCreativePromptGuide(guideId) {
  return creativePromptGuides.find((guide) => guide.id === guideId) ?? null;
}
