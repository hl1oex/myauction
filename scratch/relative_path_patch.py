# relative_path_patch.py
# 빌드 완료된 dist/mobile/index.html 파일 내의 절대경로를 상대경로로 일괄 치환하는 빌드 후처리 스크립트입니다.
import re
import os

def main():
    target_file = "dist/mobile/index.html"
    if not os.path.exists(target_file):
        print(f"[ERROR] {target_file}가 존재하지 않습니다.")
        return

    with open(target_file, "r", encoding="utf-8") as f:
        content = f.read()

    # /auction-server/mobile/ -> ./ 로 치환
    # 만약 app.json의 baseUrl이 /mobile로 설정되어 있었다면 /mobile/ -> ./ 로 치환
    patched = content.replace("/auction-server/mobile/", "./")
    patched = patched.replace("/mobile/", "./")

    with open(target_file, "w", encoding="utf-8") as f:
        f.write(patched)

    print("[OK] dist/mobile/index.html 파일의 절대 경로를 상대 경로로 성공적으로 치환했습니다.")

if __name__ == "__main__":
    main()
