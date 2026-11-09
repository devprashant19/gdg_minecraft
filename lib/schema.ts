import { z } from 'zod';
import { tracks } from '@/content/index';

export const memberSchema = z.object({
  name: z.string().trim().min(1, 'Enter a name').max(80),
  email: z.string().trim().toLowerCase().email('Enter a valid email').max(254),
  institution: z.string().trim().max(120).optional().or(z.literal('')),
  isLeader: z.boolean(),
});

export type MemberInput = z.infer<typeof memberSchema>;

export const defaultTracksList = tracks.map((t) => t.slug);

export interface RegistrationConstraints {
  min: number;
  max: number;
  tracks: string[];
}

export const makeRegistrationSchema = (
  constraints: RegistrationConstraints = {
    min: 2,
    max: 4,
    tracks: defaultTracksList,
  }
) => {
  const trackEnums = (
    constraints.tracks.length > 0 ? constraints.tracks : ['ai-agents']
  ) as [string, ...string[]];

  return z.object({
    team: z.object({
      name: z
        .string()
        .trim()
        .min(2, 'At least 2 characters')
        .max(40, 'Maximum 40 characters')
        .regex(
          /^[\p{L}\p{N} _.\-']+$/u,
          "Letters, numbers, spaces and - _ . ' only"
        ),
      track: z.enum(trackEnums, {
        message: 'Pick a track',
      }),
    }),
    members: z
      .array(memberSchema)
      .min(constraints.min, `Team must have at least ${constraints.min} members`)
      .max(constraints.max, `Team cannot exceed ${constraints.max} members`)
      .refine(
        (m) => m.filter((x) => x.isLeader).length === 1,
        'Choose exactly one team leader'
      )
      .refine(
        (m) => new Set(m.map((x) => x.email)).size === m.length,
        'Each member needs a different email address'
      ),
    consent: z.object({
      codeOfConduct: z.literal(true, { message: 'Code of Conduct acceptance is required' }),
      privacy: z.literal(true, { message: 'Privacy policy acceptance is required' }),
      sponsorSharing: z.boolean(),
      cocVersion: z.string().min(1, 'CoC version required'),
    }),
    turnstileToken: z.string().min(1, 'Please complete the bot verification'),
    website: z.string().max(0, 'Honeypot field').optional(),
  });
};

export const defaultRegistrationSchema = makeRegistrationSchema();
export type RegistrationInput = z.infer<typeof defaultRegistrationSchema>;
