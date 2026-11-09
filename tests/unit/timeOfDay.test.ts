import { describe, it, expect } from 'vitest';
import { sampleTimeOfDay, TIME_OF_DAY_PRESETS } from '@/lib/timeOfDay';

describe('Time of Day Atmosphere Simulation', () => {
  it('returns exact values at preset timestamps', () => {
    for (const preset of TIME_OF_DAY_PRESETS) {
      const sample = sampleTimeOfDay(preset.t);
      expect(sample.t).toBeCloseTo(preset.t, 5);
      expect(sample.sunIntensity).toBeCloseTo(preset.sunIntensity, 5);
      expect(sample.bloom).toBeCloseTo(preset.bloom, 5);
      expect(sample.starAlpha).toBeCloseTo(preset.starAlpha, 5);
    }
  });

  it('computes unit-normalized sun direction vectors across the full 24h cycle', () => {
    for (let t = 0; t <= 1.0; t += 0.05) {
      const sample = sampleTimeOfDay(t);
      const [x, y, z] = sample.sunDir;
      const len = Math.hypot(x, y, z);
      expect(len).toBeCloseTo(1.0, 4);
    }
  });

  it('handles seamless wrapping around 0.0 and negative values', () => {
    const atZero = sampleTimeOfDay(0.0);
    const atOne = sampleTimeOfDay(1.0);
    expect(atZero.sunIntensity).toBeCloseTo(atOne.sunIntensity, 4);
    expect(atZero.bloom).toBeCloseTo(atOne.bloom, 4);

    const goldenPositive = sampleTimeOfDay(0.72);
    const goldenNegative = sampleTimeOfDay(-0.28);
    expect(goldenPositive.sunIntensity).toBeCloseTo(goldenNegative.sunIntensity, 4);
  });

  it('produces continuous smooth transitions between neighboring timestamps', () => {
    for (let t = 0; t < 0.99; t += 0.05) {
      const s1 = sampleTimeOfDay(t);
      const s2 = sampleTimeOfDay(t + 0.01);
      const deltaIntensity = Math.abs(s1.sunIntensity - s2.sunIntensity);
      expect(deltaIntensity).toBeLessThan(0.4);
    }
  });
});

