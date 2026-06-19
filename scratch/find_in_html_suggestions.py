# -*- coding: utf-8 -*-
import os
import sys

def main():
    sys.stdout.reconfigure(encoding='utf-8')
    filepath = r"d:\BackUp\OneDrive\AI공부\Real estate auction\index.html"
    
    if not os.path.exists(filepath):
        print("index.html does not exist.")
        return

    content = None
    encodings = ['utf-8', 'cp949', 'utf-16']
    for enc in encodings:
        try:
            with open(filepath, 'r', encoding=enc) as f:
                content = f.read()
                print(f"[+] Read success with encoding: {enc}")
                break
        except Exception:
            continue

    if not content:
        print("Failed to read file.")
        return

    lines = content.splitlines()
    print(f"Total lines: {len(lines)}")
    
    # 추천 검색어 관련 칩(아파트, 빌라/다세대, 서울, 경기, 유찰, 차량)이 나오는 영역 탐색
    keywords = ["applySuggestedSearch"]
    
    for i, line in enumerate(lines):
        line_str = line.strip()
        if any(kw in line_str for kw in keywords):
            print(f"Line {i+1}: {line_str[:200]}")

if __name__ == "__main__":
    main()
