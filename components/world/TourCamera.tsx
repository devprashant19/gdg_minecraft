'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { useGame } from '@/lib/store';
import { stations } from '@/content/stations';

export function TourCamera() {
  const stage = useGame((s) => s.stage);
  const setStage = useGame((s) => s.setStage);
  const markTourSeen = useGame((s) => s.markTourSeen);
  const reducedMotion = useGame((s) => s.reducedMotion);

  const stopIndexRef = useRef(0);
  const timerRef = useRef(0);
  const { camera } = useThree();
  const currentLookAt = useRef(new THREE.Vector3());

  // Reduced motion guard: skip camera flight entirely
  useEffect(() => {
    if (stage === 'tour' && reducedMotion) {
      setStage('play');
      markTourSeen();
    }
  }, [stage, reducedMotion, setStage, markTourSeen]);

  // Global skip listener on any keydown or click
  useEffect(() => {
    if (stage !== 'tour') return;

    // Reset tour indices when entering tour stage
    stopIndexRef.current = 0;
    timerRef.current = 0;

    const handleSkip = () => {
      setStage('play');
      markTourSeen();
    };

    window.addEventListener('keydown', handleSkip);
    window.addEventListener('pointerdown', handleSkip);

    return () => {
      window.removeEventListener('keydown', handleSkip);
      window.removeEventListener('pointerdown', handleSkip);
    };
  }, [stage, setStage, markTourSeen]);

  useFrame((_, delta) => {
    if (stage !== 'tour') return;

    const currentStation = stations[stopIndexRef.current];
    if (!currentStation) {
      setStage('play');
      markTourSeen();
      return;
    }

    const { cam, look, dwellMs } = currentStation.tourView;
    const targetCam = new THREE.Vector3(cam[0], cam[1], cam[2]);
    const targetLook = new THREE.Vector3(look[0], look[1], look[2]);

    // Smooth camera ease towards target cam position and target lookAt
    camera.position.lerp(targetCam, Math.min(1, delta * 2.5));
    currentLookAt.current.lerp(targetLook, Math.min(1, delta * 3.0));
    camera.lookAt(currentLookAt.current);

    timerRef.current += delta * 1000;
    if (timerRef.current >= dwellMs) {
      timerRef.current = 0;
      if (stopIndexRef.current + 1 < stations.length) {
        stopIndexRef.current += 1;
      } else {
        setStage('play');
        markTourSeen();
      }
    }
  });

  return null;
}
