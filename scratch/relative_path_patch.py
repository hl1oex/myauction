# relative_path_patch.py
# 빌드 완료된 dist/mobile/index.html 파일 내의 절대경로를 상대경로로 일괄 치환하고 공식 도메인 리다이렉트 코드를 주입하는 빌드 후처리 스크립트입니다.
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

    # 모바일 파비콘 경로 교정 및 캐시 무효화(Cache-Busting) 강제 주입
    patched = patched.replace('href="./favicon.ico"', 'href="./favicon.ico?v=3"')
    patched = patched.replace('href="./favicon.png"', 'href="./favicon.png?v=3"')
    # 정규식 패턴 매칭을 통해 어떠한 경로 문자열이라도 ./favicon.ico?v=3 로 정밀 보정
    patched = re.sub(r'href="[^"]*favicon\.ico[^"]*"', 'href="./favicon.ico?v=3"', patched)
    patched = re.sub(r'href="[^"]*favicon\.png[^"]*"', 'href="./favicon.png?v=3"', patched)

    # 공식 도메인 리다이렉트 스크립트 정의
    redirect_script = """<script>
        // 구 Firebase 임시 도메인 접속 시 공식 도메인으로 강제 리다이렉트 처리
        if (window.location.hostname.indexOf('action-b8c75') !== -1 || (window.location.hostname.indexOf('web.app') !== -1 && window.location.hostname.indexOf('myauction') === -1)) {
            window.location.replace('https://myauction.r-e.kr' + window.location.pathname + window.location.search + window.location.hash);
        }
    </script>"""

    # head 태그 바로 아래에 리다이렉트 코드 삽입
    if "<head>" in patched:
        patched = patched.replace("<head>", f"<head>\n    {redirect_script}")
    elif "<head " in patched:
        parts = patched.split("<head", 1)
        subparts = parts[1].split(">", 1)
        patched = parts[0] + "<head" + subparts[0] + ">\n    " + redirect_script + subparts[1]

    with open(target_file, "w", encoding="utf-8") as f:
        f.write(patched)

    print("[OK] dist/mobile/index.html 파일의 절대 경로를 상대 경로로 성공적으로 치환하고 리다이렉트 스크립트를 주입했습니다.")

if __name__ == "__main__":
    main()
