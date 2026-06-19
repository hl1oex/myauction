# -*- coding: utf-8 -*-
import subprocess
import sys

def main():
    sys.stdout.reconfigure(encoding='utf-8')
    print("[*] Retrieving commit list...")
    res = subprocess.run(
        ["git", "log", "--format=%H %s", "--", "mobile-app/src/screens/FeedScreen.tsx"],
        stdout=subprocess.PIPE,
        text=True,
        errors="ignore"
    )
    if res.returncode != 0:
        return

    commits = [line.split(" ", 1) for line in res.stdout.splitlines() if line.strip()]
    print(f"[*] Scanning {len(commits)} commits for FeedScreen.tsx...")
    
    seen_lines = set()
    for commit_hash, subject in commits:
        cat_res = subprocess.run(["git", "show", f"{commit_hash}:mobile-app/src/screens/FeedScreen.tsx"], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if cat_res.returncode != 0:
            continue
        
        content = cat_res.stdout.decode("utf-8", errors="ignore")
        for i, line in enumerate(content.splitlines()):
            # Look for keyword chip lists
            if any(term in line for term in ["AI", "추천", "적합", "등급", "curation", "chatbot"]) and any(c in line for c in ["['", "[\"", "tag", "chip", "button"]):
                line_str = line.strip()
                if line_str not in seen_lines:
                    seen_lines.add(line_str)
                    print(f"Commit {commit_hash[:8]} | Line {i+1}: {line_str}")

if __name__ == "__main__":
    main()
