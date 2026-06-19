# 과거 모든 git 커밋 메시지에서 AI 추천 검색어 유관 내용을 찾아 커밋 해시를 식별하기 위한 스크립트입니다.
import subprocess

def find_commit_messages():
    try:
        # 모든 git 로그의 해시와 메시지를 가져옵니다.
        res = subprocess.run(
            ["git", "log", "--pretty=format:%h - %an, %ar : %s %b"],
            cwd=r"d:\BackUp\OneDrive\AI공부\Real estate auction",
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            encoding="utf-8",
            errors="ignore"
        )
    except Exception as e:
        print(f"Subprocess run error: {e}")
        return

    if res.returncode != 0:
        print(f"Git log failed: {res.stderr}")
        return

    lines = res.stdout.splitlines()
    matches = []
    for line in lines:
        # '검색어', '추천', 'tag', 'ai' 키워드와 매칭합니다.
        # 인코딩이 깨진 라인이 있는지 확인하여 무시/대체합니다.
        if "추천" in line or "검색어" in line or "ai" in line.lower() or "tag" in line.lower():
            matches.append(line)

    output_path = r"d:\BackUp\OneDrive\AI공부\Real estate auction\scratch\find_commit_msg_result.txt"
    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(matches))
    print(f"Complete. Found {len(matches)} matching commits. Written to scratch/find_commit_msg_result.txt")

if __name__ == "__main__":
    find_commit_messages()
