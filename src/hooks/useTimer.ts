import { useState, useEffect, useRef, useCallback } from 'react';
import { SESSION_DURATION_MS } from '../utils/constants';

interface TimerOptions {
  durationMs?: number;
  onComplete?: () => void;
  autoStart?: boolean;
}

export function useTimer({
  durationMs = SESSION_DURATION_MS,
  onComplete,
  autoStart = false,
}: TimerOptions = {}) {
  const [remainingMs, setRemainingMs] = useState(durationMs);
  const [isRunning, setIsRunning] = useState(autoStart);
  const intervalRef = useRef<number | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const start = useCallback(() => {
    setIsRunning(true);
  }, []);

  const stop = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    setRemainingMs(durationMs);
    setIsRunning(false);
  }, [durationMs]);

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    const startTime = Date.now();
    const startRemaining = remainingMs;

    intervalRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newRemaining = Math.max(0, startRemaining - elapsed);
      setRemainingMs(newRemaining);

      if (newRemaining <= 0) {
        setIsRunning(false);
        if (intervalRef.current) clearInterval(intervalRef.current);
        onCompleteRef.current?.();
      }
    }, 100);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]); // eslint-disable-line react-hooks/exhaustive-deps

  const minutes = Math.floor(remainingMs / 60000);
  const seconds = Math.floor((remainingMs % 60000) / 1000);
  const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return {
    remainingMs,
    formatted,
    minutes,
    seconds,
    isRunning,
    start,
    stop,
    reset,
    isWarning: remainingMs < 60000 && remainingMs > 0,
  };
}
