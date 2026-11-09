import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Code of Conduct | CraftHacks 2026',
  description: 'Participant rules, harassment policy, and fair play guidelines for CraftHacks 2026.',
};

export default function CodeOfConductPage() {
  return (
    <div className="min-h-screen bg-[#141021] text-white p-6 sm:p-12 max-w-4xl mx-auto font-mono-pixel">
      <header className="border-b-2 border-gray-800 pb-6 mb-8">
        <Link
          href="/"
          className="text-xs text-[#ffb46b] hover:underline mb-4 inline-block font-pixel"
        >
          ← Return to Island
        </Link>
        <h1 className="text-2xl sm:text-3xl font-pixel text-[#ffb46b]">
          CraftHacks Code of Conduct
        </h1>
        <p className="text-xs text-gray-400 mt-2">
          Version: 2026-11 · Applicable to all hackers, mentors, judges, volunteers, and organizers.
        </p>
      </header>

      <main className="space-y-8 text-sm text-gray-300 leading-relaxed">
        <section className="p-5 bg-black/40 border border-gray-800 rounded-lg bevel">
          <h2 className="text-base font-pixel text-[#5b8c32] mb-3">1. Our Core Commitment</h2>
          <p className="text-xs">
            CraftHacks is dedicated to providing a safe, welcoming, inclusive, and harassment-free environment for everyone, regardless of gender, gender identity and expression, sexual orientation, disability, physical appearance, body size, race, age, religion, or technical background.
          </p>
        </section>

        <section className="p-5 bg-black/40 border border-gray-800 rounded-lg bevel">
          <h2 className="text-base font-pixel text-[#5b8c32] mb-3">2. Expected Behavior</h2>
          <ul className="list-disc list-inside space-y-1.5 text-xs text-gray-300">
            <li>Be respectful, collaborative, and considerate of fellow hackers and mentors.</li>
            <li>Use welcoming and inclusive language in discussions, Discord channels, and code repositories.</li>
            <li>Accept constructive criticism gracefully and support beginners taking their first steps in tech.</li>
            <li>Respect the physical and digital boundaries of others.</li>
          </ul>
        </section>

        <section className="p-5 bg-black/40 border border-gray-800 rounded-lg bevel">
          <h2 className="text-base font-pixel text-[#5b8c32] mb-3">3. Unacceptable Behavior & Harassment</h2>
          <p className="text-xs mb-2">The following behaviors are strictly prohibited:</p>
          <ul className="list-disc list-inside space-y-1.5 text-xs text-gray-300">
            <li>Offensive verbal or written comments related to personal characteristics.</li>
            <li>Inappropriate use of sexual language, imagery, or suggestive jokes in presentations or public spaces.</li>
            <li>Deliberate intimidation, stalking, following, or non-consensual photography/recording.</li>
            <li>Sustained disruption of talks, judging sessions, workshops, or discord communications.</li>
            <li>Any form of physical violence, threats, or unwanted physical contact.</li>
          </ul>
        </section>

        <section className="p-5 bg-black/40 border border-gray-800 rounded-lg bevel">
          <h2 className="text-base font-pixel text-[#5b8c32] mb-3">4. Intellectual Property & Fair Play</h2>
          <ul className="list-disc list-inside space-y-1.5 text-xs text-gray-300">
            <li><strong>Fresh Code:</strong> All project code submitted for judging must be authored during the 36-hour hackathon period. Pre-existing full projects are not permitted.</li>
            <li><strong>Permissible Libraries:</strong> Open-source libraries, frameworks, APIs, and boilerplate templates (e.g. create-next-app) are fully welcomed provided they are attributed in your README.</li>
            <li><strong>Original Work:</strong> Plagiarism or submitting another team&apos;s project will lead to immediate disqualification.</li>
            <li><strong>Ownership:</strong> Participants retain 100% intellectual property ownership of what they build. Organizers and sponsors claim no equity or IP.</li>
          </ul>
        </section>

        <section className="p-5 bg-black/40 border border-gray-800 rounded-lg bevel">
          <h2 className="text-base font-pixel text-[#5b8c32] mb-3">5. Reporting & Enforcement</h2>
          <p className="text-xs mb-2">
            If you experience or witness a violation of this code of conduct, please alert the organizers immediately:
          </p>
          <ul className="list-disc list-inside space-y-1 text-xs text-gray-300">
            <li>Emergency Organizer Hotline: <span className="text-[#ffb46b]">+91 98765 43210</span> (24/7 during event)</li>
            <li>Conduct Email: <span className="text-[#ffb46b]">conduct@crafthacks.dev</span></li>
            <li>Discord: Directly message any user with the <span className="text-[#e5b83b]">@Organizer</span> role.</li>
          </ul>
          <p className="text-xs mt-3">
            Participants asked to stop any harassing behavior are expected to comply immediately. Organizers reserve the right to expel violators from the event without refund or certificate.
          </p>
        </section>
      </main>

      <footer className="mt-12 pt-6 border-t border-gray-800 text-center text-xs text-gray-500">
        © 2026 CraftHacks. Crafted with community integrity.
      </footer>
    </div>
  );
}

