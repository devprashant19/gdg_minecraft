import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#110e1b] flex flex-col items-center justify-center p-6 text-center text-white font-mono-pixel">
      <div className="max-w-md w-full space-y-5 p-8 bg-black/60 border-2 border-[#e5b83b] rounded-lg bevel shadow-2xl">
        <div className="text-4xl">🧱</div>
        <h1 className="text-base font-pixel text-[#ffb46b]">This chunk didn&apos;t load!</h1>
        <p className="text-xs text-gray-300">
          The coordinates you entered led to an empty ocean void or an unrendered chunk (404).
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-3">
          <Link
            href="/"
            className="px-4 py-2 bg-[#5b8c32] hover:bg-[#6ba33b] font-pixel text-xs text-white rounded bevel shadow transition-transform active:scale-95"
          >
            🏝️ Spawn at Dock
          </Link>
          <Link
            href="/2d"
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 font-pixel text-xs text-gray-200 rounded bevel shadow transition-transform active:scale-95"
          >
            📜 2D Event Guide
          </Link>
        </div>
      </div>
    </div>
  );
}

