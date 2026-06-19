# -*- coding: utf-8 -*-
# admin.html 파일의 종합 고도화 수정을 위한 파이썬 자동화 스크립트

import re

with open('admin.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 줄바꿈 통일
content = content.replace('\r\n', '\n')

# 1. panel-ad-tab 전체 교체
# 시작: <!-- 📢 1. 광고자산 비주얼 매니저 탭 -->
# 끝: <!-- 👥 2. 고객 등급 권한 매니저 탭 -->
# 1:1 레이아웃, 2분할 1.5배 미니맵, Opacity 보정 슬라이더 포함
ad_tab_pattern = re.compile(r'<!-- 📢 1\. 광고자산 비주얼 매니저 탭 -->[\s\S]*?<!-- 👥 2\. 고객 등급 권한 매니저 탭 -->')

ad_tab_replacement = """<!-- 📢 1. 광고자산 비주얼 매니저 탭 -->
            <div id="panel-ad-tab" class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5">
                <div class="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h2 class="text-base font-extrabold text-slate-900 flex items-center gap-2">
                            <i class="fa-solid fa-rectangle-ad text-royalBlue"></i> 정밀 타겟 광고 구좌 관리자
                        </h2>
                        <p class="text-[10px] text-slate-400 font-bold mt-0.5">상단 메인, 검색필터 하단, 매물 목록 피드 및 상세페이지 상하단 구좌를 통합 제어합니다.</p>
                    </div>
                    
                    <div class="flex items-center gap-3">
                        <div>
                            <select id="ad-slot-select" onchange="onAdSlotChange()" class="text-xs font-black p-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none">
                                <option value="list_banner">📰 매물 목록 피드 중간 광고 (list_banner)</option>
                                <option value="main_top_banner">🏢 페이지 상단 메인 광고 (main_top_banner)</option>
                                <option value="sidebar_filter_banner">📂 왼쪽 검색필터 아래 광고 (sidebar_filter_banner)</option>
                                <option value="detail_top_banner">상세페이지 상단 광고 (detail_top_banner)</option>
                                <option value="detail_bottom_banner">상세페이지 하단 광고 (detail_bottom_banner)</option>
                            </select>
                        </div>
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" id="ad-toggle" class="sr-only peer" onchange="saveAdStatus()">
                            <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-royalBlue"></div>
                            <span class="ml-2.5 text-xs font-black text-slate-700" id="ad-toggle-label">비활성</span>
                        </label>
                    </div>
                </div>

                <!-- 💎 좌측 광고 설정/Canvas 툴 및 우측 가이드/미니맵/에뮬레이터 1:1 대칭 그리드 -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                    <!-- ◀️ 좌측 영역: 광고 설정 폼 및 Canvas 편집기 -->
                    <div class="space-y-4">
                        <div>
                            <label class="block text-xs font-black text-slate-700 mb-1.5">광고 송출 형태 선택</label>
                            <div class="flex gap-4">
                                <label class="inline-flex items-center cursor-pointer">
                                    <input type="radio" name="ad_type" value="direct" checked class="text-royalBlue focus:ring-royalBlue" onchange="toggleFormFields('direct')">
                                    <span class="ml-2 text-xs font-black text-slate-700">🎨 직접 유치 광고 배너</span>
                                </label>
                                <label class="inline-flex items-center cursor-pointer">
                                    <input type="radio" name="ad_type" value="adsense" class="text-royalBlue focus:ring-royalBlue" onchange="toggleFormFields('adsense')">
                                    <span class="ml-2 text-xs font-black text-slate-700">⚙️ 구글 애드센스 코드</span>
                                </label>
                            </div>
                        </div>

                        <!-- 직접 유치 광고 필드 -->
                        <div id="direct-fields" class="space-y-3">
                            <div>
                                <label class="block text-[11px] font-black text-slate-500 mb-1">광고 타이틀</label>
                                <input type="text" id="ad-title" oninput="updatePreview('direct')" class="w-full text-xs font-bold p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-royalBlue outline-none" placeholder="예: ★ 프리미엄 경공매 투자 VIP 멤버십 모집">
                            </div>
                            <div>
                                <label class="block text-[11px] font-black text-slate-500 mb-1">광고 상세 설명</label>
                                <textarea id="ad-desc" rows="2" oninput="updatePreview('direct')" class="w-full text-xs font-bold p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-royalBlue outline-none" placeholder="예: 오직 1%를 위한 NPL 부실채권 및 지분 경매 핵심 노하우 단독 공개."></textarea>
                            </div>
                            <div>
                                <label class="block text-[11px] font-black text-slate-500 mb-1">배너 이미지 파일 주소 (URL)</label>
                                <div class="flex gap-2">
                                    <input type="text" id="ad-image-url" oninput="updatePreview('direct')" class="flex-1 text-xs font-bold p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-royalBlue outline-none" placeholder="예: ./apartment_elegant_facade.png">
                                    <button type="button" onclick="openImageExplorer()" class="bg-slate-800 hover:bg-slate-700 text-white text-[10.5px] font-black px-3.5 rounded-xl transition-all select-none">탐색기</button>
                                </div>
                                <span class="text-[9.5px] text-slate-400 font-bold block mt-1">💡 권장 이미지 크기: 가로 800px * 세로 260px (또는 3:1 비율) / 대형 카드 렌더링에 최적화되어 있습니다.</span>
                            </div>
                            
                            <!-- 🎨 배너 직접 업로드 및 Canvas 기반 꾸미기/보정 툴 섹션 -->
                            <div class="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-3">
                                <strong class="text-xs font-black text-slate-700 block"><i class="fa-solid fa-wand-magic-sparkles text-amber-500"></i> 배너 이미지 직접 업로드 및 꾸미기/보정 툴</strong>
                                <div class="flex flex-wrap gap-2">
                                    <input type="file" id="ad-image-file-input" class="hidden" accept="image/*" onchange="loadUploadedImage(event)">
                                    <button type="button" onclick="document.getElementById('ad-image-file-input').click()" class="bg-royalBlue hover:bg-royalHover text-white text-[10.5px] font-black px-3.5 py-2 rounded-xl transition-all select-none shadow-sm flex items-center gap-1.5">
                                        <i class="fa-solid fa-file-image"></i> 내 PC 이미지 업로드
                                    </button>
                                    <button type="button" onclick="openCanvasEditor()" id="btn-open-canvas" class="hidden bg-slate-800 hover:bg-slate-700 text-white text-[10.5px] font-black px-3.5 py-2 rounded-xl transition-all select-none flex items-center gap-1.5">
                                        <i class="fa-solid fa-crop-simple"></i> 이미지 편집툴 열기
                                    </button>
                                </div>

                                <!-- AI 카피 브레인스토밍 제안 영역 -->
                                <div class="space-y-2 mt-1">
                                    <div id="ai-copy-loader" class="hidden flex flex-col items-center justify-center p-5 bg-white border border-slate-200 rounded-xl space-y-2">
                                        <div class="w-6 h-6 border-4 border-royalBlue border-t-transparent rounded-full animate-spin"></div>
                                        <p class="text-[10px] text-slate-500 font-bold">🤖 AI가 배너 이미지를 분석하여 적합한 카피라이팅을 추정 중입니다...</p>
                                    </div>
                                    <div id="ai-copy-suggestions-container" class="hidden bg-white border border-slate-200 p-3 rounded-2xl space-y-2.5">
                                        <h5 class="text-[10px] font-black text-royalBlue flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                                            <i class="fa-solid fa-robot"></i> 🤖 AI 분석 추천 광고 카피 제안 (원클릭 자동적용)
                                        </h5>
                                        <div id="ai-copy-list" class="space-y-2">
                                            <!-- JS에서 동적으로 카드 삽입 -->
                                        </div>
                                    </div>
                                </div>

                                <!-- 이미지 보정/꾸미기 Canvas 에디터 본체 패널 (기본 숨김) -->
                                <div id="canvas-editor-panel" class="hidden bg-white border border-slate-200 p-3.5 rounded-2xl space-y-4">
                                    <h4 class="text-xs font-black text-slate-800 border-b border-slate-100 pb-2 flex items-center justify-between">
                                        <span>🛠️ 실시간 배너 Canvas 편집기</span>
                                        <button type="button" onclick="closeCanvasEditor()" class="text-slate-400 hover:text-slate-600"><i class="fa-solid fa-xmark text-sm"></i></button>
                                    </h4>

                                    <!-- Canvas 뷰 -->
                                    <div class="flex justify-center border border-slate-200 bg-slate-50 p-2 rounded-xl">
                                        <canvas id="ad-edit-canvas" width="800" height="260" class="max-w-full h-auto border border-slate-300 rounded-lg shadow-inner bg-slate-200"></canvas>
                                    </div>

                                    <!-- 보정 슬라이더 그리드 -->
                                    <div class="grid grid-cols-2 gap-3 text-[10px] font-bold text-slate-600 bg-slate-50 p-3 rounded-xl">
                                        <div class="space-y-1">
                                            <div class="flex justify-between">
                                                <span>☀️ 이미지 밝기 (Brightness)</span>
                                                <span id="val-brightness">100%</span>
                                            </div>
                                            <input type="range" id="slider-brightness" min="50" max="150" value="100" class="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-royalBlue" oninput="applyFiltersToCanvas()">
                                        </div>
                                        <div class="space-y-1">
                                            <div class="flex justify-between">
                                                <span>🌓 이미지 대비 (Contrast)</span>
                                                <span id="val-contrast">100%</span>
                                            </div>
                                            <input type="range" id="slider-contrast" min="50" max="150" value="100" class="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-royalBlue" oninput="applyFiltersToCanvas()">
                                        </div>
                                        <div class="space-y-1">
                                            <div class="flex justify-between">
                                                <span>🌈 이미지 채도 (Saturation)</span>
                                                <span id="val-saturation">100%</span>
                                            </div>
                                            <input type="range" id="slider-saturation" min="50" max="150" value="100" class="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-royalBlue" oninput="applyFiltersToCanvas()">
                                        </div>
                                        <div class="space-y-1">
                                            <div class="flex justify-between">
                                                <span>🔄 이미지 회전 (Rotation)</span>
                                                <span id="val-rotation">0°</span>
                                            </div>
                                            <input type="range" id="slider-rotation" min="0" max="360" value="0" class="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-royalBlue" oninput="applyFiltersToCanvas()">
                                        </div>
                                        <div class="space-y-1">
                                            <div class="flex justify-between">
                                                <span>👁️ 불투명도 (Opacity)</span>
                                                <span id="val-opacity">100%</span>
                                            </div>
                                            <input type="range" id="slider-opacity" min="0" max="100" value="100" class="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-royalBlue" oninput="applyFiltersToCanvas()">
                                        </div>
                                    </div>

                                    <!-- 텍스트 오버레이 꾸미기 컨트롤 -->
                                    <div class="space-y-3 bg-slate-50/50 border border-slate-100 p-3 rounded-xl text-[10px] font-bold text-slate-600">
                                        <h5 class="text-xs font-black text-slate-700 flex items-center gap-1.5 mb-1 pb-1.5 border-b border-slate-100">
                                            <i class="fa-solid fa-font text-royalBlue"></i> 🔤 텍스트 꾸미기 및 합성 레이어
                                        </h5>
                                        <div class="grid grid-cols-2 gap-3">
                                            <div class="col-span-2">
                                                <label class="block mb-1">합성할 글자 내용</label>
                                                <input type="text" id="canvas-text-content" value="VIP 특별 회원 대모집" class="w-full text-xs font-bold p-2 border border-slate-200 rounded-lg outline-none" oninput="drawCanvasText()">
                                            </div>
                                            <div>
                                                <label class="block mb-1">글자 크기 (Font Size)</label>
                                                <input type="number" id="canvas-text-size" value="32" class="w-full text-xs font-bold p-2 border border-slate-200 rounded-lg outline-none" oninput="drawCanvasText()">
                                            </div>
                                            <div>
                                                <label class="block mb-1">글자 색상 (Color)</label>
                                                <div class="flex gap-1.5 items-center">
                                                    <input type="color" id="canvas-text-color" value="#ffffff" class="w-8 h-8 rounded cursor-pointer border border-slate-200" oninput="drawCanvasText()">
                                                    <input type="text" id="canvas-text-color-hex" value="#ffffff" class="flex-1 text-xs font-bold p-1.5 border border-slate-200 rounded-lg outline-none text-center" oninput="document.getElementById('canvas-text-color').value = this.value; drawCanvasText()">
                                                </div>
                                            </div>
                                            <div>
                                                <label class="block mb-1">글자 가로 위치 (X좌표 %)</label>
                                                <input type="range" id="canvas-text-x" min="0" max="100" value="10" class="w-full h-1 bg-slate-200 rounded-lg cursor-pointer accent-royalBlue" oninput="drawCanvasText()">
                                            </div>
                                            <div>
                                                <label class="block mb-1">글자 세로 위치 (Y좌표 %)</label>
                                                <input type="range" id="canvas-text-y" min="0" max="100" value="65" class="w-full h-1 bg-slate-200 rounded-lg cursor-pointer accent-royalBlue" oninput="drawCanvasText()">
                                            </div>
                                            
                                            <!-- 음영 및 테두리 상세 수정 -->
                                            <div>
                                                <label class="block mb-1">글자 테두리 두께 (Stroke Width)</label>
                                                <input type="number" id="canvas-text-stroke-width" value="4" class="w-full text-xs font-bold p-2 border border-slate-200 rounded-lg outline-none" oninput="drawCanvasText()">
                                            </div>
                                            <div>
                                                <label class="block mb-1">글자 테두리 색상</label>
                                                <div class="flex gap-1.5 items-center">
                                                    <input type="color" id="canvas-text-stroke-color" value="#000000" class="w-8 h-8 rounded cursor-pointer border border-slate-200" oninput="drawCanvasText()">
                                                    <input type="text" id="canvas-text-stroke-hex" value="#000000" class="flex-1 text-xs font-bold p-1.5 border border-slate-200 rounded-lg outline-none text-center" oninput="document.getElementById('canvas-text-stroke-color').value = this.value; drawCanvasText()">
                                                </div>
                                            </div>
                                            <div>
                                                <label class="block mb-1">글자 음영 두께 (Shadow Blur)</label>
                                                <input type="number" id="canvas-text-shadow-blur" value="8" class="w-full text-xs font-bold p-2 border border-slate-200 rounded-lg outline-none" oninput="drawCanvasText()">
                                            </div>
                                            <div>
                                                <label class="block mb-1">글자 음영 색상</label>
                                                <div class="flex gap-1.5 items-center">
                                                    <input type="color" id="canvas-text-shadow-color" value="#000000" class="w-8 h-8 rounded cursor-pointer border border-slate-200" oninput="drawCanvasText()">
                                                    <input type="text" id="canvas-text-shadow-hex" value="#000000" class="flex-1 text-xs font-bold p-1.5 border border-slate-200 rounded-lg outline-none text-center" oninput="document.getElementById('canvas-text-shadow-color').value = this.value; drawCanvasText()">
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- 적용 버튼 -->
                                    <div class="flex gap-2 justify-end">
                                        <button type="button" onclick="closeCanvasEditor()" class="bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10.5px] font-black px-3.5 py-2.5 rounded-xl transition-all select-none">편집 취소</button>
                                        <button type="button" onclick="applyCanvasToAdUrl()" class="bg-emeraldSuccess hover:bg-emerald-700 text-white text-[10.5px] font-black px-4 py-2.5 rounded-xl transition-all select-none shadow-sm">꾸민 이미지 최종 적용하기</button>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label class="block text-[11px] font-black text-slate-500 mb-1">클릭 시 랜딩 연결 주소 (URL)</label>
                                <input type="text" id="ad-link-url" oninput="updatePreview('direct')" class="w-full text-xs font-bold p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-royalBlue outline-none" placeholder="예: https://www.courtauction.go.kr">
                            </div>
                        </div>

                        <!-- 애드센스 광고 필드 -->
                        <div id="adsense-fields" class="space-y-3 hidden">
                            <div>
                                <label class="block text-[11px] font-black text-slate-500 mb-1">애드센스 HTML 스크립트 코드</label>
                                <textarea id="ad-code" rows="5" oninput="updatePreview('adsense')" class="w-full text-xs font-mono p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-royalBlue outline-none" placeholder='<!-- AdSense Code --><ins class="adsbygoogle" style="display:block" data-ad-format="fluid"...></ins>'></textarea>
                            </div>
                        </div>
                    </div>

                    <!-- ▶️ 우측 영역: 가이드, 2분할 1.5배 레이아웃 미니맵, 실시간 에뮬레이터 미리보기 -->
                    <div class="space-y-6">
                        <!-- 1. 실시간 도움말 및 가이드 -->
                        <div class="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex flex-col justify-between text-[11.5px] font-semibold text-slate-600 leading-relaxed shadow-sm">
                            <div class="space-y-2">
                                <strong class="text-slate-800 block text-xs font-black"><i class="fa-solid fa-info-circle text-royalBlue"></i> 광고 관리 가이드</strong>
                                <p>1. 광고 활성 스위치를 켜면 매물 추천 피드 리스트 중간에 광고판 카드가 즉시 생성됩니다.</p>
                                <p>2. 직접 유치 광고는 로컬에 보관 중인 이미지 경로(`./apartment_elegant_facade.png`)나 외부 이미지 링크 모두 정상적으로 지원됩니다.</p>
                                <p>3. 애드센스로 전환 시 애드센스 자바스크립트 스크립트 블록이 삽입되어 광고 서비스가 자동으로 연동됩니다.</p>
                                <p>4. 상세페이지 상하단 구좌를 활용하여 매물 분석 화면 진입 고객들에게 집중적으로 광고 타겟팅 노출을 진행할 수 있습니다.</p>
                            </div>
                            <button onclick="saveAdSettings()" class="w-full bg-royalBlue hover:bg-royalHover text-white text-xs font-black py-2.5 px-4 rounded-xl shadow-md transition-all select-none mt-4">
                                <i class="fa-solid fa-save"></i> 광고 설정 업데이트 적용
                            </button>
                        </div>

                        <!-- 2. 광고 노출 구좌 위치 레이아웃 미니맵 (2분할 1.5배) -->
                        <div class="space-y-3">
                            <h3 class="text-xs font-black text-slate-700 flex items-center gap-1.5"><i class="fa-solid fa-map-location-dot text-royalBlue"></i> 광고 노출 구좌 위치 레이아웃 미니맵 (1.5배 확대)</h3>
                            <div class="border border-slate-200 bg-slate-50/50 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-center gap-4 min-h-[280px]">
                                <!-- 1) 메인 피드 모형 -->
                                <div class="w-full max-w-[220px] border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm flex flex-col text-[8.5px] transition-all hover:shadow-md">
                                    <!-- 상단 탭/주소창 모형 -->
                                    <div class="bg-slate-100 border-b border-slate-200 px-3 py-1.5 flex items-center gap-1.5 select-none">
                                        <div class="flex gap-1">
                                            <span class="w-1.5 h-1.5 rounded-full bg-rose-400 block"></span>
                                            <span class="w-1.5 h-1.5 rounded-full bg-amber-400 block"></span>
                                            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 block"></span>
                                        </div>
                                        <div class="bg-white border border-slate-200 rounded px-2 py-0.5 flex-1 text-center font-mono text-[7px] text-slate-400 select-all truncate">
                                            action-b8c75.web.app/
                                        </div>
                                    </div>
                                    <!-- 헤더 모형 -->
                                    <div class="bg-slate-900 text-white p-2 flex items-center justify-between border-b border-slate-200 select-none">
                                        <span class="font-extrabold flex items-center gap-0.5">🏡 메인추천</span>
                                        <div class="w-10 h-2 bg-slate-800 rounded-full"></div>
                                    </div>
                                    <!-- 컨텐츠 바디 모형 -->
                                    <div class="p-2 space-y-1.5 bg-slate-50 flex flex-col flex-grow select-none min-h-[160px]">
                                        <!-- 1. main_top_banner 구좌 -->
                                        <div id="minimap-main-top" onclick="selectSlotFromMinimap('main_top_banner')" class="border border-slate-200 rounded bg-white text-center py-1 font-black text-slate-450 hover:bg-amber-50 hover:border-amber-400 cursor-pointer transition-all duration-300">
                                            🏢 상단 광고 (main_top)
                                        </div>
                                        <!-- 2열 그리드 바디 -->
                                        <div class="flex gap-1.5 h-[110px]">
                                            <!-- 좌측 사이드바 필터 모형 -->
                                            <div class="w-[35%] border border-slate-200 rounded bg-white p-1 flex flex-col justify-between">
                                                <div class="space-y-1">
                                                    <div class="h-2 bg-slate-100 rounded"></div>
                                                    <div class="h-2 bg-slate-100 rounded w-4/5"></div>
                                                </div>
                                                <!-- 2. sidebar_filter_banner 구좌 -->
                                                <div id="minimap-sidebar" onclick="selectSlotFromMinimap('sidebar_filter_banner')" class="border border-slate-200 rounded bg-white text-center py-2 text-[7px] font-black text-slate-450 hover:bg-amber-50 hover:border-amber-400 cursor-pointer transition-all duration-300 flex flex-col justify-center leading-tight">
                                                    📂 필터 아래<br>광고
                                                </div>
                                            </div>
                                            <!-- 우측 매물 리스트 피드 모형 -->
                                            <div class="flex-grow border border-slate-200 rounded bg-white p-1 flex flex-col gap-1 overflow-hidden">
                                                <div class="h-6 border border-slate-100 rounded-lg bg-slate-50 flex items-center px-1.5 justify-between">
                                                    <div class="w-8 h-2 bg-slate-200 rounded"></div>
                                                </div>
                                                <!-- 3. list_banner 구좌 -->
                                                <div id="minimap-list" onclick="selectSlotFromMinimap('list_banner')" class="border border-slate-200 rounded bg-white text-center py-1.5 font-black text-slate-450 hover:bg-amber-50 hover:border-amber-400 cursor-pointer transition-all duration-300">
                                                    📰 피드 광고 (list_banner)
                                                </div>
                                                <div class="h-6 border border-slate-100 rounded-lg bg-slate-50 flex items-center px-1.5 justify-between">
                                                    <div class="w-8 h-2 bg-slate-200 rounded"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- 2) 상세페이지 모형 -->
                                <div class="w-full max-w-[220px] border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm flex flex-col text-[8.5px] transition-all hover:shadow-md">
                                    <!-- 상단 탭/주소창 모형 -->
                                    <div class="bg-slate-100 border-b border-slate-200 px-3 py-1.5 flex items-center gap-1.5 select-none">
                                        <div class="flex gap-1">
                                            <span class="w-1.5 h-1.5 rounded-full bg-rose-400 block"></span>
                                            <span class="w-1.5 h-1.5 rounded-full bg-amber-400 block"></span>
                                            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 block"></span>
                                        </div>
                                        <div class="bg-white border border-slate-200 rounded px-2 py-0.5 flex-1 text-center font-mono text-[7px] text-slate-400 select-all truncate">
                                            action-b8c75.web.app/detail
                                        </div>
                                    </div>
                                    <!-- 헤더 모형 -->
                                    <div class="bg-slate-900 text-white p-2 flex items-center justify-between border-b border-slate-200 select-none">
                                        <span class="font-extrabold flex items-center gap-0.5">🏡 매물상세</span>
                                        <div class="w-10 h-2 bg-slate-800 rounded-full"></div>
                                    </div>
                                    <!-- 컨텐츠 바디 모형 -->
                                    <div class="p-2 space-y-1.5 bg-slate-50 flex flex-col flex-grow select-none min-h-[160px] justify-between">
                                        <!-- 4. detail_top_banner 구좌 -->
                                        <div id="minimap-detail-top" onclick="selectSlotFromMinimap('detail_top_banner')" class="border border-slate-200 rounded bg-white text-center py-1 font-black text-slate-450 hover:bg-amber-50 hover:border-amber-400 cursor-pointer transition-all duration-300">
                                            🏢 상세 상단 광고 (detail_top)
                                        </div>
                                        
                                        <!-- 내용 모형 -->
                                        <div class="border border-slate-200 rounded bg-white p-1.5 flex flex-col gap-1">
                                            <div class="h-2 bg-slate-100 rounded w-full"></div>
                                            <div class="h-2 bg-slate-100 rounded w-5/6"></div>
                                            <div class="h-2 bg-slate-100 rounded w-4/5"></div>
                                        </div>

                                        <!-- 5. detail_bottom_banner 구좌 -->
                                        <div id="minimap-detail-bottom" onclick="selectSlotFromMinimap('detail_bottom_banner')" class="border border-slate-200 rounded bg-white text-center py-1 font-black text-slate-450 hover:bg-amber-50 hover:border-amber-400 cursor-pointer transition-all duration-300">
                                            🏢 상세 하단 광고 (detail_bottom)
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- 3. 실시간 광고 노출 에뮬레이터 미리보기 -->
                        <div class="space-y-3">
                            <h3 class="text-xs font-black text-slate-700 flex items-center gap-1.5"><i class="fa-solid fa-desktop text-royalBlue"></i> 실시간 광고 노출 에뮬레이터 미리보기</h3>
                            <div class="border border-slate-200 bg-slate-50/50 p-4 rounded-2xl flex justify-center items-center min-h-[260px] shadow-inner">
                                <!-- 실제 매물 카드와 100% 동일 규격의 광고 목업 -->
                                <div id="ad-preview-card" class="w-[300px] min-h-[340px] bg-white border border-slate-200 rounded-2xl p-3 shadow-sm relative overflow-hidden transition-all hover:shadow-md flex flex-col justify-between">
                                    <!-- 광고 내용 렌더러 -->
                                    <div id="ad-preview-container" class="flex-1 flex flex-col justify-between h-full">
                                        <div class="text-center py-10">
                                            <p class="text-xs text-slate-400 font-bold">광고 정보가 로드되지 않았습니다.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <!-- 👥 2. 고객 등급 권한 매니저 탭 -->"""

content = ad_tab_pattern.sub(ad_tab_replacement, content)

# 2. updateMinimapHighlight 복구 및 selectSlotFromMinimap 재설정
# 시작: // 미니맵 노출 하이라이트 제어 혹은 그 부근
# function updateMinimapHighlight(slotName) { ... } 의 형상 주입
minimap_js_pattern = re.compile(r'// 미니맵 노출 하이라이트 제어[\s\S]*?function\s+selectSlotFromMinimap\s*\(\s*slotName\s*\)\s*\{[\s\S]*?\}[\s\S]*?\}')

minimap_js_replacement = """// 미니맵 노출 하이라이트 제어
        function updateMinimapHighlight(slotName) {
            const slots = ["main_top_banner", "sidebar_filter_banner", "list_banner", "detail_top_banner", "detail_bottom_banner"];
            const mapping = {
                "main_top_banner": "minimap-main-top",
                "sidebar_filter_banner": "minimap-sidebar",
                "list_banner": "minimap-list",
                "detail_top_banner": "minimap-detail-top",
                "detail_bottom_banner": "minimap-detail-bottom"
            };

            slots.forEach(s => {
                const el = document.getElementById(mapping[s]);
                if (el) {
                    if (s === slotName) {
                        el.className = "border-2 border-amber-500 bg-amber-50 text-center py-2 text-[8.5px] font-black text-amber-700 animate-pulse cursor-pointer transition-all duration-300 rounded";
                        if (s === "sidebar_filter_banner") {
                            el.className = "border-2 border-amber-500 bg-amber-50 text-center py-2.5 text-[8px] font-black text-amber-700 animate-pulse cursor-pointer transition-all duration-300 rounded flex flex-col justify-center leading-tight";
                        }
                    } else {
                        el.className = "border border-slate-200 rounded bg-white text-center py-1 font-black text-slate-450 hover:bg-amber-50 hover:border-amber-400 cursor-pointer transition-all duration-300";
                        if (s === "sidebar_filter_banner") {
                            el.className = "border border-slate-200 rounded bg-white text-center py-2.5 text-[7.5px] font-black text-slate-450 hover:bg-amber-50 hover:border-amber-400 cursor-pointer transition-all duration-300 flex flex-col justify-center leading-tight";
                        }
                    }
                }
            });
        }

        // 미니맵에서 클릭 시 직접 변경 연동
        function selectSlotFromMinimap(slotName) {
            const selectEl = document.getElementById("ad-slot-select");
            if (selectEl) {
                selectEl.value = slotName;
                onAdSlotChange();
            }
        }"""

# 기존에 updateMinimapHighlight 가 있었던 자리에 삽입 또는 교체하기 위해, 
# match가 복잡하므로 function updateMinimapHighlight로 직접 교체
# let uploadedImage = null; 이후 selectSlotFromMinimap 사이에 삽입
minimap_func_pattern = re.compile(r'// 미니맵 노출 하이라이트 제어[\s\S]*?selectSlotFromMinimap[\s\S]*?\}')
if not minimap_func_pattern.search(content):
    # 만약에 없으면 selectSlotFromMinimap 함수 자체를 치환
    minimap_func_pattern = re.compile(r'function\s+selectSlotFromMinimap[\s\S]*?\}[\s\S]*?\}')

content = minimap_func_pattern.sub(minimap_js_replacement, content)

# 3. Canvas 편집기 필터 및 보정 갱신 함수 (applyFiltersToCanvas) Opacity 지원
# Opacity 슬라이더 값을 읽고 canvas 필터에 opacity 추가
canvas_filter_pattern = re.compile(r'function\s+applyFiltersToCanvas\s*\(\s*\)\s*\{[\s\S]*?\}[\s\S]*?\}')

canvas_filter_replacement = """function applyFiltersToCanvas() {
            if (!uploadedImage) return;

            const canvas = document.getElementById("ad-edit-canvas");
            const ctx = canvas.getContext("2d");

            const brightness = document.getElementById("slider-brightness").value;
            const contrast = document.getElementById("slider-contrast").value;
            const saturation = document.getElementById("slider-saturation").value;
            const rotation = document.getElementById("slider-rotation").value;
            const opacity = document.getElementById("slider-opacity").value;

            document.getElementById("val-brightness").innerText = `${brightness}%`;
            document.getElementById("val-contrast").innerText = `${contrast}%`;
            document.getElementById("val-saturation").innerText = `${saturation}%`;
            document.getElementById("val-rotation").innerText = `${rotation}°`;
            document.getElementById("val-opacity").innerText = `${opacity}%`;

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.save();

            // 필터 적용 (Opacity 추가)
            ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) opacity(${opacity}%)`;

            // 회전/변환 적용 (중심 기준 회전)
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate((rotation * Math.PI) / 180);
            ctx.translate(-canvas.width / 2, -canvas.height / 2);

            // 꽉 차게 그리기
            ctx.drawImage(uploadedImage, 0, 0, canvas.width, canvas.height);
            ctx.restore();

            // 이미지 보정 완료 후 텍스트 다시 그리기
            drawCanvasText(true);
        }"""

content = canvas_filter_pattern.sub(canvas_filter_replacement, content)

# 4. loadUploadedImage 함수 수정(slider-opacity 100 초기화).
uploaded_img_pattern = re.compile(r'uploadedImage\.onload\s*=\s*function\s*\(\s*\)\s*\{[\s\S]*?applyFiltersToCanvas\(\);\s*//\s*첫\s*렌더링[\s\S]*?\};')

uploaded_img_replacement = """uploadedImage.onload = function() {
                    document.getElementById("btn-open-canvas").classList.remove("hidden");
                    const opSlider = document.getElementById("slider-opacity");
                    if (opSlider) opSlider.value = 100;
                    openCanvasEditor();
                    applyFiltersToCanvas(); // 첫 렌더링
                };"""

content = uploaded_img_pattern.sub(uploaded_img_replacement, content)

# 5. 회원 관리 테이블 헤더 및 리스트 UI 고도화
# No. 헤더 추가 및 검색/정렬 옵션 바 추가
user_table_pattern = re.compile(r'<!--\s*회원\s*리스트\s*테이블\s*-->[\s\S]*?<table class="w-full text-left border-collapse">[\s\S]*?<thead>[\s\S]*?<\/thead>')

user_table_replacement = """<!-- 회원 리스트 테이블 -->
                <!-- 회원 검색 및 정렬 옵션 바 -->
                <div class="flex flex-col sm:flex-row gap-3 items-center justify-between pb-3">
                    <div class="relative w-full sm:max-w-xs">
                        <input type="text" id="user-search-input" oninput="filterUsersList()" class="w-full text-xs font-bold p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-royalBlue outline-none" placeholder="이메일 검색...">
                    </div>
                    <div>
                        <select id="user-sort-select" onchange="filterUsersList()" class="text-xs font-black p-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none">
                            <option value="created_desc">📅 가입일 최신순</option>
                            <option value="created_asc">📅 가입일 오래된순</option>
                            <option value="email_asc">📧 이메일 오름차순</option>
                            <option value="upgrade_requested">⚡ 등업 요청 우선순</option>
                        </select>
                    </div>
                </div>

                <div class="border border-slate-200 rounded-2xl overflow-hidden bg-white">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-slate-50 border-b border-slate-200 text-slate-700 text-[10.5px] font-black">
                                <th class="p-3 w-12 text-center">No.</th>
                                <th class="p-3">가입 회원 이메일</th>
                                <th class="p-3 w-1/5 text-center">등급 및 등업 결재</th>
                                <th class="p-3 w-1/4 text-center">이용 기간 설정 (만료일)</th>
                                <th class="p-3 w-1/6 text-center">멤버십 (Tier)</th>
                                <th class="p-3 w-1/6 text-center">관리 액션</th>
                            </tr>
                        </thead>"""

content = user_table_pattern.sub(user_table_replacement, content)

# 6. loadUsersList 함수 리팩토링 및 filterUsersList, renderUsersList 구현 추가
# 시작: async function loadUsersList() {
# 끝: 회원 정보 및 이용 기간 변경 최종 DB 저장
# 이 부분을 위의 정렬/필터 렌더링 함수로 전면 대체
load_users_pattern = re.compile(r'async\s+function\s+loadUsersList\s*\(\s*\)\s*\{[\s\S]*?//\s*회원\s*정보\s*및\s*이용\s*기간\s*변경\s*최종\s*DB\s*저장')

load_users_replacement = """// 전역 회원 목록 데이터 캐시
        let usersList = [];

        // Supabase 연동 - 가입 유저 리스트 로드
        async function loadUsersList() {
            try {
                const { data, error } = await supabaseClient
                    .from('user_profiles')
                    .select('*');

                if (error) throw error;

                usersList = data || [];
                filterUsersList();
            } catch (err) {
                console.error("유저 프로필 조회 실패", err);
                const tbody = document.getElementById("user-list-tbody");
                if (tbody) {
                    tbody.innerHTML = `
                        <tr>
                            <td colspan="6" class="p-8 text-center text-rose-500 font-black">
                                <i class="fa-solid fa-triangle-exclamation"></i> 회원 프로필 정보를 조회할 수 없습니다. 
                                <br><span class="text-[10px] text-slate-400 font-semibold block mt-1">DB 테이블 셋업 탭의 SQL 구문을 먼저 실행해야 합니다.</span>
                            </td>
                        </tr>
                    `;
                }
            }
        }

        // 회원 검색 및 정렬 필터 적용
        function filterUsersList() {
            const query = document.getElementById("user-search-input")?.value.trim().toLowerCase() || "";
            const sortBy = document.getElementById("user-sort-select")?.value || "created_desc";

            let filtered = [...usersList];

            // 1. 검색어 필터링
            if (query) {
                filtered = filtered.filter(u => u.email && u.email.toLowerCase().includes(query));
            }

            // 2. 정렬 적용
            filtered.sort((a, b) => {
                if (sortBy === "created_desc") {
                    const dateA = new Date(a.created_at || a.updated_at || 0);
                    const dateB = new Date(b.created_at || b.updated_at || 0);
                    return dateB - dateA;
                } else if (sortBy === "created_asc") {
                    const dateA = new Date(a.created_at || a.updated_at || 0);
                    const dateB = new Date(b.created_at || b.updated_at || 0);
                    return dateA - dateB;
                } else if (sortBy === "email_asc") {
                    return (a.email || "").localeCompare(b.email || "");
                } else if (sortBy === "upgrade_requested") {
                    const reqA = a.upgrade_requested ? 1 : 0;
                    const reqB = b.upgrade_requested ? 1 : 0;
                    return reqB - reqA; // true 우선 정렬
                }
                return 0;
            });

            renderUsersList(filtered);
        }

        // 회원 목록 실시간 UI 렌더링
        function renderUsersList(list) {
            const tbody = document.getElementById("user-list-tbody");
            if (!tbody) return;

            if (list.length === 0) {
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" class="p-8 text-center text-slate-400">검색 조건에 맞는 회원 데이터가 존재하지 않습니다.</td>
                    </tr>
                `;
                return;
            }

            tbody.innerHTML = list.map((u, idx) => {
                const upgradeBadge = u.upgrade_requested 
                    ? `<span class="inline-flex items-center gap-1 bg-rose-500 text-white text-[8.5px] font-black px-1.5 py-0.5 rounded-md animate-pulse shadow-sm"><i class="fa-solid fa-bolt text-yellow-300"></i> 등업 요청 중</span>` 
                    : '';
                const membershipTier = u.membership_tier || 'regular';
                
                // 기간 기한 설정값
                let expiryStr = "";
                if (u.membership_expires_at) {
                    const expDate = new Date(u.membership_expires_at);
                    const offset = expDate.getTimezoneOffset();
                    const local = new Date(expDate.getTime() - (offset*60*1000));
                    expiryStr = local.toISOString().split('T')[0];
                }

                return `
                    <tr class="border-b border-slate-100 hover:bg-slate-50/50">
                        <td class="p-3 text-center text-slate-500 font-bold">${idx + 1}</td>
                        <td class="p-3 text-slate-800 font-extrabold select-all">
                            <div class="flex items-center gap-1.5 flex-wrap">
                                <span class="cursor-pointer text-royalBlue hover:underline" onclick="showUserDetailModal('${u.id}')">${u.email}</span>
                                ${upgradeBadge}
                            </div>
                        </td>
                        <td class="p-3 text-center">
                            <div class="flex flex-col gap-1.5 items-center justify-center">
                                <select id="grade-${u.id}" class="text-xs p-1.5 border border-slate-200 rounded-lg bg-white font-extrabold text-slate-700 focus:border-royalBlue outline-none w-[150px]">
                                    <option value="A" ${u.grade === 'A' ? 'selected' : ''}>🥇 A등급 (100% 오픈)</option>
                                    <option value="B" ${u.grade === 'B' ? 'selected' : ''}>🥈 B등급 (50% 오픈)</option>
                                    <option value="C" ${u.grade === 'C' ? 'selected' : ''}>🥉 C등급 (20% 오픈)</option>
                                </select>
                                ${u.upgrade_requested ? `
                                    <div class="flex gap-1 mt-1">
                                        <button onclick="approveUpgradeRequest('${u.id}', '${u.email}')" class="bg-emeraldSuccess hover:bg-emerald-700 text-white text-[9px] font-black px-2 py-1 rounded shadow-sm">승인 (A)</button>
                                        <button onclick="denyUpgradeRequest('${u.id}')" class="bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-600 font-bold px-2 py-1 rounded shadow-sm">반려</button>
                                    </div>
                                ` : ''}
                            </div>
                        </td>
                        <td class="p-3">
                            <div class="flex flex-col gap-1.5">
                                <input type="date" id="expiry-${u.id}" value="${expiryStr}" class="text-xs p-1.5 border border-slate-200 rounded-lg bg-white font-extrabold text-slate-700 focus:border-royalBlue outline-none text-center">
                                <div class="flex gap-1 justify-center">
                                    <button onclick="setQuickExpiry('${u.id}', 30)" class="bg-slate-100 hover:bg-slate-200 text-slate-600 text-[8.5px] px-1.5 py-0.5 rounded font-black border border-slate-200 select-none">30일</button>
                                    <button onclick="setQuickExpiry('${u.id}', 90)" class="bg-slate-100 hover:bg-slate-200 text-slate-600 text-[8.5px] px-1.5 py-0.5 rounded font-black border border-slate-200 select-none">90일</button>
                                    <button onclick="setQuickExpiry('${u.id}', 'infinite')" class="bg-slate-100 hover:bg-slate-200 text-slate-600 text-[8.5px] px-1.5 py-0.5 rounded font-black border border-slate-200 select-none">무제한</button>
                                </div>
                            </div>
                        </td>
                        <td class="p-3 text-center">
                            <select id="tier-${u.id}" class="text-xs p-1.5 border border-slate-200 rounded-lg bg-white font-extrabold text-slate-700 focus:border-royalBlue outline-none w-[120px]">
                                <option value="regular" ${membershipTier === 'regular' ? 'selected' : ''}>일반 (regular)</option>
                                <option value="premium" ${membershipTier === 'premium' ? 'selected' : ''}>⭐ 프리미엄 (premium)</option>
                            </select>
                        </td>
                        <td class="p-3 text-center">
                            <button onclick="saveUserCurationConfig('${u.id}')" class="bg-royalBlue hover:bg-royalHover text-white text-[10.5px] font-black px-3.5 py-2 rounded-xl transition-all shadow-md select-none">
                                저장
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        }

        // 회원 정보 및 이용 기간 변경 최종 DB 저장"""

content = load_users_pattern.sub(load_users_replacement, content)

# 7. 회원 상세 활동 정보 모달 마크업 및 비동기 함수 구현
# `image-explorer-modal` 팝업 뒤에 회원 상세 활동 정보 모달 추가
modal_target_str = """    <!-- 🎨 배너 이미지 리소스 탐색기 모달 팝업 -->"""
modal_replacement_str = """    <!-- 👥 회원 상세 활동 정보 모달 팝업 (실시간 통계 집계 포함) -->
    <div id="user-detail-modal" class="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center hidden">
        <div class="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full mx-4 shadow-2xl flex flex-col space-y-4">
            <div class="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <h3 class="text-sm font-black text-slate-800 flex items-center gap-1.5">
                    <i class="fa-solid fa-id-card text-royalBlue"></i> 회원 상세 활동 프로필
                </h3>
                <button onclick="closeUserDetailModal()" class="text-slate-400 hover:text-rose-500 transition-colors"><i class="fa-solid fa-xmark text-lg"></i></button>
            </div>
            
            <div class="space-y-3.5 text-xs text-slate-700 font-bold leading-normal">
                <div class="grid grid-cols-3 gap-2 border-b border-slate-50 pb-2.5">
                    <span class="text-slate-400 font-black">이메일 계정</span>
                    <span id="detail-modal-email" class="col-span-2 text-slate-900 select-all font-extrabold"></span>
                </div>
                <div class="grid grid-cols-3 gap-2 border-b border-slate-50 pb-2.5">
                    <span class="text-slate-400 font-black">회원 등급</span>
                    <span id="detail-modal-grade" class="col-span-2 text-slate-900 font-extrabold"></span>
                </div>
                <div class="grid grid-cols-3 gap-2 border-b border-slate-50 pb-2.5">
                    <span class="text-slate-400 font-black">멤버십 종류</span>
                    <span id="detail-modal-tier" class="col-span-2 text-slate-900 font-extrabold"></span>
                </div>
                <div class="grid grid-cols-3 gap-2 border-b border-slate-50 pb-2.5">
                    <span class="text-slate-400 font-black">멤버십 만료일</span>
                    <span id="detail-modal-expires" class="col-span-2 text-slate-900 font-extrabold"></span>
                </div>
                
                <!-- 실시간 활동 데이터 통계 블록 -->
                <div class="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 space-y-3.5">
                    <h4 class="text-xs font-black text-royalBlue flex items-center gap-1.5">
                        <i class="fa-solid fa-chart-simple"></i> 실시간 개인 활동 데이터 통계
                    </h4>
                    <div class="grid grid-cols-2 gap-4 text-center">
                        <div class="bg-white border border-slate-100 p-3 rounded-xl shadow-sm">
                            <span class="text-[9.5px] text-slate-400 block font-black">가상 모의입찰 참여</span>
                            <span id="detail-modal-bid-count" class="text-lg font-black text-rose-600 mt-1 block">0건</span>
                        </div>
                        <div class="bg-white border border-slate-100 p-3 rounded-xl shadow-sm">
                            <span class="text-[9.5px] text-slate-400 block font-black">전문가 상담 신청</span>
                            <span id="detail-modal-consult-count" class="text-lg font-black text-royalBlue mt-1 block">0건</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="flex justify-end pt-2">
                <button onclick="closeUserDetailModal()" class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-black transition-all">닫기</button>
            </div>
        </div>
    </div>

    <!-- 🎨 배너 이미지 리소스 탐색기 모달 팝업 -->"""

content = content.replace(modal_target_str, modal_replacement_str)

# Javascript 단에 showUserDetailModal, closeUserDetailModal 함수 삽입
# confirmExplorerImage 함수 마지막 부분 바로 아래에 추가
explorer_func_pattern = re.compile(r'function\s+confirmExplorerImage\s*\(\s*\)\s*\{[\s\S]*?applyExplorerImage\(\s*tempSelectedImage\s*\);\s*\}')

explorer_func_replacement = """function confirmExplorerImage() {
            if (!tempSelectedImage) {
                alert("적용할 배너 이미지를 먼저 선택해 주십시오.");
                return;
            }
            applyExplorerImage(tempSelectedImage);
        }

        // 회원 상세 모달 열기 및 실시간 카운트 집계
        async function showUserDetailModal(userId) {
            const user = usersList.find(u => u.id === userId);
            if (!user) return;

            document.getElementById("detail-modal-email").innerText = user.email || "-";
            
            const gradeMap = { 'A': '🥇 A등급 (100% 오픈)', 'B': '🥈 B등급 (50% 오픈)', 'C': '🥉 C등급 (20% 오픈)' };
            document.getElementById("detail-modal-grade").innerText = gradeMap[user.grade] || user.grade || "-";
            
            const tierMap = { 'premium': '⭐ 프리미엄 (premium)', 'regular': '일반 (regular)' };
            document.getElementById("detail-modal-tier").innerText = tierMap[user.membership_tier] || user.membership_tier || "일반";
            
            let expiryStr = "지정되지 않음";
            if (user.membership_expires_at) {
                const expDate = new Date(user.membership_expires_at);
                expiryStr = expDate.toLocaleDateString('ko-KR') + " " + expDate.toLocaleTimeString('ko-KR');
            }
            document.getElementById("detail-modal-expires").innerText = expiryStr;

            // 실시간 카운트 집계 로딩 표시
            document.getElementById("detail-modal-bid-count").innerText = "...건";
            document.getElementById("detail-modal-consult-count").innerText = "...건";

            document.getElementById("user-detail-modal").classList.remove("hidden");

            try {
                // 1. 모의입찰 카운트 집계
                const { count: bidCount, error: bidErr } = await supabaseClient
                    .from('mock_bids')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', userId);

                if (bidErr) throw bidErr;
                document.getElementById("detail-modal-bid-count").innerText = `${bidCount || 0}건`;

                // 2. 전문가 상담 카운트 집계
                const { count: consultCount, error: consultErr } = await supabaseClient
                    .from('expert_consultations')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', userId);

                if (consultErr) throw consultErr;
                document.getElementById("detail-modal-consult-count").innerText = `${consultCount || 0}건`;
            } catch (err) {
                console.error("유저 활동 통계 집계 실패", err);
                document.getElementById("detail-modal-bid-count").innerText = "오류";
                document.getElementById("detail-modal-consult-count").innerText = "오류";
            }
        }

        function closeUserDetailModal() {
            document.getElementById("user-detail-modal").classList.add("hidden");
        }"""

content = explorer_func_pattern.sub(explorer_func_replacement, content)

with open('admin.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("SUCCESS")
