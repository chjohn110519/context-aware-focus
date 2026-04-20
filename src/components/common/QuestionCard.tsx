import { useState } from 'react';
import type { Question } from '../../types/question';

interface QuestionCardProps {
  question: Question;
  questionNumber: number;
  onAnswer: (answer: string) => void;
}

export default function QuestionCard({ question, questionNumber, onAnswer }: QuestionCardProps) {
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

  return (
    <div className="question-card fade-in">
      <h3>문제 {questionNumber}</h3>
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
        <input
          type="text"
          className="text-input"
          value={textAnswer}
          onChange={(e) => setTextAnswer(e.target.value)}
          placeholder="답을 입력하세요"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && isAnswered) handleSubmit();
          }}
        />
      )}

      <div className="mt-6 flex justify-end">
        <button
          className="btn-primary"
          disabled={!isAnswered}
          onClick={handleSubmit}
        >
          {questionNumber < 10 ? '다음 문제' : '제출'}
        </button>
      </div>
    </div>
  );
}
