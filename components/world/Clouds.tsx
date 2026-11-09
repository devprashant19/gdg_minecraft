'use client';

import React, { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGame } from '@/lib/store';
import { TIER_CONFIGS } from '@/lib/quality';

interface CloudData {
  x: number;
  y: number;
  z: number;
  sx: number;
  sy: number;
  sz: number;
  speed: number;
}

function initClouds(): CloudData[] {
  const list: CloudData[] = [];
  let seed = 42;
  const rnd = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  for (let i = 0; i < 50; i++) {
    const x = (rnd() - 0.5) * 320;
    const y = 42 + rnd() * 6;
    const z = (rnd() - 0.5) * 320;
    const sx = 10 + rnd() * 18;
    const sy = 1.2;
    const sz = 8 + rnd() * 14;
    const speed = 0.5 + rnd() * 0.3;
    list.push({ x, y, z, sx, speed, sy, sz });
  }
  return list;
}

export function Clouds() {
  const qualityTier = useGame((s) => s.qualityTier);
  const openSection = useGame((s) => s.openSection);
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const cloudsRef = useRef<CloudData[]>(initClouds());

  const count = TIER_CONFIGS[qualityTier].cloudsCount;
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Initialize instance matrices
  useEffect(() => {
    if (!meshRef.current) return;
    const clouds = cloudsRef.current;
    for (let i = 0; i < count; i++) {
      const c = clouds[i]!;
      dummy.position.set(c.x, c.y, c.z);
      dummy.scale.set(c.sx, c.sy, c.sz);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [count, dummy]);

  // Frame update: drift clouds along +X axis and wrap around
  useFrame((_, delta) => {
    if (!meshRef.current || openSection) return;

    const clouds = cloudsRef.current;
    for (let i = 0; i < count; i++) {
      const c = clouds[i]!;
      c.x += c.speed * delta * 4.0;
      if (c.x > 160) {
        c.x = -160;
      }
      dummy.position.set(c.x, c.y, c.z);
      dummy.scale.set(c.sx, c.sy, c.sz);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, count]}
      position={[0, 0, 0]}
      frustumCulled={false}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial
        color="#ffffff"
        roughness={0.9}
        transparent
        opacity={0.85}
        depthWrite={false}
      />
    </instancedMesh>
  );
}
