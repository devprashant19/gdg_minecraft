'use client';

import React, { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface StationModelProps {
  stationId: string;
  isNearby: boolean;
  hovered: boolean;
}

/**
 * Procedural Minecraft-styled 3D structures for each hackathon station.
 * Zero external asset dependencies — built with authentic voxel proportions,
 * warm lighting, and animated props (ticking clock, floating spellbook, campfire flames, beacon beam).
 */
export function StationModel({ stationId, isNearby, hovered }: StationModelProps) {
  const highlight = isNearby || hovered;

  switch (stationId) {
    case 'welcome':
      return <WelcomeOutpost highlight={highlight} />;
    case 'tracks':
      return <BlacksmithWorkshop highlight={highlight} />;
    case 'schedule':
      return <ClocktowerPavilion highlight={highlight} />;
    case 'prizes':
      return <TreasureVault highlight={highlight} />;
    case 'sponsors':
      return <TechBeaconPavilion highlight={highlight} />;
    case 'team':
      return <AdventurerCampfire highlight={highlight} />;
    case 'faq':
      return <ArcaneLibrary highlight={highlight} />;
    case 'venue':
      return <CartographerOverlook highlight={highlight} />;
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// 1. Welcome Station: Rustic Timber Outpost & Visitor Info Desk
// ---------------------------------------------------------------------------
function WelcomeOutpost({ highlight }: { highlight: boolean }) {
  const lanternRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    if (lanternRef.current) {
      // Gentle lantern flicker
      const t = clock.getElapsedTime() * 6;
      lanternRef.current.intensity = 1.2 + Math.sin(t) * 0.15 + Math.cos(t * 1.7) * 0.1;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* 4 Oak Log Pillars */}
      <mesh position={[-1.2, 1.1, -1.0]} castShadow>
        <boxGeometry args={[0.3, 2.2, 0.3]} />
        <meshStandardMaterial color="#5c452e" roughness={0.9} />
      </mesh>
      <mesh position={[1.2, 1.1, -1.0]} castShadow>
        <boxGeometry args={[0.3, 2.2, 0.3]} />
        <meshStandardMaterial color="#5c452e" roughness={0.9} />
      </mesh>
      <mesh position={[-1.2, 1.1, 1.0]} castShadow>
        <boxGeometry args={[0.3, 2.2, 0.3]} />
        <meshStandardMaterial color="#5c452e" roughness={0.9} />
      </mesh>
      <mesh position={[1.2, 1.1, 1.0]} castShadow>
        <boxGeometry args={[0.3, 2.2, 0.3]} />
        <meshStandardMaterial color="#5c452e" roughness={0.9} />
      </mesh>

      {/* Crossbeams */}
      <mesh position={[0, 2.1, -1.0]} castShadow>
        <boxGeometry args={[2.7, 0.25, 0.25]} />
        <meshStandardMaterial color="#7a5c3e" roughness={0.8} />
      </mesh>
      <mesh position={[0, 2.1, 1.0]} castShadow>
        <boxGeometry args={[2.7, 0.25, 0.25]} />
        <meshStandardMaterial color="#7a5c3e" roughness={0.8} />
      </mesh>

      {/* Pitched Awning Roof (Spruce Planks with Red & Cream Trim) */}
      <mesh position={[0, 2.35, 0]} castShadow>
        <boxGeometry args={[2.9, 0.2, 2.5]} />
        <meshStandardMaterial color="#8b5a2b" roughness={0.7} />
      </mesh>
      <mesh position={[0, 2.45, 0]} castShadow>
        <boxGeometry args={[2.7, 0.15, 2.3]} />
        <meshStandardMaterial color="#a67c4f" roughness={0.7} />
      </mesh>

      {/* Front Awning Fringe */}
      <mesh position={[0, 2.2, 1.25]} castShadow>
        <boxGeometry args={[2.9, 0.2, 0.1]} />
        <meshStandardMaterial color="#b71c1c" roughness={0.6} />
      </mesh>

      {/* Wooden Visitor Desk Counter */}
      <mesh position={[0, 0.5, 0.2]} castShadow receiveShadow>
        <boxGeometry args={[1.8, 1.0, 0.8]} />
        <meshStandardMaterial color="#a67c4f" roughness={0.75} />
      </mesh>

      {/* Open Quest Book on Desk */}
      <group position={[-0.35, 1.06, 0.2]} rotation={[0.1, 0.2, 0]}>
        <mesh castShadow>
          <boxGeometry args={[0.42, 0.04, 0.32]} />
          <meshStandardMaterial color="#4a2f1b" roughness={0.8} />
        </mesh>
        <mesh position={[-0.1, 0.03, 0]} rotation={[0, 0, 0.08]}>
          <boxGeometry args={[0.2, 0.02, 0.3]} />
          <meshStandardMaterial color="#fffbe6" roughness={0.5} />
        </mesh>
        <mesh position={[0.1, 0.03, 0]} rotation={[0, 0, -0.08]}>
          <boxGeometry args={[0.2, 0.02, 0.3]} />
          <meshStandardMaterial color="#fffbe6" roughness={0.5} />
        </mesh>
      </group>

      {/* Inkwell and Feather */}
      <mesh position={[0.4, 1.05, 0.3]}>
        <cylinderGeometry args={[0.06, 0.07, 0.1, 8]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.4} />
      </mesh>
      <mesh position={[0.42, 1.18, 0.3]} rotation={[0.2, 0, 0.2]}>
        <coneGeometry args={[0.025, 0.2, 4]} />
        <meshStandardMaterial color="#ffffff" roughness={0.3} />
      </mesh>

      {/* Hanging Lantern */}
      <group position={[0, 1.85, 0]}>
        <mesh position={[0, 0.12, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.25, 6]} />
          <meshStandardMaterial color="#2d3436" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[0, -0.05, 0]}>
          <boxGeometry args={[0.22, 0.26, 0.22]} />
          <meshStandardMaterial
            color="#2d3436"
            metalness={0.7}
            roughness={0.3}
          />
        </mesh>
        <mesh position={[0, -0.05, 0]}>
          <boxGeometry args={[0.16, 0.2, 0.16]} />
          <meshStandardMaterial
            color="#ffeaa7"
            emissive="#ffb142"
            emissiveIntensity={highlight ? 2.5 : 1.8}
            roughness={0.1}
          />
        </mesh>
        <pointLight
          ref={lanternRef}
          color="#ffb444"
          distance={8}
          decay={2}
          intensity={1.4}
        />
      </group>

      {/* Wooden Signpost at Corner */}
      <group position={[1.4, 0, 1.2]} rotation={[0, -0.3, 0]}>
        <mesh position={[0, 0.6, 0]} castShadow>
          <boxGeometry args={[0.12, 1.2, 0.12]} />
          <meshStandardMaterial color="#5c452e" roughness={0.9} />
        </mesh>
        <mesh position={[-0.25, 1.05, 0]} castShadow>
          <boxGeometry args={[0.6, 0.2, 0.04]} />
          <meshStandardMaterial color="#d4a373" roughness={0.7} />
        </mesh>
        <mesh position={[0.25, 0.75, 0]} castShadow>
          <boxGeometry args={[0.55, 0.18, 0.04]} />
          <meshStandardMaterial color="#d4a373" roughness={0.7} />
        </mesh>
      </group>
    </group>
  );
}

// ---------------------------------------------------------------------------
// 2. Tracks Station: Blacksmith Workshop & Armory
// ---------------------------------------------------------------------------
function BlacksmithWorkshop({ highlight }: { highlight: boolean }) {
  const fireRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    if (fireRef.current) {
      const t = clock.getElapsedTime() * 12;
      fireRef.current.intensity = 2.0 + Math.sin(t) * 0.4 + Math.cos(t * 2.3) * 0.25;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Stone Blast Furnace Hearth */}
      <mesh position={[-0.9, 0.8, -0.2]} castShadow receiveShadow>
        <boxGeometry args={[1.3, 1.6, 1.3]} />
        <meshStandardMaterial color="#636e72" roughness={0.9} />
      </mesh>
      {/* Chimney */}
      <mesh position={[-0.9, 1.9, -0.2]} castShadow>
        <boxGeometry args={[0.7, 0.8, 0.7]} />
        <meshStandardMaterial color="#4a4f52" roughness={0.9} />
      </mesh>
      {/* Glowing Fire Hearth Chamber */}
      <mesh position={[-0.9, 0.5, 0.46]}>
        <planeGeometry args={[0.65, 0.55]} />
        <meshStandardMaterial
          color="#ff793f"
          emissive="#ff5500"
          emissiveIntensity={highlight ? 3.0 : 2.2}
          roughness={0.2}
        />
      </mesh>
      <pointLight
        ref={fireRef}
        position={[-0.9, 0.6, 0.7]}
        color="#ff7700"
        distance={7}
        decay={2}
        intensity={2.2}
      />

      {/* Solid Iron Anvil */}
      <group position={[0.4, 0, 0.3]} rotation={[0, 0.4, 0]}>
        {/* Oak Log Base Stump */}
        <mesh position={[0, 0.25, 0]} castShadow>
          <cylinderGeometry args={[0.35, 0.38, 0.5, 8]} />
          <meshStandardMaterial color="#5c452e" roughness={0.9} />
        </mesh>
        {/* Anvil Base Foot */}
        <mesh position={[0, 0.55, 0]} castShadow>
          <boxGeometry args={[0.5, 0.12, 0.3]} />
          <meshStandardMaterial color="#2d3436" metalness={0.85} roughness={0.35} />
        </mesh>
        {/* Anvil Waist */}
        <mesh position={[0, 0.68, 0]} castShadow>
          <boxGeometry args={[0.24, 0.16, 0.18]} />
          <meshStandardMaterial color="#2d3436" metalness={0.85} roughness={0.35} />
        </mesh>
        {/* Anvil Face & Horn */}
        <mesh position={[-0.05, 0.82, 0]} castShadow>
          <boxGeometry args={[0.6, 0.16, 0.28]} />
          <meshStandardMaterial color="#3d4447" metalness={0.9} roughness={0.25} />
        </mesh>
        <mesh position={[0.32, 0.82, 0]} rotation={[0, 0, -Math.PI / 2]} castShadow>
          <coneGeometry args={[0.13, 0.25, 4]} />
          <meshStandardMaterial color="#3d4447" metalness={0.9} roughness={0.25} />
        </mesh>
      </group>

      {/* Armor Stand equipped with Diamond Chestplate */}
      <group position={[1.1, 0, -0.6]} rotation={[0, -0.5, 0]}>
        {/* Stone Slab Base */}
        <mesh position={[0, 0.05, 0]} castShadow>
          <boxGeometry args={[0.6, 0.1, 0.6]} />
          <meshStandardMaterial color="#7f8c8d" roughness={0.8} />
        </mesh>
        {/* Wooden Support Sticks */}
        <mesh position={[0, 0.6, 0]} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 1.1, 6]} />
          <meshStandardMaterial color="#a67c4f" roughness={0.7} />
        </mesh>
        {/* Diamond Chestplate */}
        <mesh position={[0, 0.95, 0]} castShadow>
          <boxGeometry args={[0.48, 0.62, 0.28]} />
          <meshStandardMaterial
            color="#00cec9"
            emissive="#00b894"
            emissiveIntensity={highlight ? 0.7 : 0.3}
            roughness={0.2}
            metalness={0.6}
          />
        </mesh>
        {/* Diamond Helmet */}
        <mesh position={[0, 1.45, 0]} castShadow>
          <boxGeometry args={[0.38, 0.36, 0.38]} />
          <meshStandardMaterial
            color="#00cec9"
            emissive="#00b894"
            emissiveIntensity={highlight ? 0.7 : 0.3}
            roughness={0.2}
            metalness={0.6}
          />
        </mesh>
      </group>
    </group>
  );
}

// ---------------------------------------------------------------------------
// 3. Schedule Station: Clocktower Pavilion
// ---------------------------------------------------------------------------
function ClocktowerPavilion({ highlight }: { highlight: boolean }) {
  const minuteHandRef = useRef<THREE.Mesh>(null);
  const bellRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (minuteHandRef.current) {
      minuteHandRef.current.rotation.z = -t * 1.5;
    }
    if (bellRef.current) {
      bellRef.current.rotation.z = Math.sin(t * 2.5) * 0.12;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Cobblestone Foundation */}
      <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.4, 0.6, 2.4]} />
        <meshStandardMaterial color="#636e72" roughness={0.9} />
      </mesh>

      {/* 4 Timber Corner Pillars */}
      {([-0.9, 0.9] as const).map((x) =>
        ([-0.9, 0.9] as const).map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 1.7, z]} castShadow>
            <boxGeometry args={[0.3, 2.3, 0.3]} />
            <meshStandardMaterial color="#5c452e" roughness={0.8} />
          </mesh>
        ))
      )}

      {/* Upper Clock Housing Box */}
      <mesh position={[0, 2.8, 0]} castShadow>
        <boxGeometry args={[2.2, 1.3, 2.2]} />
        <meshStandardMaterial color="#8b5a2b" roughness={0.7} />
      </mesh>

      {/* Analog Clock Face on Front */}
      <group position={[0, 2.8, 1.12]}>
        {/* Bezel Ring */}
        <mesh>
          <cylinderGeometry args={[0.48, 0.48, 0.05, 16]} />
          <meshStandardMaterial color="#d4af37" metalness={0.8} roughness={0.3} />
        </mesh>
        {/* White Dial */}
        <mesh position={[0, 0, 0.03]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.42, 16]} />
          <meshStandardMaterial color="#f5f6fa" roughness={0.4} />
        </mesh>
        {/* Hour Hand */}
        <mesh position={[0, 0.08, 0.04]} rotation={[0, 0, -0.8]}>
          <boxGeometry args={[0.04, 0.22, 0.01]} />
          <meshStandardMaterial color="#1e272e" />
        </mesh>
        {/* Animated Minute Hand */}
        <mesh ref={minuteHandRef} position={[0, 0, 0.045]}>
          <boxGeometry args={[0.03, 0.32, 0.01]} />
          <meshStandardMaterial color="#e74c3c" />
        </mesh>
      </group>

      {/* Pyramidal Shingle Roof */}
      <mesh position={[0, 3.8, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[1.8, 1.4, 4]} />
        <meshStandardMaterial color="#a67c4f" roughness={0.8} />
      </mesh>

      {/* Hanging Brass Town Bell inside pavilion */}
      <group ref={bellRef} position={[0, 2.1, 0]}>
        <mesh position={[0, 0.1, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.2, 6]} />
          <meshStandardMaterial color="#2d3436" metalness={0.9} />
        </mesh>
        <mesh position={[0, -0.08, 0]}>
          <coneGeometry args={[0.22, 0.28, 8]} />
          <meshStandardMaterial
            color="#f1c40f"
            metalness={0.85}
            roughness={0.25}
            emissive={highlight ? '#f39c12' : '#000000'}
            emissiveIntensity={highlight ? 0.4 : 0}
          />
        </mesh>
      </group>

      {/* Timetable Noticeboard on Left */}
      <group position={[-1.25, 1.0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <mesh castShadow>
          <boxGeometry args={[1.2, 0.9, 0.08]} />
          <meshStandardMaterial color="#7a5c3e" roughness={0.8} />
        </mesh>
        <mesh position={[-0.25, 0.05, 0.05]}>
          <planeGeometry args={[0.42, 0.65]} />
          <meshStandardMaterial color="#fdfbf7" roughness={0.6} />
        </mesh>
        <mesh position={[0.25, -0.05, 0.05]}>
          <planeGeometry args={[0.42, 0.55]} />
          <meshStandardMaterial color="#fffbe6" roughness={0.6} />
        </mesh>
      </group>
    </group>
  );
}

// ---------------------------------------------------------------------------
// 4. Prizes Station: Hall of Champions & Treasure Vault
// ---------------------------------------------------------------------------
function TreasureVault({ highlight }: { highlight: boolean }) {
  const trophyRef = useRef<THREE.Group>(null);
  const sparklesRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (trophyRef.current) {
      trophyRef.current.position.y = 1.35 + Math.sin(t * 2) * 0.06;
      trophyRef.current.rotation.y = t * 1.2;
    }
    if (sparklesRef.current) {
      sparklesRef.current.rotation.y = -t * 0.8;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Stone Dais with Crimson Carpet */}
      <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.8, 0.4, 2.8]} />
        <meshStandardMaterial color="#636e72" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.41, 0]}>
        <boxGeometry args={[1.6, 0.04, 2.7]} />
        <meshStandardMaterial color="#b71540" roughness={0.8} />
      </mesh>

      {/* Gold Pedestal Plinth */}
      <mesh position={[0, 0.75, -0.4]} castShadow>
        <boxGeometry args={[0.9, 0.7, 0.9]} />
        <meshStandardMaterial
          color="#f39c12"
          metalness={0.85}
          roughness={0.25}
          emissive="#d35400"
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* Floating Rotating Championship Trophy */}
      <group ref={trophyRef} position={[0, 1.35, -0.4]}>
        {/* Trophy Cup Base */}
        <mesh position={[0, -0.15, 0]} castShadow>
          <cylinderGeometry args={[0.12, 0.18, 0.08, 8]} />
          <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Trophy Stem */}
        <mesh position={[0, -0.05, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.14, 8]} />
          <meshStandardMaterial color="#ffd700" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Trophy Cup Body */}
        <mesh position={[0, 0.15, 0]} castShadow>
          <cylinderGeometry args={[0.22, 0.12, 0.28, 8]} />
          <meshStandardMaterial
            color="#ffd700"
            metalness={0.95}
            roughness={0.15}
            emissive="#f1c40f"
            emissiveIntensity={highlight ? 0.6 : 0.25}
          />
        </mesh>
        {/* Diamond Gem in Trophy Center */}
        <mesh position={[0, 0.18, 0]}>
          <octahedronGeometry args={[0.1]} />
          <meshStandardMaterial
            color="#00ffff"
            emissive="#00cec9"
            emissiveIntensity={1.8}
            roughness={0.1}
          />
        </mesh>
      </group>

      {/* Orbiting Trophy Sparkles */}
      <group ref={sparklesRef} position={[0, 1.35, -0.4]}>
        <mesh position={[0.4, 0.1, 0]}>
          <octahedronGeometry args={[0.04]} />
          <meshStandardMaterial color="#ffd700" emissive="#ffffff" emissiveIntensity={2} />
        </mesh>
        <mesh position={[-0.35, -0.08, 0.2]}>
          <octahedronGeometry args={[0.035]} />
          <meshStandardMaterial color="#00ffff" emissive="#00ffff" emissiveIntensity={2} />
        </mesh>
        <mesh position={[0.1, 0.25, -0.35]}>
          <octahedronGeometry args={[0.04]} />
          <meshStandardMaterial color="#2ecc71" emissive="#2ecc71" emissiveIntensity={2} />
        </mesh>
      </group>

      {/* Double Treasure Chest on Right */}
      <group position={[0.9, 0.42, 0.4]} rotation={[0, -0.4, 0]}>
        {/* Chest Body */}
        <mesh position={[0, 0.28, 0]} castShadow>
          <boxGeometry args={[0.9, 0.55, 0.6]} />
          <meshStandardMaterial color="#8b5a2b" roughness={0.7} />
        </mesh>
        {/* Gold Corner Straps */}
        <mesh position={[0, 0.28, 0]}>
          <boxGeometry args={[0.92, 0.1, 0.62]} />
          <meshStandardMaterial color="#f1c40f" metalness={0.8} roughness={0.3} />
        </mesh>
        {/* Gold Latch */}
        <mesh position={[0, 0.38, 0.32]}>
          <boxGeometry args={[0.12, 0.14, 0.06]} />
          <meshStandardMaterial color="#f39c12" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Propped Lid emitting gold light */}
        <mesh position={[0, 0.62, -0.05]} rotation={[-0.3, 0, 0]} castShadow>
          <boxGeometry args={[0.92, 0.16, 0.62]} />
          <meshStandardMaterial color="#8b5a2b" roughness={0.7} />
        </mesh>
        <pointLight color="#f39c12" intensity={1.5} distance={4} decay={2} position={[0, 0.6, 0]} />
      </group>

      {/* Emerald Display Pedestal on Left */}
      <group position={[-0.9, 0.42, 0.4]} rotation={[0, 0.4, 0]}>
        <mesh position={[0, 0.3, 0]} castShadow>
          <boxGeometry args={[0.6, 0.6, 0.6]} />
          <meshStandardMaterial color="#2f3640" roughness={0.8} />
        </mesh>
        {/* Glowing Emerald Clusters */}
        <mesh position={[0, 0.72, 0]}>
          <octahedronGeometry args={[0.16]} />
          <meshStandardMaterial
            color="#2ecc71"
            emissive="#27ae60"
            emissiveIntensity={highlight ? 2.2 : 1.4}
            roughness={0.15}
          />
        </mesh>
      </group>
    </group>
  );
}

// ---------------------------------------------------------------------------
// 5. Sponsors Station: Tech Beacon Pavilion
// ---------------------------------------------------------------------------
function TechBeaconPavilion({ highlight }: { highlight: boolean }) {
  const beamRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (beamRef.current) {
      const mat = beamRef.current.material as THREE.MeshStandardMaterial;
      mat.opacity = 0.55 + Math.sin(t * 4) * 0.15;
    }
    if (ringRef.current) {
      ringRef.current.rotation.y = t * 0.9;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Polished Quartz Base Dais */}
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.8, 0.5, 2.8]} />
        <meshStandardMaterial color="#f5f6fa" roughness={0.3} metalness={0.1} />
      </mesh>

      {/* Lapis Lazuli Inlay Border */}
      <mesh position={[0, 0.51, 0]}>
        <boxGeometry args={[2.4, 0.02, 2.4]} />
        <meshStandardMaterial color="#0984e3" roughness={0.4} />
      </mesh>

      {/* 4 Quartz Pillars */}
      {([-1.0, 1.0] as const).map((x) =>
        ([-1.0, 1.0] as const).map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 1.6, z]} castShadow>
            <boxGeometry args={[0.35, 2.2, 0.35]} />
            <meshStandardMaterial color="#ffffff" roughness={0.2} metalness={0.1} />
          </mesh>
        ))
      )}

      {/* Quartz Arch Canopy */}
      <mesh position={[0, 2.8, 0]} castShadow>
        <boxGeometry args={[2.6, 0.25, 2.6]} />
        <meshStandardMaterial color="#f5f6fa" roughness={0.3} />
      </mesh>

      {/* Central Nether Beacon Base (Obsidian & Diamond Block) */}
      <mesh position={[0, 0.75, 0]} castShadow>
        <boxGeometry args={[0.9, 0.45, 0.9]} />
        <meshStandardMaterial color="#192a56" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Beacon Crystal Core */}
      <mesh position={[0, 1.15, 0]}>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial
          color="#00cec9"
          emissive="#81ecec"
          emissiveIntensity={highlight ? 2.5 : 1.8}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>

      {/* Holographic Vertical Light Beam pulsing into the sky */}
      <mesh ref={beamRef} position={[0, 8.0, 0]}>
        <cylinderGeometry args={[0.16, 0.16, 14, 16]} />
        <meshStandardMaterial
          color="#74b9ff"
          emissive="#0984e3"
          emissiveIntensity={3.0}
          transparent
          opacity={0.65}
          depthWrite={false}
        />
      </mesh>

      {/* Floating Holographic Ring around the beam */}
      <group ref={ringRef} position={[0, 1.6, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.7, 0.03, 8, 24]} />
          <meshStandardMaterial
            color="#00cec9"
            emissive="#81ecec"
            emissiveIntensity={2.0}
            transparent
            opacity={0.8}
          />
        </mesh>
      </group>

      <pointLight color="#74b9ff" intensity={2.2} distance={9} decay={2} position={[0, 1.8, 0]} />
    </group>
  );
}

// ---------------------------------------------------------------------------
// 6. Team Station: Adventurer Campfire Circle
// ---------------------------------------------------------------------------
function AdventurerCampfire({ highlight }: { highlight: boolean }) {
  const fireRef = useRef<THREE.PointLight>(null);
  const flameGroupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * 10;
    if (fireRef.current) {
      fireRef.current.intensity = 2.2 + Math.sin(t) * 0.5 + Math.cos(t * 1.9) * 0.3;
    }
    if (flameGroupRef.current) {
      flameGroupRef.current.scale.y = 1.0 + Math.sin(t * 1.5) * 0.18;
      flameGroupRef.current.rotation.y = t * 0.2;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Stone Firepit Ring */}
      <mesh position={[0, 0.12, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.8, 0.85, 0.24, 12]} />
        <meshStandardMaterial color="#636e72" roughness={0.95} />
      </mesh>
      {/* Ash Bed */}
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.62, 0.62, 0.05, 12]} />
        <meshStandardMaterial color="#2d3436" roughness={1.0} />
      </mesh>

      {/* Teepee Burning Logs */}
      {([0, 1.2, 2.4, 3.6, 4.8] as const).map((rad, i) => (
        <mesh
          key={i}
          position={[Math.cos(rad) * 0.25, 0.35, Math.sin(rad) * 0.25]}
          rotation={[Math.sin(rad) * 0.45, 0, Math.cos(rad) * 0.45]}
          castShadow
        >
          <boxGeometry args={[0.12, 0.6, 0.12]} />
          <meshStandardMaterial color="#453322" roughness={0.9} />
        </mesh>
      ))}

      {/* Animated Flickering Campfire Flames */}
      <group ref={flameGroupRef} position={[0, 0.55, 0]}>
        <mesh position={[0, 0.08, 0]}>
          <coneGeometry args={[0.28, 0.65, 5]} />
          <meshStandardMaterial
            color="#ff5722"
            emissive="#ff9800"
            emissiveIntensity={highlight ? 3.5 : 2.5}
            roughness={0.1}
          />
        </mesh>
        <mesh position={[0, 0.12, 0]}>
          <coneGeometry args={[0.16, 0.45, 5]} />
          <meshStandardMaterial
            color="#ffeb3b"
            emissive="#ffeb3b"
            emissiveIntensity={3.8}
            roughness={0.1}
          />
        </mesh>
      </group>
      <pointLight ref={fireRef} position={[0, 0.7, 0]} color="#ff7700" distance={8} decay={2} intensity={2.5} />

      {/* 3 Split-Log Benches in a Circle */}
      {([0.5, 2.5, 4.5] as const).map((angle, idx) => {
        const bx = Math.cos(angle) * 1.5;
        const bz = Math.sin(angle) * 1.5;
        return (
          <group key={idx} position={[bx, 0, bz]} rotation={[0, -angle + Math.PI / 2, 0]}>
            <mesh position={[0, 0.25, 0]} castShadow>
              <boxGeometry args={[1.2, 0.2, 0.4]} />
              <meshStandardMaterial color="#a67c4f" roughness={0.8} />
            </mesh>
            <mesh position={[-0.45, 0.1, 0]} castShadow>
              <boxGeometry args={[0.2, 0.2, 0.35]} />
              <meshStandardMaterial color="#5c452e" roughness={0.9} />
            </mesh>
            <mesh position={[0.45, 0.1, 0]} castShadow>
              <boxGeometry args={[0.2, 0.2, 0.35]} />
              <meshStandardMaterial color="#5c452e" roughness={0.9} />
            </mesh>
          </group>
        );
      })}

      {/* Adventurer Travel Backpack & Rolled Bedroll */}
      <group position={[1.4, 0.25, -0.6]} rotation={[0, -0.6, 0]}>
        <mesh position={[0, 0.25, 0]} castShadow>
          <boxGeometry args={[0.35, 0.45, 0.25]} />
          <meshStandardMaterial color="#c0392b" roughness={0.8} />
        </mesh>
        {/* Sleeping Roll on Top */}
        <mesh position={[0, 0.52, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.1, 0.1, 0.45, 8]} />
          <meshStandardMaterial color="#27ae60" roughness={0.8} />
        </mesh>
      </group>
    </group>
  );
}

// ---------------------------------------------------------------------------
// 7. FAQ Station: Arcane Library & Enchanting Sanctum
// ---------------------------------------------------------------------------
function ArcaneLibrary({ highlight }: { highlight: boolean }) {
  const spellbookRef = useRef<THREE.Group>(null);
  const glyphsRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (spellbookRef.current) {
      spellbookRef.current.position.y = 1.15 + Math.sin(t * 2.2) * 0.08;
      spellbookRef.current.rotation.y = t * 0.8;
    }
    if (glyphsRef.current) {
      glyphsRef.current.rotation.y = -t * 0.5;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Stone Flagstone Base */}
      <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.8, 0.4, 2.8]} />
        <meshStandardMaterial color="#57606f" roughness={0.9} />
      </mesh>

      {/* 2 Towering Double Bookcases in Back */}
      <mesh position={[-0.8, 1.4, -1.0]} castShadow>
        <boxGeometry args={[1.2, 2.0, 0.5]} />
        <meshStandardMaterial color="#5c452e" roughness={0.8} />
      </mesh>
      {/* Bookcase Rows (Multi-colored book spines) */}
      <mesh position={[-0.8, 1.4, -0.73]}>
        <boxGeometry args={[1.1, 1.8, 0.08]} />
        <meshStandardMaterial color="#8854d0" roughness={0.6} />
      </mesh>

      <mesh position={[0.8, 1.4, -1.0]} castShadow>
        <boxGeometry args={[1.2, 2.0, 0.5]} />
        <meshStandardMaterial color="#5c452e" roughness={0.8} />
      </mesh>
      <mesh position={[0.8, 1.4, -0.73]}>
        <boxGeometry args={[1.1, 1.8, 0.08]} />
        <meshStandardMaterial color="#3867d6" roughness={0.6} />
      </mesh>

      {/* Central Obsidian & Diamond Enchanting Table */}
      <group position={[0, 0.4, 0.1]}>
        {/* Obsidian Bottom Slab */}
        <mesh position={[0, 0.15, 0]} castShadow>
          <boxGeometry args={[1.1, 0.3, 1.1]} />
          <meshStandardMaterial color="#1e132b" roughness={0.6} />
        </mesh>
        {/* Diamond Block Mid Section */}
        <mesh position={[0, 0.38, 0]} castShadow>
          <boxGeometry args={[0.95, 0.16, 0.95]} />
          <meshStandardMaterial
            color="#00d2d3"
            emissive="#00cec9"
            emissiveIntensity={highlight ? 0.7 : 0.3}
            roughness={0.2}
            metalness={0.6}
          />
        </mesh>
        {/* Crimson Cloth Top Table */}
        <mesh position={[0, 0.5, 0]} castShadow>
          <boxGeometry args={[1.05, 0.08, 1.05]} />
          <meshStandardMaterial color="#b71540" roughness={0.8} />
        </mesh>
      </group>

      {/* Floating Rotating Mystical Spellbook */}
      <group ref={spellbookRef} position={[0, 1.15, 0.1]}>
        {/* Leather Book Cover */}
        <mesh rotation={[0.2, 0, 0]} castShadow>
          <boxGeometry args={[0.42, 0.06, 0.34]} />
          <meshStandardMaterial color="#833471" roughness={0.6} />
        </mesh>
        {/* Open Fluttering Pages */}
        <mesh position={[-0.1, 0.04, 0]} rotation={[0.2, 0, 0.2]}>
          <boxGeometry args={[0.2, 0.02, 0.32]} />
          <meshStandardMaterial color="#fffbe6" roughness={0.4} />
        </mesh>
        <mesh position={[0.1, 0.04, 0]} rotation={[0.2, 0, -0.2]}>
          <boxGeometry args={[0.2, 0.02, 0.32]} />
          <meshStandardMaterial color="#fffbe6" roughness={0.4} />
        </mesh>
      </group>

      {/* Orbiting Mystic Glyphs */}
      <group ref={glyphsRef} position={[0, 1.35, 0.1]}>
        <mesh position={[0.4, 0.15, 0]}>
          <octahedronGeometry args={[0.04]} />
          <meshStandardMaterial color="#a55eea" emissive="#8854d0" emissiveIntensity={2.5} />
        </mesh>
        <mesh position={[-0.35, 0.1, 0.25]}>
          <octahedronGeometry args={[0.035]} />
          <meshStandardMaterial color="#45aaf2" emissive="#2d98da" emissiveIntensity={2.5} />
        </mesh>
        <mesh position={[0.15, -0.1, -0.35]}>
          <octahedronGeometry args={[0.04]} />
          <meshStandardMaterial color="#fd9644" emissive="#fa8231" emissiveIntensity={2.5} />
        </mesh>
      </group>

      <pointLight color="#a55eea" intensity={1.8} distance={6} decay={2} position={[0, 1.5, 0.1]} />
    </group>
  );
}

// ---------------------------------------------------------------------------
// 8. Venue Station: Cartographer's Island Overlook
// ---------------------------------------------------------------------------
function CartographerOverlook({ highlight }: { highlight: boolean }) {
  const telescopeRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (telescopeRef.current) {
      telescopeRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.4) * 0.25 + 0.3;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Nautical Spruce Decking */}
      <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.8, 0.5, 2.8]} />
        <meshStandardMaterial color="#7f5a36" roughness={0.8} />
      </mesh>

      {/* Perimeter Cross-braced Fences */}
      <mesh position={[0, 0.75, -1.35]} castShadow>
        <boxGeometry args={[2.7, 0.5, 0.1]} />
        <meshStandardMaterial color="#5c452e" roughness={0.9} />
      </mesh>
      <mesh position={[-1.35, 0.75, 0]} rotation={[0, Math.PI / 2, 0]} castShadow>
        <boxGeometry args={[2.7, 0.5, 0.1]} />
        <meshStandardMaterial color="#5c452e" roughness={0.9} />
      </mesh>

      {/* Cartographer's Drafting Table */}
      <group position={[0.4, 0.5, -0.2]}>
        <mesh position={[0, 0.45, 0]} castShadow>
          <boxGeometry args={[1.4, 0.12, 0.9]} />
          <meshStandardMaterial color="#a67c4f" roughness={0.75} />
        </mesh>
        {/* Table Legs */}
        <mesh position={[-0.55, 0.2, -0.35]} castShadow>
          <boxGeometry args={[0.12, 0.4, 0.12]} />
          <meshStandardMaterial color="#5c452e" roughness={0.9} />
        </mesh>
        <mesh position={[0.55, 0.2, -0.35]} castShadow>
          <boxGeometry args={[0.12, 0.4, 0.12]} />
          <meshStandardMaterial color="#5c452e" roughness={0.9} />
        </mesh>
        <mesh position={[-0.55, 0.2, 0.35]} castShadow>
          <boxGeometry args={[0.12, 0.4, 0.12]} />
          <meshStandardMaterial color="#5c452e" roughness={0.9} />
        </mesh>
        <mesh position={[0.55, 0.2, 0.35]} castShadow>
          <boxGeometry args={[0.12, 0.4, 0.12]} />
          <meshStandardMaterial color="#5c452e" roughness={0.9} />
        </mesh>

        {/* 3D Miniature Relief Island Map on Table */}
        <mesh position={[0, 0.53, 0]} castShadow>
          <boxGeometry args={[1.1, 0.04, 0.7]} />
          <meshStandardMaterial color="#d4a373" roughness={0.7} />
        </mesh>
        {/* Tiny Relief Landmass */}
        <mesh position={[0, 0.57, 0]} castShadow>
          <boxGeometry args={[0.8, 0.05, 0.5]} />
          <meshStandardMaterial color="#4d7c28" roughness={0.9} />
        </mesh>
        {/* Miniature Glowing Location Pin */}
        <mesh position={[0.1, 0.64, -0.05]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial color="#e74c3c" emissive="#c0392b" emissiveIntensity={2} />
        </mesh>
      </group>

      {/* Brass Spyglass Telescope on Wooden Tripod */}
      <group ref={telescopeRef} position={[-0.8, 0.5, 0.6]}>
        {/* Tripod Legs */}
        <mesh position={[-0.12, 0.4, -0.1]} rotation={[0.2, 0, -0.2]} castShadow>
          <cylinderGeometry args={[0.02, 0.025, 0.85, 6]} />
          <meshStandardMaterial color="#5c452e" roughness={0.8} />
        </mesh>
        <mesh position={[0.12, 0.4, -0.1]} rotation={[0.2, 0, 0.2]} castShadow>
          <cylinderGeometry args={[0.02, 0.025, 0.85, 6]} />
          <meshStandardMaterial color="#5c452e" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.4, 0.15]} rotation={[-0.2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.02, 0.025, 0.85, 6]} />
          <meshStandardMaterial color="#5c452e" roughness={0.8} />
        </mesh>
        {/* Brass Telescope Tube pointing towards sea */}
        <group position={[0, 0.85, 0]} rotation={[-0.2, 0, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.06, 0.04, 0.65, 8]} />
            <meshStandardMaterial
              color="#d4af37"
              metalness={0.9}
              roughness={0.2}
              emissive={highlight ? '#f39c12' : '#000000'}
              emissiveIntensity={highlight ? 0.3 : 0}
            />
          </mesh>
          {/* Glass Lens */}
          <mesh position={[0, 0.33, 0]}>
            <circleGeometry args={[0.055, 8]} />
            <meshStandardMaterial color="#00d2d3" emissive="#00d2d3" emissiveIntensity={1} />
          </mesh>
        </group>
      </group>

      {/* Cyan Sea Lantern hanging on post */}
      <group position={[-1.3, 0.5, -1.3]}>
        <mesh position={[0, 0.6, 0]} castShadow>
          <boxGeometry args={[0.12, 1.2, 0.12]} />
          <meshStandardMaterial color="#5c452e" roughness={0.9} />
        </mesh>
        <mesh position={[0.15, 1.15, 0.15]}>
          <boxGeometry args={[0.26, 0.26, 0.26]} />
          <meshStandardMaterial
            color="#00cec9"
            emissive="#00cec9"
            emissiveIntensity={highlight ? 2.5 : 1.8}
            roughness={0.15}
          />
        </mesh>
        <pointLight color="#00cec9" intensity={1.5} distance={6} decay={2} position={[0.15, 1.15, 0.15]} />
      </group>
    </group>
  );
}
