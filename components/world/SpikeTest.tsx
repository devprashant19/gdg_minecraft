'use client';

import React from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics, RigidBody } from '@react-three/rapier';
import { Ecctrl } from 'ecctrl';

export function SpikeTest() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Canvas camera={{ position: [0, 5, 10] }}>
        <ambientLight intensity={0.5} />
        <Physics>
          <Ecctrl>
            <mesh>
              <capsuleGeometry args={[0.3, 0.9]} />
              <meshStandardMaterial color="royalblue" />
            </mesh>
          </Ecctrl>
          <RigidBody type="fixed">
            <mesh position={[0, -1, 0]}>
              <boxGeometry args={[20, 0.5, 20]} />
              <meshStandardMaterial color="gray" />
            </mesh>
          </RigidBody>
        </Physics>
      </Canvas>
    </div>
  );
}
