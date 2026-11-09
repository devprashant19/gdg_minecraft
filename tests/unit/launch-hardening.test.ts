import { describe, it, expect, vi } from 'vitest';
import nextConfig from '../../next.config';
import { trackEvent } from '../../lib/analytics';
import { initializeE2E, isE2EFrozen } from '../../lib/e2e';
import { clientEnv } from '../../lib/env';
import fs from 'fs';
import path from 'path';

describe('Phase 7: Performance, Launch & Security Hardening', () => {
  it('next.config.ts configures comprehensive security headers and CSP', async () => {
    expect(nextConfig.headers).toBeDefined();
    const headersConfig = await nextConfig.headers!();
    expect(headersConfig.length).toBeGreaterThanOrEqual(2);

    const rootHeaders = headersConfig.find((h) => h.source === '/:path*');
    expect(rootHeaders).toBeDefined();

    const getHeader = (key: string) => rootHeaders?.headers.find((h) => h.key === key)?.value;

    // Security headers
    expect(getHeader('Strict-Transport-Security')).toContain('max-age=63072000');
    expect(getHeader('X-Content-Type-Options')).toBe('nosniff');
    expect(getHeader('X-Frame-Options')).toBe('DENY');
    expect(getHeader('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
    expect(getHeader('Permissions-Policy')).toContain('camera=()');

    // CSP directives
    const csp = getHeader('Content-Security-Policy');
    expect(csp).toBeDefined();
    expect(csp).toContain("'wasm-unsafe-eval'"); // Required for Rapier WASM
    expect(csp).toContain('https://challenges.cloudflare.com'); // Turnstile
    expect(csp).toContain('https://cloud.umami.is'); // Umami Analytics
    expect(csp).toContain('blob:'); // Workers & Blobs
  });

  it('next.config.ts configures immutable caching headers for static 3D assets', async () => {
    const headersConfig = await nextConfig.headers!();
    const assetHeaders = headersConfig.find((h) => h.source.includes('models|textures|basis'));
    expect(assetHeaders).toBeDefined();

    const cacheHeader = assetHeaders?.headers.find((h) => h.key === 'Cache-Control')?.value;
    expect(cacheHeader).toContain('public');
    expect(cacheHeader).toContain('max-age=31536000');
    expect(cacheHeader).toContain('immutable');
  });

  it('clientEnv contains strictly zero private server secrets', () => {
    const rawKeys = Object.keys(clientEnv);
    for (const key of rawKeys) {
      expect(key.startsWith('NEXT_PUBLIC_')).toBe(true);
    }
    const serialized = JSON.stringify(clientEnv);
    expect(serialized).not.toContain('SUPABASE_SECRET_KEY');
    expect(serialized).not.toContain('TURNSTILE_SECRET_KEY');
    expect(serialized).not.toContain('RESEND_API_KEY');
    expect(serialized).not.toContain('CRON_SECRET');
    expect(serialized).not.toContain('RATE_LIMIT_SALT');
  });

  it('analytics respects Do Not Track (DNT) header', () => {
    const mockTrack = vi.fn();
    window.umami = { track: mockTrack };

    // Simulate DNT active
    Object.defineProperty(navigator, 'doNotTrack', { value: '1', configurable: true });
    trackEvent('station_open', { id: 'tracks', via: 'walk' });
    expect(mockTrack).not.toHaveBeenCalled();

    // Simulate DNT inactive
    Object.defineProperty(navigator, 'doNotTrack', { value: '0', configurable: true });
    trackEvent('station_open', { id: 'tracks', via: 'walk' });
    expect(mockTrack).toHaveBeenCalledWith('station_open', { id: 'tracks', via: 'walk' });
  });

  it('E2E testing hook initializes window.__island and handles freeze()', () => {
    // Set NEXT_PUBLIC_E2E or URL search
    process.env.NEXT_PUBLIC_E2E = '1';
    initializeE2E();

    expect(window.__island).toBeDefined();
    expect(typeof window.__island?.teleport).toBe('function');
    expect(typeof window.__island?.setTime).toBe('function');
    expect(typeof window.__island?.setTier).toBe('function');
    expect(typeof window.__island?.freeze).toBe('function');

    expect(is2EFrozenOrState()).toBe(false);
    window.__island?.freeze();
    expect(isE2EFrozen()).toBe(true);
  });

  it('fallback.svg exists, is valid SVG, and contains voxel graphics', () => {
    const svgPath = path.join(process.cwd(), 'public', 'fallback.svg');
    expect(fs.existsSync(svgPath)).toBe(true);

    const content = fs.readFileSync(svgPath, 'utf-8');
    expect(content).toContain('<svg');
    expect(content).toContain('</svg>');
    expect(content).toContain('VOXEL ISLAND HACKATHON');
  });
});

function is2EFrozenOrState(): boolean {
  return isE2EFrozen();
}
