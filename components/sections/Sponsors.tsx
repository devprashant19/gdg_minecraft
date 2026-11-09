'use client';

import React from 'react';
import { sponsors } from '@/content/index';

export function SponsorsSection() {
  return (
    <div className="space-y-6">
      <p className="text-xs text-gray-300">
        Empowering creators and developers on the voxel island. Learn about our sponsors and explore API integrations.
      </p>

      <div className="grid grid-cols-2 gap-3">
        {sponsors.sponsors.map((s) => (
          <a
            key={s.id}
            href={s.url}
            target="_blank"
            rel="noreferrer"
            className="p-4 bg-black/60 border-2 border-gray-700 hover:border-[#ffb46b] rounded bevel text-center transition-colors flex flex-col justify-between items-center h-28"
          >
            <div className="text-xs font-bold text-white mt-2">{s.name}</div>
            <div className="text-[10px] uppercase font-pixel text-[#e5b83b]">{s.tier}</div>
          </a>
        ))}
      </div>

      {sponsors.sponsorDeckUrl && (
        <div className="p-4 bg-black/40 border border-gray-800 rounded text-center">
          <p className="text-xs text-gray-300 mb-3">Want to sponsor CraftHacks 2026?</p>
          <a
            href={sponsors.sponsorDeckUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-block px-4 py-2 bg-[#5b8c32] hover:bg-[#6ba33b] font-pixel text-xs text-white rounded bevel"
          >
            Download Sponsorship Deck
          </a>
        </div>
      )}
    </div>
  );
}

