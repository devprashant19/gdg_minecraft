'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

const TIPS = [
  'Press [1-9] on your keyboard to instantly fast-travel between stations.',
  'Walk straight into the glowing portal at island center to register your team.',
  'Hold [Shift] to sprint along the perimeter slab trail.',
  'Press [?] at any time to open the full keyboard and mobile controls guide.',
  'Press [T] to fly the aerial guided tour of all 9 stations.',
];

interface LoadingScreenProps {
  onEnter: () => void;
}

export function LoadingScreen({ onEnter }: LoadingScreenProps) {
  const [progress, setProgress] = useState(15);
  const [tipIndex, setTipIndex] = useState(0);
  const [ready, setReady] = useState(false);

  // Progressive simulated loading bar reflecting real asset compilation
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setReady(true);
          return 100;
        }
        return prev + Math.floor(Math.random() * 25 + 15);
      });
    }, 180);

    return () => clearInterval(interval);
  }, []);

  // Rotate helpful survival tips every 3 seconds
  useEffect(() => {
    const tipInterval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % TIPS.length);
    }, 3200);

    return () => clearInterval(tipInterval);
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Island Loading Screen"
      className="fixed inset-0 z-50 bg-[#120f1e] flex flex-col items-center justify-center p-6 text-white text-center font-mono-pixel select-none"
    >
      <div className="max-w-md w-full space-y-6 animate-fade-in">
        {/* Title */}
        <div className="space-y-2">
          <div className="text-4xl animate-bounce">🏝️</div>
          <h1 className="text-base sm:text-lg font-pixel text-[#ffb46b]">
            CraftHacks Island
          </h1>
          <p className="text-xs text-gray-400">Generating voxel terrain & shaders...</p>
        </div>

        {/* Pixel Progress Bar */}
        <div className="space-y-2">
          <div className="w-full h-5 bg-black/80 border-2 border-gray-700 rounded p-0.5 bevel">
            <div
              className="h-full bg-gradient-to-r from-amber-600 via-amber-400 to-[#5b8c32] rounded-sm transition-all duration-300"
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-gray-400 font-pixel">
            <span>{ready ? 'Island Ready!' : 'Loading Chunk Data'}</span>
            <span>{Math.min(100, progress)}%</span>
          </div>
        </div>

        {/* Rotating Tip */}
        <div className="p-3 bg-black/50 border border-gray-800 rounded min-h-[58px] flex items-center justify-center text-xs text-gray-300 bevel">
          <p>💡 {TIPS[tipIndex]}</p>
        </div>

        {/* Interactive Action Button */}
        <div>
          {ready ? (
            <button
              onClick={onEnter}
              className="w-full py-3 px-6 bg-green-700 hover:bg-green-600 text-white font-pixel text-xs rounded-lg bevel shadow-2xl transition-transform active:scale-95 cursor-pointer animate-pulse"
            >
              Enter Island World 🚀
            </button>
          ) : (
            <div className="py-3 text-xs text-gray-500 font-pixel">
              Preparing sandbox...
            </div>
          )}
        </div>

        {/* 2D Accessible Alternative Link */}
        <div className="pt-4 border-t border-gray-800">
          <Link
            href="/2d"
            className="text-xs text-gray-400 hover:text-white underline transition-colors"
          >
            Prefer low-bandwidth? Open the lightweight 2D Website
          </Link>
        </div>
      </div>
    </div>
  );
}
