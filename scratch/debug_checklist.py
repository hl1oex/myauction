# checklist.md 파일의 끝부분 15개 라인을 읽어서 문자열 상태를 검사하고 출력하는 디버그 스크립트입니다.
import os

def main():
    target_path = "checklist.md"
    if not os.path.exists(target_path):
        print("checklist.md 파일을 찾을 수 없습니다.")
        return

    with open(target_path, "r", encoding="utf-8") as f:
        lines = f.readlines()

    # 끝부분 15줄 출력
    start = max(0, len(lines) - 15)
    for idx in range(start, len(lines)):
        print(f"{idx+1}: {repr(lines[idx])}")

if __name__ == "__main__":
    main()
