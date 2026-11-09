import { Hero } from '@/components/sections/Welcome';
import { ExperienceGate } from '@/components/world/ExperienceGate';

export default function Home() {
  return (
    <>
      <noscript>
        <div className="p-8 bg-[#181425] text-white font-mono-pixel text-center">
          <Hero />
        </div>
      </noscript>

      {/* Screen-reader and search engine indexing container */}
      <main id="ssr-content" className="sr-only" aria-hidden="true">
        <Hero />
      </main>

      <ExperienceGate />
    </>
  );
}
