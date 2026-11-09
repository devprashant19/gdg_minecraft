import { describe, it, expect } from 'vitest';
import { supportsWebGL2, prefersReducedMotion, safeLocalStorage } from '@/lib/capabilities';

describe('System Capabilities & Fallback Utilities', () => {
  it('detects capabilities safely in mock environment', () => {
    expect(typeof supportsWebGL2()).toBe('boolean');
    expect(typeof prefersReducedMotion()).toBe('boolean');
  });

  it('safely handles local storage without throwing', () => {
    safeLocalStorage.setItem('test_key', 'test_value');
    expect(safeLocalStorage.getItem('test_key')).toBe('test_value');
    safeLocalStorage.removeItem('test_key');
    expect(safeLocalStorage.getItem('test_key')).toBe(null);
  });
});

