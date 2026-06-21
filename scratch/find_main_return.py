import re
import os
import sys

# 표준 출력 인코딩을 utf-8로 설정
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

filepath = "mobile-app/src/screens/DetailScreen.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    lines = f.readlines()

print(f"Total lines: {len(lines)}")

# 주요 View나 ScrollView를 리턴하는 메인 return 찾기
for idx, line in enumerate(lines):
    if "return (" in line:
        # 그 다음 몇 줄 확인
        next_lines = "".join(lines[idx+1:idx+6])
        if "SafeAreaView" in next_lines or "View style=" in next_lines or "ScrollView" in next_lines or "modalContainer" in next_lines:
            print(f"Line {idx+1}: {line.strip()}")
            # print(f"--- next lines ---\n{next_lines}------------------")
