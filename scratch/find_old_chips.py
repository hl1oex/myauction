# -*- coding: utf-8 -*-
import subprocess
import sys

def main():
    sys.stdout.reconfigure(encoding='utf-8')
    print("[*] Retrieving commit list...")
    res = subprocess.run(["git", "log", "--format=%H %s"], stdout=subprocess.PIPE, text=True, errors="ignore")
    if res.returncode != 0:
        return

    commits = [line.split(" ", 1) for line in res.stdout.splitlines() if line.strip()]
    print(f"[*] Scanning {len(commits)} commits...")
    
    seen_keywords = set()
    for commit_hash, subject in commits:
        cat_res = subprocess.run(["git", "show", f"{commit_hash}:index.html"], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if cat_res.returncode != 0:
            continue
        
        content = cat_res.stdout.decode("utf-8", errors="ignore")
        for i, line in enumerate(content.splitlines()):
            # Look for button chips inside the dashboard view / feed bar area
            if ("button" in line or "chip" in line or "onclick" in line) and any(kw in line for kw in ["AI", "추천", "적합", "등급"]):
                line_str = line.strip()
                if line_str not in seen_keywords:
                    seen_keywords.add(line_str)
                    print(f"Commit {commit_hash[:8]} | Line {i+1}: {line_str}")

if __name__ == "__main__":
    main()
