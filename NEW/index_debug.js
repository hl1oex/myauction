
        // 🔒 로컬 FastAPI 개발 서버 주소 설정
        const API_BASE_URL = "http://127.0.0.1:8000";
        
        let originalProperties = [];  // 서버에서 수신한 전체 데이터 원본
        let filteredProperties = [];  // 검색/필터 필터링을 거친 리스트 데이터
        let currentSortKey = 'score'; // 현재 정렬 기준

        // 가상 실시간 테스트 데이터 생성기 (서버 미가동 상태 대비 Fallback)
        const fallbackData = [
            {
                id: 101,
                source: "court",
                auction_no: "2025타경10452",
                address: "서울특별시 강남구 대치동 988 대치팰리스 아파트 101동 1502호",
                ptype: "아파트",
                appraised_value: 2600000000,
                minimum_bid: 2080000000,
                bidding_date: "2026-07-15",
                round_info: "2회차 (20% 저감)",
                desc_content: "대항력 미상의 임차인이 전입되어 있으며, 소유권 이전 청구권 가등기가 등기상 설정되어 있어 인수 여부에 대한 사전 법률 위험 확인이 요구되는 아파트입니다.",
                notes_content: "⚠️ 선순위 가등기 인수 리스크 우려 / 보증금 인수 가능성",
                link_url: "https://www.courtauction.go.kr",
                grade: "B",
                score: 82,
                remaining_days: 44
            },
            {
                id: 102,
                source: "onbid",
                auction_no: "2025-08745-001",
                address: "경기도 성남시 분당구 정자동 182 상록마을 상가 2층 204호",
                ptype: "상가/점포/근린상가",
                appraised_value: 850000000,
                minimum_bid: 680000000,
                bidding_date: "2026-06-25",
                round_info: "1회차 (최초 법사)",
                desc_content: "인근 유동인구가 활발한 근린 상업구역이며, 공실 상태로 즉각적인 상가 명도가 원활하여 추가 유치권 리스크가 없는 우량 상가 부동산입니다.",
                notes_content: "🟢 명도 안전성 우수 / 대지권 비율 완벽 확보",
                link_url: "https://www.onbid.co.kr",
                grade: "A",
                score: 95,
                remaining_days: 24
            },
            {
                id: 103,
                source: "court",
                auction_no: "2025타경45812",
                address: "서울특별시 서초구 반포동 2-8 반포자이 아파트 104동 301호",
                ptype: "아파트",
                appraised_value: 3400000000,
                minimum_bid: 2720000000,
                bidding_date: "2026-06-18",
                round_info: "2회차 매각기일",
                desc_content: "공동 소유주의 지분 분할 청구 소송에 기인하여 형식적 경매가 청구된 아파트입니다. 낙찰 시 지분 전원을 일괄 취득 가능하여 권리상 하자가 매우 작습니다.",
                notes_content: "🟢 형식적 경매 지분 전원 취득 완벽 / 권리관계 무결성 우수",
                link_url: "https://www.courtauction.go.kr",
                grade: "A",
                score: 98,
                remaining_days: 17
            },
            {
                id: 104,
                source: "court",
                auction_no: "2025타경9985",
                address: "경기도 용인시 기흥구 보정동 1247 단독 전원주택",
                ptype: "단독/다가구/전원주택",
                appraised_value: 1200000000,
                minimum_bid: 600000000,
                bidding_date: "2026-05-15",
                round_info: "3회차 (50% 대폭 저감)",
                desc_content: "토지가 제외되고 지상 건물만 매각되는 '건물만 매각' 특수 물건입니다. 토지 소유주로부터 건물 철거 소송 및 고액의 지료 청구 압박 위험이 심대하여 초보자 응찰 금지를 권고합니다.",
                notes_content: "⚠️ 건물만 매각 리스크 극대화 / 토지 사용 지료 분쟁 소송 소송 우려",
                link_url: "https://www.courtauction.go.kr",
                grade: "X",
                score: 0,
                remaining_days: -17
            }
        ];

        // 페이지 HTML 파싱 직후 즉시 구동 (CDN 지연 차단 방지)
        document.addEventListener("DOMContentLoaded", function() {
            fetchDataFromServer();
        });

        // 1. 서버 API 호출 및 데이터 낚아채기
        async function fetchDataFromServer() {
            const sensor = document.getElementById("connection-sensor");
            try {
                // 백엔드 FastAPI 서버에서 최신 수집 데이터 연동
                const response = await axios.get(`${API_BASE_URL}/api/properties`, { timeout: 3000 });
                if (response.data && response.data.success) {
                    originalProperties = response.data.data;
                    sensor.innerHTML = '<span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span><span>🟢 실시간 데이터 연동 정상 (NORMAL)</span>';
                    sensor.className = "flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold shadow-sm";
                }
            } catch (error) {
                console.warn("⚠️ API 서버 연결 지연 - 로컬 시뮬레이터(Fallback) 데이터를 연동합니다.", error);
                originalProperties = fallbackData;
                sensor.innerHTML = '<span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span><span>🟡 로컬 오프라인 모드 가동 (OFFLINE)</span>';
                sensor.className = "flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold shadow-sm";
            }
            
            // 가져온 데이터 가공 및 렌더링 시작
            filteredProperties = [...originalProperties];
            sortData(currentSortKey);
        }

        // 2. 예산 설정 슬라이더 글자 업데이트
        function updateBudgetLabel(val) {
            const label = document.getElementById("budget-label");
            if (val >= 2000000000) {
                label.innerText = "제한 없음";
            } else {
                label.innerText = formatKRW(parseInt(val));
            }
            applyFilters();
        }

        // 3. 한글 통화 포맷 함수
        function formatKRW(val) {
            if (!val) return "0원";
            if (val < 0) return "-" + formatKRW(Math.abs(val));
            const uk = Math.floor(val / 100000000);
            const remainder = val % 100000000;
            const man = Math.floor(remainder / 10000);
            
            let parts = [];
            if (uk > 0) parts.push(`${uk}억`);
            if (man > 0) parts.push(`${man.toLocaleString()}만`);
            return parts.length > 0 ? parts.join(" ") + " 원" : `${val.toLocaleString()}원`;
        }

        // 4. 실시간 통합 검색 필터링 엔진 (100% 클라이언트 연동)
        function applyFilters() {
            const searchQuery = document.getElementById("search-input").value.trim().toLowerCase();
            const dateLimit = parseInt(document.getElementById("date-filter").value);
            const budgetLimit = parseInt(document.getElementById("budget-slider").value);
            
            filteredProperties = originalProperties.filter(item => {
                // 1. 키워드 검색 적용
                const matchesKeyword = !searchQuery || 
                    item.address.toLowerCase().includes(searchQuery) ||
                    item.auction_no.toLowerCase().includes(searchQuery) ||
                    (item.desc_content && item.desc_content.toLowerCase().includes(searchQuery)) ||
                    (item.notes_content && item.notes_content.toLowerCase().includes(searchQuery)) ||
                    (item.ptype && item.ptype.toLowerCase().includes(searchQuery));
                
                // 2. 예산 상한선 필터링
                const matchesBudget = budgetLimit >= 2000000000 || item.minimum_bid <= budgetLimit;
                
                // 3. 기일 임박 필터링 (남은 일수 계산)
                const matchesDate = dateLimit === 999 || (item.remaining_days && item.remaining_days <= dateLimit);
                
                return matchesKeyword && matchesBudget && matchesDate;
            });
            
            // 필터링 적용에 따른 대시보드 KPI 갱신 및 화면 갱신
            updateKPIDashboard();
            renderProperties();
        }

        // 5. 대시보드 KPI 통계 연동
        function updateKPIDashboard() {
            document.getElementById("kpi-recommended-count").innerText = `${filteredProperties.length}건`;
            
            const highGradeCount = filteredProperties.filter(item => item.grade === 'A' || item.grade === 'B').length;
            document.getElementById("kpi-high-count").innerText = `${highGradeCount}건`;
            
            const riskCount = filteredProperties.filter(item => item.grade === 'X').length;
            document.getElementById("kpi-risk-count").innerText = `${riskCount}건`;
        }

        // 6. 데이터 리스트 정렬
        function sortData(key) {
            currentSortKey = key;
            if (key === 'score') {
                // 점수 높은 순 정렬
                filteredProperties.sort((a, b) => b.score - a.score);
            } else if (key === 'date') {
                // 남은 기간 짧은 순(임박순) 정렬
                filteredProperties.sort((a, b) => a.remaining_days - b.remaining_days);
            }
            renderProperties();
        }

        // 7. 카드 확장/축소(아코디언) 토글 토글 함수
        function toggleCard(id) {
            const detailView = document.getElementById(`detail-${id}`);
            const chevron = document.getElementById(`chevron-${id}`);
            if (detailView.classList.contains("hidden")) {
                detailView.classList.remove("hidden");
                chevron.style.transform = "rotate(180deg)";
            } else {
                detailView.classList.add("hidden");
                chevron.style.transform = "rotate(0deg)";
            }
        }

        // 8. 경매/공매 목록 동적 렌더러
        function renderProperties() {
            const container = document.getElementById("properties-container");
            container.innerHTML = "";
            
            if (filteredProperties.length === 0) {
                container.innerHTML = `
                    <div class="text-center py-16 bg-white border border-slate-200 rounded-2xl p-8">
                        <i class="fa-solid fa-folder-open text-slate-300 text-5xl mb-4"></i>
                        <h4 class="font-extrabold text-slate-700 mb-1">검색 결과 없음</h4>
                        <p class="text-xs text-slate-400">설정한 필터나 가용 예산 한도 내에서 부합하는 추천 매물이 없습니다.</p>
                    </div>
                `;
                return;
            }
            
            filteredProperties.forEach(item => {
                const borderLeftColor = item.source === 'court' ? 'border-l-blue-600' : 'border-l-emerald-600';
                const sourceBadge = item.source === 'court' 
                    ? `<span class="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold px-2 py-0.5 rounded-md">⚖️ 법원 경매</span>`
                    : `<span class="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-md">🏢 온비드 공매</span>`;
                
                const gradeColor = item.grade === 'A' ? 'bg-emerald-500 text-white' : item.grade === 'B' ? 'bg-blue-500 text-white' : item.grade === 'X' ? 'bg-rose-500 text-white' : 'bg-slate-500 text-white';
                
                const cardHtml = `
                    <!-- 📦 개별 물건 요약 카드 -->
                    <div class="bg-white border border-slate-200 border-l-4 ${borderLeftColor} rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden expand-transition">
                        <!-- 클릭 가능한 카드 요약 바 -->
                        <div onclick="toggleCard(${item.id})" class="p-5 flex justify-between items-center cursor-pointer select-none">
                            <div class="flex-1">
                                <div class="flex items-center gap-2 mb-2 flex-wrap">
                                    ${sourceBadge}
                                    <span class="text-xs font-bold text-slate-400">${item.auction_no}</span>
                                    <span class="${gradeColor} text-[10px] font-extrabold px-2 py-0.5 rounded-md">${item.grade}등급</span>
                                    <span class="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold px-2 py-0.5 rounded-md">AI 적합도 ${item.score}점</span>
                                </div>
                                <h4 class="text-base font-extrabold text-slate-900 leading-tight">${item.address}</h4>
                                <div class="flex gap-4 mt-2.5 text-xs text-slate-500 font-semibold">
                                    <span>용도: <strong class="text-slate-800">${item.ptype}</strong></span>
                                    <span>감정가: <strong class="text-slate-800">${formatKRW(item.appraised_value)}</strong></span>
                                    <span>최저가: <strong class="text-rose-600">${formatKRW(item.minimum_bid)}</strong></span>
                                </div>
                            </div>
                            <div class="ml-4 flex items-center gap-3">
                                <div class="text-right hidden sm:block">
                                    <p class="text-[10px] text-slate-400 font-extrabold">기일 만기</p>
                                    <p class="text-xs font-black text-rose-600">${item.remaining_days < 0 ? '종결/마감' : 'D-' + item.remaining_days}</p>
                                </div>
                                <i id="chevron-${item.id}" class="fa-solid fa-chevron-down text-slate-400 transition-transform expand-transition"></i>
                            </div>
                        </div>
                        
                        <!-- 📂 상세 권리분석 및 낙찰가 계산기 (아코디언 토글 뷰) -->
                        <div id="detail-${item.id}" class="hidden bg-slate-50 border-t border-slate-100 p-5 expand-transition">
                            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                
                                <!-- 좌측: 비고 공고문 상세 & 법적 주의사항 경고 -->
                                <div>
                                    <h5 class="text-xs font-bold text-slate-600 mb-2">📋 상세 정보 요약 및 원문 분석</h5>
                                    <p class="text-xs text-slate-600 leading-relaxed bg-white border border-slate-200 rounded-xl p-3 shadow-sm mb-4">
                                        ${item.desc_content}
                                    </p>
                                    
                                    <h5 class="text-xs font-bold text-slate-600 mb-2">⚠️ 권리분석 및 리스크 예견</h5>
                                    <div class="bg-rose-50 border border-rose-200 rounded-xl p-3 text-rose-800 text-xs shadow-sm leading-relaxed mb-4">
                                        <strong>${item.notes_content}</strong>
                                    </div>
                                    
                                    <div class="flex gap-2 justify-end">
                                        <a href="https://map.naver.com/v5/search/${encodeURIComponent(item.address)}" target="_blank" 
                                           class="bg-emerald-600 text-white px-3 py-2 rounded-lg text-xs font-bold shadow-sm hover:bg-emerald-700 transition-colors">
                                            🗺️ 네이버 지도로 보기
                                        </a>
                                        <a href="${item.link_url}" target="_blank" 
                                           class="bg-blue-600 text-white px-3 py-2 rounded-lg text-xs font-bold shadow-sm hover:bg-blue-700 transition-colors">
                                            ⚖️ 공식 원문 매각 페이지로 바로가기
                                        </a>
                                    </div>
                                </div>
                                
                                <!-- 우측: 🧮 스마트 예상 낙찰가 계산기 (완전 연동 연동형) -->
                                <div class="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                                    <div class="flex items-center gap-1.5 mb-3 pb-2 border-b border-slate-100">
                                        <i class="fa-solid fa-calculator text-blue-600"></i>
                                        <strong class="text-xs font-black text-slate-700">스마트 예상 낙찰가 계획가</strong>
                                    </div>
                                    
                                    <div class="space-y-3">
                                        <!-- 내 예상 응찰가 입력창 -->
                                        <div>
                                            <label class="block text-[10px] font-bold text-slate-400 mb-1">내 예상 응찰가 (낙찰가 입력)</label>
                                            <input type="number" id="calc-bid-${item.id}" value="${item.minimum_bid}" oninput="runBiddingCalculator(${item.id})"
                                                   class="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-extrabold focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-blue-600">
                                        </div>
                                        
                                        <!-- 신속 금액 보정 퀵 퀵 버튼 -->
                                        <div class="flex gap-1.5 flex-wrap">
                                            <button onclick="adjustBidValue(${item.id}, 10000000)" class="bg-slate-50 border border-slate-200 px-2 py-1 rounded text-[10px] font-bold hover:bg-slate-100 transition-colors">+1천만</button>
                                            <button onclick="adjustBidValue(${item.id}, 1000000)" class="bg-slate-50 border border-slate-200 px-2 py-1 rounded text-[10px] font-bold hover:bg-slate-100 transition-colors">+1백만</button>
                                            <button onclick="adjustBidValue(${item.id}, -1000000)" class="bg-slate-50 border border-slate-200 px-2 py-1 rounded text-[10px] font-bold hover:bg-slate-100 transition-colors">-1백만</button>
                                            <button onclick="setBidValueToPreset(${item.id}, ${item.appraised_value})" class="bg-slate-50 border border-slate-200 px-2 py-1 rounded text-[10px] font-bold hover:bg-slate-100 transition-colors">감정가 셋</button>
                                            <button onclick="setBidValueToPreset(${item.id}, ${item.minimum_bid})" class="bg-slate-50 border border-slate-200 px-2 py-1 rounded text-[10px] font-bold hover:bg-slate-100 transition-colors">최저가 셋</button>
                                        </div>
                                        
                                        <!-- 세금 영수증 출력 명세표 -->
                                        <div class="bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs font-bold text-slate-600 space-y-2 mt-4">
                                            <div class="flex justify-between">
                                                <span>지출 1) 낙찰 매매대금</span>
                                                <span id="tax-bid-${item.id}">0원</span>
                                            </div>
                                            <div class="flex justify-between">
                                                <span>지출 2) 예상 취득세 (대략 1.5%)</span>
                                                <span id="tax-acquisition-${item.id}" class="text-rose-600">0원</span>
                                            </div>
                                            <div class="flex justify-between">
                                                <span>지출 3) 법무 및 부대수수료 (대략 0.5%)</span>
                                                <span id="tax-agency-${item.id}">0원</span>
                                            </div>
                                            <div class="border-t border-slate-200 my-1 pb-1"></div>
                                            <div class="flex justify-between text-sm text-slate-900 font-extrabold">
                                                <span>💰 총 예상 필요 소요 자금</span>
                                                <span id="tax-total-${item.id}" class="text-blue-600">0원</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                container.innerHTML += cardHtml;
                runBiddingCalculator(item.id);
            });
            updateKPIDashboard();
        }

        // 9. [계산기 함수 1] 퀵 보정 버튼 클릭 시 인풋값 보정 및 연동
        function adjustBidValue(id, diff) {
            const input = document.getElementById(`calc-bid-${id}`);
            let val = parseInt(input.value) || 0;
            val = Math.max(0, val + diff);
            input.value = val;
            runBiddingCalculator(id);
        }

        // 10. [계산기 함수 2] 특정 프리셋값 즉시 주입 및 연동
        function setBidValueToPreset(id, presetVal) {
            const input = document.getElementById(`calc-bid-${id}`);
            input.value = presetVal;
            runBiddingCalculator(id);
        }

        // 11. [계산기 핵심 엔진] 1원 단위 응찰가 입력에 따른 세금 영수증 연동 계산식
        function runBiddingCalculator(id) {
            const bidVal = parseInt(document.getElementById(`calc-bid-${id}`).value) || 0;
            
            // 취득세 대략 1.5% 계산
            const acquisitionTax = Math.floor(bidVal * 0.015);
            // 법무사수수료 및 채권 대략 0.5% 계산
            const agencyFee = Math.floor(bidVal * 0.005);
            // 총 합산 자금
            const totalRequired = bidVal + acquisitionTax + agencyFee;
            
            document.getElementById(`tax-bid-${id}`).innerText = formatKRW(bidVal);
            document.getElementById(`tax-acquisition-${id}`).innerText = "+ " + formatKRW(acquisitionTax);
            document.getElementById(`tax-agency-${id}`).innerText = "+ " + formatKRW(agencyFee);
            document.getElementById(`tax-total-${id}`).innerText = formatKRW(totalRequired);
        }
    