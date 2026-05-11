import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { useTimer } from '../hooks/useTimer';
import { useMLScreenClassifier } from '../hooks/useMLScreenClassifier';
import { exportSessionLog } from '../utils/logExporter';
import {
  WARNING_DISPLAY_MS,
  WARNING_COOLDOWN_MS,
  TREE_GROW_RATE,
  TREE_WILT_RATE,
  TREE_INITIAL_HEALTH,
  TREE_MAX_HEALTH,
  TREE_MIN_HEALTH,
  ML_CLASSIFY_INTERVAL_MS,
} from '../utils/constants';
import type { Condition, QuestionSetId } from '../types/session';
import type { Question } from '../types/question';
import SessionLayout from '../components/common/SessionLayout';
import QuestionCard from '../components/common/QuestionCard';
import PauseOverlay from '../components/common/PauseOverlay';
import ManualPauseButton from '../components/c1/ManualPauseButton';
import WarningBanner from '../components/c2/WarningBanner';
import FocusIndicator from '../components/c2/FocusIndicator';
import ForestWidget from '../components/c3/ForestWidget';

type SessionPhase = 'study' | 'quiz';

export default function SessionPage() {
  const { condition } = useParams<{ condition: string }>();
  const navigate = useNavigate();
  const { state, logEvent, dispatch } = useSession();

  const cond = condition as Condition;

  // Get current set from PDF data (동적 생성)
  const currentSetId = state.assignment?.sets[state.currentSessionIndex] ?? 'A';
  const pdfSet = state.pdfData?.[currentSetId as keyof typeof state.pdfData];
  const studyMaterial = pdfSet?.study ?? null;
  const questions: Question[] = pdfSet?.quiz?.questions ?? [];

  // Phase: study → quiz
  const [phase, setPhase] = useState<SessionPhase>('study');
  const [scrollPosition, setScrollPosition] = useState(0);

  // Quiz state
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const questionStartTime = useRef(Date.now());

  // C2: Warning state
  const [warningVisible, setWarningVisible] = useState(false);
  const lastWarningTime = useRef(0);
  const warningTimeoutRef = useRef<number | null>(null);

  // C3: Tree health
  const [treeHealth, setTreeHealth] = useState(TREE_INITIAL_HEALTH);
  const treeIntervalRef = useRef<number | null>(null);

  // Study timer complete → switch to quiz
  const handleStudyEnd = useCallback(() => {
    logEvent('study_phase_end', { reason: 'timeout' });
    setPhase('quiz');
    logEvent('quiz_phase_start', {});
    if (questions.length > 0) {
      logEvent('question_shown', { questionId: questions[0].id });
      questionStartTime.current = Date.now();
    }
  }, [logEvent, questions]);

  // Quiz complete → session end
  const handleSessionEnd = useCallback(() => {
    logEvent('session_end', { reason: 'quiz_complete' });
    dispatch({ type: 'END_SESSION' });

    if (state.participantId && state.assignment) {
      exportSessionLog(
        state.participantId,
        cond,
        currentSetId as QuestionSetId,
        state.currentSessionIndex + 1,
        state.eventLog,
        questions.length
      );
    }

    navigate(`/session/complete/${cond}`);
  }, [cond, currentSetId, dispatch, logEvent, navigate, questions.length, state]);

  // Timer (20 min study phase)
  const timer = useTimer({
    onComplete: handleStudyEnd,
    autoStart: false,
  });

  // ==========================================
  // ML Screen Classifier (C2/C3 전용)
  // ==========================================
  const mlClassifier = useMLScreenClassifier({
    enabled: (cond === 'c2' || cond === 'c3') && phase === 'study',
    intervalMs: ML_CLASSIFY_INTERVAL_MS,
  });

  // ML "공부중아님" 판단 (모델 로드 + 캡처 활성화 + not studying)
  const mlDisengaged = mlClassifier.modelLoaded && mlClassifier.captureActive && !mlClassifier.isStudying;

  // ML 이탈 시간/횟수 추적 (PauseOverlay 표시용)
  const [mlPausedMs, setMlPausedMs] = useState(0);
  const [mlPauseCount, setMlPauseCount] = useState(0);
  const mlPauseStartRef = useRef<number | null>(null);
  const mlPauseIntervalRef = useRef<number | null>(null);
  useEffect(() => {
    if (mlDisengaged) {
      if (mlPauseStartRef.current === null) {
        mlPauseStartRef.current = Date.now();
        setMlPauseCount(prev => prev + 1);
        mlPauseIntervalRef.current = window.setInterval(() => {
          setMlPausedMs(Date.now() - mlPauseStartRef.current!);
        }, 100);
      }
    } else {
      if (mlPauseStartRef.current !== null) {
        mlPauseStartRef.current = null;
        setMlPausedMs(0);
        if (mlPauseIntervalRef.current) {
          clearInterval(mlPauseIntervalRef.current);
          mlPauseIntervalRef.current = null;
        }
      }
    }
  }, [mlDisengaged]);

  // ML 이탈 판단에 따른 타이머 제어 (ML이 원인인 pause만 자동 resume)
  const pausedByDisengagementRef = useRef(false);
  useEffect(() => {
    if (cond !== 'c2' && cond !== 'c3') return;
    if (phase !== 'study') return;
    if (mlDisengaged) {
      if (timer.isRunning) {
        timer.pause();
        pausedByDisengagementRef.current = true;
        logEvent('feedback_triggered', { type: 'ml_not_studying', phase });
      }
    } else {
      if (pausedByDisengagementRef.current && timer.isPaused) {
        timer.resume();
        pausedByDisengagementRef.current = false;
      }
    }
  }, [mlDisengaged]); // eslint-disable-line react-hooks/exhaustive-deps

  // ==========================================
  // C1: Manual Pause Handlers (열품타)
  // ==========================================
  const handleManualPause = useCallback(() => {
    timer.pause();
    logEvent('timer_manual_pause', {});
  }, [timer, logEvent]);

  const handleManualResume = useCallback(() => {
    timer.resume();
    logEvent('timer_manual_resume', {});
  }, [timer, logEvent]);

  // Start session on mount
  useEffect(() => {
    dispatch({ type: 'START_SESSION', timestamp: Date.now() });
    logEvent('session_start', {
      condition: cond,
      questionSet: currentSetId,
      participantId: state.participantId,
    });
    logEvent('study_phase_start', {
      material: studyMaterial?.title,
      sectionCount: studyMaterial?.sections.length,
    });
    timer.start();

    return () => {
      timer.stop();
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
      if (treeIntervalRef.current) clearInterval(treeIntervalRef.current);
      if (mlPauseIntervalRef.current) clearInterval(mlPauseIntervalRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // C2: Warning logic (ML 판단 기반)
  useEffect(() => {
    if (cond !== 'c2') return;
    if (mlDisengaged) {
      const now = Date.now();
      if (now - lastWarningTime.current > WARNING_COOLDOWN_MS) {
        setWarningVisible(true);
        lastWarningTime.current = now;
        logEvent('feedback_triggered', { type: 'warning', phase });
        warningTimeoutRef.current = window.setTimeout(() => {
          setWarningVisible(false);
        }, WARNING_DISPLAY_MS);
      }
    }
  }, [mlDisengaged, cond, logEvent, phase]);

  // C3: Tree health update
  useEffect(() => {
    if (cond !== 'c3' || phase !== 'study') return;
    treeIntervalRef.current = window.setInterval(() => {
      setTreeHealth(prev => {
        const shouldWilt = mlDisengaged;
        if (shouldWilt) {
          const newHealth = Math.max(TREE_MIN_HEALTH, prev - TREE_WILT_RATE);
          if (prev > TREE_MIN_HEALTH + TREE_WILT_RATE && newHealth <= prev - TREE_WILT_RATE) {
            logEvent('feedback_triggered', { type: 'tree_wither', phase });
          }
          return newHealth;
        } else {
          return Math.min(TREE_MAX_HEALTH, prev + TREE_GROW_RATE);
        }
      });
    }, 100);
    return () => {
      if (treeIntervalRef.current) clearInterval(treeIntervalRef.current);
    };
  }, [cond, mlDisengaged, logEvent, phase]);

  // Handle scroll tracking during study phase
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const percent = Math.round((el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100);
    setScrollPosition(percent);
  }, []);

  // Handle quiz answer
  const handleAnswer = useCallback((answer: string) => {
    const q = questions[currentQuestionIdx];
    if (!q) return;

    const timeTaken = Date.now() - questionStartTime.current;
    logEvent('question_answered', {
      questionId: q.id,
      answer,
      timeTakenMs: timeTaken,
      isCorrect: answer === q.correctAnswer,
    });

    if (currentQuestionIdx < questions.length - 1) {
      const nextIdx = currentQuestionIdx + 1;
      setCurrentQuestionIdx(nextIdx);
      questionStartTime.current = Date.now();
      logEvent('question_shown', { questionId: questions[nextIdx].id });
    } else {
      // All questions answered → end session
      handleSessionEnd();
    }
  }, [currentQuestionIdx, questions, logEvent, handleSessionEnd]);

  // C2 focus status (ML 기반)
  const getFocusStatus = (): 'good' | 'warn' | 'bad' => {
    if (mlDisengaged) return 'bad';
    if (!mlClassifier.modelLoaded || !mlClassifier.captureActive) return 'warn';
    return mlClassifier.confidence > 0.7 ? 'good' : 'warn';
  };

  const currentQuestion = questions[currentQuestionIdx];

  // Study phase UI
  const renderStudyPhase = () => (
    <div
      className="w-full max-w-3xl mx-auto overflow-y-auto px-4"
      style={{ maxHeight: 'calc(100vh - 120px)' }}
      onScroll={handleScroll}
    >
      {/* Study material header */}
      <div className="mb-6 fade-in">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: 'var(--text-primary)' }}>
            📖 학습 자료 · PDF {currentSetId}
          </span>
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            스크롤 {scrollPosition}%
          </span>
        </div>
        <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
          {studyMaterial?.title ?? '학습 자료'}
        </h2>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {studyMaterial?.subtitle ?? ''}
        </p>
      </div>

      {/* Study sections */}
      <div className="space-y-4 pb-8">
        {studyMaterial?.sections.map((section, idx) => (
          <div key={idx} className="card fade-in" style={{ animationDelay: `${idx * 0.05}s` }}>
            <h3 className="text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              {section.heading}
            </h3>
            <p className="text-sm leading-relaxed" style={{
              color: 'var(--text-primary)',
              whiteSpace: 'pre-wrap',
            }}>
              {section.content}
            </p>
          </div>
        ))}

        {/* 용어 정리 섹션 */}
        {studyMaterial?.terms && studyMaterial.terms.length > 0 && (
          <div className="card fade-in">
            <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
              📚 용어 및 개념 정리
            </h3>
            <div className="space-y-2">
              {studyMaterial.terms.map((t, idx) => (
                <div key={idx} className="flex gap-2 text-sm">
                  <span className="font-semibold shrink-0" style={{ color: 'var(--text-primary)' }}>
                    {t.term}:
                  </span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {t.definition}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 비판적 분석 섹션 */}
        {studyMaterial?.analysis && studyMaterial.analysis.length > 0 && (
          <div className="card fade-in">
            <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
              🔍 내용 분석
            </h3>
            <div className="space-y-2">
              {studyMaterial.analysis.map((a, idx) => (
                <p key={idx} className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                  {idx + 1}. {a}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Early finish button */}
        <div className="text-center pt-4 pb-8">
          <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
            학습이 끝났다면 아래 버튼으로 퀴즈를 시작할 수 있습니다.
          </p>
          <button
            className="btn-primary"
            onClick={() => {
              timer.stop();
              handleStudyEnd();
            }}
          >
            퀴즈 시작하기 →
          </button>
        </div>
      </div>
    </div>
  );

  // Quiz phase UI
  const renderQuizPhase = () => (
    <div className="w-full max-w-3xl mx-auto px-4">
      <div className="mb-6 fade-in text-center">
        <span className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: 'var(--text-primary)' }}>
          📝 퀴즈 · PDF {currentSetId}
        </span>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          학습 내용을 바탕으로 {questions.length}문항에 답해주세요
        </p>
      </div>

      {currentQuestion ? (
        <QuestionCard
          key={currentQuestion.id}
          question={currentQuestion}
          questionNumber={currentQuestionIdx + 1}
          totalQuestions={questions.length}
          onAnswer={handleAnswer}
        />
      ) : null}
    </div>
  );

  // Compute isPaused state
  const isPaused = timer.isPaused || mlDisengaged;

  return (
    <>
      {/* C2/C3: ML Pause Overlay */}
      {(cond === 'c2' || cond === 'c3') && phase === 'study' && (
        <PauseOverlay
          visible={mlDisengaged}
          pausedMs={mlPausedMs}
          pauseCount={mlPauseCount}
        />
      )}

      {/* ML 화면 공유 요청 배너 */}
      {(cond === 'c2' || cond === 'c3') && phase === 'study' && mlClassifier.modelLoaded && !mlClassifier.captureActive && (
        <div style={{
          position: 'fixed', bottom: 88, right: 24, zIndex: 60,
          background: '#ffffff', border: '1px solid #cccccc',
          borderRadius: 12, padding: '12px 20px',
          display: 'flex', alignItems: 'center', gap: 12,
          boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
        }}>
          <span style={{ fontSize: '0.875rem', color: '#111111' }}>
            📷 화면 공유를 허용하면 집중도를 자동으로 측정합니다
          </span>
          <button
            onClick={() => { void mlClassifier.requestCapture(); }}
            style={{
              background: '#111111', color: '#ffffff', border: 'none',
              borderRadius: 8, padding: '6px 14px',
              fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
            }}
          >
            허용하기 →
          </button>
        </div>
      )}

      <SessionLayout
        condition={cond}
        timerFormatted={phase === 'study' ? timer.formatted : '퀴즈'}
        timerWarning={phase === 'study' && timer.isWarning}
        isPaused={isPaused && phase === 'study'}
        currentQuestion={phase === 'quiz' ? Math.min(currentQuestionIdx + 1, questions.length) : undefined}
        totalQuestions={phase === 'quiz' ? questions.length : undefined}
        banner={cond === 'c2' && phase === 'study' ? <WarningBanner visible={warningVisible} /> : undefined}
        topRight={
          (cond === 'c1' || cond === 'c3') && phase === 'study' ? (
            <ManualPauseButton
              isPaused={timer.isPaused}
              onPause={handleManualPause}
              onResume={handleManualResume}
            />
          ) : cond === 'c2' && phase === 'study' ? (
            <FocusIndicator status={getFocusStatus()} />
          ) : undefined
        }
        forestWidget={cond === 'c3' && phase === 'study' ? <ForestWidget health={treeHealth} /> : undefined}
      >
        {phase === 'study' ? renderStudyPhase() : renderQuizPhase()}
      </SessionLayout>
    </>
  );
}
