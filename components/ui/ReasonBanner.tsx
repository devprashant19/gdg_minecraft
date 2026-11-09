'use client';

import React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export function ReasonBanner() {
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason');

  if (!reason) return null;

  if (reason === 'forced') {
    return (
      <div
        role="alert"
        className="mb-6 p-4 bg-emerald-950/80 border-2 border-emerald-500 rounded-lg text-xs text-emerald-200 flex justify-between items-center bevel animate-fade-in"
      >
        <div>
          <strong>ℹ️ 2D Mode Active:</strong> You are currently viewing the lightweight 2D version of the hackathon portal.
        </div>
      </div>
    );
  }

  if (reason === 'webgl') {
    return (
      <div
        role="alert"
        className="mb-6 p-4 bg-amber-950/80 border-2 border-[#e5b83b] rounded-lg text-xs text-amber-200 flex justify-between items-center bevel animate-fade-in"
      >
        <div>
          <strong>ℹ️ 2D Accessible Mode:</strong> Your browser or device does not have WebGL2 acceleration enabled. Enjoy the complete lightweight experience below!
        </div>
        <Link
          href="/?force3d=1"
          className="px-3 py-1 bg-amber-700 hover:bg-amber-600 rounded text-white font-pixel text-[11px] whitespace-nowrap ml-4"
        >
          Try 3D Anyway
        </Link>
      </div>
    );
  }

  if (reason === 'motion') {
    return (
      <div
        role="alert"
        className="mb-6 p-4 bg-blue-950/80 border-2 border-blue-400 rounded-lg text-xs text-blue-200 flex justify-between items-center bevel animate-fade-in"
      >
        <div>
          <strong>ℹ️ Reduced Motion Mode:</strong> We detected your OS preference for reduced motion and loaded this accessible 2D layout.
        </div>
        <Link
          href="/?force3d=1"
          className="px-3 py-1 bg-blue-700 hover:bg-blue-600 rounded text-white font-pixel text-[11px] whitespace-nowrap ml-4"
        >
          Open 3D Island
        </Link>
      </div>
    );
  }

  return null;
}
