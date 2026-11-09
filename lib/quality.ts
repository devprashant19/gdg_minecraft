import { QualityTier } from './store';
import { getGPUTier } from 'detect-gpu';

export interface TierConfig {
  dpr: [number, number];
  shadowMapSize: number;
  enableAO: boolean;
  halfResAO: boolean;
  enableGodRays: boolean;
  enableBloom: boolean;
  cloudsCount: number;
  sparklesCount: number;
  swayInShadows: boolean;
}

export const TIER_CONFIGS: Record<QualityTier, TierConfig> = {
  high: {
    dpr: [1, 1.25],
    shadowMapSize: 2048,
    enableAO: true,
    halfResAO: true,
    enableGodRays: true,
    enableBloom: true,
    cloudsCount: 40,
    sparklesCount: 40,
    swayInShadows: true,
  },
  medium: {
    dpr: [1, 1.0],
    shadowMapSize: 1024,
    enableAO: true,
    halfResAO: true,
    enableGodRays: false,
    enableBloom: true,
    cloudsCount: 30,
    sparklesCount: 30,
    swayInShadows: true,
  },
  low: {
    dpr: [1, 1.0],
    shadowMapSize: 1024,
    enableAO: false,
    halfResAO: true,
    enableGodRays: false,
    enableBloom: false,
    cloudsCount: 15,
    sparklesCount: 15,
    swayInShadows: false,
  },
};

export async function detectQualityTier(): Promise<QualityTier> {
  if (typeof window === 'undefined') return 'medium';

  try {
    const isMobile =
      /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(
        navigator.userAgent
      ) ||
      (navigator.maxTouchPoints > 1 && window.innerWidth < 768);

    if (isMobile) {
      return 'low';
    }

    // Direct WebGL hardware inspection for reliable laptop/desktop GPU tiering
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL).toLowerCase();
        // High-end dedicated GPUs
        if (
          /nvidia|geforce|rtx|quadro|radeon rx|apple m[2-9] (pro|max|ultra)/.test(renderer) &&
          !/intel/.test(renderer)
        ) {
          return 'high';
        }
        // Integrated laptop GPUs
        if (/intel|uhd|iris|radeon graphics|apple m[1-9]/.test(renderer)) {
          return 'medium';
        }
      }
    }

    const gpu = await getGPUTier();

    if (gpu.tier >= 3 && !gpu.isMobile) {
      return 'high';
    }
    if (gpu.tier === 2) {
      return 'medium';
    }
    return 'low';
  } catch {
    // Robust fallback based on device characteristics
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return 'low';
    }
    return 'medium';
  }
}
