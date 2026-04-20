interface TimerProps {
  formatted: string;
  isWarning: boolean;
}

export default function Timer({ formatted, isWarning }: TimerProps) {
  return (
    <div className={`timer-display ${isWarning ? 'warning' : ''}`}>
      {formatted}
    </div>
  );
}
