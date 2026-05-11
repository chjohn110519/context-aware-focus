"""
학습 데이터 수집 스크립트
사용법:
  python collect_data.py studying          # 공부중 화면 수집
  python collect_data.py not_studying      # 딴짓 화면 수집

옵션:
  --count N      수집할 이미지 수 (기본: 200)
  --interval N   촬영 간격(초) (기본: 5)
"""

import argparse
import os
import time
from datetime import datetime

try:
    import pyautogui
    from PIL import Image
except ImportError:
    print("필요 패키지 설치: pip install pyautogui Pillow")
    raise SystemExit(1)

def collect(mode: str, count: int, interval: float) -> None:
    save_dir = os.path.join("data", mode)
    os.makedirs(save_dir, exist_ok=True)

    print(f"[{mode}] 데이터 수집 시작 — {count}장, {interval}초 간격")
    print("Ctrl+C 로 중단\n")

    for i in range(count):
        img = pyautogui.screenshot()
        filename = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{i:04d}.png"
        path = os.path.join(save_dir, filename)
        img.save(path)
        print(f"  [{i+1:>3}/{count}] {path}")
        time.sleep(interval)

    print(f"\n완료: {count}장 저장됨 → {save_dir}/")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="화면 캡처 데이터 수집")
    parser.add_argument("mode", choices=["studying", "not_studying"], help="수집 모드")
    parser.add_argument("--count", type=int, default=200, help="수집할 이미지 수")
    parser.add_argument("--interval", type=float, default=5.0, help="촬영 간격(초)")
    args = parser.parse_args()

    collect(args.mode, args.count, args.interval)
