import { describe, it, expect } from 'vitest';
import { TIER_CONFIGS, detectQualityTier } from '@/lib/quality';

describe('Quality Tiers Configuration', () => {
  it('defines valid specifications for all three tiers', () => {
    expect(TIER_CONFIGS.high).toBeDefined();
    expect(TIER_CONFIGS.medium).toBeDefined();
    expect(TIER_CONFIGS.low).toBeDefined();

    expect(TIER_CONFIGS.high.shadowMapSize).toBe(2048);
    expect(TIER_CONFIGS.medium.shadowMapSize).toBe(1024);
    expect(TIER_CONFIGS.low.shadowMapSize).toBe(1024);

    expect(TIER_CONFIGS.high.enableAO).toBe(true);
    expect(TIER_CONFIGS.medium.enableAO).toBe(true);
    expect(TIER_CONFIGS.low.enableAO).toBe(false);

    expect(TIER_CONFIGS.high.enableGodRays).toBe(true);
    expect(TIER_CONFIGS.medium.enableGodRays).toBe(false);
    expect(TIER_CONFIGS.low.enableGodRays).toBe(false);

    expect(TIER_CONFIGS.high.cloudsCount).toBe(40);
    expect(TIER_CONFIGS.medium.cloudsCount).toBe(30);
    expect(TIER_CONFIGS.low.cloudsCount).toBe(15);
  });

  it('detectQualityTier resolves safely in non-browser environment without throwing', async () => {
    const tier = await detectQualityTier();
    expect(['high', 'medium', 'low']).toContain(tier);
  });
});

