'use client';

import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useGame } from '@/lib/store';

interface PlayerModelProps {
  isMoving?: boolean;
}

export function PlayerModel({ isMoving = false }: PlayerModelProps) {
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);

  const qualityTier = useGame((s) => s.qualityTier);
  const castShadow = qualityTier === 'high';

  useFrame((state) => {
    if (isMoving) {
      const t = state.clock.getElapsedTime() * 10;
      const angle = Math.sin(t) * 0.6;

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
    <group position={[0, -0.75, 0]}>
      {/* Head */}
      <mesh position={[0, 1.45, 0]} castShadow={castShadow}>
        <boxGeometry args={[0.38, 0.38, 0.38]} />
        <meshStandardMaterial color="#e0a97a" roughness={0.7} />
      </mesh>

      {/* Hair / Cap */}
      <mesh position={[0, 1.55, 0]} castShadow={castShadow}>
        <boxGeometry args={[0.4, 0.2, 0.4]} />
        <meshStandardMaterial color="#453322" roughness={0.9} />
      </mesh>

      {/* Torso */}
      <mesh position={[0, 0.95, 0]} castShadow={castShadow}>
        <boxGeometry args={[0.38, 0.55, 0.22]} />
        <meshStandardMaterial color="#41a85f" roughness={0.6} />
      </mesh>

      {/* Left Arm */}
      <group ref={leftArmRef} position={[-0.28, 1.15, 0]}>
        <mesh position={[0, -0.22, 0]} castShadow={castShadow}>
          <boxGeometry args={[0.16, 0.5, 0.16]} />
          <meshStandardMaterial color="#e0a97a" roughness={0.7} />
        </mesh>
      </group>

      {/* Right Arm */}
      <group ref={rightArmRef} position={[0.28, 1.15, 0]}>
        <mesh position={[0, -0.22, 0]} castShadow={castShadow}>
          <boxGeometry args={[0.16, 0.5, 0.16]} />
          <meshStandardMaterial color="#e0a97a" roughness={0.7} />
        </mesh>
      </group>

      {/* Left Leg */}
      <group ref={leftLegRef} position={[-0.1, 0.65, 0]}>
        <mesh position={[0, -0.25, 0]} castShadow={castShadow}>
          <boxGeometry args={[0.16, 0.55, 0.16]} />
          <meshStandardMaterial color="#2d4571" roughness={0.8} />
        </mesh>
      </group>

      {/* Right Leg */}
      <group ref={rightLegRef} position={[0.1, 0.65, 0]}>
        <mesh position={[0, -0.25, 0]} castShadow={castShadow}>
          <boxGeometry args={[0.16, 0.55, 0.16]} />
          <meshStandardMaterial color="#2d4571" roughness={0.8} />
        </mesh>
      </group>
    </group>
  );
}
