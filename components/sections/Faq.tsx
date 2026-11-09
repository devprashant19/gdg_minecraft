'use client';

import React from 'react';
import { faq } from '@/content/index';

export function FaqSection() {
  return (
    <div className="space-y-4">
      <p className="text-xs text-gray-300">
        Got questions? We have answers. If your question is not listed below, contact our organizers.
      </p>

      <div className="space-y-3">
        {faq.map((item) => (
          <div key={item.q} className="p-4 bg-black/60 border border-gray-700 rounded bevel">
            <h3 className="text-xs font-pixel text-[#e5b83b] mb-1.5">{item.q}</h3>
            <p className="text-xs text-gray-300 leading-relaxed">{item.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

