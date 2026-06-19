# -*- coding: utf-8 -*-
import glob
import os
import sys

def main():
    sys.stdout.reconfigure(encoding='utf-8')
    p_dir = r"d:\BackUp\OneDrive\AI공부\Real estate auction\v1.2"
    if not os.path.exists(p_dir):
        print("v1.2 folder does not exist.")
        return

    print("[*] Searching in v1.2 directory...")
    # Find all text-based files recursively
    files = glob.glob(os.path.join(p_dir, "**/*.*"), recursive=True)
    
    keywords = ["curation", "chatbot", "applySuggestedSearch", "검색", "추천"]
    for f in files:
        if os.path.isdir(f):
            continue
        # Only read text files
        if not any(f.endswith(ext) for ext in [".html", ".js", ".ts", ".tsx", ".css", ".json"]):
            continue
            
        content = None
        encs = ['utf-8', 'cp949', 'utf-16']
        for e in encs:
            try:
                with open(f, 'r', encoding=e) as file_obj:
                    content = file_obj.read()
                    break
            except Exception:
                continue
                
        if content:
            lines = content.splitlines()
            for i, line in enumerate(lines):
                for kw in keywords:
                    if kw in line:
                        print(f"File: {os.path.basename(f)} | Line {i+1}: {line.strip()}")
                        break

if __name__ == "__main__":
    main()
