'use client';

import React, { useMemo } from 'react';
import { RigidBody, CuboidCollider } from '@react-three/rapier';

/**
 * Invisible World Boundaries:
 * - 32-sided polygon perimeter wall cylinder around island and dock (R = 27.6m)
 * - Solid height ceiling collider at Y = 26.5m (prevents flying out of world)
 * - Solid ocean floor collider at Y = 2.5m (prevents falling into bottomless void)
 * Completely invisible (no visual meshes), providing a clean, unhindered scenic view.
 */
export function Boundaries() {
  const NUM_SEGMENTS = 32;
  const BORDER_RADIUS = 27.6; // Encloses island (r=26) and south spawn dock (z=24)
  const CEILING_Y = 26.0;
  const WALL_HEIGHT = 26.0;
  const WALL_MID_Y = 14.0;

  // Invisible Physics Colliders: 32 vertical wall segments around island perimeter
  const segments = useMemo(() => {
    const list = [];
    for (let i = 0; i < NUM_SEGMENTS; i++) {
      const angle = (i / NUM_SEGMENTS) * Math.PI * 2;
      const nextAngle = ((i + 1) / NUM_SEGMENTS) * Math.PI * 2;

      const x1 = Math.cos(angle) * BORDER_RADIUS;
      const z1 = Math.sin(angle) * BORDER_RADIUS;
      const x2 = Math.cos(nextAngle) * BORDER_RADIUS;
      const z2 = Math.sin(nextAngle) * BORDER_RADIUS;

      const midX = (x1 + x2) / 2;
      const midZ = (z1 + z2) / 2;
      const segLength = Math.hypot(x2 - x1, z2 - z1);
      const rotY = Math.atan2(x2 - x1, z2 - z1);

      list.push({
        key: `invisible-wall-${i}`,
        position: [midX, WALL_MID_Y, midZ] as [number, number, number],
        rotation: [0, rotY, 0] as [number, number, number],
        // Cuboid half-extents: [thickness 0.5, halfHeight 15.0, halfLength segLength/2 + 0.15]
        args: [0.5, WALL_HEIGHT / 2 + 2, segLength / 2 + 0.15] as [number, number, number],
      });
    }
    return list;
  }, [NUM_SEGMENTS, BORDER_RADIUS, WALL_HEIGHT, WALL_MID_Y]);

  return (
    <RigidBody type="fixed" colliders={false} name="invisible-world-boundaries">
      {/* 32 Tall Perimeter Invisible Colliders (from Y=0 to Y=28) */}
      {segments.map((seg) => (
        <CuboidCollider
          key={seg.key}
          position={seg.position}
          rotation={seg.rotation}
          args={seg.args}
          friction={0.0}
          restitution={0.0}
        />
      ))}

      {/* Invisible Height Ceiling Collider: solid barrier at Y=26.5 */}
      <CuboidCollider
        position={[0, CEILING_Y + 1.0, 0]}
        args={[32, 1.0, 32]}
        friction={0.0}
        restitution={0.0}
      />

      {/* Invisible Ocean Bed / Bottom Floor Collider: solid barrier at Y=2.5 */}
      <CuboidCollider
        position={[0, 2.5, 0]}
        args={[32, 0.5, 32]}
        friction={0.1}
        restitution={0.0}
      />
    </RigidBody>
  );
}
