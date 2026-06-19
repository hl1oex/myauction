# -*- coding: utf-8 -*-
"""
마크다운 파일의 공통 린트 경고(헤더 주변 빈 줄 누락, 연속 빈 줄, bare URL)를 자동 정정하는 스크립트입니다.
"""
import re
import os

def fix_markdown(filepath):
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        return

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. 연속된 빈 줄 정리 (3개 이상의 뉴라인을 2개로 축소)
    content = re.sub(r'\n{3,}', '\n\n', content)

    lines = content.split('\n')
    new_lines = []
    
    i = 0
    while i < len(lines):
        line = lines[i]
        
        # 2. 헤더라인 처리 (### 등으로 시작할 때)
        if re.match(r'^#{1,6}\s+', line):
            # 헤더 윗줄이 비어있지 않으면 빈 줄 추가 (첫 줄 제외)
            if new_lines and new_lines[-1].strip() != '':
                new_lines.append('')
            new_lines.append(line)
            
            # 헤더 아랫줄이 비어있지 않으면 빈 줄 추가
            if i + 1 < len(lines) and lines[i+1].strip() != '':
                new_lines.append('')
            i += 1
            continue
            
        new_lines.append(line)
        i += 1

    content = '\n'.join(new_lines)

    # 3. bare URL 및 Email 주소 꺾쇠로 감싸기
    # 일반 텍스트 내에서 http/https 주소가 꺾쇠괄호나 마크다운 링크([]) 등으로 감싸여 있지 않은 경우
    # 네이버 부동산 주소 등 fin.land.naver.com 도 있으므로 이를 타겟팅
    # 먼저 감싸져 있는 것들은 건너뛰기 위해 정밀하게 정규식을 설계합니다.
    def url_replacer(match):
        full = match.group(0)
        # 이미 꺾쇠나 따옴표나 마크다운 기호로 감싸여 있는지 확인
        before = content[max(0, match.start()-1):match.start()]
        after = content[match.end():min(len(content), match.end()+1)]
        if before in ['<', '"', "'", '(', '['] or after in ['>', '"', "'", ')', ']']:
            # 단, () 괄호의 경우 (https://...) 이런 식으로 텍스트 안에 바로 들어갔을 수 있으므로
            # (https://...) 이며 양끝에 <>가 없으면 감싸줍니다.
            if before == '(' and after == ')':
                # 괄호 안의 주소를 <https://...> 형태로 변경
                return f"<{match.group(1)}>"
            return full
        return f"<{full}>"

    # URL 정규식
    content = re.sub(r'https?://[a-zA-Z0-9.-]+(?:\/[a-zA-Z0-9&%_.~+-]*)*(?:\?[a-zA-Z0-9&%_.~+=-]*)?(?:#[a-zA-Z0-9_]*)?', lambda m: f"<{m.group(0)}>" if not (content[max(0, m.start()-1)] == '<' and content[m.end():min(len(content), m.end()+1)] == '>') else m.group(0), content)
    
    # 이메일 주소 정규식
    content = re.sub(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', lambda m: f"<{m.group(0)}>" if not (content[max(0, m.start()-1)] == '<' and content[m.end():min(len(content), m.end()+1)] == '>') else m.group(0), content)

    # 중복 꺾쇠 제거 (예: <<http...>>)
    content = re.sub(r'<<+(https?://[^>]+)>>+', r'<\1>', content)
    content = re.sub(r'<<+([^>]+@[^>]+)>>+', r'<\1>', content)
    
    # 괄호와 꺾쇠 중첩 교정 (예: (<http...>) -> (<http...>)
    # 중첩된 것 보정
    content = re.sub(r'\((https?://[^)]+)\)', r'(<\1>)', content)
    content = re.sub(r'\(([^)]+@[^)]+)\)', r'(<\1>)', content)
    
    # 중복 감싸기 정리 (예: <[text](url)> 형태 방지)
    # 만약 마크다운 링크 [text](<url>) 와 같이 괄호 안에 들어가 버리면 < 가 중복될 수 있음.
    # [text](<url>) 포맷은 통과시키되 마크다운 포맷 바깥의 것들만.

    # 4. 연속된 빈 줄 재정리
    content = re.sub(r'\n{3,}', '\n\n', content)
    # 파일 끝은 항상 단일 개행으로 종료
    content = content.rstrip() + '\n'

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
        
    print(f"Fixed: {filepath}")

# 타겟 파일 리스트
targets = [
    r"d:\BackUp\OneDrive\AI공부\Real estate auction\context-notes.md",
    r"d:\BackUp\OneDrive\AI공부\Real estate auction\checklist.md",
    r"C:\Users\hl1oe\.gemini\antigravity-ide\brain\8284c596-fdad-4b72-9792-b472c69e906b\implementation_plan.md",
    r"C:\Users\hl1oe\.gemini\antigravity-ide\brain\8284c596-fdad-4b72-9792-b472c69e906b\browser\implementation_plan.md",
    r"C:\Users\hl1oe\.gemini\antigravity-ide\brain\8284c596-fdad-4b72-9792-b472c69e906b\browser\walkthrough.md"
]

for t in targets:
    fix_markdown(t)
