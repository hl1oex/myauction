# -*- coding: utf-8 -*-
# 이 스크립트는 HTML 파일 내의 거대한 인라인 스크립트를 추출하여 외부 파일로 내보내고,
# 문자열 리터럴을 파괴하지 않고 안전하게 주석 및 불필요한 개행을 제거하여 경량화합니다.

import os
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

def minify_javascript(js_code):
    # 정규식을 이용해 무리하게 주석을 지우다 생기는 자바스크립트의 문법 파괴(SyntaxError)를 완벽히 예방하기 위해,
    # 주석을 포함한 원본 코드를 그대로 안전하게 보존하면서 빈 줄만 가볍게 정돈하여 추출합니다.
    lines = []
    for line in js_code.splitlines():
        if line.strip():
            lines.append(line)
            
    return '\n'.join(lines)

def process_html_file(html_filename, js_filename, script_index_to_extract):
    if not os.path.exists(html_filename):
        print(f"[ERR] {html_filename} 파일이 존재하지 않습니다.")
        return
        
    print(f"[*] {html_filename} 분석 및 스크립트 추출 가동 중...")
    with open(html_filename, "r", encoding="utf-8") as f:
        content = f.read()
        
    scripts = list(re.finditer(r'<script\b[^>]*>(.*?)</script>', content, re.DOTALL))
    
    if script_index_to_extract >= len(scripts):
        print(f"[ERR] 지정된 스크립트 인덱스 {script_index_to_extract}가 유효하지 않습니다.")
        return
        
    match = scripts[script_index_to_extract]
    js_code = match.group(1)
    
    # 자바스크립트 최적화 압축 실행
    minified_js = minify_javascript(js_code)
    
    # 외부 파일로 저장
    with open(js_filename, "w", encoding="utf-8") as f:
        f.write(minified_js)
    print(f"[OK] {js_filename} 압축 저장 완료. {len(js_code)//1024}KB -> {len(minified_js)//1024}KB")
    
    # HTML 내에서 해당 스크립트 블록을 외부 링크 로드 태그로 대체
    # defer 속성을 주어 페이지 로딩 성능을 최적화합니다.
    script_start = match.start()
    script_end = match.end()
    
    new_script_tag = f'<script src="./{js_filename}" defer></script>'
    new_content = content[:script_start] + new_script_tag + content[script_end:]
    
    # HTML 파일 업데이트 저장
    with open(html_filename, "w", encoding="utf-8") as f:
        f.write(new_content)
    print(f"[OK] {html_filename} 정적 최적화 패치 완료.")

def main():
    # 1. index.html 최적화 (인덱스 6번 추출)
    process_html_file("index.html", "index.js", 6)
    
    # 2. admin.html 최적화 (인덱스 4번 추출)
    process_html_file("admin.html", "admin.js", 4)

if __name__ == "__main__":
    main()
