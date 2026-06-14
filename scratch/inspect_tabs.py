# 상세페이지 탭 관련 HTML을 분석하고 결과를 텍스트 파일로 저장하는 도구입니다.
import os

html_path = "d:/BackUp/OneDrive/AI공부/Real estate auction/index.html"
result_path = "d:/BackUp/OneDrive/AI공부/Real estate auction/scratch/inspect_result.txt"

if not os.path.exists(html_path):
    print("[-] index.html 파일을 찾을 수 없습니다.")
    exit(1)

with open(html_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

# 탭 버튼이나 패널을 정의하는 id 및 한글 텍스트 패턴들을 찾습니다.
keywords = [
    "detail-group-tab", "detail-group-panel", 
    "1.종합", "2.권리", "3.입찰", "4.위치", "4.입지", "3.입지", "2.권리&안전", 
    "detail-panel-", "detail-tab-", "detail-drawer",
    "입지 & 위치", "입찰 & 금융"
]

matches = []
for idx, line in enumerate(lines):
    for kw in keywords:
        if kw in line:
            matches.append((idx + 1, line.strip()))
            break

with open(result_path, "w", encoding="utf-8") as f_out:
    f_out.write(f"=== index.html 탭 관련 검색 결과 ===\n")
    f_out.write(f"총 매칭 라인 수: {len(matches)}\n\n")
    for num, content in matches:
        f_out.write(f"Line {num}: {content}\n")

print(f"[+] 검색 완료. 결과가 {result_path} 에 저장되었습니다.")
