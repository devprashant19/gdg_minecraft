'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useGame } from '@/lib/store';
import { playAdvancement } from '@/lib/sound';

export interface ToastItem {
  id: string;
  title: string;
  description: string;
  icon?: string;
}

// Global toast trigger helper for any part of the app
type ToastListener = (toast: ToastItem) => void;
const listeners = new Set<ToastListener>();

export function showToast(toast: Omit<ToastItem, 'id'>) {
  const item: ToastItem = { ...toast, id: Math.random().toString(36).slice(2) };
  listeners.forEach((fn) => fn(item));
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [paused, setPaused] = useState(false);
  const reducedMotion = useGame((s) => s.reducedMotion);
  const visited = useGame((s) => s.visited);
  const tourSeen = useGame((s) => s.tourSeen);

  const addToast = useCallback((toast: ToastItem) => {
    setToasts((prev) => [...prev, toast]);
    playAdvancement();
  }, []);

  useEffect(() => {
    listeners.add(addToast);
    return () => {
      listeners.delete(addToast);
    };
  }, [addToast]);

  // Milestone triggers
  useEffect(() => {
    if (visited.length === 1) {
      showToast({
        title: 'Advancement Made!',
        description: 'First Steps: Visited your first station',
        icon: '🧭',
      });
    } else if (visited.length === 9) {
      showToast({
        title: 'Challenge Complete!',
        description: 'Island Explorer: Unlocked all 9 stations',
        icon: '🏆',
      });
    }
  }, [visited.length]);

  useEffect(() => {
    if (tourSeen) {
      showToast({
        title: 'Advancement Made!',
        description: 'World Tourist: Completed the island flyover tour',
        icon: '✈️',
      });
    }
  }, [tourSeen]);

  // Auto-dismiss oldest toast every 5 seconds unless hovered
  useEffect(() => {
    if (paused || toasts.length === 0) return;
    const timer = setTimeout(() => {
      setToasts((prev) => prev.slice(1));
    }, 5000);
    return () => clearTimeout(timer);
  }, [toasts, paused]);

  if (toasts.length === 0) return null;

  return (
    <aside
      role="status"
      aria-live="polite"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="fixed top-16 right-4 z-50 flex flex-col gap-2 pointer-events-auto max-w-sm"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`p-3 bg-black/95 border-2 border-[#e5b83b] rounded-lg shadow-2xl flex items-start gap-3 bevel ${
            reducedMotion ? 'animate-fade-in' : 'animate-slide-left'
          }`}
        >
          <div className="text-2xl select-none">{toast.icon || '🏅'}</div>
          <div className="flex-1">
            <h4 className="text-xs font-pixel text-[#ffb46b] uppercase tracking-wide">
              {toast.title}
            </h4>
            <p className="text-xs text-gray-200 font-mono-pixel mt-0.5">
              {toast.description}
            </p>
          </div>
          <button
            onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
            className="text-gray-400 hover:text-white text-xs font-pixel"
            aria-label="Dismiss toast"
          >
            ✕
          </button>
        </div>
      ))}
    </aside>
  );
}

