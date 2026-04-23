import { useEffect, useRef, useState, useCallback } from 'react';
import { useSession } from '../context/SessionContext';
import { SCREEN_MONITOR_DEBOUNCE_MS } from '../utils/constants';

interface ScreenMonitorOptions {
  /** C2/C3에서만 true */
  enabled: boolean;
  /** 이탈 감지 시 콜백 (타이머 정지) */
  onDisengage: () => void;
  /** 복귀 감지 시 콜백 (타이머 재개) */
  onReengage: () => void;
}

/**
 * Screen Monitoring Hook
 * - document.visibilitychange (탭 전환 감지)
 * - window.blur / focus (다른 창/앱 전환 감지)
 *
 * C2/C3에서 활성화: 카톡/유튜브 등 다른 앱으로 전환 시 타이머 자동 정지
 */
export function useScreenMonitor({
  enabled,
  onDisengage,
  onReengage,
}: ScreenMonitorOptions) {
  const { logEvent } = useSession();
  const [isDisengaged, setIsDisengaged] = useState(false);
  const [pausedDurationMs, setPausedDurationMs] = useState(0);
  const [pauseCount, setPauseCount] = useState(0);
  const disengageTimeRef = useRef<number | null>(null);
  const debounceRef = useRef<number | null>(null);
  const pauseIntervalRef = useRef<number | null>(null);
  const onDisengageRef = useRef(onDisengage);
  const onReengageRef = useRef(onReengage);
  onDisengageRef.current = onDisengage;
  onReengageRef.current = onReengage;

  const triggerDisengage = useCallback(() => {
    if (disengageTimeRef.current !== null) return; // 이미 이탈 상태

    disengageTimeRef.current = Date.now();
    setIsDisengaged(true);
    setPauseCount(prev => prev + 1);
    logEvent('screen_monitor_pause', { reason: 'tab_or_window_switch' });
    onDisengageRef.current();

    // 일시정지 시간 카운터
    pauseIntervalRef.current = window.setInterval(() => {
      if (disengageTimeRef.current) {
        setPausedDurationMs(Date.now() - disengageTimeRef.current);
      }
    }, 100);
  }, [logEvent]);

  const triggerReengage = useCallback(() => {
    if (disengageTimeRef.current === null) return; // 이미 활성 상태

    const duration = Date.now() - disengageTimeRef.current;
    logEvent('screen_monitor_resume', { pausedMs: duration });
    disengageTimeRef.current = null;
    setIsDisengaged(false);
    setPausedDurationMs(0);
    onReengageRef.current();

    if (pauseIntervalRef.current) {
      clearInterval(pauseIntervalRef.current);
      pauseIntervalRef.current = null;
    }
  }, [logEvent]);

  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // debounce로 짧은 전환 필터링
        debounceRef.current = window.setTimeout(() => {
          triggerDisengage();
        }, SCREEN_MONITOR_DEBOUNCE_MS);
      } else {
        // debounce 취소 (짧은 전환이었으면)
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
          debounceRef.current = null;
        }
        triggerReengage();
      }
    };

    const handleBlur = () => {
      debounceRef.current = window.setTimeout(() => {
        triggerDisengage();
      }, SCREEN_MONITOR_DEBOUNCE_MS);
    };

    const handleFocus = () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      triggerReengage();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (pauseIntervalRef.current) clearInterval(pauseIntervalRef.current);
    };
  }, [enabled, triggerDisengage, triggerReengage]);

  return {
    isDisengaged,        // 현재 이탈 상태인지
    pausedDurationMs,    // 현재 이탈 경과 시간
    pauseCount,          // 총 이탈 횟수
  };
}
