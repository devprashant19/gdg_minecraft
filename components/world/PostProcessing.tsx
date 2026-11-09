'use client';

import React from 'react';
import * as THREE from 'three';
import {
  EffectComposer,
  Bloom,
  N8AO,
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

  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      {/* Soft Contact Shadows (N8AO) */}
      {tierConfig.enableAO && (
        <N8AO
          aoRadius={1.2}
          intensity={2.5}
          halfRes={tierConfig.halfResAO}
        />
      )}

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
          samples={30}
          density={0.9}
          decay={0.93}
          weight={0.4}
        />
      )}

      {/* Color Grading & Tone Mapping */}
      <HueSaturation saturation={0.15} />
      <BrightnessContrast contrast={0.08} />
      <ToneMapping mode={ToneMappingMode.AGX} />
      <Vignette offset={0.3} darkness={0.45} />

      {/* Subpixel Morphological Anti-Aliasing (SMAA) */}
      <SMAA />
    </EffectComposer>
  );
}
