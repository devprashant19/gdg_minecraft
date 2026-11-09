// @vitest-environment node

import { describe, it, expect, vi } from 'vitest';
import { POST } from '@/app/api/cron/email-retry/route';
import { serverEnv } from '@/lib/env';

vi.mock('@/lib/supabase/admin', () => ({
  getAdminClient: () => ({
    from: () => ({
      select: () => ({
        is: () => ({
          eq: () => ({
            limit: async () => ({
              data: [
                {
                  id: 'mock-team-1',
                  code: 'CRAFT-1001',
                  name: 'Test Team',
                  track: 'ai-agents',
                  team_members: [
                    { name: 'Lead', email: 'lead@example.com', is_leader: true },
                    { name: 'Hacker', email: 'hacker@example.com', is_leader: false },
                  ],
                },
              ],
              error: null,
            }),
          }),
        }),
      }),
      update: () => ({
        eq: async () => ({ error: null }),
      }),
    }),
  }),
}));

describe('Email Retry Cron Endpoint', () => {
  it('rejects requests without authorization header with 401', async () => {
    const req = new Request('http://localhost:3000/api/cron/email-retry', {
      method: 'POST',
    });

    const res = await POST(req);
    expect(res.status).toBe(401);

    const json = await res.json();
    expect(json.error).toBe('UNAUTHORIZED');
  });

  it('rejects requests with incorrect Bearer token with 401', async () => {
    const req = new Request('http://localhost:3000/api/cron/email-retry', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer invalid_wrong_token',
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('authenticates valid Bearer secret and retries unsent emails', async () => {
    const req = new Request('http://localhost:3000/api/cron/email-retry', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${serverEnv.CRON_SECRET}`,
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.processed).toBe(1);
  });
});
