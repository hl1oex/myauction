# -*- coding: utf-8 -*-
import subprocess
import sys

def main():
    sys.stdout.reconfigure(encoding='utf-8')
    print("[*] Retrieving commit list...")
    res = subprocess.run(["git", "log", "--format=%H %s"], stdout=subprocess.PIPE, text=True, errors="ignore")
    if res.returncode != 0:
        print("Git log failed.")
        return

    commits = []
    for line in res.stdout.splitlines():
        if line.strip():
            parts = line.split(" ", 1)
            commits.append((parts[0], parts[1]))

    print(f"[*] Found {len(commits)} commits. Scanning...")
    
    # We will search for keywords in index.html at each commit
    keywords = ["curation-bar", "curationBar", "curation_bar", "AI 챗봇", "AI 큐레이션", "AI 검색어", "추천 검색어"]
    for commit_hash, subject in commits:
        # Check if index.html existed at this commit
        cat_res = subprocess.run(["git", "show", f"{commit_hash}:index.html"], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if cat_res.returncode != 0:
            continue
        
        try:
            content = cat_res.stdout.decode("utf-8", errors="ignore")
        except Exception:
            continue
            
        for i, line in enumerate(content.splitlines()):
            for kw in keywords:
                if kw in line:
                    print(f"Commit {commit_hash[:8]} ({subject}) | Line {i+1}: {line.strip()}")
                    # Just print first match per commit or print all
                    break

if __name__ == "__main__":
    main()
