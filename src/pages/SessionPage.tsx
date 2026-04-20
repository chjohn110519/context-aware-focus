import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSession } from '../context/SessionContext';
import { useActivityTracker } from '../hooks/useActivityTracker';
import { useIdleDetector } from '../hooks/useIdleDetector';
import { useTimer } from '../hooks/useTimer';
import { exportSessionLog } from '../utils/logExporter';
import {
  WARNING_DISPLAY_MS,
  WARNING_COOLDOWN_MS,
  TREE_GROW_RATE,
  TREE_WILT_RATE,
  TREE_INITIAL_HEALTH,
  TREE_MAX_HEALTH,
  TREE_MIN_HEALTH,
} from '../utils/constants';
import type { Condition, QuestionSetId } from '../types/session';
import type { Question } from '../types/question';
import type { StudySet } from '../types/study';
import SessionLayout from '../components/common/SessionLayout';
import QuestionCard from '../components/common/QuestionCard';
import WarningBanner from '../components/c2/WarningBanner';
import FocusIndicator from '../components/c2/FocusIndicator';
import TreeVisualizer from '../components/c3/TreeVisualizer';

// Import study sets
import studyA from '../data/studySets/A.json';
import studyB from '../data/studySets/B.json';
import studyC from '../data/studySets/C.json';

// Import quiz sets
import quizA from '../data/questionSets/A.json';
import quizB from '../data/questionSets/B.json';
import quizC from '../data/questionSets/C.json';

const studySets: Record<string, StudySet> = {
  A: studyA as StudySet,
  B: studyB as StudySet,
  C: studyC as StudySet,
};

const quizSets: Record<string, { questions: Question[] }> = {
  A: quizA as { questions: Question[] },
  B: quizB as { questions: Question[] },
  C: quizC as { questions: Question[] },
};

type SessionPhase = 'study' | 'quiz';

export default function SessionPage() {
  const { condition } = useParams<{ condition: string }>();
  const navigate = useNavigate();
  const { state, logEvent, dispatch } = useSession();

  const cond = condition as Condition;

  // Get current set
  const currentSetId = state.assignment?.sets[state.currentSessionIndex] ?? 'A';
  const studyMaterial = studySets[currentSetId];
  const questions = quizSets[currentSetId]?.questions ?? [];

  // Phase: study → quiz
  const [phase, setPhase] = useState<SessionPhase>('study');
  const [scrollPosition, setScrollPosition] = useState(0);

  // Quiz state
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const questionStartTime = useRef(Date.now());

  // Activity tracking
  const { lastKeyTime, lastMouseTime, lastBlurTime } = useActivityTracker();

  // Idle detection
  const { isIdle } = useIdleDetector({
    enabled: true,
    lastKeyTime,
    lastMouseTime,
    lastBlurTime,
  });

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

  // Timer (10 min study phase)
  const timer = useTimer({
    onComplete: handleStudyEnd,
    autoStart: false,
  });

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
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // C2: Warning logic
  useEffect(() => {
    if (cond !== 'c2') return;
    if (isIdle) {
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
  }, [isIdle, cond, logEvent, phase]);

  // C3: Tree health update
  useEffect(() => {
    if (cond !== 'c3') return;
    treeIntervalRef.current = window.setInterval(() => {
      setTreeHealth(prev => {
        if (isIdle) {
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
  }, [cond, isIdle, logEvent, phase]);

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

  // C2 focus status
  const getFocusStatus = (): 'good' | 'warn' | 'bad' => {
    if (!isIdle) return 'good';
    const idleDuration = Date.now() - Math.max(lastKeyTime.current, lastMouseTime.current);
    if (idleDuration > 20000) return 'bad';
    return 'warn';
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
            style={{ color: 'var(--accent)' }}>
            📖 학습 자료 · 세트 {currentSetId}
          </span>
          <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            스크롤 {scrollPosition}%
          </span>
        </div>
        <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
          {studyMaterial?.title}
        </h2>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {studyMaterial?.subtitle}
        </p>
      </div>

      {/* Study sections */}
      <div className="space-y-4 pb-8">
        {studyMaterial?.sections.map((section, idx) => (
          <div key={idx} className="card fade-in" style={{ animationDelay: `${idx * 0.05}s` }}>
            <h3 className="text-sm font-bold mb-2" style={{ color: 'var(--accent)' }}>
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
          style={{ color: 'var(--accent)' }}>
          📝 퀴즈 · 세트 {currentSetId}
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
          onAnswer={handleAnswer}
        />
      ) : null}
    </div>
  );

  return (
    <SessionLayout
      condition={cond}
      timerFormatted={phase === 'study' ? timer.formatted : '퀴즈'}
      timerWarning={phase === 'study' && timer.isWarning}
      currentQuestion={phase === 'quiz' ? Math.min(currentQuestionIdx + 1, questions.length) : undefined}
      totalQuestions={phase === 'quiz' ? questions.length : undefined}
      banner={cond === 'c2' ? <WarningBanner visible={warningVisible} /> : undefined}
      topRight={cond === 'c2' ? <FocusIndicator status={getFocusStatus()} /> : undefined}
      rightPanel={cond === 'c3' ? <TreeVisualizer health={treeHealth} /> : undefined}
    >
      {phase === 'study' ? renderStudyPhase() : renderQuizPhase()}
    </SessionLayout>
  );
}
