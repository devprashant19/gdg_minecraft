'use client';

import React, { useEffect, useRef } from 'react';
import { useGame, SectionId } from '@/lib/store';
import { stations } from '@/content/stations';
import { isTypingTarget } from '@/lib/typing-guard';
import { playClick } from '@/lib/sound';

export function Hotbar() {
  const nearbyStation = useGame((s) => s.nearbyStation);
  const openSection = useGame((s) => s.openSection);
  const visited = useGame((s) => s.visited);
  const travelTo = useGame((s) => s.travelTo);
  const buttonsRef = useRef<(HTMLButtonElement | null)[]>([]);

  // Global Key listeners for 1-9 hotbar fast-travel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTypingTarget(document.activeElement)) return;

      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= 9) {
        const target = stations.find((s) => s.hotbarSlot === num);
        if (target) {
          playClick();
          travelTo(target.id as SectionId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [travelTo]);

  const handleKeyDownToolbar = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const nextIdx = (index + 1) % stations.length;
      buttonsRef.current[nextIdx]?.focus();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prevIdx = (index - 1 + stations.length) % stations.length;
      buttonsRef.current[prevIdx]?.focus();
    }
  };

  return (
    <nav
      role="toolbar"
      aria-label="Island station hotbar"
      className="fixed bottom-3 left-1/2 -translate-x-1/2 z-30 pointer-events-auto max-w-[95vw] overflow-x-auto"
    >
      <div className="flex items-center gap-1.5 p-1.5 sm:p-2 bg-black/85 border-2 border-gray-700 rounded-lg shadow-2xl backdrop-blur-md bevel">
        {stations.map((s, index) => {
          const isNearby = nearbyStation === s.id;
          const isOpen = openSection === s.id;
          const isVisited = visited.includes(s.id as SectionId);

          return (
            <button
              key={s.id}
              ref={(el) => {
                buttonsRef.current[index] = el;
              }}
              onClick={() => {
                playClick();
                travelTo(s.id as SectionId);
              }}
              onKeyDown={(e) => handleKeyDownToolbar(e, index)}
              aria-label={`Slot ${s.hotbarSlot}: Go to ${s.label}`}
              title={`${s.label} (${s.hotbarSlot})`}
              className={`relative w-9 h-9 sm:w-11 sm:h-11 flex flex-col items-center justify-center rounded border-2 transition-all font-pixel text-xs cursor-pointer select-none ${
                isOpen
                  ? 'bg-amber-600/90 border-amber-300 text-white bevel-pressed shadow-inner'
                  : isNearby
                  ? 'bg-[#5b8c32]/90 border-[#6ba33b] text-white animate-pulse'
                  : 'bg-black/60 border-gray-700 hover:border-gray-500 text-gray-300'
              }`}
            >
              {/* Slot Number Badge */}
              <span className="absolute top-0.5 left-1 text-[8px] sm:text-[9px] text-gray-400 font-mono">
                {s.hotbarSlot}
              </span>

              {/* Icon Letter Initial */}
              <span className="text-xs sm:text-sm mt-1">{s.label[0]}</span>

              {/* Visited Green Indicator Dot */}
              {isVisited && (
                <span
                  aria-hidden="true"
                  className="absolute bottom-1 right-1 w-1.5 h-1.5 bg-[#41a85f] rounded-full shadow"
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
