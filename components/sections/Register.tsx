'use client';

import React, { Suspense } from 'react';
import { RegisterForm } from '@/components/ui/RegisterForm';

export function RegisterSection() {
  return (
    <div className="space-y-4 p-2 sm:p-4">
      <div className="text-center mb-6">
        <h3 className="text-sm sm:text-base font-pixel text-[#ffb46b] mb-1">
          Ancient Island Portal
        </h3>
        <p className="text-xs text-gray-400 font-mono-pixel max-w-sm mx-auto">
          Assemble your party of 2 to 4 hackers and register for CraftHacks 2026.
        </p>
      </div>

      <Suspense fallback={<div className="p-6 text-center text-xs font-pixel text-gray-400">Loading registration portal...</div>}>
        <RegisterForm />
      </Suspense>
    </div>
  );
}
