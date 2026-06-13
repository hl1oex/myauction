import re
import sys

# 표준 출력 인코딩을 utf-8로 설정
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

encodings = ['utf-8', 'euc-kr', 'utf-16', 'cp949']
content = None
chosen_enc = None

for enc in encodings:
    try:
        with open("index.html", "r", encoding=enc) as f:
            content = f.read()
            chosen_enc = enc
            print(f"[+] Successfully read index.html with {enc}")
            break
    except Exception as e:
        pass

if not content:
    print("[-] Failed to read index.html with all common encodings")
    exit(1)

# "filter" 키워드가 들어간 라인 찾기
lines = content.split('\n')
print(f"Total lines: {len(lines)}")

# 지능형 필터링 센터 검색
for idx, line in enumerate(lines):
    if "지능형 필터링 센터" in line:
        print(f"Line {idx+1}: {line.strip()[:100]}")
    if "function " in line:
        match = re.search(r'function\s+(\w+)', line)
        if match:
            fn_name = match.group(1)
            if "filter" in fn_name.lower():
                print(f"Line {idx+1} (Function): {line.strip()}")
            elif "update" in fn_name.lower() or "render" in fn_name.lower() or "load" in fn_name.lower():
                # 다른 중요 UI 업데이트 함수 목록도 확인
                if idx > 2500:
                    print(f"Line {idx+1} (Function): {line.strip()}")

# ptype 필터 관련 체크박스들이 모여있는 곳 찾기
for idx, line in enumerate(lines):
    line_str = line.strip()
    if 'id="ptype-' in line_str or 'value="vehicle"' in line_str or 'value="security"' in line_str or 'value="machinery"' in line_str or 'value="etc_goods"' in line_str:
        print(f"Line {idx+1}: {line_str[:150]}")
