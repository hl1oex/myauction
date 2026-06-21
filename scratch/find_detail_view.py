import re
import os

filepath = "index.html"
if not os.path.exists(filepath):
    print("index.html not found")
    exit(1)

with open(filepath, "r", encoding="utf-8") as f:
    lines = f.readlines()

print(f"Total lines in index.html: {len(lines)}")

# loadDetailView 검색
for idx, line in enumerate(lines):
    if "loadDetailView" in line:
        print(f"index.html Line {idx+1}: {line.strip()}")

# "detail-drawer" 또는 상세 서랍 DOM 요소 검색
for idx, line in enumerate(lines):
    if "detail-panel" in line or "detail-drawer" in line or "detailDrawer" in line or "detail_drawer" in line:
        print(f"index.html Line {idx+1}: {line.strip()}")
