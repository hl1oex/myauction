# -*- coding: utf-8 -*-
import os

def clean_index_html():
    file_path = "index.html"
    if not os.path.exists(file_path):
        print("index.html 파일을 찾을 수 없습니다.")
        return

    with open(file_path, "r", encoding="utf-8") as f:
        lines = f.readlines()

    # 지우고자 하는 중복 구간 탐색
    start_idx = -1
    end_idx = -1

    for idx, line in enumerate(lines):
        if "<!-- 🛡️ [2] 권리분석 탭 패널 (기본 숨김) -->" in line and start_idx == -1:
            # 1439라인 부근의 첫 번째 등장 지점만 타겟팅합니다.
            if idx < 2000:
                start_idx = idx
        if '<div id="detail-group-panel-2"' in line and end_idx == -1:
            end_idx = idx

    if start_idx == -1 or end_idx == -1:
        print(f"시작점({start_idx}) 또는 끝점({end_idx})을 식별하지 못했습니다.")
        return

    print(f"중복 마크업 제거 범위: {start_idx + 1} ~ {end_idx} 라인")

    # 1438라인의 group-content-1 닫는 </div> 뒤에 detail-group-panel-1의 닫는 </div>를 안전하게 하나 더 붙여줍니다.
    # start_idx 이전 줄이 group-content-1의 닫는 </div> (1438라인)입니다.
    # 여기에 detail-group-panel-1을 닫는 </div>를 새로 삽입합니다.
    new_lines = lines[:start_idx]
    new_lines.append("        </div>\n") # detail-group-panel-1 닫기 태그 추가
    new_lines.extend(lines[end_idx:])

    with open(file_path, "w", encoding="utf-8") as f:
        f.writelines(new_lines)

    print("성공적으로 중복 마크업을 제거하고 태그를 닫았습니다.")

if __name__ == "__main__":
    clean_index_html()
