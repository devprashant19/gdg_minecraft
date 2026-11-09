# Appendix B: Content model

All event content lives in `content/` as JSON (plus `stations.ts`), validated by zod in `content/schemas.ts` at build time. The 3D panels, the 2D page, emails and metadata all read from here. **Organizers edit these files, nothing else**, and a typo fails the build instead of shipping.

```ts
// content/schemas.ts
import { z } from 'zod';
const isoDateTime = z.iso.datetime({ offset: true });         // "2026-12-20T09:00:00+05:30"
const url = z.url();
const localImg = z.string().regex(/^\/(sponsors|team|images)\/[\w.-]+\.(webp|png|svg|jpg)$/);
```

## `event.json`

```ts
export const Event = z.object({
  name: z.string(),                       // avoid "Minecraft" in the name (Appendix D)
  tagline: z.string().max(120),
  organizer: z.string(),                  // "GDG <City>"
  timezone: z.string(),                   // IANA, e.g. "Asia/Kolkata"
  startsAt: isoDateTime, endsAt: isoDateTime,
  venue: z.object({ name: z.string(), address: z.string(), mapUrl: url, mapImage: localImg }),
  contactEmail: z.email(),
  socials: z.array(z.object({ label: z.string(), url })).default([]),
  stats: z.array(z.object({ label: z.string(), value: z.string() })).max(6),  // "₹1L prize pool", "300+ hackers"
  links: z.object({ codeOfConduct: z.string(), privacy: z.string(), sponsorDeck: z.string().optional(),
                    devfolio: url.optional() }),
  cocVersion: z.string(),                 // must equal event_settings.coc_version (CI check)
});
```

Registration open/close times are **not** here: they live in Supabase `event_settings` (one source of truth, changeable without redeploy) and reach the UI via `/api/status`.

## `tracks.json`

```ts
export const Track = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),  // must match Supabase tracks.slug (CI check)
  title: z.string(), icon: z.string(),     // icon key from the code-drawn icon set
  summary: z.string().max(160),
  ideas: z.array(z.string()).max(4),
  sponsor: z.string().optional(),          // sponsor id
});
export const Tracks = z.array(Track).min(1);
```

## `schedule.json`

```ts
export const ScheduleItem = z.object({
  startsAt: isoDateTime, endsAt: isoDateTime.optional(),
  title: z.string(), location: z.string().optional(),
  kind: z.enum(['ceremony', 'hacking', 'food', 'talk', 'judging', 'deadline', 'fun']),
});
export const Schedule = z.object({ days: z.array(z.object({ label: z.string(), items: z.array(ScheduleItem) })) })
  .refine(sortedWithinDays, 'Schedule items must be in time order');
```

## `prizes.json`

```ts
export const Prize = z.object({
  id: z.string(), title: z.string(), amount: z.string(),        // "₹50,000" (string: currency formatting is content)
  tier: z.enum(['grand', 'first', 'second', 'third', 'special']),
  chest: z.enum(['wood', 'iron', 'gold', 'crystal']),           // our own chest styles
  perks: z.array(z.string()).default([]),
  trackSlug: z.string().optional(),                             // track-specific prize
});
export const Prizes = z.object({ prizes: z.array(Prize), swag: z.array(z.string()) });
```

## `sponsors.json`

```ts
export const Sponsor = z.object({
  id: z.string(), name: z.string(), url, logo: localImg,
  tier: z.enum(['title', 'platinum', 'gold', 'silver', 'community']),
  blurb: z.string().max(200).optional(),
});
export const Sponsors = z.object({
  sponsors: z.array(Sponsor),
  benefits: z.array(z.object({ tier: z.string(), items: z.array(z.string()) })),
  becomeSponsor: z.object({ email: z.email(), deckUrl: z.string().optional() }),
});
```

The TV slideshow cycles through `sponsors` sorted by tier.

## `team.json`

```ts
export const Person = z.object({
  name: z.string(), role: z.string(),
  group: z.enum(['organizer', 'judge', 'mentor', 'volunteer']),
  photo: localImg.optional(), links: z.array(z.object({ label: z.string(), url })).max(3).default([]),
  npcSkin: z.number().int().min(0).max(5).optional(),   // which Kenney skin stands in for them in 3D
});
export const Team = z.array(Person);
```

Get written consent from every person before publishing their photo.

## `faq.json`

```ts
export const Faq = z.array(z.object({
  category: z.enum(['general', 'registration', 'teams', 'judging', 'travel', 'rules']),
  q: z.string(), a: z.string(),   // `a` supports a tiny markdown subset (links, bold) rendered safely
}));
```

## `venue.json`

```ts
export const Venue = z.object({
  directions: z.array(z.object({ mode: z.enum(['metro', 'bus', 'car', 'train', 'air']), text: z.string() })),
  accommodation: z.string().optional(), accessibility: z.string(),
});
```

## `stations.ts`

```ts
export const Station = z.object({
  id: z.enum(['welcome', 'tracks', 'schedule', 'prizes', 'sponsors', 'team', 'faq', 'venue', 'register']),
  label: z.string(), hotbarSlot: z.number().int().min(1).max(9), icon: z.string(),
  prefab: z.string(),
  position: z.tuple([z.number(), z.number(), z.number()]),
  standPoint: z.tuple([z.number(), z.number(), z.number()]),
  radius: z.number().min(1.5).max(5),
  pad: z.object({ radius: z.number(), height: z.number().int() }),
  tourView: z.object({ cam: z.tuple([z.number(), z.number(), z.number()]),
                       look: z.tuple([z.number(), z.number(), z.number()]), dwellMs: z.number() }),
});
export const Stations = z.array(Station).length(9);
```

## Cross-file checks (`scripts/check-content.ts`, run in CI)

- [ ] Hotbar slots 1–9 each used exactly once; every `SectionId` has a station.
- [ ] Station zones don't overlap; each `standPoint` is inside its `radius`.
- [ ] Every `prize.trackSlug` and `track.sponsor` refers to something that exists.
- [ ] Schedule within `event.startsAt`–`endsAt`.
- [ ] `tracks.json` slugs equal `supabase/seed.sql` / prod migration slugs.
- [ ] Every `logo`/`photo` file exists in `public/` and is under 200 KB.
- [ ] `event.cocVersion` equals the latest `coc_version` in migrations.
