import re
import os
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

filepath = "mobile-app/src/screens/DetailScreen.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    lines = f.readlines()

print(f"Total lines: {len(lines)}")

# onBack이 포함된 라인 주변의 코드 상세 검색
for idx, line in enumerate(lines):
    if "onBack" in line and "TouchableOpacity" in line:
        print(f"Line {idx+1}: {line.strip()}")
        # 주변 10줄 출력
        for i in range(max(0, idx-5), min(len(lines), idx+10)):
            print(f"  {i+1}: {lines[i].strip()}")
