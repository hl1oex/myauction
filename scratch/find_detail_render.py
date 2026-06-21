import re
import os

filepath = "mobile-app/src/screens/DetailScreen.tsx"
if not os.path.exists(filepath):
    print("DetailScreen.tsx not found")
    exit(1)

with open(filepath, "r", encoding="utf-8") as f:
    lines = f.readlines()

print(f"Total lines in DetailScreen.tsx: {len(lines)}")

# "export const DetailScreen" 검색
for idx, line in enumerate(lines):
    if "export const DetailScreen" in line or "const DetailScreen" in line:
        print(f"Line {idx+1}: {line.strip()}")

# "return (" 또는 "return  (" 검색
return_count = 0
for idx, line in enumerate(lines):
    if "return (" in line:
        return_count += 1
        if return_count < 10:
            print(f"Line {idx+1}: {line.strip()}")
