import re
import os
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

filepath = "mobile-app/src/screens/DetailScreen.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    lines = f.readlines()

print(f"Total lines: {len(lines)}")

# favoriteButton 스타일 찾기
for idx, line in enumerate(lines):
    if "favoriteButton" in line and ":" in line:
        print(f"Line {idx+1}: {line.strip()}")
        # 주변 10줄 출력
        for i in range(max(0, idx-2), min(len(lines), idx+15)):
            print(f"  {i+1}: {lines[i].strip()}")
