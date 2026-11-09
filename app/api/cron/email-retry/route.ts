import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { serverEnv } from '@/lib/env';
import { sendConfirmationEmail } from '@/lib/email';

export async function POST(req: Request) {
  // 1. Authenticate cron trigger with Bearer token
  const authHeader = req.headers.get('authorization');
  const expectedToken = serverEnv.CRON_SECRET;

  if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json(
      { error: 'UNAUTHORIZED', message: 'Invalid or missing cron secret' },
      { status: 401 }
    );
  }

  try {
    const admin = getAdminClient();

    // 2. Fetch pending unsent teams (limit batch to 50 for free-tier execution budgets)
    const { data: unsentTeams, error: fetchError } = await admin
      .from('teams')
      .select('id, code, name, track, team_members(name, email, is_leader)')
      .is('confirmation_sent_at', null)
      .eq('status', 'registered')
      .limit(50);

    if (fetchError) {
      return NextResponse.json(
        { error: 'DATABASE_ERROR', message: fetchError.message },
        { status: 500 }
      );
    }

    if (!unsentTeams || unsentTeams.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending unsent confirmation emails.',
        processed: 0,
      });
    }

    let processedCount = 0;

    for (const team of unsentTeams) {
      interface MemberRow {
        name: string;
        email: string;
        is_leader: boolean;
      }
      const members = (team.team_members as unknown as MemberRow[]) || [];
      const leader = members.find((m) => m.is_leader) || members[0];
      const memberEmails = members.map((m) => m.email);

      if (memberEmails.length > 0) {
        const result = await sendConfirmationEmail({
          teamName: team.name,
          teamCode: team.code,
          track: team.track,
          leaderEmail: leader ? leader.email : memberEmails[0]!,
          memberEmails,
        });

        if (result.success) {
          await admin
            .from('teams')
            .update({ confirmation_sent_at: new Date().toISOString() })
            .eq('id', team.id);
          processedCount++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      processed: processedCount,
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'CRON_FAILED', message: (err as Error).message },
      { status: 500 }
    );
  }
}
