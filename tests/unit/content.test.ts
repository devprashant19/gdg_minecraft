import { describe, it, expect } from 'vitest';
import { EventSchema, TrackSchema, validateCrossFileIntegrity } from '@/content/index';

describe('Content Model & Schemas', () => {
  it('validates loaded content successfully', () => {
    expect(validateCrossFileIntegrity()).toBe(true);
  });

  it('fails build when an invalid date is provided', () => {
    const invalidEvent = {
      name: 'Test Event',
      tagline: 'A test event',
      organizer: 'GDG',
      timezone: 'UTC',
      startsAt: 'tomorrow', // invalid ISO
      endsAt: '2026-12-20T18:00:00Z',
      venue: {
        name: 'Tech Hub',
        address: '123 Main St',
        mapUrl: 'https://maps.example.com',
        mapImage: '/images/venue.webp',
      },
      contactEmail: 'contact@example.com',
      stats: [],
      links: {
        codeOfConduct: '/coc',
        privacy: '/privacy',
      },
      cocVersion: '1.0',
    };

    const result = EventSchema.safeParse(invalidEvent);
    expect(result.success).toBe(false);
  });

  it('rejects invalid track slugs', () => {
    const invalidTrack = {
      slug: 'INVALID SLUG WITH SPACES & CAPS',
      title: 'Track Title',
      icon: 'icon',
      summary: 'Summary text',
      ideas: ['idea 1'],
    };

    const result = TrackSchema.safeParse(invalidTrack);
    expect(result.success).toBe(false);
  });
});

