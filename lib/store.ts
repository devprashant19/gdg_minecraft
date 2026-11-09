import { create } from 'zustand';
import { persist, createJSONStorage, subscribeWithSelector } from 'zustand/middleware';
import { safeLocalStorage } from './capabilities';

export type SectionId =
  | 'welcome'
  | 'tracks'
  | 'schedule'
  | 'prizes'
  | 'sponsors'
  | 'team'
  | 'faq'
  | 'venue'
  | 'register';

export type QualityTier = 'high' | 'medium' | 'low';
export type Stage = 'loading' | 'intro' | 'tour' | 'play';

export interface GameState {
  stage: Stage;
  nearbyStation: SectionId | null;
  openSection: SectionId | null;
  playerTarget: SectionId | null;
  typing: boolean;
  formDirty: boolean;
  portalTransition: boolean;
  pendingNav: { kind: 'travel' | 'close'; to?: SectionId } | null;
  visited: SectionId[];
  timeOfDay: number; // 0..1, 0.72 ≈ golden hour
  qualityTier: QualityTier;
  soundOn: boolean;
  reducedMotion: boolean;
  tourSeen: boolean;
}

export interface GameActions {
  enterZone: (id: SectionId) => void;
  leaveZone: (id: SectionId) => void;
  open: (id: SectionId) => void;
  close: () => void;
  travelTo: (id: SectionId) => void;
  arrive: () => void;
  confirmNav: () => void;
  cancelNav: () => void;
  setTyping: (typing: boolean) => void;
  setFormDirty: (formDirty: boolean) => void;
  setStage: (stage: Stage) => void;
  setTimeOfDay: (timeOfDay: number) => void;
  setQualityTier: (tier: QualityTier) => void;
  toggleSound: () => void;
  setReducedMotion: (reduced: boolean) => void;
  markTourSeen: () => void;
  setPortalTransition: (transition: boolean) => void;
}

export const selectControlsDisabled = (s: GameState): boolean =>
  s.stage !== 'play' || s.openSection !== null || s.typing || s.portalTransition;

export const useGame = create<GameState & GameActions>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        stage: 'loading',
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

        enterZone: (id) => set({ nearbyStation: id }),

        leaveZone: (id) => {
          if (get().nearbyStation === id) {
            set({ nearbyStation: null });
          }
        },

        open: (id) => {
          const s = get();
          if (s.openSection === 'register' && s.formDirty && id !== 'register') {
            return set({ pendingNav: { kind: 'travel', to: id } });
          }
          set({
            openSection: id,
            playerTarget: null,
            visited: s.visited.includes(id) ? s.visited : [...s.visited, id],
          });
        },

        close: () => {
          const s = get();
          if (s.openSection === 'register' && s.formDirty) {
            return set({ pendingNav: { kind: 'close' } });
          }
          set({ openSection: null, typing: false });
        },

        travelTo: (id) => {
          const s = get();
          if (s.openSection === 'register' && s.formDirty) {
            return set({ pendingNav: { kind: 'travel', to: id } });
          }
          set({ openSection: null, typing: false, playerTarget: id });
        },

        arrive: () => set({ playerTarget: null }),

        confirmNav: () => {
          const { pendingNav } = get();
          if (!pendingNav) return;
          set({ formDirty: false, pendingNav: null });
          if (pendingNav.kind === 'close') {
            get().close();
          } else if (pendingNav.kind === 'travel' && pendingNav.to) {
            get().travelTo(pendingNav.to);
          }
        },

        cancelNav: () => set({ pendingNav: null }),
        setTyping: (typing) => set({ typing }),
        setFormDirty: (formDirty) => set({ formDirty }),
        setStage: (stage) => set({ stage }),
        setTimeOfDay: (timeOfDay) => set({ timeOfDay }),
        setQualityTier: (qualityTier) => set({ qualityTier }),
        toggleSound: () => set((state) => ({ soundOn: !state.soundOn })),
        setReducedMotion: (reducedMotion) => set({ reducedMotion }),
        markTourSeen: () => set({ tourSeen: true }),
        setPortalTransition: (portalTransition) => set({ portalTransition }),
      }),
      {
        name: 'island-prefs',
        storage: createJSONStorage(() => safeLocalStorage),
        partialize: (s) => ({
          soundOn: s.soundOn,
          tourSeen: s.tourSeen,
          visited: s.visited,
        }),
      }
    )
  )
);
