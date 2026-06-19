# 모든 git 커밋 한 줄 로그를 인코딩 에러 없이 파일로 덤프하여 전체 변경 흐름을 한눈에 분석하기 위한 스크립트입니다.
import subprocess

def dump_all():
    try:
        # git log --oneline을 실행하고 출력을 받습니다.
        res = subprocess.run(
            ["git", "log", "--oneline"],
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

    # 결과를 텍스트 파일로 저장합니다.
    output_path = r"d:\BackUp\OneDrive\AI공부\Real estate auction\scratch\all_commits.txt"
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(res.stdout)
    print("All commits dumped to scratch/all_commits.txt successfully.")

if __name__ == "__main__":
    dump_all()
