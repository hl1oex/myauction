import re
import sys

# 표준 출력 인코딩을 utf-8로 설정
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

filepath = "mobile-app/App.tsx"
try:
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    print(f"[+] Successfully read {filepath}")
except Exception as e:
    print(f"[-] Failed to read {filepath}: {e}")
    exit(1)

lines = content.split('\n')
print(f"Total lines: {len(lines)}")

# filter 초기화 상태 검색
for idx, line in enumerate(lines):
    line_str = line.strip()
    if "filters" in line_str or "FilterState" in line_str or "useState<FilterState>" in line_str:
        print(f"Line {idx+1}: {line_str[:120]}")
