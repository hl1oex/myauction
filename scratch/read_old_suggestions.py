# -*- coding: utf-8 -*-
import os
import sys

def main():
    sys.stdout.reconfigure(encoding='utf-8')
    p = r"d:\BackUp\OneDrive\AI공부\Real estate auction\scratch\old_index.html"
    if not os.path.exists(p):
        print("old_index.html does not exist.")
        return

    content = None
    encs = ['utf-16', 'utf-16-le', 'utf-8', 'cp949']
    for e in encs:
        try:
            with open(p, 'r', encoding=e) as f:
                content = f.read()
                print(f"[+] Read success with encoding: {e}")
                break
        except Exception as err:
            continue

    if not content:
        print("Failed to load content.")
        return

    print("[+] Searching for keywords...")
    lines = content.splitlines()
    for i, line in enumerate(lines):
        # 추천 검색어, applySuggestedSearch, or any key terms
        if any(term in line for term in ['applySuggestedSearch', 'SuggestedSearch', '추천 검색어', '추천검색어', 'suggested-search', 'suggested_search', 'suggestedSearch', 'recommend-search', 'recommend_search']):
            print(f"Line {i+1}: {line.strip()}")

if __name__ == "__main__":
    main()
