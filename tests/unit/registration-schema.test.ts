import { describe, it, expect } from 'vitest';
import { defaultRegistrationSchema } from '@/lib/schema';

describe('Registration Form Zod Validation Schema', () => {
  const validPayload = {
    team: {
      name: 'Voxel Pioneers',
      track: 'ai-agents',
    },
    members: [
      { name: 'Alice Developer', email: 'alice@example.com', institution: 'MIT', isLeader: true },
      { name: 'Bob Hacker', email: 'bob@example.com', institution: 'Stanford', isLeader: false },
    ],
    consent: {
      codeOfConduct: true,
      privacy: true,
      sponsorSharing: false,
      cocVersion: '2026-11',
    },
    turnstileToken: 'dummy-token',
    website: '',
  };

  it('validates a complete, compliant team payload', () => {
    const res = defaultRegistrationSchema.safeParse(validPayload);
    expect(res.success).toBe(true);
  });

  it('rejects team names with invalid characters or under 2 chars', () => {
    const short = defaultRegistrationSchema.safeParse({
      ...validPayload,
      team: { ...validPayload.team, name: 'X' },
    });
    expect(short.success).toBe(false);

    const badChars = defaultRegistrationSchema.safeParse({
      ...validPayload,
      team: { ...validPayload.team, name: 'Team <Script>' },
    });
    expect(badChars.success).toBe(false);
  });

  it('rejects duplicate member emails within a team', () => {
    const duplicate = defaultRegistrationSchema.safeParse({
      ...validPayload,
      members: [
        { name: 'Alice', email: 'same@example.com', isLeader: true },
        { name: 'Bob', email: 'same@example.com', isLeader: false },
      ],
    });
    expect(duplicate.success).toBe(false);
    if (!duplicate.success) {
      expect(duplicate.error.flatten().fieldErrors.members).toContain(
        'Each member needs a different email address'
      );
    }
  });

  it('requires exactly one team leader', () => {
    const noLeader = defaultRegistrationSchema.safeParse({
      ...validPayload,
      members: [
        { name: 'Alice', email: 'alice@example.com', isLeader: false },
        { name: 'Bob', email: 'bob@example.com', isLeader: false },
      ],
    });
    expect(noLeader.success).toBe(false);

    const twoLeaders = defaultRegistrationSchema.safeParse({
      ...validPayload,
      members: [
        { name: 'Alice', email: 'alice@example.com', isLeader: true },
        { name: 'Bob', email: 'bob@example.com', isLeader: true },
      ],
    });
    expect(twoLeaders.success).toBe(false);
  });

  it('enforces min and max team size constraints', () => {
    const singleMember = defaultRegistrationSchema.safeParse({
      ...validPayload,
      members: [{ name: 'Solo', email: 'solo@example.com', isLeader: true }],
    });
    expect(singleMember.success).toBe(false);

    const fiveMembers = defaultRegistrationSchema.safeParse({
      ...validPayload,
      members: [
        { name: 'M1', email: 'm1@example.com', isLeader: true },
        { name: 'M2', email: 'm2@example.com', isLeader: false },
        { name: 'M3', email: 'm3@example.com', isLeader: false },
        { name: 'M4', email: 'm4@example.com', isLeader: false },
        { name: 'M5', email: 'm5@example.com', isLeader: false },
      ],
    });
    expect(fiveMembers.success).toBe(false);
  });
});

