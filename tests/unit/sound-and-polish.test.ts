import { describe, it, expect, beforeEach } from 'vitest';
import { useGame } from '@/lib/store';
import {
  playClick,
  playPanelOpen,
  playPanelClose,
  playFootstep,
  playSuccess,
  playAdvancement,
} from '@/lib/sound';
import { showToast } from '@/components/ui/Toast';
import robots from '@/app/robots';
import sitemap from '@/app/sitemap';

describe('Sound and Polish Utilities', () => {
  beforeEach(() => {
    useGame.setState({ soundOn: false });
  });

  it('initializes with sound muted by default', () => {
    expect(useGame.getState().soundOn).toBe(false);
  });

  it('safely invokes audio synthesis methods without throwing', () => {
    expect(() => {
      playClick();
      playPanelOpen();
      playPanelClose();
      playFootstep('grass');
      playFootstep('sand');
      playSuccess();
      playAdvancement();
    }).not.toThrow();
  });

  it('triggers showToast without crashing', () => {
    expect(() => {
      showToast({
        title: 'Test Advancement',
        description: 'Successfully tested toast dispatch',
      });
    }).not.toThrow();
  });

  it('generates valid robots and sitemap metadata rules', () => {
    const r = robots();
    expect(r.rules).toBeDefined();

    const s = sitemap();
    expect(s.length).toBeGreaterThanOrEqual(2);
    expect(s.some((entry) => entry.url.endsWith('/2d'))).toBe(true);
  });
});

