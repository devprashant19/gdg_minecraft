'use client';

import React, { useState, useEffect } from 'react';
import { isTypingTarget } from '@/lib/typing-guard';

export function HelpOverlay() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTypingTarget(document.activeElement)) return;
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        setIsOpen((prev) => !prev);
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 right-36 z-30 px-2.5 py-1.5 bg-black/80 border-2 border-gray-700 hover:border-gray-500 rounded text-xs font-pixel text-white bevel pointer-events-auto"
        aria-label="Controls Help (?)"
      >
        ? Help
      </button>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard and touch controls help"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm pointer-events-auto"
    >
      <div className="max-w-md w-full bg-[#181425] border-4 border-[#e5b83b] p-6 rounded bevel shadow-2xl text-white">
        <div className="flex justify-between items-center border-b border-gray-700 pb-3 mb-4">
          <h2 className="text-sm font-pixel text-[#e5b83b]">🎮 Island Controls</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="px-2 py-1 bg-red-700 hover:bg-red-600 text-white font-pixel text-xs rounded bevel"
            aria-label="Close Help"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3 font-mono text-xs">
          <div>
            <span className="font-pixel text-[#5b8c32]">WASD / Arrows</span>: Move character (12.0 m/s walk, 18.5 m/s sprint)
          </div>
          <div>
            <span className="font-pixel text-[#5b8c32]">Shift</span>: Sprint / Speed Boost (with dynamic rush FOV)
          </div>
          <div>
            <span className="font-pixel text-[#5b8c32]">Space</span>: Jump (clears 1.4 blocks) / Climb in flight
          </div>
          <div>
            <span className="font-pixel text-[#5b8c32]">Ctrl / Shift</span>: Descend in flight / sneak
          </div>
          <div>
            <span className="font-pixel text-[#5b8c32]">F</span>: Toggle Creative Flight mode (or double-tap Space while midair)
          </div>
          <div>
            <span className="font-pixel text-[#5b8c32]">V</span>: Toggle 1st Person POV / 3rd Person
          </div>
          <div>
            <span className="font-pixel text-[#5b8c32]">Ctrl (Tap)</span>: Toggle Mouse Aim / Arrow Cursor
          </div>
          <div>
            <span className="font-pixel text-[#5b8c32]">E / F</span>: Interact with nearby station
          </div>
          <div>
            <span className="font-pixel text-[#5b8c32]">1 to 9</span>: Fast travel via hotbar
          </div>
          <div>
            <span className="font-pixel text-[#5b8c32]">R</span>: Respawn at dock
          </div>
          <div>
            <span className="font-pixel text-[#5b8c32]">Esc</span>: Close open panel
          </div>
          <div className="border-t border-gray-700 pt-2 text-gray-300">
            <span className="font-pixel text-[#ffb46b]">Mobile Touch</span>: Left stick to walk, right buttons to Run and Jump.
          </div>
        </div>

        <button
          onClick={() => setIsOpen(false)}
          className="mt-6 w-full py-2 bg-[#5b8c32] hover:bg-[#6ba33b] font-pixel text-xs text-white rounded bevel"
        >
          Close [Esc]
        </button>
      </div>
    </div>
  );
}

