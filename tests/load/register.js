import http from 'k6/http';
import { check, sleep } from 'k6';

// 5x Expected Peak Load Test Scenario
// Ramps up to ~25 req/sec target for 2 minutes
export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '2m', target: 25 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    // 95% of requests must complete within 800ms
    http_req_duration: ['p(95)<800'],
    // 0% server 5xx errors permitted
    'http_req_failed{status:500}': ['rate==0'],
  },
};

const BASE_URL = __ENV.TARGET_URL || 'http://localhost:3000';

export default function registerLoadScenario() {
  const vuId = __VU;
  const iterId = __ITER;
  const rand = Math.random();

  let payload;

  if (rand < 0.05) {
    // 5% Intentional invalid payloads (Testing 400 validation defense)
    payload = {
      team: { name: 'X', track: 'invalid-track' },
      members: [],
      consent: { codeOfConduct: false, privacy: false, cocVersion: '2026-11' },
      turnstileToken: 'XXXX.DUMMY.TOKEN.XXXX',
    };
  } else if (rand < 0.15) {
    // 10% Intentional duplicate emails (Testing 409 duplicate defense)
    payload = {
      team: { name: `Duplicate Team ${vuId}-${iterId}`, track: 'ai-agents' },
      members: [
        { name: 'Duplicate Leader', email: 'duplicate.lead@example.com', isLeader: true },
        { name: 'Duplicate Member', email: 'duplicate.member@example.com', isLeader: false },
      ],
      consent: { codeOfConduct: true, privacy: true, cocVersion: '2026-11' },
      turnstileToken: 'XXXX.DUMMY.TOKEN.XXXX',
    };
  } else {
    // 85% Standard unique registrations
    const uniqueEmail1 = `team_${vuId}_${iterId}_1@example.com`;
    const uniqueEmail2 = `team_${vuId}_${iterId}_2@example.com`;

    payload = {
      team: {
        name: `Voxel Squad ${vuId}-${iterId}-${Math.floor(Math.random() * 10000)}`,
        track: 'retro-voxel',
      },
      members: [
        {
          name: `Leader ${vuId}-${iterId}`,
          email: uniqueEmail1,
          institution: 'Voxel Institute',
          isLeader: true,
        },
        {
          name: `Member ${vuId}-${iterId}`,
          email: uniqueEmail2,
          institution: 'Voxel Institute',
          isLeader: false,
        },
      ],
      consent: {
        codeOfConduct: true,
        privacy: true,
        sponsorSharing: false,
        cocVersion: '2026-11',
      },
      turnstileToken: 'XXXX.DUMMY.TOKEN.XXXX',
    };
  }

  const res = http.post(`${BASE_URL}/api/register`, JSON.stringify(payload), {
    headers: {
      'Content-Type': 'application/json',
      'X-Forwarded-For': `198.51.100.${(vuId % 250) + 1}`,
    },
  });

  if (rand < 0.05) {
    check(res, {
      'invalid payload returns 400': (r) => r.status === 400,
    });
  } else if (rand < 0.15) {
    check(res, {
      'duplicate registration returns 409 or 201 on first run': (r) =>
        r.status === 409 || r.status === 201,
    });
  } else {
    check(res, {
      'successful registration returns 201': (r) => r.status === 201,
      'has assigned team code': (r) => {
        try {
          const body = JSON.parse(r.body);
          return typeof body.code === 'string' && body.code.startsWith('CRAFT');
        } catch {
          return false;
        }
      },
    });
  }

  sleep(1);
}
