import { useEffect, useState } from 'react';

interface WarningBannerProps {
  visible: boolean;
}

export default function WarningBanner({ visible }: WarningBannerProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(visible);
  }, [visible]);

  return (
    <div className={`warning-banner ${show ? 'visible' : ''}`}>
      <span className="mr-2">⚠️</span>
      학습에 집중해주세요 — AI가 비활동 상태를 감지하였습니다
    </div>
  );
}
