# -*- coding: utf-8 -*-
# index.html의 3대 탭을 반응형 2열 그리드로 정교하게 개편하고 광고 연동 문제를 복구하는 패치 스크립트입니다.
import re

def main():
    filepath = "index.html"
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
    except Exception as e:
        print(f"Failed to read index.html: {e}")
        return

    # 1. 탭 1 (종합 & 권리분석) 반응형 2열 개편
    # 기일 이력 카드, 외부 연동 허브, 유사 추천 매물을 왼쪽 1열로 묶고, 법정 주요 서류를 오른쪽 2열로 묶습니다.
    # replace 함수의 count 인자를 1로 제한하여 단 한 번만 정확히 치환되도록 방어합니다.
    
    old_tab1_markup = """                <!-- 3. 경매 기일 이력과 외부 정보 연동/유사 매물 반응형 분기 레이아웃 -->
                <div class="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-5 items-start">
                    <!-- 경매 진행 기일 이력 -->
                    <div class="bg-white border border-slate-200 rounded-2xl p-4 space-y-2 shadow-sm w-full">
                        <h4 class="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5 mb-2.5">
                            <i class="fa-solid fa-calendar-days text-royalBlue"></i> 📅 경매 진행 기일 이력
                        </h4>"""

    new_tab1_markup = """                <!-- 3. 대화면 xl 해상도 대응 2열 반응형 그리드 레이아웃 (빈 공간 소거 및 테이블 가로 늘어짐 방지) -->
                <div class="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-5 w-full items-start">
                    <!-- 왼쪽 열: 기일 이력 및 외부 연동 허브와 유사 추천 매물 -->
                    <div class="space-y-4 sm:space-y-5 w-full">
                        <!-- 경매 진행 기일 이력 -->
                        <div class="bg-white border border-slate-200 rounded-2xl shadow-sm w-full overflow-hidden">
                            <div class="bg-slate-50 px-4 py-2.5 border-b border-slate-200">
                                <h4 class="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5">
                                    <i class="fa-solid fa-calendar-days text-royalBlue"></i> 📅 경매 진행 기일 이력
                                </h4>
                            </div>
                            <div class="p-3.5 space-y-3">"""

    content = content.replace(old_tab1_markup, new_tab1_markup, 1)

    # 탭 1의 외부 정보망 연동 카드 헤더 스타일 개편
    old_tab1_hub = """                        <!-- 원스톱 외부 공식 정보망 연동 -->
                        <div class="bg-white border border-slate-200 rounded-2xl p-4 space-y-2.5 shadow-sm">
                            <h4 class="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5">
                                <i class="fa-solid fa-globe text-royalBlue"></i> 🌐 원스톱 외부 공식 정보망 연동
                            </h4>"""

    new_tab1_hub = """                        <!-- 원스톱 외부 공식 정보망 연동 -->
                        <div class="bg-white border border-slate-200 rounded-2xl shadow-sm w-full overflow-hidden">
                            <div class="bg-slate-50 px-4 py-2.5 border-b border-slate-200">
                                <h4 class="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5">
                                    <i class="fa-solid fa-globe text-royalBlue"></i> 🌐 원스톱 외부 공식 정보망 연동
                                </h4>
                            </div>
                            <div class="p-3.5 space-y-2.5">"""

    content = content.replace(old_tab1_hub, new_tab1_hub, 1)

    # 탭 1의 유사 추천 매물 헤더 스타일 개편
    old_tab1_similar = """                        <!-- 동일 용도/지역 기반 유사 추천 매물 -->
                        <div class="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-sm">
                            <h4 class="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-100">
                                <i class="fa-solid fa-handshake text-royalBlue"></i> 🤝 동일 용도/지역 기반 유사 추천 매물
                            </h4>"""

    new_tab1_similar = """                        <!-- 동일 용도/지역 기반 유사 추천 매물 -->
                        <div class="bg-white border border-slate-200 rounded-2xl shadow-sm w-full overflow-hidden">
                            <div class="bg-slate-50 px-4 py-2.5 border-b border-slate-200">
                                <h4 class="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5">
                                    <i class="fa-solid fa-handshake text-royalBlue"></i> 🤝 동일 용도/지역 기반 유사 추천 매물
                                </h4>
                            </div>
                            <div class="p-3.5 space-y-3">"""

    content = content.replace(old_tab1_similar, new_tab1_similar, 1)

    # 탭 1의 추천 매물 닫는 div 및 법정 서류 카드 시작점 개편
    old_tab1_split = """                    </div>
                </div>

                <!-- 4. 가로가 긴 법정 주요 서류 테이블 (단독 1열 배치) -->
                <div class="bg-white border border-slate-200 rounded-2xl p-4 space-y-2.5 shadow-sm w-full">
                    <h4 class="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5">
                        <i class="fa-solid fa-scale-balanced text-royalBlue"></i> ⚖️ 법정 주요 서류 및 사건 기록
                    </h4>
                    <p class="text-[9.5px] text-slate-500 leading-relaxed font-semibold">대법원 경매 및 감정 법원에서 공식 발행된 법정 주요 서류의 정밀 분석 명세 테이블입니다.</p>"""

    new_tab1_split = """                    </div>
                </div> <!-- 👈 왼쪽 열 space-y-4 닫기 -->

                <!-- 오른쪽 열: 법정 주요 서류 및 사건 기록 (대화면에서 가로폭이 늘어나는 문제 해결) -->
                <div class="bg-white border border-slate-200 rounded-2xl shadow-sm w-full overflow-hidden">
                    <div class="bg-slate-50 px-4 py-2.5 border-b border-slate-200">
                        <h4 class="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5">
                            <i class="fa-solid fa-scale-balanced text-royalBlue"></i> ⚖️ 법정 주요 서류 및 사건 기록
                        </h4>
                    </div>
                    <div class="p-3.5 space-y-2.5">
                        <p class="text-[9.5px] text-slate-500 leading-relaxed font-semibold">대법원 경매 및 감정 법원에서 공식 발행된 법정 주요 서류의 정밀 분석 명세 테이블입니다.</p>"""

    content = content.replace(old_tab1_split, new_tab1_split, 1)

    # 탭 1 전체 닫는 부분 개편 (그리드 전체 닫는 태그 주입)
    old_tab1_close = """                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
        <div id="detail-group-panel-2" """

    new_tab1_close = """                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div> <!-- 👈 p-3.5 닫기 및 카드 닫기 -->
                </div> <!-- 👈 2열 그리드 전체 닫기 -->
            </div> <!-- 👈 group-content-1 닫기 -->
        </div>
        <div id="detail-group-panel-2" """

    content = content.replace(old_tab1_close, new_tab1_close, 1)


    # 2. 탭 2 (입찰 & 금융분석) 반응형 2열 그리드 개편
    # 인수 리스크 카드와 예상 배당표 카드를 2열 그리드로 묶습니다.
    
    old_tab2_split = """                <!-- 낙찰자 인수 리스크 분석 (단독 1열 배치) -->
                <div id="detail-panel-takeover" class="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3 w-full">"""

    new_tab2_split = """                <!-- 낙찰자 인수 리스크 분석 및 예상 배당표 반응형 2열 레이아웃 -->
                <div class="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-5 w-full items-start">
                    <!-- 낙찰자 인수 리스크 분석 (단독 1열 배치 해제) -->
                    <div id="detail-panel-takeover" class="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3 w-full">"""

    content = content.replace(old_tab2_split, new_tab2_split, 1)

    # 탭 2의 배당표 카드 닫기 및 그리드 전체 닫는 태그 주입
    old_tab2_close = """                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
            <!-- 📈 [8] 매각통계 탭 패널 (기본 숨김) -->"""

    new_tab2_close = """                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                </div> <!-- 👈 2열 그리드 전체 닫기 -->
            </div>
            <!-- 📈 [8] 매각통계 탭 패널 (기본 숨김) -->"""

    content = content.replace(old_tab2_close, new_tab2_close, 1)


    # 3. 탭 3 (입지 & 시세분석) 반응형 2열 그리드 개편 및 AI 미래 예상 시세 예측 시뮬레이터 탑재
    
    old_tab3_markup = """                <!-- 위치 & 시세 분석 1열 스택 레이아웃 -->
                <div class="space-y-4 sm:space-y-5">
                    <div id="detail-panel-map" class="space-y-4 sm:space-y-5">"""

    new_tab3_markup = """                <!-- 위치 & 시세 분석 대화면 xl 대응 2열 반응형 그리드 레이아웃 -->
                <div class="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-5 w-full items-start">
                    <!-- 왼쪽 열: 지도, 연동 허브, 토지규제 진단 -->
                    <div class="space-y-4 sm:space-y-5 w-full">
                        <div id="detail-panel-map" class="space-y-4 sm:space-y-5">"""

    content = content.replace(old_tab3_markup, new_tab3_markup, 1)

    # 탭 3의 지도 컨테이너 닫기 보정
    old_tab3_map_close = """                <div id="detail-map-container" class="w-full h-[220px] rounded-xl overflow-hidden border border-slate-200/60 bg-slate-50 relative group">
                    <!-- Javascript에서 iframe 동적 주입 -->
                </div>
            </div>"""

    new_tab3_map_close = """                <div id="detail-map-container" class="w-full h-[220px] rounded-xl overflow-hidden border border-slate-200/60 bg-slate-50 relative group">
                    <!-- Javascript에서 iframe 동적 주입 -->
                </div>
            </div> <!-- 👈 지도 카드 닫기 -->"""

    content = content.replace(old_tab3_map_close, new_tab3_map_close, 1)

    # 탭 3의 토지이용계획 닫기 및 오른쪽 2열 스택 열기
    old_tab3_split = """                <a id="btn-official-eum" href="#" onclick="event.preventDefault(); copyAddressAndOpenEum();" class="w-full bg-emeraldSuccess text-white py-2 rounded-xl text-xs font-black hover:bg-emerald-700 transition-all flex items-center justify-center gap-1 select-none cursor-pointer text-center">
                    국토부 토지이음(eum.go.kr) 공식 조회하기
                </a>
                        </div>
                    </div>

                    <div id="detail-panel-market" class="space-y-4 sm:space-y-5">"""

    new_tab3_split = """                <a id="btn-official-eum" href="#" onclick="event.preventDefault(); copyAddressAndOpenEum();" class="w-full bg-emeraldSuccess text-white py-2 rounded-xl text-xs font-black hover:bg-emerald-700 transition-all flex items-center justify-center gap-1 select-none cursor-pointer text-center">
                    국토부 토지이음(eum.go.kr) 공식 조회하기
                </a>
                        </div>
                    </div> <!-- 👈 토지이용규제 카드 닫기 -->
                    </div> <!-- 👈 왼쪽 열 space-y-4 닫기 -->

                    <!-- 오른쪽 열: 실거래 시세, 매각 통계, [🔮 AI 미래 예상 시세 시뮬레이터] -->
                    <div class="space-y-4 sm:space-y-5 w-full">
                        <div id="detail-panel-market" class="space-y-4 sm:space-y-5">"""

    content = content.replace(old_tab3_split, new_tab3_split, 1)

    # 탭 3의 매각 통계 닫기 및 AI 시뮬레이터 카드 탑재 및 그리드 닫기
    old_tab3_close = """                                </div>
                            </div>
                        </div>
                    </div>
            </div>
            <div id="group-mask-3" """

    new_tab3_close = """                                </div>
                            </div>
                        </div> <!-- 👈 매각 통계 카드 닫기 -->

                        <!-- 🔮 AI 미래 예상 시세 시뮬레이터 (1년/3년/5년/10년 후 예상시세 예측) -->
                        <div class="bg-white border border-slate-200 rounded-2xl shadow-sm w-full overflow-hidden">
                            <div class="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex justify-between items-center">
                                <h4 class="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5">
                                    <i class="fa-solid fa-wand-magic-sparkles text-royalBlue"></i> 🔮 AI 미래 예상 시세 시뮬레이터
                                </h4>
                                <span class="bg-blue-50 border border-blue-200 text-royalBlue text-[9px] font-black px-2 py-0.5 rounded-full">예측 엔진 v1.2</span>
                            </div>
                            <div class="p-3.5 space-y-3">
                                <div class="bg-amber-50/50 border border-amber-200 rounded-xl p-2.5 text-[9.5px] text-amber-700 leading-normal font-semibold">
                                    ⚠️ 본 예측 시세는 시나리오별 연 복리 상승률을 적용한 단순 추정치이며 실제 시장 변화와 다를 수 있으므로 참고용으로만 사용하시기 바랍니다.
                                </div>
                                <div class="flex items-center justify-between gap-2 bg-slate-50 border border-slate-200 rounded-xl p-2">
                                    <span class="text-xs font-bold text-slate-500">연평균 미래 성장률</span>
                                    <div class="flex gap-1.5">
                                        <label class="cursor-pointer">
                                            <input type="radio" name="future-rate-select" value="1.5" onchange="updateFuturePricePrediction()" class="sr-only peer">
                                            <span class="block px-2 py-1 rounded-lg text-[10px] font-black bg-slate-200/60 text-slate-600 peer-checked:bg-royalBlue peer-checked:text-white transition-all select-none">보수적 (1.5%)</span>
                                        </label>
                                        <label class="cursor-pointer">
                                            <input type="radio" name="future-rate-select" value="3.0" checked onchange="updateFuturePricePrediction()" class="sr-only peer">
                                            <span class="block px-2 py-1 rounded-lg text-[10px] font-black bg-slate-200/60 text-slate-600 peer-checked:bg-royalBlue peer-checked:text-white transition-all select-none">표준 (3.0%)</span>
                                        </label>
                                        <label class="cursor-pointer">
                                            <input type="radio" name="future-rate-select" value="5.0" onchange="updateFuturePricePrediction()" class="sr-only peer">
                                            <span class="block px-2 py-1 rounded-lg text-[10px] font-black bg-slate-200/60 text-slate-600 peer-checked:bg-royalBlue peer-checked:text-white transition-all select-none">적극적 (5.0%)</span>
                                        </label>
                                    </div>
                                </div>
                                <div class="overflow-x-auto border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
                                    <table class="w-full text-left border-collapse text-[13px] document-view">
                                        <thead>
                                            <tr class="bg-slate-50 border-b border-slate-200 text-slate-800 font-extrabold text-[12px]">
                                                <th class="p-3 pl-4">예상 시점</th>
                                                <th class="p-3">누적 상승률</th>
                                                <th class="p-3 text-right">예상 추정 가격</th>
                                            </tr>
                                        </thead>
                                        <tbody class="text-slate-700 font-medium">
                                            <tr class="border-b border-slate-100 hover:bg-slate-50/40 transition-colors">
                                                <td class="p-3 pl-4 font-bold">1년 후</td>
                                                <td class="p-3 text-emeraldSuccess font-extrabold" id="future-rate-1y">+3.0%</td>
                                                <td class="p-3 text-right font-black font-outfit" id="future-price-1y">-원</td>
                                            </tr>
                                            <tr class="border-b border-slate-100 hover:bg-slate-50/40 transition-colors">
                                                <td class="p-3 pl-4 font-bold">3년 후</td>
                                                <td class="p-3 text-emeraldSuccess font-extrabold" id="future-rate-3y">+9.27%</td>
                                                <td class="p-3 text-right font-black font-outfit" id="future-price-3y">-원</td>
                                            </tr>
                                            <tr class="border-b border-slate-100 hover:bg-slate-50/40 transition-colors">
                                                <td class="p-3 pl-4 font-bold">5년 후</td>
                                                <td class="p-3 text-emeraldSuccess font-extrabold" id="future-rate-5y">+15.93%</td>
                                                <td class="p-3 text-right font-black font-outfit" id="future-price-5y">-원</td>
                                            </tr>
                                            <tr class="hover:bg-slate-50/40 transition-colors">
                                                <td class="p-3 pl-4 font-bold">10년 후</td>
                                                <td class="p-3 text-emeraldSuccess font-extrabold" id="future-rate-10y">+34.39%</td>
                                                <td class="p-3 text-right font-black font-outfit" id="future-price-10y">-원</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div> <!-- 👈 미래 예상 시뮬레이터 카드 닫기 -->
                    </div> <!-- 👈 오른쪽 열 닫기 -->
                </div> <!-- 👈 2열 그리드 전체 닫기 -->
            </div> <!-- 👈 group-content-3 전체 닫기 -->
            <div id="group-mask-3" """

    content = content.replace(old_tab3_close, new_tab3_close, 1)


    # 4. 광고 오타 수정 (비활성화 분기 시 classList.remove 대신 add 하도록 처리)
    old_ad_top_bug = """                } else {
                    detailTopAdSlot.classList.remove("hidden");
                }"""

    new_ad_top_bug = """                } else {
                    detailTopAdSlot.classList.add("hidden");
                }"""

    content = content.replace(old_ad_top_bug, new_ad_top_bug, 1)

    old_ad_bottom_bug = """                } else {
                    detailBottomAdSlot.classList.remove("hidden");
                }"""

    new_ad_bottom_bug = """                } else {
                    detailBottomAdSlot.classList.add("hidden");
                }"""

    content = content.replace(old_ad_bottom_bug, new_ad_bottom_bug, 1)


    # 5. loadDetailView 마지막 부분에 전역 보관, 시세 예측 갱신 및 광고 렌더링 호출을 심어 연결 복구
    old_detail_load_end = """            // v1.2 모의입찰 데이터 및 전문가 리스트 실시간 로드 연동
            if (typeof v12Features !== 'undefined') {
                v12Features.loadMockBids(item.id, item.appraised_value);
                v12Features.renderExperts(item.id);
            }
        }"""

    new_detail_load_end = """            // v1.2 모의입찰 데이터 및 전문가 리스트 실시간 로드 연동
            if (typeof v12Features !== 'undefined') {
                v12Features.loadMockBids(item.id, item.appraised_value);
                v12Features.renderExperts(item.id);
            }

            // 미래 예상 시세 산출을 위해 매물 정보를 전역에 보관하고 예측 시뮬레이터를 업데이트합니다.
            window.currentDetailItem = item;
            updateFuturePricePrediction();

            // 상세페이지가 열릴 때마다 최신 광고 정보를 그리도록 동기화합니다.
            renderCustomAdSlots();
        }"""

    content = content.replace(old_detail_load_end, new_detail_load_end, 1)


    # 6. 미래 예상 시세 연산 자바스크립트 함수 추가 (renderSimilarProperties 시작부 바로 위에 정의)
    old_similar_start = """        // 🧠 주변 유사 추천 매물 미터(m) 단위 동적 연산 렌더러
        function renderSimilarProperties(currentItem) {"""

    new_similar_start = """        // 🔮 AI 미래 예상 시세 시뮬레이터 연산 함수 (1년/3년/5년/10년 후 예상시세 예측)
        function updateFuturePricePrediction() {
            const item = window.currentDetailItem;
            if (!item) return;

            const basePrice = item.appraised_value || 0;
            const rateElements = document.getElementsByName("future-rate-select");
            let rate = 3.0; // 기본 3% (표준)
            for (let r of rateElements) {
                if (r.checked) {
                    rate = parseFloat(r.value);
                    break;
                }
            }

            // 각 예상 기간별 복리 상승률 및 가격 계산
            const terms = [1, 3, 5, 10];
            const termKeys = { 1: '1y', 3: '3y', 5: '5y', 10: '10y' };

            terms.forEach(t => {
                const key = termKeys[t];
                const cumRate = (Math.pow(1 + rate / 100, t) - 1) * 100;
                const estPrice = Math.round(basePrice * Math.pow(1 + rate / 100, t));

                const rateEl = document.getElementById(`future-rate-${key}`);
                const priceEl = document.getElementById(`future-price-${key}`);

                if (rateEl) {
                    rateEl.textContent = `+${cumRate.toFixed(2)}%`;
                }
                if (priceEl) {
                    priceEl.textContent = formatKRW(estPrice);
                }
            });
        }

        // 🧠 주변 유사 추천 매물 미터(m) 단위 동적 연산 렌더러
        function renderSimilarProperties(currentItem) {"""

    content = content.replace(old_similar_start, new_similar_start, 1)


    try:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)
        print("Successfully applied precise responsive 2-column grid patches and restored ad syncing in index.html.")
    except Exception as e:
        print(f"Failed to write index.html: {e}")

if __name__ == "__main__":
    main()
