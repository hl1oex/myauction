# -*- coding: utf-8 -*-
# index.html 파일을 분석하여 상세페이지(complex_info, recent_deals 등) 데이터 바인딩 로직을 찾기 위한 유틸리티입니다.
import os

html_path = "d:/BackUp/OneDrive/AI공부/Real estate auction/index.html"
if not os.path.exists(html_path):
    print("[-] index.html 파일을 찾을 수 없습니다.")
    exit(1)

with open(html_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

print(f"[+] index.html 총 라인 수: {len(lines)}")

keywords = ["complex", "deal", "school", "detail-", "bind", "render", "notes_content", "metadata", "recent"]
matches = []

for idx, line in enumerate(lines):
    for kw in keywords:
        if kw in line.lower():
            matches.append((idx + 1, line.strip()))
            break

print(f"[+] 매칭된 라인 수: {len(matches)}")
# 상위 100개만 출력해 봅니다.
for num, content in matches[:100]:
    print(f"Line {num}: {content[:120]}")
