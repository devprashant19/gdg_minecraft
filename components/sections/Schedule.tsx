'use client';

import React from 'react';
import { schedule, event } from '@/content/index';

export function ScheduleSection() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center text-xs text-gray-400 border-b border-gray-700 pb-2">
        <span>Timezone: {event.timezone}</span>
        <span className="text-[#e5b83b]">36-Hour Hackathon</span>
      </div>

      <div className="space-y-2">
        {schedule.map((item) => (
          <div
            key={item.id}
            className="flex justify-between items-center p-3 bg-black/60 border border-gray-800 rounded bevel text-xs"
          >
            <div>
              <div className="font-bold text-white mb-0.5">{item.title}</div>
              <div className="text-[11px] text-gray-400">
                {item.room && <span className="mr-2">📍 {item.room}</span>}
                {item.speaker && <span>👤 {item.speaker}</span>}
              </div>
            </div>
            <div className="text-right font-mono text-[#ffb46b]">
              <div>
                {new Date(item.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="text-[10px] text-gray-500 uppercase">{item.type}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

