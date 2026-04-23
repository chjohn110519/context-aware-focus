import type { SessionEvent, DerivedMetrics, LogFile, Condition, QuestionSetId } from '../types/session';

export function calculateDerivedMetrics(events: SessionEvent[], totalQuestions: number): DerivedMetrics {
  let totalIdleMs = 0;
  let disengagementCount = 0;
  let currentIdleStart: number | null = null;
  const focusSpans: number[] = [];
  let lastActiveStart: number | null = null;

  // Screen monitoring pause tracking
  let totalPausedMs = 0;
  let pauseCount = 0;
  let currentPauseStart: number | null = null;

  const sessionStart = events.find(e => e.type === 'session_start')?.timestamp ?? 0;
  const sessionEnd = events.find(e => e.type === 'session_end')?.timestamp ?? Date.now();

  for (const event of events) {
    // Idle tracking
    if (event.type === 'idle_start' || event.type === 'window_blur') {
      disengagementCount++;
      currentIdleStart = event.timestamp;
      if (lastActiveStart !== null) {
        focusSpans.push(event.timestamp - lastActiveStart);
        lastActiveStart = null;
      }
    } else if (event.type === 'idle_end' || event.type === 'window_focus') {
      if (currentIdleStart !== null) {
        totalIdleMs += event.timestamp - currentIdleStart;
        currentIdleStart = null;
      }
      lastActiveStart = event.timestamp;
    }

    // Screen monitor pause tracking
    if (event.type === 'screen_monitor_pause' || event.type === 'timer_manual_pause') {
      pauseCount++;
      currentPauseStart = event.timestamp;
    } else if (event.type === 'screen_monitor_resume' || event.type === 'timer_manual_resume') {
      if (currentPauseStart !== null) {
        totalPausedMs += event.timestamp - currentPauseStart;
        currentPauseStart = null;
      }
    }
  }

  // If still idle at session end
  if (currentIdleStart !== null) {
    totalIdleMs += sessionEnd - currentIdleStart;
  }

  if (currentPauseStart !== null) {
    totalPausedMs += sessionEnd - currentPauseStart;
  }

  if (lastActiveStart !== null) {
    focusSpans.push(sessionEnd - lastActiveStart);
  }

  const totalFocusTimeMs = (sessionEnd - sessionStart) - totalIdleMs - totalPausedMs;
  const meanFocusSpanMs = focusSpans.length > 0
    ? focusSpans.reduce((a, b) => a + b, 0) / focusSpans.length
    : totalFocusTimeMs;

  const answeredCount = events.filter(e => e.type === 'question_answered').length;
  const completionRate = totalQuestions > 0 ? answeredCount / totalQuestions : 0;

  return {
    totalFocusTimeMs: Math.max(0, totalFocusTimeMs),
    disengagementCount,
    meanFocusSpanMs: Math.max(0, meanFocusSpanMs),
    completionRate: Math.min(1, completionRate),
    totalPausedMs,
    pauseCount,
  };
}

export function exportSessionLog(
  participantId: number,
  condition: Condition,
  questionSet: QuestionSetId,
  sessionOrder: number,
  events: SessionEvent[],
  totalQuestions: number,
): void {
  const startEvent = events.find(e => e.type === 'session_start');
  const endEvent = events.find(e => e.type === 'session_end');
  const startTs = startEvent?.timestamp ?? Date.now();
  const endTs = endEvent?.timestamp ?? Date.now();

  const logFile: LogFile = {
    meta: {
      participantId,
      condition,
      questionSet,
      sessionOrder,
      startedAt: new Date(startTs).toISOString(),
      endedAt: new Date(endTs).toISOString(),
      durationMs: endTs - startTs,
    },
    events,
    surveyResponses: [],
    derivedMetrics: calculateDerivedMetrics(events, totalQuestions),
  };

  const now = new Date();
  const ts = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `p${String(participantId).padStart(2, '0')}_${condition}_${questionSet}_${ts}.json`;

  const blob = new Blob([JSON.stringify(logFile, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
