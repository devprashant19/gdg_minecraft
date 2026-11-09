'use client';

import React, { useRef, useSyncExternalStore } from 'react';
import { useGame } from '@/lib/store';

function checkIsTouch(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
}

export function TouchControls() {
  const isTouchDevice = useSyncExternalStore(() => () => {}, checkIsTouch, () => false);
  const openSection = useGame((s) => s.openSection);
  const activeTouches = useRef<Map<number, { startX: number; startY: number }>>(new Map());

  if (!isTouchDevice || openSection !== null) {
    return null;
  }

  const triggerKey = (code: string, pressed: boolean) => {
    const event = new KeyboardEvent(pressed ? 'keydown' : 'keyup', {
      code,
      bubbles: true,
    });
    window.dispatchEvent(event);
  };

  const handleJoystickStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.changedTouches[0];
    if (touch) {
      activeTouches.current.set(touch.identifier, { startX: touch.clientX, startY: touch.clientY });
    }
  };

  const handleJoystickMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.changedTouches[0];
    if (!touch) return;
    const start = activeTouches.current.get(touch.identifier);
    if (!start) return;

    const dx = touch.clientX - start.startX;
    const dy = touch.clientY - start.startY;
    const threshold = 18;

    triggerKey('KeyW', dy < -threshold);
    triggerKey('KeyS', dy > threshold);
    triggerKey('KeyA', dx < -threshold);
    triggerKey('KeyD', dx > threshold);
  };

  const handleJoystickEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.changedTouches[0];
    if (touch) {
      activeTouches.current.delete(touch.identifier);
    }
    triggerKey('KeyW', false);
    triggerKey('KeyS', false);
    triggerKey('KeyA', false);
    triggerKey('KeyD', false);
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-30 select-none pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
      {/* Virtual Joystick (Bottom Left) */}
      <div
        className="absolute bottom-6 left-6 w-32 h-32 rounded-full bg-black/45 border-2 border-white/30 flex items-center justify-center pointer-events-auto touch-none"
        onTouchStart={handleJoystickStart}
        onTouchMove={handleJoystickMove}
        onTouchEnd={handleJoystickEnd}
        onTouchCancel={handleJoystickEnd}
        aria-label="Directional Movement Joystick"
        role="button"
        tabIndex={0}
      >
        <div className="w-14 h-14 rounded-full bg-white/40 border border-white/60 pointer-events-none" />
      </div>

      {/* Action Buttons (Bottom Right) */}
      <div className="absolute bottom-6 right-6 flex flex-col gap-3 pointer-events-auto">
        <button
          onTouchStart={() => triggerKey('ShiftLeft', true)}
          onTouchEnd={() => triggerKey('ShiftLeft', false)}
          className="w-16 h-16 rounded-full bg-amber-600/80 active:bg-amber-500 border-2 border-amber-300 font-pixel text-xs text-white shadow-lg flex items-center justify-center bevel"
          aria-label="Sprint"
        >
          RUN
        </button>
        <button
          onTouchStart={() => triggerKey('Space', true)}
          onTouchEnd={() => triggerKey('Space', false)}
          className="w-16 h-16 rounded-full bg-emerald-600/80 active:bg-emerald-500 border-2 border-emerald-300 font-pixel text-xs text-white shadow-lg flex items-center justify-center bevel"
          aria-label="Jump"
        >
          JUMP
        </button>
      </div>
    </div>
  );
}
