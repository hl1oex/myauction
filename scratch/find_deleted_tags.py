# 과거 모든 커밋의 index.html 변경 이력 중 삭제된 라인에서 AI 추천 검색어와 관련된 UI 코드를 발굴하기 위한 스크립트입니다.
import subprocess

def find_deleted_lines():
    print("Running git log -p index.html to find deleted lines...")
    try:
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
        print(f"Error: {e}")
        return

    if res.returncode != 0:
        print(f"Failed: {res.stderr}")
        return

    lines = res.stdout.splitlines()
    deleted_matches = []
    
    current_commit = "unknown"
    commit_date = "unknown"
    
    idx = 0
    while idx < len(lines):
        line = lines[idx]
        if line.startswith("commit "):
            current_commit = line
        elif line.startswith("Date: "):
            commit_date = line
            
        # 삭제된 라인('- ')만 필터링합니다. 단, '---' 파일 정보는 제외합니다.
        if line.startswith("-") and not line.startswith("---"):
            # '추천', '검색', 'tag', 'keyword', 'chip', 'ai' 등 관련 키워드를 포함하는지 검사합니다.
            lower_line = line.lower()
            if any(k in lower_line for k in ["추천", "검색", "tag", "keyword", "chip", "ai"]):
                deleted_matches.append(f"Commit: {current_commit} | {commit_date}")
                deleted_matches.append(f"Line {idx+1}: {line}")
                # 삭제 라인 전후의 맥락을 수집합니다.
                start = max(0, idx - 4)
                end = min(len(lines), idx + 8)
                deleted_matches.append("Context Context:")
                for c in range(start, end):
                    marker = ">>" if c == idx else "  "
                    deleted_matches.append(f"  {marker} {c+1}: {lines[c]}")
                deleted_matches.append("-" * 60)
        idx += 1

    output_path = r"d:\BackUp\OneDrive\AI공부\Real estate auction\scratch\deleted_tags_result.txt"
    try:
        with open(output_path, "w", encoding="utf-8") as f:
            f.write("\n".join(deleted_matches))
        print("Completed. Results written to scratch/deleted_tags_result.txt successfully.")
    except Exception as e:
        print(f"Failed writing file: {e}")

if __name__ == "__main__":
    find_deleted_lines()
