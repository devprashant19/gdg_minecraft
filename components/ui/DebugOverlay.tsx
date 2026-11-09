'use client';

import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { useGame } from '@/lib/store';
import { useThree, useFrame } from '@react-three/fiber';

export function DebugStats() {
  const { gl } = useThree();
  const [stats, setStats] = useState({
    fps: 0,
    calls: 0,
    triangles: 0,
    geometries: 0,
    textures: 0,
  });

  const nearbyStation = useGame((s) => s.nearbyStation);
  const openSection = useGame((s) => s.openSection);
  const qualityTier = useGame((s) => s.qualityTier);
  const stage = useGame((s) => s.stage);

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();

    const interval = setInterval(() => {
      const now = performance.now();
      const delta = (now - lastTime) / 1000;
      const fps = Math.round(frameCount / delta);
      frameCount = 0;
      lastTime = now;

      setStats({
        fps,
        calls: gl.info.render.calls,
        triangles: gl.info.render.triangles,
        geometries: gl.info.memory.geometries,
        textures: gl.info.memory.textures,
      });
    }, 500);

    return () => clearInterval(interval);
  }, [gl]);

  useFrame(() => {
    // Keeps three render loop ticking for debug calculation
  });

  return (
    <div className="fixed bottom-4 left-4 z-50 p-3 bg-black/85 border-2 border-emerald-500 rounded font-mono text-xs text-emerald-400 shadow-lg pointer-events-auto">
      <div className="font-bold text-white mb-1 border-b border-gray-700 pb-1">
        ⚡ 3D Engine Debug (?debug)
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
        <div>FPS: <span className="text-white">{stats.fps || 60}</span></div>
        <div>Draw Calls: <span className="text-white">{stats.calls}</span></div>
        <div>Triangles: <span className="text-white">{stats.triangles}</span></div>
        <div>Textures: <span className="text-white">{stats.textures}</span></div>
        <div>Geometries: <span className="text-white">{stats.geometries}</span></div>
        <div>Tier: <span className="text-white uppercase">{qualityTier}</span></div>
        <div>Stage: <span className="text-white">{stage}</span></div>
        <div>Nearby: <span className="text-white">{nearbyStation || 'none'}</span></div>
        <div className="col-span-2">Open: <span className="text-white">{openSection || 'none'}</span></div>
      </div>
    </div>
  );
}

function checkIsDebug(): boolean {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).has('debug');
}

export default function DebugOverlay() {
  const isDebug = useSyncExternalStore(() => () => {}, checkIsDebug, () => false);

  if (!isDebug) return null;
  return null;
}
