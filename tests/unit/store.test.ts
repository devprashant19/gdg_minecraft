import { describe, it, expect, beforeEach } from 'vitest';
import { useGame, selectControlsDisabled } from '@/lib/store';

describe('Zustand Game Store', () => {
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

  it('handles zone entry and exit correctly', () => {
    const { enterZone, leaveZone } = useGame.getState();

    enterZone('prizes');
    expect(useGame.getState().nearbyStation).toBe('prizes');

    // Leaving another zone should not clear the current one
    leaveZone('tracks');
    expect(useGame.getState().nearbyStation).toBe('prizes');

    // Leaving the active zone clears it
    leaveZone('prizes');
    expect(useGame.getState().nearbyStation).toBe(null);
  });

  it('tracks visited stations and opens sections', () => {
    const { open, close } = useGame.getState();

    open('welcome');
    expect(useGame.getState().openSection).toBe('welcome');
    expect(useGame.getState().visited).toContain('welcome');

    // Visiting again should not duplicate entry in visited array
    open('welcome');
    expect(useGame.getState().visited.filter((v) => v === 'welcome')).toHaveLength(1);

    // Switching to a different section leaves only that section open
    open('schedule');
    expect(useGame.getState().openSection).toBe('schedule');

    close();
    expect(useGame.getState().openSection).toBe(null);
  });

  it('travelTo closes open panel and sets playerTarget', () => {
    const { open, travelTo } = useGame.getState();

    open('tracks');
    expect(useGame.getState().openSection).toBe('tracks');

    travelTo('venue');
    expect(useGame.getState().openSection).toBe(null);
    expect(useGame.getState().playerTarget).toBe('venue');
  });

  it('guards dirty registration form on navigation attempt and allows cancelNav', () => {
    const { open, setFormDirty, cancelNav } = useGame.getState();

    open('register');
    setFormDirty(true);

    // Attempting to navigate to another station sets pendingNav without opening it immediately
    open('faq');
    expect(useGame.getState().openSection).toBe('register');
    expect(useGame.getState().pendingNav).toEqual({ kind: 'travel', to: 'faq' });

    // Cancelling navigation preserves the dirty form and clears pendingNav
    cancelNav();
    expect(useGame.getState().pendingNav).toBe(null);
    expect(useGame.getState().openSection).toBe('register');
    expect(useGame.getState().formDirty).toBe(true);

    // Confirm navigation executes the transition
    useGame.getState().open('faq');
    useGame.getState().confirmNav();
    expect(useGame.getState().playerTarget).toBe('faq');
    expect(useGame.getState().openSection).toBe(null);
    expect(useGame.getState().formDirty).toBe(false);
  });

  it('computes selectControlsDisabled accurately across blocking states', () => {
    const state = useGame.getState();

    expect(selectControlsDisabled({ ...state, stage: 'play' })).toBe(false);
    expect(selectControlsDisabled({ ...state, stage: 'loading' })).toBe(true);
    expect(selectControlsDisabled({ ...state, stage: 'tour' })).toBe(true);
    expect(selectControlsDisabled({ ...state, stage: 'intro' })).toBe(true);
    expect(selectControlsDisabled({ ...state, openSection: 'schedule' })).toBe(true);
    expect(selectControlsDisabled({ ...state, typing: true })).toBe(true);
    expect(selectControlsDisabled({ ...state, portalTransition: true })).toBe(true);
  });
});
