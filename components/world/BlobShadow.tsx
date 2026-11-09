'use client';

import React, { useMemo } from 'react';
import * as THREE from 'three';

let cachedTexture: THREE.CanvasTexture | null = null;

function getBlobShadowTexture(): THREE.CanvasTexture {
  if (cachedTexture) return cachedTexture;

  if (typeof document === 'undefined') {
    return new THREE.CanvasTexture(null as unknown as HTMLCanvasElement);
  }

  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.55)');
    grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.25)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
  }

  cachedTexture = new THREE.CanvasTexture(canvas);
  cachedTexture.needsUpdate = true;
  return cachedTexture;
}

interface BlobShadowProps {
  radius?: number;
  opacity?: number;
}

export function BlobShadow({ radius = 0.85, opacity = 0.65 }: BlobShadowProps) {
  const texture = useMemo(() => getBlobShadowTexture(), []);

  return (
    <mesh
      position={[0, -0.74, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      renderOrder={1}
    >
      <planeGeometry args={[radius * 2, radius * 2]} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={opacity}
        depthWrite={false}
      />
    </mesh>
  );
}

