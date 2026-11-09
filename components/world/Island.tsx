'use client';

import React, { useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import CustomShaderMaterialVanilla from 'three-custom-shader-material/vanilla';
import { RigidBody, TrimeshCollider } from '@react-three/rapier';
import { buildIsland } from '@/lib/island';
import { meshIsland } from '@/lib/mesher';
import { createTileArrayTexture } from '@/lib/textures';
import { useGame } from '@/lib/store';

interface IslandProps {
  seed?: number;
}

// Shared uniform object driven by useFrame (Phase 4.3 specification)
const islandUniforms = {
  uTime: { value: 0 },
  uSwayScale: { value: 1.0 },
};

export function Island({ seed = 1337 }: IslandProps) {
  const reducedMotion = useGame((s) => s.reducedMotion);

  // 1. Build voxel grid & generate geometry
  const { opaqueGeo, cutoutGeo, collision } = useMemo(() => {
    const grid = buildIsland(seed);
    return meshIsland(grid);
  }, [seed]);

  // 2. Procedural Code-Painted 2D Array Texture
  const tileTexture = useMemo(() => {
    return createTileArrayTexture(seed);
  }, [seed]);

  // 3. Custom Shader Materials with leaf & vegetation sway
  const opaqueMaterial = useMemo(() => {
    return new CustomShaderMaterialVanilla({
      baseMaterial: THREE.MeshStandardMaterial,
      roughness: 0.95,
      metalness: 0.05,
      uniforms: {
        uTiles: { value: tileTexture },
        uTime: islandUniforms.uTime,
        uSwayScale: islandUniforms.uSwayScale,
      },
      vertexShader: `
        attribute float aLayer;
        attribute float aSway;
        uniform float uTime;
        uniform float uSwayScale;
        varying float vLayer;
        varying vec3 vAO;
        void main() {
          vLayer = aLayer;
          vAO = color;

          vec3 p = position;
          if (aSway > 0.0) {
            vec4 wp = modelMatrix * vec4(p, 1.0);
            float w = sin(uTime * 1.6 + wp.x * 0.8 + wp.z * 0.6) * 0.06 * aSway * uSwayScale;
            w += sin(uTime * 3.7 + wp.x * 2.1) * 0.015 * aSway * uSwayScale;
            csm_Position = p + vec3(w, 0.0, w * 0.6);
          }
        }
      `,
      fragmentShader: `
        precision highp sampler2DArray;
        uniform sampler2DArray uTiles;
        varying float vLayer;
        varying vec3 vAO;
        void main() {
          vec4 t = texture(uTiles, vec3(vUv, vLayer));
          csm_DiffuseColor = vec4(t.rgb * vAO, 1.0);
        }
      `,
    });
  }, [tileTexture]);

  const cutoutMaterial = useMemo(() => {
    return new CustomShaderMaterialVanilla({
      baseMaterial: THREE.MeshStandardMaterial,
      roughness: 0.9,
      metalness: 0,
      alphaTest: 0.5,
      side: THREE.DoubleSide,
      uniforms: {
        uTiles: { value: tileTexture },
        uTime: islandUniforms.uTime,
        uSwayScale: islandUniforms.uSwayScale,
      },
      vertexShader: `
        attribute float aLayer;
        attribute float aSway;
        uniform float uTime;
        uniform float uSwayScale;
        varying float vLayer;
        varying vec3 vAO;
        void main() {
          vLayer = aLayer;
          vAO = color;

          vec3 p = position;
          vec4 wp = modelMatrix * vec4(p, 1.0);
          float w = sin(uTime * 1.6 + wp.x * 0.8 + wp.z * 0.6) * 0.06 * aSway * uSwayScale;
          w += sin(uTime * 3.7 + wp.x * 2.1) * 0.015 * aSway * uSwayScale;
          csm_Position = p + vec3(w, 0.0, w * 0.6);
        }
      `,
      fragmentShader: `
        precision highp sampler2DArray;
        uniform sampler2DArray uTiles;
        varying float vLayer;
        varying vec3 vAO;
        void main() {
          vec4 t = texture(uTiles, vec3(vUv, vLayer));
          if (t.a < 0.5) discard;
          csm_DiffuseColor = vec4(t.rgb * vAO, t.a);
        }
      `,
    });
  }, [tileTexture]);

  useFrame((state) => {
    islandUniforms.uTime.value = state.clock.getElapsedTime();
    islandUniforms.uSwayScale.value = reducedMotion ? 0.0 : 1.0;
  });

  // 4. Memory cleanup on unmount
  useEffect(() => {
    return () => {
      opaqueGeo.dispose();
      cutoutGeo.dispose();
      tileTexture.dispose();
      opaqueMaterial.dispose();
      cutoutMaterial.dispose();
    };
  }, [opaqueGeo, cutoutGeo, tileTexture, opaqueMaterial, cutoutMaterial]);

  return (
    <group name="voxel-island">
      {/* Visual Opaque Terrain Mesh */}
      <mesh
        geometry={opaqueGeo}
        material={opaqueMaterial}
        castShadow
        receiveShadow
      />

      {/* Visual Cutout Vegetation Mesh (Leaves, Foliage, Plants) */}
      <mesh
        geometry={cutoutGeo}
        material={cutoutMaterial}
        castShadow
        receiveShadow
      />

      {/* Optimized Physics Collider */}
      <RigidBody type="fixed" colliders={false} name="island-terrain">
        <TrimeshCollider
          args={[collision.positions, collision.indices]}
          friction={0.8}
          restitution={0.0}
        />
      </RigidBody>
    </group>
  );
}
