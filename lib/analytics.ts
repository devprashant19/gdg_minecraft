// Lightweight, zero-cookie, DNT-respecting Umami Analytics wrapper

export type AnalyticsEvent =
  | { name: 'station_open'; data: { id: string; via: 'walk' | 'hotbar' | 'click' | 'tour' } }
  | { name: 'registered'; data: { track: string; memberCount: number } }
  | { name: 'fallback_2d'; data: { reason: string } }
  | { name: 'tier'; data: { tier: string } };

declare global {
  interface Window {
    umami?: {
      track: (eventName: string, eventData?: Record<string, string | number>) => void;
    };
  }
}

/**
 * Tracks an anonymous user engagement event.
 * Strictly respects Do Not Track (DNT) and collects zero PII.
 */
export function trackEvent(
  name: AnalyticsEvent['name'],
  data?: Record<string, string | number>
): void {
  if (typeof window === 'undefined') return;

  // Respect user privacy and DNT header
  if (navigator.doNotTrack === '1' || (window as unknown as { doNotTrack?: string }).doNotTrack === '1') {
    return;
  }

  if (window.umami && typeof window.umami.track === 'function') {
    try {
      window.umami.track(name, data);
    } catch {
      // Fail silently without interrupting UI
    }
  }
}

