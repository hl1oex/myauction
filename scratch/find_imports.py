import re
import os
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

filepath = "mobile-app/src/screens/DetailScreen.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    lines = f.readlines()

print(f"Total lines: {len(lines)}")

# Alert, Platform import 검색
for idx, line in enumerate(lines[:100]):
    if "Alert" in line or "Platform" in line:
        print(f"Line {idx+1}: {line.strip()}")
