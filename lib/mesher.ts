import * as THREE from 'three';
import { VoxelGrid } from './island';
import { B, BLOCKS, BlockDef } from './blocks';
import { HALF_SX, HALF_SZ } from './world-constants';

const AO_CURVE = [0.45, 0.65, 0.82, 1.0] as const;

interface FaceDirection {
  dir: [number, number, number];
  normal: [number, number, number];
  shade: number;
  name: 'top' | 'bottom' | 'north' | 'south' | 'east' | 'west';
  corners: [number, number, number][]; // 4 vertex offsets
  aoNeighbors: [number, number, number][][]; // for each vertex: [side1, side2, corner]
}

const FACES: FaceDirection[] = [
  // TOP (+Y)
  {
    dir: [0, 1, 0],
    normal: [0, 1, 0],
    shade: 1.0,
    name: 'top',
    corners: [
      [0, 1, 1],
      [1, 1, 1],
      [1, 1, 0],
      [0, 1, 0],
    ],
    aoNeighbors: [
      [[-1, 1, 0], [0, 1, 1], [-1, 1, 1]],
      [[1, 1, 0], [0, 1, 1], [1, 1, 1]],
      [[1, 1, 0], [0, 1, -1], [1, 1, -1]],
      [[-1, 1, 0], [0, 1, -1], [-1, 1, -1]],
    ],
  },
  // BOTTOM (-Y)
  {
    dir: [0, -1, 0],
    normal: [0, -1, 0],
    shade: 0.5,
    name: 'bottom',
    corners: [
      [0, 0, 0],
      [1, 0, 0],
      [1, 0, 1],
      [0, 0, 1],
    ],
    aoNeighbors: [
      [[-1, -1, 0], [0, -1, -1], [-1, -1, -1]],
      [[1, -1, 0], [0, -1, -1], [1, -1, -1]],
      [[1, -1, 0], [0, -1, 1], [1, -1, 1]],
      [[-1, -1, 0], [0, -1, 1], [-1, -1, 1]],
    ],
  },
  // NORTH (+Z)
  {
    dir: [0, 0, 1],
    normal: [0, 0, 1],
    shade: 0.8,
    name: 'north',
    corners: [
      [0, 0, 1],
      [1, 0, 1],
      [1, 1, 1],
      [0, 1, 1],
    ],
    aoNeighbors: [
      [[-1, 0, 0], [0, -1, 0], [-1, -1, 0]],
      [[1, 0, 0], [0, -1, 0], [1, -1, 0]],
      [[1, 0, 0], [0, 1, 0], [1, 1, 0]],
      [[-1, 0, 0], [0, 1, 0], [-1, 1, 0]],
    ],
  },
  // SOUTH (-Z)
  {
    dir: [0, 0, -1],
    normal: [0, 0, -1],
    shade: 0.8,
    name: 'south',
    corners: [
      [1, 0, 0],
      [0, 0, 0],
      [0, 1, 0],
      [1, 1, 0],
    ],
    aoNeighbors: [
      [[1, 0, 0], [0, -1, 0], [1, -1, 0]],
      [[-1, 0, 0], [0, -1, 0], [-1, -1, 0]],
      [[-1, 0, 0], [0, 1, 0], [-1, 1, 0]],
      [[1, 0, 0], [0, 1, 0], [1, 1, 0]],
    ],
  },
  // EAST (+X)
  {
    dir: [1, 0, 0],
    normal: [1, 0, 0],
    shade: 0.6,
    name: 'east',
    corners: [
      [1, 0, 1],
      [1, 0, 0],
      [1, 1, 0],
      [1, 1, 1],
    ],
    aoNeighbors: [
      [[0, 0, 1], [0, -1, 0], [0, -1, 1]],
      [[0, 0, -1], [0, -1, 0], [0, -1, -1]],
      [[0, 0, -1], [0, 1, 0], [0, 1, -1]],
      [[0, 0, 1], [0, 1, 0], [0, 1, 1]],
    ],
  },
  // WEST (-X)
  {
    dir: [-1, 0, 0],
    normal: [-1, 0, 0],
    shade: 0.6,
    name: 'west',
    corners: [
      [0, 0, 0],
      [0, 0, 1],
      [0, 1, 1],
      [0, 1, 0],
    ],
    aoNeighbors: [
      [[0, 0, -1], [0, -1, 0], [0, -1, -1]],
      [[0, 0, 1], [0, -1, 0], [0, -1, 1]],
      [[0, 0, 1], [0, 1, 0], [0, 1, 1]],
      [[0, 0, -1], [0, 1, 0], [0, 1, -1]],
    ],
  },
];

class MeshBuffer {
  positions: number[] = [];
  normals: number[] = [];
  uvs: number[] = [];
  layers: number[] = [];
  colors: number[] = [];
  sway: number[] = [];
  indices: number[] = [];
  vertexCount = 0;

  addQuad(
    corners: [number, number, number][],
    normal: [number, number, number],
    layer: number,
    aoValues: number[],
    faceShade: number,
    swayAmount: number
  ) {
    const base = this.vertexCount;
    const uvCoords: [number, number][] = [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ];

    for (let i = 0; i < 4; i++) {
      const c = corners[i]!;
      this.positions.push(c[0], c[1], c[2]);
      this.normals.push(normal[0], normal[1], normal[2]);
      this.uvs.push(uvCoords[i]![0], uvCoords[i]![1]);
      this.layers.push(layer);

      const aoLevel = Math.max(0, Math.min(3, aoValues[i] ?? 3));
      const aoFactor = AO_CURVE[aoLevel]!;
      const finalShade = aoFactor * faceShade;
      this.colors.push(finalShade, finalShade, finalShade);
      this.sway.push(swayAmount);
    }

    // Quad diagonal flip logic to prevent anisotropic diagonal streaks
    const ao0 = aoValues[0] ?? 3;
    const ao1 = aoValues[1] ?? 3;
    const ao2 = aoValues[2] ?? 3;
    const ao3 = aoValues[3] ?? 3;

    if (ao0 + ao2 < ao1 + ao3) {
      this.indices.push(base + 1, base + 2, base + 3, base + 3, base + 0, base + 1);
    } else {
      this.indices.push(base + 0, base + 1, base + 2, base + 2, base + 3, base + 0);
    }

    this.vertexCount += 4;
  }

  toGeometry(): THREE.BufferGeometry {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(this.positions, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(this.normals, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(this.uvs, 2));
    geo.setAttribute('aLayer', new THREE.Float32BufferAttribute(this.layers, 1));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(this.colors, 3));
    geo.setAttribute('aSway', new THREE.Float32BufferAttribute(this.sway, 1));
    geo.setIndex(this.indices);
    return geo;
  }
}

export function meshIsland(grid: VoxelGrid) {
  const opaque = new MeshBuffer();
  const cutout = new MeshBuffer();

  const isSolid = (x: number, y: number, z: number): boolean => {
    const b = grid.get(x, y, z);
    return BLOCKS[b]?.solid ?? false;
  };

  for (let z = 0; z < grid.sz; z++) {
    for (let x = 0; x < grid.sx; x++) {
      for (let y = 0; y < grid.sy; y++) {
        const block = grid.get(x, y, z);
        if (block === B.Air || block === B.Barrier) continue;

        const def: BlockDef = BLOCKS[block]!;
        const worldX = x - HALF_SX;
        const worldY = y;
        const worldZ = z - HALF_SZ;

        if (def.shape === 'cross') {
          // Crossed billboard plant
          const buffer = cutout;
          const layer = def.layers.top;
          const sway = def.sway || 0;

          // Quad 1: (-0.5, 0, -0.5) to (0.5, 1, 0.5)
          buffer.addQuad(
            [
              [worldX - 0.4, worldY, worldZ - 0.4],
              [worldX + 0.4, worldY, worldZ + 0.4],
              [worldX + 0.4, worldY + 0.9, worldZ + 0.4],
              [worldX - 0.4, worldY + 0.9, worldZ - 0.4],
            ],
            [0, 1, 0],
            layer,
            [3, 3, 3, 3],
            1.0,
            sway
          );
          // Quad 2: (-0.4, 0, 0.4) to (0.4, 1, -0.4)
          buffer.addQuad(
            [
              [worldX - 0.4, worldY, worldZ + 0.4],
              [worldX + 0.4, worldY, worldZ - 0.4],
              [worldX + 0.4, worldY + 0.9, worldZ - 0.4],
              [worldX - 0.4, worldY + 0.9, worldZ + 0.4],
            ],
            [0, 1, 0],
            layer,
            [3, 3, 3, 3],
            1.0,
            sway
          );
          continue;
        }

        const isSlab = def.shape === 'slab';
        const heightScale = isSlab ? 0.5 : 1.0;
        const targetBuffer = def.opaque ? opaque : cutout;
        const sway = def.sway || 0;

        for (const face of FACES) {
          const nx = x + face.dir[0];
          const ny = y + face.dir[1];
          const nz = z + face.dir[2];

          // Face culling
          const neighborBlock = grid.get(nx, ny, nz);
          const neighborDef = BLOCKS[neighborBlock];

          // Opaque blocks cull faces with other opaque blocks
          if (def.opaque && neighborDef?.opaque) continue;
          // Leaf to leaf culling
          if (block === B.Leaves && neighborBlock === B.Leaves) continue;
          // Skip bottom faces below sea bedrock
          if (face.name === 'bottom' && y <= 0) continue;

          const layer = def.layers[face.name];
          const corners: [number, number, number][] = face.corners.map(([cx, cy, cz]) => [
            worldX + cx!,
            worldY + cy! * heightScale,
            worldZ + cz!,
          ]);

          // Calculate AO
          const aoLevels: number[] = face.aoNeighbors.map((group) => {
            const side1 = isSolid(x + group[0]![0], y + group[0]![1], z + group[0]![2]) ? 1 : 0;
            const side2 = isSolid(x + group[1]![0], y + group[1]![1], z + group[1]![2]) ? 1 : 0;
            const corner = isSolid(x + group[2]![0], y + group[2]![1], z + group[2]![2]) ? 1 : 0;

            if (side1 && side2) return 0;
            return 3 - (side1 + side2 + corner);
          });

          targetBuffer.addQuad(corners, face.normal, layer, aoLevels, face.shade, sway);
        }
      }
    }
  }

  // Generate Trimesh collision positions & indices (from opaque geometry)
  const collisionPositions = new Float32Array(opaque.positions);
  const collisionIndices = new Uint32Array(opaque.indices);

  return {
    opaqueGeo: opaque.toGeometry(),
    cutoutGeo: cutout.toGeometry(),
    collision: {
      positions: collisionPositions,
      indices: collisionIndices,
    },
    stats: {
      opaqueQuads: opaque.vertexCount / 4,
      cutoutQuads: cutout.vertexCount / 4,
      totalTriangles: (opaque.indices.length + cutout.indices.length) / 3,
    },
  };
}
