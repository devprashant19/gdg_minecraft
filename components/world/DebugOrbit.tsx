'use client';

import React from 'react';
import { OrbitControls } from '@react-three/drei';

export function DebugOrbit() {
  return (
    <OrbitControls
      makeDefault
      maxPolarAngle={Math.PI / 2 + 0.1}
      minDistance={4}
      maxDistance={90}
    />
  );
}

