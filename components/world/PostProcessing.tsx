'use client';

import React from 'react';
import * as THREE from 'three';
import {
  EffectComposer,
  Bloom,
  GodRays,
  HueSaturation,
  BrightnessContrast,
  ToneMapping,
  Vignette,
  SMAA,
} from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import { useGame } from '@/lib/store';
import { TIER_CONFIGS } from '@/lib/quality';

interface PostProcessingProps {
  bloomIntensity?: number;
  sunMesh?: THREE.Mesh | null;
}

export function PostProcessing({ bloomIntensity = 0.9, sunMesh }: PostProcessingProps) {
  const qualityTier = useGame((s) => s.qualityTier);
  const tierConfig = TIER_CONFIGS[qualityTier];

  // Note: Ambient Occlusion is baked directly into the voxel terrain vertex colors
  // (vAO in Island.tsx via 3-neighbor AO), exactly like Minecraft & Homecraft.
  // Screen-space N8AO is disabled because N8AOPostPass has renderTarget texture array
  // incompatibilities with modern Three.js and causes severe GPU lag on laptops.

  return (
    <EffectComposer multisampling={0}>
      {/* Emissive Selective Bloom */}
      {tierConfig.enableBloom && (
        <Bloom
          mipmapBlur
          luminanceThreshold={1.0}
          intensity={bloomIntensity}
        />
      )}

      {/* Volumetric Sun Shafts (GodRays on High Tier) */}
      {tierConfig.enableGodRays && sunMesh && (
        <GodRays
          sun={sunMesh}
          samples={12}
          density={0.8}
          decay={0.93}
          weight={0.3}
        />
      )}

      {/* Color Grading & Tone Mapping */}
      <HueSaturation saturation={0.15} />
      <BrightnessContrast contrast={0.08} />
      <ToneMapping mode={ToneMappingMode.AGX} />
      <Vignette offset={0.3} darkness={0.45} />

      {/* Subpixel Morphological Anti-Aliasing (SMAA on high tier only) */}
      {qualityTier === 'high' && <SMAA />}
    </EffectComposer>
  );
}
