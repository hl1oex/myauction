# -*- coding: utf-8 -*-
import re
import sys
import os

def main():
    file_path = "index.html"
    if not os.path.exists(file_path):
        print("Error: index.html not found")
        sys.exit(1)
        
    with open(file_path, "r", encoding="utf-8") as f:
        html = f.read()
        
    # --- 1. 12개 패널 추출 ---
    panel_defs = [
        ("summary", 'id="detail-panel-summary"'),
        ("analysis", 'id="detail-panel-analysis"'),
        ("bid", 'id="detail-panel-bid"'),
        ("dividend", 'id="detail-panel-dividend"'),
        ("takeover", 'id="detail-panel-takeover"'),
        ("occupancy", 'id="detail-panel-occupancy"'),
        ("registry", 'id="detail-panel-registry"'),
        ("statistics", 'id="detail-panel-statistics"'),
        ("market", 'id="detail-panel-market"'),
        ("complex", 'id="detail-panel-complex"'),
        ("map", 'id="detail-panel-map"'),
        ("floorplan", 'id="detail-panel-floorplan"'),
    ]
    
    panel_indices = []
    for name, marker in panel_defs:
        idx = html.find(marker)
        if idx == -1:
            print(f"Error: {marker} not found in HTML")
            sys.exit(1)
        start_div = html.rfind('<div', 0, idx)
        panel_indices.append((name, start_div))
        
    # floorplan 패널의 끝 찾기
    floorplan_start = panel_indices[-1][1]
    aside_end = html.find('</aside>', floorplan_start)
    floorplan_end = html.rfind('</div>', floorplan_start, aside_end) + 6
    
    panel_contents = {}
    for i in range(len(panel_indices)):
        name, start = panel_indices[i]
        if i < len(panel_indices) - 1:
            end = panel_indices[i+1][1]
        else:
            end = floorplan_end
        panel_contents[name] = html[start:end].strip()
        
    # --- 2. 추출된 패널의 시작 div 태그 정리 ---
    def clean_panel_tag(name, content):
        pattern = rf'<div\s+id="detail-panel-{name}"[^>]*>'
        replacement = f'<div id="detail-panel-{name}" class="space-y-4 sm:space-y-5">'
        return re.sub(pattern, replacement, content)
        
    summary_html = clean_panel_tag("summary", panel_contents["summary"])
    analysis_html = clean_panel_tag("analysis", panel_contents["analysis"])
    bid_html = clean_panel_tag("bid", panel_contents["bid"])
    dividend_html = clean_panel_tag("dividend", panel_contents["dividend"])
    takeover_html = clean_panel_tag("takeover", panel_contents["takeover"])
    occupancy_html = clean_panel_tag("occupancy", panel_contents["occupancy"])
    registry_html = clean_panel_tag("registry", panel_contents["registry"])
    statistics_html = clean_panel_tag("statistics", panel_contents["statistics"])
    market_html = clean_panel_tag("market", panel_contents["market"])
    complex_html = clean_panel_tag("complex", panel_contents["complex"])
    map_html = clean_panel_tag("map", panel_contents["map"])
    floorplan_html = clean_panel_tag("floorplan", panel_contents["floorplan"])
    
    # --- 3. 1번 패널 가상소유자/채무자, 평수 분할 주입 ---
    # summary_html 에서 '진행 회차' 닫는 div 태그 뒤에 추가
    round_idx = summary_html.find('id="detail-spec-round"')
    if round_idx != -1:
        # round 블록의 닫는 </div> 찾기
        close_div_idx = summary_html.find('</div>', round_idx)
        if close_div_idx != -1:
            close_div_idx += 6
            injected_specs = """
                        <div class="bg-slate-50 border border-slate-100 p-2 rounded-xl flex justify-between items-center">
                            <span class="text-slate-450 font-semibold text-[10px] sm:text-xs">소유자</span>
                            <span id="detail-owner" class="font-extrabold text-slate-800"></span>
                        </div>
                        <div class="bg-slate-50 border border-slate-100 p-2 rounded-xl flex justify-between items-center">
                            <span class="text-slate-450 font-semibold text-[10px] sm:text-xs">채무자</span>
                            <span id="detail-debtor" class="font-extrabold text-slate-800"></span>
                        </div>
                        <div class="bg-slate-50 border border-slate-100 p-2 rounded-xl flex justify-between items-center">
                            <span class="text-slate-450 font-semibold text-[10px] sm:text-xs">전용 면적</span>
                            <span id="detail-spec-exclusive-py" class="font-extrabold text-slate-800 font-mono"></span>
                        </div>
                        <div class="bg-slate-50 border border-slate-100 p-2 rounded-xl flex justify-between items-center">
                            <span class="text-slate-450 font-semibold text-[10px] sm:text-xs">공급 면적 (추정)</span>
                            <span id="detail-spec-supply-py" class="font-extrabold text-slate-800 font-mono"></span>
                        </div>
                        <div class="bg-slate-50 border border-slate-100 p-2 rounded-xl flex justify-between items-center">
                            <span class="text-slate-450 font-semibold text-[10px] sm:text-xs">토지 대지권</span>
                            <span id="detail-spec-land-py" class="font-extrabold text-slate-800 font-mono"></span>
                        </div>
                        <div class="bg-slate-50 border border-slate-100 p-2 rounded-xl flex justify-between items-center">
                            <span class="text-slate-450 font-semibold text-[10px] sm:text-xs">건물 전용</span>
                            <span id="detail-spec-building-py" class="font-extrabold text-slate-800 font-mono"></span>
                        </div>"""
            summary_html = summary_html[:close_div_idx] + injected_specs + summary_html[close_div_idx:]
            
    # 기일 진행 이력 표 및 유사 추천 매물 마크업 정의
    giil_html = """
            <!-- 📅 경매 진행 기일 이력 -->
            <div class="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 space-y-2 shadow-sm">
                <h4 class="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5 mb-2.5">
                    <i class="fa-solid fa-calendar-days text-royalBlue"></i> 📅 경매 진행 기일 이력
                </h4>
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="border-b border-slate-200 text-[10px] sm:text-xs text-slate-400 font-extrabold">
                                <th class="p-2 w-1/4">회차</th>
                                <th class="p-2 w-1/3">입찰 기일</th>
                                <th class="p-2 text-right">최저 매각 가격</th>
                                <th class="p-2 text-center">결과</th>
                            </tr>
                        </thead>
                        <tbody id="detail-giiil-tbody" class="text-xs">
                            <!-- 동적 주입 -->
                        </tbody>
                    </table>
                </div>
            </div>"""
            
    similar_html = """
            <!-- 🤝 주변 유사 물건 추천 섹션 -->
            <div class="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 space-y-3 shadow-sm">
                <h4 class="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-100">
                    <i class="fa-solid fa-handshake text-royalBlue"></i> 🤝 동일 용도/지역 기반 유사 추천 매물
                </h4>
                <div id="detail-similar-container" class="grid grid-cols-3 gap-2">
                    <!-- 동적 렌더링 카드 3개 -->
                </div>
            </div>"""
            
    # --- 4. 3번 패널 시나리오 ROI 표, AI 코멘트 마크업 정의 ---
    scenario_html = """
            <!-- 🏆 시나리오별 입찰 수익성 시뮬레이터 -->
            <div class="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 space-y-2.5 shadow-sm">
                <h4 class="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-100">
                    <i class="fa-solid fa-chart-line text-royalBlue"></i> 🏆 시나리오별 입찰 수익성 시뮬레이션
                </h4>
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse text-[10px] sm:text-xs">
                        <thead>
                            <tr class="border-b border-slate-200 text-slate-400 font-extrabold">
                                <th class="p-2">구분 (입찰가율)</th>
                                <th class="p-2 text-right">예상 입찰가</th>
                                <th class="p-2 text-right">대출 (70%)</th>
                                <th class="p-2 text-right">필요 자본금</th>
                                <th class="p-2 text-right">연 이자 (4.5%)</th>
                                <th class="p-2 text-right text-rose-600">예측 ROI</th>
                            </tr>
                        </thead>
                        <tbody id="detail-scenario-tbody">
                            <!-- 동적 주입 -->
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- 🧠 AI 실전 투자 분석 총평 -->
            <div class="bg-amber-50/30 border border-amber-200/60 rounded-2xl p-3.5 sm:p-4 space-y-2 shadow-sm">
                <h4 class="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5">
                    <i class="fa-solid fa-brain text-amber-600"></i> 🧠 AI 실전 투자 분석 총평
                </h4>
                <div id="detail-ai-comment" class="text-xs sm:text-sm text-slate-700 leading-relaxed font-semibold">
                    <!-- 동적 코멘트 줄글 주입 -->
                </div>
            </div>"""
            
    # --- 5. 4대 대분류 그룹 패널 마크업 조립 ---
    group_1_html = f"""
        <div id="detail-group-panel-1" class="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 sm:space-y-5 custom-scrollbar bg-slate-50/50">
            <div id="group-content-1" class="space-y-4 sm:space-y-5">
                {summary_html}
                {giil_html}
                {complex_html}
                {floorplan_html}
                {similar_html}
            </div>
        </div>"""
        
    group_2_html = f"""
        <div id="detail-group-panel-2" class="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 sm:space-y-5 custom-scrollbar bg-slate-50/50 hidden relative">
            <div id="group-content-2" class="space-y-4 sm:space-y-5">
                {analysis_html}
                {takeover_html}
                {occupancy_html}
                {registry_html}
            </div>
            <div id="group-mask-2" class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-30 flex flex-col items-center justify-center text-center p-6 hidden">
                <div class="bg-white border border-slate-200 rounded-2xl p-6 max-w-sm shadow-2xl space-y-3">
                    <i class="fa-solid fa-lock text-rose-500 text-3xl"></i>
                    <h4 class="text-slate-800 text-sm font-black">🔒 권리 & 등기 분석 열람 제한</h4>
                    <p class="text-slate-500 text-[10.5px] leading-relaxed font-semibold">본 매물의 권리 & 등기 정보는 우수 회원 등급 전용 콘텐츠입니다. 등급을 상향하여 심층 AI 권리진단을 확인해 보세요.</p>
                    <button onclick="alert('등급 상향은 관리자 권한으로 즉시 조정 가능합니다.')" class="w-full bg-royalBlue text-white font-extrabold text-xs py-2 rounded-xl shadow-md hover:bg-royalHover transition-all">등급 상향 신청하기</button>
                </div>
            </div>
        </div>"""
        
    group_3_html = f"""
        <div id="detail-group-panel-3" class="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 sm:space-y-5 custom-scrollbar bg-slate-50/50 hidden relative">
            <div id="group-content-3" class="space-y-4 sm:space-y-5">
                {bid_html}
                {dividend_html}
                {statistics_html}
                {scenario_html}
            </div>
            <div id="group-mask-3" class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-30 flex flex-col items-center justify-center text-center p-6 hidden">
                <div class="bg-white border border-slate-200 rounded-2xl p-6 max-w-sm shadow-2xl space-y-3">
                    <i class="fa-solid fa-lock text-rose-500 text-3xl"></i>
                    <h4 class="text-slate-800 text-sm font-black">🔒 입찰 & 금융 분석 열람 제한</h4>
                    <p class="text-slate-500 text-[10.5px] leading-relaxed font-semibold">본 매물의 입찰 & 금융 상세 시뮬레이션은 프리미엄 회원 등급 전용 콘텐츠입니다. 등급을 상향하여 정밀 ROI 분석을 확인해 보세요.</p>
                    <button onclick="alert('등급 상향은 관리자 권한으로 즉시 조정 가능합니다.')" class="w-full bg-royalBlue text-white font-extrabold text-xs py-2 rounded-xl shadow-md hover:bg-royalHover transition-all">등급 상향 신청하기</button>
                </div>
            </div>
        </div>"""
        
    group_4_html = f"""
        <div id="detail-group-panel-4" class="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 sm:space-y-5 custom-scrollbar bg-slate-50/50 hidden relative">
            <div id="group-content-4" class="space-y-4 sm:space-y-5">
                {map_html}
                {market_html}
            </div>
            <div id="group-mask-4" class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-30 flex flex-col items-center justify-center text-center p-6 hidden">
                <div class="bg-white border border-slate-200 rounded-2xl p-6 max-w-sm shadow-2xl space-y-3">
                    <i class="fa-solid fa-lock text-rose-500 text-3xl"></i>
                    <h4 class="text-slate-800 text-sm font-black">🔒 위치 & 시세 분석 열람 제한</h4>
                    <p class="text-slate-500 text-[10.5px] leading-relaxed font-semibold">본 매물의 지도 및 인근 실거래 시세 추이는 프리미엄 회원 등급 전용 콘텐츠입니다. 등급을 상향하여 실시간 위치분석 정보를 확인해 보세요.</p>
                    <button onclick="alert('등급 상향은 관리자 권한으로 즉시 조정 가능합니다.')" class="w-full bg-royalBlue text-white font-extrabold text-xs py-2 rounded-xl shadow-md hover:bg-royalHover transition-all">등급 상향 신청하기</button>
                </div>
            </div>
        </div>"""
        
    # --- 6. 4대 대분류 탭 메뉴 바 마크업 정의 ---
    tab_menu_bar_html = """
        <!-- 💎 상세 Drawer 4대 대분류 프리미엄 탭 메뉴 바 -->
        <div class="flex overflow-x-auto whitespace-nowrap bg-white p-2 gap-1.5 z-10 flex-shrink-0 custom-scrollbar border-b border-slate-200">
            <button id="detail-group-tab-1-btn" onclick="changeDetailGroupTab(1)" class="inline-block py-1.5 px-3.5 text-center text-[10.5px] sm:text-xs font-black rounded-xl border border-transparent transition-all select-none bg-royalBlue text-white shadow-sm">1. 종합 분석</button>
            <button id="detail-group-tab-2-btn" onclick="changeDetailGroupTab(2)" class="inline-block py-1.5 px-3.5 text-center text-[10.5px] sm:text-xs font-black rounded-xl border border-transparent transition-all select-none text-slate-500 hover:text-royalBlue hover:bg-slate-50 bg-slate-50/50">2. 권리 & 등기 분석</button>
            <button id="detail-group-tab-3-btn" onclick="changeDetailGroupTab(3)" class="inline-block py-1.5 px-3.5 text-center text-[10.5px] sm:text-xs font-black rounded-xl border border-transparent transition-all select-none text-slate-500 hover:text-royalBlue hover:bg-slate-50 bg-slate-50/50">3. 입찰 & 금융 분석</button>
            <button id="detail-group-tab-4-btn" onclick="changeDetailGroupTab(4)" class="inline-block py-1.5 px-3.5 text-center text-[10.5px] sm:text-xs font-black rounded-xl border border-transparent transition-all select-none text-slate-500 hover:text-royalBlue hover:bg-slate-50 bg-slate-50/50">4. 위치 & 시세 분석</button>
        </div>"""
        
    # --- 7. 전체 상세 탭 바 & 패널 치환 ---
    detail_tabs_start = html.find('<!-- 💎 상세 Drawer 12단 프리미엄 탭 메뉴 바 -->')
    if detail_tabs_start == -1:
        print("Error: 12-tab marker not found")
        sys.exit(1)
        
    assembled_detail_html = tab_menu_bar_html + group_1_html + group_2_html + group_3_html + group_4_html
    html = html[:detail_tabs_start] + assembled_detail_html + html[floorplan_end:]
    
    # --- 8. 검색 필터 아코디언 및 다중선택 적용 ---
    filter_start_marker = '<!-- 스크롤 가능한 필터 폼 -->'
    filter_start_idx = html.find(filter_start_marker)
    if filter_start_idx == -1:
        print("Error: Filter marker not found")
        sys.exit(1)
        
    # 기존 필터 영역 닫는 div 위치 찾기 (sidebar-panel의 끝 div의 바로 위 div 닫기)
    # sidebar-panel 안에 filter container div가 들어있고, 그 아래에 닫는 </div>가 있습니다.
    # filter_start_idx 이후의 첫 <div class="flex-1...
    filter_container_idx = html.find('<div', filter_start_idx)
    # 이 컨테이너의 닫는 </div> 위치를 매칭
    # HTML 구조를 보니, filter container 아래에 여러 div가 있고,
    # target load end는 '<!-- AI 자산 등급 필터 -->'의 라벨 및 라디오가 들어있는 마지막 div의 닫는 </div> 바로 뒤입니다.
    # restored_git_diff.txt의 diff가 538라인에서 끝납니다.
    # sidebar-panel 의 닫는 </div> 가 538라인 직후에 있습니다.
    # 따라서 512라인의 AI 등급 필터 닫는 </div> 뒤를 찾으면 됩니다.
    grade_filter_idx = html.find('name="grade-filter"', filter_start_idx)
    last_div_idx = html.find('</div>', grade_filter_idx) # radio inner
    last_div_idx = html.find('</div>', last_div_idx + 6) # grid inner
    last_div_idx = html.find('</div>', last_div_idx + 6) # container inner (이것이 filter container의 닫는 태그) + 6
    filter_container_end = last_div_idx + 6
    
    new_filter_html = """<!-- 스크롤 가능한 필터 폼 -->
            <div class="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar text-xs">
                <!-- 통합 검색 -->
                <div class="border-b border-slate-100 pb-1.5">
                    <button type="button" onclick="toggleAccordion('accordion-search')" class="w-full flex justify-between items-center text-[10px] sm:text-xs font-black text-slate-700 py-1 select-none">
                        <span>🔍 통합 검색 키워드</span>
                        <i id="accordion-search-icon" class="fa-solid fa-chevron-down text-[8px] text-slate-400"></i>
                    </button>
                    <div id="accordion-search" class="hidden mt-1">
                        <input type="text" id="search-input" oninput="debouncedApplyFilters()" placeholder="사건번호, 주소, 용도 입력..." 
                               class="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-royalBlue/10 focus:border-royalBlue transition-all">
                    </div>
                </div>

                <!-- 자산 공급 출처 (다중선택) -->
                <div class="border-b border-slate-100 pb-1.5">
                    <button type="button" onclick="toggleAccordion('accordion-source')" class="w-full flex justify-between items-center text-[10px] sm:text-xs font-black text-slate-700 py-1 select-none">
                        <span>🏷️ 자산 공급 출처 (다중)</span>
                        <i id="accordion-source-icon" class="fa-solid fa-chevron-down text-[8px] text-slate-400"></i>
                    </button>
                    <div id="accordion-source" class="hidden mt-1 space-y-1 pl-1">
                        <div class="flex gap-2 mb-1">
                            <button type="button" onclick="checkAllFilter('source-check', true)" class="text-[9.5px] text-royalBlue font-extrabold hover:underline">전체 선택</button>
                            <span class="text-[9.5px] text-slate-300">|</span>
                            <button type="button" onclick="checkAllFilter('source-check', false)" class="text-[9.5px] text-slate-400 font-extrabold hover:underline">전체 해제</button>
                        </div>
                        <label class="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-slate-600">
                            <input type="checkbox" name="source-check" value="court" checked onchange="applyFilters()" class="accent-royalBlue">
                            <span>법원 경매 물건</span>
                        </label>
                        <label class="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-slate-600">
                            <input type="checkbox" name="source-check" value="onbid" checked onchange="applyFilters()" class="accent-royalBlue">
                            <span>캠코 온비드 공매</span>
                        </label>
                        <label class="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-slate-600">
                            <input type="checkbox" name="source-check" value="private" checked onchange="applyFilters()" class="accent-royalBlue">
                            <span>업로드한 사설 매물</span>
                        </label>
                    </div>
                </div>

                <!-- 관할 법원 (다중선택) -->
                <div class="border-b border-slate-100 pb-1.5">
                    <button type="button" onclick="toggleAccordion('accordion-court')" class="w-full flex justify-between items-center text-[10px] sm:text-xs font-black text-slate-700 py-1 select-none">
                        <span>⚖️ 관할 법원 (다중)</span>
                        <i id="accordion-court-icon" class="fa-solid fa-chevron-down text-[8px] text-slate-400"></i>
                    </button>
                    <div id="accordion-court" class="hidden mt-1 space-y-1 pl-1">
                        <div class="flex gap-2 mb-1">
                            <button type="button" onclick="checkAllFilter('court-check', true)" class="text-[9.5px] text-royalBlue font-extrabold hover:underline">전체 선택</button>
                            <span class="text-[9.5px] text-slate-300">|</span>
                            <button type="button" onclick="checkAllFilter('court-check', false)" class="text-[9.5px] text-slate-400 font-extrabold hover:underline">전체 해제</button>
                        </div>
                        <div class="max-h-[100px] overflow-y-auto space-y-1 custom-scrollbar text-xs font-bold text-slate-600 p-1.5 bg-white rounded-lg border border-slate-150">
                            <label class="flex items-center gap-2 cursor-pointer select-none">
                                <input type="checkbox" name="court-check" value="서울중앙지방법원" onchange="applyFilters()" class="accent-royalBlue">
                                <span>서울중앙지법</span>
                            </label>
                            <label class="flex items-center gap-2 cursor-pointer select-none">
                                <input type="checkbox" name="court-check" value="서울동부지방법원" onchange="applyFilters()" class="accent-royalBlue">
                                <span>서울동부지법</span>
                            </label>
                            <label class="flex items-center gap-2 cursor-pointer select-none">
                                <input type="checkbox" name="court-check" value="서울남부지방법원" onchange="applyFilters()" class="accent-royalBlue">
                                <span>서울남부지법</span>
                            </label>
                            <label class="flex items-center gap-2 cursor-pointer select-none">
                                <input type="checkbox" name="court-check" value="서울북부지방법원" onchange="applyFilters()" class="accent-royalBlue">
                                <span>서울북부지법</span>
                            </label>
                            <label class="flex items-center gap-2 cursor-pointer select-none">
                                <input type="checkbox" name="court-check" value="서울서부지방법원" onchange="applyFilters()" class="accent-royalBlue">
                                <span>서울서부지법</span>
                            </label>
                            <label class="flex items-center gap-2 cursor-pointer select-none">
                                <input type="checkbox" name="court-check" value="의정부지방법원" onchange="applyFilters()" class="accent-royalBlue">
                                <span>의정부지법</span>
                            </label>
                            <label class="flex items-center gap-2 cursor-pointer select-none">
                                <input type="checkbox" name="court-check" value="인천지방법원" onchange="applyFilters()" class="accent-royalBlue">
                                <span>인천지법</span>
                            </label>
                            <label class="flex items-center gap-2 cursor-pointer select-none">
                                <input type="checkbox" name="court-check" value="수원지방법원" onchange="applyFilters()" class="accent-royalBlue">
                                <span>수원지법</span>
                            </label>
                            <label class="flex items-center gap-2 cursor-pointer select-none">
                                <input type="checkbox" name="court-check" value="춘천지방법원" onchange="applyFilters()" class="accent-royalBlue">
                                <span>춘천지법</span>
                            </label>
                            <label class="flex items-center gap-2 cursor-pointer select-none">
                                <input type="checkbox" name="court-check" value="대전지방법원" onchange="applyFilters()" class="accent-royalBlue">
                                <span>대전지법</span>
                            </label>
                            <label class="flex items-center gap-2 cursor-pointer select-none">
                                <input type="checkbox" name="court-check" value="청주지방법원" onchange="applyFilters()" class="accent-royalBlue">
                                <span>청주지법</span>
                            </label>
                            <label class="flex items-center gap-2 cursor-pointer select-none">
                                <input type="checkbox" name="court-check" value="대구지방법원" onchange="applyFilters()" class="accent-royalBlue">
                                <span>대구지법</span>
                            </label>
                            <label class="flex items-center gap-2 cursor-pointer select-none">
                                <input type="checkbox" name="court-check" value="부산지방법원" onchange="applyFilters()" class="accent-royalBlue">
                                <span>부산지법</span>
                            </label>
                            <label class="flex items-center gap-2 cursor-pointer select-none">
                                <input type="checkbox" name="court-check" value="울산지방법원" onchange="applyFilters()" class="accent-royalBlue">
                                <span>울산지법</span>
                            </label>
                            <label class="flex items-center gap-2 cursor-pointer select-none">
                                <input type="checkbox" name="court-check" value="창원지방법원" onchange="applyFilters()" class="accent-royalBlue">
                                <span>창원지법</span>
                            </label>
                            <label class="flex items-center gap-2 cursor-pointer select-none">
                                <input type="checkbox" name="court-check" value="광주지방법원" onchange="applyFilters()" class="accent-royalBlue">
                                <span>광주지법</span>
                            </label>
                            <label class="flex items-center gap-2 cursor-pointer select-none">
                                <input type="checkbox" name="court-check" value="전주지방법원" onchange="applyFilters()" class="accent-royalBlue">
                                <span>전주지법</span>
                            </label>
                            <label class="flex items-center gap-2 cursor-pointer select-none">
                                <input type="checkbox" name="court-check" value="제주지방법원" onchange="applyFilters()" class="accent-royalBlue">
                                <span>제주지법</span>
                            </label>
                        </div>
                    </div>
                </div>

                <!-- 물건 종류 (다중선택) -->
                <div class="border-b border-slate-100 pb-1.5">
                    <button type="button" onclick="toggleAccordion('accordion-ptype')" class="w-full flex justify-between items-center text-[10px] sm:text-xs font-black text-slate-700 py-1 select-none">
                        <span>🏠 물건 종류 (용도 다중)</span>
                        <i id="accordion-ptype-icon" class="fa-solid fa-chevron-down text-[8px] text-slate-400"></i>
                    </button>
                    <div id="accordion-ptype" class="hidden mt-1 space-y-1 pl-1">
                        <div class="flex gap-2 mb-1">
                            <button type="button" onclick="checkAllFilter('ptype-check', true)" class="text-[9.5px] text-royalBlue font-extrabold hover:underline">전체 선택</button>
                            <span class="text-[9.5px] text-slate-300">|</span>
                            <button type="button" onclick="checkAllFilter('ptype-check', false)" class="text-[9.5px] text-slate-400 font-extrabold hover:underline">전체 해제</button>
                        </div>
                        <label class="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-slate-600">
                            <input type="checkbox" name="ptype-check" value="apart" checked onchange="applyFilters()" class="accent-royalBlue">
                            <span>아파트/주택/오피스텔</span>
                        </label>
                        <label class="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-slate-600">
                            <input type="checkbox" name="ptype-check" value="store" checked onchange="applyFilters()" class="accent-royalBlue">
                            <span>상가/점포/근린상가</span>
                        </label>
                        <label class="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-slate-600">
                            <input type="checkbox" name="ptype-check" value="house" checked onchange="applyFilters()" class="accent-royalBlue">
                            <span>단독/다가구/전원주택</span>
                        </label>
                        <label class="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-slate-600">
                            <input type="checkbox" name="ptype-check" value="land" checked onchange="applyFilters()" class="accent-royalBlue">
                            <span>토지/임야/대지</span>
                        </label>
                        <label class="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-slate-600">
                            <input type="checkbox" name="ptype-check" value="factory" checked onchange="applyFilters()" class="accent-royalBlue">
                            <span>공장/창고/기타</span>
                        </label>
                    </div>
                </div>

                <!-- 지역 대분류 (다중선택) -->
                <div class="border-b border-slate-100 pb-1.5">
                    <button type="button" onclick="toggleAccordion('accordion-sido')" class="w-full flex justify-between items-center text-[10px] sm:text-xs font-black text-slate-700 py-1 select-none">
                        <span>📍 지역 대분류 (시도 다중)</span>
                        <i id="accordion-sido-icon" class="fa-solid fa-chevron-down text-[8px] text-slate-400"></i>
                    </button>
                    <div id="accordion-sido" class="hidden mt-1 space-y-1 pl-1">
                        <div class="flex gap-2 mb-1">
                            <button type="button" onclick="checkAllFilter('sido-check', true)" class="text-[9.5px] text-royalBlue font-extrabold hover:underline">전체 선택</button>
                            <span class="text-[9.5px] text-slate-300">|</span>
                            <button type="button" onclick="checkAllFilter('sido-check', false)" class="text-[9.5px] text-slate-400 font-extrabold hover:underline">전체 해제</button>
                        </div>
                        <div class="max-h-[100px] overflow-y-auto space-y-1 custom-scrollbar text-xs font-bold text-slate-600 p-1.5 bg-white rounded-lg border border-slate-150">
                            <label class="flex items-center gap-2 cursor-pointer select-none">
                                <input type="checkbox" name="sido-check" value="서울" onchange="updateSigunguFilter()" class="accent-royalBlue">
                                <span>서울특별시</span>
                            </label>
                            <label class="flex items-center gap-2 cursor-pointer select-none">
                                <input type="checkbox" name="sido-check" value="경기" onchange="updateSigunguFilter()" class="accent-royalBlue">
                                <span>경기도</span>
                            </label>
                            <label class="flex items-center gap-2 cursor-pointer select-none">
                                <input type="checkbox" name="sido-check" value="인천" onchange="updateSigunguFilter()" class="accent-royalBlue">
                                <span>인천광역시</span>
                            </label>
                            <label class="flex items-center gap-2 cursor-pointer select-none">
                                <input type="checkbox" name="sido-check" value="부산" onchange="updateSigunguFilter()" class="accent-royalBlue">
                                <span>부산광역시</span>
                            </label>
                            <label class="flex items-center gap-2 cursor-pointer select-none">
                                <input type="checkbox" name="sido-check" value="대구" onchange="updateSigunguFilter()" class="accent-royalBlue">
                                <span>대구광역시</span>
                            </label>
                            <label class="flex items-center gap-2 cursor-pointer select-none">
                                <input type="checkbox" name="sido-check" value="광주" onchange="updateSigunguFilter()" class="accent-royalBlue">
                                <span>광주광역시</span>
                            </label>
                            <label class="flex items-center gap-2 cursor-pointer select-none">
                                <input type="checkbox" name="sido-check" value="대전" onchange="updateSigunguFilter()" class="accent-royalBlue">
                                <span>대전광역시</span>
                            </label>
                            <label class="flex items-center gap-2 cursor-pointer select-none">
                                <input type="checkbox" name="sido-check" value="울산" onchange="updateSigunguFilter()" class="accent-royalBlue">
                                <span>울산광역시</span>
                            </label>
                            <label class="flex items-center gap-2 cursor-pointer select-none">
                                <input type="checkbox" name="sido-check" value="세종" onchange="updateSigunguFilter()" class="accent-royalBlue">
                                <span>세종시</span>
                            </label>
                            <label class="flex items-center gap-2 cursor-pointer select-none">
                                <input type="checkbox" name="sido-check" value="강원" onchange="updateSigunguFilter()" class="accent-royalBlue">
                                <span>강원도</span>
                            </label>
                            <label class="flex items-center gap-2 cursor-pointer select-none">
                                <input type="checkbox" name="sido-check" value="충북" onchange="updateSigunguFilter()" class="accent-royalBlue">
                                <span>충청북도</span>
                            </label>
                            <label class="flex items-center gap-2 cursor-pointer select-none">
                                <input type="checkbox" name="sido-check" value="충남" onchange="updateSigunguFilter()" class="accent-royalBlue">
                                <span>충청남도</span>
                            </label>
                            <label class="flex items-center gap-2 cursor-pointer select-none">
                                <input type="checkbox" name="sido-check" value="전북" onchange="updateSigunguFilter()" class="accent-royalBlue">
                                <span>전라북도</span>
                            </label>
                            <label class="flex items-center gap-2 cursor-pointer select-none">
                                <input type="checkbox" name="sido-check" value="전남" onchange="updateSigunguFilter()" class="accent-royalBlue">
                                <span>전라남도</span>
                            </label>
                            <label class="flex items-center gap-2 cursor-pointer select-none">
                                <input type="checkbox" name="sido-check" value="경북" onchange="updateSigunguFilter()" class="accent-royalBlue">
                                <span>경상북도</span>
                            </label>
                            <label class="flex items-center gap-2 cursor-pointer select-none">
                                <input type="checkbox" name="sido-check" value="경남" onchange="updateSigunguFilter()" class="accent-royalBlue">
                                <span>경상남도</span>
                            </label>
                            <label class="flex items-center gap-2 cursor-pointer select-none">
                                <input type="checkbox" name="sido-check" value="제주" onchange="updateSigunguFilter()" class="accent-royalBlue">
                                <span>제주도</span>
                            </label>
                        </div>
                    </div>
                </div>

                <!-- 상세 관할 구역 (시군구) -->
                <div id="sigungu-panel" class="hidden bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                    <label class="block text-[10.5px] font-black text-slate-500 uppercase tracking-wider mb-1.5">🏙️ 상세 관할 구역 (시/군/구)</label>
                    <div id="sigungu-container" class="max-h-[100px] overflow-y-auto space-y-1 custom-scrollbar text-xs font-bold text-slate-600">
                        <!-- 동적으로 주입됨 -->
                    </div>
                </div>

                <!-- 매각/입찰 기일 범위 -->
                <div class="border-b border-slate-100 pb-1.5">
                    <button type="button" onclick="toggleAccordion('accordion-date')" class="w-full flex justify-between items-center text-[10px] sm:text-xs font-black text-slate-700 py-1 select-none">
                        <span>📅 매각/입찰 기일 범위</span>
                        <i id="accordion-date-icon" class="fa-solid fa-chevron-down text-[8px] text-slate-400"></i>
                    </button>
                    <div id="accordion-date" class="hidden mt-1">
                        <select id="date-filter" onchange="applyFilters()"
                                class="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-royalBlue/10 focus:border-royalBlue transition-all">
                            <option value="999">기한 제한 없음</option>
                            <option value="30">30일 이내 임박 매물</option>
                            <option value="90">90일 이내 (3달)</option>
                            <option value="180" selected>180일 이내 (6달 / 권장)</option>
                        </select>
                    </div>
                </div>

                <!-- 예산 세도 -->
                <div class="border-b border-slate-100 pb-1.5">
                    <button type="button" onclick="toggleAccordion('accordion-budget')" class="w-full flex justify-between items-center text-[10px] sm:text-xs font-black text-slate-700 py-1 select-none">
                        <span>💸 감정/최저 예산 한도</span>
                        <i id="accordion-budget-icon" class="fa-solid fa-chevron-down text-[8px] text-slate-400"></i>
                    </button>
                    <div id="accordion-budget" class="hidden mt-1 space-y-1 pl-1">
                        <div class="flex justify-between items-center mb-1">
                            <span id="budget-label" class="text-xs font-black text-royalBlue font-outfit">제한 없음</span>
                        </div>
                        <input type="range" id="budget-slider" min="10000000" max="2000000000" step="10000000" value="2000000000" oninput="updateBudgetLabel(this.value)" 
                               class="w-full accent-royalBlue cursor-pointer">
                        <div class="flex justify-between text-[9px] text-slate-400 font-bold mt-1">
                            <span>1천만</span>
                            <span>10억</span>
                            <span>20억(제한없음)</span>
                        </div>
                    </div>
                </div>

                <!-- 과거 마감 매물 제외 -->
                <div class="border-b border-slate-100 pb-1.5">
                    <button type="button" onclick="toggleAccordion('accordion-past')" class="w-full flex justify-between items-center text-[10px] sm:text-xs font-black text-slate-700 py-1 select-none">
                        <span>📅 과거 종결/마감 매물 제외</span>
                        <i id="accordion-past-icon" class="fa-solid fa-chevron-down text-[8px] text-slate-400"></i>
                    </button>
                    <div id="accordion-past" class="hidden mt-1 flex items-center justify-between pl-1">
                        <span class="text-xs font-bold text-slate-500">마감 매물 필터</span>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" id="hide-past-toggle" checked onchange="applyFilters()" class="sr-only peer">
                            <div class="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-royalBlue"></div>
                        </label>
                    </div>
                </div>

                <!-- 내 관심 목록만 보기 -->
                <div class="border-b border-slate-100 pb-1.5">
                    <button type="button" onclick="toggleAccordion('accordion-favorites')" class="w-full flex justify-between items-center text-[10px] sm:text-xs font-black text-slate-700 py-1 select-none">
                        <span>⭐ 내 관심 목록 매물만 보기</span>
                        <i id="accordion-favorites-icon" class="fa-solid fa-chevron-down text-[8px] text-slate-400"></i>
                    </button>
                    <div id="accordion-favorites" class="hidden mt-1 flex items-center justify-between pl-1">
                        <span class="text-xs font-bold text-slate-500">관심 목록 전용</span>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" id="show-favorites-toggle" onchange="toggleFavoritesFilter()" class="sr-only peer">
                            <div class="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-royalBlue"></div>
                        </label>
                    </div>
                </div>

                <!-- AI 권리 등급 분류 필터 -->
                <div class="border-b border-slate-100 pb-1.5">
                    <button type="button" onclick="toggleAccordion('accordion-grade')" class="w-full flex justify-between items-center text-[10px] sm:text-xs font-black text-slate-700 py-1 select-none">
                        <span>🛡️ AI 권리 등급 분류 필터</span>
                        <i id="accordion-grade-icon" class="fa-solid fa-chevron-down text-[8px] text-slate-400"></i>
                    </button>
                    <div id="accordion-grade" class="hidden mt-1 space-y-1.5 pl-1">
                        <div class="grid grid-cols-3 gap-1 bg-white p-1 rounded-lg border border-slate-200 text-[9px] font-bold text-center">
                            <label class="cursor-pointer py-1 rounded transition-all select-none">
                                <input type="radio" name="grade-filter" value="all" onchange="applyFilters()" class="hidden">
                                <span id="grade-filter-all" class="block rounded py-0.5 bg-slate-100 text-slate-700 font-extrabold">전체</span>
                            </label>
                            <label class="cursor-pointer py-1 rounded transition-all select-none">
                                <input type="radio" name="grade-filter" value="safe" checked onchange="applyFilters()" class="hidden">
                                <span id="grade-filter-safe" class="block rounded py-0.5 font-extrabold text-slate-500">🟢 우량</span>
                            </label>
                            <label class="cursor-pointer py-1 rounded transition-all select-none">
                                <input type="radio" name="grade-filter" value="risk" onchange="applyFilters()" class="hidden">
                                <span id="grade-filter-risk" class="block rounded py-0.5 font-extrabold text-slate-500">🚨 위험</span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>"""
            
    html = html[:filter_start_idx] + new_filter_html + html[filter_container_end:]
    
    # --- 9. 자바스크립트 영역 치환 적용 ---
    
    # 9-1. KPI 카드 60% 축소 치환
    # PC/태블릿 KPI 카드 축소
    oldKpiPC = """                <div class="hidden lg:grid grid-cols-3 gap-2">
                    <div class="bg-blue-50/50 border border-blue-100 rounded-xl p-1.5 text-center">
                        <p class="text-[10px] sm:text-xs font-black text-royalBlue uppercase tracking-wider mb-0.5">추천 적합 매물 (전체 <span id="kpi-total-count" class="font-outfit text-slate-500 font-bold">0</span>건 중)</p>
                        <h3 id="kpi-recommended-count" class="text-xs sm:text-sm font-black text-slate-900 font-outfit">0건</h3>
                    </div>
                    <div class="bg-emerald-50/50 border border-emerald-100 rounded-xl p-1.5 text-center">
                        <p class="text-[10px] sm:text-xs font-black text-emeraldSuccess uppercase tracking-wider mb-0.5">고적합 (A~B등급)</p>
                        <h3 id="kpi-high-count" class="text-xs sm:text-sm font-black text-emeraldSuccess font-outfit">0건</h3>
                    </div>
                    <div class="bg-rose-50/50 border border-rose-100 rounded-xl p-1.5 text-center">
                        <p class="text-[10px] sm:text-xs font-black text-crimsonAlert uppercase tracking-wider mb-0.5">위험 탈락 매물 (X)</p>
                        <h3 id="kpi-risk-count" class="text-xs sm:text-sm font-black text-crimsonAlert font-outfit">0건</h3>
                    </div>
                </div>"""
                
    newKpiPC = """                <div class="hidden lg:grid grid-cols-3 gap-1">
                    <div class="bg-blue-50/50 border border-blue-100 rounded-lg p-1 text-center">
                        <p class="text-[8px] sm:text-[9.5px] font-black text-royalBlue uppercase tracking-wider mb-0.2">추천 적합 매물 (전체 <span id="kpi-total-count" class="font-outfit text-slate-500 font-bold">0</span>건 중)</p>
                        <h3 id="kpi-recommended-count" class="text-[10px] sm:text-[11px] font-black text-slate-900 font-outfit">0건</h3>
                    </div>
                    <div class="bg-emerald-50/50 border border-emerald-100 rounded-lg p-1 text-center">
                        <p class="text-[8px] sm:text-[9.5px] font-black text-emeraldSuccess uppercase tracking-wider mb-0.2">고적합 (A~B등급)</p>
                        <h3 id="kpi-high-count" class="text-[10px] sm:text-[11px] font-black text-emeraldSuccess font-outfit">0건</h3>
                    </div>
                    <div class="bg-rose-50/50 border border-rose-100 rounded-lg p-1 text-center">
                        <p class="text-[8px] sm:text-[9.5px] font-black text-crimsonAlert uppercase tracking-wider mb-0.2">위험 탈락 매물 (X)</p>
                        <h3 id="kpi-risk-count" class="text-[10px] sm:text-[11px] font-black text-crimsonAlert font-outfit">0건</h3>
                    </div>
                </div>"""
    
    html = html.replace(oldKpiPC, newKpiPC)
    
    # 모바일 미니 KPI 카드 축소
    oldKpiMob = """                    <div class="grid grid-cols-3 gap-1.5 text-center">
                        <div class="bg-blue-50/40 border border-blue-100/60 rounded-xl py-1 px-1.5">
                            <p class="text-[8px] min-[360px]:text-[9px] font-black text-royalBlue mb-0.5 whitespace-nowrap">추천 적합 매물</p>
                            <h3 class="text-[9.5px] min-[360px]:text-[11px] font-black text-slate-900 font-outfit leading-none">
                                <span id="kpi-recommended-count-mob">0건</span>
                                <span class="text-[8px] font-bold text-slate-400 font-sans">(전체 <span id="kpi-total-count-mob">0</span>)</span>
                            </h3>
                        </div>
                        <div class="bg-emerald-50/40 border border-emerald-100/60 rounded-xl py-1 px-1.5">
                            <p class="text-[8px] min-[360px]:text-[9px] font-black text-emeraldSuccess mb-0.5 whitespace-nowrap">🟢 고적합 (A~B)</p>
                            <h3 id="kpi-high-count-mob" class="text-[9.5px] min-[360px]:text-[11px] font-black text-emeraldSuccess font-outfit leading-none">0건</h3>
                        </div>
                        <div class="bg-rose-50/40 border border-rose-100/60 rounded-xl py-1 px-1.5">
                            <p class="text-[8px] min-[360px]:text-[9px] font-black text-crimsonAlert mb-0.5 whitespace-nowrap">🚨 위험 탈락 (X)</p>
                            <h3 id="kpi-risk-count-mob" class="text-[9.5px] min-[360px]:text-[11px] font-black text-crimsonAlert font-outfit leading-none">0건</h3>
                        </div>
                    </div>"""
                    
    newKpiMob = """                    <div class="grid grid-cols-3 gap-1 text-center">
                        <div class="bg-blue-50/40 border border-blue-100/60 rounded-lg py-0.5 px-1">
                            <p class="text-[6.5px] min-[360px]:text-[7.5px] font-black text-royalBlue mb-0.2 whitespace-nowrap">추천 적합 매물</p>
                            <h3 class="text-[7.5px] min-[360px]:text-[8.5px] font-black text-slate-900 font-outfit leading-none">
                                <span id="kpi-recommended-count-mob">0건</span>
                                <span class="text-[6.5px] font-bold text-slate-400 font-sans">(전체 <span id="kpi-total-count-mob">0</span>)</span>
                            </h3>
                        </div>
                        <div class="bg-emerald-50/40 border border-emerald-100/60 rounded-lg py-0.5 px-1">
                            <p class="text-[6.5px] min-[360px]:text-[7.5px] font-black text-emeraldSuccess mb-0.2 whitespace-nowrap">🟢 고적합 (A~B)</p>
                            <h3 id="kpi-high-count-mob" class="text-[7.5px] min-[360px]:text-[8.5px] font-black text-emeraldSuccess font-outfit leading-none">0건</h3>
                        </div>
                        <div class="bg-rose-50/40 border border-rose-100/60 rounded-lg py-0.5 px-1">
                            <p class="text-[6.5px] min-[360px]:text-[7.5px] font-black text-crimsonAlert mb-0.2 whitespace-nowrap">🚨 위험 탈락 (X)</p>
                            <h3 id="kpi-risk-count-mob" class="text-[7.5px] min-[360px]:text-[8.5px] font-black text-crimsonAlert font-outfit leading-none">0건</h3>
                        </div>
                    </div>"""
                    
    html = html.replace(oldKpiMob, newKpiMob)
    
    # 9-2. 전역 변수 추가
    targetAuthVars = """        let currentUser = null;
        let favoritePropertyIds = new Set();
        let showFavoritesOnly = false;
        let isSignUpMode = false;"""
        
    replaceAuthVars = """        let currentUser = null;
        let favoritePropertyIds = new Set();
        let showFavoritesOnly = false;
        let isSignUpMode = false;
        let userGrade = "C";
        let adSettings = null;
        let renderedCount = 0;
        let currentDetailGroupTab = 1;"""
        
    html = html.replace(targetAuthVars, replaceAuthVars)
    
    # 9-3. 신설 헬퍼 함수 및 그룹 탭 함수, 타이틀 싱크 함수 주입
    targetLoadFav = """        // Supabase로부터 로그인 유저의 관심 목록 로드 함수
        async function loadFavoritesFromServer() {"""
        
    injectedFuncs = """        // 📱 검색 필터 아코디언 패널 토글 함수
        function toggleAccordion(id) {
            const el = document.getElementById(id);
            const icon = document.getElementById(id + "-icon");
            if (el) {
                if (el.classList.contains("hidden")) {
                    el.classList.remove("hidden");
                    if (icon) {
                        icon.classList.remove("fa-chevron-down");
                        icon.classList.add("fa-chevron-up");
                    }
                } else {
                    el.classList.add("hidden");
                    if (icon) {
                        icon.classList.remove("fa-chevron-up");
                        icon.classList.add("fa-chevron-down");
                    }
                }
            }
        }

        // 📱 다중 필터 전체 선택 / 전체 해제 함수
        function checkAllFilter(name, checked) {
            const checkboxes = document.querySelectorAll(`input[name="${name}"]`);
            checkboxes.forEach(cb => {
                cb.checked = checked;
            });
            if (name === "sido-check") {
                updateSigunguFilter();
            } else {
                applyFilters();
            }
        }

        // 🔒 Supabase user_profiles 고객 등급 조회 함수
        async function fetchUserGrade() {
            if (!currentUser) {
                userGrade = "C";
                return;
            }
            try {
                const { data, error } = await supabaseClient
                    .from("user_profiles")
                    .select("grade")
                    .eq("id", currentUser.id)
                    .maybeSingle();
                
                if (error) throw error;
                
                if (data) {
                    userGrade = data.grade || "C";
                } else {
                    // 기본 C등급으로 신규 프로필 생성
                    await supabaseClient
                        .from("user_profiles")
                        .insert({ id: currentUser.id, grade: "C", email: currentUser.email });
                    userGrade = "C";
                }
            } catch (err) {
                console.error("고객 등급 조회 실패 (C등급으로 설정):", err);
                userGrade = "C";
            }
        }

        // 📢 Supabase ads 광고 연동 로드 함수
        async function loadAdSettings() {
            try {
                const { data, error } = await supabaseClient
                    .from("ads")
                    .select("*")
                    .eq("active", true)
                    .order("id", { ascending: false });
                if (error) throw error;
                adSettings = data || [];
            } catch (err) {
                console.error("광고 연동 실패:", err);
                adSettings = [];
            }
        }

        // 📢 광고 카드 동적 렌더러 함수
        function renderAdCard(index) {
            let ad = null;
            if (adSettings && adSettings.length > 0) {
                ad = adSettings[index % adSettings.length];
            }
            
            const defaultAd = {
                title: "★ 프리미엄 경공매 투자 VIP 멤버십 모집",
                desc: "오직 1%를 위한 NPL 부실채권 및 지분 경매 핵심 노하우 단독 공개. 지금 가입 시 30% 한정 할인 적용!",
                image_url: "./apartment_elegant_facade.png",
                link_url: "https://action-b8c75.web.app",
                type: "banner"
            };
            
            const currentAd = ad || defaultAd;
            
            let contentHtml = "";
            if (currentAd.type === "adsense" && currentAd.ad_code) {
                contentHtml = `<div class="w-full h-full flex items-center justify-center overflow-hidden font-mono text-[9px] text-slate-400">${currentAd.ad_code}</div>`;
            } else {
                contentHtml = `
                    <a href="${currentAd.link_url || "#"}" target="_blank" class="flex flex-col justify-between h-full space-y-2 group">
                        <div class="relative w-full h-[110px] rounded-xl overflow-hidden bg-slate-100 border border-slate-200/60">
                            <img src="${currentAd.image_url || "./apartment_elegant_facade.png"}" alt="광고" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
                            <span class="absolute top-1.5 left-1.5 bg-slate-900/60 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase">AD</span>
                        </div>
                        <div class="space-y-1 flex-1 flex flex-col justify-between">
                            <div>
                                <h4 class="text-xs font-black text-slate-800 line-clamp-2 leading-snug group-hover:text-royalBlue transition-colors">
                                    ${currentAd.title}
                                </h4>
                                <p class="text-[10px] text-slate-400 font-bold line-clamp-2 mt-1 leading-normal">
                                    ${currentAd.desc}
                                </p>
                            </div>
                            <div class="text-[10.5px] font-black text-royalBlue pt-1 border-t border-slate-100 flex items-center justify-between">
                                <span>자세히 보기</span>
                                <i class="fa-solid fa-arrow-right text-[9px] group-hover:translate-x-1 transition-transform"></i>
                            </div>
                        </div>
                    </a>
                `;
            }
            
            return `
                <div class="bg-amber-50/20 border-amber-200/80 border rounded-2xl p-3 flex flex-col justify-between transition-all duration-300 transform hover:-translate-y-1 shadow-sm select-none min-h-[300px]">
                    ${contentHtml}
                </div>
            `;
        }

        // 📱 4대 대분류 그룹 탭 스위칭 및 등급 블러 마스크 제어 함수
        function changeDetailGroupTab(tabNum) {
            currentDetailGroupTab = tabNum;
            for (let i = 1; i <= 4; i++) {
                const btn = document.getElementById(`detail-group-tab-${i}-btn`);
                const panel = document.getElementById(`detail-group-panel-${i}`);
                if (btn) {
                    if (i === tabNum) {
                        btn.className = "inline-block py-1.5 px-3.5 text-center text-[10.5px] sm:text-xs font-black rounded-xl border border-transparent transition-all select-none bg-royalBlue text-white shadow-sm";
                    } else {
                        btn.className = "inline-block py-1.5 px-3.5 text-center text-[10.5px] sm:text-xs font-black rounded-xl border border-transparent transition-all select-none text-slate-500 hover:text-royalBlue hover:bg-slate-50 bg-slate-50/50";
                    }
                }
                if (panel) {
                    if (i === tabNum) {
                        panel.classList.remove("hidden");
                    } else {
                        panel.classList.add("hidden");
                    }
                }
            }

            const mask2 = document.getElementById("group-mask-2");
            const mask3 = document.getElementById("group-mask-3");
            const mask4 = document.getElementById("group-mask-4");
            const content2 = document.getElementById("group-content-2");
            const content3 = document.getElementById("group-content-3");
            const content4 = document.getElementById("group-content-4");

            if (mask2) mask2.classList.add("hidden");
            if (mask3) mask3.classList.add("hidden");
            if (mask4) mask4.classList.add("hidden");
            if (content2) content2.style.filter = "none";
            if (content3) content3.style.filter = "none";
            if (content4) content4.style.filter = "none";

            if (userGrade === "B") {
                if (mask3) mask3.classList.remove("hidden");
                if (mask4) mask4.classList.remove("hidden");
                if (content3) content3.style.filter = "blur(8px)";
                if (content4) content4.style.filter = "blur(8px)";
            } else if (userGrade === "C") {
                if (mask2) mask2.classList.remove("hidden");
                if (mask3) mask3.classList.remove("hidden");
                if (mask4) mask4.classList.remove("hidden");
                if (content2) content2.style.filter = "blur(8px)";
                if (content3) content3.style.filter = "blur(8px)";
                if (content4) content4.style.filter = "blur(8px)";
            }

            updateDynamicBrowserTitle();
        }

        // 📱 실시간 브라우저 타이틀 동적 전환 함수
        function updateDynamicBrowserTitle() {
            const drawer = document.getElementById("detail-drawer");
            if (drawer && !drawer.classList.contains("translate-x-full")) {
                const auctionNo = document.getElementById("detail-no") ? document.getElementById("detail-no").innerText : "";
                const cleanNo = auctionNo.replace("사건번호: ", "").trim();
                const tabNames = {
                    1: "종합분석",
                    2: "권리분석",
                    3: "수익분석",
                    4: "위치분석"
                };
                const tabLabel = tabNames[currentDetailGroupTab] || "상세";
                document.title = `부동산경공매 검색시스템 - ${cleanNo} [${tabLabel}]`;
            } else {
                document.title = "부동산경공매 검색시스템 - 실시간 추천";
            }
        }

        // Supabase로부터 로그인 유저의 관심 목록 로드 함수
        async function loadFavoritesFromServer() {"""
        
    html = html.replace(targetLoadFav, injectedFuncs)
    
    # 9-4. authStateChange 등급 실시간 동기화
    targetAuthListener = """        supabaseClient.auth.onAuthStateChange(async (event, session) => {
            currentUser = session ? session.user : null;
            updateAuthUI();"""
            
    replaceAuthListener = """        supabaseClient.auth.onAuthStateChange(async (event, session) => {
            currentUser = session ? session.user : null;
            await fetchUserGrade(); // 고객 등급 실시간 동기화
            updateAuthUI();"""
            
    html = html.replace(targetAuthListener, replaceAuthListener)
    
    # 9-5. 초기화 시 광고 설정 로드 통합
    targetInitialLoad = """            // 3. Supabase 실시간 추천 매물 바인딩 및 Realtime 채널 개설
            await loadPropertiesFromSupabase();"""
            
    replaceInitialLoad = """            // 3. 광고 설정 로드
            await loadAdSettings();
            
            // 3. Supabase 실시간 추천 매물 바인딩 및 Realtime 채널 개설
            await loadPropertiesFromSupabase();"""
            
    html = html.replace(targetInitialLoad, replaceInitialLoad)
    
    # 9-6. updateSigunguFilter 함수 다중선택 시도에 맞게 보강 치환
    # 이 부분은 ps1 파일의 updateSigunguFilter 부분과 동일
    # index.html 에 있는 updateSigunguFilter 함수를 찾아서 교체
    oldSigunguFunc_start = html.find('function updateSigunguFilter')
    oldSigunguFunc_end = html.find('}', oldSigunguFunc_start) + 1
    
    newSigunguFunc = """function updateSigunguFilter(apply = true) {
            const sidoCheckBoxes = document.querySelectorAll('input[name="sido-check"]:checked');
            const selectedSidos = Array.from(sidoCheckBoxes).map(cb => cb.value);
            const panel = document.getElementById("sigungu-panel");
            const container = document.getElementById("sigungu-container");
            
            if (selectedSidos.length === 0) {
                if (panel) panel.classList.add("hidden");
                if (container) container.innerHTML = "";
                if (apply) applyFilters();
                return;
            }
            
            if (panel) panel.classList.remove("hidden");
            
            let sigungus = [];
            selectedSidos.forEach(sido => {
                if (FULL_REGIONS[sido]) {
                    FULL_REGIONS[sido].forEach(sg => {
                        sigungus.push({ sido: sido, name: sg });
                    });
                }
            });
            
            sigungus.sort((a, b) => a.name.localeCompare(b.name, "ko"));
            
            const checkedVals = Array.from(document.querySelectorAll('input[name="sigungu-check"]:checked')).map(cb => cb.value);
            
            let html = sigungus.map(item => {
                const fullVal = `${item.sido} ${item.name}`;
                const checked = checkedVals.includes(fullVal) ? "checked" : "";
                return `
                    <label class="flex items-center gap-2 cursor-pointer select-none text-[11px] font-semibold text-slate-600 py-0.5">
                        <input type="checkbox" name="sigungu-check" value="${fullVal}" ${checked} onchange="applyFilters()" class="accent-royalBlue">
                        <span>[${item.sido}] ${item.name}</span>
                    </label>
                `;
            }).join("");
            
            if (container) container.innerHTML = html;
            if (apply) applyFilters();
        }"""
        
    html = html[:oldSigunguFunc_start] + newSigunguFunc + html[oldSigunguFunc_end:]
    
    # 9-7. applyFilters() 다중선택 필터링 개편
    oldApplyFilters_start = html.find('function applyFilters()')
    oldApplyFilters_end = html.find('function sortData', oldApplyFilters_start)
    # sortData 함수 직전까지가 applyFilters 의 영역
    # oldApplyFilters_end 에서 닫는 } 위치를 찾음
    oldApplyFilters_end = html.rfind('}', oldApplyFilters_start, oldApplyFilters_end) + 1
    
    newApplyFilters = """function applyFilters() {
            const searchQuery = document.getElementById("search-input").value.trim().toLowerCase();
            
            const sourceCheckBoxes = document.querySelectorAll('input[name="source-check"]:checked');
            const selectedSources = Array.from(sourceCheckBoxes).map(cb => cb.value);
            
            const ptypeCheckBoxes = document.querySelectorAll('input[name="ptype-check"]:checked');
            const selectedPtypes = Array.from(ptypeCheckBoxes).map(cb => cb.value);
            
            const sidoCheckBoxes = document.querySelectorAll('input[name="sido-check"]:checked');
            const selectedSidos = Array.from(sidoCheckBoxes).map(cb => cb.value);

            const dateLimit = parseInt(document.getElementById("date-filter").value);
            const budgetLimit = parseInt(document.getElementById("budget-slider").value);
            const hidePast = document.getElementById("hide-past-toggle").checked;
            
            const gradeFilterEl = document.querySelector('input[name="grade-filter"]:checked');
            const gradeVal = gradeFilterEl ? gradeFilterEl.value : "safe";
            
            ['all', 'safe', 'risk'].forEach(g => {
                const el = document.getElementById(`grade-filter-${g}`);
                if (el) {
                    if (g === gradeVal) {
                        el.className = "block rounded py-0.5 bg-royalBlue text-white font-extrabold shadow-sm";
                    } else {
                        el.className = "block rounded py-0.5 text-slate-500 hover:bg-slate-100 font-bold";
                    }
                }
            });

            const sigunguCheckBoxes = document.querySelectorAll('input[name="sigungu-check"]:checked');
            const selectedSigungus = Array.from(sigunguCheckBoxes).map(cb => cb.value);

            filteredProperties = originalProperties.filter(item => {
                const addressStr = item.address || "";
                const matchesKeyword = !searchQuery || 
                    addressStr.toLowerCase().includes(searchQuery) ||
                    (item.auction_no || "").toLowerCase().includes(searchQuery) ||
                    (item.desc_content && item.desc_content.toLowerCase().includes(searchQuery)) ||
                    (item.notes_content && item.notes_content.toLowerCase().includes(searchQuery)) ||
                    (item.ptype && item.ptype.toLowerCase().includes(searchQuery));
                
                const matchesBudget = budgetLimit >= 2000000000 || item.minimum_bid <= budgetLimit;
                
                const matchesSource = selectedSources.length === 0 || selectedSources.includes(item.source);
                
                const matchesDate = dateLimit === 999 || (item.remaining_days && item.remaining_days <= dateLimit);
                
                const matchesPast = !hidePast || (item.remaining_days && item.remaining_days >= 0);
                
                let matchesSido = selectedSidos.length === 0;
                if (selectedSidos.length > 0) {
                    for (const sido of selectedSidos) {
                        const aliases = [sido];
                        if (sido === "서울") aliases.push("특별시");
                        if (sido === "경기") aliases.push("경기도");
                        let matched = false;
                        aliases.forEach(al => {
                            if (addressStr.includes(al)) matched = true;
                        });
                        if (matched) { matchesSido = true; break; }
                    }
                }
                
                let matchesSigungu = true;
                if (selectedSigungus.length > 0) {
                    matchesSigungu = false;
                    selectedSigungus.forEach(sgFull => {
                        const sg = sgFull.split(" ")[1];
                        if (addressStr.includes(sg)) matchesSigungu = true;
                    });
                }

                let matchesGrade = true;
                if (gradeVal === 'safe') {
                    matchesGrade = item.grade !== 'X';
                } else if (gradeVal === 'risk') {
                    matchesGrade = item.grade === 'X';
                }

                let matchesPtype = selectedPtypes.length === 0;
                if (selectedPtypes.length > 0) {
                    const type = (item.ptype || "").toLowerCase();
                    for (const val of selectedPtypes) {
                        if (val === "apart") {
                            if (type.includes("아파트") || type.includes("오피스텔") || type.includes("다세대") || type.includes("빌라") || type.includes("연립")) { matchesPtype = true; break; }
                        } else if (val === "store") {
                            if (type.includes("상가") || type.includes("점포") || type.includes("근린") || type.includes("근생") || type.includes("생활시설") || type.includes("상업") || type.includes("빌딩") || type.includes("사무실")) { matchesPtype = true; break; }
                        } else if (val === "house") {
                            if ((type.includes("주택") || type.includes("가구") || type.includes("단독") || type.includes("전원")) && !type.includes("아파트") && !type.includes("다세대") && !type.includes("연립")) { matchesPtype = true; break; }
                        } else if (val === "land") {
                            if (type.includes("토지") || type.includes("대지") || type.includes("임야") || type.includes("잡종지") || type.includes("대") || type.includes("전") || type.includes("답")) { matchesPtype = true; break; }
                        } else if (val === "factory") {
                            if (type.includes("공장") || type.includes("창고") || type.includes("산업")) { matchesPtype = true; break; }
                        }
                    }
                }
                
                let matchesFavorite = true;
                if (showFavoritesOnly) {
                    matchesFavorite = favoritePropertyIds.has(item.id);
                }
                
                let matchesCourt = true;
                const courtCheckBoxes = document.querySelectorAll('input[name="court-check"]:checked');
                const selectedCourts = Array.from(courtCheckBoxes).map(cb => cb.value);
                if (selectedCourts.length > 0) {
                    matchesCourt = false;
                    for (let courtName of selectedCourts) {
                        if ((item.auction_no || "").includes(courtName)) {
                            matchesCourt = true;
                            break;
                        }
                    }
                }
                
                return matchesKeyword && matchesBudget && matchesSource && matchesDate && matchesPast && matchesSido && matchesSigungu && matchesGrade && matchesPtype && matchesFavorite && matchesCourt;
            });
            
            currentPage = 1;
            sortData('score');
            saveFiltersToCache();
        }"""
        
    html = html[:oldApplyFilters_start] + newApplyFilters + html[oldApplyFilters_end:]
    
    # 9-8. resetFilters, saveFiltersToCache, restoreFiltersFromCache 함수들 치환
    # resetFilters 치환
    oldResetFilters_start = html.find('function resetFilters()')
    oldResetFilters_end = html.find('}', oldResetFilters_start) + 1
    
    newResetFilters = """function resetFilters() {
            document.getElementById("search-input").value = "";
            document.querySelectorAll('input[name="source-check"]').forEach(cb => cb.checked = true);
            document.querySelectorAll('input[name="ptype-check"]').forEach(cb => cb.checked = true);
            document.querySelectorAll('input[name="sido-check"]').forEach(cb => cb.checked = false);
            document.getElementById("date-filter").value = "180";
            document.getElementById("budget-slider").value = "2000000000";
            document.getElementById("hide-past-toggle").checked = true;
            document.getElementById("show-favorites-toggle").checked = false;
            showFavoritesOnly = false;
            
            const safeRadio = document.querySelector('input[name="grade-filter"][value="safe"]');
            if (safeRadio) safeRadio.checked = true;
            
            document.querySelectorAll('input[name="court-check"]').forEach(cb => cb.checked = false);
            document.getElementById("upload-status").classList.add("hidden");
            
            updateSigunguFilter(false);
            updateBudgetLabel(2000000000);
            applyFilters();
        }"""
        
    html = html[:oldResetFilters_start] + newResetFilters + html[oldResetFilters_end:]
    
    # saveFiltersToCache 치환
    oldSaveCache_start = html.find('function saveFiltersToCache()')
    oldSaveCache_end = html.find('}', oldSaveCache_start) + 1
    
    newSaveCache = """function saveFiltersToCache() {
            const gradeFilterEl = document.querySelector('input[name="grade-filter"]:checked');
            const gradeVal = gradeFilterEl ? gradeFilterEl.value : 'all';
            
            const filters = {
                search: document.getElementById("search-input").value,
                selectedSources: Array.from(document.querySelectorAll('input[name="source-check"]:checked')).map(cb => cb.value),
                selectedPtypes: Array.from(document.querySelectorAll('input[name="ptype-check"]:checked')).map(cb => cb.value),
                selectedSidos: Array.from(document.querySelectorAll('input[name="sido-check"]:checked')).map(cb => cb.value),
                dateLimit: document.getElementById("date-filter").value,
                budgetLimit: document.getElementById("budget-slider").value,
                hidePast: document.getElementById("hide-past-toggle").checked,
                showFavorites: document.getElementById("show-favorites-toggle").checked,
                gradeFilter: gradeVal,
                selectedCourts: Array.from(document.querySelectorAll('input[name="court-check"]:checked')).map(cb => cb.value),
                selectedSigungus: Array.from(document.querySelectorAll('input[name="sigungu-check"]:checked')).map(cb => cb.value)
            };
            localStorage.setItem('auction_filters_v2', JSON.stringify(filters));
        }"""
        
    html = html[:oldSaveCache_start] + newSaveCache + html[oldSaveCache_end:]
    
    # restoreFiltersFromCache 치환
    oldRestoreCache_start = html.find('function restoreFiltersFromCache()')
    oldRestoreCache_end = html.find('}', oldRestoreCache_start) + 1
    
    newRestoreCache = """function restoreFiltersFromCache() {
            const cached = localStorage.getItem('auction_filters_v2');
            if (!cached) return;
            try {
                const filters = JSON.parse(cached);
                document.getElementById("search-input").value = filters.search || "";
                
                if (filters.selectedSources) {
                    document.querySelectorAll('input[name="source-check"]').forEach(cb => {
                        cb.checked = filters.selectedSources.indexOf(cb.value) > -1;
                    });
                }
                if (filters.selectedPtypes) {
                    document.querySelectorAll('input[name="ptype-check"]').forEach(cb => {
                        cb.checked = filters.selectedPtypes.indexOf(cb.value) > -1;
                    });
                }
                if (filters.selectedSidos) {
                    document.querySelectorAll('input[name="sido-check"]').forEach(cb => {
                        cb.checked = filters.selectedSidos.indexOf(cb.value) > -1;
                    });
                }
                
                updateSigunguFilter(false);
                if (filters.selectedSigungus && filters.selectedSigungus.length > 0) {
                    filters.selectedSigungus.forEach(val => {
                        const cb = document.querySelector(`input[name="sigungu-check"][value="${val}"]`);
                        if (cb) cb.checked = true;
                    });
                }
                
                document.getElementById("date-filter").value = filters.dateLimit || "180";
                
                const budgetSlider = document.getElementById("budget-slider");
                budgetSlider.value = filters.budgetLimit || "2000000000";
                updateBudgetLabel(budgetSlider.value);
                
                document.getElementById("hide-past-toggle").checked = filters.hidePast !== false;
                document.getElementById("show-favorites-toggle").checked = filters.showFavorites === true;
                showFavoritesOnly = filters.showFavorites === true;
                
                if (filters.selectedCourts && filters.selectedCourts.length > 0) {
                    filters.selectedCourts.forEach(val => {
                        const cb = document.querySelector(`input[name="court-check"][value="${val}"]`);
                        if (cb) cb.checked = true;
                    });
                }
                
                const gradeVal = filters.gradeFilter || "all";
                const radio = document.querySelector(`input[name="grade-filter"][value="${gradeVal}"]`);
                if (radio) radio.checked = true;
                
            } catch (err) {
                console.warn("필터 캐시 복원 실패", err);
            }
        }"""
        
    html = html[:oldRestoreCache_start] + newRestoreCache + html[oldRestoreCache_end:]
    
    # 9-9. renderProperties 루프 내 광고 카드 동적 주입 개조
    oldRenderPropLoop = """            const pageItems = filteredProperties.slice(startIndex, endIndex);
            let htmlBuffer = [];
            
            pageItems.forEach((item, idx) => {"""
            
    newRenderPropLoop = """            const pageItems = filteredProperties.slice(startIndex, endIndex);
            let htmlBuffer = [];
            
            if (currentPage === 1) {
                renderedCount = 0;
            }
            
            pageItems.forEach((item, idx) => {
                // 매 4번째 위치에 광고 카드 동적 주입
                if (renderedCount > 0 && renderedCount % 4 === 3) {
                    const adHtml = renderAdCard(renderedCount);
                    htmlBuffer.push(adHtml);
                    renderedCount++;
                }
                renderedCount++;"""
                
    html = html.replace(oldRenderPropLoop, newRenderPropLoop)
    
    # 9-10. selectProperty() 및 closeDetailDrawer() 내 브라우저 타이틀 동기화 호출 추가
    oldSelectProp = """            // 데이터 바인딩 로드
            loadDetailView(selectedProperty);

            // 🎴 상세 창 열릴 때 첫 번째 탭(권리진단)을 기본 활성화로 지정합니다.
            changeDetailTab('analysis');

            // 🎴 서랍 열기 구동 (Slide-over Drawer Open)
            openDetailDrawer();"""
            
    newSelectProp = """            // 데이터 바인딩 로드
            loadDetailView(selectedProperty);

            // 🎴 상세 창 열릴 때 첫 번째 그룹 탭(1.종합분석) 활성화 지정
            changeDetailGroupTab(1);

            // 🎴 서랍 열기 구동 (Slide-over Drawer Open)
            openDetailDrawer();
            
            // 브라우저 타이틀 싱크
            updateDynamicBrowserTitle();"""
            
    html = html.replace(oldSelectProp, newSelectProp)
    
    # closeDetailDrawer 수정
    oldCloseDrawer = """                // 히스토리 상태 되돌리기
                if (window.history.state && window.history.state.drawerOpen) {
                    window.history.back();
                }
            }
        }"""
        
    newCloseDrawer = """                // 히스토리 상태 되돌리기
                if (window.history.state && window.history.state.drawerOpen) {
                    window.history.back();
                }
            }
            
            // 브라우저 타이틀 홈 복원
            updateDynamicBrowserTitle();
        }"""
        
    html = html.replace(oldCloseDrawer, newCloseDrawer)
    
    # 9-11. loadDetailView(item) 내 소유자, 채무자, 평수 분할, 기일 이력, 시나리오 ROI 표, AI 코멘트, 유사 매물 동적 바인딩 이식
    oldDetailDocSpec = """            // 🏠 물건 세부 스펙 분석 바인딩
            document.getElementById("detail-spec-ptype").innerText = item.ptype || "미상";
            document.getElementById("detail-spec-round").innerText = item.round_info || "신건";
            document.getElementById("detail-spec-appraisal").innerText = formatKRW(item.appraised_value);
            document.getElementById("detail-spec-minimum").innerText = formatKRW(item.minimum_bid);
            document.getElementById("detail-spec-date").innerText = `${item.bidding_date || "미상"} (${calculateRemainingDays(item.bidding_date) >= 0 ? 'D-' + calculateRemainingDays(item.bidding_date) : '종결'})`;"""
            
    newDetailDocSpec = """            // 🏠 물건 세부 스펙 분석 바인딩
            document.getElementById("detail-spec-ptype").innerText = item.ptype || "미상";
            document.getElementById("detail-spec-round").innerText = item.round_info || "신건";
            document.getElementById("detail-spec-appraisal").innerText = formatKRW(item.appraised_value);
            document.getElementById("detail-spec-minimum").innerText = formatKRW(item.minimum_bid);
            document.getElementById("detail-spec-date").innerText = `${item.bidding_date || "미상"} (${calculateRemainingDays(item.bidding_date) >= 0 ? 'D-' + calculateRemainingDays(item.bidding_date) : '종결'})`;

            // 👤 가상 소유주 및 채무자 매핑
            const virtualOwner = item.owner || "홍길동";
            const virtualDebtor = item.debtor || "김채무";
            document.getElementById("detail-owner").innerText = virtualOwner;
            document.getElementById("detail-debtor").innerText = virtualDebtor;

            // 📐 평수 분할 및 추정 공급 면적 계산
            const exclusiveArea = item.exclusive_area || 0;
            const landArea = item.land_area || (exclusiveArea * 0.4);
            const buildingArea = item.building_area || exclusiveArea;
            
            const exclusivePy = (exclusiveArea * 0.3025).toFixed(1);
            const supplyPy = (exclusiveArea * 1.3 * 0.3025).toFixed(1);
            const landPy = (landArea * 0.3025).toFixed(1);
            const buildingPy = (buildingArea * 0.3025).toFixed(1);

            document.getElementById("detail-spec-exclusive-py").innerText = `${exclusiveArea} ㎡ (${exclusivePy} 평)`;
            document.getElementById("detail-spec-supply-py").innerText = `${(exclusiveArea * 1.3).toFixed(1)} ㎡ (${supplyPy} 평)`;
            document.getElementById("detail-spec-land-py").innerText = `${landArea.toFixed(1)} ㎡ (${landPy} 평)`;
            document.getElementById("detail-spec-building-py").innerText = `${buildingArea.toFixed(1)} ㎡ (${buildingPy} 평)`;

            // 📅 기일 진행 이력 표 렌더링
            const giilTbody = document.getElementById("detail-giiil-tbody");
            if (giilTbody) {
                let html = "";
                const maxRounds = est.failedCount;
                for (let i = 0; i <= maxRounds; i++) {
                    let roundPrice = item.appraised_value;
                    if (item.source === "court") {
                        roundPrice = Math.floor(item.appraised_value * Math.pow(0.8, i));
                    } else {
                        roundPrice = Math.floor(item.appraised_value * Math.pow(0.9, i));
                    }
                    const isLast = (i === maxRounds);
                    const status = isLast ? "진행" : "유찰";
                    
                    const dateOffset = (maxRounds - i) * 30;
                    const baseDate = new Date(item.bidding_date || new Date());
                    baseDate.setDate(baseDate.getDate() - dateOffset);
                    const dateStr = baseDate.toISOString().split("T")[0];

                    html += `
                        <tr class="border-b border-slate-100 text-xs hover:bg-slate-50/50">
                            <td class="p-2 text-slate-500 font-extrabold">${i + 1}차 기일</td>
                            <td class="p-2 text-slate-700 font-mono">${dateStr}</td>
                            <td class="p-2 text-right font-mono text-slate-600">${formatKRW(roundPrice)}</td>
                            <td class="p-2 text-center font-extrabold ${isLast ? "text-rose-600 animate-pulse" : "text-slate-400"}">${status}</td>
                        </tr>
                    `;
                }
                giilTbody.innerHTML = html;
            }

            // 🏆 시나리오별 입찰 수익성 시뮬레이터 연산
            const scenarioTbody = document.getElementById("detail-scenario-tbody");
            if (scenarioTbody) {
                const basePrice = item.minimum_bid;
                const scenarios = [
                    { name: "단독 입찰 (최저가 100%)", rate: 1.0 },
                    { name: "보수 입찰 (적정 105%)", rate: 1.05 },
                    { name: "공격 입찰 (공격 115%)", rate: 1.15 }
                ];
                
                let scenarioHtml = "";
                scenarios.forEach(sc => {
                    const bidPrice = Math.floor(basePrice * sc.rate);
                    const loan = Math.floor(bidPrice * 0.7);
                    const agencyFee = Math.floor(bidPrice * 0.03);
                    const cashNeeded = bidPrice - loan + agencyFee;
                    const annualInterest = Math.floor(loan * 0.045);
                    
                    const marketCompareDiff = item.appraised_value - bidPrice - annualInterest;
                    const roi = cashNeeded > 0 ? ((marketCompareDiff / cashNeeded) * 100).toFixed(1) : "0.0";
                    
                    scenarioHtml += `
                        <tr class="border-b border-slate-100 hover:bg-slate-50/50 text-[10px] sm:text-xs">
                            <td class="p-2 text-slate-700 font-bold">${sc.name}</td>
                            <td class="p-2 text-right font-mono text-slate-800">${formatKRW(bidPrice)}</td>
                            <td class="p-2 text-right font-mono text-slate-500">${formatKRW(loan)}</td>
                            <td class="p-2 text-right font-mono text-royalBlue font-bold">${formatKRW(cashNeeded)}</td>
                            <td class="p-2 text-right font-mono text-rose-500">${formatKRW(annualInterest)}</td>
                            <td class="p-2 text-right font-mono text-rose-600 font-black">${roi}%</td>
                        </tr>
                    `;
                });
                scenarioTbody.innerHTML = scenarioHtml;
            }

            // 🧠 계산 결과 싱크 정밀 AI의 실전 투자 분석 총평 줄글 코멘트 동적 생성
            const commentEl = document.getElementById("detail-ai-comment");
            if (commentEl) {
                const singlePrice = item.minimum_bid;
                const loan70 = Math.floor(singlePrice * 0.7);
                const cash70 = Math.floor(singlePrice * 0.3 + singlePrice * 0.03);
                const interest45 = Math.floor(loan70 * 0.045);
                const roiRate = cash70 > 0 ? (((item.appraised_value - singlePrice - interest45) / cash70) * 100).toFixed(1) : "0.0";
                
                let opinion = `본 매물은 감정가 ${formatKRW(item.appraised_value)} 대비 ${est.discount}% 저감된 최저 매각가 ${formatKRW(item.minimum_bid)}에 매각 진행 중인 물건입니다. `;
                opinion += `단독 입찰 낙찰 시, 대출 LTV 70%(${formatKRW(loan70)})를 가정한 최소 필요 자기자본금은 약 ${formatKRW(cash70)} 수준으로 예상됩니다. 연 4.5% 금리 적용 시 연간 이자 비용 부담은 약 ${formatKRW(interest45)}으로 월 평균 이자 비용은 약 ${formatKRW(Math.floor(interest45/12))}가 발생합니다. `;
                opinion += `감정평가액 기반 시세 차익과 금융 비용을 대조하여 세후 예측 ROI를 도출한 결과 약 ${roiRate}%의 유의미한 수익률을 기록할 것으로 전망됩니다. `;
                
                if (item.grade === "A" || item.grade === "B") {
                    opinion += `권리분석 상 소멸되지 않는 악성 채무나 점유 리스크 등 법적 위해 요소가 감지되지 않아 투자의 안전성이 우수한 우량 등급의 자산입니다. 시뮬레이션 표의 시나리오를 참고하여 보수적(105%) 및 공격적(115%) 입찰가 조정을 거쳐 적극 응찰할 것을 강력히 권고합니다.`;
                } else {
                    opinion += `다만 권리 등급 분류 상 위험(X등급) 판정을 받은 자산으로, 유치권 내지 대항력 있는 임차보증금 등의 추가 인수 부담 위험이 매우 큽니다. 시뮬레이션 수치 상의 수익률에 현혹되지 마시고, 보수적인 추가 유찰 시점까지 입찰을 미루시거나 전문 법률 분석을 선행하시기를 권장합니다.`;
                }
                commentEl.innerHTML = `<p class="leading-relaxed font-bold text-slate-700">${opinion}</p>`;
            }

            // 하단 주변 유사 매물 추천 렌더링 호출
            renderSimilarProperties(item);"""
            
    html = html.replace(oldDetailDocSpec, newDetailDocSpec)
    
    # 9-12. renderSimilarProperties 함수 정의 추가
    # detail view 렌더링 끝 부근인 takeoverTbody.innerHTML = takeoverHtml; \n } \n } 위치에 치환
    targetDetailEnd = """            takeoverTbody.innerHTML = takeoverHtml;
            }
        }"""
        
    replaceDetailEnd = """            takeoverTbody.innerHTML = takeoverHtml;
            }
        }

        // 🤝 동일 지역/용도 주변 유사 매물 3개 추천 카드 렌더러 함수
        function renderSimilarProperties(item) {
            const container = document.getElementById("detail-similar-container");
            if (!container) return;
            
            const currentSido = (item.address || "").substring(0, 2);
            
            let similars = originalProperties.filter(p => p.id !== item.id);
            
            similars.forEach(p => {
                let score = 0;
                if ((p.address || "").substring(0, 2) === currentSido) score += 5;
                if (p.ptype === item.ptype) score += 10;
                p._similarScore = score;
            });
            
            similars.sort((a, b) => b._similarScore - a._similarScore);
            const topSimilars = similars.slice(0, 3);
            
            if (topSimilars.length === 0) {
                container.innerHTML = `<div class="col-span-3 text-center py-4 text-[10px] text-slate-400">추천할 유사 매물이 없습니다.</div>`;
                return;
            }
            
            let html = "";
            topSimilars.forEach(p => {
                let gradeClass = "bg-slate-400 text-white";
                if (p.grade === "A") gradeClass = "bg-[#10b981] text-white";
                else if (p.grade === "B") gradeClass = "bg-royalBlue text-white";
                else if (p.grade === "X") gradeClass = "bg-rose-500 text-white animate-pulse";
                
                html += `
                    <div onclick="selectProperty(${p.id})" class="bg-white border border-slate-200 hover:border-royalBlue hover:shadow-md rounded-xl p-2 cursor-pointer transition-all duration-300 flex flex-col justify-between h-[110px] select-none">
                        <div class="space-y-0.5">
                            <div class="flex justify-between items-center">
                                <span class="text-[8.5px] font-mono text-slate-400 truncate max-w-[65px]">${p.auction_no}</span>
                                <span class="${gradeClass} text-[8px] font-black px-1 rounded">${p.grade}등급</span>
                            </div>
                            <h5 class="text-[10px] font-extrabold text-slate-800 line-clamp-2 leading-tight" title="${p.address}">
                                ${p.address}
                            </h5>
                        </div>
                        <div class="border-t border-slate-100 pt-1 mt-1 flex flex-col">
                            <span class="text-[8px] text-slate-400">최저매각가</span>
                            <span class="text-[9.5px] font-black text-rose-600 font-mono">${formatKRW(p.minimum_bid)}</span>
                        </div>
                    </div>
                `;
            });
            container.innerHTML = html;
        }"""
        
    html = html.replace(targetDetailEnd, replaceDetailEnd)
    
    # --- 10. 결과 쓰기 ---
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(html)
    print("Successfully transformed index.html comprehensively!")

if __name__ == "__main__":
    main()
