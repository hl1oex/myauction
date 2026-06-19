# index.html에서 selectTheme 함수와 v1.2 연동 자바스크립트 스크립트 정의부를 찾습니다.
import os

def find_select_theme():
    filepath = r"d:\BackUp\OneDrive\AI공부\Real estate auction\index.html"
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
    except Exception as e:
        print(f"Error: {e}")
        return

    lines = content.splitlines()
    matches = []
    
    for idx, line in enumerate(lines):
        if "selectTheme" in line or "v12ThemeCuration" in line:
            matches.append(f"Line {idx+1}: {line.strip()}")
            
    print(f"Found {len(matches)} matches.")
    for m in matches[:30]:
        print(m)

if __name__ == "__main__":
    find_select_theme()
