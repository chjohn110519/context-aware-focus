import type { ReactNode } from 'react';
import Timer from './Timer';
import ProgressBar from './ProgressBar';
import type { Condition } from '../../types/session';

interface SessionLayoutProps {
  condition: Condition;
  timerFormatted: string;
  timerWarning: boolean;
  currentQuestion?: number;
  totalQuestions?: number;
  children: ReactNode;
  rightPanel?: ReactNode;
  topRight?: ReactNode;
  banner?: ReactNode;
}

export default function SessionLayout({
  condition,
  timerFormatted,
  timerWarning,
  currentQuestion,
  totalQuestions,
  children,
  rightPanel,
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
        </div>
        {topRight && <div>{topRight}</div>}
      </header>

      {/* Main Content */}
      <div className="flex flex-1" style={{ minHeight: 'calc(100vh - 82px)' }}>
        {/* Question Area */}
        <main className="flex-1 flex flex-col items-center justify-center p-8 gap-6">
          {children}
          {currentQuestion !== undefined && totalQuestions !== undefined && (
            <div className="w-full max-w-[720px]">
              <ProgressBar current={currentQuestion} total={totalQuestions} />
            </div>
          )}
        </main>

        {/* Optional Right Panel (C3 tree) */}
        {rightPanel && (
          <aside className="w-80 border-l flex flex-col items-center justify-center p-6"
            style={{ borderColor: 'var(--border)', background: 'var(--bg-secondary)' }}>
            {rightPanel}
          </aside>
        )}
      </div>
    </div>
  );
}
