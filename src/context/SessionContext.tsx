import { createContext, useContext, useReducer, useEffect, useState, type ReactNode } from 'react';
import type { SessionState, SessionAction, SessionEvent, EventType } from '../types/session';
import { sessionReducer, initialSessionState } from './sessionReducer';
import { SESSION_STORAGE_KEY, LOCAL_STORAGE_KEY } from '../utils/constants';

interface SessionContextType {
  state: SessionState;
  dispatch: React.Dispatch<SessionAction>;
  logEvent: (type: EventType, payload?: Record<string, unknown>) => void;
}

const SessionContext = createContext<SessionContextType | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [showRecovery, setShowRecovery] = useState(false);
  const [pendingState, setPendingState] = useState<SessionState | null>(null);

  const [state, dispatch] = useReducer(sessionReducer, initialSessionState, () => {
    // Check sessionStorage for saved state — but don't auto-restore if session was active
    try {
      const saved = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as SessionState;
        // If there was an active session or participant set, show recovery dialog
        if (parsed.participantId && (parsed.isSessionActive || parsed.currentSessionIndex > 0)) {
          // Don't restore immediately — show dialog
          return initialSessionState;
        }
        // Non-active state: restore silently (e.g. just participant set)
        if (parsed.participantId) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return initialSessionState;
  });

  // Check for recovery on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as SessionState;
        if (parsed.participantId && (parsed.isSessionActive || parsed.currentSessionIndex > 0)) {
          setPendingState(parsed);
          setShowRecovery(true);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // Persist to sessionStorage on every state change
  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [state]);

  // Helper to log events
  const logEvent = (type: EventType, payload: Record<string, unknown> = {}) => {
    const event: SessionEvent = {
      timestamp: Date.now(),
      type,
      payload,
    };
    dispatch({ type: 'LOG_EVENT', event });

    // Flush to localStorage
    try {
      const currentLog = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]') as SessionEvent[];
      currentLog.push(event);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(currentLog));
    } catch {
      // ignore
    }
  };

  const handleRestore = () => {
    if (pendingState) {
      dispatch({ type: 'RESTORE', state: pendingState });
    }
    setShowRecovery(false);
    setPendingState(null);
  };

  const handleDiscard = () => {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    setShowRecovery(false);
    setPendingState(null);
  };

  return (
    <SessionContext.Provider value={{ state, dispatch, logEvent }}>
      {/* Recovery Dialog Overlay */}
      {showRecovery && pendingState && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{ background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(8px)' }}>
          <div className="max-w-md w-full mx-4 p-8 rounded-2xl fade-in"
            style={{
              background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.95), rgba(15, 23, 42, 0.95))',
              border: '1px solid rgba(129, 140, 248, 0.3)',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
            }}>
            <div className="text-3xl mb-4 text-center">🔄</div>
            <h2 className="text-xl font-bold text-white text-center mb-3">
              이전 세션이 감지되었습니다
            </h2>
            <div className="p-4 rounded-xl mb-6" style={{
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(129, 140, 248, 0.15)',
            }}>
              <div className="space-y-1 text-sm text-indigo-200">
                <p>피험자 번호: <strong className="text-white">#{pendingState.participantId}</strong></p>
                <p>진행 세션: <strong className="text-white">{pendingState.currentSessionIndex + 1} / 3</strong></p>
                <p>상태: <strong className="text-white">
                  {pendingState.isSessionActive ? '세션 진행 중이었음' : '세션 간 전환 중이었음'}
                </strong></p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleRestore}
                className="flex-1 py-3 rounded-xl font-bold transition-all"
                style={{
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                이어서 진행
              </button>
              <button
                onClick={handleDiscard}
                className="flex-1 py-3 rounded-xl font-bold transition-all"
                style={{
                  background: 'rgba(239, 68, 68, 0.2)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#fca5a5',
                  cursor: 'pointer',
                }}
              >
                처음부터
              </button>
            </div>
          </div>
        </div>
      )}
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}
