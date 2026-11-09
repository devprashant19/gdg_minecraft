import { serverEnv } from './env';

export interface ConfirmationEmailPayload {
  teamName: string;
  teamCode: string;
  track: string;
  leaderEmail: string;
  memberEmails: string[];
}

/**
 * Dispatches a confirmation email via Resend or logs in mock mode.
 * Safe for $0 Hobby budget and local development environments.
 */
export async function sendConfirmationEmail(
  payload: ConfirmationEmailPayload
): Promise<{ success: boolean; mock?: boolean; error?: string }> {
  const { teamName, teamCode, track, memberEmails } = payload;
  const apiKey = serverEnv.RESEND_API_KEY;

  // Development, test or missing API key fallback
  if (!apiKey || apiKey === '' || apiKey.startsWith('re_mock_') || process.env.NODE_ENV === 'test') {
    return { success: true, mock: true };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: serverEnv.EMAIL_FROM || 'CraftHacks <register@example.com>',
        to: memberEmails,
        subject: `CraftHacks 2026: Team Registration Confirmed [${teamCode}]`,
        html: `
          <div style="font-family: monospace, sans-serif; background-color: #141021; color: #f8fafc; padding: 24px; border-radius: 8px;">
            <h1 style="color: #ffb46b;">CraftHacks 2026 Confirmation</h1>
            <p>Greetings, Adventurer! Your team registration for CraftHacks 2026 has been successfully confirmed.</p>
            <div style="background-color: #1e1b4b; padding: 16px; border: 2px solid #5b8c32; border-radius: 6px; margin: 16px 0;">
              <p><strong>Team Name:</strong> ${teamName}</p>
              <p><strong>Team Code:</strong> <span style="font-size: 18px; color: #fde047;">${teamCode}</span></p>
              <p><strong>Track:</strong> ${track}</p>
            </div>
            <p>Keep your team code handy during on-site badge check-in.</p>
            <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">See you on the Voxel Island!</p>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return { success: false, error: errText };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

