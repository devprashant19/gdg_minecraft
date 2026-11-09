'use client';

import React from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { TimeOfDaySample } from '@/lib/timeOfDay';

interface WaterProps {
  tod: TimeOfDaySample;
}

const waterVertexShader = `
uniform float uTime;
varying vec3 vWorldPosition;
varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {
  vec3 p = position;

  // Gentle procedural wave displacement
  float wave = sin(uTime * 1.5 + p.x * 0.15 + p.y * 0.1) * 0.06;
  wave += sin(uTime * 2.8 + p.x * 0.35) * 0.025;
  p.z += wave;

  vec4 worldPos = modelMatrix * vec4(p, 1.0);
  vWorldPosition = worldPos.xyz;

  // Calculate surface normal approximation from wave slope
  float dWdx = cos(uTime * 1.5 + p.x * 0.15 + p.y * 0.1) * 0.06 * 0.15;
  float dWdz = cos(uTime * 1.5 + p.x * 0.15 + p.y * 0.1) * 0.06 * 0.10;
  vec3 norm = normalize(vec3(-dWdx, 1.0, -dWdz));
  vNormal = normalize(normalMatrix * norm);

  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  vViewPosition = -mvPosition.xyz;
  gl_Position = projectionMatrix * mvPosition;
}
`;

const waterFragmentShader = `
uniform float uTime;
uniform vec3 uSunDir;
uniform vec3 uSunColor;
uniform vec3 uHorizon;

varying vec3 vWorldPosition;
varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {
  // Distance from island center (island radius is ~26 units)
  float distFromCenter = length(vWorldPosition.xz);
  float d = clamp((distFromCenter - 25.5) / 50.0, 0.0, 1.0);

  // Deep navy to shallow turquoise gradient
  vec3 shallow = vec3(0.247, 0.816, 0.788); // #3fd0c9
  vec3 deep = vec3(0.114, 0.306, 0.537);    // #1d4e89
  vec3 water = mix(shallow, deep, smoothstep(0.0, 0.4, d));

  // Fresnel sky reflection
  vec3 viewDir = normalize(vViewPosition);
  float fres = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 3.0);
  water = mix(water, uHorizon, fres * 0.55);

  // Animated pixelated foam ring around shoreline
  float foamWave = fract(d * 22.0 - uTime * 0.6);
  float foam = step(0.5, foamWave) * (1.0 - smoothstep(0.0, 0.07, d));
  water += vec3(foam * 0.75);

  // Sun specular glint (emissive above 1.0 so it blooms in post-processing)
  vec3 halfVec = normalize(uSunDir + viewDir);
  float spec = pow(max(dot(vNormal, halfVec), 0.0), 120.0);
  if (spec > 0.01 && uSunDir.y > 0.0) {
    water += uSunColor * spec * 2.5;
  }

  // Alpha transparency fades from near shore (0.75) to deep sea (0.92)
  float alpha = mix(0.75, 0.94, smoothstep(0.0, 0.3, d));
  gl_FragColor = vec4(water, alpha);
}
`;

const waterUniforms = {
  uTime: { value: 0 },
  uSunDir: { value: new THREE.Vector3() },
  uSunColor: { value: new THREE.Color() },
  uHorizon: { value: new THREE.Color() },
};

export function Water({ tod }: WaterProps) {
  useFrame((state) => {
    waterUniforms.uTime.value = state.clock.getElapsedTime();
    waterUniforms.uSunDir.value.set(...tod.sunDir);
    waterUniforms.uSunColor.value.set(tod.sunColor);
    waterUniforms.uHorizon.value.set(tod.horizon);
  });

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 3.4, 0]}
      raycast={() => null} // Disable raycasting so clicks pass through to island
    >
      <planeGeometry args={[400, 400, 96, 96]} />
      <shaderMaterial
        vertexShader={waterVertexShader}
        fragmentShader={waterFragmentShader}
        uniforms={waterUniforms}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}
