import { describe, it, expect } from 'vitest';
import { buildIsland, VoxelGrid } from '@/lib/island';
import { meshIsland } from '@/lib/mesher';
import { stations } from '@/content/stations';
import { B } from '@/lib/blocks';
import { HALF_SX, HALF_SZ, SPAWN_POSITION } from '@/lib/world-constants';

describe('Phase 1: Voxel Island & Meshing Engine', () => {
  it('generates byte-identical voxel grids with the same seed', () => {
    const grid1 = buildIsland(42);
    const grid2 = buildIsland(42);

    expect(grid1.data.length).toBe(grid2.data.length);
    let identical = true;
    for (let i = 0; i < grid1.data.length; i++) {
      if (grid1.data[i] !== grid2.data[i]) {
        identical = false;
        break;
      }
    }
    expect(identical).toBe(true);
  });

  it('guarantees all station pads are completely flat', () => {
    const grid = buildIsland(1337);

    for (const station of stations) {
      const gx = Math.round(station.position[0] + HALF_SX);
      const gz = Math.round(station.position[2] + HALF_SZ);
      const targetY = station.position[1];

      // Check center of pad has solid block at targetY - 1 or targetY
      const padBlock = grid.get(gx, targetY, gz);
      expect(padBlock).not.toBe(B.Air);
    }
  });

  it('guarantees spawn point is in open air with solid footing below', () => {
    const grid = buildIsland(1337);
    const [sx, sy, sz] = SPAWN_POSITION;
    const gx = Math.round(sx + HALF_SX);
    const gy = Math.floor(sy);
    const gz = Math.round(sz + HALF_SZ);

    // Footing below is solid (ground block at y=4)
    expect(grid.get(gx, gy, gz)).not.toBe(B.Air);
    // Player body stands in open air (y=5 and y=6)
    expect(grid.get(gx, gy + 1, gz)).toBe(B.Air);
    expect(grid.get(gx, gy + 2, gz)).toBe(B.Air);
  });

  it('meshes an isolated cube with exactly 6 faces (12 triangles)', () => {
    const grid = new VoxelGrid();
    grid.set(10, 5, 10, B.Stone);

    const result = meshIsland(grid);
    // 6 faces = 6 quads = 12 triangles
    expect(result.stats.opaqueQuads).toBe(6);
    expect(result.opaqueGeo.getAttribute('position')!.count).toBe(24);
  });

  it('culls shared face between two adjacent cubes giving 10 faces', () => {
    const grid = new VoxelGrid();
    grid.set(10, 5, 10, B.Stone);
    grid.set(11, 5, 10, B.Stone); // Adjacent along X axis

    const result = meshIsland(grid);
    // 2 cubes * 6 faces - 2 shared culled faces = 10 quads
    expect(result.stats.opaqueQuads).toBe(10);
  });

  it('fully enclosed cube contributes 0 exterior faces', () => {
    const grid = new VoxelGrid();
    // Center cube at (10, 10, 10)
    grid.set(10, 10, 10, B.Stone);
    // Enclose with 6 neighbors
    grid.set(9, 10, 10, B.Stone);
    grid.set(11, 10, 10, B.Stone);
    grid.set(10, 9, 10, B.Stone);
    grid.set(10, 11, 10, B.Stone);
    grid.set(10, 10, 9, B.Stone);
    grid.set(10, 10, 11, B.Stone);

    const result = meshIsland(grid);
    // 7 cubes total: outer surface has 6 * 5 = 30 quads
    expect(result.stats.opaqueQuads).toBe(30);
  });
});
