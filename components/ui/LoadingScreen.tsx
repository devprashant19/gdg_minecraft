'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { playClick } from '@/lib/sound';

const TIPS = [
  'Press [1-9] on your keyboard to instantly fast-travel between stations.',
  'Walk straight into the obsidian portal at island center to register your team.',
  'Hold [Shift] to sprint along the perimeter slab trail.',
  'Press [?] at any time to open the full keyboard and mobile controls guide.',
  'Press [T] to fly the aerial guided tour of all 9 stations.',
  'Falling into the ocean will automatically respawn you safely at the dock.',
  'Need a break? Press [M] to mute or un-mute synthesized sound effects.',
];

// Inline procedural pixelated dirt texture (SVG Data URI) matching classic voxel aesthetics
const DIRT_BG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 16 16'%3E%3Crect width='16' height='16' fill='%2338271a'/%3E%3Crect x='0' y='0' width='4' height='4' fill='%23483322'/%3E%3Crect x='8' y='0' width='4' height='4' fill='%232c1e13'/%3E%3Crect x='4' y='4' width='4' height='4' fill='%2324180f'/%3E%3Crect x='12' y='4' width='4' height='4' fill='%23483322'/%3E%3Crect x='0' y='8' width='4' height='4' fill='%232c1e13'/%3E%3Crect x='8' y='8' width='4' height='4' fill='%23483322'/%3E%3Crect x='4' y='12' width='4' height='4' fill='%232c1e13'/%3E%3Crect x='12' y='12' width='4' height='4' fill='%2324180f'/%3E%3C/svg%3E")`;

interface LoadingScreenProps {
  isRendered?: boolean;
  onEnter: () => void;
}

export function LoadingScreen({ isRendered = false, onEnter }: LoadingScreenProps) {
  const [progress, setProgress] = useState(10);
  const [tipIndex, setTipIndex] = useState(0);
  const [statusText, setStatusText] = useState('Loading resources...');

  // Smooth progress animation that synchronizes with real GPU shader compilation
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (isRendered) {
          return 100;
        }
        if (prev < 35) {
          setStatusText('Building terrain...');
          return prev + 6;
        }
        if (prev < 70) {
          setStatusText('Generating chunks...');
          return prev + 4;
        }
        if (prev < 92) {
          setStatusText('Compiling shaders...');
          return prev + 2;
        }
        setStatusText('Finalizing world render...');
        return 94; // Hold at 94% until WebGL actually reports initial frames rendered
      });
    }, 120);

    return () => clearInterval(timer);
  }, [isRendered]);

  // Rotate tips
  useEffect(() => {
    const tipInterval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % TIPS.length);
    }, 3200);
    return () => clearInterval(tipInterval);
  }, []);

  const effectiveProgress = isRendered ? 100 : progress;
  const effectiveStatusText = isRendered ? 'Joining world...' : statusText;

  const handleJoin = () => {
    playClick();
    onEnter();
  };

  return (
    <div
      id="loading-screen"
      role="dialog"
      aria-modal="true"
      aria-label="Minecraft Loading Screen"
      className="fixed inset-0 z-50 flex flex-col items-center justify-between p-6 sm:p-12 text-white select-none font-mono-pixel"
      style={{
        backgroundImage: DIRT_BG,
        backgroundRepeat: 'repeat',
        backgroundSize: '48px 48px',
        imageRendering: 'pixelated',
      }}
    >
      {/* Dark Vignette Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] pointer-events-none" />

      {/* Header Spacer */}
      <div className="relative z-10 w-full flex justify-between items-center text-xs text-gray-400">
        <span className="font-pixel text-[10px] text-gray-500">CraftHacks 2026</span>
        <Link
          href="/2d"
          className="text-gray-400 hover:text-white underline text-xs transition-colors"
        >
          2D Accessible Version
        </Link>
      </div>

      {/* Center Section: Classic Minecraft Progress Bar & Title */}
      <div className="relative z-10 max-w-lg w-full flex flex-col items-center space-y-6 text-center">
        {/* Title */}
        <div className="space-y-2">
          <h1
            className="text-xl sm:text-2xl font-pixel text-white tracking-wide"
            style={{ textShadow: '2px 2px 0px #3f3f3f' }}
          >
            Loading world...
          </h1>
          <p
            className="text-xs sm:text-sm font-pixel text-gray-300"
            style={{ textShadow: '1px 1px 0px #222222' }}
          >
            {effectiveStatusText}
          </p>
        </div>

        {/* Authentic Minecraft Progress Bar */}
        <div className="w-full space-y-2">
          <div
            className="w-full h-6 bg-[#1a1a1a] border-2 border-[#808080] p-0.5 rounded-none"
            style={{
              boxShadow: 'inset 2px 2px 0px #000000, inset -2px -2px 0px #404040',
            }}
          >
            <div
              className="h-full bg-[#55ff55] transition-all duration-150"
              style={{
                width: `${Math.min(100, effectiveProgress)}%`,
                boxShadow: 'inset 0 1px 0 #aaffaa, inset 0 -1px 0 #22aa22',
              }}
            />
          </div>
          <div className="text-right text-xs font-pixel text-gray-400">
            {Math.min(100, Math.floor(effectiveProgress))}%
          </div>
        </div>

        {/* Action Button: Appears when scene is completely compiled & rendered */}
        <div className="w-full pt-4 min-h-[56px] flex justify-center">
          {isRendered ? (
            <button
              onClick={handleJoin}
              className="w-full sm:w-64 py-3 px-6 bg-[#707070] hover:bg-[#858585] active:bg-[#555555] text-white font-pixel text-xs border-2 border-t-white border-l-white border-b-black border-r-black cursor-pointer shadow-lg transition-transform active:translate-y-0.5"
              style={{
                textShadow: '1px 1px 0px #000000',
              }}
            >
              Join World
            </button>
          ) : (
            <div className="flex items-center gap-2 text-xs text-gray-400 font-pixel animate-pulse">
              <span>Generating voxel chunks...</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer: Survival Tips & Notice */}
      <div className="relative z-10 max-w-xl w-full text-center space-y-3">
        <div className="p-3 bg-black/60 border border-gray-700/60 rounded text-xs text-gray-300 font-mono-pixel">
          <span className="text-[#e5b83b] font-pixel mr-2">TIP:</span>
          {TIPS[tipIndex]}
        </div>
        <p className="text-[10px] text-gray-500">
          Not an official Minecraft product. Approved by nor associated with Mojang.
        </p>
      </div>
    </div>
  );
}
