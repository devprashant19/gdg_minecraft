'use client';

import React, { useState, useEffect, useSyncExternalStore } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { supportsWebGL2, prefersReducedMotion, safeLocalStorage } from '@/lib/capabilities';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { trackEvent } from '@/lib/analytics';
import { isE2EActive } from '@/lib/e2e';

const Experience = dynamic(() => import('./Experience'), { ssr: false });

function subscribe() {
  return () => {};
}

function getClientSnapshot(): 'render3d' | 'fallback-webgl' | 'fallback-motion' | 'fallback-forced' {
  if (typeof window === 'undefined') return 'render3d';
  if (process.env.NEXT_PUBLIC_FORCE_2D === '1') return 'fallback-forced';
  if (!supportsWebGL2()) return 'fallback-webgl';
  const force3d = safeLocalStorage.getItem('force3d');
  if (prefersReducedMotion() && force3d !== '1') return 'fallback-motion';
  return 'render3d';
}

function getServerSnapshot(): 'checking' {
  return 'checking';
}

export function ExperienceGate() {
  const router = useRouter();
  const status = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
  const [hasEntered, setHasEntered] = useState(() => isE2EActive());
  const [isRendered, setIsRendered] = useState(() => isE2EActive());

  useEffect(() => {
    if (status === 'fallback-forced') {
      trackEvent('fallback_2d', { reason: 'forced' });
      router.replace('/2d?reason=forced');
    } else if (status === 'fallback-webgl') {
      trackEvent('fallback_2d', { reason: 'webgl' });
      router.replace('/2d?reason=webgl');
    } else if (status === 'fallback-motion') {
      trackEvent('fallback_2d', { reason: 'motion' });
      router.replace('/2d?reason=motion');
    }
  }, [status, router]);

  // WebGL context lost listener fallback
  useEffect(() => {
    const handleContextLost = (e: Event) => {
      e.preventDefault();
      trackEvent('fallback_2d', { reason: 'context_lost' });
      router.replace('/2d?reason=webgl');
    };
    window.addEventListener('webglcontextlost', handleContextLost);
    return () => window.removeEventListener('webglcontextlost', handleContextLost);
  }, [router]);

  if (status !== 'render3d') {
    return null;
  }

  return (
    <>
      <Experience onRendered={() => setIsRendered(true)} />
      {!hasEntered && (
        <LoadingScreen
          isRendered={isRendered}
          onEnter={() => setHasEntered(true)}
        />
      )}
    </>
  );
}
