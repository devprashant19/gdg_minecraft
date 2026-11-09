'use client';

import React, { useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { RigidBody, CylinderCollider } from '@react-three/rapier';
import { Station as StationType } from '@/content/stations';
import { useGame, SectionId } from '@/lib/store';

interface StationProps {
  station: StationType;
}

export function Station({ station }: StationProps) {
  const [hovered, setHovered] = useState(false);
  const enterZone = useGame((s) => s.enterZone);
  const leaveZone = useGame((s) => s.leaveZone);
  const open = useGame((s) => s.open);
  const nearbyStation = useGame((s) => s.nearbyStation);

  const isNearby = nearbyStation === station.id;
  const meshRef = useRef<THREE.Group>(null);
  const pointerDownPos = useRef<{ x: number; y: number } | null>(null);

  useFrame((state) => {
    if (meshRef.current) {
      if (isNearby || hovered) {
        meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.8;
      }
    }
  });

  const getStationColor = () => {
    switch (station.id) {
      case 'welcome':
        return '#8b5a2b';
      case 'tracks':
        return '#3b82f6';
      case 'schedule':
        return '#f59e0b';
      case 'prizes':
        return '#eab308';
      case 'sponsors':
        return '#10b981';
      case 'team':
        return '#ec4899';
      case 'faq':
        return '#8b5cf6';
      case 'venue':
        return '#06b6d4';
      case 'register':
        return '#a855f7';
      default:
        return '#5b8c32';
    }
  };

  return (
    <group position={station.position} name={`station-${station.id}`}>
      {/* 3D Interactive Station Model */}
      <group
        ref={meshRef}
        position={[0, 0.75, 0]}
        onPointerDown={(e) => {
          pointerDownPos.current = { x: e.clientX, y: e.clientY };
        }}
        onPointerUp={(e) => {
          if (pointerDownPos.current) {
            const dist = Math.hypot(
              e.clientX - pointerDownPos.current.x,
              e.clientY - pointerDownPos.current.y
            );
            if (dist <= 6) {
              open(station.id as SectionId);
            }
          }
          pointerDownPos.current = null;
        }}
        onPointerOver={() => {
          document.body.style.cursor = 'pointer';
          setHovered(true);
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'default';
          setHovered(false);
        }}
      >
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.9, 0.9, 0.9]} />
          <meshStandardMaterial
            color={getStationColor()}
            emissive={isNearby ? '#ffb46b' : hovered ? '#ffd285' : '#111111'}
            emissiveIntensity={isNearby ? 0.7 : hovered ? 0.45 : 0.05}
            roughness={0.3}
          />
        </mesh>
        {/* Floating Accent Ring */}
        {(isNearby || hovered) && (
          <mesh position={[0, 0.7, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.55, 0.65, 16]} />
            <meshBasicMaterial color="#ffb46b" side={THREE.DoubleSide} />
          </mesh>
        )}
      </group>

      {/* 3D Pixel Nameplate */}
      <Html
        position={[0, 2.3, 0]}
        center
        distanceFactor={14}
        occlude
        aria-hidden="true"
        className="pointer-events-none select-none"
      >
        <div
          className={`px-2.5 py-1 font-pixel text-[10px] rounded shadow-lg whitespace-nowrap bevel transition-all ${
            isNearby
              ? 'bg-[#ffb46b] text-black border-2 border-white scale-110'
              : 'bg-black/85 text-white border border-[#e5b83b]'
          }`}
        >
          {station.label}
        </div>
      </Html>

      {/* Sensor Zone (CylinderCollider) */}
      <RigidBody type="fixed" colliders={false}>
        <CylinderCollider
          sensor
          args={[2.5, station.radius]}
          onIntersectionEnter={({ other }) => {
            if (other.rigidBodyObject?.name === 'player') {
              enterZone(station.id as SectionId);
            }
          }}
          onIntersectionExit={({ other }) => {
            if (other.rigidBodyObject?.name === 'player') {
              leaveZone(station.id as SectionId);
            }
          }}
        />
      </RigidBody>
    </group>
  );
}
