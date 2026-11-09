import { z } from 'zod';

export const isoDateTime = z.string().datetime({ offset: true });
export const url = z.string().url();
export const localImg = z.string().regex(/^\/(sponsors|team|images)\/[\w.-]+\.(webp|png|svg|jpg)$/);

export const EventSchema = z.object({
  name: z.string().min(1),
  tagline: z.string().max(120),
  organizer: z.string().min(1),
  timezone: z.string().min(1),
  startsAt: isoDateTime,
  endsAt: isoDateTime,
  venue: z.object({
    name: z.string(),
    address: z.string(),
    mapUrl: url,
    mapImage: localImg,
  }),
  contactEmail: z.string().email(),
  socials: z.array(z.object({ label: z.string(), url })).default([]),
  stats: z.array(z.object({ label: z.string(), value: z.string() })).max(6),
  links: z.object({
    codeOfConduct: z.string(),
    privacy: z.string(),
    sponsorDeck: z.string().optional(),
    devfolio: url.optional(),
  }),
  cocVersion: z.string().min(1),
});

export const TrackSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string(),
  icon: z.string(),
  summary: z.string().max(160),
  ideas: z.array(z.string()).max(4),
  sponsor: z.string().optional(),
});
export const TracksSchema = z.array(TrackSchema).min(1);

export const ScheduleItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  start: isoDateTime,
  end: isoDateTime,
  type: z.enum(['ceremony', 'workshop', 'meal', 'hacking', 'judging', 'fun']),
  speaker: z.string().optional(),
  room: z.string().optional(),
});
export const ScheduleSchema = z.array(ScheduleItemSchema).min(1);

export const PrizeTierSchema = z.object({
  id: z.string(),
  tier: z.string(),
  amount: z.string(),
  description: z.string(),
  perks: z.array(z.string()),
});
export const SpecialPrizeSchema = z.object({
  id: z.string(),
  title: z.string(),
  amount: z.string(),
  description: z.string(),
  criteria: z.string(),
});
export const PrizesSchema = z.object({
  poolTotal: z.string(),
  tiers: z.array(PrizeTierSchema),
  special: z.array(SpecialPrizeSchema).default([]),
  swag: z.array(z.string()).default([]),
});

export const SponsorItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  tier: z.enum(['title', 'diamond', 'gold', 'silver', 'bronze', 'partner']),
  logo: localImg,
  url,
});
export const SponsorsSchema = z.object({
  sponsors: z.array(SponsorItemSchema),
  sponsorDeckUrl: z.string().optional(),
});

export const TeamMemberSchema = z.object({
  name: z.string(),
  role: z.string(),
  avatar: localImg,
  bio: z.string().optional(),
  links: z.record(z.string(), url).optional(),
});
export const TeamSchema = z.array(TeamMemberSchema).min(1);

export const FaqItemSchema = z.object({
  q: z.string(),
  a: z.string(),
  category: z.enum(['general', 'teams', 'rules', 'venue']),
});
export const FaqSchema = z.array(FaqItemSchema).min(1);

export const VenueSchema = z.object({
  name: z.string(),
  address: z.string(),
  coordinates: z.object({ lat: z.number(), lng: z.number() }),
  mapUrl: url,
  mapImage: localImg,
  travelInfo: z.array(z.object({ mode: z.string(), details: z.string() })),
});

export const StationSchema = z.object({
  id: z.enum([
    'welcome',
    'tracks',
    'schedule',
    'prizes',
    'sponsors',
    'team',
    'faq',
    'venue',
    'register',
  ]),
  label: z.string(),
  hotbarSlot: z.number().int().min(1).max(9),
  icon: z.string(),
  prefab: z.string(),
  position: z.tuple([z.number(), z.number(), z.number()]),
  radius: z.number().positive(),
  standPoint: z.tuple([z.number(), z.number(), z.number()]),
  tourView: z.object({
    cam: z.tuple([z.number(), z.number(), z.number()]),
    look: z.tuple([z.number(), z.number(), z.number()]),
    dwellMs: z.number().positive(),
  }),
});
export const StationsSchema = z.array(StationSchema).length(9);

