import { useState } from 'react';
import type { Question } from '../../types/question';

interface QuestionCardProps {
  question: Question;
  questionNumber: number;
  totalQuestions?: number;
  onAnswer: (answer: string) => void;
}

export default function QuestionCard({ question, questionNumber, totalQuestions, onAnswer }: QuestionCardProps) {
  const [selected, setSelected] = useState<string>('');
  const [textAnswer, setTextAnswer] = useState('');

  const handleSubmit = () => {
    const answer = question.type === 'choice' ? selected : textAnswer.trim();
    if (answer) {
      onAnswer(answer);
      setSelected('');
      setTextAnswer('');
    }
  };

  const isAnswered = question.type === 'choice' ? !!selected : !!textAnswer.trim();
  const total = totalQuestions ?? 10;

  return (
    <div className="question-card fade-in">
      <h3>문제 {questionNumber} / {total}</h3>
      <p>{question.text}</p>

      {question.type === 'choice' && question.options ? (
        <div className="option-group">
          {question.options.map((option, idx) => (
            <label
              key={idx}
              className={`option-label ${selected === option ? 'selected' : ''}`}
            >
              <input
                type="radio"
                name={`q-${question.id}`}
                value={option}
                checked={selected === option}
                onChange={() => setSelected(option)}
              />
              <span>{option}</span>
            </label>
          ))}
        </div>
      ) : (
        <textarea
          className="w-full p-4 rounded-xl outline-none resize-none"
          value={textAnswer}
          onChange={(e) => setTextAnswer(e.target.value)}
          placeholder="답을 입력하세요 (1~3문장)"
          rows={4}
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
            fontFamily: 'var(--font-family)',
            fontSize: '1rem',
            lineHeight: '1.6',
          }}
          onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; }}
          onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; }}
        />
      )}

      <div className="mt-6 flex justify-end">
        <button
          className="btn-primary"
          disabled={!isAnswered}
          onClick={handleSubmit}
        >
          {questionNumber < total ? '다음 문제' : '제출'}
        </button>
      </div>
    </div>
  );
}
