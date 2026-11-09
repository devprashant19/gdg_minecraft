import { B } from '@/lib/blocks';

export interface VoxelPrefab {
  name: string;
  palette: Record<string, B>;
  // layers from bottom (y=0) to top
  layers: string[];
}

/**
 * Clean architectural foundations and terraces for 3D station models.
 * Layer 0 stamps the ground terrace pad, providing solid footing and authentic
 * cobblestone & wood borders without obscuring the detailed 3D station models.
 */
export const stationPadPrefab: VoxelPrefab = {
  name: 'stationPad',
  palette: {
    S: B.Stone,
    P: B.Planks,
    '.': B.Air,
  },
  layers: [
    // Layer 0: 5x5 Terraced Floor
    'SSSSS\nSPPPS\nSPPPS\nSPPPS\nSSSSS',
  ],
};

export const clockTowerPadPrefab: VoxelPrefab = {
  name: 'clockTower',
  palette: {
    S: B.Stone,
    P: B.Planks,
    '.': B.Air,
  },
  layers: [
    'SSSSS\nSSSSS\nSSSSS\nSSSSS\nSSSSS',
  ],
};

export const dockPrefab: VoxelPrefab = {
  name: 'dock',
  palette: {
    P: B.Planks,
    L: B.Log,
    S: B.SlabPlanks,
    '.': B.Air,
  },
  layers: [
    // Layer 0: submerged pillars
    'L...L\n.....\nL...L',
    // Layer 1: dock planks
    'PPPPP\nPPPPP\nPPPPP',
    // Layer 2: posts & edge
    'L...L\n.....\nL...L',
  ],
};

export const signboardPrefab: VoxelPrefab = {
  name: 'signboard',
  palette: {
    P: B.Planks,
    S: B.Stone,
    '.': B.Air,
  },
  layers: [
    'SSSSS\nSPPPS\nSSSSS',
  ],
};

export const portalPrefab: VoxelPrefab = {
  name: 'portal',
  palette: {
    S: B.Stone,
    O: B.Obsidian,
    '.': B.Air,
  },
  layers: [
    // Foundation stone slab with obsidian floor inlay
    'SSSSS\nSOOOS\nSSSSS',
  ],
};

export const PREFABS: Record<string, VoxelPrefab> = {
  signboard: signboardPrefab,
  dock: dockPrefab,
  clockTower: clockTowerPadPrefab,
  portal: portalPrefab,
  craftingTable: stationPadPrefab,
  bookshelf: stationPadPrefab,
  chestRow: stationPadPrefab,
  tvStand: stationPadPrefab,
  mapTable: stationPadPrefab,
  crewCamp: stationPadPrefab,
};
