import type { ReactNode } from 'react';
import Timer from './Timer';
import ProgressBar from './ProgressBar';
import type { Condition } from '../../types/session';

interface SessionLayoutProps {
  condition: Condition;
  timerFormatted: string;
  timerWarning: boolean;
  isPaused?: boolean;
  currentQuestion?: number;
  totalQuestions?: number;
  children: ReactNode;
  /** C3: Forest widget (좌하단 고정) */
  forestWidget?: ReactNode;
  /** C2: FocusIndicator or C1: ManualPauseButton */
  topRight?: ReactNode;
  /** C2: Warning banner */
  banner?: ReactNode;
}

export default function SessionLayout({
  condition,
  timerFormatted,
  timerWarning,
  isPaused = false,
  currentQuestion,
  totalQuestions,
  children,
  forestWidget,
  topRight,
  banner,
}: SessionLayoutProps) {
  return (
    <div className={`session-container theme-${condition}`}>
      {banner}

      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5 border-b"
        style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>
        <div className="flex items-center gap-4">
          <Timer formatted={timerFormatted} isWarning={timerWarning} />
          {isPaused && (
            <span className="text-xs px-2 py-1 rounded-md font-semibold"
              style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5' }}>
              ⏸ 일시정지
            </span>
          )}
        </div>
        {topRight && <div>{topRight}</div>}
      </header>

      {/* Main Content */}
      <div className="flex flex-1" style={{ minHeight: 'calc(100vh - 82px)' }}>
        {/* Content Area */}
        <main className="flex-1 flex flex-col items-center justify-center p-8 gap-6">
          {children}
          {currentQuestion !== undefined && totalQuestions !== undefined && (
            <div className="w-full max-w-[720px]">
              <ProgressBar current={currentQuestion} total={totalQuestions} />
            </div>
          )}
        </main>
      </div>

      {/* C3: Forest Widget (좌하단 고정) */}
      {forestWidget && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          left: 24,
          zIndex: 50,
        }}>
          {forestWidget}
        </div>
      )}
    </div>
  );
}
