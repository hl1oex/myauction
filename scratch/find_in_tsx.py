import re
import sys

# 표준 출력 인코딩을 utf-8로 설정
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

filepath = "mobile-app/src/screens/FeedScreen.tsx"
try:
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    print(f"[+] Successfully read {filepath}")
except Exception as e:
    print(f"[-] Failed to read {filepath}: {e}")
    exit(1)

lines = content.split('\n')
print(f"Total lines: {len(lines)}")

# filter 관련 단어 검색
for idx, line in enumerate(lines):
    line_str = line.strip()
    if "filter" in line_str.lower() or "ptype" in line_str.lower() or "vehicle" in line_str.lower() or "etc" in line_str.lower():
        # 너무 많이 나올 수 있으니 키워드가 들어간 핵심 부분만 출력
        if any(kw in line_str.lower() for kw in ["const ", "function ", "state", "check", "onbid_etc"]):
            print(f"Line {idx+1}: {line_str[:120]}")
