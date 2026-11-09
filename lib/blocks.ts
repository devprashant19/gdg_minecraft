export const enum B {
  Air = 0,
  Grass = 1,
  Dirt = 2,
  Path = 3,
  Sand = 4,
  Stone = 5,
  Gravel = 6,
  Log = 7,
  Leaves = 8,
  Planks = 9,
  SlabPath = 10,
  SlabPlanks = 11,
  FlowerRed = 12,
  FlowerYellow = 13,
  TallGrass = 14,
  Bookshelf = 15,
  CraftTable = 16,
  Barrier = 17, // Invisible collider
  Obsidian = 18, // Ancient portal frame
}

export const enum TileLayer {
  GrassTop = 0,
  GrassSide = 1,
  Dirt = 2,
  Path = 3,
  Sand = 4,
  Stone = 5,
  Gravel = 6,
  LogSide = 7,
  LogTop = 8,
  Leaves = 9,
  Planks = 10,
  SlabTop = 11,
  FlowerRed = 12,
  FlowerYellow = 13,
  TallGrass = 14,
  Bookshelf = 15,
  CraftingTop = 16,
  CraftingSide = 17,
  Chest = 18,
  ClockFace = 19,
  PortalFrame = 20,
}

export interface FaceLayers {
  top: TileLayer;
  bottom: TileLayer;
  north: TileLayer;
  south: TileLayer;
  east: TileLayer;
  west: TileLayer;
}

export interface BlockDef {
  opaque: boolean;
  solid: boolean;
  shape: 'cube' | 'slab' | 'cross';
  sway?: number;
  layers: FaceLayers;
}

const uniformLayers = (layer: TileLayer): FaceLayers => ({
  top: layer,
  bottom: layer,
  north: layer,
  south: layer,
  east: layer,
  west: layer,
});

export const BLOCKS: Record<B, BlockDef> = {
  [B.Air]: {
    opaque: false,
    solid: false,
    shape: 'cube',
    layers: uniformLayers(TileLayer.Dirt),
  },
  [B.Grass]: {
    opaque: true,
    solid: true,
    shape: 'cube',
    layers: {
      top: TileLayer.GrassTop,
      bottom: TileLayer.Dirt,
      north: TileLayer.GrassSide,
      south: TileLayer.GrassSide,
      east: TileLayer.GrassSide,
      west: TileLayer.GrassSide,
    },
  },
  [B.Dirt]: {
    opaque: true,
    solid: true,
    shape: 'cube',
    layers: uniformLayers(TileLayer.Dirt),
  },
  [B.Path]: {
    opaque: true,
    solid: true,
    shape: 'cube',
    layers: {
      top: TileLayer.Path,
      bottom: TileLayer.Dirt,
      north: TileLayer.Dirt,
      south: TileLayer.Dirt,
      east: TileLayer.Dirt,
      west: TileLayer.Dirt,
    },
  },
  [B.Sand]: {
    opaque: true,
    solid: true,
    shape: 'cube',
    layers: uniformLayers(TileLayer.Sand),
  },
  [B.Stone]: {
    opaque: true,
    solid: true,
    shape: 'cube',
    layers: uniformLayers(TileLayer.Stone),
  },
  [B.Gravel]: {
    opaque: true,
    solid: true,
    shape: 'cube',
    layers: uniformLayers(TileLayer.Gravel),
  },
  [B.Log]: {
    opaque: true,
    solid: true,
    shape: 'cube',
    layers: {
      top: TileLayer.LogTop,
      bottom: TileLayer.LogTop,
      north: TileLayer.LogSide,
      south: TileLayer.LogSide,
      east: TileLayer.LogSide,
      west: TileLayer.LogSide,
    },
  },
  [B.Leaves]: {
    opaque: false,
    solid: true,
    shape: 'cube',
    sway: 1.0,
    layers: uniformLayers(TileLayer.Leaves),
  },
  [B.Planks]: {
    opaque: true,
    solid: true,
    shape: 'cube',
    layers: uniformLayers(TileLayer.Planks),
  },
  [B.SlabPath]: {
    opaque: false,
    solid: true,
    shape: 'slab',
    layers: {
      top: TileLayer.Path,
      bottom: TileLayer.Dirt,
      north: TileLayer.Dirt,
      south: TileLayer.Dirt,
      east: TileLayer.Dirt,
      west: TileLayer.Dirt,
    },
  },
  [B.SlabPlanks]: {
    opaque: false,
    solid: true,
    shape: 'slab',
    layers: uniformLayers(TileLayer.Planks),
  },
  [B.FlowerRed]: {
    opaque: false,
    solid: false,
    shape: 'cross',
    sway: 0.8,
    layers: uniformLayers(TileLayer.FlowerRed),
  },
  [B.FlowerYellow]: {
    opaque: false,
    solid: false,
    shape: 'cross',
    sway: 0.8,
    layers: uniformLayers(TileLayer.FlowerYellow),
  },
  [B.TallGrass]: {
    opaque: false,
    solid: false,
    shape: 'cross',
    sway: 1.0,
    layers: uniformLayers(TileLayer.TallGrass),
  },
  [B.Bookshelf]: {
    opaque: true,
    solid: true,
    shape: 'cube',
    layers: {
      top: TileLayer.Planks,
      bottom: TileLayer.Planks,
      north: TileLayer.Bookshelf,
      south: TileLayer.Bookshelf,
      east: TileLayer.Bookshelf,
      west: TileLayer.Bookshelf,
    },
  },
  [B.CraftTable]: {
    opaque: true,
    solid: true,
    shape: 'cube',
    layers: {
      top: TileLayer.CraftingTop,
      bottom: TileLayer.Planks,
      north: TileLayer.CraftingSide,
      south: TileLayer.CraftingSide,
      east: TileLayer.CraftingSide,
      west: TileLayer.CraftingSide,
    },
  },
  [B.Barrier]: {
    opaque: false,
    solid: true,
    shape: 'cube',
    layers: uniformLayers(TileLayer.Dirt),
  },
  [B.Obsidian]: {
    opaque: true,
    solid: true,
    shape: 'cube',
    layers: uniformLayers(TileLayer.PortalFrame),
  },
};

