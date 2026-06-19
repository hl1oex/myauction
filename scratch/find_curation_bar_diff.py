# git history에서 'curation-bar-container' 키워드가 들어간 모든 diff 내용을 추적하기 위한 스크립트입니다.
import subprocess

def find_curation_bar():
    try:
        # git log -p를 통해 curation-bar-container 키워드가 들어간 변경 이력을 수색합니다.
        res = subprocess.run(
            ["git", "log", "-p", "-S", "curation-bar-container"],
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

    output_path = r"d:\BackUp\OneDrive\AI공부\Real estate auction\scratch\curation_bar_diff.txt"
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(res.stdout)
    print("Completed. Written to scratch/curation_bar_diff.txt successfully.")

if __name__ == "__main__":
    find_curation_bar()
