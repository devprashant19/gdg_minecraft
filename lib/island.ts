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
  SPAWN_POSITION,
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

  // 1. Multi-Octave Terraced Terrain Height Calculation
  const heightmap = new Float32Array(SX * SZ);

  for (let z = 0; z < SZ; z++) {
    for (let x = 0; x < SX; x++) {
      const wx = x - HALF_SX;
      const wz = z - HALF_SZ;
      const dist = Math.sqrt(wx * wx + wz * wz);

      // Radial falloff: natural slope into the ocean at the island perimeter
      const radialFalloff = smoothstep(1.0, 0.58, dist / ISLAND_RADIUS);

      // Multi-octave simplex noise for rolling meadows, ridgelines and terrain folds
      const scale = 0.045;
      const n1 = noise2D(wx * scale, wz * scale) * 3.6;
      const n2 = noise2D(wx * scale * 2.2, wz * scale * 2.2) * 1.5;
      const n3 = noise2D(wx * scale * 4.4, wz * scale * 4.4) * 0.5;

      // Scenic northern rocky highland ridge (cliffs overlooking ocean behind portal)
      const northRidge = Math.max(0, (-wz - 3) / 16) * Math.max(0, 1 - Math.abs(wx) / 22) * 2.6;
      // Gentle southern slope towards the sandy beach & dock
      const southBeach = Math.max(0, (wz - 8) / 14) * -1.2;

      const rawHeight = 4.2 + n1 + n2 + n3 + northRidge + southBeach;
      const h = SEA_LEVEL + (rawHeight - SEA_LEVEL) * radialFalloff;
      heightmap[x + z * SX] = Math.max(1, h);
    }
  }

  // 2. Flatten & Stabilize Station Pads
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

  // 3. Stabilize Spawn Landing Area & Grand Central Promenade
  const spawnGx = Math.round(SPAWN_POSITION[0] + HALF_SX);
  const spawnGz = Math.round(SPAWN_POSITION[2] + HALF_SZ);
  const spawnTargetY = Math.floor(SPAWN_POSITION[1]);

  for (let dz = -2; dz <= 2; dz++) {
    for (let dx = -2; dx <= 2; dx++) {
      const x = spawnGx + dx;
      const z = spawnGz + dz;
      if (x >= 0 && x < SX && z >= 0 && z < SZ) {
        if (Math.hypot(dx, dz) <= 2.2) {
          heightmap[x + z * SX] = spawnTargetY;
        }
      }
    }
  }

  // 4. Grand Central Promenade: Level artery connecting Spawn -> Welcome -> Portal
  const pathCoords = new Set<string>();
  const pathBorderCoords = new Set<string>();

  for (let pz = 1; pz <= 26; pz++) {
    for (let px = -2; px <= 2; px++) {
      const gx = px + HALF_SX;
      const gz = pz + HALF_SZ;
      if (gx >= 0 && gx < SX && gz >= 0 && gz < SZ) {
        heightmap[gx + gz * SX] = 5.0;
        if (Math.abs(px) <= 1) {
          pathCoords.add(`${gx},${gz}`);
        } else {
          pathBorderCoords.add(`${gx},${gz}`);
        }
      }
    }
  }

  // 5. Loop Path Rasterization & Cobblestone Curb Borders
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

      // Center walking path
      for (let w = -1; w <= 1; w++) {
        const cx = px + w;
        const cz = pz;
        if (cx >= 0 && cx < SX && cz >= 0 && cz < SZ) {
          pathCoords.add(`${cx},${cz}`);
        }
      }

      // Cobblestone / Gravel outer curb border
      for (let b = -2; b <= 2; b += 4) {
        const bx = px + b;
        const bz = pz;
        if (bx >= 0 && bx < SX && bz >= 0 && bz < SZ) {
          if (!pathCoords.has(`${bx},${bz}`)) {
            pathBorderCoords.add(`${bx},${bz}`);
          }
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
    heightmap[idx] = Math.round(heightmap[idx]! * 2) / 2;
  }

  // 5. Fill Voxel Grid with Geological Material Layers
  for (let z = 0; z < SZ; z++) {
    for (let x = 0; x < SX; x++) {
      const h = heightmap[x + z * SX]!;
      const intH = Math.floor(h);
      const isPath = pathCoords.has(`${x},${z}`);
      const isPathBorder = pathBorderCoords.has(`${x},${z}`);
      const isHalfStep = h - intH >= 0.45;
      const isNearWater = intH <= SEA_LEVEL + 1;

      for (let y = 0; y < SY; y++) {
        if (y < 1) {
          // Bedrock foundation
          grid.set(x, y, z, B.Stone);
        } else if (y <= intH) {
          if (y === intH) {
            // Surface Layer
            if (isPath) {
              grid.set(x, y, z, B.Path);
            } else if (isPathBorder && !isNearWater) {
              grid.set(x, y, z, B.Gravel);
            } else if (isNearWater) {
              grid.set(x, y, z, B.Sand);
            } else if (intH >= 8) {
              grid.set(x, y, z, B.Stone); // Exposed rocky mountain crags
            } else {
              grid.set(x, y, z, B.Grass);
            }
          } else if (y >= intH - 3) {
            // Sub-surface strata
            grid.set(x, y, z, intH >= 8 ? B.Stone : B.Dirt);
          } else {
            // Deep subterranean rock
            grid.set(x, y, z, B.Stone);
          }
        } else if (y === intH + 1 && isHalfStep) {
          grid.set(x, y, z, isPath ? B.SlabPath : B.Grass);
        }
      }
    }
  }

  // 6. Stamp Station Foundation Prefabs
  for (const s of stationList) {
    const gx = Math.round(s.position[0] + HALF_SX);
    const gy = s.position[1];
    const gz = Math.round(s.position[2] + HALF_SZ);

    const prefab = PREFABS[s.prefab] || PREFABS['craftingTable'];
    if (prefab) {
      grid.stampPrefab(gx, gy, gz, prefab);
    }
  }

  // 7. Diverse Forest & Natural Foliage (Grand Oaks, Birch, Pines, Boulders & Logs)
  const treeRng = createPRNG(seed + 999);
  for (let i = 0; i < 48; i++) {
    const tx = Math.floor(treeRng() * (SX - 10)) + 5;
    const tz = Math.floor(treeRng() * (SZ - 10)) + 5;
    const wx = tx - HALF_SX;
    const wz = tz - HALF_SZ;
    const dist = Math.hypot(wx, wz);

    // Clear trees from Grand Promenade, stations and spawn area
    const onPromenade = Math.abs(wx) <= 3.5 && wz >= 0 && wz <= 26;
    const nearStation = stationList.some((s) => {
      const sx = s.position[0] + HALF_SX;
      const sz = s.position[2] + HALF_SZ;
      return Math.hypot(tx - sx, tz - sz) < s.radius + 3.0;
    }) || Math.hypot(tx - spawnGx, tz - spawnGz) < 5.0 || onPromenade;

    if (nearStation) continue;

    // Only place well inside island, clear of paths and stations
    if (dist < ISLAND_RADIUS - 4 && !pathCoords.has(`${tx},${tz}`) && !pathBorderCoords.has(`${tx},${tz}`)) {
      const groundY = Math.floor(heightmap[tx + tz * SX]!);
      if (groundY > SEA_LEVEL + 1 && grid.get(tx, groundY, tz) === B.Grass) {
        const treeTypeRoll = treeRng();

        if (treeTypeRoll < 0.4) {
          // --- Species A: Grand Oak Tree (5-block trunk, broad 5x5 spreading canopy) ---
          const trunkH = 5;
          for (let ty = 1; ty <= trunkH; ty++) {
            grid.set(tx, groundY + ty, tz, B.Log);
          }
          const canopyY = groundY + trunkH;
          for (let dy = -1; dy <= 2; dy++) {
            const r = dy > 0 ? 1 : 2;
            for (let dz = -r; dz <= r; dz++) {
              for (let dx = -r; dx <= r; dx++) {
                if (dx === 0 && dz === 0 && dy <= 0) continue;
                if (Math.abs(dx) === r && Math.abs(dz) === r && treeRng() > 0.4) continue;
                grid.set(tx + dx, canopyY + dy, tz + dz, B.Leaves);
              }
            }
          }
        } else if (treeTypeRoll < 0.7) {
          // --- Species B: Slender Birch / Pine (6-block tall trunk, tiered canopy) ---
          const trunkH = 6;
          for (let ty = 1; ty <= trunkH; ty++) {
            grid.set(tx, groundY + ty, tz, B.Log);
          }
          const canopyY = groundY + trunkH;
          // Tier 1: 3x3 base
          for (let dz = -1; dz <= 1; dz++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dx !== 0 || dz !== 0) grid.set(tx + dx, canopyY - 1, tz + dz, B.Leaves);
              grid.set(tx + dx, canopyY, tz + dz, B.Leaves);
            }
          }
          // Tier 2: 1x1 top spire
          grid.set(tx, canopyY + 1, tz, B.Leaves);
        } else if (treeTypeRoll < 0.85) {
          // --- Feature C: Fallen Mossy Log (horizontal trunk with flower) ---
          for (let len = 0; len < 3; len++) {
            grid.set(tx + len, groundY + 1, tz, B.Log);
          }
          grid.set(tx + 1, groundY + 1, tz + 1, B.FlowerRed);
        } else {
          // --- Feature D: Rocky Stone & Gravel Boulder Outcrop ---
          grid.set(tx, groundY + 1, tz, B.Stone);
          grid.set(tx + 1, groundY + 1, tz, B.Gravel);
          grid.set(tx, groundY + 1, tz + 1, B.Stone);
        }
      }
    }
  }

  // 8. Lush Wildflower Meadows (Poppies, Dandelions & Swaying Tall Grass)
  const vegRng = createPRNG(seed + 555);
  for (let z = 0; z < SZ; z++) {
    for (let x = 0; x < SX; x++) {
      if (!pathCoords.has(`${x},${z}`) && !pathBorderCoords.has(`${x},${z}`)) {
        const gy = Math.floor(heightmap[x + z * SX]!);
        if (gy > SEA_LEVEL + 1 && grid.get(x, gy, z) === B.Grass && grid.get(x, gy + 1, z) === B.Air) {
          const r = vegRng();
          if (r < 0.08) {
            grid.set(x, gy + 1, z, B.TallGrass);
          } else if (r < 0.11) {
            grid.set(x, gy + 1, z, B.FlowerRed);
          } else if (r < 0.14) {
            grid.set(x, gy + 1, z, B.FlowerYellow);
          }
        }
      }
    }
  }

  return grid;
}


