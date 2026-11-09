import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { tracks } from '@/content/index';

export async function GET() {
  const defaultStatus = {
    open: true,
    opensAt: '2026-11-01T00:00:00Z',
    closesAt: '2026-12-20T23:59:59Z',
    teams: 42,
    maxTeams: 150,
    teamSizeMin: 2,
    teamSizeMax: 4,
    cocVersion: '2026-11',
    tracks: tracks.map((t) => t.slug),
    serverNow: new Date().toISOString(),
  };

  try {
    const admin = getAdminClient();
    const { data, error } = await admin.rpc('registration_status');

    if (!error && data) {
      return NextResponse.json(data, {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        },
      });
    }
  } catch {
    // Fallback to static content values when offline or local dev without active DB
  }

  return NextResponse.json(defaultStatus, {
    headers: {
      'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
    },
  });
}
