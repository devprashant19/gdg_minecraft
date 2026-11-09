'use client';

import React from 'react';
import { tracks } from '@/content/index';

export function TracksSection() {
  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-300">
        Choose a track to focus your hackathon project. Each track is judged on innovation, technical depth, and impact.
      </p>

      <div className="grid grid-cols-1 gap-3">
        {tracks.map((track) => (
          <div
            key={track.slug}
            className="p-4 bg-black/60 border-2 border-gray-700 hover:border-[#5b8c32] rounded bevel transition-colors"
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xs font-pixel text-[#ffb46b]">{track.title}</h3>
              {track.sponsor && (
                <span className="text-[10px] px-2 py-0.5 bg-gray-800 text-[#e5b83b] rounded font-pixel">
                  Sponsored
                </span>
              )}
            </div>
            <p className="text-xs text-gray-300 mb-3">{track.summary}</p>
            <div className="flex flex-wrap gap-1">
              {track.ideas.map((idea) => (
                <span
                  key={idea}
                  className="text-[10px] px-2 py-0.5 bg-gray-900 border border-gray-700 text-gray-300 rounded"
                >
                  {idea}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

