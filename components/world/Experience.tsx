'use client';

import React, { useEffect, useState, useRef, useSyncExternalStore } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { UIOverlay } from '@/components/ui/UIOverlay';
import { DebugStats } from '@/components/ui/DebugOverlay';
import { Island } from './Island';
import { Dock } from './Dock';
import { Player } from './Player';
import { Boundaries } from './Boundaries';
import { Station } from './Station';
import { TourCamera } from './TourCamera';
import { Sky } from './Sky';
import { Water } from './Water';
import { Clouds } from './Clouds';
import { Portal } from './Portal';
import { DestinationMarker } from './DestinationMarker';
import { PostProcessing } from './PostProcessing';
import { stations } from '@/content/stations';
import { useGame } from '@/lib/store';
import { sampleTimeOfDay } from '@/lib/timeOfDay';
import { detectQualityTier, TIER_CONFIGS } from '@/lib/quality';
import { initializeE2E, isE2EActive } from '@/lib/e2e';
import { trackEvent } from '@/lib/analytics';

let activeRenderer: THREE.WebGLRenderer | null = null;

export function requestShadowMapUpdate(): void {
  if (activeRenderer) {
    activeRenderer.shadowMap.needsUpdate = true;
  }
}

function checkIsDebug(): boolean {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).has('debug');
}

/**
 * Fires onRendered callback after the GPU has successfully rendered frames,
 * guaranteeing all shaders and terrain meshes are compiled before lifting loading screen.
 */
function SceneReadyReporter({ onRendered }: { onRendered?: () => void }) {
  const frameCount = useRef(0);
  useFrame(() => {
    if (frameCount.current < 5) {
      frameCount.current++;
      if (frameCount.current === 3 && onRendered) {
        onRendered();
      }
    }
  });
  return null;
}

interface ExperienceProps {
  onRendered?: () => void;
}

export default function Experience({ onRendered }: ExperienceProps) {
  const isDebug = useSyncExternalStore(() => () => {}, checkIsDebug, () => false);
  const setStage = useGame((s) => s.setStage);
  const tourSeen = useGame((s) => s.tourSeen);
  const reducedMotion = useGame((s) => s.reducedMotion);
  const openSection = useGame((s) => s.openSection);
  const timeOfDay = useGame((s) => s.timeOfDay);
  const qualityTier = useGame((s) => s.qualityTier);
  const setQualityTier = useGame((s) => s.setQualityTier);

  const [sunMesh, setSunMesh] = useState<THREE.Mesh | null>(null);
  const tod = sampleTimeOfDay(timeOfDay);
  const tierConfig = TIER_CONFIGS[qualityTier];

  // Request shadow map re-render on time of day or quality tier change
  useEffect(() => {
    requestShadowMapUpdate();
  }, [timeOfDay, qualityTier]);

  // Initialize deterministic E2E testing hook (?e2e)
  useEffect(() => {
    initializeE2E();
  }, []);

  // Auto-detect client hardware capabilities on mount
  useEffect(() => {
    detectQualityTier().then((tier) => {
      setQualityTier(tier);
      trackEvent('tier', { tier });
    });
  }, [setQualityTier]);

  useEffect(() => {
    // Automatically start guided tour on first visit if motion is not reduced and not e2e
    if (isE2EActive()) {
      setStage('play');
    } else if (!tourSeen && !reducedMotion) {
      setStage('tour');
    } else {
      setStage('play');
    }
  }, [tourSeen, reducedMotion, setStage]);

  return (
    <>
      <div className="fixed inset-0 z-0 bg-[#4988e0] overflow-hidden">
        <Canvas
          flat
          shadows
          dpr={tierConfig.dpr}
          gl={{
            antialias: false,
            stencil: false,
            depth: true,
            powerPreference: 'high-performance',
          }}
          onCreated={({ gl }) => {
            activeRenderer = gl;
            gl.shadowMap.autoUpdate = false;
            gl.shadowMap.needsUpdate = true;
          }}
          frameloop={openSection ? 'demand' : 'always'}
          camera={{ fov: 55, near: 0.1, far: 400, position: [0, 6, 28] }}
          style={{ width: '100vw', height: '100vh', touchAction: 'none' }}
        >
          {/* Notify parent when scene has rendered frames */}
          <SceneReadyReporter onRendered={onRendered} />

          {/* Synchronized Sky Dome, Fog & Atmosphere */}
          <color attach="background" args={[tod.horizon]} />
          <fog attach="fog" args={[tod.fogColor, 35, 180]} />
          <Sky tod={tod} sunRef={setSunMesh} />

          {/* Dynamic Sky & Ground Ambient Hemisphere */}
          <hemisphereLight args={[tod.hemiSky, tod.hemiGround, 1.1]} />

          {/* Sun / Moon Directional Light with Shadows */}
          <directionalLight
            position={[tod.sunDir[0] * 35, tod.sunDir[1] * 35, tod.sunDir[2] * 35]}
            intensity={tod.sunIntensity}
            color={tod.sunColor}
            castShadow
            shadow-mapSize-width={tierConfig.shadowMapSize}
            shadow-mapSize-height={tierConfig.shadowMapSize}
            shadow-camera-near={1}
            shadow-camera-far={120}
            shadow-camera-left={-32}
            shadow-camera-right={32}
            shadow-camera-top={32}
            shadow-camera-bottom={-32}
            shadow-bias={-0.0005}
            shadow-normalBias={0.02}
          />

          {/* Drifting Blocky Clouds */}
          <Clouds />

          {/* Ocean Water Plane with Foam and Sun Glint */}
          <Water tod={tod} />

          {/* Physics World: Authentic Minecraft Gravity (28 m/s^2), Player, Island, Stations & Boundaries */}
          <Physics gravity={[0, -28, 0]}>
            <Player />
            <Island seed={1337} />
            <Dock />
            <Boundaries />

            {/* Nine Interactive Stations */}
            {stations.map((s) => (
              <Station key={s.id} station={s} />
            ))}

            {/* Ancient Obsidian Registration Portal at Center Island */}
            <Portal position={[0, 5.0, 2]} />

            {/* Click-to-Walk Ground Destination Marker */}
            <DestinationMarker />
          </Physics>

          {/* Guided Tour Camera Controller */}
          <TourCamera />

          {/* Cinematic Post-Processing Pipeline */}
          <PostProcessing bloomIntensity={tod.bloom} sunMesh={sunMesh} />

          {isDebug && <DebugStats />}
        </Canvas>
      </div>
      <UIOverlay />
    </>
  );
}
