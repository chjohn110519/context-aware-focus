import { useEffect, useRef, useState, useCallback } from 'react';
import { IDLE_THRESHOLD_MS, BLUR_THRESHOLD_MS } from '../utils/constants';
import { useSession } from '../context/SessionContext';

interface IdleDetectorOptions {
  enabled?: boolean;
  lastKeyTime: React.RefObject<number>;
  lastMouseTime: React.RefObject<number>;
  lastBlurTime: React.RefObject<number | null>;
}

export function useIdleDetector({
  enabled = true,
  lastKeyTime,
  lastMouseTime,
  lastBlurTime,
}: IdleDetectorOptions) {
  const [isIdle, setIsIdle] = useState(false);
  const idleStartRef = useRef<number | null>(null);
  const { logEvent } = useSession();

  const checkIdle = useCallback(() => {
    if (!enabled) return;

    const now = Date.now();
    const keyIdle = now - lastKeyTime.current > IDLE_THRESHOLD_MS;
    const mouseIdle = now - lastMouseTime.current > IDLE_THRESHOLD_MS;
    const blurIdle = lastBlurTime.current !== null && (now - lastBlurTime.current > BLUR_THRESHOLD_MS);

    const shouldBeIdle = (keyIdle && mouseIdle) || blurIdle;

    setIsIdle(prev => {
      if (!prev && shouldBeIdle) {
        // Transition to idle
        idleStartRef.current = now;
        logEvent('idle_start');
        return true;
      }
      if (prev && !shouldBeIdle) {
        // Transition from idle
        const duration = idleStartRef.current ? now - idleStartRef.current : 0;
        logEvent('idle_end', { duration_ms: duration });
        idleStartRef.current = null;
        return false;
      }
      return prev;
    });
  }, [enabled, lastKeyTime, lastMouseTime, lastBlurTime, logEvent]);

  useEffect(() => {
    if (!enabled) return;
    const interval = setInterval(checkIdle, 100);
    return () => clearInterval(interval);
  }, [checkIdle, enabled]);

  return { isIdle };
}
