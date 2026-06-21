import re
import os

filepath = "index.js"
if not os.path.exists(filepath):
    print("index.js not found")
    exit(1)

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# loadDetailView 함수 전체 가져오기
match = re.search(r"function loadDetailView\(item\)\s*\{([\s\S]*?)\n\}", content)
if match:
    # 50줄만 보기
    lines = match.group(0).split('\n')
    print("loadDetailView start:")
    for idx, line in enumerate(lines[:100]):
        print(f"{idx+2898}: {line}")
else:
    print("loadDetailView not found by regex")
