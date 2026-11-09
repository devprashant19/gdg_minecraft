import React from 'react';
import { SectionId } from '@/lib/store';
import { Welcome } from './Welcome';
import { TracksSection } from './Tracks';
import { ScheduleSection } from './Schedule';
import { PrizesSection } from './Prizes';
import { SponsorsSection } from './Sponsors';
import { TeamSection } from './Team';
import { FaqSection } from './Faq';
import { VenueSection } from './Venue';
import { RegisterSection } from './Register';

export const sectionComponents: Record<SectionId, React.ComponentType> = {
  welcome: Welcome,
  tracks: TracksSection,
  schedule: ScheduleSection,
  prizes: PrizesSection,
  sponsors: SponsorsSection,
  team: TeamSection,
  faq: FaqSection,
  venue: VenueSection,
  register: RegisterSection,
};

export const sectionTitles: Record<SectionId, string> = {
  welcome: 'Welcome & Overview',
  tracks: 'Crafting Tracks',
  schedule: 'Event Schedule',
  prizes: 'Prize Chests & Awards',
  sponsors: 'Sponsor Showcase',
  team: 'Organizing Crew & Mentors',
  faq: 'FAQ & Island Rules',
  venue: 'Venue & Travel',
  register: 'Team Registration Portal',
};

