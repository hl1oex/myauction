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

    # ==================== 1. TAB 1 REORGANIZATION ====================
    tab1_start = '<div id="detail-group-panel-1" class="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 sm:space-y-5 custom-scrollbar bg-slate-50/50">'
    tab1_end = '<!-- 🛡️ [2] 권리분석 탭 패널 (기본 숨김) -->'
    
    start_idx = content.find(tab1_start)
    end_idx = content.find(tab1_end)
    
    if start_idx == -1 or end_idx == -1:
        print("Failed to find Tab 1 wrapper in index.html.")
        return
        
    open_tag_end = start_idx + len(tab1_start)
    
    new_tab1_inner = """
            <div id="group-content-1" class="space-y-4 sm:space-y-5 w-full">
                <!-- 1. 대표 이미지와 부동산 기본 명세 2열 그리드 -->
                <div id="detail-panel-summary" class="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 items-start">
                    <!-- 대표 이미지 영역 (실제 로드뷰 3D) -->
                    <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm w-full">
                        <h4 id="detail-roadview-title" class="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5 mb-2.5">
                            <i class="fa-solid fa-image text-royalBlue"></i> 🏢 부동산 대표 전경 (실제 로드뷰)
                        </h4>
                        <div class="w-full h-[220px] rounded-xl overflow-hidden border border-slate-200 bg-slate-100 relative">
                            <div id="detail-roadview" class="w-full h-full"></div>
                            <div id="detail-roadview-fallback" class="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 p-4 text-center hidden">
                                <img src="./apartment_elegant_facade.png" alt="부동산 전경 폴백" class="absolute inset-0 w-full h-full object-cover opacity-30">
                                <div class="relative z-10 space-y-2">
                                    <p id="detail-roadview-fallback-text" class="text-xs font-black text-slate-700">해당 위치의 로드뷰를 불러올 수 없습니다.</p>
                                    <a id="btn-naver-roadview-fallback" href="#" target="_blank" class="inline-flex items-center gap-1 bg-royalBlue text-white text-[10px] font-black px-2.5 py-1.5 rounded-lg shadow-sm hover:bg-royalHover transition-all">
                                        <i class="fa-solid fa-map-location-dot"></i> 네이버 지도로 확인하기
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 부동산 기본 명세 보드 -->
                    <div id="detail-spec-container" class="bg-white border border-slate-200 rounded-2xl p-4 space-y-2 shadow-sm w-full">
                        <h4 id="detail-spec-title" class="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5">
                            <i class="fa-solid fa-file-invoice text-royalBlue"></i> 📋 부동산 표시 및 기본 명세
                        </h4>
                        <div class="space-y-2.5 text-[11px] sm:text-xs font-bold text-slate-700">
                            <div class="bg-slate-50 border border-slate-100 p-2.5 rounded-xl flex justify-between items-center">
                                <span class="text-slate-450 text-[10px] sm:text-xs font-bold">소재지 주소</span>
                                <span id="detail-doc-address" class="font-extrabold text-slate-800 select-all text-right max-w-[70%] truncate"></span>
                            </div>
                            <div id="detail-spec-grid" class="grid grid-cols-2 gap-2 text-[11px] sm:text-xs text-slate-750">
                                <div class="bg-slate-50 border border-slate-100 p-2 rounded-xl flex justify-between items-center">
                                    <span class="text-slate-450 font-semibold text-[10px] sm:text-xs">부동산 용도</span>
                                    <span id="detail-spec-ptype" class="font-extrabold text-slate-800"></span>
                                </div>
                                <div class="bg-slate-50 border border-slate-100 p-2 rounded-xl flex justify-between items-center">
                                    <span class="text-slate-450 font-semibold text-[10px] sm:text-xs">진행 회차</span>
                                    <span id="detail-spec-round" class="font-extrabold text-slate-800"></span>
                                </div>
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
                                    <span class="text-slate-455 font-semibold text-[10px] sm:text-xs">공급 면적</span>
                                    <span id="detail-spec-supply-py" class="font-extrabold text-slate-800 font-mono"></span>
                                </div>
                                <div class="bg-slate-50 border border-slate-100 p-2 rounded-xl flex justify-between items-center">
                                    <span class="text-slate-450 font-semibold text-[10px] sm:text-xs">토지 대지권</span>
                                    <span id="detail-spec-land-py" class="font-extrabold text-slate-800 font-mono"></span>
                                </div>
                                <div class="bg-slate-50 border border-slate-100 p-2 rounded-xl flex justify-between items-center">
                                    <span class="text-slate-450 font-semibold text-[10px] sm:text-xs">건물 전용</span>
                                    <span id="detail-spec-building-py" class="font-extrabold text-slate-800 font-mono"></span>
                                </div>
                                <div class="bg-slate-50 border border-slate-100 p-2 rounded-xl flex justify-between items-center">
                                    <span class="text-slate-450 font-semibold text-[10px] sm:text-xs">감정평가액</span>
                                    <span id="detail-spec-appraisal" class="font-extrabold text-slate-800 font-outfit"></span>
                                </div>
                                <div class="bg-slate-50 border border-slate-100 p-2 rounded-xl flex justify-between items-center">
                                    <span class="text-slate-450 font-semibold text-[10px] sm:text-xs">최저입찰액</span>
                                    <span id="detail-spec-minimum" class="font-extrabold text-rose-600 font-outfit"></span>
                                </div>
                                <div class="bg-slate-50 border border-slate-100 p-2 rounded-xl flex justify-between items-center col-span-2">
                                    <span class="text-slate-455 font-semibold text-[10px] sm:text-xs">물건 구조/재질</span>
                                    <span id="detail-spec-structure" class="font-extrabold text-slate-800 text-right"></span>
                                </div>
                                <div class="bg-slate-50 border border-slate-100 p-2 rounded-xl flex justify-between items-center col-span-2">
                                    <span class="text-slate-455 font-semibold text-[10px] sm:text-xs">입찰일/마감 여부</span>
                                    <span id="detail-spec-date" class="font-extrabold text-slate-800"></span>
                                </div>
                            </div>
                            <!-- 🏢 다세대 건물 전체 상세 내역 (동적 노출) -->
                            <div id="detail-villa-building-info" class="mt-3 bg-blue-50/50 border border-blue-100 p-3 rounded-xl space-y-2 hidden">
                                <h5 class="text-[11px] sm:text-xs font-black text-slate-800 flex items-center gap-1">
                                    <i class="fa-solid fa-building text-royalBlue"></i> 🏢 다세대 건물 전체 상세 명세
                                </h5>
                                <div class="grid grid-cols-2 gap-2 text-[10px] sm:text-xs">
                                    <div class="bg-white border border-slate-100 p-2 rounded-lg flex justify-between items-center">
                                        <span class="text-slate-450 font-bold">건물 층수</span>
                                        <span id="detail-villa-total-floors" class="font-extrabold text-slate-800"></span>
                                    </div>
                                    <div class="bg-white border border-slate-100 p-2 rounded-lg flex justify-between items-center">
                                        <span class="text-slate-450 font-bold">전체 면적 합계</span>
                                        <span id="detail-villa-total-area" class="font-extrabold text-slate-800"></span>
                                    </div>
                                </div>
                                <div class="bg-white border border-slate-100 p-2 rounded-lg space-y-1">
                                    <span class="text-slate-450 font-bold text-[10px] sm:text-[11px] block mb-1.5">층별 면적 명세</span>
                                    <div id="detail-villa-floor-list" class="grid grid-cols-2 gap-1 text-[10px] sm:text-[11px] text-slate-700 font-mono">
                                        <!-- 층별 명세가 동적으로 주입됨 -->
                                    </div>
                                </div>
                            </div>
                            <!-- 레거시 ID 매칭용 히든 필드 -->
                            <span id="detail-doc-ptype" class="hidden"></span>
                            <span id="detail-doc-no" class="hidden"></span>
                            <span id="detail-doc-appraisal" class="hidden"></span>
                        </div>
                    </div>
                </div>

                <!-- 2. 단지 정보와 평면도/도면 발급 2열 그리드 -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 items-start">
                    <!-- 단지 기본 정보 및 시설 명세 -->
                    <div id="detail-panel-complex" class="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3 w-full">
                        <h4 class="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-100">
                            <i class="fa-solid fa-circle-info text-royalBlue"></i> 단지 기본 정보 및 시설 명세
                        </h4>
                        <div class="overflow-x-auto border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
                            <table class="w-full text-left border-collapse text-[13px] document-view">
                                <tbody id="detail-complex-tbody" class="text-slate-700 font-medium">
                                    <!-- 동적 생성 -->
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- 평면도 및 도면 발급 안내 -->
                    <div id="detail-panel-floorplan" class="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4 w-full">
                        <!-- 내부 평면 이미지 영역 -->
                        <div class="space-y-2">
                            <h4 class="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5 mb-2.5">
                                <i class="fa-solid fa-compass text-royalBlue"></i> 📐 부동산 내부 추정 평면도
                            </h4>
                            <div id="detail-floorplan-img-container" class="w-full h-[220px] rounded-xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center relative cursor-pointer" onclick="openFloorplanModal()" title="클릭하시면 큰 이미지로 보실 수 있습니다.">
                                <img id="detail-floorplan-img" src="./floorplan_modern_apartment.png" alt="부동산 평면도" class="w-full h-full object-contain">
                                <div class="absolute bottom-2 right-2 bg-slate-900/60 text-white text-[9px] px-2 py-1 rounded font-black flex items-center gap-1">
                                    <i class="fa-solid fa-magnifying-glass-plus"></i> 크게 보기
                                </div>
                            </div>
                            <div class="mt-3">
                                <a id="btn-naver-floorplan-link" href="#" target="_blank" class="w-full bg-royalBlue hover:bg-royalHover text-white text-[10.5px] font-black py-2.5 px-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 select-none">
                                    <i class="fa-solid fa-arrow-up-right-from-square"></i> 네이버부동산 단지 실제 평면도 바로 확인하기
                                </a>
                            </div>
                            <div class="mt-2.5">
                                <span class="text-slate-450 font-bold text-[10px] sm:text-[11px] block mb-1.5">🧭 현장 분석용 3대 포털 로드뷰 비교 바로가기</span>
                                <div class="grid grid-cols-3 gap-2">
                                    <a id="btn-floorplan-naver-road" href="#" target="_blank" class="bg-emerald-50 border border-emerald-200 hover:border-emeraldSuccess hover:shadow-md rounded-xl py-2 px-1 flex flex-col items-center justify-center gap-1 transition-all text-[10px] font-black text-slate-700 select-none">
                                        <i class="fa-solid fa-street-view text-emeraldSuccess text-sm"></i> 네이버 로드뷰
                                    </a>
                                    <a id="btn-floorplan-kakao-road" href="#" target="_blank" class="bg-emerald-50 border border-emerald-200 hover:border-amber-500 hover:shadow-md rounded-xl py-2 px-1 flex flex-col items-center justify-center gap-1 transition-all text-[10px] font-black text-slate-700 select-none">
                                        <i class="fa-solid fa-road text-amber-500 text-sm"></i> 카카오 로드뷰
                                    </a>
                                    <a id="btn-floorplan-google-road" href="#" target="_blank" class="bg-blue-50 border border-blue-200 hover:border-royalBlue hover:shadow-md rounded-xl py-2 px-1 flex flex-col items-center justify-center gap-1 transition-all text-[10px] font-black text-slate-700 select-none">
                                        <i class="fa-solid fa-map-location-dot text-royalBlue text-sm"></i> 구글 스트리트뷰
                                    </a>
                                </div>
                            </div>
                        </div>

                        <!-- 평면 정보 가이드 및 도면 발급 안내 -->
                        <div id="detail-floorplan-guide-card" class="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
                            <h4 class="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-200">
                                <i class="fa-solid fa-file-pdf text-royalBlue"></i> 공식 건축물대장 현황도면 발급 안내
                            </h4>
                            <p class="text-[9.5px] text-slate-500 leading-relaxed font-medium">
                                본 평면도는 매물 타입(아파트/오피스텔)에 따른 표준형 3-Bay 구조 추정 도면입니다. 실제 구조는 상이할 수 있어 서류 교차 확인이 요구됩니다.
                            </p>
                            <div class="text-slate-655 space-y-1.5 text-[10px] sm:text-[11px] leading-relaxed font-bold">
                                <div class="flex items-start gap-1">
                                    <span class="text-royalBlue font-black flex-shrink-0">•</span>
                                    <span>낙찰 전 이해관계인 동행 하에 주민센터에서 도면 열람 및 발급이 가능합니다.</span>
                                </div>
                                <div class="flex items-start gap-1">
                                    <span class="text-royalBlue font-black flex-shrink-0">•</span>
                                    <span>낙찰 후에는 낙찰증명서를 지참하여 주민센터 및 정부24를 통해 무료 발급 가능합니다.</span>
                                </div>
                            </div>
                            <a href="https://www.gov.kr/mw/AA020InfoCappView.do?HighCtgCD=A01004001&CappBizCD=15000000098" target="_blank" class="w-full bg-royalBlue text-white py-2 rounded-xl text-xs font-black hover:bg-royalHover transition-all flex items-center justify-center gap-1 select-none cursor-pointer text-center">
                                정부24 건축물대장 현황도면 신청 바로가기
                            </a>
                        </div>
                    </div>
                </div>

                <!-- 3. 경매 기일 이력과 외부 정보 연동/유사 매물 2열 그리드 -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 items-start">
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
                        <div class="bg-white border border-slate-200 rounded-2xl p-4 space-y-2.5 shadow-sm">
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
                            <tbody class="text-slate-700 font-medium">
                                <tr class="border-b border-slate-100 hover:bg-slate-50/40 transition-colors">
                                    <td class="p-3 pl-4 font-extrabold text-slate-850">
                                        <div class="flex flex-col space-y-0.5">
                                            <span class="text-slate-900 text-[12.5px]">📋 감정평가서</span>
                                            <span id="table-doc-appraisal-summary" class="text-[10.5px] text-slate-450 font-bold">공식 자산 감정 보고서</span>
                                        </div>
                                    </td>
                                    <td class="p-3">
                                        <div class="space-y-1 text-[11.5px] sm:text-[12px] font-bold text-slate-600">
                                            <div class="flex justify-between max-w-[240px]"><span>감정 평가 가액</span><strong id="card-appraisal-total" class="text-slate-900 font-extrabold">-</strong></div>
                                            <div class="flex justify-between max-w-[240px]"><span>토지 평가 금액</span><strong id="card-appraisal-land" class="text-slate-700">-</strong></div>
                                            <div class="flex justify-between max-w-[240px]"><span>건물 평가 금액</span><strong id="card-appraisal-building" class="text-slate-700">-</strong></div>
                                            <div class="flex justify-between max-w-[240px]"><span>가격 조사 기일</span><strong id="card-appraisal-date" class="font-mono text-slate-700">-</strong></div>
                                        </div>
                                    </td>
                                    <td class="p-3 text-[11.5px] sm:text-[12px] text-slate-600 font-bold leading-normal" id="card-appraisal-opinion">
                                        -
                                    </td>
                                    <td class="p-3 pr-4 text-right">
                                        <a id="btn-doc-appraisal" href="#" target="_blank" class="inline-block bg-emerald-50 hover:bg-emeraldSuccess text-emeraldSuccess hover:text-white px-2 py-1 rounded font-black text-[11px] transition-colors">조회</a>
                                    </td>
                                </tr>
                                <tr class="border-b border-slate-100 hover:bg-slate-50/40 transition-colors">
                                    <td class="p-3 pl-4 font-extrabold text-slate-850">
                                        <div class="flex flex-col space-y-0.5">
                                            <span class="text-slate-900 text-[12.5px]">🔍 현황조사서</span>
                                            <span id="table-doc-survey-summary" class="text-[10.5px] text-slate-450 font-bold">부동산 점유 실태 기록</span>
                                        </div>
                                    </td>
                                    <td class="p-3">
                                        <div class="space-y-1 text-[11.5px] sm:text-[12px] font-bold text-slate-600">
                                            <div class="flex justify-between max-w-[240px]"><span>부동산 점유 현황</span><strong id="card-survey-occupy" class="text-slate-900 font-extrabold">-</strong></div>
                                            <div class="flex justify-between max-w-[240px]"><span>점유자 성명</span><strong id="card-survey-name" class="text-slate-700">-</strong></div>
                                            <div class="flex justify-between max-w-[240px]"><span>전입 신고 일자</span><strong id="card-survey-date" class="font-mono text-slate-700">-</strong></div>
                                            <div class="flex justify-between max-w-[240px]"><span>기타 안내사항</span><strong id="card-survey-note" class="text-slate-700 truncate max-w-[140px]">-</strong></div>
                                        </div>
                                    </td>
                                    <td class="p-3 text-[11.5px] sm:text-[12px] text-slate-600 font-bold leading-normal" id="card-survey-opinion">
                                        -
                                    </td>
                                    <td class="p-3 pr-4 text-right">
                                        <a id="btn-doc-survey" href="#" target="_blank" class="inline-block bg-blue-50 hover:bg-royalBlue text-royalBlue hover:text-white px-2 py-1 rounded font-black text-[11px] transition-colors">열람</a>
                                    </td>
                                </tr>
                                <tr class="border-b border-slate-100 hover:bg-slate-50/40 transition-colors">
                                    <td class="p-3 pl-4 font-extrabold text-slate-850">
                                        <div class="flex flex-col space-y-0.5">
                                            <span class="text-slate-900 text-[12.5px]">📝 물건명세서</span>
                                            <span id="table-doc-spec-summary" class="text-[10.5px] text-slate-450 font-bold">법원 공인 권리 분석서</span>
                                        </div>
                                    </td>
                                    <td class="p-3">
                                        <div class="space-y-1 text-[11.5px] sm:text-[12px] font-bold text-slate-600">
                                            <div class="flex justify-between max-w-[240px]"><span>최초 설정 근저당</span><strong id="card-spec-malso" class="text-slate-900 font-extrabold">-</strong></div>
                                            <div class="flex justify-between max-w-[240px]"><span>임차인 대항력 여부</span><strong id="card-spec-daehang" class="font-black">-</strong></div>
                                            <div class="flex justify-between max-w-[240px]"><span>배당요구 신청 여부</span><strong id="card-spec-baedang" class="text-slate-700">-</strong></div>
                                            <div class="flex justify-between max-w-[240px]"><span>특별 매각 조건</span><strong id="card-spec-special" class="text-slate-700">-</strong></div>
                                        </div>
                                    </td>
                                    <td class="p-3 text-[11.5px] sm:text-[12px] text-slate-600 font-bold leading-normal" id="card-spec-opinion">
                                        -
                                    </td>
                                    <td class="p-3 pr-4 text-right">
                                        <a id="btn-doc-spec" href="#" target="_blank" class="inline-block bg-blue-50 hover:bg-royalBlue text-royalBlue hover:text-white px-2 py-1 rounded font-black text-[11px] transition-colors">확인</a>
                                    </td>
                                </tr>
                                <tr class="hover:bg-slate-50/40 transition-colors">
                                    <td class="p-3 pl-4 font-extrabold text-slate-850">
                                        <div class="flex flex-col space-y-0.5">
                                            <span class="text-slate-900 text-[12.5px]">⚖️ 사건내역</span>
                                            <span id="table-doc-history-summary" class="text-[10.5px] text-slate-450 font-bold">전체 경매 진행 사건 정보</span>
                                        </div>
                                    </td>
                                    <td class="p-3">
                                        <div class="space-y-1 text-[11.5px] sm:text-[12px] font-bold text-slate-600">
                                            <div class="flex justify-between max-w-[240px]"><span>경매 개시 결정</span><strong id="card-history-start" class="text-slate-900 font-extrabold">-</strong></div>
                                            <div class="flex justify-between max-w-[240px]"><span>배당요구 종기 기한</span><strong id="card-history-end" class="font-mono text-slate-700">-</strong></div>
                                            <div class="flex justify-between max-w-[240px]"><span>경매 진행 상태</span><strong id="card-history-status" class="text-slate-700">-</strong></div>
                                            <div class="flex justify-between max-w-[240px]"><span>최저 매각 비율</span><strong id="card-history-ratio" class="text-slate-700">-</strong></div>
                                        </div>
                                    </td>
                                    <td class="p-3 text-[11.5px] sm:text-[12px] text-slate-600 font-bold leading-normal" id="card-history-opinion">
                                        -
                                    </td>
                                    <td class="p-3 pr-4 text-right">
                                        <a id="btn-doc-history" href="#" target="_blank" class="inline-block bg-blue-50 hover:bg-royalBlue text-royalBlue hover:text-white px-2 py-1 rounded font-black text-[11px] transition-colors">이동</a>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            """
    
    # 덮어쓰기
    content = content[:open_tag_end] + new_tab1_inner + content[end_idx:]
    print("Tab 1 updated successfully.")

    # ==================== 2. TAB 2 REORGANIZATION ====================
    # 탭 2의 시작과 끝
    tab2_start = '<div id="detail-group-panel-2" class="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 sm:space-y-5 custom-scrollbar bg-slate-50/50 hidden relative">'
    tab2_end = '<!-- 📈 [8] 매각통계 탭 패널 (기본 숨김) -->'
    
    start_idx_2 = content.find(tab2_start)
    end_idx_2 = content.find(tab2_end)
    
    if start_idx_2 == -1 or end_idx_2 == -1:
        print("Failed to find Tab 2 wrapper in index.html.")
        return
        
    open_tag_end_2 = start_idx_2 + len(tab2_start)
    
    new_tab2_inner = """
            <div id="group-content-2" class="space-y-4 sm:space-y-5 w-full">
                <!-- AI 7대 권리 리스크 및 공고문 2열 그리드 -->
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
                </div>

                <!-- 임차인 및 등기부 2열 그리드 -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 items-start">
                    <!-- 🚪 [6] 점유현황 탭 패널 (기본 숨김) -->
                    <div id="detail-panel-occupancy" class="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3 w-full">
                        <h4 class="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-100">
                            <i class="fa-solid fa-door-closed text-royalBlue"></i> 임차인 및 점유자 관계 명세
                        </h4>
                        <div class="overflow-x-auto border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
                            <table class="w-full text-left border-collapse text-[13px] document-view">
                                <thead>
                                    <tr class="bg-slate-50 border-b border-slate-200 text-slate-800 font-extrabold text-[12px]">
                                        <th class="p-3 pl-4 border-b">점유자 구분</th>
                                        <th class="p-3 border-b">전입일자</th>
                                        <th class="p-3 border-b">확정일자</th>
                                        <th class="p-3 border-b text-right">보증금/차임</th>
                                        <th class="p-3 pr-4 border-b text-center">대항력</th>
                                    </tr>
                                </thead>
                                <tbody id="detail-occupancy-tbody" class="text-slate-700 font-medium">
                                    <!-- 동적 생성 -->
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- 📝 [7] 등기현황 탭 패널 (기본 숨김) -->
                    <div id="detail-panel-registry" class="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3 w-full">
                        <h4 class="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-100">
                            <i class="fa-solid fa-book-open text-royalBlue"></i> 등기부등본 주요 권리 설정 요약
                        </h4>
                        <div class="overflow-x-auto border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
                            <table class="w-full text-left border-collapse text-[13px] document-view">
                                <thead>
                                    <tr class="bg-slate-50 border-b border-slate-200 text-slate-800 font-extrabold text-[12px]">
                                        <th class="p-3 pl-4 border-b">구분</th>
                                        <th class="p-3 border-b">등기목적</th>
                                        <th class="p-3 border-b">접수일자</th>
                                        <th class="p-3 border-b">권리자 및 채권액</th>
                                        <th class="p-3 pr-4 border-b text-center">낙찰후 효력</th>
                                    </tr>
                                </thead>
                                <tbody id="detail-registry-tbody" class="text-slate-700 font-medium">
                                    <!-- 동적 생성 -->
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- 낙찰자 인수 리스크 분석 (단독 1열 배치) -->
                <div id="detail-panel-takeover" class="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3 w-full">
                    <h4 class="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-100">
                        <i class="fa-solid fa-triangle-exclamation text-rose-600"></i> 낙찰자 인수 리스크 분석
                    </h4>
                    <div class="overflow-x-auto border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
                        <table class="w-full text-left border-collapse text-[13px] document-view">
                            <thead>
                                <tr class="bg-slate-50 border-b border-slate-200 text-slate-800 font-extrabold text-[12px]">
                                    <th class="p-3 pl-4 border-b">위험 항목</th>
                                    <th class="p-3 border-b">권리 내용</th>
                                    <th class="p-3 border-b text-right">예상 인수액</th>
                                    <th class="p-3 pr-4 border-b">진단 및 의견</th>
                                </tr>
                            </thead>
                            <tbody id="detail-takeover-tbody" class="text-slate-700 font-medium">
                                <!-- 동적 생성 -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            """
    content = content[:open_tag_end_2] + new_tab2_inner + content[end_idx_2:]
    print("Tab 2 updated successfully.")

    # ==================== 3. TAB 3 WIDTH RESTRICTION ====================
    content = content.replace(
        'id="group-content-3" class="space-y-4 sm:space-y-5 max-w-[720px] mx-auto w-full"',
        'id="group-content-3" class="space-y-4 sm:space-y-5 w-full"'
    )
    print("Tab 3 width restriction removed.")

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

    print("File index.html updated successfully.")

if __name__ == "__main__":
    main()
