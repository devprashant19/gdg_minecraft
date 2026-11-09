'use client';

import React from 'react';
import { RigidBody, CuboidCollider } from '@react-three/rapier';
import { ISLAND_RADIUS } from '@/lib/world-constants';

export function Boundaries() {
  const NUM_SEGMENTS = 24;
  const segments = [];

  for (let i = 0; i < NUM_SEGMENTS; i++) {
    const angle = (i / NUM_SEGMENTS) * Math.PI * 2;
    const nextAngle = ((i + 1) / NUM_SEGMENTS) * Math.PI * 2;

    const r = ISLAND_RADIUS + 2;
    const x1 = Math.cos(angle) * r;
    const z1 = Math.sin(angle) * r;
    const x2 = Math.cos(nextAngle) * r;
    const z2 = Math.sin(nextAngle) * r;

    const midX = (x1 + x2) / 2;
    const midZ = (z1 + z2) / 2;
    const segLength = Math.hypot(x2 - x1, z2 - z1);
    const rotY = Math.atan2(x2 - x1, z2 - z1);

    segments.push({
      key: `boundary-${i}`,
      position: [midX, 4, midZ] as [number, number, number],
      rotation: [0, rotY, 0] as [number, number, number],
      args: [0.3, 5, segLength / 2] as [number, number, number],
    });
  }

  return (
    <RigidBody type="fixed" colliders={false} name="perimeter-fence">
      {segments.map((seg) => (
        <CuboidCollider
          key={seg.key}
          position={seg.position}
          rotation={seg.rotation}
          args={seg.args}
        />
      ))}
    </RigidBody>
  );
}

