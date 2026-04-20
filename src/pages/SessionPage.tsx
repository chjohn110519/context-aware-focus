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
import SessionLayout from '../components/common/SessionLayout';
import QuestionCard from '../components/common/QuestionCard';
import WarningBanner from '../components/c2/WarningBanner';
import FocusIndicator from '../components/c2/FocusIndicator';
import TreeVisualizer from '../components/c3/TreeVisualizer';

// Import question sets
import setA from '../data/questionSets/A.json';
import setB from '../data/questionSets/B.json';
import setC from '../data/questionSets/C.json';

const questionSets: Record<string, { questions: Question[] }> = {
  A: setA as { questions: Question[] },
  B: setB as { questions: Question[] },
  C: setC as { questions: Question[] },
};

export default function SessionPage() {
  const { condition } = useParams<{ condition: string }>();
  const navigate = useNavigate();
  const { state, logEvent, dispatch } = useSession();

  const cond = condition as Condition;

  // Get current question set
  const currentSetId = state.assignment?.sets[state.currentSessionIndex] ?? 'A';
  const questions = questionSets[currentSetId]?.questions ?? [];

  // Question state
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const questionStartTime = useRef(Date.now());

  // Activity tracking (all conditions)
  const { lastKeyTime, lastMouseTime, lastBlurTime } = useActivityTracker();

  // Idle detection (C2 & C3 use it for feedback, C1 logs only)
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

  // Session completion handler
  const handleSessionEnd = useCallback(() => {
    logEvent('session_end', { reason: 'timeout' });
    dispatch({ type: 'END_SESSION' });

    // Export log
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

  // Timer
  const timer = useTimer({
    onComplete: handleSessionEnd,
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
    timer.start();

    return () => {
      timer.stop();
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
      if (treeIntervalRef.current) clearInterval(treeIntervalRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Show first question
  useEffect(() => {
    if (questions.length > 0) {
      logEvent('question_shown', { questionId: questions[0].id });
      questionStartTime.current = Date.now();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // C2: Warning logic
  useEffect(() => {
    if (cond !== 'c2') return;

    if (isIdle) {
      const now = Date.now();
      if (now - lastWarningTime.current > WARNING_COOLDOWN_MS) {
        setWarningVisible(true);
        lastWarningTime.current = now;
        logEvent('feedback_triggered', { type: 'warning' });

        warningTimeoutRef.current = window.setTimeout(() => {
          setWarningVisible(false);
        }, WARNING_DISPLAY_MS);
      }
    }
  }, [isIdle, cond, logEvent]);

  // C3: Tree health update
  useEffect(() => {
    if (cond !== 'c3') return;

    treeIntervalRef.current = window.setInterval(() => {
      setTreeHealth(prev => {
        if (isIdle) {
          const newHealth = Math.max(TREE_MIN_HEALTH, prev - TREE_WILT_RATE);
          if (prev > TREE_MIN_HEALTH + TREE_WILT_RATE && newHealth <= prev - TREE_WILT_RATE) {
            logEvent('feedback_triggered', { type: 'tree_wither' });
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
  }, [cond, isIdle, logEvent]);

  // Handle answer
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
    }
    // If last question answered, just wait for timer
  }, [currentQuestionIdx, questions, logEvent]);

  // C2 focus status
  const getFocusStatus = (): 'good' | 'warn' | 'bad' => {
    if (!isIdle) return 'good';
    const idleDuration = Date.now() - Math.max(lastKeyTime.current, lastMouseTime.current);
    if (idleDuration > 20000) return 'bad';
    return 'warn';
  };

  const currentQuestion = questions[currentQuestionIdx];
  const allAnswered = currentQuestionIdx >= questions.length;

  return (
    <SessionLayout
      condition={cond}
      timerFormatted={timer.formatted}
      timerWarning={timer.isWarning}
      currentQuestion={Math.min(currentQuestionIdx + 1, questions.length)}
      totalQuestions={questions.length}
      banner={cond === 'c2' ? <WarningBanner visible={warningVisible} /> : undefined}
      topRight={cond === 'c2' ? <FocusIndicator status={getFocusStatus()} /> : undefined}
      rightPanel={cond === 'c3' ? <TreeVisualizer health={treeHealth} /> : undefined}
    >
      {allAnswered ? (
        <div className="question-card text-center fade-in">
          <div className="text-4xl mb-4">✅</div>
          <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            모든 문제를 완료했습니다!
          </h3>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            타이머가 끝날 때까지 대기하거나, 아래 버튼을 눌러 설문으로 이동하세요.
          </p>
          <button className="btn-primary mt-6" onClick={handleSessionEnd}>
            설문으로 이동 →
          </button>
        </div>
      ) : currentQuestion ? (
        <QuestionCard
          key={currentQuestion.id}
          question={currentQuestion}
          questionNumber={currentQuestionIdx + 1}
          onAnswer={handleAnswer}
        />
      ) : null}
    </SessionLayout>
  );
}
