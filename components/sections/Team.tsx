'use client';

import React from 'react';
import { team } from '@/content/index';

export function TeamSection() {
  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-300">
        Meet the organizing crew, judges, and mentors running CraftHacks 2026.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {team.map((member) => (
          <div key={member.name} className="p-4 bg-black/60 border border-gray-700 rounded bevel flex flex-col justify-between">
            <div>
              <div className="text-xs font-pixel text-[#ffb46b] mb-1">{member.name}</div>
              <div className="text-xs font-bold text-[#5b8c32] mb-2">{member.role}</div>
              {member.bio && <p className="text-xs text-gray-300 mb-3">{member.bio}</p>}
            </div>

            {member.links && (
              <div className="flex gap-2 pt-2 border-t border-gray-800 text-[11px]">
                {Object.entries(member.links).map(([platform, link]) => (
                  <a
                    key={platform}
                    href={link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-gray-400 hover:text-white capitalize underline"
                  >
                    {platform}
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

