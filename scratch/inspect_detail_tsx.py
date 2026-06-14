# DetailScreen.tsx의 탭 정의 및 activeTab 조건부 렌더링 블록을 검색하고 분석 결과를 파일로 저장하는 도구입니다.
import os

tsx_path = "d:/BackUp/OneDrive/AI공부/Real estate auction/mobile-app/src/screens/DetailScreen.tsx"
result_path = "d:/BackUp/OneDrive/AI공부/Real estate auction/scratch/inspect_detail_result.txt"

if not os.path.exists(tsx_path):
    print("[-] DetailScreen.tsx 파일을 찾을 수 없습니다.")
    exit(1)

with open(tsx_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

keywords = ["activeTab ===", "activeTab.id ===", "tabs =", "const tabs", "location", "bidding", "rights", "general"]
matches = []

for idx, line in enumerate(lines):
    if "activeTab" in line or "const tabs" in line or "tabs =" in line:
        matches.append((idx + 1, line.strip()))

with open(result_path, "w", encoding="utf-8") as f_out:
    f_out.write(f"=== DetailScreen.tsx 탭 관련 검색 결과 ===\n")
    f_out.write(f"총 매칭 라인 수: {len(matches)}\n\n")
    for num, content in matches:
        f_out.write(f"Line {num}: {content}\n")

print(f"[+] 검색 완료. 결과가 {result_path} 에 저장되었습니다.")
