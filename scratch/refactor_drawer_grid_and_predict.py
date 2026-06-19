# -*- coding: utf-8 -*-
# index.html의 3대 탭을 반응형 2열 그리드로 전면 개편하고 미래 예상 시세 예측 시뮬레이터를 삽입하는 패치 스크립트입니다.
import re

def main():
    filepath = "index.html"
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
    except Exception as e:
        print(f"Failed to read index.html: {e}")
        return

    # 1. 탭 1 (종합 & 권리분석) 반응형 2열 개편 및 카드 헤더 스타일 일체화
    # 기일 이력 카드, 외부 연동 허브, 유사 추천 매물을 왼쪽 1열로 묶고, 법정 주요 서류를 오른쪽 2열로 묶습니다.
    # 각각의 카드들을 overflow-hidden 구조와 bg-slate-50 헤더 영역을 가진 카드 스타일로 갱신합니다.
    
    # 탭 1의 기존 '3. 경매 기일 이력과 외부 정보 연동...' 주석 밑의 마크업 전체를 2열 그리드 구조로 개편합니다.
    old_tab1_markup = """                <!-- 3. 경매 기일 이력과 외부 정보 연동/유사 매물 반응형 분기 레이아웃 (세로 1열 플로우 배치로 공백 제거) -->
                <div class="space-y-4 sm:space-y-5 w-full">
                    <!-- 경매 진행 기일 이력 -->
                    <div class="bg-white border border-slate-200 rounded-2xl p-4 space-y-2 shadow-sm w-full">
                        <h4 class="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5 mb-2.5">
                            <i class="fa-solid fa-calendar-days text-royalBlue"></i> 📅 경매 진행 기일 이력
                        </h4>
                        <div class="overflow-x-auto border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
                            <table class="w-full text-left border-collapse text-[13px] document-view">
                                <thead>
                                    <tr class="bg-slate-50 border-b border-slate-200 text-slate-800 font-extrabold text-[12px]">
                                        <th class="p-3 pl-4 w-1/4">회차</th>
                                        <th class="p-3 w-1/3">입찰 기일</th>
                                        <th class="p-3 text-right text-slate-800">최저 매각 가격</th>
                                        <th class="p-3 pr-4 text-center">결과</th>
                                    </tr>
                                </thead>
                                <tbody id="detail-giiil-tbody" class="text-slate-700 font-medium">
                                    <!-- 동적 주입 -->
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- 우측 묶음: 외부 연동 허브 및 추천 매물 -->
                    <div class="space-y-4 sm:space-y-5 w-full">
                        <!-- 원스톱 외부 공식 정보망 연동 -->
                        <div class="bg-white border border-slate-200 rounded-2xl p-3 sm:p-3.5 space-y-2 shadow-sm">
                            <h4 class="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5">
                                <i class="fa-solid fa-globe text-royalBlue"></i> 🌐 원스톱 외부 공식 정보망 연동
                            </h4>
                            <p class="text-[9.5px] text-slate-500 leading-relaxed font-semibold">주요 외부 공식 포털 및 지도로 바로 이동합니다.</p>
                            <div class="grid grid-cols-2 gap-2 text-xs">
                                <a id="btn-official-site" href="https://www.courtauction.go.kr" target="_blank" class="bg-slate-50 border border-slate-200 hover:border-royalBlue hover:shadow-md rounded-xl p-2.5 flex items-center gap-2.5 transition-all group">
                                    <div class="bg-blue-50 text-royalBlue group-hover:bg-royalBlue group-hover:text-white w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors">
                                        <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
                                    </div>
                                    <div class="truncate">
                                        <strong class="block text-[10.5px] sm:text-xs font-black text-slate-800 group-hover:text-royalBlue transition-colors truncate">공식 매물상세</strong>
                                        <span class="text-[9px] text-slate-400 font-bold block mt-0.5 truncate">법원/온비드 원본 정보</span>
                                    </div>
                                </a>
                                <a id="btn-naver-map" href="https://map.naver.com" target="_blank" class="bg-slate-50 border border-slate-200 hover:border-emeraldSuccess hover:shadow-md rounded-xl p-2.5 flex items-center gap-2.5 transition-all group">
                                    <div class="bg-emerald-50 text-emeraldSuccess group-hover:bg-emeraldSuccess group-hover:text-white w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors">
                                        <i class="fa-solid fa-map-location-dot text-[10px]"></i>
                                    </div>
                                    <div class="truncate">
                                        <strong class="block text-[10.5px] sm:text-xs font-black text-slate-800 group-hover:text-emeraldSuccess transition-colors truncate">네이버지도 보기</strong>
                                        <span class="text-[9px] text-slate-400 font-bold block mt-0.5 truncate">위성뷰 지번 확인</span>
                                    </div>
                                </a>
                                <a id="btn-naver-land-price" href="https://land.naver.com" target="_blank" class="bg-slate-50 border border-slate-200 hover:border-royalBlue hover:shadow-md rounded-xl p-2.5 flex items-center gap-2.5 transition-all group">
                                    <div class="bg-blue-50 text-royalBlue group-hover:bg-royalBlue group-hover:text-white w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors">
                                        <i class="fa-solid fa-house-chimney text-[10px]"></i>
                                    </div>
                                    <div class="truncate">
                                        <strong class="block text-[10.5px] sm:text-xs font-black text-slate-800 group-hover:text-royalBlue transition-colors truncate">네이버부동산 시세</strong>
                                        <span class="text-[9px] text-slate-400 font-bold block mt-0.5 truncate">주변 단지 거래 동향</span>
                                    </div>
                                </a>
                                <a href="https://www.iros.go.kr" target="_blank" class="bg-slate-50 border border-slate-200 hover:border-royalBlue hover:shadow-md rounded-xl p-2.5 flex items-center gap-2.5 transition-all group">
                                    <div class="bg-blue-50 text-royalBlue group-hover:bg-royalBlue group-hover:text-white w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors">
                                        <i class="fa-solid fa-file-signature text-[10px]"></i>
                                    </div>
                                    <div class="truncate">
                                        <strong class="block text-[10.5px] sm:text-xs font-black text-slate-800 group-hover:text-royalBlue transition-colors truncate">인터넷등기소</strong>
                                        <span class="text-[9px] text-slate-400 font-bold block mt-0.5 truncate">등기부등본 열람</span>
                                    </div>
                                </a>
                            </div>
                        </div>

                        <!-- 동일 용도/지역 기반 유사 추천 매물 -->
                        <div class="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-sm">
                            <h4 class="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-100">
                                <i class="fa-solid fa-handshake text-royalBlue"></i> 🤝 동일 용도/지역 기반 유사 추천 매물
                            </h4>
                            <div id="detail-similar-container" class="grid grid-cols-3 gap-2">
                                <!-- 동적 렌더링 카드 3개 -->
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 4. 가로가 긴 법정 주요 서류 테이블 (단독 1열 배치) -->
                <div class="bg-white border border-slate-200 rounded-2xl p-4 space-y-2.5 shadow-sm w-full">
                    <h4 class="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5">
                        <i class="fa-solid fa-scale-balanced text-royalBlue"></i> ⚖️ 법정 주요 서류 및 사건 기록
                    </h4>
                    <p class="text-[9.5px] text-slate-500 leading-relaxed font-semibold">대법원 경매 및 감정 법원에서 공식 발행된 법정 주요 서류의 정밀 분석 명세 테이블입니다.</p>
                    <div class="overflow-x-auto border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
                        <table class="w-full text-left border-collapse text-[13px] document-view">
                            <thead>
                                <tr class="bg-slate-50 border-b border-slate-200 text-slate-800 font-extrabold text-[12px]">
                                    <th class="p-3 pl-4 w-[20%] text-slate-900">서류 구분</th>
                                    <th class="p-3 w-[35%] text-slate-900">세부 항목 분석 명세</th>
                                    <th class="p-3 w-[35%] text-slate-900">집행법원 / 의견 및 권리 진단</th>
                                    <th class="p-3 pr-4 text-right w-[10%] text-slate-900">바로가기</th>
                                </tr>
                            </thead>
                            <tbody class="text-slate-700 font-medium">"""

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
                            <div class="p-3.5 space-y-3">
                                <div class="overflow-x-auto border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
                                    <table class="w-full text-left border-collapse text-[13px] document-view">
                                        <thead>
                                            <tr class="bg-slate-50 border-b border-slate-200 text-slate-800 font-extrabold text-[12px]">
                                                <th class="p-3 pl-4 w-1/4">회차</th>
                                                <th class="p-3 w-1/3">입찰 기일</th>
                                                <th class="p-3 text-right text-slate-800">최저 매각 가격</th>
                                                <th class="p-3 pr-4 text-center">결과</th>
                                            </tr>
                                        </thead>
                                        <tbody id="detail-giiil-tbody" class="text-slate-700 font-medium">
                                            <!-- 동적 주입 -->
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        <!-- 원스톱 외부 공식 정보망 연동 -->
                        <div class="bg-white border border-slate-200 rounded-2xl shadow-sm w-full overflow-hidden">
                            <div class="bg-slate-50 px-4 py-2.5 border-b border-slate-200">
                                <h4 class="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5">
                                    <i class="fa-solid fa-globe text-royalBlue"></i> 🌐 원스톱 외부 공식 정보망 연동
                                </h4>
                            </div>
                            <div class="p-3.5 space-y-2">
                                <p class="text-[9.5px] text-slate-500 leading-relaxed font-semibold">주요 외부 공식 포털 및 지도로 바로 이동합니다.</p>
                                <div class="grid grid-cols-2 gap-2 text-xs">
                                    <a id="btn-official-site" href="https://www.courtauction.go.kr" target="_blank" class="bg-slate-50 border border-slate-200 hover:border-royalBlue hover:shadow-md rounded-xl p-2.5 flex items-center gap-2.5 transition-all group">
                                        <div class="bg-blue-50 text-royalBlue group-hover:bg-royalBlue group-hover:text-white w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors">
                                            <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
                                        </div>
                                        <div class="truncate">
                                            <strong class="block text-[10.5px] sm:text-xs font-black text-slate-800 group-hover:text-royalBlue transition-colors truncate">공식 매물상세</strong>
                                            <span class="text-[9px] text-slate-400 font-bold block mt-0.5 truncate">법원/온비드 원본 정보</span>
                                        </div>
                                    </a>
                                    <a id="btn-naver-map" href="https://map.naver.com" target="_blank" class="bg-slate-50 border border-slate-200 hover:border-emeraldSuccess hover:shadow-md rounded-xl p-2.5 flex items-center gap-2.5 transition-all group">
                                        <div class="bg-emerald-50 text-emeraldSuccess group-hover:bg-emeraldSuccess group-hover:text-white w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors">
                                            <i class="fa-solid fa-map-location-dot text-[10px]"></i>
                                        </div>
                                        <div class="truncate">
                                            <strong class="block text-[10.5px] sm:text-xs font-black text-slate-800 group-hover:text-emeraldSuccess transition-colors truncate">네이버지도 보기</strong>
                                            <span class="text-[9px] text-slate-400 font-bold block mt-0.5 truncate">위성뷰 지번 확인</span>
                                        </div>
                                    </a>
                                    <a id="btn-naver-land-price" href="https://land.naver.com" target="_blank" class="bg-slate-50 border border-slate-200 hover:border-royalBlue hover:shadow-md rounded-xl p-2.5 flex items-center gap-2.5 transition-all group">
                                        <div class="bg-blue-50 text-royalBlue group-hover:bg-royalBlue group-hover:text-white w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors">
                                            <i class="fa-solid fa-house-chimney text-[10px]"></i>
                                        </div>
                                        <div class="truncate">
                                            <strong class="block text-[10.5px] sm:text-xs font-black text-slate-800 group-hover:text-royalBlue transition-colors truncate">네이버부동산 시세</strong>
                                            <span class="text-[9px] text-slate-400 font-bold block mt-0.5 truncate">주변 단지 거래 동향</span>
                                        </div>
                                    </a>
                                    <a href="https://www.iros.go.kr" target="_blank" class="bg-slate-50 border border-slate-200 hover:border-royalBlue hover:shadow-md rounded-xl p-2.5 flex items-center gap-2.5 transition-all group">
                                        <div class="bg-blue-50 text-royalBlue group-hover:bg-royalBlue group-hover:text-white w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors">
                                            <i class="fa-solid fa-file-signature text-[10px]"></i>
                                        </div>
                                        <div class="truncate">
                                            <strong class="block text-[10.5px] sm:text-xs font-black text-slate-800 group-hover:text-royalBlue transition-colors truncate">인터넷등기소</strong>
                                            <span class="text-[9px] text-slate-400 font-bold block mt-0.5 truncate">등기부등본 열람</span>
                                        </div>
                                    </a>
                                </div>
                            </div>
                        </div>

                        <!-- 동일 용도/지역 기반 유사 추천 매물 -->
                        <div class="bg-white border border-slate-200 rounded-2xl shadow-sm w-full overflow-hidden">
                            <div class="bg-slate-50 px-4 py-2.5 border-b border-slate-200">
                                <h4 class="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5">
                                    <i class="fa-solid fa-handshake text-royalBlue"></i> 🤝 동일 용도/지역 기반 유사 추천 매물
                                </h4>
                            </div>
                            <div class="p-3.5 space-y-3">
                                <div id="detail-similar-container" class="grid grid-cols-3 gap-2">
                                    <!-- 동적 렌더링 카드 3개 -->
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 오른쪽 열: 법정 주요 서류 및 사건 기록 (대화면에서 가로폭이 늘어나는 문제 해결) -->
                    <div class="bg-white border border-slate-200 rounded-2xl shadow-sm w-full overflow-hidden">
                        <div class="bg-slate-50 px-4 py-2.5 border-b border-slate-200">
                            <h4 class="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5">
                                <i class="fa-solid fa-scale-balanced text-royalBlue"></i> ⚖️ 법정 주요 서류 및 사건 기록
                            </h4>
                        </div>
                        <div class="p-3.5 space-y-2.5">
                            <p class="text-[9.5px] text-slate-500 leading-relaxed font-semibold">대법원 경매 및 감정 법원에서 공식 발행된 법정 주요 서류의 정밀 분석 명세 테이블입니다.</p>
                            <div class="overflow-x-auto border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
                                <table class="w-full text-left border-collapse text-[13px] document-view">
                                    <thead>
                                        <tr class="bg-slate-50 border-b border-slate-200 text-slate-800 font-extrabold text-[12px]">
                                            <th class="p-3 pl-4 w-[20%] text-slate-900">서류 구분</th>
                                            <th class="p-3 w-[35%] text-slate-900">세부 항목 분석 명세</th>
                                            <th class="p-3 w-[35%] text-slate-900">의견 및 권리 진단</th>
                                            <th class="p-3 pr-4 text-right w-[10%] text-slate-900">바로가기</th>
                                        </tr>
                                    </thead>
                                    <tbody class="text-slate-700 font-medium">"""

    content = content.replace(old_tab1_markup, new_tab1_markup)

    # 탭 1 그리드 닫아주기: </tbody> 닫히는 테이블 아래에서 2열 그리드 전체의 닫는 </div>를 삽입합니다.
    # 기존 코드에서 </tbody> 아래 테이블 및 닫는 </div> 구조를 확인해봅니다.
    # index.html 1461라인 근처:
    old_tab1_close = """                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>"""
    
    new_tab1_close = """                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                </div> <!-- 👈 2열 그리드 전체 닫기 -->"""

    content = content.replace(old_tab1_close, new_tab1_close)


    # 2. 탭 2 (입찰 & 금융분석) 반응형 2열 그리드 개편
    # 왼쪽: AI 낙찰 시뮬레이션 지표 + 스마트 계산기 + 시나리오별 ROI 분석 테이블
    # 오른쪽: 인수분석 명세 + 임차인 현황 + 예상 배당표
    # 각 카드들의 헤더를 bg-slate-50과 테두리 칸으로 리팩토링합니다.
    
    old_tab2_markup = """        <div id="detail-group-panel-2" class="flex-1 overflow-y-auto p-3 sm:p-3.5 space-y-3 sm:space-y-3.5 custom-scrollbar bg-slate-50/50 hidden relative">
            <div id="group-content-2" class="space-y-3 sm:space-y-3.5 w-full">
                <div id="detail-panel-bid" class="space-y-3 sm:space-y-3.5">
            <!-- AI 낙찰 시뮬레이션 지표 분석 -->
            <div class="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-3 sm:p-3.5 space-y-2 shadow-sm mb-3">
                <h4 class="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5">
                    <i class="fa-solid fa-chart-simple"></i> AI 낙찰 시뮬레이션 지표 분석
                </h4>"""

    new_tab2_markup = """        <div id="detail-group-panel-2" class="flex-1 overflow-y-auto p-3 sm:p-3.5 space-y-3 sm:space-y-3.5 custom-scrollbar bg-slate-50/50 hidden relative">
            <div id="group-content-2" class="space-y-3 sm:space-y-3.5 w-full">
                <!-- 2열 그리드로 쪼개어 금융/입찰 테이블들의 가로 늘어짐 방지 -->
                <div class="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-5 w-full items-start">
                    <!-- 왼쪽 열: 시뮬레이션 지표, 스마트 계산기, ROI 분석 테이블 -->
                    <div class="space-y-4 sm:space-y-5 w-full">
                        <!-- AI 낙찰 시뮬레이션 지표 분석 -->
                        <div class="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-3.5 space-y-2 shadow-sm">
                            <div class="flex items-center gap-1.5 pb-2 border-b border-blue-200/50 mb-1">
                                <h4 class="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5">
                                    <i class="fa-solid fa-chart-simple text-royalBlue"></i> AI 낙찰 시뮬레이션 지표 분석
                                </h4>
                            </div>"""

    content = content.replace(old_tab2_markup, new_tab2_markup)

    # 탭 2의 스마트 계산기 카드 카드 헤더 스타일 개편
    old_calc_markup = """            <!-- 🧮 세법 스마트 낙찰 계획서 계산기 -->
            <div class="bg-white border border-slate-200 rounded-2xl p-3 sm:p-3.5 shadow-sm space-y-2.5 max-w-[720px] mx-auto w-full">
                <div class="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h4 class="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5">
                        <i class="fa-solid fa-calculator text-royalBlue"></i> 스마트 정밀 소요자금 계획서
                    </h4>
                    <span id="tax-rate-badge" class="text-[9px] font-black px-2 py-0.5 rounded-full border"></span>
                </div>"""

    new_calc_markup = """            <!-- 🧮 세법 스마트 낙찰 계획서 계산기 -->
            <div class="bg-white border border-slate-200 rounded-2xl shadow-sm w-full overflow-hidden">
                <div class="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex justify-between items-center">
                    <h4 class="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5">
                        <i class="fa-solid fa-calculator text-royalBlue"></i> 스마트 정밀 소요자금 계획서
                    </h4>
                    <span id="tax-rate-badge" class="text-[9px] font-black px-2 py-0.5 rounded-full border border-slate-300 bg-white"></span>
                </div>
                <div class="p-3.5 space-y-2.5">"""

    content = content.replace(old_calc_markup, new_calc_markup)

    # 계산기 닫기 보정: LTV 대출 및 금리 시뮬레이터 아래의 닫는 div 태그들
    # 기존 코드에서 렌더링 수치 행 (영수증) 영역 주변을 2열 그리드 분기에 알맞게 리포팅합니다.
    # LTV 계산기 닫는 부분과 투자 수익률 분석 테이블 시작 부분
    old_roi_markup = """                    <div class="loan-highlight-row bg-blue-50/50 border border-blue-100 rounded-lg p-2.5 flex justify-between items-center text-[10.5px]">
                        <span class="text-slate-500 font-extrabold flex items-center gap-1"><i class="fa-solid fa-coins text-royalBlue text-[10px]"></i> 경락 대출 예상 이자액</span>
                        <strong id="calc-loan-interest" class="text-slate-900 font-black font-outfit">0원 (월)</strong>
                    </div>
                </div>
            </div>

            <!-- 📊 시나리오별 총 투자수익률 (ROI) 분석 테이블 -->
            <div class="bg-white border border-slate-200 rounded-2xl p-3 sm:p-3.5 shadow-sm space-y-2.5 max-w-[720px] mx-auto w-full">
                <h4 class="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-100">
                    <i class="fa-solid fa-percent text-royalBlue"></i> 📊 시나리오별 총 투자수익률 (ROI) 분석
                </h4>"""

    new_roi_markup = """                    <div class="loan-highlight-row bg-blue-50/50 border border-blue-100 rounded-lg p-2.5 flex justify-between items-center text-[10.5px]">
                        <span class="text-slate-500 font-extrabold flex items-center gap-1"><i class="fa-solid fa-coins text-royalBlue text-[10px]"></i> 경락 대출 예상 이자액</span>
                        <strong id="calc-loan-interest" class="text-slate-900 font-black font-outfit">0원 (월)</strong>
                    </div>
                </div>
            </div>
            </div> <!-- 👈 계산기 p-3.5 닫기 및 overflow-hidden 카드 닫기 -->

            <!-- 📊 시나리오별 총 투자수익률 (ROI) 분석 테이블 -->
            <div class="bg-white border border-slate-200 rounded-2xl shadow-sm w-full overflow-hidden">
                <div class="bg-slate-50 px-4 py-2.5 border-b border-slate-200">
                    <h4 class="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5">
                        <i class="fa-solid fa-percent text-royalBlue"></i> 📊 시나리오별 총 투자수익률 (ROI) 분석
                    </h4>
                </div>
                <div class="p-3.5 space-y-2.5">"""

    content = content.replace(old_roi_markup, new_roi_markup)

    # ROI 닫는 태그 보정 및 2열 우측 열 시작
    # 기존 코드에서 </tbody> </table> </div> </div> (ROI 닫힘)
    # 그 밑의 "인수분석 명세" 시작 부분을 우측 열로 맵핑합니다.
    old_tab2_col2_markup = """                        </tbody>
                    </table>
                </div>
            </div>

            <!-- 💸 인수분석 명세 테이블 -->
            <div class="bg-white border border-slate-200 rounded-2xl p-3 sm:p-3.5 shadow-sm space-y-2.5">
                <h4 class="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-100">
                    <i class="fa-solid fa-hand-holding-dollar text-royalBlue"></i> 💸 낙찰자 인수분석 명세
                </h4>"""

    new_tab2_col2_markup = """                        </tbody>
                    </table>
                </div>
            </div>
            </div> <!-- 👈 ROI p-3.5 닫기 및 카드 닫기 -->
            </div> <!-- 👈 2열 왼쪽 열 전체 닫기 -->

            <!-- 오른쪽 열: 인수분석, 점유현황, 예상 배당표 -->
            <div class="space-y-4 sm:space-y-5 w-full">
                <!-- 💸 인수분석 명세 테이블 -->
                <div class="bg-white border border-slate-200 rounded-2xl shadow-sm w-full overflow-hidden">
                    <div class="bg-slate-50 px-4 py-2.5 border-b border-slate-200">
                        <h4 class="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5">
                            <i class="fa-solid fa-hand-holding-dollar text-royalBlue"></i> 💸 낙찰자 인수분석 명세
                        </h4>
                    </div>
                    <div class="p-3.5 space-y-2.5">"""

    content = content.replace(old_tab2_col2_markup, new_tab2_col2_markup)

    # 탭 2의 점유현황 카드 헤더 개편
    old_occupy_markup = """            <!-- 👥 점유현황 및 임차인 분석 테이블 -->
            <div class="bg-white border border-slate-200 rounded-2xl p-3 sm:p-3.5 shadow-sm space-y-2.5">
                <h4 class="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-100">
                    <i class="fa-solid fa-users text-royalBlue"></i> 👥 부동산 점유현황 및 임차인 분석
                </h4>"""

    new_occupy_markup = """            </div> <!-- 👈 인수분석 p-3.5 및 카드 닫기 -->
            </div> <!-- 👈 인수분석 카드 닫기 보정 -->

            <!-- 👥 점유현황 및 임차인 분석 테이블 -->
            <div class="bg-white border border-slate-200 rounded-2xl shadow-sm w-full overflow-hidden">
                <div class="bg-slate-50 px-4 py-2.5 border-b border-slate-200">
                    <h4 class="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5">
                        <i class="fa-solid fa-users text-royalBlue"></i> 👥 부동산 점유현황 및 임차인 분석
                    </h4>
                </div>
                <div class="p-3.5 space-y-2.5">"""

    content = content.replace(old_occupy_markup, new_occupy_markup)

    # 탭 2의 예상 배당표 카드 헤더 개편
    old_dividend_markup = """            <!-- 💰 예상 배당표 시뮬레이션 테이블 -->
            <div class="bg-white border border-slate-200 rounded-2xl p-3 sm:p-3.5 shadow-sm space-y-2.5">
                <h4 class="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-100">
                    <i class="fa-solid fa-money-bill-transfer text-royalBlue"></i> 💰 예상 배당표 시뮬레이션
                </h4>"""

    new_dividend_markup = """            </div> <!-- 👈 점유현황 p-3.5 및 카드 닫기 -->
            </div> <!-- 👈 점유현황 카드 닫기 보정 -->

            <!-- 💰 예상 배당표 시뮬레이션 테이블 -->
            <div class="bg-white border border-slate-200 rounded-2xl shadow-sm w-full overflow-hidden">
                <div class="bg-slate-50 px-4 py-2.5 border-b border-slate-200">
                    <h4 class="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5">
                        <i class="fa-solid fa-money-bill-transfer text-royalBlue"></i> 💰 예상 배당표 시뮬레이션
                    </h4>
                </div>
                <div class="p-3.5 space-y-2.5">"""

    content = content.replace(old_dividend_markup, new_dividend_markup)

    # 탭 2의 닫기 전체 보정: 배당표 </tbody> </table> </div> </div> (배당표 닫힘) 아래에서
    # 우측 2열 및 전체 2열 그리드의 닫는 div 태그를 주입합니다.
    old_tab2_close = """                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
            </div>
            <div id="group-mask-2" """

    new_tab2_close = """                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                </div> <!-- 👈 배당표 p-3.5 및 카드 닫기 -->
                </div> <!-- 👈 2열 오른쪽 열 전체 닫기 -->
                </div> <!-- 👈 2열 그리드 전체 닫기 -->
            </div> <!-- 👈 group-content-2 닫기 -->
            </div> <!-- 👈 detail-panel-bid 닫기 보정 -->
            <div id="group-mask-2" """

    content = content.replace(old_tab2_close, new_tab2_close)


    # 3. 탭 3 (입지 & 시세분석) 반응형 2열 그리드 개편 및 AI 미래 예상 시세 예측 시뮬레이터 탑재
    # 왼쪽: 실시간 위치 지도 + 네이버 연동 허브 + 토지이용계획 규제 진단
    # 오른쪽: 주변 아파트 실거래 시세 + 최근 1년 매각 통계 + [🔮 AI 미래 예상 시세 시뮬레이터]
    
    old_tab3_markup = """        <div id="detail-group-panel-3" class="flex-1 overflow-y-auto p-3 sm:p-3.5 space-y-3 sm:space-y-3.5 custom-scrollbar bg-slate-50/50 hidden relative">
            <div id="group-content-3" class="space-y-3 sm:space-y-3.5 w-full">
                <!-- 위치 & 시세 분석 1열 스택 레이아웃 -->
                <div class="space-y-4 sm:space-y-5">
                    <div id="detail-panel-map" class="space-y-4 sm:space-y-5">
            <!-- 📍 물건지 실시간 위치 지도 -->
            <div class="bg-white border border-slate-200 rounded-2xl p-3 sm:p-3.5 space-y-2 shadow-sm">
                <h4 class="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5">
                    <i class="fa-solid fa-map-location-dot text-royalBlue"></i> 📍 물건지 실시간 위치 지도
                </h4>"""

    new_tab3_markup = """        <div id="detail-group-panel-3" class="flex-1 overflow-y-auto p-3 sm:p-3.5 space-y-3 sm:space-y-3.5 custom-scrollbar bg-slate-50/50 hidden relative">
            <div id="group-content-3" class="space-y-3 sm:space-y-3.5 w-full">
                <!-- 2열 그리드로 개편하여 지도/시세 테이블의 가로 늘어짐 방지 -->
                <div class="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-5 w-full items-start">
                    <!-- 왼쪽 열: 지도, 연동 허브, 토지규제 진단 -->
                    <div class="space-y-4 sm:space-y-5 w-full">
                        <div id="detail-panel-map" class="space-y-4 sm:space-y-5">
                            <!-- 📍 물건지 실시간 위치 지도 -->
                            <div class="bg-white border border-slate-200 rounded-2xl shadow-sm w-full overflow-hidden">
                                <div class="bg-slate-50 px-4 py-2.5 border-b border-slate-200">
                                    <h4 class="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5">
                                        <i class="fa-solid fa-map-location-dot text-royalBlue"></i> 📍 물건지 실시간 위치 지도
                                    </h4>
                                </div>
                                <div class="p-3.5">"""

    content = content.replace(old_tab3_markup, new_tab3_markup)

    # 탭 3의 지도 컨테이너 닫는 부분과 연동 허브 시작 부분 개편
    old_hub_markup = """                </div>
            </div>

            <!-- 🗺️ 네이버 전문 지도 및 정보망 연동 허브 -->
            <div class="bg-white border border-slate-200 rounded-2xl p-3 sm:p-3.5 space-y-2 shadow-sm">
                <h4 class="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5">
                    <i class="fa-solid fa-map text-royalBlue"></i> 🗺️ 네이버 전문 지도 및 정보망 연동
                </h4>"""

    new_hub_markup = """                                </div>
                            </div>
                        </div> <!-- 👈 지도 카드 닫기 -->

                        <!-- 🗺️ 네이버 전문 지도 및 정보망 연동 허브 -->
                        <div class="bg-white border border-slate-200 rounded-2xl shadow-sm w-full overflow-hidden">
                            <div class="bg-slate-50 px-4 py-2.5 border-b border-slate-200">
                                <h4 class="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5">
                                    <i class="fa-solid fa-map text-royalBlue"></i> 🗺️ 네이버 전문 지도 및 정보망 연동
                                </h4>
                            </div>
                            <div class="p-3.5 space-y-2">"""

    content = content.replace(old_hub_markup, new_hub_markup)

    # 탭 3의 토지규제 카드 시작 부분 개편
    old_regulation_markup = """            <!-- 🟢 토지이용계획 및 규제 진단 카드 -->
            <div class="bg-white border border-slate-200 rounded-2xl p-3 sm:p-3.5 space-y-2 shadow-sm">
                <h4 class="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5">
                    <i class="fa-solid fa-leaf text-royalBlue"></i> 🌱 토지이용계획 및 규제 진단
                </h4>"""

    new_regulation_markup = """            </div> <!-- 👈 연동 허브 p-3.5 및 카드 닫기 -->
            </div> <!-- 👈 연동 허브 카드 닫기 보정 -->

            <!-- 🟢 토지이용계획 및 규제 진단 카드 -->
            <div class="bg-white border border-slate-200 rounded-2xl shadow-sm w-full overflow-hidden">
                <div class="bg-slate-50 px-4 py-2.5 border-b border-slate-200">
                    <h4 class="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5">
                        <i class="fa-solid fa-leaf text-royalBlue"></i> 🌱 토지이용계획 및 규제 진단
                    </h4>
                </div>
                <div class="p-3.5 space-y-2.5">"""

    content = content.replace(old_regulation_markup, new_regulation_markup)

    # 토지규제 끝 및 2열 우측 열 시작
    # 토지이음 아웃링크 하단 </div> </div> (토지규제 닫힘) 아래에서
    # 2열 우측 열을 열고 "주변 아파트 실거래 시세 대조" 카드를 매핑합니다.
    old_tab3_col2_markup = """                <a id="btn-official-eum" href="#" onclick="event.preventDefault(); copyAddressAndOpenEum();" class="w-full bg-emeraldSuccess text-white py-2 rounded-xl text-xs font-black hover:bg-emerald-700 transition-all flex items-center justify-center gap-1 select-none cursor-pointer text-center">
                    국토부 토지이음(eum.go.kr) 공식 조회하기
                </a>
                        </div>
                    </div>

                    <div id="detail-panel-market" class="space-y-4 sm:space-y-5">
                        <div class="bg-white border border-slate-200 rounded-2xl p-3 sm:p-3.5 shadow-sm space-y-2.5">
                <div class="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h4 class="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5">
                        <i class="fa-solid fa-tags text-royalBlue"></i> 주변 아파트 실거래 시세 대조
                    </h4>"""

    new_tab3_col2_markup = """                <a id="btn-official-eum" href="#" onclick="event.preventDefault(); copyAddressAndOpenEum();" class="w-full bg-emeraldSuccess text-white py-2 rounded-xl text-xs font-black hover:bg-emerald-700 transition-all flex items-center justify-center gap-1 select-none cursor-pointer text-center">
                    국토부 토지이음(eum.go.kr) 공식 조회하기
                </a>
                        </div>
                    </div>
                    </div> <!-- 👈 토지규제 p-3.5 및 카드 닫기 -->
                    </div> <!-- 👈 2열 왼쪽 열 전체 닫기 -->

                    <!-- 오른쪽 열: 실거래 시세, 매각 통계, [🔮 AI 미래 예상 시세 시뮬레이터] -->
                    <div class="space-y-4 sm:space-y-5 w-full">
                        <!-- 주변 아파트 실거래 시세 대조 -->
                        <div class="bg-white border border-slate-200 rounded-2xl shadow-sm w-full overflow-hidden">
                            <div class="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex justify-between items-center">
                                <h4 class="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5">
                                    <i class="fa-solid fa-tags text-royalBlue"></i> 주변 아파트 실거래 시세 대조
                                </h4>
                                <button onclick="copyAddressToClipboardAndOpenSeeReal()" class="px-2 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 text-[10px] font-black rounded-lg transition-all flex items-center gap-1 select-none cursor-pointer">
                                    <i class="fa-solid fa-copy"></i> 주소복사 & 시세확인 (씨리얼)
                                </button>
                            </div>
                            <div class="p-3.5 space-y-2.5">"""

    content = content.replace(old_tab3_col2_markup, new_tab3_col2_markup)

    # 탭 3의 매각 통계 카드 헤더 개편
    old_stats_markup = """                        <!-- 📊 최근 1년 매각 통계 (입지 & 시세 분석 탭으로 이동 배치) -->
                        <div id="detail-panel-statistics" class="space-y-4 sm:space-y-5">
                            <div class="bg-white border border-slate-200 rounded-2xl p-3 sm:p-3.5 shadow-sm space-y-2 shadow-sm">
                                <h4 class="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-100">
                                    <i class="fa-solid fa-chart-bar text-royalBlue"></i> 해당 법원/용도 최근 1년 매각 통계
                                </h4>"""

    new_stats_markup = """                        </div> <!-- 👈 실거래 p-3.5 및 카드 닫기 -->
                        </div> <!-- 👈 실거래 카드 닫기 보정 -->

                        <!-- 📊 최근 1년 매각 통계 (입지 & 시세 분석 탭으로 이동 배치) -->
                        <div class="bg-white border border-slate-200 rounded-2xl shadow-sm w-full overflow-hidden">
                            <div class="bg-slate-50 px-4 py-2.5 border-b border-slate-200">
                                <h4 class="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5">
                                    <i class="fa-solid fa-chart-bar text-royalBlue"></i> 해당 법원/용도 최근 1년 매각 통계
                                </h4>
                            </div>
                            <div class="p-3.5 space-y-2.5">"""

    content = content.replace(old_stats_markup, new_stats_markup)

    # 탭 3의 매각 통계 닫기 및 [🔮 AI 미래 예상 시세 시뮬레이터] 카드 신설
    # 1746라인 근처의 닫는 div 및 패널 종료부 아래에 미래 시뮬레이터를 삽입하고 전체 2열 그리드를 닫습니다.
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
                    </div> <!-- 👈 2열 오른쪽 열 전체 닫기 -->
                </div> <!-- 👈 2열 그리드 전체 닫기 -->
            </div> <!-- 👈 group-content-3 전체 닫기 -->
            </div> <!-- 👈 detail-panel-market 닫기 보정 -->
            <div id="group-mask-3" """

    content = content.replace(old_tab3_close, new_tab3_close)


    # 4. 미래 예상 시세 연산 자바스크립트 함수 추가 및 loadDetailView 바인딩
    # updateFuturePricePrediction() 구현부 주입
    # loadDetailView(item) 함수 내에 updateFuturePricePrediction() 호출 주입
    # index.html 자바스크립트의 끝자락이나 적절한 곳에 함수를 추가합니다.
    # loadDetailView 함수 내의 마지막 닫는 브레이스 직전에 연동하도록 처리하겠습니다.
    # loadDetailView의 끝을 grep_search로 찾아봅니다. (아래 픽스 파일에서 추가 진행)
    
    try:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)
        print("Successfully refactored index.html layout to responsive 2-column grid and added AI future simulator mockup.")
    except Exception as e:
        print(f"Failed to write index.html: {e}")

if __name__ == "__main__":
    main()
