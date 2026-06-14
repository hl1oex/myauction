# index.html의 탭 버튼 명칭을 갱신하고 패널 3과 패널 4의 내부 마크업 및 ID를 안전하게 맞교환하는 스크립트입니다.
import os

html_path = "d:/BackUp/OneDrive/AI공부/Real estate auction/index.html"
if not os.path.exists(html_path):
    print("[-] index.html 파일을 찾을 수 없습니다.")
    exit(1)

with open(html_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. 탭 버튼 명칭 갱신
content = content.replace("2. 권리 & 등기 분석", "2. 권리 & 안전 분석")
content = content.replace("3. 입찰 & 금융 분석", "3. 입지 & 위치 분석")
content = content.replace("4. 위치 & 시세 분석", "4. 입찰 & 금융 분석")

lines = content.splitlines(keepends=True)

# 2. 패널 3과 패널 4 블록 추출
p3_start = 1544
p3_end = 1807
p4_start = 1808
p4_end = 1935

print(f"[+] 패널 3 시작 라인 내용: {lines[p3_start].strip()}")
print(f"[+] 패널 3 끝 라인 내용: {lines[p3_end].strip()}")
print(f"[+] 패널 4 시작 라인 내용: {lines[p4_start].strip()}")
print(f"[+] 패널 4 끝 라인 내용: {lines[p4_end].strip()}")

panel_3_content = "".join(lines[p3_start : p3_end + 1])
panel_4_content = "".join(lines[p4_start : p4_end + 1])

# 3. ID 교환 적용
panel_3_modified = panel_3_content
panel_3_modified = panel_3_modified.replace('id="detail-group-panel-3"', 'id="detail-group-panel-4"')
panel_3_modified = panel_3_modified.replace('id="group-content-3"', 'id="group-content-4"')
panel_3_modified = panel_3_modified.replace('id="group-mask-3"', 'id="group-mask-4"')

panel_4_modified = panel_4_content
panel_4_modified = panel_4_modified.replace('id="detail-group-panel-4"', 'id="detail-group-panel-3"')
panel_4_modified = panel_4_modified.replace('id="group-content-4"', 'id="group-content-3"')
panel_4_modified = panel_4_modified.replace('id="group-mask-4"', 'id="group-mask-3"')

# 4. 재조립하여 파일 쓰기
new_lines = (
    lines[:p3_start] + 
    [panel_4_modified] + 
    [panel_3_modified] + 
    lines[p4_end + 1 :]
)

# 파일 쓰기
with open(html_path, "w", encoding="utf-8") as f:
    f.writelines(new_lines)

print("[+] index.html의 탭 명칭 갱신 및 패널 3/4 스왑이 무결하게 완료되었습니다.")
