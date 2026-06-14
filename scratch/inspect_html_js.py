# -*- coding: utf-8 -*-
import sys
sys.stdout.reconfigure(encoding='utf-8')

with open("index.html", "r", encoding="utf-8") as f:
    lines = f.readlines()

# enrichPropertyData 함수 검색
start = -1
for idx, line in enumerate(lines):
    if "function enrichPropertyData" in line:
        start = idx
        break

if start != -1:
    print(f"Function starts at line {start+1}")
    for i in range(start, start + 120):
        if i < len(lines):
            print(f"{i+1}: {lines[i]}", end="")
else:
    print("Function not found")
