# -*- coding: utf-8 -*-
import os
import re

def main():
    file_path = r"d:\BackUp\OneDrive\AI공부\Real estate auction\index.html"
    if not os.path.exists(file_path):
        print("index.html not found.")
        return

    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    print("File read successfully. Length:", len(content))

    # 1. detail-panel-takeover (인수 리스크 분석 테이블) 영역 추출
    takeover_pattern = r"(<!--\s*💸 \[3\] 입찰분석 탭 패널.*?<tbody id=\"detail-takeover-tbody\".*?</tbody>\s*</table>\s*</div>\s*</div>\s*</div>)"
    takeover_match = re.search(takeover_pattern, content, re.DOTALL)
    if not takeover_match:
        print("Could not find takeover section.")
        return
    takeover_section = takeover_match.group(1)
    print("Extracted takeover section. Length:", len(takeover_section))

    # takeover_section 디자인 보정 (패딩 p-4, w-full 적용)
    takeover_section_mod = takeover_section.replace(
        'class="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 shadow-sm space-y-3"',
        'class="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3 w-full"'
    )

    # 기존 위치에서 takeover_section 삭제
    content = content.replace(takeover_section, "")

    # 2. detail-panel-analysis (AI 7대 권리 리스크 정밀 하이브리드 리포트 + 공고문) 영역 추출 및 2열 그리드로 재구성
    analysis_pattern = r"(<!--\s*AI 7대 권리 리스크 정밀 하이브리드 리포트\s*-->.*?<div id=\"detail-risk-report\".*?</div>\s*</div>\s*<!--\s*공고문 원문 및 집행관 비고 요약\s*-->.*?<div id=\"detail-desc\".*?</div>\s*</div>)"
    analysis_match = re.search(analysis_pattern, content, re.DOTALL)
    if not analysis_match:
        print("Could not find analysis section.")
        return
    analysis_section = analysis_match.group(1)
    print("Extracted analysis section. Length:", len(analysis_section))

    # AI 리스크와 공고문을 각각 개별 카드 스타일로 통일하고 2열 그리드로 묶어줌
    new_analysis_section = """<!-- AI 7대 권리 리스크 및 공고문 2열 그리드 -->
            <div id="detail-panel-analysis" class="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 items-start">
                <!-- AI 7대 권리 리스크 정밀 하이브리드 리포트 -->
                <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm w-full space-y-3">
                    <h4 class="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-100">
                        <i class="fa-solid fa-shield-halved text-royalBlue"></i> AI 7대 권리 리스크 정밀 하이브리드 리포트
                    </h4>
                    <div id="detail-risk-report" class="space-y-3">
                        <!-- 지능형 리스크 카드가 주입됨 -->
                    </div>
                </div>

                <!-- 공고문 원문 및 집행관 비고 요약 -->
                <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm w-full space-y-3">
                    <h4 class="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-100">
                        <i class="fa-solid fa-align-left text-slate-500"></i> 공고문 원문 및 집행관 비고 요약
                    </h4>
                    <div id="detail-desc" class="text-xs sm:text-sm text-slate-655 leading-relaxed max-h-[160px] overflow-y-auto custom-scrollbar"></div>
                </div>
            </div>"""

    content = content.replace(analysis_section, new_analysis_section)
    print("Updated analysis section to 2-column layout.")

    # 3. detail-panel-occupancy (임차인 명세) 및 detail-panel-registry (등기부 요약) 추출 및 2열 그리드로 묶기
    occupancy_pattern = r"(<!--\s*🚪 \[6\] 점유현황 탭 패널.*?<tbody id=\"detail-occupancy-tbody\".*?</tbody>\s*</table>\s*</div>\s*</div>\s*</div>)"
    occupancy_match = re.search(occupancy_pattern, content, re.DOTALL)
    if not occupancy_match:
        print("Could not find occupancy section.")
        return
    occupancy_section = occupancy_match.group(1)

    registry_pattern = r"(<!--\s*📝 \[7\] 등기현황 탭 패널.*?<tbody id=\"detail-registry-tbody\".*?</tbody>\s*</table>\s*</div>\s*</div>\s*</div>)"
    registry_match = re.search(registry_pattern, content, re.DOTALL)
    if not registry_match:
        print("Could not find registry section.")
        return
    registry_section = registry_match.group(1)

    # w-full 및 padding p-4로 디자인 보정
    occupancy_mod = occupancy_section.replace(
        'class="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 shadow-sm space-y-3"',
        'class="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3 w-full"'
    )
    registry_mod = registry_section.replace(
        'class="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 shadow-sm space-y-3"',
        'class="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3 w-full"'
    )

    # 2열 그리드 컨테이너로 묶고 인수 리스크 테이블을 맨 아래에 추가
    new_occupancy_registry_takeover = f"""<!-- 임차인 및 등기부 2열 그리드 -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 items-start">
                {occupancy_mod}
                {registry_mod}
            </div>

            <!-- 낙찰자 인수 리스크 분석 (단독 1열 배치) -->
            {takeover_section_mod}"""

    # occupancy와 registry 영역을 new_occupancy_registry_takeover로 변경
    content = content.replace(occupancy_section, new_occupancy_registry_takeover)
    content = content.replace(registry_section, "")
    print("Grouped occupancy & registry into 2-column grid and moved takeover table to the bottom.")

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

    print("All tasks completed successfully. index.html updated for Tab 2.")

if __name__ == "__main__":
    main()
