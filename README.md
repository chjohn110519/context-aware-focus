# Context-Aware Focus Interface

> IMEN 343 Term Project — AI 기반 맥락 인식 학습 집중 유도 인터페이스 프로토타입

## 실행 방법

```bash
npm install
npm run dev
```

## 실험 조건

| 조건 | 설명 | 테마 |
|---|---|---|
| C1 | 시간 기반 (Baseline) — 타이머만 표시, 개입 없음 | 흑백/회색 |
| C2 | AI 맥락 인식 + 경고 — idle 감지 시 슬라이드다운 배너 | 블루 테크 |
| C3 | AI 맥락 인식 + 감성 피드백 — 나무 성장/시들음 시각화 | 그린/브라운 |

## 실험 진행

1. `/` → 피험자 번호 입력 (1~12)
2. `/session/intro` → 실험 안내 확인
3. `/session/{c1|c2|c3}` → 10분간 문제 풀이
4. `/session/survey/{condition}` → 조건별 사후 설문 (NASA-TLX + Likert)
5. 3개 조건 반복
6. `/session/final-survey` → 최종 비교 설문
7. `/session/done` → 완료 + 데이터 백업 다운로드

## 기술 스택

- React 18 + Vite + TypeScript
- Tailwind CSS v4
- React Router v6
- 백엔드 없음 (클라이언트 전용)

## 데이터 저장

- 각 세션 종료 시 JSON 로그 자동 다운로드
- `localStorage`에 이벤트 로그 백업
- `sessionStorage`에 세션 상태 스냅샷 (새로고침 복구)
