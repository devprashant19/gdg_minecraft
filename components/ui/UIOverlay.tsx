'use client';

import React, { useEffect } from 'react';
import { useGame, SectionId } from '@/lib/store';
import { initTypingGuard, isTypingTarget } from '@/lib/typing-guard';
import { TouchControls } from './TouchControls';
import { HelpOverlay } from './HelpOverlay';
import { SettingsModal } from './SettingsModal';
import { ToastContainer } from './Toast';
import { Hotbar } from './Hotbar';
import { Panel } from './Panel';
import { Minimap } from './Minimap';
import { stations } from '@/content/stations';
import { playClick, playPanelOpen, playFlyToggle } from '@/lib/sound';
import { trackEvent } from '@/lib/analytics';

export function UIOverlay() {
  const nearbyStation = useGame((s) => s.nearbyStation);
  const openSection = useGame((s) => s.openSection);
  const stage = useGame((s) => s.stage);
  const open = useGame((s) => s.open);
  const setStage = useGame((s) => s.setStage);
  const markTourSeen = useGame((s) => s.markTourSeen);
  const soundOn = useGame((s) => s.soundOn);
  const toggleSound = useGame((s) => s.toggleSound);
  const mouseAimLocked = useGame((s) => s.mouseAimLocked);

  const isFlying = useGame((s) => s.isFlying);
  const setIsFlying = useGame((s) => s.setIsFlying);
  const isFirstPerson = useGame((s) => s.isFirstPerson);
  const toggleFirstPerson = useGame((s) => s.toggleFirstPerson);
  const timeMood = useGame((s) => s.timeMood);
  const cycleTimeMood = useGame((s) => s.cycleTimeMood);

  useEffect(() => {
    const cleanup = initTypingGuard();
    return cleanup;
  }, []);

  // Track station open analytics event
  useEffect(() => {
    if (openSection) {
      trackEvent('station_open', { id: openSection, via: 'user' });
    }
  }, [openSection]);

  // Global Key listeners for 'F', 'E', 'Enter', 'V', 'T' (Tour), and 'M' (Mute toggle)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTypingTarget(document.activeElement)) return;

      if (
        (e.code === 'KeyE' || e.code === 'Enter') &&
        nearbyStation &&
        !openSection
      ) {
        e.preventDefault();
        playPanelOpen();
        open(nearbyStation);
      }

      if (e.code === 'KeyT' && stage === 'play' && !openSection) {
        e.preventDefault();
        playClick();
        setStage('tour');
      }

      if (e.code === 'KeyM' && !openSection) {
        e.preventDefault();
        toggleSound();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nearbyStation, openSection, stage, open, setStage, toggleSound]);

  const activeNearbyStation = stations.find((s) => s.id === nearbyStation);

  const moodLabels = {
    day: '☀️ Day',
    sunset: '🌅 Sunset',
    night: '🌙 Night',
  };

  return (
    <>
      {/* Minecraft Crosshair in Center Screen for First-Person POV */}
      {isFirstPerson && stage === 'play' && !openSection && (
        <div className="fixed inset-0 pointer-events-none z-10 flex items-center justify-center">
          <div className="relative w-4 h-4 flex items-center justify-center opacity-80">
            <div className="w-0.5 h-3.5 bg-white drop-shadow" />
            <div className="absolute h-0.5 w-3.5 bg-white drop-shadow" />
          </div>
        </div>
      )}

      {/* Radar Minimap */}
      <Minimap />

      <div className="fixed inset-0 pointer-events-none z-20 flex flex-col justify-between p-4">
        {/* Top Header Bar */}
        <header className="flex justify-between items-center w-full">
          <div className="flex items-center gap-2 pointer-events-auto">
            <div className="px-3 py-1.5 bg-black/80 border-2 border-gray-700 rounded text-xs font-pixel text-[#e5b83b] shadow">
              CraftHacks Island
            </div>
            <button
              onClick={() => {
                playClick();
                setStage('tour');
              }}
              aria-label="Start island tour"
              className="px-3 py-1.5 bg-black/80 border-2 border-gray-700 hover:border-gray-500 rounded text-xs font-pixel text-gray-200 bevel transition-colors cursor-pointer"
            >
              Tour (T)
            </button>
            <button
              onClick={() => {
                playClick();
                toggleFirstPerson();
              }}
              aria-label={isFirstPerson ? 'Switch to 3rd person (V)' : 'Switch to 1st person (V)'}
              className="px-3 py-1.5 bg-black/80 border-2 border-gray-700 hover:border-gray-500 rounded text-xs font-pixel text-gray-200 bevel transition-colors cursor-pointer"
            >
              {isFirstPerson ? '👤 3rd (V)' : '👁️ 1st (V)'}
            </button>
            <button
              onClick={() => {
                playClick();
                cycleTimeMood();
              }}
              aria-label="Cycle time of day"
              className="px-3 py-1.5 bg-black/80 border-2 border-gray-700 hover:border-gray-500 rounded text-xs font-pixel text-amber-200 bevel transition-colors cursor-pointer"
            >
              {moodLabels[timeMood]}
            </button>
            <button
              onClick={() => {
                const next = !isFlying;
                setIsFlying(next);
                playFlyToggle(next);
              }}
              aria-label={isFlying ? 'Land (Double Space)' : 'Creative Flight (Double Space)'}
              className={`px-3 py-1.5 border-2 rounded text-xs font-pixel bevel transition-colors cursor-pointer ${
                isFlying
                  ? 'bg-cyan-700/90 border-cyan-300 text-white animate-pulse'
                  : 'bg-black/80 border-gray-700 hover:border-gray-500 text-gray-200'
              }`}
            >
              {isFlying ? '🛬 Land' : '✈️ Fly'}
            </button>
          </div>

          <div className="flex gap-2 pointer-events-auto items-center mr-32 sm:mr-0">
            <SettingsModal />
            <HelpOverlay />
            <button
              onClick={() => {
                toggleSound();
              }}
              aria-label={soundOn ? 'Mute sound (M)' : 'Enable sound (M)'}
              className="px-3 py-1.5 bg-black/80 border-2 border-gray-700 hover:border-gray-500 rounded text-xs font-pixel text-white bevel transition-colors cursor-pointer"
            >
              {soundOn ? '🔊 Audio ON (M)' : '🔇 Audio OFF (M)'}
            </button>
            <a
              href="/2d"
              className="px-3 py-1.5 bg-black/80 border-2 border-gray-700 hover:border-gray-500 rounded text-xs font-pixel text-gray-300 bevel transition-colors cursor-pointer"
            >
              2D View
            </a>
          </div>
        </header>

        {/* Mouse Aim / Cursor Hint */}
        {stage === 'play' && !openSection && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 pointer-events-none transition-opacity duration-300">
            <div className="px-3 py-1.5 bg-black/80 border border-gray-700/80 rounded-md text-[11px] font-pixel text-gray-300 shadow-md backdrop-blur-xs flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${mouseAimLocked ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              {mouseAimLocked ? (
                <span>Mouse Aim Active · Press <kbd className="px-1 py-0.5 bg-gray-800 border border-gray-600 rounded text-[#ffb46b] font-bold">Ctrl</kbd> for Cursor</span>
              ) : (
                <span>Arrow Cursor Active · Press <kbd className="px-1 py-0.5 bg-gray-800 border border-gray-600 rounded text-[#ffb46b] font-bold">Ctrl</kbd> or Click Island to Aim / Walk</span>
              )}
            </div>
          </div>
        )}

        {/* Creative Flight Banner */}
        {isFlying && stage === 'play' && !openSection && (
          <div className="absolute top-28 left-1/2 -translate-x-1/2 pointer-events-none transition-opacity duration-300">
            <div className="px-3.5 py-1.5 bg-blue-950/90 border border-cyan-500/80 rounded-md text-[11px] font-pixel text-cyan-200 shadow-lg flex items-center gap-2 backdrop-blur-xs">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>✈️ Flight Active · [Space] Up · [Ctrl/Shift] Down · [Shift] Boost · [F] Land</span>
            </div>
          </div>
        )}

        {/* Guided Tour Banner */}
        {stage === 'tour' && (
          <div className="flex flex-col items-center justify-center pointer-events-auto">
            <div className="p-4 bg-black/90 border-2 border-[#e5b83b] rounded-lg shadow-2xl text-center max-w-md animate-fade-in">
              <h2 className="text-sm font-pixel text-[#ffb46b] mb-2">
                🏝️ Guided Island Tour
              </h2>
              <p className="text-xs text-gray-300 mb-4 font-mono-pixel">
                Flying through all 9 island stations. Look around or explore at your own pace!
              </p>
              <button
                onClick={() => {
                  playClick();
                  setStage('play');
                  markTourSeen();
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white font-pixel text-xs rounded bevel shadow transition-transform active:scale-95 cursor-pointer"
              >
                Skip Tour (Esc / Click)
              </button>
            </div>
          </div>
        )}

        {/* Station Interaction Prompt */}
        <div className="flex flex-col items-center justify-center">
          {activeNearbyStation && !openSection && stage === 'play' && (
            <div className="flex flex-col items-center gap-2 pointer-events-auto animate-bounce">
              <button
                onClick={() => {
                  playPanelOpen();
                  open(activeNearbyStation.id as SectionId);
                }}
                aria-label={`Open ${activeNearbyStation.label}`}
                className="px-5 py-2.5 min-h-[48px] bg-black/95 border-2 border-[#e5b83b] hover:border-white rounded-lg font-pixel text-xs text-white bevel shadow-xl flex items-center gap-2 transition-transform active:scale-95 cursor-pointer"
              >
                <span>Press</span>
                <span className="text-[#e5b83b] font-bold text-sm">[E]</span>
                <span>to Open {activeNearbyStation.label}</span>
              </button>
            </div>
          )}
        </div>

        {/* Accessible live announcement region */}
        <div role="status" aria-live="polite" className="sr-only">
          {activeNearbyStation
            ? `Near ${activeNearbyStation.label} station. Press E to interact.`
            : ''}
        </div>

        {/* Bottom Bar / Notification space */}
        <footer className="flex justify-between items-end w-full text-xs text-gray-400">
          <div className="px-2 py-1 bg-black/60 rounded hidden sm:block">
            WASD Walk · Shift Sprint · Space Jump/Up · Ctrl/Shift Down · F Fly · Ctrl Aim · V 1st-Person · R Respawn
          </div>
          <div className="px-2 py-1 bg-black/60 rounded">
            [E] Open · [F] Fly · [?] Help · [1-9] Travel · [T] Tour · [M] Mute
          </div>
        </footer>
      </div>

      {/* Advancement Toasts (Top-Right) */}
      <ToastContainer />

      {/* 9-Slot Bottom Hotbar */}
      <Hotbar />

      {/* Slide-out / Modal Content Panel */}
      <Panel />

      {/* Mobile On-Screen Virtual Controls */}
      <TouchControls />
    </>
  );
}
