'use client';

import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { RigidBody, CuboidCollider } from '@react-three/rapier';

// Authentic Minecraft World Border Shader (Vertical cylindrical energy barrier)
const borderVertexShader = `
varying vec2 vUv;
varying vec3 vWorldPosition;

void main() {
  vUv = uv;
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPos.xyz;
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

const borderFragmentShader = `
uniform float uTime;
uniform vec3 uColor;
varying vec2 vUv;
varying vec3 vWorldPosition;

void main() {
  // Minecraft classic diagonal animated world border stripes
  float stripe = sin((vUv.x * 54.0 + vUv.y * 14.0 - uTime * 1.8) * 3.14159);
  float pattern = smoothstep(-0.25, 0.25, stripe);

  // Soft vertical edge glow at bottom near water and top near ceiling
  float edgeY = smoothstep(0.0, 0.08, vUv.y) * smoothstep(1.0, 0.90, vUv.y);
  float edgeGlow = (1.0 - edgeY) * 0.45;

  // Translucent glowing cyan barrier with pulsing energy
  float pulse = 0.82 + 0.18 * sin(uTime * 2.5);
  float alpha = (mix(0.12, 0.42, pattern) + edgeGlow) * pulse;

  vec3 col = uColor * (0.8 + 0.4 * pattern);
  gl_FragColor = vec4(col, alpha);
}
`;

// Ceiling forcefield grid shader
const ceilingFragmentShader = `
uniform float uTime;
uniform vec3 uColor;
varying vec2 vUv;

void main() {
  // Hex/square energy grid cells on world ceiling
  vec2 coord = vUv * 36.0;
  vec2 grid = abs(fract(coord - 0.5) - 0.5) / fwidth(coord);
  float line = min(grid.x, grid.y);
  float gridLine = 1.0 - min(line, 1.0);

  // Concentric animated ripple pulse
  float dist = length(vUv - 0.5) * 2.0;
  float ring = sin(dist * 22.0 - uTime * 2.2);
  float ringAlpha = smoothstep(0.7, 1.0, ring) * 0.28;

  float alpha = clamp(gridLine * 0.35 + ringAlpha + 0.07, 0.0, 0.65);
  alpha *= smoothstep(1.0, 0.82, dist); // Fade nicely at cylinder joint

  vec3 col = uColor * (1.0 + 0.3 * ringAlpha);
  gl_FragColor = vec4(col, alpha);
}
`;

const wallUniforms = {
  uTime: { value: 0 },
  uColor: { value: new THREE.Color('#29b6f6') }, // Vibrant Minecraft World Border cyan
};

const ceilingUniforms = {
  uTime: { value: 0 },
  uColor: { value: new THREE.Color('#38c2ff') },
};

export function Boundaries() {
  const NUM_SEGMENTS = 32;
  const BORDER_RADIUS = 27.6; // Perfectly bounds island (r=26) and south dock (z=24)
  const CEILING_Y = 26.0;
  const WALL_HEIGHT = 26.0;
  const WALL_MID_Y = 14.0;

  // Physics Colliders: 32 vertical wall segments around island perimeter
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
        key: `wall-${i}`,
        position: [midX, WALL_MID_Y, midZ] as [number, number, number],
        rotation: [0, rotY, 0] as [number, number, number],
        // Cuboid half-extents: [thickness 0.5, halfHeight 14.0, halfLength segLength/2 + 0.15]
        args: [0.5, WALL_HEIGHT / 2 + 2, segLength / 2 + 0.15] as [number, number, number],
      });
    }
    return list;
  }, [NUM_SEGMENTS, BORDER_RADIUS, WALL_HEIGHT, WALL_MID_Y]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    wallUniforms.uTime.value = t;
    ceilingUniforms.uTime.value = t;
  });

  return (
    <>
      {/* 1. Rapier RigidBody Physics Barriers */}
      <RigidBody type="fixed" colliders={false} name="world-boundaries">
        {/* 32 Tall Perimeter Barrier Colliders (from Y=0 to Y=28) */}
        {segments.map((seg) => (
          <CuboidCollider
            key={seg.key}
            position={seg.position}
            rotation={seg.rotation}
            args={seg.args}
            friction={0.0}
            restitution={0.2}
          />
        ))}

        {/* Height Ceiling Collider: solid barrier at Y=26.5 */}
        <CuboidCollider
          position={[0, CEILING_Y + 1.0, 0]}
          args={[32, 1.0, 32]}
          friction={0.0}
          restitution={0.2}
        />

        {/* Ocean Bed / Bottom Floor Collider: solid barrier at Y=2.5 */}
        <CuboidCollider
          position={[0, 2.5, 0]}
          args={[32, 0.5, 32]}
          friction={0.1}
          restitution={0.0}
        />
      </RigidBody>

      {/* 2. Visual Minecraft World Border Wall (Translucent Energy Cylinder) */}
      <mesh position={[0, WALL_MID_Y, 0]} raycast={() => null}>
        <cylinderGeometry args={[BORDER_RADIUS, BORDER_RADIUS, WALL_HEIGHT, 64, 1, true]} />
        <shaderMaterial
          vertexShader={borderVertexShader}
          fragmentShader={borderFragmentShader}
          uniforms={wallUniforms}
          transparent
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* 3. Visual Minecraft Ceiling Border Grid (Forcefield Dome Cap) */}
      <mesh
        position={[0, CEILING_Y, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        raycast={() => null}
      >
        <circleGeometry args={[BORDER_RADIUS, 64]} />
        <shaderMaterial
          vertexShader={borderVertexShader}
          fragmentShader={ceilingFragmentShader}
          uniforms={ceilingUniforms}
          transparent
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </>
  );
}
