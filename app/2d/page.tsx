import React, { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { event, tracks, schedule, prizes, sponsors, faq, venue, team } from '@/content/index';
import { RegisterForm } from '@/components/ui/RegisterForm';
import { ReasonBanner } from '@/components/ui/ReasonBanner';

export const metadata = {
  title: 'CraftHacks 2026 | Full 2D Event Guide & Registration',
  description: 'Complete accessible 2D guide, schedule, tracks, and registration portal for CraftHacks 2026.',
};

export default function TwoDPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.name,
    description: event.tagline,
    startDate: event.startsAt,
    endDate: event.endsAt,
    eventAttendanceMode: 'https://schema.org/MixedEventAttendanceMode',
    eventStatus: 'https://schema.org/EventScheduled',
    location: {
      '@type': 'Place',
      name: event.venue.name,
      address: {
        '@type': 'PostalAddress',
        streetAddress: event.venue.address,
      },
    },
    organizer: {
      '@type': 'Organization',
      name: event.organizer,
      email: event.contactEmail,
    },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
      url: 'https://crafthacks.dev/2d#register',
    },
  };

  return (
    <>
      {/* Search Engine Event Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-[#141021] text-white p-4 sm:p-8 max-w-5xl mx-auto font-mono-pixel">
        {/* Fallback notification banner if redirected */}
        <Suspense fallback={null}>
          <ReasonBanner />
        </Suspense>

        {/* Sticky Header */}
        <header className="sticky top-0 z-30 bg-[#141021]/90 backdrop-blur-md flex flex-wrap justify-between items-center py-4 border-b-2 border-gray-800 mb-8 gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-pixel text-[#ffb46b]">{event.name}</h1>
            <p className="text-xs text-gray-400">{event.tagline}</p>
          </div>
          <div className="flex gap-2">
            <a
              href="#register"
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 font-pixel text-xs text-white rounded bevel shadow transition-transform active:scale-95"
            >
              Register Team
            </a>
            <Link
              href="/"
              className="px-4 py-2 bg-[#5b8c32] hover:bg-[#6ba33b] font-pixel text-xs text-white rounded bevel shadow transition-transform active:scale-95"
            >
              🎮 3D Island
            </Link>
          </div>
        </header>

        {/* Navigation jump anchor bar */}
        <nav
          aria-label="Section navigation"
          className="flex flex-wrap gap-2 text-xs font-pixel mb-8 pb-3 border-b border-gray-800"
        >
          <a href="#stats" className="px-2.5 py-1 bg-black/60 hover:bg-gray-800 rounded text-gray-300">Stats</a>
          <a href="#tracks" className="px-2.5 py-1 bg-black/60 hover:bg-gray-800 rounded text-gray-300">Tracks</a>
          <a href="#schedule" className="px-2.5 py-1 bg-black/60 hover:bg-gray-800 rounded text-gray-300">Schedule</a>
          <a href="#prizes" className="px-2.5 py-1 bg-black/60 hover:bg-gray-800 rounded text-gray-300">Prizes</a>
          <a href="#sponsors" className="px-2.5 py-1 bg-black/60 hover:bg-gray-800 rounded text-gray-300">Sponsors</a>
          <a href="#team" className="px-2.5 py-1 bg-black/60 hover:bg-gray-800 rounded text-gray-300">Team</a>
          <a href="#faq" className="px-2.5 py-1 bg-black/60 hover:bg-gray-800 rounded text-gray-300">FAQ</a>
          <a href="#venue" className="px-2.5 py-1 bg-black/60 hover:bg-gray-800 rounded text-gray-300">Venue</a>
          <a href="#register" className="px-2.5 py-1 bg-green-950 border border-green-700 text-green-300 rounded">Register</a>
        </nav>

        {/* Voxel Island Overview Illustration */}
        <div className="mb-8 overflow-hidden rounded-lg border-2 border-gray-800 bevel">
          <Image
            src="/fallback.svg"
            alt="CraftHacks Voxel Island Overview"
            width={800}
            height={400}
            unoptimized
            priority
            className="w-full h-auto max-h-64 object-cover"
          />
        </div>

        {/* Main Content Sections */}
        <main className="space-y-12">
          {/* Event Stats */}
          <section id="stats" className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {event.stats.map((s) => (
              <div key={s.label} className="p-4 bg-black/60 border-2 border-gray-700 rounded text-center bevel">
                <div className="text-lg font-pixel text-[#e5b83b]">{s.value}</div>
                <div className="text-xs text-gray-400 mt-1">{s.label}</div>
              </div>
            ))}
          </section>

          {/* Tracks */}
          <section id="tracks" className="p-6 bg-black/40 border-2 border-gray-800 rounded bevel">
            <h2 className="text-lg font-pixel text-[#5b8c32] mb-4">Crafting Tracks</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tracks.map((t) => (
                <div key={t.slug} className="p-4 bg-black/60 border border-gray-700 rounded">
                  <h3 className="text-sm font-pixel text-[#ffb46b] mb-2">{t.title}</h3>
                  <p className="text-xs text-gray-300 mb-3">{t.summary}</p>
                  <div className="flex flex-wrap gap-1">
                    {t.ideas.map((idea) => (
                      <span key={idea} className="text-[10px] px-2 py-0.5 bg-gray-800 text-gray-300 rounded">
                        {idea}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Schedule */}
          <section id="schedule" className="p-6 bg-black/40 border-2 border-gray-800 rounded bevel">
            <h2 className="text-lg font-pixel text-[#e5b83b] mb-4">Event Timeline</h2>
            <div className="space-y-2">
              {schedule.map((item) => (
                <div key={item.id} className="flex justify-between items-center p-3 bg-black/50 border border-gray-800 rounded text-xs">
                  <div>
                    <span className="font-bold text-white mr-2">{item.title}</span>
                    {item.room && <span className="text-gray-400">({item.room})</span>}
                  </div>
                  <div className="text-[#ffb46b] font-mono">
                    {new Date(item.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Prizes */}
          <section id="prizes" className="p-6 bg-black/40 border-2 border-gray-800 rounded bevel">
            <h2 className="text-lg font-pixel text-[#ffb46b] mb-4">Prizes (Pool: {prizes.poolTotal})</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {prizes.tiers.map((tier) => (
                <div key={tier.id} className="p-4 bg-black/60 border-2 border-amber-600/40 rounded text-center">
                  <div className="text-xs text-gray-400 uppercase font-pixel">{tier.tier}</div>
                  <div className="text-xl font-pixel text-[#e5b83b] my-2">{tier.amount}</div>
                  <p className="text-xs text-gray-300">{tier.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Sponsors */}
          <section id="sponsors" className="p-6 bg-black/40 border-2 border-gray-800 rounded bevel">
            <h2 className="text-lg font-pixel text-[#8ec5ff] mb-4">Sponsors & Partners</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {sponsors.sponsors.map((s) => (
                <a
                  key={s.id}
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-4 bg-black/60 border border-gray-700 hover:border-gray-500 rounded flex flex-col items-center justify-center text-center transition-colors"
                >
                  <span className="text-sm font-bold text-white mb-1">{s.name}</span>
                  <span className="text-[10px] uppercase font-pixel text-[#e5b83b]">{s.tier}</span>
                </a>
              ))}
            </div>
          </section>

          {/* Team / Mentors */}
          <section id="team" className="p-6 bg-black/40 border-2 border-gray-800 rounded bevel">
            <h2 className="text-lg font-pixel text-[#ec4899] mb-4">Organizers & Mentors</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {team.map((m) => (
                <div key={m.name} className="p-3 bg-black/50 border border-gray-700 rounded">
                  <div className="text-sm font-pixel text-white mb-1">{m.name}</div>
                  <div className="text-xs text-[#e5b83b] font-pixel">{m.role}</div>
                  <div className="text-[11px] text-gray-400 mt-1">{m.bio}</div>
                </div>
              ))}
            </div>
          </section>

          {/* FAQ */}
          <section id="faq" className="p-6 bg-black/40 border-2 border-gray-800 rounded bevel">
            <h2 className="text-lg font-pixel text-[#a855f7] mb-4">Frequently Asked Questions</h2>
            <div className="space-y-3">
              {faq.map((f) => (
                <div key={f.q} className="p-4 bg-black/50 border border-gray-800 rounded">
                  <h3 className="text-sm font-pixel text-[#ffb46b] mb-2">{f.q}</h3>
                  <p className="text-xs text-gray-300 leading-relaxed">{f.a}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Venue */}
          <section id="venue" className="p-6 bg-black/40 border-2 border-gray-800 rounded bevel">
            <h2 className="text-lg font-pixel text-[#06b6d4] mb-4">Venue & Travel</h2>
            <div className="p-4 bg-black/50 border border-gray-800 rounded space-y-2">
              <h3 className="text-sm font-bold text-white">{venue.name}</h3>
              <p className="text-xs text-gray-300">{venue.address}</p>
              <div className="pt-2">
                <a
                  href={venue.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-blue-700 hover:bg-blue-600 rounded text-xs font-pixel text-white inline-block"
                >
                  🗺️ Open in Google Maps
                </a>
              </div>
            </div>
          </section>

          {/* Registration Section with Interactive 3-step Form */}
          <section id="register" className="p-6 bg-black/60 border-2 border-[#5b8c32] rounded-lg bevel">
            <h2 className="text-lg font-pixel text-[#ffb46b] mb-2">Team Registration</h2>
            <p className="text-xs text-gray-400 mb-6 font-mono-pixel">
              Register your hackathon party directly. Free entry, team size: 2 to 4 hackers.
            </p>
            <Suspense fallback={<div className="p-6 text-center text-xs font-pixel text-gray-400">Loading form...</div>}>
              <RegisterForm />
            </Suspense>
          </section>
        </main>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t-2 border-gray-800 text-center text-xs text-gray-500 space-y-2">
          <p>© 2026 {event.name} · Organized by {event.organizer}</p>
          <p>
            <Link href="/" className="text-[#ffb46b] hover:underline">
              Return to 3D Island Experience
            </Link>
          </p>
        </footer>
      </div>
    </>
  );
}
