'use client';

import React from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import { useGame, SectionId } from '@/lib/store';
import { TIER_CONFIGS } from '@/lib/quality';
import { playPortalWarp } from '@/lib/sound';

interface PortalProps {
  position?: [number, number, number];
  isClosed?: boolean;
}

const portalVertexShader = `
varying vec2 vUv;
varying vec3 vWorldPosition;

void main() {
  vUv = uv;
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPos.xyz;
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

const portalFragmentShader = `
uniform float uTime;
uniform float uClosed;
uniform float uReducedMotion;

varying vec2 vUv;

// Simplex-like 2D noise helper
vec2 hash(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(dot(hash(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)),
        dot(hash(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
    mix(dot(hash(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
        dot(hash(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x), u.y);
}

void main() {
  vec2 center = vUv - 0.5;
  float dist = length(center);
  float angle = atan(center.y, center.x);

  float speed = uReducedMotion > 0.5 ? 0.2 : 1.6;
  float swirl = angle * 2.0 - dist * 8.0 + uTime * speed;

  // Layered noise turbulence
  float n1 = noise(vec2(cos(swirl), sin(swirl)) * 2.5 + uTime * 0.4);
  float n2 = noise(vUv * 6.0 - uTime * 0.2);

  // Core energy vortex color (intense purple / magenta / cyan)
  vec3 colPurple = vec3(0.55, 0.15, 0.95);
  vec3 colMagenta = vec3(0.95, 0.2, 0.85);
  vec3 colCyan = vec3(0.2, 0.85, 0.95);

  vec3 color = mix(colPurple, colMagenta, sin(swirl + n1 * 2.0) * 0.5 + 0.5);
  color = mix(color, colCyan, n2 * 0.4);

  // Center flare with emissive bloom intensity (> 1.0)
  float centerGlow = pow(max(1.0 - dist * 2.0, 0.0), 2.5);
  color += vec3(0.7, 0.3, 1.0) * centerGlow * 2.8;

  // Desaturate if portal is closed
  if (uClosed > 0.5) {
    float gray = dot(color, vec3(0.299, 0.587, 0.114));
    color = vec3(gray * 0.5);
  }

  // Rectangular edge falloff inside the portal frame
  vec2 d = abs(center);
  float boxDist = max(d.x, d.y);
  float edgeAlpha = smoothstep(0.5, 0.48, boxDist);
  gl_FragColor = vec4(color, edgeAlpha * 0.92);
}
`;

const portalUniforms = {
  uTime: { value: 0 },
  uClosed: { value: 0.0 },
  uReducedMotion: { value: 0.0 },
};

export function Portal({ position = [0, 5.0, 2], isClosed = false }: PortalProps) {
  const open = useGame((s) => s.open);
  const qualityTier = useGame((s) => s.qualityTier);
  const reducedMotion = useGame((s) => s.reducedMotion);

  const sparklesCount = TIER_CONFIGS[qualityTier].sparklesCount;

  useFrame((state) => {
    portalUniforms.uTime.value = state.clock.getElapsedTime();
    portalUniforms.uClosed.value = isClosed ? 1.0 : 0.0;
    portalUniforms.uReducedMotion.value = reducedMotion ? 1.0 : 0.0;
  });

  return (
    <group position={position} name="ancient-portal">
      {/* Obsidian Frame */}
      <group>
        {/* Left pillar */}
        <mesh position={[-1.15, 1.75, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.6, 3.5, 0.6]} />
          <meshStandardMaterial color="#150d21" roughness={0.3} metalness={0.2} />
        </mesh>
        {/* Right pillar */}
        <mesh position={[1.15, 1.75, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.6, 3.5, 0.6]} />
          <meshStandardMaterial color="#150d21" roughness={0.3} metalness={0.2} />
        </mesh>
        {/* Top arch */}
        <mesh position={[0, 3.2, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.9, 0.6, 0.6]} />
          <meshStandardMaterial color="#150d21" roughness={0.3} metalness={0.2} />
        </mesh>
        {/* Bottom sill */}
        <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.9, 0.6, 0.6]} />
          <meshStandardMaterial color="#150d21" roughness={0.3} metalness={0.2} />
        </mesh>
      </group>

      {/* Swirling Vortex Energy Surface */}
      <mesh
        position={[0, 1.75, 0]}
        onClick={() => {
          playPortalWarp();
          open('register' as SectionId);
        }}
        onPointerOver={() => {
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'default';
        }}
      >
        <planeGeometry args={[1.7, 2.3]} />
        <shaderMaterial
          vertexShader={portalVertexShader}
          fragmentShader={portalFragmentShader}
          uniforms={portalUniforms}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>

      {/* Floating Sparkles around Portal */}
      <Sparkles
        count={sparklesCount}
        scale={[2.4, 3.2, 1.2]}
        position={[0, 1.75, 0]}
        speed={reducedMotion ? 0.1 : 0.5}
        color="#c58bff"
        size={3}
      />
    </group>
  );
}
