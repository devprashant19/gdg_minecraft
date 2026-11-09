'use client';

import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGame } from '@/lib/store';

export function DestinationMarker() {
  const clickNavTarget = useGame((s) => s.clickNavTarget);
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ringRef.current && clickNavTarget) {
      const t = state.clock.getElapsedTime();
      ringRef.current.rotation.z = t * 1.5;
      const s = 1.0 + Math.sin(t * 5.0) * 0.12;
      ringRef.current.scale.set(s, s, 1);
    }
  });

  if (!clickNavTarget) return null;

  const [x, y, z] = clickNavTarget;

  return (
    <group position={[x, y + 0.05, z]} rotation={[-Math.PI / 2, 0, 0]}>
      {/* Outer Rotating Ring */}
      <mesh ref={ringRef}>
        <ringGeometry args={[0.55, 0.72, 32]} />
        <meshBasicMaterial
          color="#ffb46b"
          transparent
          opacity={0.85}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Center Target Dot */}
      <mesh ref={meshRef}>
        <circleGeometry args={[0.2, 16]} />
        <meshBasicMaterial
          color="#ffdd77"
          transparent
          opacity={0.9}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

