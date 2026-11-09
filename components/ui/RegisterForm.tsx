'use client';

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Turnstile } from '@marsidev/react-turnstile';
import { defaultRegistrationSchema, RegistrationInput } from '@/lib/schema';
import { tracks } from '@/content/index';
import { useGame } from '@/lib/store';
import { trackEvent } from '@/lib/analytics';
import { clientEnv } from '@/lib/env';

const STORAGE_KEY = 'crafthacks_registration_draft_v1';

export function RegisterForm() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [registeredCode, setRegisteredCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const setFormDirty = useGame((s) => s.setFormDirty);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    trigger,
    setFocus,
    formState: { errors, isDirty },
  } = useForm<RegistrationInput>({
    resolver: zodResolver(defaultRegistrationSchema),
    mode: 'onTouched',
    defaultValues: {
      team: {
        name: '',
        track: tracks[0]?.slug || 'ai-agents',
      },
      members: [
        { name: '', email: '', institution: '', isLeader: true },
        { name: '', email: '', institution: '', isLeader: false },
      ],
      consent: {
        codeOfConduct: true,
        privacy: true,
        sponsorSharing: false,
        cocVersion: '2026-11',
      },
      turnstileToken: 'XXXX.DUMMY.TOKEN.XXXX', // Default fallback for local testing
      website: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'members',
  });

  const formValues = watch();

  // 1. Sync store formDirty state
  useEffect(() => {
    setFormDirty(isDirty);
    return () => setFormDirty(false);
  }, [isDirty, setFormDirty]);

  // 2. Draft restore from sessionStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.team?.name) setValue('team.name', parsed.team.name);
        if (parsed.team?.track) setValue('team.track', parsed.team.track);
        if (Array.isArray(parsed.members) && parsed.members.length >= 2) {
          setValue('members', parsed.members);
        }
      } catch {
        // Ignore corrupted storage
      }
    }

    const prevCode = localStorage.getItem('crafthacks_registered_code');
    if (prevCode) {
      setRegisteredCode(prevCode);
    }
  }, [setValue]);

  // 3. Draft autosave to sessionStorage
  useEffect(() => {
    if (typeof window === 'undefined' || registeredCode) return;
    const timeout = setTimeout(() => {
      const draft = {
        team: formValues.team,
        members: formValues.members,
      };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    }, 600);
    return () => clearTimeout(timeout);
  }, [formValues.team, formValues.members, registeredCode]);

  // Step 1 -> 2 Validation
  const handleNextStep = async () => {
    if (step === 1) {
      const valid = await trigger(['team.name', 'team.track']);
      if (valid) {
        setStep(2);
      } else {
        setFocus('team.name');
      }
    } else if (step === 2) {
      const valid = await trigger('members');
      if (valid) {
        setStep(3);
      } else {
        setFocus('members.0.name');
      }
    }
  };

  const onSubmit = async (data: RegistrationInput) => {
    setSubmitting(true);
    setServerError(null);

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok) {
        setServerError(json.message || json.error || 'Registration failed.');
        setSubmitting(false);
        return;
      }

      const code = json.code;
      setRegisteredCode(code);
      localStorage.setItem('crafthacks_registered_code', code);
      sessionStorage.removeItem(STORAGE_KEY);
      setFormDirty(false);
      trackEvent('registered', { track: data.team.track, memberCount: data.members.length });
    } catch {
      setServerError('Network error. Please verify your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  const copyCode = () => {
    if (!registeredCode) return;
    navigator.clipboard.writeText(registeredCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Success Confirmation Screen
  if (registeredCode) {
    return (
      <div className="p-6 text-center space-y-5 animate-fade-in">
        <div className="w-16 h-16 mx-auto rounded-full bg-green-900/60 border-2 border-green-400 flex items-center justify-center text-3xl">
          🎉
        </div>

        <h3 className="text-base font-pixel text-[#ffb46b]">Registration Confirmed!</h3>
        <p className="text-xs text-gray-300 font-mono-pixel">
          Your team has been officially registered on the island ledger.
        </p>

        <div className="p-4 bg-black/80 border-2 border-[#5b8c32] rounded-lg space-y-2 bevel">
          <p className="text-[10px] text-gray-400 font-pixel uppercase">Official Team Code</p>
          <p className="text-2xl font-mono font-bold text-green-400 tracking-wider">
            {registeredCode}
          </p>
          <button
            onClick={copyCode}
            className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-xs font-pixel text-gray-200 rounded bevel transition-colors cursor-pointer"
          >
            {copied ? '✓ Copied!' : 'Copy Code'}
          </button>
        </div>

        <p className="text-xs text-gray-400 font-mono-pixel">
          A confirmation receipt has been scheduled for all team members. Keep your code for onsite check-in!
        </p>

        <button
          onClick={() => {
            setRegisteredCode(null);
            localStorage.removeItem('crafthacks_registered_code');
          }}
          className="text-xs text-gray-500 hover:text-gray-300 underline font-mono-pixel"
        >
          Register another team
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Honeypot field (hidden from users) */}
      <input
        {...register('website')}
        type="text"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />

      {/* Step Indicator Header */}
      <ol
        role="navigation"
        aria-label="Registration Steps"
        className="flex items-center justify-between border-b border-gray-800 pb-3 text-xs font-pixel"
      >
        <li
          className={`flex items-center gap-1.5 ${
            step === 1 ? 'text-[#ffb46b]' : 'text-gray-500'
          }`}
          aria-current={step === 1 ? 'step' : undefined}
        >
          <span className="w-5 h-5 rounded-full border flex items-center justify-center text-[10px]">
            1
          </span>
          <span>Team</span>
        </li>
        <li className="text-gray-600">┈┈</li>
        <li
          className={`flex items-center gap-1.5 ${
            step === 2 ? 'text-[#ffb46b]' : 'text-gray-500'
          }`}
          aria-current={step === 2 ? 'step' : undefined}
        >
          <span className="w-5 h-5 rounded-full border flex items-center justify-center text-[10px]">
            2
          </span>
          <span>Members</span>
        </li>
        <li className="text-gray-600">┈┈</li>
        <li
          className={`flex items-center gap-1.5 ${
            step === 3 ? 'text-[#ffb46b]' : 'text-gray-500'
          }`}
          aria-current={step === 3 ? 'step' : undefined}
        >
          <span className="w-5 h-5 rounded-full border flex items-center justify-center text-[10px]">
            3
          </span>
          <span>Review</span>
        </li>
      </ol>

      {/* Server Error Alert Banner */}
      {serverError && (
        <div
          role="alert"
          className="p-3 bg-red-950/80 border-2 border-red-500 rounded text-xs text-red-200 bevel"
        >
          ⚠️ {serverError}
        </div>
      )}

      {/* STEP 1: Team Name and Track Selection */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label htmlFor="team-name" className="block text-xs font-pixel text-gray-200 mb-1.5">
              Team Name *
            </label>
            <input
              id="team-name"
              {...register('team.name')}
              placeholder="e.g. Voxel Crafters"
              aria-invalid={!!errors.team?.name}
              aria-describedby={errors.team?.name ? 'team-name-error' : undefined}
              className="w-full px-3 py-2 bg-black/60 border-2 border-gray-700 focus:border-[#ffb46b] rounded text-sm text-white outline-none font-mono"
            />
            {errors.team?.name && (
              <p id="team-name-error" className="mt-1 text-xs text-red-400 font-pixel">
                {errors.team.name.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-pixel text-gray-200 mb-2">
              Select Track *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {tracks.map((t) => {
                const selected = formValues.team?.track === t.slug;
                return (
                  <button
                    key={t.slug}
                    type="button"
                    onClick={() => setValue('team.track', t.slug, { shouldDirty: true })}
                    className={`p-2.5 text-left rounded border-2 transition-all cursor-pointer ${
                      selected
                        ? 'bg-amber-950/60 border-[#ffb46b] text-white bevel-pressed'
                        : 'bg-black/50 border-gray-800 hover:border-gray-600 text-gray-300'
                    }`}
                  >
                    <div className="text-xs font-pixel text-[#ffb46b] mb-1">{t.title}</div>
                    <div className="text-[11px] text-gray-400 line-clamp-2">
                      {t.summary}
                    </div>
                  </button>
                );
              })}
            </div>
            {errors.team?.track && (
              <p className="mt-1 text-xs text-red-400 font-pixel">
                {errors.team.track.message}
              </p>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleNextStep}
              className="px-5 py-2.5 bg-[#5b8c32] hover:bg-[#6ba33b] text-white font-pixel text-xs rounded bevel cursor-pointer"
            >
              Next: Members →
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Team Members Cards */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-pixel text-gray-300">
              Members ({fields.length}/4)
            </span>
            {fields.length < 4 && (
              <button
                type="button"
                onClick={() =>
                  append({ name: '', email: '', institution: '', isLeader: false })
                }
                className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-[11px] font-pixel text-gray-200 rounded bevel cursor-pointer"
              >
                + Add Member
              </button>
            )}
          </div>

          {fields.map((field, idx) => (
            <div
              key={field.id}
              className="p-3 bg-black/50 border-2 border-gray-800 rounded-lg space-y-3 bevel"
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-pixel text-[#ffb46b]">
                  Member #{idx + 1}
                </span>

                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-xs text-gray-300 cursor-pointer">
                    <input
                      type="radio"
                      name="teamLeader"
                      checked={formValues.members?.[idx]?.isLeader || false}
                      onChange={() => {
                        fields.forEach((_, fIdx) => {
                          setValue(`members.${fIdx}.isLeader`, fIdx === idx, {
                            shouldDirty: true,
                          });
                        });
                      }}
                      className="accent-[#ffb46b]"
                    />
                    <span className="text-[11px] font-pixel">Leader</span>
                  </label>

                  {fields.length > 2 && (
                    <button
                      type="button"
                      onClick={() => remove(idx)}
                      className="text-red-400 hover:text-red-300 text-xs"
                      aria-label={`Remove Member ${idx + 1}`}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <input
                    {...register(`members.${idx}.name` as const)}
                    placeholder="Full Name *"
                    className="w-full px-2.5 py-1.5 bg-black/60 border border-gray-700 focus:border-[#ffb46b] rounded text-xs text-white outline-none"
                  />
                  {errors.members?.[idx]?.name && (
                    <p className="mt-1 text-[10px] text-red-400">
                      {errors.members[idx]?.name?.message}
                    </p>
                  )}
                </div>

                <div>
                  <input
                    {...register(`members.${idx}.email` as const)}
                    type="email"
                    placeholder="Email Address *"
                    className="w-full px-2.5 py-1.5 bg-black/60 border border-gray-700 focus:border-[#ffb46b] rounded text-xs text-white outline-none"
                  />
                  {errors.members?.[idx]?.email && (
                    <p className="mt-1 text-[10px] text-red-400">
                      {errors.members[idx]?.email?.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <input
                  {...register(`members.${idx}.institution` as const)}
                  placeholder="College / Company (Optional)"
                  className="w-full px-2.5 py-1.5 bg-black/60 border border-gray-700 focus:border-[#ffb46b] rounded text-xs text-white outline-none"
                />
              </div>
            </div>
          ))}

          {errors.members?.root && (
            <p className="text-xs text-red-400 font-pixel">
              {errors.members.root.message}
            </p>
          )}

          <div className="flex justify-between pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-pixel text-xs rounded bevel cursor-pointer"
            >
              ← Back
            </button>
            <button
              type="button"
              onClick={handleNextStep}
              className="px-5 py-2.5 bg-[#5b8c32] hover:bg-[#6ba33b] text-white font-pixel text-xs rounded bevel cursor-pointer"
            >
              Next: Review →
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Review and Consent */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="p-3 bg-black/60 border-2 border-gray-800 rounded-lg space-y-2 text-xs bevel">
            <div className="font-pixel text-[#ffb46b] mb-1">Roster Summary</div>
            <p className="text-gray-300">
              <strong>Team:</strong> {formValues.team?.name}
            </p>
            <p className="text-gray-300">
              <strong>Track:</strong> {formValues.team?.track}
            </p>
            <div className="pt-2 border-t border-gray-800 space-y-1">
              {formValues.members?.map((m, i) => (
                <div key={i} className="text-gray-400 text-[11px]">
                  • {m.name || 'Member'} ({m.email}) {m.isLeader && '👑 Leader'}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('consent.codeOfConduct')}
                className="mt-0.5 accent-[#ffb46b]"
              />
              <span className="text-gray-300 text-[11px]">
                I and my team have read and agree to the{' '}
                <a href="/code-of-conduct" className="text-[#ffb46b] underline" target="_blank" rel="noopener noreferrer">
                  Code of Conduct & Rules
                </a>
                . *
              </span>
            </label>

            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('consent.privacy')}
                className="mt-0.5 accent-[#ffb46b]"
              />
              <span className="text-gray-300 text-[11px]">
                I agree to the{' '}
                <a href="/privacy" className="text-[#ffb46b] underline" target="_blank" rel="noopener noreferrer">
                  Privacy Policy
                </a>{' '}
                regarding event communications and DPDP data handling. *
              </span>
            </label>

            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('consent.sponsorSharing')}
                className="mt-0.5 accent-[#ffb46b]"
              />
              <span className="text-gray-400 text-[11px]">
                (Optional) Share resume with event sponsors for recruitment.
              </span>
            </label>
          </div>

          {/* Turnstile Bot Verification Widget */}
          <div className="py-2 flex justify-center">
            <Turnstile
              siteKey={clientEnv.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
              onSuccess={(token) => setValue('turnstileToken', token, { shouldDirty: true })}
              options={{ appearance: 'interaction-only' }}
            />
          </div>

          <div className="flex justify-between pt-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-pixel text-xs rounded bevel cursor-pointer"
            >
              ← Back
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`px-6 py-2.5 font-pixel text-xs text-white rounded bevel shadow-lg cursor-pointer ${
                submitting
                  ? 'bg-gray-700 cursor-not-allowed'
                  : 'bg-green-700 hover:bg-green-600'
              }`}
            >
              {submitting ? 'Registering...' : 'Submit Registration 🚀'}
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
