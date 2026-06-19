// 새 파일 첫 줄은 해당 파일의 역할을 설명하는 한 줄짜리 한국어 주석으로 시작합니다.
// 5대 초개인화 테마 필터 칩 바 및 AI 예상 수익률 뱃지를 동적 제어 및 렌더링하는 프론트엔드 모듈입니다.

const v12ThemeCuration = (function() {
    let activeTheme = null; // 현재 선택된 테마 키 ('clean_rights', 'half_price', 'hot_yongin', 'lifestyle_3eok', 'yield_top')

    // 1. 대시보드 상단에 5대 테마 큐레이션 칩 바 렌더링 함수
    function injectCurationBar(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // 기존 큐레이션 바가 이미 존재하면 삭제
        const existingBar = document.getElementById("v12-curation-bar");
        if (existingBar) existingBar.remove();

        const barHtml = `
            <div id="v12-curation-bar" class="w-full bg-white border border-slate-200 rounded-2xl p-3 shadow-sm mb-4 transition-all duration-300">
                <div class="flex items-center gap-2 pb-2 mb-2 border-b border-slate-100">
                    <span class="bg-amber-500 text-white text-[9.5px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                        <i class="fa-solid fa-wand-magic-sparkles"></i> v1.2 AI Curation
                    </span>
                    <h4 class="text-xs font-black text-slate-800">투자 목적별 초개인화 테마 큐레이션</h4>
                    <p class="text-[9.5px] text-slate-400 font-bold ml-auto">원천 데이터를 인공지능 분석 가공하여 스마트하게 추천합니다.</p>
                </div>
                <div class="flex flex-wrap gap-2 items-center">
                    <button onclick="v12ThemeCuration.selectTheme(null)" id="btn-theme-all" class="px-3 py-1.5 rounded-xl text-[11px] font-black border transition-all select-none flex items-center gap-1 bg-royalBlue text-white border-royalBlue shadow-sm">
                        <i class="fa-solid fa-border-all"></i> 전체 매물 피드
                    </button>
                    <button onclick="v12ThemeCuration.selectTheme('clean_rights')" id="btn-theme-clean" class="px-3 py-1.5 rounded-xl text-[11px] font-black border border-slate-200 hover:border-emerald-500 hover:bg-slate-50 transition-all select-none text-slate-600 flex items-center gap-1">
                        <i class="fa-solid fa-shield-halved text-emerald-500"></i> 초보자용 권리클린
                    </button>
                    <button onclick="v12ThemeCuration.selectTheme('half_price')" id="btn-theme-half" class="px-3 py-1.5 rounded-xl text-[11px] font-black border border-slate-200 hover:border-rose-500 hover:bg-slate-50 transition-all select-none text-slate-600 flex items-center gap-1">
                        <i class="fa-solid fa-percent text-rose-500"></i> 반값 격전지
                    </button>
                    <button onclick="v12ThemeCuration.selectTheme('hot_yongin')" id="btn-theme-yongin" class="px-3 py-1.5 rounded-xl text-[11px] font-black border border-slate-200 hover:border-indigo-500 hover:bg-slate-50 transition-all select-none text-slate-600 flex items-center gap-1">
                        <i class="fa-solid fa-fire text-indigo-500"></i> 반도체 HOT 용인
                    </button>
                    <button onclick="v12ThemeCuration.selectTheme('lifestyle_3eok')" id="btn-theme-lifestyle" class="px-3 py-1.5 rounded-xl text-[11px] font-black border border-slate-200 hover:border-amber-500 hover:bg-slate-50 transition-all select-none text-slate-600 flex items-center gap-1">
                        <i class="fa-solid fa-campground text-amber-500"></i> 제주/서울 3억 이하
                    </button>
                    <button onclick="v12ThemeCuration.selectTheme('yield_top')" id="btn-theme-yield" class="px-3 py-1.5 rounded-xl text-[11px] font-black border border-slate-200 hover:border-blue-500 hover:bg-slate-50 transition-all select-none text-slate-600 flex items-center gap-1">
                        <i class="fa-solid fa-coins text-blue-500"></i> 상가 수익률 TOP
                    </button>
                    <button onclick="v12ThemeCuration.selectTheme('redevelopment')" id="btn-theme-redevelopment" class="px-3 py-1.5 rounded-xl text-[11px] font-black border border-slate-200 hover:border-orange-500 hover:bg-slate-50 transition-all select-none text-slate-600 flex items-center gap-1">
                        <i class="fa-solid fa-building text-orange-500"></i> 노후 아파트 재건축
                    </button>
                    <button onclick="v12ThemeCuration.selectTheme('mini_land')" id="btn-theme-miniland" class="px-3 py-1.5 rounded-xl text-[11px] font-black border border-slate-200 hover:border-lime-600 hover:bg-slate-50 transition-all select-none text-slate-600 flex items-center gap-1">
                        <i class="fa-solid fa-tree text-lime-600"></i> 초소액 토지 소장
                    </button>
                    <button onclick="v12ThemeCuration.selectTheme('auto_machinery')" id="btn-theme-automachinery" class="px-3 py-1.5 rounded-xl text-[11px] font-black border border-slate-200 hover:border-purple-500 hover:bg-slate-50 transition-all select-none text-slate-600 flex items-center gap-1">
                        <i class="fa-solid fa-car text-purple-500"></i> 실속 차량/동산
                    </button>
                    <button onclick="v12ThemeCuration.selectTheme('officetel_income')" id="btn-theme-officetel" class="px-3 py-1.5 rounded-xl text-[11px] font-black border border-slate-200 hover:border-cyan-500 hover:bg-slate-50 transition-all select-none text-slate-600 flex items-center gap-1">
                        <i class="fa-solid fa-city text-cyan-500"></i> 월세용 오피스텔
                    </button>
                    <button onclick="v12ThemeCuration.selectTheme('subway_safe')" id="btn-theme-subwaysafe" class="px-3 py-1.5 rounded-xl text-[11px] font-black border border-slate-200 hover:border-teal-500 hover:bg-slate-50 transition-all select-none text-slate-600 flex items-center gap-1">
                        <i class="fa-solid fa-train-subway text-teal-500"></i> 역세권 대항력 안전
                    </button>
                    <button onclick="v12ThemeCuration.selectTheme('small_building')" id="btn-theme-smallbuilding" class="px-3 py-1.5 rounded-xl text-[11px] font-black border border-slate-200 hover:border-amber-700 hover:bg-slate-50 transition-all select-none text-slate-600 flex items-center gap-1">
                        <i class="fa-solid fa-building-user text-amber-700"></i> 꼬마빌딩 건물주
                    </button>
                    <button onclick="v12ThemeCuration.selectTheme('school_district')" id="btn-theme-schooldistrict" class="px-3 py-1.5 rounded-xl text-[11px] font-black border border-slate-200 hover:border-emerald-600 hover:bg-slate-50 transition-all select-none text-slate-600 flex items-center gap-1">
                        <i class="fa-solid fa-graduation-cap text-emerald-600"></i> 학세권 우수 교육
                    </button>
                    <button onclick="v12ThemeCuration.selectTheme('capital_single')" id="btn-theme-capitalsingle" class="px-3 py-1.5 rounded-xl text-[11px] font-black border border-slate-200 hover:border-violet-500 hover:bg-slate-50 transition-all select-none text-slate-600 flex items-center gap-1">
                        <i class="fa-solid fa-house-laptop text-violet-500"></i> 수도권 1인 가구 갭
                    </button>
                    <button onclick="v12ThemeCuration.selectTheme('local_healing')" id="btn-theme-localhealing" class="px-3 py-1.5 rounded-xl text-[11px] font-black border border-slate-200 hover:border-green-600 hover:bg-slate-50 transition-all select-none text-slate-600 flex items-center gap-1">
                        <i class="fa-solid fa-house-chimney-window text-green-600"></i> 지방 힐링 세컨하우스
                    </button>
                    <button onclick="v12ThemeCuration.selectTheme('heavy_dropped')" id="btn-theme-heavydropped" class="px-3 py-1.5 rounded-xl text-[11px] font-black border border-slate-200 hover:border-red-600 hover:bg-slate-50 transition-all select-none text-slate-600 flex items-center gap-1">
                        <i class="fa-solid fa-down-long text-red-600"></i> 줍줍! 70% 폭락
                    </button>
                    <button onclick="v12ThemeCuration.selectTheme('factory_warehouse')" id="btn-theme-factorywarehouse" class="px-3 py-1.5 rounded-xl text-[11px] font-black border border-slate-200 hover:border-slate-600 hover:bg-slate-50 transition-all select-none text-slate-600 flex items-center gap-1">
                        <i class="fa-solid fa-industry text-slate-600"></i> 창업/물류 공장창고
                    </button>
                    <button onclick="v12ThemeCuration.selectTheme('share_investment')" id="btn-theme-shareinvestment" class="px-3 py-1.5 rounded-xl text-[11px] font-black border border-slate-200 hover:border-rose-400 hover:bg-slate-50 transition-all select-none text-slate-600 flex items-center gap-1">
                        <i class="fa-solid fa-scissors text-rose-400"></i> 소액 지분 틈새투자
                    </button>
                </div>
            </div>
        `;
        
        container.insertAdjacentHTML('afterbegin', barHtml);
    }

    // 2. 테마 선택 액션 핸들러
    function selectTheme(themeKey) {
        activeTheme = themeKey;

        // 칩 버튼 활성화/비활성화 클래스 갱신
        const keys = [
            { key: null, id: "btn-theme-all", activeClass: "bg-royalBlue text-white border-royalBlue shadow-sm" },
            { key: "clean_rights", id: "btn-theme-clean", activeClass: "bg-emerald-500 text-white border-emerald-500 shadow-sm" },
            { key: "half_price", id: "btn-theme-half", activeClass: "bg-rose-500 text-white border-rose-500 shadow-sm" },
            { key: "hot_yongin", id: "btn-theme-yongin", activeClass: "bg-indigo-500 text-white border-indigo-500 shadow-sm" },
            { key: "lifestyle_3eok", id: "btn-theme-lifestyle", activeClass: "bg-amber-500 text-white border-amber-500 shadow-sm" },
            { key: "yield_top", id: "btn-theme-yield", activeClass: "bg-blue-500 text-white border-blue-500 shadow-sm" },
            { key: "redevelopment", id: "btn-theme-redevelopment", activeClass: "bg-orange-500 text-white border-orange-500 shadow-sm" },
            { key: "mini_land", id: "btn-theme-miniland", activeClass: "bg-lime-600 text-white border-lime-600 shadow-sm" },
            { key: "auto_machinery", id: "btn-theme-automachinery", activeClass: "bg-purple-500 text-white border-purple-500 shadow-sm" },
            { key: "officetel_income", id: "btn-theme-officetel", activeClass: "bg-cyan-500 text-white border-cyan-500 shadow-sm" },
            { key: "subway_safe", id: "btn-theme-subwaysafe", activeClass: "bg-teal-500 text-white border-teal-500 shadow-sm" },
            { key: "small_building", id: "btn-theme-smallbuilding", activeClass: "bg-amber-700 text-white border-amber-700 shadow-sm" },
            { key: "school_district", id: "btn-theme-schooldistrict", activeClass: "bg-emerald-600 text-white border-emerald-600 shadow-sm" },
            { key: "capital_single", id: "btn-theme-capitalsingle", activeClass: "bg-violet-500 text-white border-violet-500 shadow-sm" },
            { key: "local_healing", id: "btn-theme-localhealing", activeClass: "bg-green-600 text-white border-green-600 shadow-sm" },
            { key: "heavy_dropped", id: "btn-theme-heavydropped", activeClass: "bg-red-600 text-white border-red-600 shadow-sm" },
            { key: "factory_warehouse", id: "btn-theme-factorywarehouse", activeClass: "bg-slate-600 text-white border-slate-600 shadow-sm" },
            { key: "share_investment", id: "btn-theme-shareinvestment", activeClass: "bg-rose-400 text-white border-rose-400 shadow-sm" }
        ];

        keys.forEach(k => {
            const btn = document.getElementById(k.id);
            if (btn) {
                if (k.key === themeKey) {
                    btn.className = `px-3 py-1.5 rounded-xl text-[11px] font-black border transition-all select-none flex items-center gap-1 ${k.activeClass}`;
                } else {
                    btn.className = "px-3 py-1.5 rounded-xl text-[11px] font-black border border-slate-200 hover:bg-slate-50 transition-all select-none text-slate-600 flex items-center gap-1";
                }
            }
        });

        // 메인 대시보드 리스트 필터 및 렌더링 연동 트리거
        if (typeof window.applyFilters === "function") {
            window.applyFilters();
        }
    }

    // 3. 큐레이션 테마 필터링 오버레이 함수
    // Supabase curation_themes 조인을 하거나, 메모리에 가져온 테마 매핑 정보를 기반으로 필터링합니다.
    function filterPropertiesByTheme(properties, curationThemesList) {
        if (!activeTheme) return properties;

        // 선택된 테마에 속한 property_id 리스트 추출
        const targetIds = (curationThemesList || [])
            .filter(t => t.theme_key === activeTheme)
            .map(t => t.property_id);

        if (targetIds.length > 0) {
            return properties.filter(p => targetIds.includes(p.id));
        }

        // [폴백 로직] 매핑 데이터가 비어 있을 경우, 프론트엔드 자체 조건식으로 실시간 큐레이션 제공
        return properties.filter(item => {
            const address = item.address || "";
            const ptype = item.ptype || "";
            const notes = item.notes_content || "";
            const appraisal = item.appraised_value || 0;
            const minimum = item.minimum_bid || 0;
            const margin = Math.max(0, appraisal - minimum);
            
            let expectedYield = 0.0;
            if (appraisal > 0) {
                expectedYield = (margin / appraisal) * 100;
            }
            
            const riskKeywords = ["유치권", "법정지상권", "주의", "인수", "대항력 있음", "분묘기지권"];
            let isClean = true;
            for (const key of riskKeywords) {
                if (notes.includes(key)) {
                    isClean = false;
                    break;
                }
            }

            if (activeTheme === "clean_rights") {
                return isClean && expectedYield >= 20.0;
            }
            
            if (activeTheme === "half_price") {
                if (!isClean) return true;
                const ratio = minimum / appraisal;
                if (appraisal > 0 && ratio <= 0.4) return true;
                if ((item.round_info || "").includes("3회") || (item.round_info || "").includes("4회") || (item.round_info || "").includes("5회") || (item.round_info || "").includes("6회")) return true;
                return false;
            }
            
            if (activeTheme === "hot_yongin") {
                return address.includes("용인");
            }
            
            if (activeTheme === "lifestyle_3eok") {
                if (address.includes("제주") && minimum <= 300000000 && (ptype.includes("주택") || ptype.includes("단독"))) return true;
                if (address.includes("서울") && minimum <= 300000000 && (ptype.includes("다세대") || ptype.includes("빌라") || ptype.includes("연립"))) return true;
                if (minimum <= 50000000) return true;
                return false;
            }
            
            if (activeTheme === "yield_top") {
                const isShopOrOffice = ptype.includes("상가") || ptype.includes("오피스텔") || ptype.includes("점포") || ptype.includes("근린") || ptype.includes("상업");
                return isShopOrOffice && expectedYield >= 30.0;
            }

            if (activeTheme === "redevelopment") {
                const isResident = ptype.includes("아파트") || ptype.includes("다세대") || ptype.includes("빌라") || ptype.includes("연립");
                let builtYear = 0;
                const metaMatch = notes.match(/__METADATA__:({.*})__/);
                if (metaMatch) {
                    try {
                        const meta = JSON.parse(metaMatch[1]);
                        builtYear = meta.complex_info ? (meta.complex_info.built_year || 0) : 0;
                    } catch (e) {}
                }
                const currentYear = new Date().getFullYear();
                return isResident && builtYear > 0 && (currentYear - builtYear) >= 30;
            }
            
            if (activeTheme === "mini_land") {
                const isLand = ptype.includes("토지") || ptype.includes("대지") || ptype.includes("임야") || ptype.includes("잡종지") || ptype.includes("대") || ptype.includes("전") || ptype.includes("답");
                return isLand && minimum <= 20000000;
            }
            
            if (activeTheme === "auto_machinery") {
                const type = ptype.toLowerCase();
                const isVehicle = type.includes("차량") || type.includes("운송") || type.includes("자동차") || type.includes("선박") || type.includes("항공기") || type.includes("중기") || type.includes("지게차") || type.includes("suv");
                const isSecurity = type.includes("유가증권") || type.includes("주식") || type.includes("채권") || type.includes("지분") || type.includes("증권");
                const isMachinery = type.includes("기계") || (type.includes("장비") && !type.includes("운송장비")) || type.includes("기구") || type.includes("설비") || type.includes("기기");
                const isGoods = type.includes("물품") || type.includes("기타물품") || type.includes("동산") || type.includes("기타동산") || item.source === 'onbid_etc' || item.source === 'court_etc';
                return isVehicle || isSecurity || isMachinery || isGoods;
            }
            
            if (activeTheme === "officetel_income") {
                return ptype.includes("오피스텔") && expectedYield >= 15.0;
            }
            
            if (activeTheme === "subway_safe") {
                const isSafe = !notes.includes("유치권") && !notes.includes("법정지상권") && !notes.includes("인수") && !notes.includes("주의") && !notes.includes("대항력 있음");
                
                let walkTime = 999;
                let subwayInfo = item.subway_info;
                
                const metaMatch = notes.match(/__METADATA__:({.*})__/);
                if (metaMatch) {
                    try {
                        const meta = JSON.parse(metaMatch[1]);
                        if (meta.subway_info) subwayInfo = meta.subway_info;
                    } catch (e) {}
                }
                
                if (subwayInfo) {
                    walkTime = subwayInfo.walk_time || 999;
                    if (walkTime === 999 && subwayInfo.distance) {
                        walkTime = Math.round(subwayInfo.distance / 80);
                    }
                }
                
                if (walkTime === 999) {
                    const dongMatch = address.match(/([가-힇]+[동읍면리])\s/);
                    if (dongMatch) {
                        const dongName = dongMatch[1];
                        const REGIONAL_INFRA_DB = {
                            "화곡동": 320, "가락동": 280, "반포동": 210, "정자동": 350,
                            "다산동": 410, "둔산동": 450, "범어동": 310, "우동": 240,
                            "봉선동": 620, "옥동": 850, "청라동": 580, "삼전동": 180,
                            "대치동": 190, "서초동": 250, "역삼동": 220, "상계동": 300,
                            "중계동": 340, "신림동": 420, "구로동": 380, "등촌동": 290,
                            "목동": 270, "신정동": 310, "성산동": 260, "망원동": 330
                        };
                        const dist = REGIONAL_INFRA_DB[dongName];
                        if (dist !== undefined) {
                            walkTime = Math.round(dist / 80);
                        }
                    }
                }
                
                return isSafe && walkTime <= 15;
            }

            if (activeTheme === "small_building") {
                const isCommercial = ptype.includes("상가") || ptype.includes("빌딩") || ptype.includes("근린") || ptype.includes("점포") || ptype.includes("상업") || ptype.includes("다가구") || ptype.includes("주택");
                return isCommercial && minimum >= 500000000 && minimum <= 3000000000;
            }

            if (activeTheme === "school_district") {
                const isResident = ptype.includes("아파트") || ptype.includes("다세대") || ptype.includes("빌라") || ptype.includes("연립");
                const hasSchool = notes.includes("학교") || notes.includes("초등") || notes.includes("학군") || notes.includes("중학교") || notes.includes("고등학교");
                return isClean && isResident && hasSchool;
            }

            if (activeTheme === "capital_single") {
                const isCapital = address.includes("서울") || address.includes("경기") || address.includes("인천");
                const isSingleType = ptype.includes("오피스텔") || ptype.includes("다세대") || ptype.includes("빌라") || ptype.includes("연립") || ptype.includes("도시형");

                let walkTime = 999;
                let subwayInfo = item.subway_info;
                const metaMatch = notes.match(/__METADATA__:({.*})__/);
                if (metaMatch) {
                    try {
                        const meta = JSON.parse(metaMatch[1]);
                        if (meta.subway_info) subwayInfo = meta.subway_info;
                    } catch (e) {}
                }
                if (subwayInfo) {
                    walkTime = subwayInfo.walk_time || 999;
                    if (walkTime === 999 && subwayInfo.distance) {
                        walkTime = Math.round(subwayInfo.distance / 80);
                    }
                }
                return isCapital && isSingleType && minimum <= 200000000 && walkTime <= 10;
            }

            if (activeTheme === "local_healing") {
                const isCapital = address.includes("서울") || address.includes("경기") || address.includes("인천") || address.includes("서울특별시") || address.includes("경기도") || address.includes("인천광역시");
                const isHealingHouse = ptype.includes("주택") || ptype.includes("단독") || ptype.includes("전원");
                return !isCapital && isHealingHouse && minimum <= 150000000;
            }

            if (activeTheme === "heavy_dropped") {
                const ratio = minimum / appraisal;
                return appraisal > 0 && ratio <= 0.3;
            }

            if (activeTheme === "factory_warehouse") {
                const isIndustry = ptype.includes("공장") || ptype.includes("창고") || ptype.includes("산업") || ptype.includes("아파트형공장");
                return isIndustry && minimum >= 300000000;
            }

            if (activeTheme === "share_investment") {
                const isShare = ptype.includes("지분") || notes.includes("지분") || (item.title || "").includes("지분");
                return isShare && minimum <= 50000000;
            }
            
            return false;
        });
    }

    // 4. 개별 매물 카드 내에 AI 수익률 예측 수치 및 안전 마크 조건부 렌더링 함수
    function renderAICardIndicators(item, analyticsDataList) {
        const analytics = analyticsDataList.find(a => a.property_id === item.id);
        
        let indicatorsHtml = "";
        
        // 권리클린 뱃지 조건부 렌더링 (analytics의 is_clean_rights 혹은 자체 판정 기준)
        const isClean = analytics ? analytics.is_clean_rights : !item.notes_content;
        const cleanBadge = isClean 
            ? `<span class="bg-emerald-50 text-emeraldSuccess border border-emerald-200 text-[10px] font-black px-1.5 py-0.5 rounded flex items-center gap-1 select-none"><i class="fa-solid fa-circle-check"></i> 권리클린</span>` 
            : "";

        if (analytics) {
            const marginMillion = Math.round(analytics.expected_margin / 10000) / 100; // 억 단위 변환
            const yieldVal = analytics.expected_yield;

            indicatorsHtml = `
                <div class="mt-2.5 flex items-center flex-wrap gap-2">
                    ${cleanBadge}
                    <span class="bg-blue-50 text-royalBlue border border-blue-150 text-[10px] font-black px-2 py-0.5 rounded font-mono select-none">
                        📈 예상수익: ${marginMillion.toLocaleString()}억 (${yieldVal}%)
                    </span>
                </div>
            `;
        } else {
            // fallback 데이터 가공 (원천 데이터 기반 즉석 연산)
            const margin = Math.max(0, (item.appraised_value || 0) - (item.minimum_bid || 0));
            const marginMillion = Math.round(margin / 10000) / 100;
            const yieldVal = item.appraised_value > 0 ? ((margin / item.appraised_value) * 100).toFixed(1) : "0.0";
            
            indicatorsHtml = `
                <div class="mt-2.5 flex items-center flex-wrap gap-2">
                    ${cleanBadge}
                    <span class="bg-slate-50 text-slate-500 border border-slate-200 text-[10px] font-bold px-2 py-0.5 rounded font-mono select-none">
                        📈 예상수익: ${marginMillion}억 (${yieldVal}%)
                    </span>
                </div>
            `;
        }

        return indicatorsHtml;
    }

    return {
        injectCurationBar: injectCurationBar,
        selectTheme: selectTheme,
        filterPropertiesByTheme: filterPropertiesByTheme,
        renderAICardIndicators: renderAICardIndicators,
        getActiveTheme: function() { return activeTheme; }
    };
})();

// 글로벌 바인딩 적용
window.v12ThemeCuration = v12ThemeCuration;
