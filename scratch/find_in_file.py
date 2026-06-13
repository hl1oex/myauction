# -*- coding: utf-8 -*-
import os
import sys

def find_in_file(filepath, query):
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return
        
    encodings = ['utf-8', 'utf-16', 'euc-kr', 'cp949', 'utf-16-le', 'utf-16-be']
    content = ""
    success_encoding = None
    for enc in encodings:
        try:
            with open(filepath, 'r', encoding=enc) as f:
                content = f.read()
                success_encoding = enc
                break
        except Exception:
            continue
            
    if not success_encoding:
        print(f"Failed to read {filepath} with any encoding")
        return
        
    lines = content.splitlines()
    matches = []
    for idx, line in enumerate(lines):
        if query in line:
            matches.append((idx + 1, line.strip()))
            
    print(f"File: {filepath} ({success_encoding})")
    print(f"Found {len(matches)} matches for '{query}':")
    for line_num, line_content in matches[:30]:
        print(f"Line {line_num}: {line_content}")
    if len(matches) > 30:
        print("... and more")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python find_in_file.py <query> <filepath>")
    else:
        find_in_file(sys.argv[2], sys.argv[1])
