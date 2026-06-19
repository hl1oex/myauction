# git diff 로그를 분석하여 코드 단에서 '추천 검색어' 혹은 'AI 추천' 관련 마크업이 포함되었던 커밋과 실제 코드 조각을 추적하기 위한 스크립트입니다.
import subprocess

def find_diff_snippets():
    try:
        # git log -p index.html 명령을 실행하여 소스코드의 역사적 변경점을 확보합니다.
        res = subprocess.run(
            ["git", "log", "-p", "index.html"],
            cwd=r"d:\BackUp\OneDrive\AI공부\Real estate auction",
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            encoding="utf-8",
            errors="ignore"
        )
    except Exception as e:
        print(f"Subprocess failed: {e}")
        return

    if res.returncode != 0:
        print(f"Git execution failed: {res.stderr}")
        return

    lines = res.stdout.splitlines()
    snippet_blocks = []
    
    current_commit = "unknown"
    commit_date = "unknown"
    
    idx = 0
    while idx < len(lines):
        line = lines[idx]
        if line.startswith("commit "):
            current_commit = line
        elif line.startswith("Date: "):
            commit_date = line
            
        # 변경사항 라인 체크
        is_change = line.startswith("+") or line.startswith("-")
        is_header = line.startswith("+++") or line.startswith("---")
        
        if is_change and not is_header:
            # '추천'과 '검색'이 모두 들어가거나 'ai'와 '추천'이 들어간 라인 탐색
            if ("추천" in line and "검색" in line) or ("ai" in line.lower() and "추천" in line):
                snippet_blocks.append(f"Commit: {current_commit} | {commit_date}")
                snippet_blocks.append(f"Line {idx+1}: {line}")
                
                # 주변 맥락 7줄 캡처
                start = max(0, idx - 8)
                end = min(len(lines), idx + 8)
                snippet_blocks.append("Context block:")
                for c in range(start, end):
                    marker = ">>" if c == idx else "  "
                    snippet_blocks.append(f"  {marker} {c+1}: {lines[c]}")
                snippet_blocks.append("=" * 60)
        idx += 1

    output_path = r"d:\BackUp\OneDrive\AI공부\Real estate auction\scratch\recommend_tags_diff_result.txt"
    try:
        with open(output_path, "w", encoding="utf-8") as f:
            f.write("\n".join(snippet_blocks))
        print(f"Done. Found {len(snippet_blocks)//4} instances. Written to scratch/recommend_tags_diff_result.txt")
    except Exception as e:
        print(f"Write failed: {e}")

if __name__ == "__main__":
    find_diff_snippets()
