import { useEffect, useRef, useCallback } from 'react';
import { MOUSE_THROTTLE_MS } from '../utils/constants';
import { useSession } from '../context/SessionContext';

/**
 * Tracks keyboard, mouse, and focus activity.
 * Returns refs to last activity timestamps.
 */
export function useActivityTracker() {
  const { logEvent } = useSession();
  const lastKeyTime = useRef(Date.now());
  const lastMouseTime = useRef(Date.now());
  const lastBlurTime = useRef<number | null>(null);
  const isWindowFocused = useRef(true);
  const lastMouseLogTime = useRef(0);

  const handleKeyDown = useCallback(() => {
    lastKeyTime.current = Date.now();
    logEvent('keypress', { key: 'redacted' });
  }, [logEvent]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    lastMouseTime.current = Date.now();
    const now = Date.now();
    if (now - lastMouseLogTime.current > MOUSE_THROTTLE_MS) {
      lastMouseLogTime.current = now;
      logEvent('mouse_move', { x: e.clientX, y: e.clientY });
    }
  }, [logEvent]);

  const handleClick = useCallback((e: MouseEvent) => {
    lastMouseTime.current = Date.now();
    const target = e.target as HTMLElement;
    logEvent('mouse_click', { target: target.tagName + (target.id ? `#${target.id}` : '') });
  }, [logEvent]);

  const handleBlur = useCallback(() => {
    lastBlurTime.current = Date.now();
    isWindowFocused.current = false;
    logEvent('window_blur');
  }, [logEvent]);

  const handleFocus = useCallback(() => {
    lastBlurTime.current = null;
    isWindowFocused.current = true;
    lastKeyTime.current = Date.now();
    lastMouseTime.current = Date.now();
    logEvent('window_focus');
  }, [logEvent]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [handleKeyDown, handleMouseMove, handleClick, handleBlur, handleFocus]);

  return { lastKeyTime, lastMouseTime, lastBlurTime, isWindowFocused };
}
