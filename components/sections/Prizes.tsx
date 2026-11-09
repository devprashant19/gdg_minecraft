'use client';

import React from 'react';
import { prizes } from '@/content/index';

export function PrizesSection() {
  return (
    <div className="space-y-6">
      <div className="p-4 bg-amber-950/40 border-2 border-[#e5b83b] rounded text-center bevel">
        <div className="text-xs font-pixel text-[#e5b83b] mb-1">Total Prize Pool</div>
        <div className="text-2xl font-pixel text-white">{prizes.poolTotal}</div>
      </div>

      <div>
        <h3 className="text-xs font-pixel text-[#ffb46b] mb-3">Overall Podiums</h3>
        <div className="space-y-3">
          {prizes.tiers.map((t) => (
            <div key={t.id} className="p-4 bg-black/60 border border-gray-700 rounded bevel">
              <div className="flex justify-between items-center mb-1">
                <span className="font-pixel text-xs text-white">{t.tier}</span>
                <span className="font-pixel text-sm text-[#e5b83b]">{t.amount}</span>
              </div>
              <p className="text-xs text-gray-300 mb-2">{t.description}</p>
              <ul className="text-[11px] text-gray-400 list-disc list-inside space-y-0.5">
                {t.perks.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-pixel text-[#ffb46b] mb-3">Special Track Awards</h3>
        <div className="grid grid-cols-1 gap-2">
          {prizes.special.map((s) => (
            <div key={s.id} className="p-3 bg-black/50 border border-gray-800 rounded text-xs">
              <div className="flex justify-between items-center">
                <span className="font-bold text-white">{s.title}</span>
                <span className="text-[#5b8c32] font-pixel text-[11px]">{s.amount}</span>
              </div>
              <p className="text-gray-400 mt-1">{s.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-xs font-pixel text-[#ffb46b] mb-2">Participant Swag</h3>
        <div className="flex flex-wrap gap-2">
          {prizes.swag.map((item) => (
            <span key={item} className="text-xs px-3 py-1.5 bg-black/60 border border-gray-700 rounded text-gray-200">
              🎁 {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

