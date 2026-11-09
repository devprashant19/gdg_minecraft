'use client';

import React, { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGame } from '@/lib/store';

interface PlayerModelProps {
  isMoving?: boolean;
}

function createSteveTextures() {
  if (typeof document === 'undefined') return null;

  const makeCanvas = (draw: (ctx: CanvasRenderingContext2D) => void) => {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    draw(ctx);
    const tex = new THREE.CanvasTexture(canvas);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.generateMipmaps = false;
    return tex;
  };

  // Face (Front, -Z)
  const faceTex = makeCanvas((ctx) => {
    ctx.fillStyle = '#db9c6d';
    ctx.fillRect(0, 0, 16, 16);
    // Hair on forehead
    ctx.fillStyle = '#4a2f1b';
    ctx.fillRect(0, 0, 16, 4);
    ctx.fillRect(0, 4, 2, 4);
    ctx.fillRect(14, 4, 2, 4);
    // Eyes
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(2, 7, 4, 2);
    ctx.fillRect(10, 7, 4, 2);
    ctx.fillStyle = '#2d4586';
    ctx.fillRect(4, 7, 2, 2);
    ctx.fillRect(10, 7, 2, 2);
    // Nose
    ctx.fillStyle = '#c58557';
    ctx.fillRect(6, 9, 4, 2);
    // Beard / Mouth
    ctx.fillStyle = '#59341e';
    ctx.fillRect(5, 11, 6, 2);
    ctx.fillStyle = '#8f563b';
    ctx.fillRect(6, 11, 4, 1);
  });

  // Hair (Sides, Back +Z, Top)
  const hairTex = makeCanvas((ctx) => {
    ctx.fillStyle = '#4a2f1b';
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = '#3a2313';
    for (let i = 0; i < 16; i += 3) {
      ctx.fillRect(i, (i * 7) % 16, 2, 2);
    }
  });

  // Shirt Front (-Z) with skin V-neck
  const shirtFrontTex = makeCanvas((ctx) => {
    ctx.fillStyle = '#00a8a8';
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = '#008585';
    ctx.fillRect(0, 0, 2, 16);
    ctx.fillRect(14, 0, 2, 16);
    ctx.fillRect(0, 14, 16, 2);
    // V-neck collar showing skin
    ctx.fillStyle = '#db9c6d';
    ctx.fillRect(6, 0, 4, 3);
    ctx.fillRect(7, 3, 2, 2);
  });

  // Shirt Back (+Z) and sides
  const shirtBackTex = makeCanvas((ctx) => {
    ctx.fillStyle = '#00a8a8';
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = '#008585';
    ctx.fillRect(0, 0, 2, 16);
    ctx.fillRect(14, 0, 2, 16);
    ctx.fillRect(0, 14, 16, 2);
  });

  // Legs: blue denim with boots at bottom (y >= 12)
  const legTex = makeCanvas((ctx) => {
    ctx.fillStyle = '#2b388f';
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = '#212a6e';
    ctx.fillRect(0, 0, 2, 16);
    ctx.fillRect(14, 0, 2, 16);
    // Dark grey shoes at bottom
    ctx.fillStyle = '#3a3a3a';
    ctx.fillRect(0, 12, 16, 4);
    ctx.fillStyle = '#222222';
    ctx.fillRect(0, 14, 16, 2);
  });

  // Arms: skin tone with cyan shoulder sleeve (y < 5)
  const armTex = makeCanvas((ctx) => {
    ctx.fillStyle = '#db9c6d';
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = '#00a8a8';
    ctx.fillRect(0, 0, 16, 5);
    ctx.fillStyle = '#008585';
    ctx.fillRect(0, 4, 16, 1);
  });

  if (!faceTex || !hairTex || !shirtFrontTex || !shirtBackTex || !legTex || !armTex) {
    return null;
  }

  return { faceTex, hairTex, shirtFrontTex, shirtBackTex, legTex, armTex };
}

export function PlayerModel({ isMoving = false }: PlayerModelProps) {
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);

  const qualityTier = useGame((s) => s.qualityTier);
  const castShadow = qualityTier === 'high';

  const tex = useMemo(() => createSteveTextures(), []);

  // Multi-face materials for head and torso
  const headMaterials = useMemo(() => {
    if (!tex) return null;
    const mHair = new THREE.MeshStandardMaterial({ map: tex.hairTex, roughness: 0.8 });
    const mFace = new THREE.MeshStandardMaterial({ map: tex.faceTex, roughness: 0.8 });
    // Three.js BoxGeometry material slots: [+X, -X, +Y, -Y, +Z (Front), -Z (Back)]
    return [mHair, mHair, mHair, mHair, mFace, mHair];
  }, [tex]);

  const torsoMaterials = useMemo(() => {
    if (!tex) return null;
    const mShirtBack = new THREE.MeshStandardMaterial({ map: tex.shirtBackTex, roughness: 0.7 });
    const mShirtFront = new THREE.MeshStandardMaterial({ map: tex.shirtFrontTex, roughness: 0.7 });
    // Three.js BoxGeometry material slots: [+X, -X, +Y, -Y, +Z (Front), -Z (Back)]
    return [mShirtBack, mShirtBack, mShirtBack, mShirtBack, mShirtFront, mShirtBack];
  }, [tex]);

  const legMaterial = useMemo(() => {
    if (!tex) return null;
    return new THREE.MeshStandardMaterial({ map: tex.legTex, roughness: 0.8 });
  }, [tex]);

  const armMaterial = useMemo(() => {
    if (!tex) return null;
    return new THREE.MeshStandardMaterial({ map: tex.armTex, roughness: 0.8 });
  }, [tex]);

  useEffect(() => {
    return () => {
      if (tex) {
        tex.faceTex.dispose();
        tex.hairTex.dispose();
        tex.shirtFrontTex.dispose();
        tex.shirtBackTex.dispose();
        tex.legTex.dispose();
        tex.armTex.dispose();
      }
      headMaterials?.forEach((m) => m.dispose());
      torsoMaterials?.forEach((m) => m.dispose());
      legMaterial?.dispose();
      armMaterial?.dispose();
    };
  }, [tex, headMaterials, torsoMaterials, legMaterial, armMaterial]);

  useFrame((state) => {
    if (isMoving) {
      const t = state.clock.getElapsedTime() * 18;
      const angle = Math.sin(t) * 0.7;

      if (leftLegRef.current) leftLegRef.current.rotation.x = angle;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -angle;
      if (leftArmRef.current) leftArmRef.current.rotation.x = -angle;
      if (rightArmRef.current) rightArmRef.current.rotation.x = angle;
    } else {
      if (leftLegRef.current) leftLegRef.current.rotation.x = 0;
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
      if (leftArmRef.current) leftArmRef.current.rotation.x = 0;
      if (rightArmRef.current) rightArmRef.current.rotation.x = 0;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Head: 0.46 cube, resting on shoulders (from y = 0.50 to 0.96) */}
      <mesh
        position={[0, 0.73, 0]}
        castShadow={castShadow}
        material={headMaterials || undefined}
      >
        <boxGeometry args={[0.46, 0.46, 0.46]} />
        {!headMaterials && (
          <meshStandardMaterial color="#db9c6d" roughness={0.8} />
        )}
      </mesh>

      {/* Hair / Cap Brim */}
      <mesh position={[0, 0.88, 0]} castShadow={castShadow}>
        <boxGeometry args={[0.48, 0.18, 0.48]} />
        <meshStandardMaterial color="#4a2f1b" roughness={0.9} />
      </mesh>

      {/* Torso: 0.44w x 0.65h x 0.24d (from y = -0.15 to 0.50) */}
      <mesh
        position={[0, 0.175, 0]}
        castShadow={castShadow}
        material={torsoMaterials || undefined}
      >
        <boxGeometry args={[0.44, 0.65, 0.24]} />
        {!torsoMaterials && (
          <meshStandardMaterial color="#00a8a8" roughness={0.7} />
        )}
      </mesh>

      {/* Left Arm: Pivot at shoulder y = 0.42 */}
      <group ref={leftArmRef} position={[-0.31, 0.42, 0]}>
        <mesh
          position={[0, -0.275, 0]}
          castShadow={castShadow}
          material={armMaterial || undefined}
        >
          <boxGeometry args={[0.18, 0.65, 0.18]} />
          {!armMaterial && (
            <meshStandardMaterial color="#db9c6d" roughness={0.8} />
          )}
        </mesh>
      </group>

      {/* Right Arm: Pivot at shoulder y = 0.42 */}
      <group ref={rightArmRef} position={[0.31, 0.42, 0]}>
        <mesh
          position={[0, -0.275, 0]}
          castShadow={castShadow}
          material={armMaterial || undefined}
        >
          <boxGeometry args={[0.18, 0.65, 0.18]} />
          {!armMaterial && (
            <meshStandardMaterial color="#db9c6d" roughness={0.8} />
          )}
        </mesh>
      </group>

      {/* Left Leg: Pivot at hip y = -0.15, extends down to y = -0.80 (bottom of capsule!) */}
      <group ref={leftLegRef} position={[-0.11, -0.15, 0]}>
        <mesh
          position={[0, -0.325, 0]}
          castShadow={castShadow}
          material={legMaterial || undefined}
        >
          <boxGeometry args={[0.19, 0.65, 0.19]} />
          {!legMaterial && (
            <meshStandardMaterial color="#2b388f" roughness={0.8} />
          )}
        </mesh>
      </group>

      {/* Right Leg: Pivot at hip y = -0.15, extends down to y = -0.80 */}
      <group ref={rightLegRef} position={[0.11, -0.15, 0]}>
        <mesh
          position={[0, -0.325, 0]}
          castShadow={castShadow}
          material={legMaterial || undefined}
        >
          <boxGeometry args={[0.19, 0.65, 0.19]} />
          {!legMaterial && (
            <meshStandardMaterial color="#2b388f" roughness={0.8} />
          )}
        </mesh>
      </group>
    </group>
  );
}
