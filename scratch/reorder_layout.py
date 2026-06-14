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

    # 1. 법정 주요 서류 및 사건 기록 조회 테이블 추출
    doc_table_pattern = r"(<!--\s*법정 주요 서류 및 사건 기록 조회 테이블\s*-->.*?</thead>.*?</tbody>\s*</table>\s*</div>\s*</div>)"
    match = re.search(doc_table_pattern, content, re.DOTALL)
    if not match:
        print("Could not find the court documents table using regex.")
        # fallback string search
        start_idx = content.find("<!-- 법정 주요 서류 및 사건 기록 조회 테이블 -->")
        if start_idx == -1:
            print("Failed completely to find document table start.")
            return
        
        # 테이블의 끝을 찾기 위한 logic
        # '📅 경매 진행 기일 이력' 주석 직전의 </div> </div> 를 찾습니다.
        giiil_idx = content.find("<!-- 📅 경매 진행 기일 이력 -->")
        if giiil_idx == -1:
            print("Failed to find giiil comment.")
            return
        
        # giiil_idx 직전에서 역방향으로 </div> 개수를 고려하여 자름
        doc_table_content = content[start_idx:giiil_idx].strip()
        # 끝나는 부분 조정
        # doc_table_content는 </div> 두개로 끝나야 합니다.
        content_to_remove = content[start_idx:giiil_idx]
    else:
        doc_table_content = match.group(1)
        content_to_remove = doc_table_content

    print("Extracted document table successfully. Length:", len(doc_table_content))

    # 기존 위치에서 삭제
    content = content.replace(content_to_remove, "")

    # 2. 탭 1의 맨 끝(추천 매물 닫힌 직후, group-content-1 닫히기 직전)에 붙이기
    # 탭 1 추천 매물의 끝부분 매칭
    similar_close_pattern = r"(<!--\s*🤝 주변 유사 물건 추천 섹션\s*-->.*?<!-- 동적 렌더링 카드 3개 -->\s*</div>\s*</div>)"
    similar_match = re.search(similar_close_pattern, content, re.DOTALL)
    if not similar_match:
        print("Could not find similar items close pattern.")
        return

    similar_content = similar_match.group(1)
    # 추천 매물 카드 바로 뒤에 법정 서류 테이블을 덧붙임
    new_similar_and_doc = similar_content + "\n\n            " + doc_table_content
    content = content.replace(similar_content, new_similar_and_doc)
    print("Moved documents table to the end of Tab 1.")

    # 3. '📅 경매 진행 기일 이력'과 '🌐 외부 정보망 연동 + 🤝 추천 매물'을 2열 그리드로 묶기
    # 우선 기일 이력 카드 추출
    giiil_pattern = r"(<!--\s*📅 경매 진행 기일 이력\s*-->.*?<tbody id=\"detail-giiil-tbody\".*?</tbody>\s*</table>\s*</div>\s*</div>)"
    giiil_match = re.search(giiil_pattern, content, re.DOTALL)
    if not giiil_match:
        print("Could not find giiil section.")
        return
    giiil_section = giiil_match.group(1)

    # w-full 및 padding p-4로 디자인 보정
    giiil_section_mod = giiil_section.replace(
        'class="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 space-y-2 shadow-sm"',
        'class="bg-white border border-slate-200 rounded-2xl p-4 space-y-2 shadow-sm w-full"'
    )

    # 외부 정보망 연동 카드 추출
    globe_pattern = r"(<!--\s*🌐 원스톱 외부 공식 정보망 연동\s*-->.*?대법원 인터넷등기소.*?</a>\s*</div>\s*</div>)"
    globe_match = re.search(globe_pattern, content, re.DOTALL)
    if not globe_match:
        print("Could not find globe section.")
        return
    globe_section = globe_match.group(1)

    # w-full 및 padding p-4로 디자인 보정
    globe_section_mod = globe_section.replace(
        'class="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 space-y-2.5 shadow-sm"',
        'class="bg-white border border-slate-200 rounded-2xl p-4 space-y-2.5 shadow-sm w-full"'
    )

    # 추천 매물 섹션도 다시 추출 (테이블이 붙어 있는 new_similar_and_doc 제외하고 순수 추천 매물 부분만)
    similar_section_pattern = r"(<!--\s*🤝 주변 유사 물건 추천 섹션\s*-->.*?<div id=\"detail-similar-container\".*?</div>\s*</div>)"
    similar_section_match = re.search(similar_section_pattern, content, re.DOTALL)
    if not similar_section_match:
        print("Could not find similar section for modification.")
        return
    similar_section = similar_section_match.group(1)

    similar_section_mod = similar_section.replace(
        'class="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 space-y-3 shadow-sm"',
        'class="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-sm w-full"'
    )

    # 2열 그리드로 묶어주기
    # 좌: 기일 이력
    # 우: 외부 연동 + 추천 매물
    grid_wrapper = f"""<!-- 3. 경매 기일 이력과 외부 정보 연동/유사 매물 2열 그리드 -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 items-start">
                {giiil_section_mod}

                <div class="space-y-4 sm:space-y-5 w-full">
                    {globe_section_mod}
                    {similar_section_mod}
                </div>
            </div>"""

    # 기존의 기일 이력부터 추천 매물까지의 영역을 grid_wrapper로 대체
    # 순차적으로 replace를 적용합니다.
    # 먼저 giiil_section을 grid_wrapper로 대체하고, globe_section과 similar_section은 삭제합니다.
    content = content.replace(giiil_section, grid_wrapper)
    content = content.replace(globe_section, "")
    content = content.replace(similar_section, "")
    print("Created 2-column grid for Giiil, Globe, and Similar sections.")

    # 4. 탭 3의 max-w-[720px] mx-auto 제거
    content = content.replace(
        'id="group-content-3" class="space-y-4 sm:space-y-5 max-w-[720px] mx-auto w-full"',
        'id="group-content-3" class="space-y-4 sm:space-y-5 w-full"'
    )
    print("Removed max-w constraint from Tab 3.")

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

    print("All tasks completed successfully. index.html updated.")

if __name__ == "__main__":
    main()
