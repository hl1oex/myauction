# index.html의 detail-group-panel 각 블록의 정확한 시작과 끝 라인을 계산하는 도구입니다.
import os

html_path = "d:/BackUp/OneDrive/AI공부/Real estate auction/index.html"
if not os.path.exists(html_path):
    print("[-] index.html 파일을 찾을 수 없습니다.")
    exit(1)

with open(html_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

panels = ["detail-group-panel-1", "detail-group-panel-2", "detail-group-panel-3", "detail-group-panel-4"]
starts = {}

for idx, line in enumerate(lines):
    for p in panels:
        if f'id="{p}"' in line or f"id='{p}'" in line or f"id={p}" in line:
            starts[p] = idx

for p, start_idx in sorted(starts.items(), key=lambda x: x[1]):
    div_count = 0
    end_idx = -1
    
    first_line = lines[start_idx]
    div_count += first_line.count('<div') - first_line.count('</div')
    
    for i in range(start_idx + 1, len(lines)):
        line = lines[i]
        div_count += line.count('<div') - line.count('</div')
        if div_count <= 0:
            end_idx = i
            break
            
    print(f"Panel: {p}")
    print(f"  Start: Line {start_idx + 1}")
    print(f"  End: Line {end_idx + 1}")
    print(f"  Start content: {lines[start_idx].strip()[:100]}")
    if end_idx != -1:
        print(f"  End content: {lines[end_idx].strip()[:100]}")
