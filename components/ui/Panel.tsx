'use client';

import React, { useEffect, useRef } from 'react';
import { useGame, SectionId } from '@/lib/store';
import { sectionComponents, sectionTitles } from '@/components/sections';
import { stations } from '@/content/stations';

export function Panel() {
  const openSection = useGame((s) => s.openSection);
  const close = useGame((s) => s.close);
  const open = useGame((s) => s.open);
  const pendingNav = useGame((s) => s.pendingNav);
  const confirmNav = useGame((s) => s.confirmNav);
  const cancelNav = useGame((s) => s.cancelNav);

  const panelRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // Focus panel or close button on open
  useEffect(() => {
    if (openSection && closeBtnRef.current) {
      closeBtnRef.current.focus();
    }
  }, [openSection]);

  // Keyboard trap and Esc handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!openSection) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        if (pendingNav) {
          cancelNav();
        } else {
          close();
        }
        return;
      }

      if (e.key === 'Tab' && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openSection, close, pendingNav, cancelNav]);

  if (!openSection) return null;

  const ActiveComponent = sectionComponents[openSection] || null;
  const title = sectionTitles[openSection] || openSection;

  // Previous & Next station calculation in the loop
  const currentIndex = stations.findIndex((s) => s.id === openSection);
  const prevIndex = (currentIndex - 1 + stations.length) % stations.length;
  const nextIndex = (currentIndex + 1) % stations.length;
  const prevStation = stations[prevIndex]!;
  const nextStation = stations[nextIndex]!;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="panel-title"
      className="fixed inset-0 z-40 flex items-stretch justify-end bg-black/60 backdrop-blur-sm pointer-events-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        className="relative w-full sm:max-w-xl md:max-w-2xl bg-[#181425] border-l-4 border-[#e5b83b] flex flex-col justify-between shadow-2xl h-full overflow-hidden text-white outline-none animate-slide-left"
      >
        {/* Header */}
        <header className="p-4 sm:p-5 bg-black/70 border-b border-gray-700 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-base text-[#e5b83b]">✦</span>
            <h2 id="panel-title" className="text-sm sm:text-base font-pixel text-[#ffb46b]">
              {title}
            </h2>
          </div>
          <button
            ref={closeBtnRef}
            onClick={close}
            aria-label="Close panel"
            className="w-8 h-8 rounded bg-red-700 hover:bg-red-600 font-pixel text-xs text-white flex items-center justify-center bevel cursor-pointer transition-colors"
          >
            ✕
          </button>
        </header>

        {/* Scrollable Content Body */}
        <main className="p-4 sm:p-6 overflow-y-auto flex-1 font-mono-pixel text-sm">
          {ActiveComponent ? <ActiveComponent /> : <p>Loading section...</p>}
        </main>

        {/* Footer Station Loop Walk Navigation */}
        <footer className="p-4 bg-black/70 border-t border-gray-800 flex justify-between items-center text-xs">
          <button
            onClick={() => open(prevStation.id as SectionId)}
            aria-label={`Previous station: ${prevStation.label}`}
            className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 font-pixel text-[10px] sm:text-[11px] rounded bevel cursor-pointer"
          >
            ← {prevStation.label}
          </button>
          <span className="text-[10px] sm:text-[11px] text-gray-400 font-pixel">
            Slot {stations[currentIndex]?.hotbarSlot} / 9
          </span>
          <button
            onClick={() => open(nextStation.id as SectionId)}
            aria-label={`Next station: ${nextStation.label}`}
            className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 font-pixel text-[10px] sm:text-[11px] rounded bevel cursor-pointer"
          >
            {nextStation.label} →
          </button>
        </footer>

        {/* Unsaved Changes Form Dirty Confirmation Dialog */}
        {pendingNav && (
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-nav-title"
            className="absolute inset-0 z-50 bg-black/90 flex items-center justify-center p-6 backdrop-blur-sm"
          >
            <div className="bg-[#241e38] border-2 border-red-500 rounded-lg p-5 max-w-sm w-full text-center shadow-2xl bevel">
              <h3 id="confirm-nav-title" className="text-sm font-pixel text-red-400 mb-2">
                ⚠️ Discard Changes?
              </h3>
              <p className="text-xs text-gray-300 mb-4 font-mono-pixel">
                You have unsaved changes in your registration form. Leaving will lose your progress.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={confirmNav}
                  className="px-3 py-2 bg-red-700 hover:bg-red-600 font-pixel text-xs text-white rounded bevel cursor-pointer"
                >
                  Leave Anyway
                </button>
                <button
                  onClick={cancelNav}
                  className="px-3 py-2 bg-gray-700 hover:bg-gray-600 font-pixel text-xs text-gray-200 rounded bevel cursor-pointer"
                >
                  Stay
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
