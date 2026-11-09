import { describe, it, expect, beforeEach } from 'vitest';
import { useGame, selectControlsDisabled } from '@/lib/store';
import { isTypingTarget } from '@/lib/typing-guard';

describe('Phase 2: Character Controls & Player Rules', () => {
  beforeEach(() => {
    useGame.setState({
      stage: 'play',
      nearbyStation: null,
      openSection: null,
      playerTarget: null,
      typing: false,
      formDirty: false,
      portalTransition: false,
      pendingNav: null,
      visited: [],
      timeOfDay: 0.72,
      qualityTier: 'medium',
      soundOn: false,
      reducedMotion: false,
      tourSeen: false,
      mouseAimLocked: false,
    });
  });

  it('correctly disables controls across all specified blocking conditions', () => {
    const base = useGame.getState();

    // Normal play: controls enabled
    expect(selectControlsDisabled({ ...base, stage: 'play' })).toBe(false);

    // Non-play stages
    expect(selectControlsDisabled({ ...base, stage: 'loading' })).toBe(true);
    expect(selectControlsDisabled({ ...base, stage: 'intro' })).toBe(true);
    expect(selectControlsDisabled({ ...base, stage: 'tour' })).toBe(true);

    // Interactive panel open
    expect(selectControlsDisabled({ ...base, openSection: 'tracks' })).toBe(true);
    expect(selectControlsDisabled({ ...base, openSection: 'register' })).toBe(true);

    // User is typing in a form input
    expect(selectControlsDisabled({ ...base, typing: true })).toBe(true);

    // Portal transition running
    expect(selectControlsDisabled({ ...base, portalTransition: true })).toBe(true);
  });

  it('correctly identifies typing targets to prevent WASD movement bleed', () => {
    const input = document.createElement('input');
    const textarea = document.createElement('textarea');
    const select = document.createElement('select');
    const divEditable = document.createElement('div');
    divEditable.setAttribute('contenteditable', 'true');
    const button = document.createElement('button');
    const canvas = document.createElement('canvas');

    expect(isTypingTarget(input)).toBe(true);
    expect(isTypingTarget(textarea)).toBe(true);
    expect(isTypingTarget(select)).toBe(true);
    expect(isTypingTarget(divEditable)).toBe(true);

    // Regular game elements are not typing targets
    expect(isTypingTarget(button)).toBe(false);
    expect(isTypingTarget(canvas)).toBe(false);
    expect(isTypingTarget(null)).toBe(false);
  });
});

