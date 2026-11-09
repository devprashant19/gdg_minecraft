import * as THREE from 'three';
import { TileLayer } from './blocks';

// Seeded pseudorandom number generator (LCG)
export function createPRNG(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export type ColorRGB = [number, number, number];

function hexToRGB(hex: string): ColorRGB {
  const num = parseInt(hex.replace('#', ''), 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

// 16x16 tile procedural painters
export const PALETTE = {
  grassTop: ['#4d7c28', '#5b8c32', '#6ba33b', '#416b22'],
  grassSide: ['#694a32', '#7a573b', '#543b27', '#4d7c28'],
  dirt: ['#694a32', '#7a573b', '#5c3f2b', '#8b6343'],
  path: ['#9e784f', '#a68058', '#8f6a43', '#b89065'],
  sand: ['#d6c585', '#e0d194', '#ccbb78', '#ebdca2'],
  stone: ['#6e6e73', '#7a7a80', '#636369', '#8a8a91'],
  gravel: ['#5c5c63', '#696970', '#7a7a82', '#4f4f54'],
  logSide: ['#523d29', '#5c452e', '#453322', '#694e35'],
  logTop: ['#a88960', '#b5976e', '#8f734e', '#523d29'],
  leaves: ['#2e6b28', '#387d31', '#428f3a', '#24541f'],
  planks: ['#a67c4f', '#b38859', '#997045', '#bf9363'],
  bookshelf: ['#a67c4f', '#b38859', '#3e2723', '#1b5e20', '#b71c1c'],
  craftingTop: ['#997045', '#b38859', '#424242', '#d4af37'],
  craftingSide: ['#a67c4f', '#5c452e', '#3e2723', '#212121'],
  chest: ['#8f6a43', '#a67c4f', '#3e2723', '#cfb53b'],
  clockFace: ['#dedede', '#ffffff', '#222222', '#d4af37'],
  portalFrame: ['#150d21', '#1f132b', '#2a1a3c', '#4a266a', '#7b3fa8'],
};

export function paintTile(layer: TileLayer, rng: () => number): Uint8Array {
  const data = new Uint8Array(16 * 16 * 4);

  const fillNoise = (hexPalette: string[]) => {
    const colors = hexPalette.map(hexToRGB);
    for (let i = 0; i < 256; i++) {
      const c = colors[Math.floor(rng() * colors.length)]!;
      const idx = i * 4;
      data[idx] = c[0];
      data[idx + 1] = c[1];
      data[idx + 2] = c[2];
      data[idx + 3] = 255;
    }
  };

  switch (layer) {
    case TileLayer.GrassTop:
      fillNoise(PALETTE.grassTop);
      break;

    case TileLayer.GrassSide: {
      const dirtColors = PALETTE.dirt.map(hexToRGB);
      const grassColors = PALETTE.grassTop.map(hexToRGB);
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          const idx = (y * 16 + x) * 4;
          // In Three.js DataArrayTexture: y=0 is bottom, y=15 is top.
          // Classic Minecraft grass block: green rim across top (y>=13) with drips down to y=10
          const drip = ((x * 5 + 3) % 4 === 0) ? 5 : (((x * 7 + 1) % 3 === 0) ? 3 : 2);
          const isGrassTop = y >= (16 - drip);
          const c = isGrassTop
            ? grassColors[Math.floor(rng() * grassColors.length)]!
            : dirtColors[Math.floor(rng() * dirtColors.length)]!;
          data[idx] = c[0];
          data[idx + 1] = c[1];
          data[idx + 2] = c[2];
          data[idx + 3] = 255;
        }
      }
      break;
    }

    case TileLayer.Dirt:
      fillNoise(PALETTE.dirt);
      break;

    case TileLayer.Path:
      fillNoise(PALETTE.path);
      break;

    case TileLayer.Sand:
      fillNoise(PALETTE.sand);
      break;

    case TileLayer.Stone:
      fillNoise(PALETTE.stone);
      break;

    case TileLayer.Gravel:
      fillNoise(PALETTE.gravel);
      break;

    case TileLayer.LogSide: {
      const colors = PALETTE.logSide.map(hexToRGB);
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          const idx = (y * 16 + x) * 4;
          // Vertical bark lines
          const lineVar = (x % 4 === 0 ? 0 : Math.floor(rng() * colors.length));
          const c = colors[lineVar]!;
          data[idx] = c[0];
          data[idx + 1] = c[1];
          data[idx + 2] = c[2];
          data[idx + 3] = 255;
        }
      }
      break;
    }

    case TileLayer.LogTop: {
      const colors = PALETTE.logTop.map(hexToRGB);
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          const idx = (y * 16 + x) * 4;
          const ring = Math.abs(x - 7.5) + Math.abs(y - 7.5);
          const c = colors[ring > 6 ? 3 : Math.floor(rng() * (colors.length - 1))]!;
          data[idx] = c[0];
          data[idx + 1] = c[1];
          data[idx + 2] = c[2];
          data[idx + 3] = 255;
        }
      }
      break;
    }

    case TileLayer.Leaves: {
      const colors = PALETTE.leaves.map(hexToRGB);
      for (let i = 0; i < 256; i++) {
        const idx = i * 4;
        const isCutout = rng() < 0.2; // transparent hole
        if (isCutout) {
          data[idx] = 0;
          data[idx + 1] = 0;
          data[idx + 2] = 0;
          data[idx + 3] = 0;
        } else {
          const c = colors[Math.floor(rng() * colors.length)]!;
          data[idx] = c[0];
          data[idx + 1] = c[1];
          data[idx + 2] = c[2];
          data[idx + 3] = 255;
        }
      }
      break;
    }

    case TileLayer.Planks:
    case TileLayer.SlabTop: {
      const colors = PALETTE.planks.map(hexToRGB);
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          const idx = (y * 16 + x) * 4;
          const isBorder = y % 4 === 0 || (x % 8 === 0 && y % 8 > 0);
          const c = isBorder ? colors[2]! : colors[Math.floor(rng() * 2)]!;
          data[idx] = c[0];
          data[idx + 1] = c[1];
          data[idx + 2] = c[2];
          data[idx + 3] = 255;
        }
      }
      break;
    }

    case TileLayer.FlowerRed:
    case TileLayer.FlowerYellow: {
      const petalCol = layer === TileLayer.FlowerRed ? [230, 40, 40] : [240, 220, 40];
      const stemCol = [40, 160, 40];
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          const idx = (y * 16 + x) * 4;
          if (x === 7 || x === 8) {
            if (y > 6) {
              data[idx] = stemCol[0]!;
              data[idx + 1] = stemCol[1]!;
              data[idx + 2] = stemCol[2]!;
              data[idx + 3] = 255;
            }
          }
          if (Math.abs(x - 7.5) < 3 && y > 2 && y < 7) {
            data[idx] = petalCol[0]!;
            data[idx + 1] = petalCol[1]!;
            data[idx + 2] = petalCol[2]!;
            data[idx + 3] = 255;
          }
        }
      }
      break;
    }

    case TileLayer.TallGrass: {
      const colors = PALETTE.grassTop.map(hexToRGB);
      for (let y = 0; y < 16; y++) {
        for (let x = 0; x < 16; x++) {
          const idx = (y * 16 + x) * 4;
          const blade = (x % 3 === 0 && y > x % 5);
          if (blade) {
            const c = colors[Math.floor(rng() * colors.length)]!;
            data[idx] = c[0];
            data[idx + 1] = c[1];
            data[idx + 2] = c[2];
            data[idx + 3] = 255;
          }
        }
      }
      break;
    }

    case TileLayer.Bookshelf:
      fillNoise(PALETTE.bookshelf);
      break;

    case TileLayer.CraftingTop:
      fillNoise(PALETTE.craftingTop);
      break;

    case TileLayer.CraftingSide:
      fillNoise(PALETTE.craftingSide);
      break;

    case TileLayer.Chest:
      fillNoise(PALETTE.chest);
      break;

    case TileLayer.ClockFace:
      fillNoise(PALETTE.clockFace);
      break;

    case TileLayer.PortalFrame:
      fillNoise(PALETTE.portalFrame);
      break;

    default:
      fillNoise(PALETTE.stone);
  }

  return data;
}

export function buildTileDataArray(seed = 1337): Uint8Array {
  const NUM_LAYERS = 21;
  const TILE_BYTES = 16 * 16 * 4;
  const buffer = new Uint8Array(NUM_LAYERS * TILE_BYTES);

  for (let layer = 0; layer < NUM_LAYERS; layer++) {
    const rng = createPRNG(seed + layer * 101);
    const tileData = paintTile(layer as TileLayer, rng);
    buffer.set(tileData, layer * TILE_BYTES);
  }

  return buffer;
}

export function createTileArrayTexture(seed = 1337): THREE.DataArrayTexture {
  const NUM_LAYERS = 21;
  const buffer = buildTileDataArray(seed);

  const texture = new THREE.DataArrayTexture(buffer, 16, 16, NUM_LAYERS);
  texture.format = THREE.RGBAFormat;
  texture.type = THREE.UnsignedByteType;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;

  return texture;
}

