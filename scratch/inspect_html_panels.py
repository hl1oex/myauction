# index.html의 detail-group-panel 1, 2, 3, 4 선언 위치와 마크업 누락 여부를 정밀 검사하는 도구입니다.
import os

html_path = "d:/BackUp/OneDrive/AI공부/Real estate auction/index.html"
result_path = "d:/BackUp/OneDrive/AI공부/Real estate auction/scratch/panel_inspection_result.txt"

if not os.path.exists(html_path):
    print("[-] index.html 파일을 찾을 수 없습니다.")
    exit(1)

with open(html_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

print(f"[+] 총 라인 수: {len(lines)}")

panel_queries = ["detail-group-panel-1", "detail-group-panel-2", "detail-group-panel-3", "detail-group-panel-4"]
found_positions = {}

for idx, line in enumerate(lines):
    for pq in panel_queries:
        if pq in line:
            if pq not in found_positions:
                found_positions[pq] = []
            found_positions[pq].append(idx + 1)

with open(result_path, "w", encoding="utf-8") as f_out:
    f_out.write("=== detail-group-panel 검사 결과 ===\n")
    for pq in panel_queries:
        pos = found_positions.get(pq, [])
        f_out.write(f"패널 ID: {pq} -> 매칭 라인 번호들: {pos}\n")
        
    f_out.write("\n=== 패널 주변 코드 세부 추출 ===\n")
    # 발견된 첫 번째 위치 기준으로 전후 30라인/후 50라인씩 추출합니다.
    for pq in panel_queries:
        pos = found_positions.get(pq, [])
        if pos:
            first_pos = pos[0]
            start_line = max(1, first_pos - 30)
            end_line = min(len(lines), first_pos + 50)
            f_out.write(f"\n--- {pq} (Line {start_line} ~ {end_line}) ---\n")
            for l_idx in range(start_line - 1, end_line):
                f_out.write(f"{l_idx + 1}: {lines[l_idx]}")
        else:
            f_out.write(f"\n--- {pq} 를 파일 내에서 찾을 수 없습니다! ---\n")

print(f"[+] 검사 완료. 결과가 {result_path} 에 저장되었습니다.")
