import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy | CraftHacks 2026',
  description: 'Digital Personal Data Protection Act (DPDP 2023) compliant privacy notice for CraftHacks 2026.',
};

export default function PrivacyPage() {
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
          Privacy Notice & Data Protection
        </h1>
        <p className="text-xs text-gray-400 mt-2">
          Effective Date: November 2026 · Compliant with the Digital Personal Data Protection Act, 2023 (DPDP Act)
        </p>
      </header>

      <main className="space-y-8 text-sm text-gray-300 leading-relaxed">
        <section className="p-5 bg-black/40 border border-gray-800 rounded-lg bevel">
          <h2 className="text-base font-pixel text-[#5b8c32] mb-3">1. Identity of the Data Fiduciary</h2>
          <p>
            CraftHacks 2026 (&quot;Event&quot;, &quot;we&quot;, &quot;us&quot;) is organized by the student innovation committee.
            For any queries or grievances regarding data processing, you may reach our Data Protection Officer at:
            <span className="text-[#ffb46b] ml-1 font-mono">privacy@crafthacks.dev</span>.
          </p>
        </section>

        <section className="p-5 bg-black/40 border border-gray-800 rounded-lg bevel">
          <h2 className="text-base font-pixel text-[#5b8c32] mb-3">2. Digital Personal Data We Collect</h2>
          <ul className="list-disc list-inside space-y-1.5 text-xs text-gray-300">
            <li><strong>Participant Full Name:</strong> Used for event badges, certificates, and team attribution.</li>
            <li><strong>Email Address:</strong> Used for confirmation codes, critical schedule updates, and submission notifications.</li>
            <li><strong>Institution / College:</strong> Used to confirm student status and organize track logistics.</li>
            <li><strong>Team Information:</strong> Team name, selected challenge track, and team member associations.</li>
            <li><strong>Technical Metadata:</strong> Anonymized SHA-256 hashes of client IP and leader email for DDoS prevention and rate limiting. We do not store raw IP addresses in registration databases.</li>
          </ul>
        </section>

        <section className="p-5 bg-black/40 border border-gray-800 rounded-lg bevel">
          <h2 className="text-base font-pixel text-[#5b8c32] mb-3">3. Purpose and Legal Basis of Processing</h2>
          <p className="text-xs mb-3">
            We process your personal data exclusively based on your explicit consent for the specific purpose of organizing, conducting, and awarding prizes for CraftHacks 2026.
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-xs text-gray-300">
            <li>Registration validation, duplicate prevention, and roster management.</li>
            <li>Communication of venue details, discord invitations, and judging schedules.</li>
            <li>Generating official hackathon participation and winner certificates.</li>
          </ul>
        </section>

        <section className="p-5 bg-black/40 border border-gray-800 rounded-lg bevel">
          <h2 className="text-base font-pixel text-[#5b8c32] mb-3">4. Sponsor Sharing (Strictly Opt-In)</h2>
          <p className="text-xs">
            Your personal data is <strong>never sold</strong> to any third parties. Only if your team lead explicitly ticks the optional
            <em>&quot;Share roster and resume with event sponsors for recruitment&quot;</em> checkbox during registration will your contact
            details be shared with verified hiring partners. If unchecked, sponsors receive zero identifying data.
          </p>
        </section>

        <section className="p-5 bg-black/40 border border-gray-800 rounded-lg bevel">
          <h2 className="text-base font-pixel text-[#5b8c32] mb-3">5. Data Retention & Erasure</h2>
          <p className="text-xs">
            In compliance with minimization guidelines:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-xs mt-2 text-gray-300">
            <li>All personal registration data is permanently deleted from primary databases within <strong>30 days</strong> following the conclusion of the event.</li>
            <li>Rate limiting attempt hashes are automatically expunged after <strong>48 hours</strong> via automated database cron.</li>
            <li>Only anonymized aggregate metrics (e.g. total teams, track distributions) are retained for historical retrospectives.</li>
          </ul>
        </section>

        <section className="p-5 bg-black/40 border border-gray-800 rounded-lg bevel">
          <h2 className="text-base font-pixel text-[#5b8c32] mb-3">6. Rights of the Data Principal</h2>
          <p className="text-xs mb-2">
            Under Section 11, 12, and 13 of the DPDP Act 2023, you hold the following rights:
          </p>
          <ul className="list-disc list-inside space-y-1 text-xs text-gray-300">
            <li><strong>Right to Access:</strong> Request a summary of personal data held about you.</li>
            <li><strong>Right to Correction & Erasure:</strong> Request immediate correction or deletion of your data prior to the event.</li>
            <li><strong>Right of Grievance Redressal:</strong> Contact our team at <span className="text-[#ffb46b]">support@crafthacks.dev</span> with responses within 72 hours.</li>
            <li><strong>Right to Nominate:</strong> Nominate another individual to exercise your rights in the event of death or incapacity.</li>
          </ul>
        </section>
      </main>

      <footer className="mt-12 pt-6 border-t border-gray-800 text-center text-xs text-gray-500">
        © 2026 CraftHacks. All rights reserved. Built with privacy and zero-tracking defaults.
      </footer>
    </div>
  );
}

