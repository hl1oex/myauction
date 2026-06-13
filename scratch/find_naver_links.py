import os
import re

search_dir = r"d:\BackUp\OneDrive\AI공부\Real estate auction"
keywords = ["new.land.naver.com", "complexes", "land.naver", "ms=", "center="]

found_files = {}

for root, dirs, files in os.walk(search_dir):
    # Skip directories like .git, .firebase, dist, node_modules
    if any(p in root for p in [".git", ".firebase", "dist", "node_modules", "scratch", "__pycache__"]):
        continue
    for file in files:
        if not file.endswith((".html", ".tsx", ".ts", ".js", ".py", ".css")):
            continue
        file_path = os.path.join(root, file)
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                for kw in keywords:
                    if kw in content:
                        if file_path not in found_files:
                            found_files[file_path] = []
                        # Find line numbers
                        lines = content.splitlines()
                        for idx, line in enumerate(lines):
                            if kw in line:
                                found_files[file_path].append((idx + 1, kw, line.strip()))
        except Exception as e:
            pass

print("=== Search Results ===")
for fp, matches in found_files.items():
    print(f"File: {fp}")
    for line_num, kw, text in matches:
        print(f"  Line {line_num} [{kw}]: {text}")
