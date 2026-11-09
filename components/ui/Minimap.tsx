'use client';

import React, { useState, useEffect } from 'react';
import { useGame, SectionId } from '@/lib/store';
import { stations } from '@/content/stations';
import { playClick } from '@/lib/sound';

export function Minimap() {
  const [expanded, setExpanded] = useState(false);
  const travelTo = useGame((s) => s.travelTo);
  const nearbyStation = useGame((s) => s.nearbyStation);
  const openSection = useGame((s) => s.openSection);
  const stage = useGame((s) => s.stage);

  // Player live position & heading read from window.__playerPos
  const [playerCoord, setPlayerCoord] = useState<{ x: number; z: number; heading: number }>({
    x: 0,
    z: 28,
    heading: 0,
  });

  useEffect(() => {
    let animId: number;
    const updateCoord = () => {
      if (typeof window !== 'undefined') {
        const p = (window as unknown as { __playerPos?: { x: number; z: number; rotY?: number } }).__playerPos;
        if (p) {
          setPlayerCoord({
            x: p.x,
            z: p.z,
            heading: p.rotY || 0,
          });
        }
      }
      animId = requestAnimationFrame(updateCoord);
    };
    animId = requestAnimationFrame(updateCoord);
    return () => cancelAnimationFrame(animId);
  }, []);

  if (openSection || stage === 'loading') return null;

  const size = expanded ? 220 : 110;
  const radius = size / 2;
  const scale = (radius * 0.8) / 30; // 30m world space to map bounds

  const worldToMap = (wx: number, wz: number) => {
    return {
      x: radius + wx * scale,
      y: radius + wz * scale,
    };
  };

  const pPos = worldToMap(playerCoord.x, playerCoord.z);

  return (
    <div className="fixed top-14 right-4 z-20 pointer-events-auto select-none transition-all duration-200">
      <div className="relative bg-[#1c1815]/90 border-2 border-[#8c6747] rounded-lg shadow-2xl p-1.5 backdrop-blur-md bevel">
        {/* Header / Toggle Button */}
        <div className="flex justify-between items-center px-1 mb-1 text-[9px] font-pixel text-[#ffb46b]">
          <span>Radar</span>
          <button
            onClick={() => {
              playClick();
              setExpanded(!expanded);
            }}
            aria-label={expanded ? 'Minimize radar' : 'Expand radar'}
            className="hover:text-white transition-colors cursor-pointer"
          >
            {expanded ? '▲ Small' : '▼ Big'}
          </button>
        </div>

        {/* Map SVG Canvas */}
        <svg
          width={size}
          height={size}
          className="rounded bg-[#2a4d2c]/40 border border-[#4a3525] overflow-hidden"
        >
          {/* Island Landmass Contour */}
          <circle
            cx={radius}
            cy={radius}
            r={radius * 0.82}
            fill="#3a602c"
            stroke="#5c8a3f"
            strokeWidth="1.5"
            opacity="0.85"
          />

          {/* Inner Central Plateau */}
          <circle
            cx={radius}
            cy={radius}
            r={radius * 0.45}
            fill="#4a7c38"
            stroke="#6da44b"
            strokeWidth="1"
            opacity="0.75"
          />

          {/* Compass North Indicator */}
          <text
            x={radius}
            y={12}
            textAnchor="middle"
            fill="#ffdd77"
            fontSize="9"
            fontWeight="bold"
            fontFamily="monospace"
          >
            N
          </text>

          {/* Stations Markers */}
          {stations.map((s) => {
            const pos = worldToMap(s.position[0], s.position[2]);
            const isNear = nearbyStation === s.id;
            return (
              <g
                key={s.id}
                onClick={(e) => {
                  e.stopPropagation();
                  playClick();
                  travelTo(s.id as SectionId);
                }}
                className="cursor-pointer group"
              >
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={isNear ? 5 : 3.5}
                  fill={isNear ? '#ffb46b' : s.id === 'register' ? '#a855f7' : '#ffd285'}
                  stroke="#1c1815"
                  strokeWidth="1"
                  className={isNear ? 'animate-ping' : ''}
                />
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={isNear ? 4.5 : 3}
                  fill={isNear ? '#ffb46b' : s.id === 'register' ? '#a855f7' : '#ffd285'}
                />
                {expanded && (
                  <text
                    x={pos.x}
                    y={pos.y - 6}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="7"
                    fontFamily="monospace"
                    className="drop-shadow-md pointer-events-none"
                  >
                    {s.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* Player Position & Direction Needle */}
          <g transform={`translate(${pPos.x}, ${pPos.y}) rotate(${(-playerCoord.heading * 180) / Math.PI})`}>
            {/* Player Aura Pulse */}
            <circle cx={0} cy={0} r={4} fill="#60a5fa" opacity="0.6" />
            {/* Direction Arrow */}
            <polygon points="0,-7 3.5,3 0,1 -3.5,3" fill="#ffffff" stroke="#1d4ed8" strokeWidth="0.8" />
          </g>
        </svg>

        {/* Footer Hint */}
        <div className="text-[8px] font-pixel text-gray-400 text-center mt-1">
          Click station to travel
        </div>
      </div>
    </div>
  );
}
