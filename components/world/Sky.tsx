'use client';

import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { TimeOfDaySample } from '@/lib/timeOfDay';

interface SkyProps {
  tod: TimeOfDaySample;
  sunRef?: (node: THREE.Mesh | null) => void;
}

const vertexShader = `
varying vec3 vWorldPosition;
varying vec3 vNormal;

void main() {
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPos.xyz;
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
`;

const fragmentShader = `
uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform vec3 uHorizon;
uniform vec3 uZenith;
uniform float uStarAlpha;

varying vec3 vWorldPosition;
varying vec3 vNormal;

// Pseudo-random hash for stars
float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

void main() {
  vec3 dir = normalize(vWorldPosition);

  // Vertical sky gradient from horizon to zenith
  float elevation = max(dir.y, 0.0);
  vec3 sky = mix(uHorizon, uZenith, pow(elevation, 0.65));

  // Warm sun glow band along horizon
  float sunDot = max(dot(dir, uSunDir), 0.0);
  sky += uSunColor * pow(sunDot, 6.0) * 0.35;

  // Pixel / Box test for square sun
  vec3 right = normalize(cross(uSunDir, vec3(0.0, 1.0, 0.0)));
  vec3 up = cross(right, uSunDir);
  vec2 uvSun = vec2(dot(dir - uSunDir, right), dot(dir - uSunDir, up));

  if (max(abs(uvSun.x), abs(uvSun.y)) < 0.045 && uSunDir.y > -0.1) {
    // Square sun core with intense emissive color that blooms
    sky = uSunColor * 3.5;
  }

  // Square moon opposite to sun
  vec3 moonDir = -uSunDir;
  vec3 mRight = normalize(cross(moonDir, vec3(0.0, 1.0, 0.0)));
  vec3 mUp = cross(mRight, moonDir);
  vec2 uvMoon = vec2(dot(dir - moonDir, mRight), dot(dir - moonDir, mUp));

  if (max(abs(uvMoon.x), abs(uvMoon.y)) < 0.038 && moonDir.y > -0.1) {
    sky = vec3(0.85, 0.92, 1.0) * 2.2;
  }

  // Stars during night / twilight
  if (uStarAlpha > 0.05 && dir.y > 0.1) {
    vec2 starGrid = floor(dir.xz / (dir.y + 0.1) * 120.0);
    vec2 p = fract(starGrid * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    float h = fract(p.x * p.y);
    if (h > 0.985) {
      float starBrightness = (h - 0.985) / 0.015;
      sky += vec3(starBrightness * uStarAlpha * 0.85);
    }
  }

  gl_FragColor = vec4(sky, 1.0);
}
`;

const skyUniforms = {
  uSunDir: { value: new THREE.Vector3() },
  uSunColor: { value: new THREE.Color() },
  uHorizon: { value: new THREE.Color() },
  uZenith: { value: new THREE.Color() },
  uStarAlpha: { value: 0 },
};

export function Sky({ tod, sunRef }: SkyProps) {
  const targetSunRef = useRef<THREE.Mesh | null>(null);

  useFrame(() => {
    skyUniforms.uSunDir.value.set(...tod.sunDir);
    skyUniforms.uSunColor.value.set(tod.sunColor);
    skyUniforms.uHorizon.value.set(tod.horizon);
    skyUniforms.uZenith.value.set(tod.zenith);
    skyUniforms.uStarAlpha.value = tod.starAlpha;

    if (targetSunRef.current) {
      targetSunRef.current.position.set(
        tod.sunDir[0] * 120,
        tod.sunDir[1] * 120,
        tod.sunDir[2] * 120
      );
    }
  });

  return (
    <group>
      {/* Inverted Sky Sphere Dome */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[280, 32, 24]} />
        <shaderMaterial
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={skyUniforms}
          side={THREE.BackSide}
          depthWrite={false}
          fog={false}
        />
      </mesh>

      {/* Target Sun Mesh for GodRays */}
      <mesh
        ref={(el) => {
          targetSunRef.current = el;
          if (sunRef) sunRef(el);
        }}
      >
        <sphereGeometry args={[4, 8, 8]} />
        <meshBasicMaterial color={tod.sunColor} />
      </mesh>
    </group>
  );
}
