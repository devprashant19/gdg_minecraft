import React from 'react';
import { event } from '@/content/index';

export function Hero() {
  return (
    <section className="relative z-10 flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="max-w-3xl p-6 md:p-8 bg-black/80 border-4 border-[#5b8c32] rounded-lg bevel backdrop-blur-sm">
        <span className="inline-block px-3 py-1 mb-4 text-xs font-pixel bg-[#e5b83b] text-black rounded">
          {event.organizer} Presents
        </span>
        <h1 className="text-2xl sm:text-4xl md:text-5xl font-pixel text-[#ffb46b] mb-4 tracking-tight drop-shadow-md">
          {event.name}
        </h1>
        <p className="text-sm md:text-base text-gray-200 mb-6 font-mono-pixel">
          {event.tagline}
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {event.stats.map((stat) => (
            <div
              key={stat.label}
              className="p-3 bg-black/60 border-2 border-gray-700 rounded text-center"
            >
              <div className="text-sm md:text-lg font-pixel text-[#5b8c32]">{stat.value}</div>
              <div className="text-xs text-gray-400 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-4 justify-center items-center">
          <a
            href="/2d"
            className="px-5 py-3 text-xs md:text-sm font-pixel bg-[#5b8c32] hover:bg-[#6ba33b] text-white rounded bevel active:bevel-pressed transition-colors"
          >
            Explore 2D Version
          </a>
          <div className="text-xs text-gray-400">
            Or wait for the 3D Voxel Island to initialize below ↓
          </div>
        </div>
      </div>
    </section>
  );
}

export function Welcome() {
  return <Hero />;
}

