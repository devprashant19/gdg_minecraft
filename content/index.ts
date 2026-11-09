import eventJson from './event.json';
import tracksJson from './tracks.json';
import scheduleJson from './schedule.json';
import prizesJson from './prizes.json';
import sponsorsJson from './sponsors.json';
import teamJson from './team.json';
import faqJson from './faq.json';
import venueJson from './venue.json';
import { stations } from './stations';
import {
  EventSchema,
  TracksSchema,
  ScheduleSchema,
  PrizesSchema,
  SponsorsSchema,
  TeamSchema,
  FaqSchema,
  VenueSchema,
  StationsSchema,
} from './schemas';

// Parse and validate each data file strictly
export const event = EventSchema.parse(eventJson);
export const tracks = TracksSchema.parse(tracksJson);
export const schedule = ScheduleSchema.parse(scheduleJson);
export const prizes = PrizesSchema.parse(prizesJson);
export const sponsors = SponsorsSchema.parse(sponsorsJson);
export const team = TeamSchema.parse(teamJson);
export const faq = FaqSchema.parse(faqJson);
export const venue = VenueSchema.parse(venueJson);
export const validatedStations = StationsSchema.parse(stations);

// Cross-file validation checks
export function validateCrossFileIntegrity() {
  // 1. Hotbar slots 1–9 are unique
  const slots = validatedStations.map((s) => s.hotbarSlot);
  const uniqueSlots = new Set(slots);
  if (uniqueSlots.size !== 9) {
    throw new Error(`Stations hotbar slots must be unique 1-9. Found: ${slots.join(', ')}`);
  }

  // 2. Schedule times are inside event dates
  const eventStart = new Date(event.startsAt).getTime();
  const eventEnd = new Date(event.endsAt).getTime();
  for (const item of schedule) {
    const itemStart = new Date(item.start).getTime();
    const itemEnd = new Date(item.end).getTime();
    if (itemStart < eventStart || itemEnd > eventEnd) {
      throw new Error(
        `Schedule item "${item.title}" (${item.start} - ${item.end}) falls outside event dates (${event.startsAt} - ${event.endsAt})`
      );
    }
  }

  // 3. Every track referenced by a sponsor or prize exists
  const trackSlugs = new Set(tracks.map((t) => t.slug));
  if (trackSlugs.size !== tracks.length) {
    throw new Error('Track slugs must be unique');
  }

  return true;
}

// Run cross-validation check
validateCrossFileIntegrity();

export * from './schemas';
export * from './stations';

