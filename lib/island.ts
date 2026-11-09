import { createNoise2D } from 'simplex-noise';
import { B } from './blocks';
import {
  SX,
  SY,
  SZ,
  SEA_LEVEL,
  ISLAND_RADIUS,
  HALF_SX,
  HALF_SZ,
} from './world-constants';
import { stations, Station } from '@/content/stations';
import { PREFABS, VoxelPrefab } from '@/components/world/prefabs';
import { createPRNG } from './textures';

export class VoxelGrid {
  readonly sx = SX;
  readonly sy = SY;
  readonly sz = SZ;
  readonly data: Uint8Array;

  constructor() {
    this.data = new Uint8Array(SX * SY * SZ);
  }

  getIndex(x: number, y: number, z: number): number {
    return x + z * SX + y * SX * SZ;
  }

  inBounds(x: number, y: number, z: number): boolean {
    return x >= 0 && x < SX && y >= 0 && y < SY && z >= 0 && z < SZ;
  }

  get(x: number, y: number, z: number): B {
    if (!this.inBounds(x, y, z)) return B.Air;
    return this.data[this.getIndex(x, y, z)] as B;
  }

  set(x: number, y: number, z: number, block: B): void {
    if (this.inBounds(x, y, z)) {
      this.data[this.getIndex(x, y, z)] = block;
    }
  }

  stampPrefab(originX: number, originY: number, originZ: number, prefab: VoxelPrefab) {
    for (let layerIdx = 0; layerIdx < prefab.layers.length; layerIdx++) {
      const y = originY + layerIdx;
      const rows = prefab.layers[layerIdx]!.trim().split('\n');
      const depth = rows.length;
      const width = rows[0]?.length || 0;
      const offsetX = Math.floor(width / 2);
      const offsetZ = Math.floor(depth / 2);

      for (let r = 0; r < depth; r++) {
        const row = rows[r]!;
        for (let c = 0; c < row.length; c++) {
          const char = row[c]!;
          const block = prefab.palette[char];
          if (block !== undefined && block !== B.Air) {
            this.set(originX - offsetX + c, y, originZ - offsetZ + r, block);
          }
        }
      }
    }
  }
}

function smoothstep(min: number, max: number, value: number): number {
  const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return x * x * (3 - 2 * x);
}

export function buildIsland(seed = 1337, stationList: readonly Station[] = stations): VoxelGrid {
  const grid = new VoxelGrid();
  const rng = createPRNG(seed);
  const noise2D = createNoise2D(rng);

  // 1. Base terrain height calculation
  const heightmap = new Float32Array(SX * SZ);

  for (let z = 0; z < SZ; z++) {
    for (let x = 0; x < SX; x++) {
      const wx = x - HALF_SX;
      const wz = z - HALF_SZ;
      const dist = Math.sqrt(wx * wx + wz * wz);

      // Radial falloff: sinks into sea at island edge
      const radialFalloff = smoothstep(1.0, 0.55, dist / ISLAND_RADIUS);

      // Multi-octave simplex noise
      const scale = 0.05;
      const n1 = noise2D(wx * scale, wz * scale);
      const n2 = noise2D(wx * scale * 2, wz * scale * 2) * 0.5;
      const elevation = (n1 + n2) * 3.5;

      // Slight hill toward back (+z)
      const hill = (wz / HALF_SZ) * 1.5;

      const rawHeight = 4.0 + elevation + hill;
      const h = SEA_LEVEL + (rawHeight - SEA_LEVEL) * radialFalloff;
      heightmap[x + z * SX] = Math.max(1, h);
    }
  }

  // 2. Flatten station pads
  for (const station of stationList) {
    const [sx, sy, sz] = station.position;
    const gx = Math.round(sx + HALF_SX);
    const gz = Math.round(sz + HALF_SZ);
    const padRadius = station.radius;

    for (let dz = -Math.ceil(padRadius + 3); dz <= Math.ceil(padRadius + 3); dz++) {
      for (let dx = -Math.ceil(padRadius + 3); dx <= Math.ceil(padRadius + 3); dx++) {
        const x = gx + dx;
        const z = gz + dz;
        if (x < 0 || x >= SX || z < 0 || z >= SZ) continue;

        const d = Math.sqrt(dx * dx + dz * dz);
        const idx = x + z * SX;

        if (d <= padRadius) {
          heightmap[idx] = sy;
        } else if (d <= padRadius + 3) {
          const t = (d - padRadius) / 3.0;
          heightmap[idx] = sy * (1 - t) + heightmap[idx]! * t;
        }
      }
    }
  }

  // 3. Loop path rasterization & step height smoothing
  const pathCoords = new Set<string>();
  const sortedStations = [...stationList].sort((a, b) => a.hotbarSlot - b.hotbarSlot);

  for (let i = 0; i < sortedStations.length; i++) {
    const curr = sortedStations[i]!;
    const next = sortedStations[(i + 1) % sortedStations.length]!;

    const x1 = curr.standPoint[0] + HALF_SX;
    const z1 = curr.standPoint[2] + HALF_SZ;
    const x2 = next.standPoint[0] + HALF_SX;
    const z2 = next.standPoint[2] + HALF_SZ;

    const steps = Math.ceil(Math.hypot(x2 - x1, z2 - z1) * 2);
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const px = Math.round(x1 + (x2 - x1) * t);
      const pz = Math.round(z1 + (z2 - z1) * t);

      for (let w = -1; w <= 1; w++) {
        const cx = px + w;
        const cz = pz;
        if (cx >= 0 && cx < SX && cz >= 0 && cz < SZ) {
          pathCoords.add(`${cx},${cz}`);
        }
      }
    }
  }

  // Smooth steps along the path: enforce maximum 0.5 step rise
  for (const coord of pathCoords) {
    const [xStr, zStr] = coord.split(',');
    const x = parseInt(xStr!, 10);
    const z = parseInt(zStr!, 10);
    const idx = x + z * SX;
    heightmap[idx] = Math.round(heightmap[idx]! * 2) / 2; // Quantize to half-blocks
  }

  // 4. Fill Voxel Grid with Material Layers
  for (let z = 0; z < SZ; z++) {
    for (let x = 0; x < SX; x++) {
      const h = heightmap[x + z * SX]!;
      const intH = Math.floor(h);
      const isPath = pathCoords.has(`${x},${z}`);
      const isHalfStep = h - intH >= 0.45;

      for (let y = 0; y < SY; y++) {
        if (y < 1) {
          // Bottom bedrock/stone floor
          grid.set(x, y, z, B.Stone);
        } else if (y <= intH) {
          if (y === intH) {
            if (isPath) {
              grid.set(x, y, z, B.Path);
            } else if (intH <= SEA_LEVEL + 1) {
              grid.set(x, y, z, B.Sand);
            } else {
              grid.set(x, y, z, B.Grass);
            }
          } else if (y >= intH - 3) {
            grid.set(x, y, z, B.Dirt);
          } else {
            grid.set(x, y, z, B.Stone);
          }
        } else if (y === intH + 1 && isHalfStep) {
          grid.set(x, y, z, isPath ? B.SlabPath : B.Grass);
        }
      }
    }
  }

  // 5. Stamp Station Prefabs
  for (const s of stationList) {
    const gx = Math.round(s.position[0] + HALF_SX);
    const gy = s.position[1];
    const gz = Math.round(s.position[2] + HALF_SZ);

    const prefab = PREFABS[s.prefab] || PREFABS['craftingTable'];
    if (prefab) {
      grid.stampPrefab(gx, gy, gz, prefab);
    }
  }

  // 6. Trees & Vegetation Placement
  const treeRng = createPRNG(seed + 999);
  for (let i = 0; i < 40; i++) {
    const tx = Math.floor(treeRng() * (SX - 10)) + 5;
    const tz = Math.floor(treeRng() * (SZ - 10)) + 5;
    const wx = tx - HALF_SX;
    const wz = tz - HALF_SZ;
    const dist = Math.hypot(wx, wz);

    // Only plant trees well inside island, away from path & stations
    if (dist < ISLAND_RADIUS - 5 && !pathCoords.has(`${tx},${tz}`)) {
      const groundY = Math.floor(heightmap[tx + tz * SX]!);
      if (groundY > SEA_LEVEL + 1 && grid.get(tx, groundY, tz) === B.Grass) {
        // Plant tree: trunk 4 blocks
        const trunkH = 4;
        for (let ty = 1; ty <= trunkH; ty++) {
          grid.set(tx, groundY + ty, tz, B.Log);
        }
        // Leaves canopy
        const canopyY = groundY + trunkH;
        for (let dy = -1; dy <= 2; dy++) {
          const r = dy > 0 ? 1 : 2;
          for (let dz = -r; dz <= r; dz++) {
            for (let dx = -r; dx <= r; dx++) {
              if (dx === 0 && dz === 0 && dy <= 0) continue; // trunk inside
              if (Math.abs(dx) === r && Math.abs(dz) === r && treeRng() > 0.5) continue; // round corners
              grid.set(tx + dx, canopyY + dy, tz + dz, B.Leaves);
            }
          }
        }
      }
    }
  }

  // 7. Ground Cover (Flowers & Grass)
  const vegRng = createPRNG(seed + 555);
  for (let z = 0; z < SZ; z++) {
    for (let x = 0; x < SX; x++) {
      if (!pathCoords.has(`${x},${z}`)) {
        const gy = Math.floor(heightmap[x + z * SX]!);
        if (gy > SEA_LEVEL + 1 && grid.get(x, gy, z) === B.Grass && grid.get(x, gy + 1, z) === B.Air) {
          const r = vegRng();
          if (r < 0.05) {
            grid.set(x, gy + 1, z, B.TallGrass);
          } else if (r < 0.07) {
            grid.set(x, gy + 1, z, B.FlowerRed);
          } else if (r < 0.09) {
            grid.set(x, gy + 1, z, B.FlowerYellow);
          }
        }
      }
    }
  }

  return grid;
}
