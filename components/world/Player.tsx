'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import {
  RigidBody,
  CapsuleCollider,
  RapierRigidBody,
  useRapier,
} from '@react-three/rapier';
import { useGame, selectControlsDisabled } from '@/lib/store';
import { SPAWN_POSITION } from '@/lib/world-constants';
import { PlayerModel } from './PlayerModel';
import { isTypingTarget } from '@/lib/typing-guard';

export function Player() {
  const bodyRef = useRef<RapierRigidBody>(null);
  const visualRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const { rapier, world } = useRapier();

  const [isMoving, setIsMoving] = useState(false);
  const keys = useRef<{ [key: string]: boolean }>({});

  const disabled = useGame(selectControlsDisabled);

  const respawn = useCallback(() => {
    if (bodyRef.current) {
      bodyRef.current.setTranslation(
        { x: SPAWN_POSITION[0], y: SPAWN_POSITION[1] + 1, z: SPAWN_POSITION[2] },
        true
      );
      bodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
    }
  }, []);

  // Keyboard Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTypingTarget(document.activeElement)) return;

      keys.current[e.code] = true;

      // Escape Hatch: R key to respawn at dock
      if (e.code === 'KeyR') {
        respawn();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current[e.code] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [respawn]);

  useFrame((_, delta) => {
    if (!bodyRef.current) return;

    const pos = bodyRef.current.translation();
    const linvel = bodyRef.current.linvel();

    // 1. Fall-off Island Respawn Guard
    if (pos.y < -5) {
      respawn();
      return;
    }

    // 2. Frozen Controls Check
    if (disabled) {
      bodyRef.current.setLinvel({ x: 0, y: linvel.y, z: 0 }, true);
      if (isMoving) setIsMoving(false);
      return;
    }

    // 3. Grounded / Jump Detection using Rapier Raycast
    const rayOrigin = { x: pos.x, y: pos.y + 0.1, z: pos.z };
    const rayDir = { x: 0, y: -1, z: 0 };
    const ray = new rapier.Ray(rayOrigin, rayDir);
    const hit = world.castRay(ray, 0.85, true);
    const isGrounded = !!hit;

    // 4. Movement Calculation
    let moveX = 0;
    let moveZ = 0;

    if (keys.current['KeyW'] || keys.current['ArrowUp']) moveZ -= 1;
    if (keys.current['KeyS'] || keys.current['ArrowDown']) moveZ += 1;
    if (keys.current['KeyA'] || keys.current['ArrowLeft']) moveX -= 1;
    if (keys.current['KeyD'] || keys.current['ArrowRight']) moveX += 1;

    const isRunning = keys.current['ShiftLeft'] || keys.current['ShiftRight'];
    const speed = isRunning ? 6.7 : 4.2;

    const moveLength = Math.hypot(moveX, moveZ);
    const moving = moveLength > 0.01;
    if (moving !== isMoving) {
      setIsMoving(moving);
    }

    if (moving) {
      // Normalize diagonal movement to maintain strict speed cap
      moveX /= moveLength;
      moveZ /= moveLength;

      const vx = moveX * speed;
      const vz = moveZ * speed;
      bodyRef.current.setLinvel({ x: vx, y: linvel.y, z: vz }, true);

      // Rotate visual model to face movement direction
      if (visualRef.current) {
        const targetAngle = Math.atan2(moveX, moveZ);
        visualRef.current.rotation.y = targetAngle;
      }
    } else {
      bodyRef.current.setLinvel({ x: 0, y: linvel.y, z: 0 }, true);
    }

    // 5. Single-block Jump (jumpVel calibrated to 5.2)
    if (keys.current['Space'] && isGrounded && Math.abs(linvel.y) < 0.1) {
      bodyRef.current.setLinvel({ x: linvel.x, y: 5.2, z: linvel.z }, true);
    }

    // 6. Smooth Third-Person Camera Tracking
    const cameraTarget = new THREE.Vector3(pos.x, pos.y + 2.8, pos.z + 5.5);
    camera.position.lerp(cameraTarget, Math.min(1, delta * 6));

    const lookTarget = new THREE.Vector3(pos.x, pos.y + 1.2, pos.z);
    camera.lookAt(lookTarget);
  });

  return (
    <RigidBody
      ref={bodyRef}
      position={[SPAWN_POSITION[0], SPAWN_POSITION[1] + 0.5, SPAWN_POSITION[2]]}
      type="dynamic"
      colliders={false}
      enabledRotations={[false, false, false]}
      name="player"
    >
      <CapsuleCollider args={[0.45, 0.3]} name="player" />
      <group ref={visualRef}>
        <PlayerModel isMoving={isMoving} />
      </group>
    </RigidBody>
  );
}
