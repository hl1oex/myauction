import re
import os

filepath = "index.js"
if not os.path.exists(filepath):
    print("index.js not found")
    exit(1)

with open(filepath, "r", encoding="utf-8") as f:
    lines = f.readlines()

print(f"Total lines in index.js: {len(lines)}")

# "selectedProperty" 검색
for idx, line in enumerate(lines):
    if "selectedProperty" in line:
        print(f"index.js Line {idx+1}: {line.strip()}")
