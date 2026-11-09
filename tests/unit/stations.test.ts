import { describe, it, expect } from 'vitest';
import { stations } from '@/content/stations';

describe('Stations and Sensors Invariants', () => {
  it('defines exactly 9 stations with unique IDs', () => {
    expect(stations).toHaveLength(9);

    const ids = stations.map((s) => s.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(9);
  });

  it('assigns unique hotbar slots 1 through 9', () => {
    const slots = stations.map((s) => s.hotbarSlot).sort((a, b) => a - b);
    expect(slots).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it('guarantees that station sensor zones never overlap', () => {
    for (let i = 0; i < stations.length; i++) {
      for (let j = i + 1; j < stations.length; j++) {
        const s1 = stations[i]!;
        const s2 = stations[j]!;

        const dx = s1.position[0] - s2.position[0];
        const dz = s1.position[2] - s2.position[2];
        const distance = Math.hypot(dx, dz);
        const minDistance = s1.radius + s2.radius;

        expect(
          distance,
          `Station "${s1.id}" and station "${s2.id}" overlap: distance=${distance.toFixed(2)}, minDistance=${minDistance.toFixed(2)}`
        ).toBeGreaterThan(minDistance);
      }
    }
  });

  it('ensures every standPoint is within its sensor radius', () => {
    for (const s of stations) {
      const dx = s.standPoint[0] - s.position[0];
      const dz = s.standPoint[2] - s.position[2];
      const dist = Math.hypot(dx, dz);

      expect(
        dist,
        `Station "${s.id}" standPoint distance (${dist.toFixed(2)}) exceeds radius (${s.radius})`
      ).toBeLessThanOrEqual(s.radius);
    }
  });

  it('has valid tourView configurations for all stations', () => {
    for (const s of stations) {
      expect(s.tourView.dwellMs).toBeGreaterThanOrEqual(1000);
      expect(s.tourView.cam).toHaveLength(3);
      expect(s.tourView.look).toHaveLength(3);
    }
  });
});

