'use client';

import React, { useRef, useState } from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { RigidBody, CylinderCollider } from '@react-three/rapier';
import { Station as StationType } from '@/content/stations';
import { useGame, SectionId } from '@/lib/store';
import { StationModel } from './StationModels';

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
  const pointerDownPos = useRef<{ x: number; y: number } | null>(null);

  return (
    <group position={station.position} name={`station-${station.id}`}>
      {/* 3D Handcrafted Minecraft Structure (Portal renders its own obsidian gate) */}
      {station.id !== 'register' && (
        <group
          position={[0, 0, 0]}
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
          <StationModel
            stationId={station.id}
            isNearby={isNearby}
            hovered={hovered}
          />

          {/* Floating Accent Ring on Hover or Proximity */}
          {(isNearby || hovered) && (
            <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[1.4, 1.55, 32]} />
              <meshBasicMaterial color="#ffb46b" side={THREE.DoubleSide} transparent opacity={0.8} />
            </mesh>
          )}
        </group>
      )}

      {/* 3D Pixel Nameplate */}
      <Html
        position={[0, station.id === 'register' ? 3.6 : 3.2, 0]}
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
