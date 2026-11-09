import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Admin Dashboard | CraftHacks Island',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminPage() {
  const stats = {
    totalTeams: 42,
    totalHackers: 128,
    confirmedRate: '98%',
    activeTracks: 8,
  };

  const sampleTeams = [
    { code: 'CRAFT-0001', name: 'Alpha Pioneers', track: 'AI & Agents', members: 3, status: 'registered' },
    { code: 'CRAFT-0002', name: 'Byte Crafters', track: 'Web3 & Infra', members: 4, status: 'registered' },
    { code: 'CRAFT-0003', name: 'Pixel Forge', track: 'Creative Media', members: 2, status: 'registered' },
    { code: 'CRAFT-0004', name: 'Zero Hackers', track: 'Cybersecurity', members: 3, status: 'registered' },
  ];

  return (
    <div className="min-h-screen bg-[#110e1b] text-white p-6 font-mono-pixel">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Top Header */}
        <header className="flex justify-between items-center border-b border-gray-800 pb-4">
          <div>
            <h1 className="text-lg font-pixel text-[#ffb46b]">Island Admin Portal</h1>
            <p className="text-xs text-gray-400">Team Ledger & Registration Metrics</p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/admin/export"
              className="px-3 py-1.5 bg-green-700 hover:bg-green-600 text-xs font-pixel rounded bevel text-white transition-colors"
            >
              📥 Export CSV
            </Link>
            <Link
              href="/"
              className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-xs font-pixel rounded bevel text-gray-300 transition-colors"
            >
              🏝️ Return to Island
            </Link>
          </div>
        </header>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-black/50 border border-gray-800 rounded-lg bevel">
            <div className="text-[10px] text-gray-400 uppercase">Teams Registered</div>
            <div className="text-2xl font-bold text-[#ffb46b] mt-1">{stats.totalTeams}</div>
          </div>
          <div className="p-4 bg-black/50 border border-gray-800 rounded-lg bevel">
            <div className="text-[10px] text-gray-400 uppercase">Total Participants</div>
            <div className="text-2xl font-bold text-green-400 mt-1">{stats.totalHackers}</div>
          </div>
          <div className="p-4 bg-black/50 border border-gray-800 rounded-lg bevel">
            <div className="text-[10px] text-gray-400 uppercase">Confirmation Rate</div>
            <div className="text-2xl font-bold text-amber-400 mt-1">{stats.confirmedRate}</div>
          </div>
          <div className="p-4 bg-black/50 border border-gray-800 rounded-lg bevel">
            <div className="text-[10px] text-gray-400 uppercase">Active Tracks</div>
            <div className="text-2xl font-bold text-purple-400 mt-1">{stats.activeTracks}</div>
          </div>
        </div>

        {/* Registered Teams Table */}
        <div className="bg-black/40 border border-gray-800 rounded-lg overflow-hidden bevel">
          <div className="p-4 border-b border-gray-800 flex justify-between items-center">
            <h2 className="text-xs font-pixel text-gray-200">Registered Teams</h2>
            <span className="text-xs text-gray-400 font-pixel">Showing recent teams</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-black/60 text-gray-400 border-b border-gray-800">
                <tr>
                  <th className="p-3 font-pixel">Code</th>
                  <th className="p-3 font-pixel">Team Name</th>
                  <th className="p-3 font-pixel">Track</th>
                  <th className="p-3 font-pixel">Members</th>
                  <th className="p-3 font-pixel">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {sampleTeams.map((team) => (
                  <tr key={team.code} className="hover:bg-white/5 transition-colors">
                    <td className="p-3 font-mono font-bold text-green-400">{team.code}</td>
                    <td className="p-3 text-white">{team.name}</td>
                    <td className="p-3 text-gray-300">{team.track}</td>
                    <td className="p-3 text-gray-300">{team.members} hackers</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-green-950 text-green-300 border border-green-800">
                        {team.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

