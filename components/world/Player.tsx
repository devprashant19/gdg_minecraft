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
  playBorderHit,
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
  const isGroundedRef = useRef(true);
  const ctrlDownTime = useRef(0);
  const jumpCooldown = useRef(0);
  const lastBorderSoundTime = useRef(0);

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
      yawGoal.current = 0;
      pitchGoal.current = 0.24;
      cameraYaw.current = 0;
      cameraPitch.current = 0.24;
      cameraDist.current = 5.2;
      distGoal.current = 5.2;
      focus.current.set(SPAWN_POSITION[0], SPAWN_POSITION[1] + 1.25, SPAWN_POSITION[2]);
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

      // F key: Toggle Creative Flight mode anytime
      if (e.code === 'KeyF' && stage === 'play' && !disabled) {
        e.preventDefault();
        const nextFlight = !useGame.getState().isFlying;
        setIsFlying(nextFlight);
        playFlyToggle(nextFlight);
        return;
      }

      // V key toggles First-Person POV (like Homecraft & Minecraft F5)
      if (e.code === 'KeyV' && stage === 'play' && !disabled) {
        e.preventDefault();
        toggleFirstPerson();
        return;
      }

      // Ctrl key handling:
      // Track timestamp so quick tap (<220ms) can toggle pointer lock on keyup,
      // while holding Ctrl descends smoothly when flying or sneaks!
      if (e.code === 'ControlLeft' || e.code === 'ControlRight' || e.key === 'Control') {
        if (!keys.current['ControlLeft'] && !keys.current['ControlRight']) {
          ctrlDownTime.current = performance.now();
        }
        keys.current[e.code] = true;
        keys.current['ControlLeft'] = true;
        return;
      }

      // Space key: Only triggers jumping on ground.
      // Deliberately REMOVED double-space flight trigger so spamming jump
      // NEVER causes accidental flight! Flight is toggled exclusively via F key or HUD button.

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

      // Ctrl keyup: If it was a quick tap (< 220ms) and NOT flying, toggle pointer lock / arrow cursor
      if (e.code === 'ControlLeft' || e.code === 'ControlRight' || e.key === 'Control') {
        keys.current['ControlLeft'] = false;
        keys.current['ControlRight'] = false;
        const holdDuration = performance.now() - ctrlDownTime.current;
        if (holdDuration < 220 && !useGame.getState().isFlying && stage === 'play' && !disabled) {
          if (document.pointerLockElement === gl.domElement) {
            document.exitPointerLock();
          } else {
            gl.domElement.requestPointerLock();
          }
        }
      }
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

  useFrame((state, delta) => {
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

    // 1. Fall-off Island or Cloud Void Respawn Guard
    if (pos.y < -5 || pos.y > 55 || Number.isNaN(pos.y)) {
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

        // Auto-walk towards target at fast travel speed
        const speed = 22.0;
        const vx = (dx / dist) * speed;
        const vz = (dz / dist) * speed;
        bodyRef.current.setLinvel({ x: vx, y: linvel.y, z: vz }, true);

        if (visualRef.current) {
          const targetRot = Math.atan2(vx, vz);
          let diff = targetRot - visualRef.current.rotation.y;
          while (diff < -Math.PI) diff += Math.PI * 2;
          while (diff > Math.PI) diff -= Math.PI * 2;
          visualRef.current.rotation.y += diff * Math.min(1, delta * 25);
        }
        if (!isMoving) setIsMoving(true);

        // Smooth camera follow during station travel
        _targetFocus.set(pos.x, pos.y + 1.25, pos.z);
        focus.current.lerp(_targetFocus, 1 - Math.exp(-delta * 20));
        const k = 1 - Math.exp(-delta * 20);
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
    // Player capsule center is at pos.y, radius 0.3, half-height 0.5.
    // Total extent from center is pos.y - 0.8 at bottom.
    // We cast a ray from pos.y - 0.2 downward.
    // The player's own rigid body is strictly excluded so the ray never hits the player capsule.
    if (jumpCooldown.current > 0) {
      jumpCooldown.current -= delta;
    }

    const rayOrigin = { x: pos.x, y: pos.y - 0.2, z: pos.z };
    const rayDir = { x: 0, y: -1, z: 0 };
    const ray = new rapier.Ray(rayOrigin, rayDir);
    // 0.60m from pos.y - 0.2 to feet (pos.y - 0.8). Ray length 0.78m allows 0.18m ground clearance.
    const hit = world.castRay(
      ray,
      0.78,
      false,
      undefined,
      undefined,
      undefined,
      bodyRef.current || undefined,
      (collider) => collider.parent() !== bodyRef.current
    );
    const isGrounded = jumpCooldown.current <= 0 && !!hit;
    isGroundedRef.current = isGrounded;

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
        const navSpeed = 15.0;
        vx = (dx / dist) * navSpeed;
        vz = (dz / dist) * navSpeed;
        if (!isMoving) setIsMoving(true);

        if (visualRef.current) {
          const targetRot = Math.atan2(vx, vz);
          let diff = targetRot - visualRef.current.rotation.y;
          while (diff < -Math.PI) diff += Math.PI * 2;
          while (diff > Math.PI) diff -= Math.PI * 2;
          visualRef.current.rotation.y += diff * Math.min(1, delta * 25);
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

        // Snappy, energetic Minecraft movement speeds
        const baseSpeed = isFlying
          ? (isRunning ? 32.0 : 20.0)
          : (isRunning ? 18.5 : 12.0);

        vx = (forwardX * normZ + rightX * normX) * baseSpeed;
        vz = (forwardZ * normZ + rightZ * normX) * baseSpeed;

        // Smooth shortest-arc rotation towards movement direction
        if (visualRef.current) {
          const targetRot = Math.atan2(vx, vz);
          let diff = targetRot - visualRef.current.rotation.y;
          while (diff < -Math.PI) diff += Math.PI * 2;
          while (diff > Math.PI) diff -= Math.PI * 2;
          visualRef.current.rotation.y += diff * Math.min(1, delta * 25);
        }

        // Footstep audio when running on ground
        if (isGrounded && !isFlying) {
          footstepTimer.current += delta;
          const interval = isRunning ? 0.18 : 0.26;
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
      const isShift = keys.current['ShiftLeft'] || keys.current['ShiftRight'];
      const isCtrl = keys.current['ControlLeft'] || keys.current['ControlRight'] || keys.current['KeyC'];

      if (keys.current['Space']) {
        vy = 18.0; // CLIMB UP
      } else if (isShift || isCtrl) {
        vy = -18.0; // DESCEND DOWN (via Shift, Ctrl, or C) - works whether moving or still!
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
      // Standard Ground Physics: Authentic Minecraft gravity and jumping
      if (keys.current['Space'] && isGrounded && linvel.y <= 0.8) {
        // Crisp 8.5 m/s impulse: height 1.15m, tight 0.45s airtime
        vy = 8.5;
        jumpCooldown.current = 0.22; // Lock grounded state for 220ms so jump achieves full height without re-triggering
        playJump();
      } else if (isGrounded && !keys.current['Space']) {
        // Ground snap / adherence: keeps player firmly grounded on downhill terraces
        vy = -2.0;
      } else if (!isGrounded) {
        // Explicit delta-based gravity: 34 m/s^2 on rise, 48 m/s^2 on fall
        // Guarantees snappy 0.45s jump airtime with immediate weighted descent!
        const gravity = vy > 0 ? 34.0 : 48.0;
        vy = Math.max(-28.0, vy - gravity * delta);
      }
    }

    // 8.5. World Border Hard Boundaries (Radial Perimeter & Height Ceiling/Floor)
    const MAX_BORDER_RADIUS = 27.2;
    const MAX_CEILING_Y = 25.5;
    const MIN_FLOOR_Y = 3.6;

    const horizDist = Math.hypot(pos.x, pos.z);
    let clampedX = pos.x;
    let clampedZ = pos.z;
    let clampedY = pos.y;
    let hitBorder = false;

    // Horizontal Radial Island Border
    if (horizDist > MAX_BORDER_RADIUS) {
      const angle = Math.atan2(pos.z, pos.x);
      clampedX = Math.cos(angle) * MAX_BORDER_RADIUS;
      clampedZ = Math.sin(angle) * MAX_BORDER_RADIUS;
      // Dampen outward velocity
      const outwardSpeed = vx * Math.cos(angle) + vz * Math.sin(angle);
      if (outwardSpeed > 0) {
        vx -= outwardSpeed * Math.cos(angle);
        vz -= outwardSpeed * Math.sin(angle);
      }
      hitBorder = true;
    }

    // Height Ceiling Border
    if (pos.y > MAX_CEILING_Y) {
      clampedY = MAX_CEILING_Y;
      vy = Math.min(0, vy);
      hitBorder = true;
    }

    // Ocean Floor / Water Surface Boundary
    if (pos.y < MIN_FLOOR_Y) {
      clampedY = MIN_FLOOR_Y;
      vy = Math.max(0, vy);
      hitBorder = true;
    }

    if (hitBorder) {
      bodyRef.current.setTranslation({ x: clampedX, y: clampedY, z: clampedZ }, true);
      if (performance.now() - lastBorderSoundTime.current > 600) {
        playBorderHit();
        lastBorderSoundTime.current = performance.now();
      }
    }

    bodyRef.current.setLinvel({ x: vx, y: vy, z: vz }, true);

    // 9. Camera Rig with Homecraft Exponential Damping
    if (stage === 'play') {
      const k = 1 - Math.exp(-delta * 22);
      cameraYaw.current += (yawGoal.current - cameraYaw.current) * k;
      cameraPitch.current += (pitchGoal.current - cameraPitch.current) * k;
      cameraDist.current += (distGoal.current - cameraDist.current) * k;

      // Dynamic Speed Rush FOV (authentic Minecraft sprint effect)
      const currentSpeed = Math.hypot(vx, vz);
      const targetFov = isRunning || currentSpeed > 14.0 ? 68 : 55;
      const persCamera = state.camera as THREE.PerspectiveCamera;
      if (persCamera.fov) {
        persCamera.fov += (targetFov - persCamera.fov) * (1 - Math.exp(-delta * 12));
        persCamera.updateProjectionMatrix();
      }

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
      gravityScale={0}
      linearDamping={0.0}
      name="player"
    >
      <CapsuleCollider args={[0.5, 0.3]} friction={0.1} restitution={0.0} name="player" />
      <group ref={visualRef} rotation={[0, Math.PI, 0]}>
        <PlayerModel isMoving={isMoving} />
        {!isFlying && <BlobShadow />}
      </group>
    </RigidBody>
  );
}
