'use client';

import React, { useState } from 'react';
import { useGame, QualityTier } from '@/lib/store';

export function SettingsModal() {
  const [open, setOpen] = useState(false);

  const qualityTier = useGame((s) => s.qualityTier);
  const setQualityTier = useGame((s) => s.setQualityTier);
  const timeOfDay = useGame((s) => s.timeOfDay);
  const setTimeOfDay = useGame((s) => s.setTimeOfDay);
  const soundOn = useGame((s) => s.soundOn);
  const toggleSound = useGame((s) => s.toggleSound);
  const reducedMotion = useGame((s) => s.reducedMotion);
  const setReducedMotion = useGame((s) => s.setReducedMotion);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open settings"
        className="px-2.5 py-1.5 bg-black/80 border-2 border-gray-700 hover:border-gray-500 rounded text-xs font-pixel text-gray-200 bevel transition-colors cursor-pointer"
      >
        ⚙️
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="settings-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm pointer-events-auto select-none font-mono-pixel"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="bg-[#181425] border-2 border-[#e5b83b] rounded-lg max-w-md w-full p-5 space-y-4 shadow-2xl bevel text-white">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <h3 id="settings-title" className="text-sm font-pixel text-[#ffb46b]">
                Island Settings
              </h3>
              <button
                onClick={() => setOpen(false)}
                className="w-6 h-6 rounded bg-red-800 hover:bg-red-700 font-pixel text-xs flex items-center justify-center text-white"
                aria-label="Close settings"
              >
                ✕
              </button>
            </div>

            {/* Quality Tier Selector */}
            <div className="space-y-1.5 text-xs">
              <label className="block text-gray-400 font-pixel text-[11px]">
                Graphics Tier
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['high', 'medium', 'low'] as QualityTier[]).map((tier) => (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => setQualityTier(tier)}
                    className={`py-1.5 px-2 rounded border text-xs font-pixel capitalize cursor-pointer ${
                      qualityTier === tier
                        ? 'bg-amber-600 border-amber-300 text-white'
                        : 'bg-black/40 border-gray-700 text-gray-400 hover:border-gray-500'
                    }`}
                  >
                    {tier}
                  </button>
                ))}
              </div>
            </div>

            {/* Atmosphere / Time of Day Preset */}
            <div className="space-y-1.5 text-xs">
              <label className="block text-gray-400 font-pixel text-[11px]">
                Atmosphere & Lighting
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { label: 'Golden', t: 0.72 },
                  { label: 'Noon', t: 0.5 },
                  { label: 'Dusk', t: 0.82 },
                  { label: 'Night', t: 0.0 },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setTimeOfDay(item.t)}
                    className={`py-1.5 px-1 text-[11px] font-pixel rounded border cursor-pointer ${
                      Math.abs(timeOfDay - item.t) < 0.05
                        ? 'bg-amber-600 border-amber-300 text-white'
                        : 'bg-black/40 border-gray-700 text-gray-400 hover:border-gray-500'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sound Toggle */}
            <div className="flex justify-between items-center py-2 border-y border-gray-800 text-xs">
              <div>
                <div className="font-pixel text-gray-200 text-[11px]">Audio Synthesis</div>
                <div className="text-[10px] text-gray-400">Synthesized 8-bit Web Audio</div>
              </div>
              <button
                type="button"
                onClick={toggleSound}
                className={`px-3 py-1 text-xs font-pixel rounded border cursor-pointer ${
                  soundOn
                    ? 'bg-green-700 border-green-400 text-white'
                    : 'bg-gray-800 border-gray-700 text-gray-400'
                }`}
              >
                {soundOn ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* Reduced Motion Toggle */}
            <div className="flex justify-between items-center py-2 border-b border-gray-800 text-xs">
              <div>
                <div className="font-pixel text-gray-200 text-[11px]">Reduced Motion</div>
                <div className="text-[10px] text-gray-400">Disable camera flyovers & sways</div>
              </div>
              <button
                type="button"
                onClick={() => setReducedMotion(!reducedMotion)}
                className={`px-3 py-1 text-xs font-pixel rounded border cursor-pointer ${
                  reducedMotion
                    ? 'bg-amber-700 border-amber-400 text-white'
                    : 'bg-gray-800 border-gray-700 text-gray-400'
                }`}
              >
                {reducedMotion ? 'ON' : 'OFF'}
              </button>
            </div>

            <div className="pt-2 text-center">
              <button
                onClick={() => setOpen(false)}
                className="w-full py-2 bg-gray-800 hover:bg-gray-700 font-pixel text-xs text-gray-200 rounded bevel cursor-pointer"
              >
                Close Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

