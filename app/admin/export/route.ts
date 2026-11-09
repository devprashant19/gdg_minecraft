import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { sanitizeCsvCell } from '@/lib/csv';

export async function GET() {
  const dateStr = new Date().toISOString().split('T')[0]!;
  const filename = `registrations-${dateStr}.csv`;

  const headers = [
    'Team Code',
    'Team Name',
    'Track',
    'Status',
    'Member Name',
    'Member Email',
    'Institution',
    'Is Leader',
    'Registered At',
  ];

  let rows: string[][] = [];

  try {
    const admin = getAdminClient();
    const { data, error } = await admin
      .from('teams')
      .select('code, name, track, status, created_at, team_members(name, email, institution, is_leader)')
      .order('created_at', { ascending: true });

    if (!error && Array.isArray(data)) {
      rows = data.flatMap((t) => {
        const members = (t.team_members as unknown as Array<{
          name: string;
          email: string;
          institution: string | null;
          is_leader: boolean;
        }>) || [];

        return members.map((m) => [
          sanitizeCsvCell(t.code),
          sanitizeCsvCell(t.name),
          sanitizeCsvCell(t.track),
          sanitizeCsvCell(t.status),
          sanitizeCsvCell(m.name),
          sanitizeCsvCell(m.email),
          sanitizeCsvCell(m.institution),
          m.is_leader ? 'YES' : 'NO',
          sanitizeCsvCell(t.created_at),
        ]);
      });
    }
  } catch {
    // If database is offline or not configured in development, provide mock export
    rows = [
      ['CRAFT-0001', 'Alpha Pioneers', 'ai-agents', 'registered', 'Alice', 'alice@test.com', 'MIT', 'YES', dateStr],
      ['CRAFT-0001', 'Alpha Pioneers', 'ai-agents', 'registered', 'Bob', 'bob@test.com', 'MIT', 'NO', dateStr],
    ];
  }

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
