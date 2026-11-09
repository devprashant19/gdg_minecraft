'use client';

import React from 'react';
import { SPAWN_POSITION } from '@/lib/world-constants';

export function Dock() {
  return (
    <group position={SPAWN_POSITION} name="spawn-dock">
      {/* Spawn point ground marker */}
      <mesh position={[0, -0.4, 0]} receiveShadow>
        <cylinderGeometry args={[0.8, 0.8, 0.05, 8]} />
        <meshStandardMaterial color="#e5b83b" roughness={0.4} />
      </mesh>
    </group>
  );
}

