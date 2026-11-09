import { useGame } from './store';

export function isTypingTarget(el: Element | null): boolean {
  if (!el) return false;
  return (
    el.tagName === 'INPUT' ||
    el.tagName === 'TEXTAREA' ||
    el.tagName === 'SELECT' ||
    el.getAttribute('contenteditable') === 'true'
  );
}

export function initTypingGuard() {
  if (typeof window === 'undefined') return () => {};

  const handleFocusIn = (e: FocusEvent) => {
    const isTarget = isTypingTarget(e.target as Element);
    useGame.getState().setTyping(isTarget);
  };

  const handleFocusOut = () => {
    queueMicrotask(() => {
      const isTarget = isTypingTarget(document.activeElement);
      useGame.getState().setTyping(isTarget);
    });
  };

  document.addEventListener('focusin', handleFocusIn);
  document.addEventListener('focusout', handleFocusOut);

  return () => {
    document.removeEventListener('focusin', handleFocusIn);
    document.removeEventListener('focusout', handleFocusOut);
  };
}

