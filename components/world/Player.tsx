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
import { useGame, selectControlsDisabled, SectionId } from '@/lib/store';
import { SPAWN_POSITION } from '@/lib/world-constants';
import { stations } from '@/content/stations';
import { PlayerModel } from './PlayerModel';
import { BlobShadow } from './BlobShadow';
import { isTypingTarget } from '@/lib/typing-guard';
import {
  playJump,
  playLand,
  playFlyToggle,
  playFootstep,
} from '@/lib/sound';

// Module-scoped reusable scratch vectors to eliminate GC allocations
const _camPos = new THREE.Vector3();
const _camTarget = new THREE.Vector3();
const _targetFocus = new THREE.Vector3();
const _raycaster = new THREE.Raycaster();
const _mouseNDC = new THREE.Vector2();

export function Player() {
  const bodyRef = useRef<RapierRigidBody>(null);
  const visualRef = useRef<THREE.Group>(null);
  const { camera, gl, scene } = useThree();
  const { rapier, world } = useRapier();

  const [isMoving, setIsMoving] = useState(false);
  const keys = useRef<{ [key: string]: boolean }>({});

  const stage = useGame((s) => s.stage);
  const disabled = useGame(selectControlsDisabled);
  const playerTarget = useGame((s) => s.playerTarget);
  const arrive = useGame((s) => s.arrive);
  const open = useGame((s) => s.open);
  const reducedMotion = useGame((s) => s.reducedMotion);
  const setMouseAimLocked = useGame((s) => s.setMouseAimLocked);

  const isFlying = useGame((s) => s.isFlying);
  const setIsFlying = useGame((s) => s.setIsFlying);
  const isFirstPerson = useGame((s) => s.isFirstPerson);
  const toggleFirstPerson = useGame((s) => s.toggleFirstPerson);
  const clickNavTarget = useGame((s) => s.clickNavTarget);
  const setClickNavTarget = useGame((s) => s.setClickNavTarget);

  const travelTimer = useRef(0);
  const lastSpaceTime = useRef(-1e9);
  const wasAirborne = useRef(false);
  const footstepTimer = useRef(0);

  // Homecraft Camera Rig smoothed state
  const cameraYaw = useRef(0); // 0 = viewing towards -Z (North into island)
  const cameraPitch = useRef(0.24); // ~14 deg down angle
  const cameraDist = useRef(5.2);
  const yawGoal = useRef(0);
  const pitchGoal = useRef(0.24);
  const distGoal = useRef(5.2);
  const focus = useRef(new THREE.Vector3(SPAWN_POSITION[0], SPAWN_POSITION[1] + 1.25, SPAWN_POSITION[2]));

  const isDragging = useRef(false);
  const prevPointer = useRef({ x: 0, y: 0 });
  const pointerStart = useRef({ x: 0, y: 0 });

  const respawn = useCallback(() => {
    if (bodyRef.current) {
      bodyRef.current.setTranslation(
        { x: SPAWN_POSITION[0], y: SPAWN_POSITION[1] + 1.85, z: SPAWN_POSITION[2] },
        true
      );
      bodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      setIsFlying(false);
    }
  }, [setIsFlying]);

  // 1. Mouse Aim / Pointer Lock & Drag Controls
  useEffect(() => {
    const onPointerLockChange = () => {
      const isLocked = document.pointerLockElement === gl.domElement;
      setMouseAimLocked(isLocked);
    };

    document.addEventListener('pointerlockchange', onPointerLockChange);

    // Canvas click: requests pointer lock or picks ground destination
    const handleCanvasPointerDown = (e: PointerEvent) => {
      if (isTypingTarget(document.activeElement)) return;
      pointerStart.current = { x: e.clientX, y: e.clientY };
      prevPointer.current = { x: e.clientX, y: e.clientY };

      if (document.pointerLockElement !== gl.domElement) {
        isDragging.current = true;
      }
    };

    const handleCanvasPointerUp = (e: PointerEvent) => {
      isDragging.current = false;
      if (isTypingTarget(document.activeElement)) return;

      const clickDist = Math.hypot(
        e.clientX - pointerStart.current.x,
        e.clientY - pointerStart.current.y
      );

      // If clicked without dragging and not in pointer lock, check for ground click-to-walk
      if (clickDist < 6 && document.pointerLockElement !== gl.domElement) {
        if (stage === 'play' && !disabled) {
          const rect = gl.domElement.getBoundingClientRect();
          _mouseNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
          _mouseNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
          _raycaster.setFromCamera(_mouseNDC, camera);

          const intersects = _raycaster.intersectObjects(scene.children, true);
          const terrainHit = intersects.find(
            (hit) =>
              hit.object.name === 'voxel-island' ||
              hit.point.y >= 3.0 ||
              hit.object.type === 'Mesh'
          );

          if (terrainHit && terrainHit.point.y > 2.0) {
            setClickNavTarget([terrainHit.point.x, terrainHit.point.y, terrainHit.point.z]);
          }
        }
      }
    };

    const canvasEl = gl.domElement;
    canvasEl.addEventListener('pointerdown', handleCanvasPointerDown);
    canvasEl.addEventListener('pointerup', handleCanvasPointerUp);

    // Mouse Move: Direct POV aim when pointer is locked
    const handleMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement === gl.domElement) {
        const sens = 0.0028;
        yawGoal.current -= e.movementX * sens;
        pitchGoal.current = Math.max(-0.45, Math.min(1.35, pitchGoal.current + e.movementY * sens));
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Fallback pointer drag orbit
    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging.current || document.pointerLockElement === gl.domElement) return;
      const dx = e.clientX - prevPointer.current.x;
      const dy = e.clientY - prevPointer.current.y;
      prevPointer.current = { x: e.clientX, y: e.clientY };

      const sens = 0.005;
      yawGoal.current -= dx * sens;
      pitchGoal.current = Math.max(-0.45, Math.min(1.35, pitchGoal.current + dy * sens));
    };

    const handleWheel = (e: WheelEvent) => {
      if (isTypingTarget(document.activeElement)) return;
      distGoal.current = Math.max(3.2, Math.min(16.0, distGoal.current + e.deltaY * 0.005));
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('wheel', handleWheel, { passive: true });

    return () => {
      document.removeEventListener('pointerlockchange', onPointerLockChange);
      canvasEl.removeEventListener('pointerdown', handleCanvasPointerDown);
      canvasEl.removeEventListener('pointerup', handleCanvasPointerUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('wheel', handleWheel);
    };
  }, [gl, disabled, stage, setMouseAimLocked, camera, scene, setClickNavTarget]);

  // Release pointer lock automatically when modals/sections open
  useEffect(() => {
    if (disabled && document.pointerLockElement) {
      document.exitPointerLock();
    }
  }, [disabled]);

  // 2. Keyboard Listeners (Movement, Jump, Flight, 1st Person, Respawn, and Ctrl Pointer-Lock toggle)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTypingTarget(document.activeElement)) return;

      // Ctrl key toggles Mouse Aim (Pointer Lock) vs Arrow Cursor Mode
      if (e.code === 'ControlLeft' || e.code === 'ControlRight' || e.key === 'Control') {
        e.preventDefault();
        if (document.pointerLockElement === gl.domElement) {
          document.exitPointerLock();
        } else if (!disabled && stage === 'play') {
          gl.domElement.requestPointerLock();
        }
        return;
      }

      // V key toggles First-Person POV (like Homecraft & Minecraft F5)
      if (e.code === 'KeyV' && stage === 'play' && !disabled) {
        e.preventDefault();
        toggleFirstPerson();
        return;
      }

      // Space key: Double-tap detection for Creative Flight toggle (<350ms)
      if (e.code === 'Space' && !e.repeat) {
        const now = performance.now();
        if (now - lastSpaceTime.current < 350) {
          lastSpaceTime.current = -1e9;
          const nextFlight = !useGame.getState().isFlying;
          setIsFlying(nextFlight);
          playFlyToggle(nextFlight);
        } else {
          lastSpaceTime.current = now;
        }
      }

      keys.current[e.code] = true;

      // Cancel click-to-walk on any manual movement key
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        if (useGame.getState().clickNavTarget) {
          setClickNavTarget(null);
        }
      }

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
  }, [gl, disabled, stage, respawn, setIsFlying, toggleFirstPerson, setClickNavTarget]);

  // Reset travel timer whenever target changes
  useEffect(() => {
    travelTimer.current = 0;
  }, [playerTarget]);

  useFrame((_, delta) => {
    if (!bodyRef.current) return;

    const pos = bodyRef.current.translation();
    const linvel = bodyRef.current.linvel();

    // Export live player position and heading for Radar/Minimap and Debug
    if (typeof window !== 'undefined') {
      (window as unknown as {
        __playerPos?: { x: number; y: number; z: number; linvelY: number; rotY: number };
      }).__playerPos = {
        ...pos,
        linvelY: linvel.y,
        rotY: visualRef.current?.rotation.y || 0,
      };
    }

    // Toggle player visual visibility in First Person Mode
    if (visualRef.current) {
      visualRef.current.visible = !isFirstPerson;
    }

    // 1. Fall-off Island Respawn Guard
    if (pos.y < -5) {
      respawn();
      return;
    }

    // 2. Fast-Travel / Waypoint Loop Auto-Walk
    if (playerTarget) {
      const targetStation = stations.find((s) => s.id === playerTarget);
      if (targetStation) {
        const [tx, ty, tz] = targetStation.standPoint;
        const dx = tx - pos.x;
        const dz = tz - pos.z;
        const dist = Math.hypot(dx, dz);

        // Cancel auto-walk if player presses any movement key
        const userInterrupted =
          keys.current['KeyW'] ||
          keys.current['KeyA'] ||
          keys.current['KeyS'] ||
          keys.current['KeyD'] ||
          keys.current['Space'] ||
          keys.current['ArrowUp'] ||
          keys.current['ArrowDown'] ||
          keys.current['ArrowLeft'] ||
          keys.current['ArrowRight'];

        if (userInterrupted) {
          arrive();
          return;
        }

        travelTimer.current += delta;

        // Fallback: Timeout (>4s) or reducedMotion -> instant teleport
        if (reducedMotion || travelTimer.current >= 4.0) {
          bodyRef.current.setTranslation({ x: tx, y: ty, z: tz }, true);
          bodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
          if (visualRef.current) {
            visualRef.current.rotation.y = Math.atan2(
              targetStation.position[0] - tx,
              targetStation.position[2] - tz
            );
          }
          arrive();
          open(targetStation.id as SectionId);
          return;
        }

        // Arrived at destination standPoint
        if (dist <= 0.85) {
          bodyRef.current.setLinvel({ x: 0, y: linvel.y, z: 0 }, true);
          if (visualRef.current) {
            visualRef.current.rotation.y = Math.atan2(
              targetStation.position[0] - pos.x,
              targetStation.position[2] - pos.z
            );
          }
          setIsMoving(false);
          arrive();
          open(targetStation.id as SectionId);
          return;
        }

        // Auto-walk towards target at sprint speed
        const speed = 7.8;
        const vx = (dx / dist) * speed;
        const vz = (dz / dist) * speed;
        bodyRef.current.setLinvel({ x: vx, y: linvel.y, z: vz }, true);

        if (visualRef.current) {
          const targetRot = Math.atan2(vx, vz);
          let diff = targetRot - visualRef.current.rotation.y;
          while (diff < -Math.PI) diff += Math.PI * 2;
          while (diff > Math.PI) diff -= Math.PI * 2;
          visualRef.current.rotation.y += diff * Math.min(1, delta * 18);
        }
        if (!isMoving) setIsMoving(true);

        // Smooth camera follow during station travel
        _targetFocus.set(pos.x, pos.y + 1.25, pos.z);
        focus.current.lerp(_targetFocus, 1 - Math.exp(-delta * 14));
        const k = 1 - Math.exp(-delta * 14);
        cameraYaw.current += (yawGoal.current - cameraYaw.current) * k;
        cameraPitch.current += (pitchGoal.current - cameraPitch.current) * k;
        cameraDist.current += (distGoal.current - cameraDist.current) * k;

        const camX = focus.current.x + Math.sin(cameraYaw.current) * Math.cos(cameraPitch.current) * cameraDist.current;
        const camY = focus.current.y + Math.sin(cameraPitch.current) * cameraDist.current;
        const camZ = focus.current.z + Math.cos(cameraYaw.current) * Math.cos(cameraPitch.current) * cameraDist.current;
        _camPos.set(camX, camY, camZ);
        camera.position.copy(_camPos);
        camera.lookAt(focus.current);
        return;
      }
    }

    // 3. Frozen Controls Check
    if (disabled) {
      bodyRef.current.setLinvel({ x: 0, y: isFlying ? 0 : linvel.y, z: 0 }, true);
      if (isMoving) setIsMoving(false);
      return;
    }

    // 4. Grounded Detection using Rapier Raycast
    const rayOrigin = { x: pos.x, y: pos.y - 0.5, z: pos.z };
    const rayDir = { x: 0, y: -1, z: 0 };
    const ray = new rapier.Ray(rayOrigin, rayDir);
    const hit = world.castRay(ray, 0.45, true);
    const isGrounded = !!hit;

    // Landing sound detection
    if (wasAirborne.current && isGrounded && linvel.y <= 0) {
      playLand();
      wasAirborne.current = false;
    } else if (!isGrounded && !isFlying) {
      wasAirborne.current = true;
    }

    // 5. Direction Vectors relative to Camera Yaw
    const forwardX = -Math.sin(cameraYaw.current);
    const forwardZ = -Math.cos(cameraYaw.current);
    const rightX = Math.cos(cameraYaw.current);
    const rightZ = -Math.sin(cameraYaw.current);

    let inputX = 0;
    let inputZ = 0;

    if (keys.current['KeyW'] || keys.current['ArrowUp']) inputZ += 1;
    if (keys.current['KeyS'] || keys.current['ArrowDown']) inputZ -= 1;
    if (keys.current['KeyA'] || keys.current['ArrowLeft']) inputX -= 1;
    if (keys.current['KeyD'] || keys.current['ArrowRight']) inputX += 1;

    let vx = 0;
    let vz = 0;
    let vy = linvel.y;

    const isRunning = keys.current['ShiftLeft'] || keys.current['ShiftRight'];

    // 6. Click-to-Walk Ground Navigation
    if (clickNavTarget && Math.hypot(inputX, inputZ) < 0.01) {
      const dx = clickNavTarget[0] - pos.x;
      const dz = clickNavTarget[2] - pos.z;
      const dist = Math.hypot(dx, dz);

      if (dist <= 0.65) {
        setClickNavTarget(null);
        setIsMoving(false);
      } else {
        const navSpeed = 6.8;
        vx = (dx / dist) * navSpeed;
        vz = (dz / dist) * navSpeed;
        if (!isMoving) setIsMoving(true);

        if (visualRef.current) {
          const targetRot = Math.atan2(vx, vz);
          let diff = targetRot - visualRef.current.rotation.y;
          while (diff < -Math.PI) diff += Math.PI * 2;
          while (diff > Math.PI) diff -= Math.PI * 2;
          visualRef.current.rotation.y += diff * Math.min(1, delta * 18);
        }
      }
    } else {
      // 7. Manual WASD Movement
      const inputLen = Math.hypot(inputX, inputZ);
      const moving = inputLen > 0.01;
      if (moving !== isMoving) {
        setIsMoving(moving);
      }

      if (moving) {
        const normX = inputX / inputLen;
        const normZ = inputZ / inputLen;

        const baseSpeed = isFlying ? (isRunning ? 15.0 : 8.5) : (isRunning ? 8.2 : 5.2);

        vx = (forwardX * normZ + rightX * normX) * baseSpeed;
        vz = (forwardZ * normZ + rightZ * normX) * baseSpeed;

        // Smooth shortest-arc rotation towards movement direction
        if (visualRef.current) {
          const targetRot = Math.atan2(vx, vz);
          let diff = targetRot - visualRef.current.rotation.y;
          while (diff < -Math.PI) diff += Math.PI * 2;
          while (diff > Math.PI) diff -= Math.PI * 2;
          visualRef.current.rotation.y += diff * Math.min(1, delta * 20);
        }

        // Footstep audio when running on ground
        if (isGrounded && !isFlying) {
          footstepTimer.current += delta;
          const interval = isRunning ? 0.28 : 0.38;
          if (footstepTimer.current >= interval) {
            playFootstep('grass');
            footstepTimer.current = 0;
          }
        }
      }
    }

    // 8. Flight Kinematics vs Ground Jump Kinematics
    if (isFlying) {
      // Creative Flight: vertical climb and descent
      if (keys.current['Space']) {
        vy = 6.0; // CLIMB
      } else if (keys.current['ControlLeft'] || keys.current['ControlRight'] || keys.current['KeyC']) {
        vy = -6.0; // DESCEND
        // Auto-land if player touches solid ground while descending
        if (isGrounded && pos.y < 9.0) {
          setIsFlying(false);
          playFlyToggle(false);
          vy = 0;
        }
      } else {
        vy = 0; // Hover, gravity neutralized
      }
    } else {
      // Standard Ground Physics: Jump clears 1.25 blocks cleanly
      if (keys.current['Space'] && isGrounded && linvel.y <= 0.4 && linvel.y >= -1.5) {
        vy = 7.6;
        playJump();
      }
    }

    bodyRef.current.setLinvel({ x: vx, y: vy, z: vz }, true);

    // 9. Camera Rig with Homecraft Exponential Damping
    if (stage === 'play') {
      const k = 1 - Math.exp(-delta * 14);
      cameraYaw.current += (yawGoal.current - cameraYaw.current) * k;
      cameraPitch.current += (pitchGoal.current - cameraPitch.current) * k;
      cameraDist.current += (distGoal.current - cameraDist.current) * k;

      if (isFirstPerson) {
        // First Person Mode: camera placed at eye level (1.62m)
        _camPos.set(pos.x, pos.y + 1.62, pos.z);
        const cp = Math.cos(cameraPitch.current);
        _camTarget.set(
          pos.x - Math.sin(cameraYaw.current) * cp,
          pos.y + 1.62 + Math.sin(cameraPitch.current),
          pos.z - Math.cos(cameraYaw.current) * cp
        );
        camera.position.copy(_camPos);
        camera.lookAt(_camTarget);
      } else {
        // Third Person Orbit Follow with focus damping
        _targetFocus.set(pos.x, pos.y + 1.25, pos.z);
        focus.current.lerp(_targetFocus, k);

        const yaw = cameraYaw.current;
        const pitch = cameraPitch.current;
        const dist = cameraDist.current;

        const camX = focus.current.x + Math.sin(yaw) * Math.cos(pitch) * dist;
        const camY = focus.current.y + Math.sin(pitch) * dist;
        const camZ = focus.current.z + Math.cos(yaw) * Math.cos(pitch) * dist;

        _camPos.set(camX, camY, camZ);
        camera.position.copy(_camPos);
        camera.lookAt(focus.current);
      }
    }
  });

  return (
    <RigidBody
      ref={bodyRef}
      position={[SPAWN_POSITION[0], SPAWN_POSITION[1] + 1.85, SPAWN_POSITION[2]]}
      type="dynamic"
      colliders={false}
      enabledRotations={[false, false, false]}
      ccd={true}
      name="player"
    >
      <CapsuleCollider args={[0.5, 0.3]} name="player" />
      <group ref={visualRef} rotation={[0, Math.PI, 0]}>
        <PlayerModel isMoving={isMoving} />
        {!isFlying && <BlobShadow />}
      </group>
    </RigidBody>
  );
}
