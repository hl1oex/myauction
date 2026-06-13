# -*- coding: utf-8 -*-
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

def search_in_file(filepath, keywords):
    print(f"Searching in {filepath}...")
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            for i, line in enumerate(f, 1):
                line_lower = line.lower()
                for kw in keywords:
                    if kw.lower() in line_lower:
                        safe_line = line.strip()[:150]
                        print(f"Line {i} ({kw}): {safe_line}")
    except Exception as e:
        print(f"Error reading {filepath}: {e}")

index_path = r"d:\BackUp\OneDrive\AI공부\Real estate auction\index.html"
search_in_file(index_path, ["enrichPropertyData"])
