# index.html의 인코딩을 보존하면서 안전하게 치환 작업을 수행하는 파워셸 스크립트입니다.
$ErrorActionPreference = "Stop"

# UTF-8 인코딩으로 index.html 로드
$filePath = "index.html"
$content = [System.IO.File]::ReadAllText($filePath, [System.Text.Encoding]::UTF8)

# 1. PC/태블릿 & 모바일 KPI 통계 카드 60% 축소 치환
# 모바일 미니 KPI 카드 축소
$oldKpiMob = '                    <div class="grid grid-cols-3 gap-1.5 text-center">
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
                    </div>'

$newKpiMob = '                    <div class="grid grid-cols-3 gap-1 text-center">
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
                    </div>'

$content = $content.Replace($oldKpiMob, $newKpiMob)

# PC/태블릿 KPI 카드 축소
$oldKpiPC = '                <div class="hidden lg:grid grid-cols-3 gap-2">
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
                </div>'

$newKpiPC = '                <div class="hidden lg:grid grid-cols-3 gap-1">
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
                </div>'

$content = $content.Replace($oldKpiPC, $newKpiPC)


# 2. 자바스크립트 전역 변수 및 신설 헬퍼 추가
# let currentUser = null; 부분 뒤에 전역 상태 및 광고 전역 변수 추가
$targetAuthVars = '        let currentUser = null;
        let favoritePropertyIds = new Set();
        let showFavoritesOnly = false;
        let isSignUpMode = false;'

$replaceAuthVars = '        let currentUser = null;
        let favoritePropertyIds = new Set();
        let showFavoritesOnly = false;
        let isSignUpMode = false;
        let userGrade = "C";
        let adSettings = null;
        let renderedCount = 0;'

$content = $content.Replace($targetAuthVars, $replaceAuthVars)


# 3. 아코디언 토글, 전체선택, 등급 조회, 광고 로드 및 렌더러 함수 주입
# loadFavoritesFromServer() 위에 배치
$targetLoadFav = '        // Supabase로부터 로그인 유저의 관심 목록 로드 함수
        async function loadFavoritesFromServer() {'

$injectedFuncs = '        // 📱 검색 필터 아코디언 패널 토글 함수
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

        // Supabase로부터 로그인 유저의 관심 목록 로드 함수
        async function loadFavoritesFromServer() {'

$content = $content.Replace($targetLoadFav, $injectedFuncs)


# 4. onAuthStateChange 내부 고객 등급 로드 연동
$targetAuthListener = '        supabaseClient.auth.onAuthStateChange(async (event, session) => {
            currentUser = session ? session.user : null;
            updateAuthUI();'

$replaceAuthListener = '        supabaseClient.auth.onAuthStateChange(async (event, session) => {
            currentUser = session ? session.user : null;
            await fetchUserGrade(); // 고객 등급 실시간 동기화
            updateAuthUI();'

$content = $content.Replace($targetAuthListener, $replaceAuthListener)


# 5. 초기화 시 광고 설정 로드 통합
$targetInitialLoad = '            // 3. Supabase 실시간 추천 매물 바인딩 및 Realtime 채널 개설
            await loadPropertiesFromSupabase();'

$replaceInitialLoad = '            // 3. 광고 설정 로드
            await loadAdSettings();
            
            // 3. Supabase 실시간 추천 매물 바인딩 및 Realtime 채널 개설
            await loadPropertiesFromSupabase();'

$content = $content.Replace($targetInitialLoad, $replaceInitialLoad)


# 6. updateSigunguFilter 함수 다중선택 시도에 맞게 보강 치환
$oldSigunguFunc = '        function updateSigunguFilter(apply = true) {
            const sido = document.getElementById("sido-filter").value;
            const panel = document.getElementById("sigungu-panel");
            const container = document.getElementById("sigungu-container");
            
            if (sido === "all") {
                panel.classList.add("hidden");
                container.innerHTML = "";
                if (apply) applyFilters();
                return;
            }
            
            panel.classList.remove("hidden");
            const sigungus = FULL_REGIONS[sido] || [];
            
            // 기존 체크된 항목 보존을 위해 백업
            const checkedVals = Array.from(document.querySelectorAll(\x27input[name="sigungu-check"]:checked\x27)).map(cb => cb.value);
            
            let html = sigungus.map(sg => {
                const fullVal = `${sido} ${sg}`;
                const checked = checkedVals.includes(fullVal) ? "checked" : "";
                return `
                    <label class="flex items-center gap-2 cursor-pointer select-none text-[11px] font-semibold text-slate-600 py-0.5">
                        <input type="checkbox" name="sigungu-check" value="${fullVal}" ${checked} onchange="applyFilters()" class="accent-royalBlue">
                        <span>${sg}</span>
                    </label>
                `;
            }).join("");
            
            container.innerHTML = html;
            if (apply) applyFilters();
        }'

$newSigunguFunc = '        function updateSigunguFilter(apply = true) {
            const sidoCheckBoxes = document.querySelectorAll(\x27input[name="sido-check"]:checked\x27);
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
            
            const checkedVals = Array.from(document.querySelectorAll(\x27input[name="sigungu-check"]:checked\x27)).map(cb => cb.value);
            
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
        }'

$content = $content.Replace($oldSigunguFunc, $newSigunguFunc)


# 7. applyFilters() 다중 선택 필터링 알고리즘 전면 개편 치환
$oldApplyFilters = '        function applyFilters() {
            const searchQuery = document.getElementById("search-input").value.trim().toLowerCase();
            const sourceFilter = document.getElementById("source-filter").value;
            const ptypeFilter = document.getElementById("ptype-filter").value;
            const dateLimit = parseInt(document.getElementById("date-filter").value);
            const budgetLimit = parseInt(document.getElementById("budget-slider").value);
            const hidePast = document.getElementById("hide-past-toggle").checked;
            
            // 등급 라디오 필터 3단 판정 및 Active 탭 UI 하이라이팅
            const gradeFilterEl = document.querySelector(\x27input[name="grade-filter"]:checked\x27);
            const gradeVal = gradeFilterEl ? gradeFilterEl.value : "safe";
            
            [\x27all\x27, \x27safe\x27, \x27risk\x27].forEach(g => {
                const el = document.getElementById(`grade-filter-${g}`);
                if (el) {
                    if (g === gradeVal) {
                        el.className = "block rounded py-1 bg-royalBlue text-white font-extrabold shadow-sm";
                    } else {
                        el.className = "block rounded py-1 text-slate-500 hover:bg-slate-100 font-bold";
                    }
                }
            });

            // 시도 및 시군구 체크박스 데이터 추출
            const selectedSido = document.getElementById("sido-filter").value;
            const sigunguCheckBoxes = document.querySelectorAll(\x27input[name="sigungu-check"]:checked\x27);
            const selectedSigungus = Array.from(sigunguCheckBoxes).map(cb => cb.value);

            filteredProperties = originalProperties.filter(item => {
                // ❶ 키워드 검색
                const addressStr = item.address || "";
                const matchesKeyword = !searchQuery || 
                    addressStr.toLowerCase().includes(searchQuery) ||
                    (item.auction_no || "").toLowerCase().includes(searchQuery) ||
                    (item.desc_content && item.desc_content.toLowerCase().includes(searchQuery)) ||
                    (item.notes_content && item.notes_content.toLowerCase().includes(searchQuery)) ||
                    (item.ptype && item.ptype.toLowerCase().includes(searchQuery));
                
                // ❷ 예산 제한
                const matchesBudget = budgetLimit >= 2000000000 || item.minimum_bid <= budgetLimit;
                
                // ❸ 자산 출처 분류
                const matchesSource = sourceFilter === \x27all\x27 || item.source === sourceFilter;
                
                // ❹ 기일 디데이 필터
                const matchesDate = dateLimit === 999 || (item.remaining_days && item.remaining_days <= dateLimit);
                
                // ❺ 과거 기일 마감 필터
                const matchesPast = !hidePast || (item.remaining_days && item.remaining_days >= 0);
                
                // ❻ 시/도 필터 매칭
                let matchesSido = true;
                if (selectedSido !== "all") {
                    matchesSido = false;
                    const aliases = [selectedSido];
                    if (selectedSido === "서울") aliases.push("특별시");
                    if (selectedSido === "경기") aliases.push("경기도");
                    aliases.forEach(al => {
                        if (addressStr.includes(al)) matchesSido = true;
                    });
                }
                
                // ❼ 시/군/구 다중 필터 매칭 (동적 연동)
                let matchesSigungu = true;
                if (selectedSigungus.length > 0) {
                    matchesSigungu = false;
                    selectedSigungus.forEach(sgFull => {
                        const sg = sgFull.split(" ")[1];
                        if (addressStr.includes(sg)) matchesSigungu = true;
                    });
                }

                // ❽ AI 위험 등급(X등급) 분류 매칭
                let matchesGrade = true;
                if (gradeVal === \x27safe\x27) {
                    matchesGrade = item.grade !== \x27X\x27;
                } else if (gradeVal === \x27risk\x27) {
                    matchesGrade = item.grade === \x27X\x27;
                }

                // ❾ 물건 종류 (용도) 필터 매칭
                let matchesPtype = true;
                if (ptypeFilter !== "all") {
                    const type = (item.ptype || "").toLowerCase();
                    if (ptypeFilter === "apart") {
                        matchesPtype = type.includes("아파트") || type.includes("오피스텔") || type.includes("다세대") || type.includes("빌라") || type.includes("연립");
                    } else if (ptypeFilter === "store") {
                        matchesPtype = type.includes("상가") || type.includes("점포") || type.includes("근린") || type.includes("근생") || type.includes("생활시설") || type.includes("상업") || type.includes("빌딩") || type.includes("사무실");
                    } else if (ptypeFilter === "house") {
                        matchesPtype = (type.includes("주택") || type.includes("가구") || type.includes("단독") || type.includes("전원")) && !type.includes("아파트") && !type.includes("다세대") && !type.includes("연립");
                    } else if (ptypeFilter === "land") {
                        matchesPtype = type.includes("토지") || type.includes("대지") || type.includes("임야") || type.includes("잡종지") || type.includes("대") || type.includes("전") || type.includes("답");
                    } else if (ptypeFilter === "factory") {
                        matchesPtype = type.includes("공장") || type.includes("창고") || type.includes("산업");
                    }
                }
                
                // ❿ 내 관심 목록만 보기 필터
                let matchesFavorite = true;
                if (showFavoritesOnly) {
                    matchesFavorite = favoritePropertyIds.has(item.id);
                }
                
                // ❿ 관할 법원 다중 필터 매칭
                let matchesCourt = true;
                const courtCheckBoxes = document.querySelectorAll(\x27input[name="court-check"]:checked\x27);
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
            
            currentPage = 1; // 필터 적용 시 1페이지부터 다시 그리기
            sortData(\x27score\x27);
            saveFiltersToCache();
        }'

$newApplyFilters = '        function applyFilters() {
            const searchQuery = document.getElementById("search-input").value.trim().toLowerCase();
            
            const sourceCheckBoxes = document.querySelectorAll(\x27input[name="source-check"]:checked\x27);
            const selectedSources = Array.from(sourceCheckBoxes).map(cb => cb.value);
            
            const ptypeCheckBoxes = document.querySelectorAll(\x27input[name="ptype-check"]:checked\x27);
            const selectedPtypes = Array.from(ptypeCheckBoxes).map(cb => cb.value);
            
            const sidoCheckBoxes = document.querySelectorAll(\x27input[name="sido-check"]:checked\x27);
            const selectedSidos = Array.from(sidoCheckBoxes).map(cb => cb.value);

            const dateLimit = parseInt(document.getElementById("date-filter").value);
            const budgetLimit = parseInt(document.getElementById("budget-slider").value);
            const hidePast = document.getElementById("hide-past-toggle").checked;
            
            const gradeFilterEl = document.querySelector(\x27input[name="grade-filter"]:checked\x27);
            const gradeVal = gradeFilterEl ? gradeFilterEl.value : "safe";
            
            [\x27all\x27, \x27safe\x27, \x27risk\x27].forEach(g => {
                const el = document.getElementById(`grade-filter-${g}`);
                if (el) {
                    if (g === gradeVal) {
                        el.className = "block rounded py-0.5 bg-royalBlue text-white font-extrabold shadow-sm";
                    } else {
                        el.className = "block rounded py-0.5 text-slate-500 hover:bg-slate-100 font-bold";
                    }
                }
            });

            const sigunguCheckBoxes = document.querySelectorAll(\x27input[name="sigungu-check"]:checked\x27);
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
                if (gradeVal === \x27safe\x27) {
                    matchesGrade = item.grade !== \x27X\x27;
                } else if (gradeVal === \x27risk\x27) {
                    matchesGrade = item.grade === \x27X\x27;
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
                const courtCheckBoxes = document.querySelectorAll(\x27input[name="court-check"]:checked\x27);
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
            sortData(\x27score\x27);
            saveFiltersToCache();
        }'

$content = $content.Replace($oldApplyFilters, $newApplyFilters)


# 8. resetFilters() 및 캐시 저장/복원 다중 선택 칩에 맞춰 개조 치환
$oldResetFilters = '        function resetFilters() {
            document.getElementById("search-input").value = "";
            document.getElementById("source-filter").value = "all";
            document.getElementById("ptype-filter").value = "all";
            document.getElementById("sido-filter").value = "all";
            document.getElementById("date-filter").value = "180";
            document.getElementById("budget-slider").value = "2000000000";
            document.getElementById("hide-past-toggle").checked = true;
            document.getElementById("show-favorites-toggle").checked = false;
            showFavoritesOnly = false;
            
            // 3단 라디오 권리등급 필터를 \x27safe\x27(우량)으로 안전하게 초기화
            const safeRadio = document.querySelector(\x27input[name="grade-filter"][value="safe"]\x27);
            if (safeRadio) safeRadio.checked = true;
            
            // 법원 체크박스 전체 해제
            document.querySelectorAll(\x27input[name="court-check"]\x27).forEach(cb => cb.checked = false);
            
            document.getElementById("upload-status").classList.add("hidden");
            
            updateSigunguFilter(false);
            updateBudgetLabel(2000000000);
            applyFilters(); // 필터 즉시 적용 및 UI 동적 리렌더링
        }'

$newResetFilters = '        function resetFilters() {
            document.getElementById("search-input").value = "";
            document.querySelectorAll(\x27input[name="source-check"]\x27).forEach(cb => cb.checked = true);
            document.querySelectorAll(\x27input[name="ptype-check"]\x27).forEach(cb => cb.checked = true);
            document.querySelectorAll(\x27input[name="sido-check"]\x27).forEach(cb => cb.checked = false);
            document.getElementById("date-filter").value = "180";
            document.getElementById("budget-slider").value = "2000000000";
            document.getElementById("hide-past-toggle").checked = true;
            document.getElementById("show-favorites-toggle").checked = false;
            showFavoritesOnly = false;
            
            const safeRadio = document.querySelector(\x27input[name="grade-filter"][value="safe"]\x27);
            if (safeRadio) safeRadio.checked = true;
            
            document.querySelectorAll(\x27input[name="court-check"]\x27).forEach(cb => cb.checked = false);
            document.getElementById("upload-status").classList.add("hidden");
            
            updateSigunguFilter(false);
            updateBudgetLabel(2000000000);
            applyFilters();
        }'

$content = $content.Replace($oldResetFilters, $newResetFilters)

# 캐시 저장/복원 치환
$oldSaveCache = '        function saveFiltersToCache() {
            const gradeFilterEl = document.querySelector(\x27input[name="grade-filter"]:checked\x27);
            const gradeVal = gradeFilterEl ? gradeFilterEl.value : \x27all\x27;
            
            const filters = {
                search: document.getElementById("search-input").value,
                source: document.getElementById("source-filter").value,
                ptype: document.getElementById("ptype-filter").value,
                sido: document.getElementById("sido-filter").value,
                dateLimit: document.getElementById("date-filter").value,
                budgetLimit: document.getElementById("budget-slider").value,
                hidePast: document.getElementById("hide-past-toggle").checked,
                showFavorites: document.getElementById("show-favorites-toggle").checked,
                gradeFilter: gradeVal,
                selectedCourts: Array.from(document.querySelectorAll(\x27input[name="court-check"]:checked\x27)).map(cb => cb.value),
                selectedSigungus: Array.from(document.querySelectorAll(\x27input[name="sigungu-check"]:checked\x27)).map(cb => cb.value)
            };
            localStorage.setItem(\x27auction_filters_v2\x27, JSON.stringify(filters));
        }'

$newSaveCache = '        function saveFiltersToCache() {
            const gradeFilterEl = document.querySelector(\x27input[name="grade-filter"]:checked\x27);
            const gradeVal = gradeFilterEl ? gradeFilterEl.value : \x27all\x27;
            
            const filters = {
                search: document.getElementById("search-input").value,
                selectedSources: Array.from(document.querySelectorAll(\x27input[name="source-check"]:checked\x27)).map(cb => cb.value),
                selectedPtypes: Array.from(document.querySelectorAll(\x27input[name="ptype-check"]:checked\x27)).map(cb => cb.value),
                selectedSidos: Array.from(document.querySelectorAll(\x27input[name="sido-check"]:checked\x27)).map(cb => cb.value),
                dateLimit: document.getElementById("date-filter").value,
                budgetLimit: document.getElementById("budget-slider").value,
                hidePast: document.getElementById("hide-past-toggle").checked,
                showFavorites: document.getElementById("show-favorites-toggle").checked,
                gradeFilter: gradeVal,
                selectedCourts: Array.from(document.querySelectorAll(\x27input[name="court-check"]:checked\x27)).map(cb => cb.value),
                selectedSigungus: Array.from(document.querySelectorAll(\x27input[name="sigungu-check"]:checked\x27)).map(cb => cb.value)
            };
            localStorage.setItem(\x27auction_filters_v2\x27, JSON.stringify(filters));
        }'

$content = $content.Replace($oldSaveCache, $newSaveCache)

$oldRestoreCache = '        function restoreFiltersFromCache() {
            const cached = localStorage.getItem(\x27auction_filters_v2\x27);
            if (!cached) return;
            try {
                const filters = JSON.parse(cached);
                document.getElementById("search-input").value = filters.search || "";
                document.getElementById("source-filter").value = filters.source || "all";
                document.getElementById("ptype-filter").value = filters.ptype || "all";
                
                const sidoFilter = document.getElementById("sido-filter");
                sidoFilter.value = filters.sido || "all";
                
                // 시군구 업데이트 (필터 렌더링 무한루프 방지)
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
                
                // 법원 복원
                if (filters.selectedCourts && filters.selectedCourts.length > 0) {
                    filters.selectedCourts.forEach(val => {
                        const cb = document.querySelector(`input[name="court-check"][value="${val}"]`);
                        if (cb) cb.checked = true;
                    });
                }
                
                // 등급 복원
                const gradeVal = filters.gradeFilter || "all";
                const radio = document.querySelector(`input[name="grade-filter"][value="${gradeVal}"]`);
                if (radio) radio.checked = true;
                
            } catch (err) {
                console.warn("필터 캐시 복원 실패", err);
            }
        }'

$newRestoreCache = '        function restoreFiltersFromCache() {
            const cached = localStorage.getItem(\x27auction_filters_v2\x27);
            if (!cached) return;
            try {
                const filters = JSON.parse(cached);
                document.getElementById("search-input").value = filters.search || "";
                
                if (filters.selectedSources) {
                    document.querySelectorAll(\x27input[name="source-check"]\x27).forEach(cb => {
                        cb.checked = filters.selectedSources.indexOf(cb.value) > -1;
                    });
                }
                if (filters.selectedPtypes) {
                    document.querySelectorAll(\x27input[name="ptype-check"]\x27).forEach(cb => {
                        cb.checked = filters.selectedPtypes.indexOf(cb.value) > -1;
                    });
                }
                if (filters.selectedSidos) {
                    document.querySelectorAll(\x27input[name="sido-check"]\x27).forEach(cb => {
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
        }'

$content = $content.Replace($oldRestoreCache, $newRestoreCache)


# 9. renderProperties() 함수 내 광고 카드 동적 주입 개조
$oldRenderPropLoop = '            const pageItems = filteredProperties.slice(startIndex, endIndex);
            let htmlBuffer = [];
            
            pageItems.forEach((item, idx) => {'

$newRenderPropLoop = '            const pageItems = filteredProperties.slice(startIndex, endIndex);
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
                renderedCount++;'

$content = $content.Replace($oldRenderPropLoop, $newRenderPropLoop)


# 10. selectProperty() 및 closeDetailDrawer() 내 브라우저 타이틀 동기화 호출 추가
$oldSelectProp = '            // 데이터 바인딩 로드
            loadDetailView(selectedProperty);

            // 🎴 상세 창 열릴 때 첫 번째 탭(권리진단)을 기본 활성화로 지정합니다.
            changeDetailTab(\x27analysis\x27);

            // 🎴 서랍 열기 구동 (Slide-over Drawer Open)
            openDetailDrawer();'

$newSelectProp = '            // 데이터 바인딩 로드
            loadDetailView(selectedProperty);

            // 🎴 상세 창 열릴 때 첫 번째 그룹 탭(1.종합분석) 활성화 지정
            changeDetailGroupTab(1);

            // 🎴 서랍 열기 구동 (Slide-over Drawer Open)
            openDetailDrawer();
            
            // 브라우저 타이틀 싱크
            updateDynamicBrowserTitle();'

$content = $content.Replace($oldSelectProp, $newSelectProp)

# closeDetailDrawer 수정
$oldCloseDrawer = '                // 히스토리 상태 되돌리기
                if (window.history.state && window.history.state.drawerOpen) {
                    window.history.back();
                }
            }
        }'

$newCloseDrawer = '                // 히스토리 상태 되돌리기
                if (window.history.state && window.history.state.drawerOpen) {
                    window.history.back();
                }
            }
            
            // 브라우저 타이틀 홈 복원
            updateDynamicBrowserTitle();
        }'

$content = $content.Replace($oldCloseDrawer, $newCloseDrawer)


# 11. loadDetailView(item) 내 소유자, 채무자, 평수 분할, 기일 이력, 시나리오 ROI 표, AI 코멘트, 유사 매물 동적 바인딩 이식
$oldDetailDocSpec = '            // 🏠 물건 세부 스펙 분석 바인딩
            document.getElementById("detail-spec-ptype").innerText = item.ptype || "미상";
            document.getElementById("detail-spec-round").innerText = item.round_info || "신건";
            document.getElementById("detail-spec-appraisal").innerText = formatKRW(item.appraised_value);
            document.getElementById("detail-spec-minimum").innerText = formatKRW(item.minimum_bid);
            document.getElementById("detail-spec-date").innerText = `${item.bidding_date || "미상"} (${calculateRemainingDays(item.bidding_date) >= 0 ? \x27D-\x27 + calculateRemainingDays(item.bidding_date) : \x27종결\x27})`;'

$newDetailDocSpec = '            // 🏠 물건 세부 스펙 분석 바인딩
            document.getElementById("detail-spec-ptype").innerText = item.ptype || "미상";
            document.getElementById("detail-spec-round").innerText = item.round_info || "신건";
            document.getElementById("detail-spec-appraisal").innerText = formatKRW(item.appraised_value);
            document.getElementById("detail-spec-minimum").innerText = formatKRW(item.minimum_bid);
            document.getElementById("detail-spec-date").innerText = `${item.bidding_date || "미상"} (${calculateRemainingDays(item.bidding_date) >= 0 ? \x27D-\x27 + calculateRemainingDays(item.bidding_date) : \x27종결\x27})`;

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
                    const agencyFee = Math.floor(bidPrice * 0.03); // 취득세 및 수수료 3% 가정
                    const cashNeeded = bidPrice - loan + agencyFee;
                    const annualInterest = Math.floor(loan * 0.045); // 연 4.5% 이자
                    
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
            renderSimilarProperties(item);'

$content = $content.Replace($oldDetailDocSpec, $newDetailDocSpec)


# 12. renderSimilarProperties(item) 구현 함수 주입
# loadDetailView(item) 함수 닫는 중괄호 } 직전(또는 그 아래)에 추가
$targetLoadDetailEnd = '            runCalculator();

            // --- 신규 12단 프리미엄 패널 동적 데이터 바인딩 ---'

$replaceLoadDetailEnd = '            runCalculator();

            // --- 신규 12단 프리미엄 패널 동적 데이터 바인딩 ---'

$content = $content.Replace($targetLoadDetailEnd, $replaceLoadDetailEnd)

# loadDetailView의 끝에 renderSimilarProperties 함수 주입
$targetDetailEnd = '            takeoverTbody.innerHTML = takeoverHtml;
            }
        }'

$replaceDetailEnd = '            takeoverTbody.innerHTML = takeoverHtml;
            }
        }

        // 🤝 동일 지역/용도 주변 유사 매물 3개 추천 카드 렌더러 함수
        function renderSimilarProperties(item) {
            const container = document.getElementById("detail-similar-container");
            if (!container) return;
            
            // 현재 sido 추출 (주소 첫 2글자)
            const currentSido = (item.address || "").substring(0, 2);
            
            // 동일 용도(ptype) 또는 동일 지역(sido)의 매물 3개 필터링 (현재 매물 제외)
            let similars = originalProperties.filter(p => p.id !== item.id);
            
            // 정밀 가중치 매칭 (1순위: 동일지역 + 동일용도, 2순위: 동일용도, 3순위: 동일지역)
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
        }'

$content = $content.Replace($targetDetailEnd, $replaceDetailEnd)

# 파일 쓰기
[System.IO.File]::WriteAllText($filePath, $content, [System.Text.Encoding]::UTF8)
Write-Host "index.html 개조 완료"
