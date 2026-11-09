import * as THREE from 'three';

export interface TimeOfDayPreset {
  name: string;
  t: number;
  sunColor: string;
  sunIntensity: number;
  hemiSky: string;
  hemiGround: string;
  fogColor: string;
  horizon: string;
  zenith: string;
  bloom: number;
  starAlpha: number;
}

export const TIME_OF_DAY_PRESETS: readonly TimeOfDayPreset[] = [
  {
    name: 'Night',
    t: 0.0,
    sunColor: '#9fb7ff',
    sunIntensity: 0.4,
    hemiSky: '#1b2550',
    hemiGround: '#0b0b12',
    fogColor: '#0e1430',
    horizon: '#0e1430',
    zenith: '#080c1d',
    bloom: 1.4,
    starAlpha: 1.0,
  },
  {
    name: 'Dawn',
    t: 0.25,
    sunColor: '#ffc9a3',
    sunIntensity: 1.6,
    hemiSky: '#a7b8e8',
    hemiGround: '#4b3a2b',
    fogColor: '#e8b9a6',
    horizon: '#e8b9a6',
    zenith: '#5b7bc4',
    bloom: 1.0,
    starAlpha: 0.0,
  },
  {
    name: 'Noon',
    t: 0.5,
    sunColor: '#fff1d6',
    sunIntensity: 2.5,
    hemiSky: '#a8dcff',
    hemiGround: '#7a6a45',
    fogColor: '#bfe3ff',
    horizon: '#bfe3ff',
    zenith: '#4988e0',
    bloom: 0.6,
    starAlpha: 0.0,
  },
  {
    name: 'Golden Hour',
    t: 0.72,
    sunColor: '#ffb46b',
    sunIntensity: 3.0,
    hemiSky: '#8ec5ff',
    hemiGround: '#6b4a2b',
    fogColor: '#f6c7a0',
    horizon: '#f6c7a0',
    zenith: '#3d5e9d',
    bloom: 0.9,
    starAlpha: 0.0,
  },
  {
    name: 'Dusk',
    t: 0.82,
    sunColor: '#ff8a5c',
    sunIntensity: 1.4,
    hemiSky: '#6a6fb8',
    hemiGround: '#3a2a24',
    fogColor: '#c98a8a',
    horizon: '#c98a8a',
    zenith: '#1f224f',
    bloom: 1.1,
    starAlpha: 0.2,
  },
] as const;

export interface TimeOfDaySample {
  t: number;
  sunDir: [number, number, number];
  sunColor: string;
  sunIntensity: number;
  hemiSky: string;
  hemiGround: string;
  fogColor: string;
  horizon: string;
  zenith: string;
  bloom: number;
  starAlpha: number;
}

function lerpColor(c1: string, c2: string, alpha: number): string {
  const col1 = new THREE.Color(c1);
  const col2 = new THREE.Color(c2);
  col1.lerp(col2, alpha);
  return `#${col1.getHexString()}`;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function sampleTimeOfDay(tInput: number): TimeOfDaySample {
  // Normalize t to [0, 1)
  const t = ((tInput % 1.0) + 1.0) % 1.0;

  // Extended presets cycle wrapping around from Dusk back to Night at t = 1.0
  const presets = [
    ...TIME_OF_DAY_PRESETS,
    { ...TIME_OF_DAY_PRESETS[0]!, t: 1.0 },
  ];

  let lower = presets[0]!;
  let upper = presets[1]!;

  for (let i = 0; i < presets.length - 1; i++) {
    if (t >= presets[i]!.t && t <= presets[i + 1]!.t) {
      lower = presets[i]!;
      upper = presets[i + 1]!;
      break;
    }
  }

  const range = upper.t - lower.t;
  const factor = range > 0.00001 ? (t - lower.t) / range : 0;

  // Sun / celestial direction calculation
  // Angle rotates across the sky from East (Dawn, t=0.25) to Zenith (Noon, t=0.5) to West (Dusk, t=0.82)
  const angle = (t - 0.25) * Math.PI * 2.0;
  const sunY = Math.sin(angle);
  const sunX = Math.cos(angle) * 0.8;
  const sunZ = Math.sin(angle) * 0.4;
  const len = Math.hypot(sunX, sunY, sunZ) || 1.0;

  return {
    t,
    sunDir: [sunX / len, sunY / len, sunZ / len],
    sunColor: lerpColor(lower.sunColor, upper.sunColor, factor),
    sunIntensity: lerp(lower.sunIntensity, upper.sunIntensity, factor),
    hemiSky: lerpColor(lower.hemiSky, upper.hemiSky, factor),
    hemiGround: lerpColor(lower.hemiGround, upper.hemiGround, factor),
    fogColor: lerpColor(lower.fogColor, upper.fogColor, factor),
    horizon: lerpColor(lower.horizon, upper.horizon, factor),
    zenith: lerpColor(lower.zenith, upper.zenith, factor),
    bloom: lerp(lower.bloom, upper.bloom, factor),
    starAlpha: lerp(lower.starAlpha, upper.starAlpha, factor),
  };
}

