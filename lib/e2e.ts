import { useGame, SectionId, QualityTier } from './store';

export interface IslandE2EHook {
  teleport: (stationId: string) => void;
  setTime: (time: number) => void;
  setTier: (tier: QualityTier) => void;
  freeze: () => void;
  isFrozen: boolean;
}

declare global {
  interface Window {
    __island?: IslandE2EHook;
  }
}

let isFrozenState = false;

export function isE2EFrozen(): boolean {
  return isFrozenState;
}

export function isE2EActive(): boolean {
  if (typeof window === 'undefined') return false;
  if (process.env.NEXT_PUBLIC_E2E === '1') return true;
  return new URLSearchParams(window.location.search).has('e2e');
}

export function initializeE2E(): void {
  if (typeof window === 'undefined') return;
  if (!isE2EActive()) return;

  const store = useGame.getState();

  // Disable intro tour in deterministic E2E mode
  store.markTourSeen();
  store.setStage('play');

  window.__island = {
    teleport: (stationId: string) => {
      useGame.getState().travelTo(stationId as SectionId);
    },
    setTime: (time: number) => {
      useGame.getState().setTimeOfDay(time);
    },
    setTier: (tier: QualityTier) => {
      useGame.getState().setQualityTier(tier);
    },
    freeze: () => {
      isFrozenState = true;
    },
    get isFrozen() {
      return isFrozenState;
    },
  };
}
