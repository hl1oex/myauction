# -*- coding: utf-8 -*-
# 이 스크립트는 PC 웹 대시보드 index.html의 4대 탭을 3대 탭으로 병합하고 로드뷰 카드를 이식하며 미니 지도를 렌더링하는 후처리 도구입니다.

import os

file_path = r"d:\BackUp\OneDrive\AI공부\Real estate auction\index.html"

if not os.path.exists(file_path):
    print("[-] index.html 파일을 찾을 수 없습니다.")
    exit(1)

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. 탭 버튼바 3대 탭으로 치환 (Line 1097 ~ 1100 영역)
tabs_old = """            <button id="detail-group-tab-1-btn" onclick="changeDetailGroupTab(1)" class="inline-block py-1.5 px-3.5 text-center text-[10.5px] sm:text-xs font-black rounded-xl border border-transparent transition-all select-none bg-royalBlue text-white shadow-sm">1. 종합 분석</button>
            <button id="detail-group-tab-2-btn" onclick="changeDetailGroupTab(2)" class="inline-block py-1.5 px-3.5 text-center text-[10.5px] sm:text-xs font-black rounded-xl border border-transparent transition-all select-none text-slate-500 hover:text-royalBlue hover:bg-slate-50 bg-slate-50/50">2. 권리 & 안전 분석</button>
            <button id="detail-group-tab-3-btn" onclick="changeDetailGroupTab(3)" class="inline-block py-1.5 px-3.5 text-center text-[10.5px] sm:text-xs font-black rounded-xl border border-transparent transition-all select-none text-slate-500 hover:text-royalBlue hover:bg-slate-50 bg-slate-50/50">3. 입지 & 시세 분석</button>
            <button id="detail-group-tab-4-btn" onclick="changeDetailGroupTab(4)" class="inline-block py-1.5 px-3.5 text-center text-[10.5px] sm:text-xs font-black rounded-xl border border-transparent transition-all select-none text-slate-500 hover:text-royalBlue hover:bg-slate-50 bg-slate-50/50">4. 입찰 & 금융 시뮬레이션</button>"""

tabs_new = """            <button id="detail-group-tab-1-btn" onclick="changeDetailGroupTab(1)" class="inline-block py-1.5 px-3.5 text-center text-[10.5px] sm:text-xs font-black rounded-xl border border-transparent transition-all select-none bg-royalBlue text-white shadow-sm">1. 종합 & 권리분석</button>
            <button id="detail-group-tab-2-btn" onclick="changeDetailGroupTab(2)" class="inline-block py-1.5 px-3.5 text-center text-[10.5px] sm:text-xs font-black rounded-xl border border-transparent transition-all select-none text-slate-500 hover:text-royalBlue hover:bg-slate-50 bg-slate-50/50">2. 입찰 & 금융분석</button>
            <button id="detail-group-tab-3-btn" onclick="changeDetailGroupTab(3)" class="inline-block py-1.5 px-3.5 text-center text-[10.5px] sm:text-xs font-black rounded-xl border border-transparent transition-all select-none text-slate-500 hover:text-royalBlue hover:bg-slate-50 bg-slate-50/50">3. 입지 & 시세분석</button>"""

content = content.replace(tabs_old, tabs_new)

# 2. detail-panel-floorplan (로드뷰 분석 카드) 1번 패널에서 지우기
# Line 1232 ~ 1287 덩어리를 추출하고 index.html에서 삭제합니다.
fp_start_marker = '                    <div id="detail-panel-floorplan"'
fp_end_marker = '                    </div>\n                </div>'  # 1288 닫는 div 앞까지

fp_start_idx = content.find(fp_start_marker)
fp_end_idx = content.find(fp_end_marker, fp_start_idx)

floorplan_card_code = ""
if fp_start_idx != -1 and fp_end_idx != -1:
    floorplan_card_code = content[fp_start_idx:fp_end_idx + 21]
    # 1번 패널에서 해당 블록 삭제
    content = content[:fp_start_idx] + content[fp_end_idx + 21:]
    print("[+] index.html 1번 패널에서 로드뷰 분석 카드 추출 및 삭제 성공.")
else:
    print("[-] index.html 1번 패널에서 로드뷰 분석 카드를 찾지 못했습니다.")

# 3. detail-group-panel-2 (권리분석)의 순수 컨텐츠 추출하고 기존 패널 2 삭제
panel2_start_marker = '        <div id="detail-group-panel-2"'
panel2_end_marker = '        <div id="detail-group-panel-3"'

p2_start_idx = content.find(panel2_start_marker)
p2_end_idx = content.find(panel2_end_marker)

panel2_contents = ""
if p2_start_idx != -1 and p2_end_idx != -1:
    panel2_block = content[p2_start_idx:p2_end_idx]
    # panel2_block 에서 래퍼 뷰와 락 마스크(group-mask-2)를 떼어내고, 
    # group-content-2 영역만 안전하게 가져옵니다.
    c2_start = panel2_block.find('            <div id="group-content-2"')
    c2_end = panel2_block.find('            <!-- 📈 [8] 매각통계 탭 패널 (기본 숨김) -->')
    if c2_start != -1 and c2_end != -1:
        # group-content-2의 내부 컨텐츠만 슬라이싱 (ID 중복을 피하기 위해 래퍼 div와 닫는 div는 떼어냅니다)
        panel2_contents = panel2_block[c2_start + 60:c2_end].strip()
        # 끝에 있는 </div> 1개 닫기를 확인하고 밸런싱을 맞춥니다.
        if panel2_contents.endswith("</div>"):
            panel2_contents = panel2_contents[:-6].strip()
        print("[+] index.html 2번 패널의 권리분석 컨텐츠 추출 성공.")
    
    # 2번 패널은 마크업에서 완전히 제거합니다.
    content = content[:p2_start_idx] + content[p2_end_idx:]
    print("[+] index.html 2번 패널 마크업 완전 소거 성공.")

# 4. 2번 패널의 내용을 1번 패널(detail-group-panel-1)의 닫는 부분 직전에 끼워 넣기
# 1번 패널의 끝은 1484 라인의 </div> 이며, 그 직후에 삭제된 panel-2가 있었습니다.
# 즉, 2번 패널을 소거하기 전 p2_start_idx 직전 위치가 1번 패널의 끝입니다.
# 현재 p2_start_idx는 2번 패널을 들어낸 후의 panel-3 시작 인덱스(원래 p2_end_idx 위치)가 되어 있으므로,
# 1번 패널 닫히는 </div> 직전에 이식하기 위해 index.html에서 panel-3 시작 전의 "        </div>\n        <div id=\"detail-group-panel-3\"" 를 타겟팅하여
# 1번 패널의 닫기 </div> 바로 위에 주입합니다.
p3_marker = '        <div id="detail-group-panel-3"'
p3_idx = content.find(p3_marker)
if p3_idx != -1:
    # 1번 패널이 닫히는 위치를 p3_idx 위쪽에서 역방향으로 </div> 검색
    p1_end_idx = content.rfind('        </div>', 0, p3_idx)
    if p1_end_idx != -1:
        insert_code = "\n            <!-- --- 1번 패널로 이관된 권리분석 카드 묶음 --- -->\n            " + panel2_contents + "\n"
        content = content[:p1_end_idx] + insert_code + content[p1_end_idx:]
        print("[+] index.html 1번 패널 하단에 권리분석 카드 묶음 이식 성공.")

# 5. 기존 4번 패널(입찰 & 금융)의 ID를 2번으로 변경
# detail-group-panel-4 -> detail-group-panel-2
# group-content-4 -> group-content-2
# group-mask-4 -> group-mask-2
content = content.replace('id="detail-group-panel-4"', 'id="detail-group-panel-2"')
content = content.replace('id="group-content-4"', 'id="group-content-2"')
content = content.replace('id="group-mask-4"', 'id="group-mask-2"')
print("[+] index.html 4번 금융 패널 ID를 2번으로 교체 완료.")

# 6. 기존 3번 패널(입지분석) 하단에 로드뷰 분석 카드 이식 및 구글 미니 지도 영역 추가
# detail-group-panel-3 의 닫는 </div> 직전에 이식해야 합니다.
# 3번 패널의 끝은 2번 패널로 바뀐 detail-group-panel-2 시작 전입니다.
# 즉, '        <div id="detail-group-panel-2"' (원래 4번 패널) 시작 전의 </div> 입니다.
p2_new_marker = '        <div id="detail-group-panel-2"'
p2_new_idx = content.find(p2_new_marker)
if p2_new_idx != -1:
    p3_end_idx = content.rfind('        </div>', 0, p2_new_idx)
    if p3_end_idx != -1:
        # 이관된 로드뷰 카드 상단에 구글 미니 지도 iframe 영역 추가
        minimap_markup = """
            <!-- 🧭 핀포인트 미니 지도 영역 (구글 지도 임베드) -->
            <div id="detail-roadview-minimap-container" class="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm w-full space-y-2 mb-4 hidden">
                <h4 class="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5 mb-2.5">
                    <i class="fa-solid fa-map-location-dot text-royalBlue"></i> 🧭 핀포인트 미니 지도
                </h4>
                <div id="detail-roadview-minimap" class="w-full h-[160px] rounded-xl overflow-hidden border border-slate-200 bg-slate-50 relative group">
                    <!-- 구글 지도 iframe이 주입됨 -->
                </div>
            </div>
"""
        insert_code = minimap_markup + "\n            " + floorplan_card_code + "\n"
        content = content[:p3_end_idx] + insert_code + content[p3_end_idx:]
        print("[+] index.html 3번 입지 패널 하단에 로드뷰 분석 카드 및 구글 미니 지도 영역 이식 성공.")

# 7. changeDetailGroupTab(tabNum) 자바스크립트 스위칭 한도 및 등급별 가드 로직을 3대 탭 기준으로 개편
# 루프 한도 i <= 4를 i <= 3으로 축소하고, mask4 및 content4 락 마스크 레거시 제거
js_loop_old = "for (let i = 1; i <= 4; i++) {"
js_loop_new = "for (let i = 1; i <= 3; i++) {"
content = content.replace(js_loop_old, js_loop_new)

js_mask_old = """            const mask2 = document.getElementById("group-mask-2");
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

            // 전체 코딩/개발 기간 임시 우회 처리: 등급에 관계없이 100% 정보 노출 (등급 오버레이 락 해제)
            if (false && userGrade === "B") {
                if (mask3) mask3.classList.remove("hidden");
                if (mask4) mask4.classList.remove("hidden");
                if (content3) content3.style.filter = "blur(8px)";
                if (content4) content4.style.filter = "blur(8px)";
            } else if (false && userGrade === "C") {
                if (mask2) mask2.classList.remove("hidden");
                if (mask3) mask3.classList.remove("hidden");
                if (mask4) mask4.classList.remove("hidden");
                if (content2) content2.style.filter = "blur(8px)";
                if (content3) content3.style.filter = "blur(8px)";
                if (content4) content4.style.filter = "blur(8px)";
            }"""

js_mask_new = """            const mask2 = document.getElementById("group-mask-2");
            const mask3 = document.getElementById("group-mask-3");
            const content2 = document.getElementById("group-content-2");
            const content3 = document.getElementById("group-content-3");

            if (mask2) mask2.classList.add("hidden");
            if (mask3) mask3.classList.add("hidden");
            if (content2) content2.style.filter = "none";
            if (content3) content3.style.filter = "none";

            // 전체 코딩/개발 기간 임시 우회 처리: 등급에 관계없이 100% 정보 노출 (등급 오버레이 락 해제)
            if (false && userGrade === "B") {
                if (mask3) mask3.classList.remove("hidden");
                if (content3) content3.style.filter = "blur(8px)";
            } else if (false && userGrade === "C") {
                if (mask2) mask2.classList.remove("hidden");
                if (mask3) mask3.classList.remove("hidden");
                if (content2) content2.style.filter = "blur(8px)";
                if (content3) content3.style.filter = "blur(8px)";
            }"""

content = content.replace(js_mask_old, js_mask_new)

# 8. DOMContentLoaded 및 데이터 갱신 시 originalPanel4Html 등의 참조 개편
# originalPanel4Html 백업 부분:
# const p2 = document.getElementById("detail-group-panel-2");
# const p3 = document.getElementById("detail-group-panel-3");
# const p4 = document.getElementById("detail-group-panel-4");
# if (p2) originalPanel2Html = p2.innerHTML;
# if (p3) originalPanel3Html = p3.innerHTML;
# if (p4) originalPanel4Html = p4.innerHTML;

js_backup_old = """            const p2 = document.getElementById("detail-group-panel-2");
            const p3 = document.getElementById("detail-group-panel-3");
            const p4 = document.getElementById("detail-group-panel-4");
            if (p2) originalPanel2Html = p2.innerHTML;
            if (p3) originalPanel3Html = p3.innerHTML;
            if (p4) originalPanel4Html = p4.innerHTML;"""

js_backup_new = """            const p2 = document.getElementById("detail-group-panel-2");
            const p3 = document.getElementById("detail-group-panel-3");
            if (p2) originalPanel2Html = p2.innerHTML;
            if (p3) originalPanel3Html = p3.innerHTML;"""

content = content.replace(js_backup_old, js_backup_new)

# updateDynamicBrowserTitle() 내의 tabNames 목록 수정:
# const tabNames = {
#     1: "종합분석",
#     2: "권리분석",
#     3: "수익분석",
#     4: "위치분석"
# };
js_title_old = """                const tabNames = {
                    1: "종합분석",
                    2: "권리분석",
                    3: "수익분석",
                    4: "위치분석"
                };"""

js_title_new = """                const tabNames = {
                    1: "종합&권리분석",
                    2: "입찰&금융분석",
                    3: "입지&시세분석"
                };"""

content = content.replace(js_title_old, js_title_new)

# 9. loadDetailView 내에서 구글 미니 지도 iframe 동적 렌더링 로직 탑재
# cleanedNavAddress가 판별되는 시점인 loadDetailView 함수 내부에 동적 주입 로직을 얹습니다.
# "const cleanedNavAddress = cleanAddress(item.address);" 아래 즈음에 미니 지도 주입 추가.
js_minimap_inject_marker = "            // 카카오 로드뷰 SDK 가동 연동"
js_minimap_inject_code = """            // 🧭 핀포인트 미니 지도 (구글 지도 iframe) 동적 주입
            const minimapContainer = document.getElementById("detail-roadview-minimap-container");
            const minimap = document.getElementById("detail-roadview-minimap");
            if (minimapContainer && minimap && cleanedNavAddress) {
                minimapContainer.classList.remove("hidden");
                minimap.innerHTML = `<iframe width="100%" height="100%" frameborder="0" style="border:0; border-radius:12px;" src="https://maps.google.com/maps?q=${encodeURIComponent(cleanedNavAddress)}&t=&z=17&ie=UTF8&iwloc=&output=embed" allowfullscreen></iframe>`;
            } else if (minimapContainer) {
                minimapContainer.classList.add("hidden");
            }

            // 카카오 로드뷰 SDK 가동 연동"""

content = content.replace(js_minimap_inject_marker, js_minimap_inject_code)

# 10. loadDetailView 함수 내의 기존 panel-4에 대한 HTML 복원(originalPanel4Html) 제거
# if (originalPanel4Html) p4.innerHTML = originalPanel4Html;
js_restore_old = """            const p2 = document.getElementById("detail-group-panel-2");
            const p3 = document.getElementById("detail-group-panel-3");
            const p4 = document.getElementById("detail-group-panel-4");
            if (p2 && originalPanel2Html) p2.innerHTML = originalPanel2Html;
            if (p3 && originalPanel3Html) p3.innerHTML = originalPanel3Html;
            if (p4 && originalPanel4Html) p4.innerHTML = originalPanel4Html;"""

js_restore_new = """            const p2 = document.getElementById("detail-group-panel-2");
            const p3 = document.getElementById("detail-group-panel-3");
            if (p2 && originalPanel2Html) p2.innerHTML = originalPanel2Html;
            if (p3 && originalPanel3Html) p3.innerHTML = originalPanel3Html;"""

content = content.replace(js_restore_old, js_restore_new)

# 11. 3번 탭(입지)에서 화이트아웃 방지할 때 statistics 및 market 패널 갱신
# panel-statistics 및 panel-market은 panel-2(금융) 및 panel-1(종합)에 있으므로 hidden 해제는 map만 해주면 됩니다.
js_whiteout_old = """            if (!isNonBuilding && tabNum === 3) {
                const mapPanel = document.getElementById("detail-panel-map");
                const marketPanel = document.getElementById("detail-panel-market");
                const statsPanel = document.getElementById("detail-panel-statistics");
                if (mapPanel) mapPanel.classList.remove("hidden");
                if (marketPanel) marketPanel.classList.remove("hidden");
                if (statsPanel) statsPanel.classList.remove("hidden");
            }"""

js_whiteout_new = """            if (!isNonBuilding && tabNum === 3) {
                const mapPanel = document.getElementById("detail-panel-map");
                if (mapPanel) mapPanel.classList.remove("hidden");
            }"""

content = content.replace(js_whiteout_old, js_whiteout_new)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("[+] index.html 패치 완료.")
