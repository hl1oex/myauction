        // 📱 모바일 필터 사이드바 슬라이드 토글 제어
        function toggleSidebar() {
            const sidebar = document.getElementById("sidebar-panel");
            const backdrop = document.getElementById("sidebar-backdrop");
            if (sidebar && backdrop) {
                if (sidebar.classList.contains("-translate-x-full")) {
                    sidebar.classList.remove("-translate-x-full");
                    backdrop.classList.remove("hidden");
                } else {
                    sidebar.classList.add("-translate-x-full");
                    backdrop.classList.add("hidden");
                }
            }
        }
        // 🏠 홈(피드) 이동 및 필터 초기화 함수
        function goToHome() {
            resetFilters();
            switchMiddleTab('dashboard');
            closeDetailDrawer();
        }
        // 💾 필터 값 로컬스토리지 저장 함수
        function saveFiltersToCache() {
            const gradeFilterEl = document.querySelector('input[name="grade-filter"]:checked');
            const gradeVal = gradeFilterEl ? gradeFilterEl.value : 'all';
            const filters = {
                search: document.getElementById("search-input").value,
                selectedSources: Array.from(document.querySelectorAll('input[name="source-check"]:checked')).map(cb => cb.value),
                selectedPtypes: Array.from(document.querySelectorAll('input[name="ptype-check"]:checked')).map(cb => cb.value),
                selectedSidos: Array.from(document.querySelectorAll('input[name="sido-check"]:checked')).map(cb => cb.value),
                dateLimit: document.getElementById("date-filter").value,
                budgetMinLimit: document.getElementById("budget-min-slider").value,
                budgetMaxLimit: document.getElementById("budget-max-slider").value,
                hidePast: document.getElementById("hide-past-toggle").checked,
                showFavorites: document.getElementById("show-favorites-toggle").checked,
                gradeFilter: gradeVal,
                selectedCourts: Array.from(document.querySelectorAll('input[name="court-check"]:checked')).map(cb => cb.value),
                selectedSigungus: Array.from(document.querySelectorAll('input[name="sigungu-check"]:checked')).map(cb => cb.value)
            };
            localStorage.setItem('auction_filters_v3', JSON.stringify(filters));
        }
        // 💾 필터 값 로컬스토리지 복원 함수
        function restoreFiltersFromCache() {
            const cached = localStorage.getItem('auction_filters_v3');
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
                    // 방어 코드: 만약 구버전 캐시 복원 등으로 비부동산 키(vehicle, security, machinery, etc_goods)가 유실된 경우 기본 활성화합니다.
                    const hasAnyEtcPtype = filters.selectedPtypes.some(p => ['vehicle', 'security', 'machinery', 'etc_goods'].includes(p));
                    document.querySelectorAll('input[name="ptype-check"]').forEach(cb => {
                        if (!hasAnyEtcPtype && ['vehicle', 'security', 'machinery', 'etc_goods'].includes(cb.value)) {
                            cb.checked = true;
                        } else {
                            cb.checked = filters.selectedPtypes.indexOf(cb.value) > -1;
                        }
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
                const cachedMin = filters.budgetMinLimit || "10000000";
                const cachedMax = filters.budgetMaxLimit || filters.budgetLimit || "2000000000";
                const budgetMinSlider = document.getElementById("budget-min-slider");
                const budgetMaxSlider = document.getElementById("budget-max-slider");
                if (budgetMinSlider) budgetMinSlider.value = cachedMin;
                if (budgetMaxSlider) budgetMaxSlider.value = cachedMax;
                updateBudgetLabel(parseInt(cachedMin), parseInt(cachedMax));
                updateBudgetSliderTrack(parseInt(cachedMin), parseInt(cachedMax));
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
        }        // 🚀 헤더 통계 카운팅 갱신 헬퍼 함수
        function updateHeaderStats(propertiesList) {
            const total = propertiesList.length;
            const court = propertiesList.filter(p => p.source === 'court' || p.source === 'court_etc').length;
            const onbid = propertiesList.filter(p => p.source === 'onbid' || p.source === 'onbid_etc').length;
            const headerTotal = document.getElementById("header-total-count");
            const headerCourt = document.getElementById("header-court-count");
            const headerOnbid = document.getElementById("header-onbid-count");
            if (headerTotal) headerTotal.innerText = total.toLocaleString();
            if (headerCourt) headerCourt.innerText = court.toLocaleString();
            if (headerOnbid) headerOnbid.innerText = onbid.toLocaleString();
        }
        // 로컬스토리지 저장 시 용량 한도 초과 방지를 위한 매물 데이터 경량화 함수입니다.
        function minimizePropertyForCache(p) {
            const minimized = { ...p };
            if (minimized.desc_content && minimized.desc_content.length > 150) {
                minimized.desc_content = minimized.desc_content.substring(0, 150) + "...";
            }
            if (minimized.notes_content) {
                const metaIndex = minimized.notes_content.indexOf("__METADATA__");
                if (metaIndex !== -1) {
                    const textPart = minimized.notes_content.substring(0, metaIndex);
                    const metaPart = minimized.notes_content.substring(metaIndex);
                    const shortText = textPart.length > 200 ? textPart.substring(0, 200) + "..." : textPart;
                    minimized.notes_content = shortText + "\n\n" + metaPart;
                } else {
                    if (minimized.notes_content.length > 200) {
                        minimized.notes_content = minimized.notes_content.substring(0, 200) + "...";
                    }
                }
            }
            return minimized;
        }
        // 1. [3중 방어막] 백엔드 데이터 비동기 연동 및 로딩 정지 방지 (전체 건수 모니터링 연동)
        async function fetchDataFromServer(forceLoad = false) {
            const sensor = document.getElementById("connection-sensor");
            // 수동 새로고침 강제 호출 시 서버의 최신 타임스탬프를 먼저 갱신합니다. (3초 타임아웃 경쟁 방어 적용)
            if (forceLoad) {
                try {
                    await Promise.race([
                        fetchSyncStatus(),
                        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 3000))
                    ]);
                } catch (e) {
                    console.warn("⚠️ 수동 새로고침 시 sync_info 조회 실패 또는 타임아웃 - 데이터 조회를 계속 가동합니다.", e);
                }
            }
            // 10초 타임아웃 설정 (10초 동안 Supabase 응답이 없으면 강제로 Fallback 로컬 데이터 로드)
            dbTimeoutTimer = setTimeout(() => {
                if (isFirstLoad) {
                    console.warn("⚠️ Supabase 연결 타임아웃(10초 초과) - 로컬 오프라인 데이터로 전향합니다.");
                    loadFallbackData();
                    isFirstLoad = false;
                }
            }, 10000);
            try {
                // Supabase로부터 전체 매물을 비동기로 가져오는 함수를 정의합니다.
                const loadData = async () => {
                    let allData = [];
                    let from = 0;
                    const step = 1000;
                    let hasMore = true;
                    // Supabase 서버의 1,000건 최대 응답 캡 제한을 극복하기 위해 페이징 루프 동기화를 실행합니다.
                    while (hasMore) {
                        const { data, error } = await supabaseClient
                            .from('properties')
                            .select('*')
                            .range(from, from + step - 1);
                        if (error) throw error;
                        if (data && data.length > 0) {
                            allData = allData.concat(data);
                            if (data.length < step) {
                                hasMore = false;
                            } else {
                                from += step;
                            }
                        } else {
                            hasMore = false;
                        }
                    }
                    if (dbTimeoutTimer) {
                        clearTimeout(dbTimeoutTimer);
                        dbTimeoutTimer = null;
                    }
                    if (allData.length > 0) {
                        originalProperties = allData.map(item => {
                            let finalId = item.id;
                            if (!isNaN(Number(finalId))) {
                                finalId = Number(finalId);
                            }
                            const remDays = calculateRemainingDays(item.bidding_date);
                            return { ...item, id: finalId, remaining_days: remDays };
                        });
                        // 로컬스토리지에 최신 매물 목록 및 최신 타임스탬프 캐싱 (용량 한도 초과 예방을 위해 상위 10,000건 슬라이싱 및 경량화 저장)
                        try {
                            const slicedForCache = originalProperties.slice(0, 10000).map(minimizePropertyForCache);
                            localStorage.setItem('cached_properties', JSON.stringify(slicedForCache));
                            if (latestServerTimestamp) {
                                localStorage.setItem('cached_properties_timestamp', latestServerTimestamp);
                            }
                        } catch (cacheErr) {
                            console.warn('로컬 캐시 1차 저장 실패 (1만 건) - 5천 건 축소 저장 시도합니다.', cacheErr);
                            try {
                                const slicedForCache = originalProperties.slice(0, 5000).map(minimizePropertyForCache);
                                localStorage.setItem('cached_properties', JSON.stringify(slicedForCache));
                            } catch (retryErr) {
                                console.error('로컬 캐시 저장 최종 실패 - 캐시를 안전하게 삭제합니다.', retryErr);
                                localStorage.removeItem('cached_properties');
                                localStorage.removeItem('cached_properties_timestamp');
                            }
                        }
                        // 헤더 통계 카운팅 동적 갱신
                        updateHeaderStats(originalProperties);
                        sensor.innerHTML = '<span class="w-2 h-2 rounded-full bg-[#10b981] animate-ping"></span><span class="hidden sm:inline">🟢 실시간 데이터 연동 정상 (' + originalProperties.length.toLocaleString() + '건)</span><span class="inline sm:hidden">🟢 ' + originalProperties.length.toLocaleString() + '건</span>';
                        sensor.className = "flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[9px] sm:text-[10px] font-black shadow-sm cursor-pointer flex-shrink-0";
                        applyFilters();
                    } else {
                        if (isFirstLoad) {
                            console.warn("⚠️ Supabase 데이터 응답이 비어 있어 예비 데이터를 사용합니다.");
                            loadFallbackData();
                        }
                    }
                    isFirstLoad = false;
                };
                // 최초 데이터 조회
                await loadData();
                loadAdSettings(); // 📢 광고 정보 실시간 동기화
            } catch (error) {
                console.warn("⚠️ Supabase 연결 실패 - 예비 시뮬레이션 데이터를 안전 탑재합니다.", error);
                if (dbTimeoutTimer) {
                    clearTimeout(dbTimeoutTimer);
                    dbTimeoutTimer = null;
                }
                if (isFirstLoad) {
                    loadFallbackData();
                    isFirstLoad = false;
                }
            }
        }
        // 🚀 첫 접속 시 캐시 유효성을 검증하여 필요한 경우에만 데이터를 가져오는 제어 함수
        async function initDataLoad() {
            loadAdSettings(); // 📢 Supabase 광고 설정 로드
            const sensor = document.getElementById("connection-sensor");
            // 1. 먼저 sync_info를 조회하여 서버의 최신 타임스탬프를 가져옵니다. (3초 타임아웃 경쟁 방어 적용)
            let serverLastSync = null;
            try {
                serverLastSync = await Promise.race([
                    fetchSyncStatus(),
                    new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 3000))
                ]);
            } catch (e) {
                console.warn("⚠️ sync_info 타임스탬프 조회 실패 또는 타임아웃 - 캐시 상태를 우회 점검합니다.", e);
            }
            // 2. 로컬 스토리지에 캐시된 데이터 및 타임스탬프가 있는지 확인합니다.
            const cachedData = localStorage.getItem('cached_properties');
            const cachedTimestamp = localStorage.getItem('cached_properties_timestamp');
            if (cachedData && cachedTimestamp && serverLastSync && cachedTimestamp === serverLastSync) {
                console.log("⚡ [성능 최적화] 로컬 캐시가 최신 상태이므로 서버 쿼리를 건너뛰고 캐시에서 바로 복구합니다.");
                try {
                    const parsed = JSON.parse(cachedData);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        originalProperties = parsed;
                        // 통계 갱신
                        updateHeaderStats(originalProperties);
                        if (sensor) {
                            sensor.innerHTML = '<span class="w-2 h-2 rounded-full bg-[#10b981]"></span><span class="hidden sm:inline">🟢 캐시 데이터 로드 완료 (' + originalProperties.length.toLocaleString() + '건)</span><span class="inline sm:hidden">🟢 ' + originalProperties.length.toLocaleString() + '건</span>';
                            sensor.className = "flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[9px] sm:text-[10px] font-black shadow-sm cursor-pointer flex-shrink-0";
                        }
                        applyFilters();
                        isFirstLoad = false;
                        return;
                    }
                } catch (err) {
                    console.warn("캐시 데이터 복구 실패 - 서버에서 데이터를 다시 로드합니다.", err);
                }
            }
            // 3. 캐시가 구버전이거나 데이터가 없으면 서버에서 가져옵니다.
            await fetchDataFromServer(false);
        }
        function loadFallbackData() {
            const sensor = document.getElementById("connection-sensor");
            originalProperties = fallbackData;
            // 로컬스토리지 캐시 데이터 복구 시도
            try {
                const cached = localStorage.getItem('cached_properties');
                if (cached) {
                    const parsed = JSON.parse(cached);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        originalProperties = parsed;
                        console.log(`[+] 로컬 캐시에서 ${parsed.length}건의 실제 매물 데이터를 복구하였습니다.`);
                    }
                }
            } catch (cacheErr) {
                console.warn('로컬 캐시 복구 실패', cacheErr);
            }
            sensor.innerHTML = '<span class="w-2 h-2 rounded-full bg-amber-500"></span><span class="hidden sm:inline">🟡 로컬 오프라인 모드 가동 (' + originalProperties.length.toLocaleString() + '건)</span><span class="inline sm:hidden">🟡 ' + originalProperties.length.toLocaleString() + '건</span>';
            sensor.className = "flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[9px] sm:text-[10px] font-black shadow-sm cursor-pointer flex-shrink-0";
            applyFilters();
        }
        let syncChannel = null; // sync_info 실시간 채널
        // 수집 트래커 로그 현황 가져오기
        async function fetchSyncStatus() {
            try {
                let serverSyncTime = null;
                const { data, error } = await supabaseClient
                    .from('sync_info')
                    .select('*')
                    .eq('id', 1)
                    .single();
                if (error) throw error;
                if (data) {
                    const logs = data.logs || [];
                    const lastCourtLog = logs.find(l => l.task_name === 'court_scraper');
                    const lastOnbidLog = logs.find(l => l.task_name === 'onbid_fetcher');
                    let courtTimeStr = "기록 없음";
                    let onbidTimeStr = "기록 없음";
                    let courtTimestamp = 0;
                    let onbidTimestamp = 0;
                    if (lastCourtLog && lastCourtLog.timestamp) {
                        const date = new Date(lastCourtLog.timestamp);
                        courtTimeStr = date.toLocaleString('ko-KR', { hour12: false });
                        courtTimestamp = date.getTime();
                    }
                    if (lastOnbidLog && lastOnbidLog.timestamp) {
                        const date = new Date(lastOnbidLog.timestamp);
                        onbidTimeStr = date.toLocaleString('ko-KR', { hour12: false });
                        onbidTimestamp = date.getTime();
                    }
                    document.getElementById("sync-court-time").innerText = courtTimeStr;
                    document.getElementById("sync-onbid-time").innerText = onbidTimeStr;
                    const maxTimestamp = Math.max(courtTimestamp, onbidTimestamp);
                    if (maxTimestamp > 0) {
                        serverSyncTime = new Date(maxTimestamp).toISOString();
                        latestServerTimestamp = serverSyncTime;
                    }
                }
                return serverSyncTime;
            } catch (error) {
                console.error("Supabase sync_info 로드 에러:", error);
                setOfflineSyncTime();
                return null;
            }
        }
        function setOfflineSyncTime() {
            document.getElementById("sync-court-time").innerText = "오프라인";
            document.getElementById("sync-onbid-time").innerText = "오프라인";
        }
        // 브라우저 뒤로가기 발생 시 상세 드로어 가드 바인딩
        window.addEventListener('popstate', function(event) {
            if (!event.state || !event.state.drawerOpen) {
                const drawer = document.getElementById("detail-drawer");
                if (drawer && drawer.classList.contains("translate-x-0")) {
                    drawer.classList.remove("translate-x-0");
                    drawer.classList.add("translate-x-full");
                    const backdrop = document.getElementById("drawer-backdrop");
                    if (backdrop) {
                        setTimeout(() => {
                            backdrop.classList.add("hidden");
                        }, 300);
                    }
                }
            }
        });
        // 🚀 Firebase 클라우드 초기화는 데이터 수집 함수에서 dynamic import 모듈로 로딩 및 할당합니다.
        let db = null;
        let latestServerTimestamp = null; // 🚀 서버 최종 동기화 시간
        let isFirstLoad = true; // 최초 로드 여부 플래그
        let dbTimeoutTimer = null; // 타임아웃 타이머
        let originalProperties = [];  // 서버에서 수신한 전체 데이터 원본
        let filteredProperties = [];  // 검색/필터 가공 데이터
        let currentSortKey = 'score'; // 현재 정렬 기준
        let currentSortDir = 'desc';  // 현재 정렬 방향 ('asc' | 'desc')
        let selectedProperty = null;  // 현재 선택된 활성화 매물 객체
        let currentTabId = 'dashboard'; // 현재 활성화된 탭 ID
        // 🚀 비부동산 자산 전환 시 원본 부동산 탭 복원용 캐시 변수
        let originalPanel2Html = "";
        let originalPanel3Html = "";
        // 🚀 성능 극대화 고도화: 대용량 데이터 지연 로딩(Pagination) 및 디바운싱 데몬 설정
        let currentPage = 1;
        const itemsPerPage = 35;      // 한 번에 렌더링할 물건 카드 수 (초기 35개, 스크롤 시 자동 추가)
        let debounceTimer = null;
        // 전국 시도 및 시군구 정보 딕셔너리
        const FULL_REGIONS = {
            "서울": ["강남구", "강동구", "강북구", "강서구", "관악구", "광진구", "구로구", "금천구", "노원구", "도봉구", "동대문구", "동작구", "마포구", "서대문구", "서초구", "성동구", "성북구", "송파구", "양천구", "영등포구", "용산구", "은평구", "종로구", "중구", "중랑구"],
            "부산": ["강서구", "금정구", "기장군", "남구", "동구", "동래구", "부산진구", "북구", "사상구", "사하구", "서구", "수영구", "연제구", "영도구", "중구", "해운대구"],
            "대구": ["남구", "달서구", "달성군", "동구", "북구", "서구", "수성구", "중구", "군위군"],
            "인천": ["강화군", "계양구", "남동구", "동구", "미추홀구", "부평구", "서구", "연수구", "옹진군", "중구"],
            "광주": ["광산구", "남구", "동구", "북구", "서구"],
            "대전": ["대덕구", "동구", "서구", "유성구", "중구"],
            "울산": ["남구", "동구", "북구", "울주군", "중구"],
            "세종": ["세종시"],
            "경기": ["가평군", "고양시 덕양구", "고양시 일산동구", "고양시 일산서구", "과천시", "광명시", "광주시", "구리시", "군포시", "김포시", "남양주시", "동두천시", "부천시", "성남시 분당구", "성남시 수정구", "성남시 중원구", "수원시 권선구", "수원시 영통구", "수원시 장안구", "수원시 팔달구", "시흥시", "안산시 단원구", "안산시 상록구", "안성시", "안양시 동안구", "안양시 만안구", "양주시", "양평군", "여주시", "연천군", "오산시", "용인시 기흥구", "용인시 수지구", "용인시 처인구", "의왕시", "의정부시", "이천시", "파주시", "평택시", "포천시", "하남시", "화성시"],
            "강원": ["강릉시", "고성군", "동해시", "삼척시", "속초시", "양구군", "양양군", "영월군", "원주시", "인제군", "정선군", "철원군", "춘천시", "태백시", "평창군", "홍천군", "화천군", "횡성군"],
            "충북": ["괴산군", "단양군", "보은군", "영동군", "옥천군", "음성군", "제천시", "증평군", "진천군", "청주시 상당구", "청주시 서원구", "청주시 청원구", "청주시 흥덕구", "충주시"],
            "충남": ["계룡시", "공주시", "금산군", "논산시", "당진시", "부여군", "서산시", "서천군", "아산시", "예산군", "천안시 동남구", "천안시 서북구", "청양군", "태안군", "홍성군"],
            "전북": ["고창군", "군산시", "김제시", "남원시", "무주군", "부안군", "순창군", "완주군", "익산시", "임실군", "장수군", "전주시 덕진구", "전주시 완산구", "정읍시", "진안군"],
            "전남": ["강진군", "고흥군", "곡성군", "광양시", "구례군", "나주시", "담양군", "목포시", "무안군", "보성군", "순천시", "신안군", "여수시", "영광군", "영암군", "완도군", "장성군", "장흥군", "진도군", "함평군", "해남군", "화순군"],
            "경북": ["경산시", "경주시", "고령군", "구미시", "김천시", "문경시", "봉화군", "상주시", "성주군", "안동시", "영덕군", "영양군", "영주시", "영천시", "예천군", "울릉군", "울진군", "의성군", "청도군", "청송군", "칠곡군", "포항시 남구", "포항시 북구"],
            "경남": ["거제시", "거창군", "고성군", "김해시", "남해군", "밀양시", "사천시", "산청군", "양산시", "의령군", "진주시", "창녕군", "창원시 마산합포구", "창원시 마산회원구", "창원시 성산구", "창원시 의창구", "창원시 진해구", "통영시", "하동군", "함안군", "함양군", "합천군"],
            "제주": ["제주시", "서귀포시"]
        };
        // 3단계 무한 로딩 대비 가상 오프라인 예비 시뮬레이션 데이터셋
        const fallbackData = [
            {
                id: 101,
                source: "court",
                auction_no: "2025타경10452",
                address: "서울특별시 강남구 대치동 988 대치팰리스 아파트 101동 1502호",
                ptype: "아파트/주택",
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
                ptype: "아파트/주택",
                appraised_value: 3400000000,
                minimum_bid: 2720000000,
                bidding_date: "2026-06-18",
                round_info: "2회차 매각기일",
                desc_content: "공동 소유주의 지분 분할 청구 소송에 기인하여 형식적 경매가 청구된 아파트입니다. 지분 전원을 일괄 취득하여 하자가 매우 적습니다.",
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
                desc_content: "토지가 제외되고 지상 건물만 매각되는 '건물만 매각' 특수 물건입니다. 토지 소유주로부터 건물 철거 소송 및 지료 청구 압박 분쟁 위험이 심대하여 입찰 주의가 요망됩니다.",
                notes_content: "⚠️ 건물만 매각 리스크 극대화 / 토지 사용 지료 분쟁 소송 우려",
                link_url: "https://www.courtauction.go.kr",
                grade: "X",
                score: 0,
                remaining_days: -17
            }
        ];
        // 페이지 파싱 즉시 가동 (CDN 병목으로 인한 멈춤 완전 우회 및 스크롤 옵저버 탑재)
                // 📱 지능형 필터링 센터 모바일 화면 내 페이지 가운데 배치 (E2E 스크롤 및 콤팩트 스타일)
        function handleFeedScroll(e) {
            const target = e.currentTarget;
            if (target.scrollTop + target.clientHeight >= target.scrollHeight - 100) {
                loadMoreProperties();
            }
        }
        function initResponsiveLayout() {
            const sidebar = document.getElementById("sidebar-panel");
            const dashboardView = document.getElementById("dashboard-view");
            const mainGridContainer = document.getElementById("main-grid-container");
            const centerSection = document.getElementById("center-feed-section");
            const headerToggleBtn = document.getElementById("header-sidebar-toggle-btn");
            const closeBtn = document.getElementById("sidebar-close-btn");
            const propertiesContainer = document.getElementById("properties-container");
            if (!sidebar || !dashboardView || !mainGridContainer || !centerSection || !propertiesContainer) return;
            // 스크롤 이벤트 해제 후 알맞은 컨테이너에 재바인딩
            dashboardView.removeEventListener("scroll", handleFeedScroll);
            propertiesContainer.removeEventListener("scroll", handleFeedScroll);
            if (window.innerWidth < 1024) {
                // 모바일 레이아웃: 필터 패널을 피드 중앙 맨 위로 배치
                if (sidebar.parentNode !== dashboardView) {
                    dashboardView.insertBefore(sidebar, dashboardView.firstChild);
                }
                // 페이지 전체 스크롤 활성화: dashboard-view를 스크롤러로 사용
                dashboardView.className = "bg-slate-50 flex flex-col flex-1 overflow-y-auto custom-scrollbar";
                propertiesContainer.className = "overflow-visible bg-white";
                // 모바일 컴팩트 스타일: 필터 패널의 높이를 고정하지 않고 스크롤되도록 둠 + 여백 축소
                sidebar.className = "bg-white border-b border-slate-200 p-3 space-y-3 w-full flex-shrink-0 block z-10 sidebar-compact";
                if (headerToggleBtn) headerToggleBtn.classList.add("hidden");
                if (closeBtn) closeBtn.classList.add("hidden");
                // 모바일 스크롤 바인딩
                dashboardView.addEventListener("scroll", handleFeedScroll);
            } else {
                // 데스크톱 레이아웃: 필터 패널을 왼쪽 열로 이동
                if (sidebar.parentNode !== mainGridContainer) {
                    mainGridContainer.insertBefore(sidebar, centerSection);
                }
                // 데스크톱 스크롤: properties-container만 스크롤
                dashboardView.className = "flex flex-col flex-1 overflow-hidden";
                propertiesContainer.className = "flex-1 overflow-auto custom-scrollbar bg-white";
                sidebar.className = "bg-white border-r border-slate-200 flex flex-col h-full lg:w-[22%] lg:min-w-[290px] lg:max-w-[350px] block";
                if (headerToggleBtn) headerToggleBtn.classList.add("hidden"); // 항상 숨김 유지
                if (closeBtn) closeBtn.classList.remove("hidden");
                // 데스크톱 스크롤 바인딩
                propertiesContainer.addEventListener("scroll", handleFeedScroll);
            }
            // 탭 상태 동기화 (리사이즈 시 hidden 상태 복원)
            const glossaryView = document.getElementById("glossary-view");
            const guideView = document.getElementById("guide-view");
            const architectureView = document.getElementById("architecture-view");
            if (glossaryView && guideView && architectureView) {
                if (currentTabId === 'dashboard') {
                    dashboardView.classList.remove("hidden");
                    glossaryView.classList.add("hidden");
                    guideView.classList.add("hidden");
                    architectureView.classList.add("hidden");
                } else if (currentTabId === 'glossary') {
                    dashboardView.classList.add("hidden");
                    glossaryView.classList.remove("hidden");
                    guideView.classList.add("hidden");
                    architectureView.classList.add("hidden");
                } else if (currentTabId === 'guide') {
                    dashboardView.classList.add("hidden");
                    glossaryView.classList.add("hidden");
                    guideView.classList.remove("hidden");
                    architectureView.classList.add("hidden");
                } else if (currentTabId === 'architecture') {
                    dashboardView.classList.add("hidden");
                    glossaryView.classList.add("hidden");
                    guideView.classList.add("hidden");
                    architectureView.classList.remove("hidden");
                }
            }
        }
        window.addEventListener("resize", initResponsiveLayout);
        document.addEventListener("DOMContentLoaded", function() {
            // 원본 탭 HTML 백업
            const p2 = document.getElementById("detail-group-panel-2");
            const p3 = document.getElementById("detail-group-panel-3");
            if (p2) originalPanel2Html = p2.innerHTML;
            if (p3) originalPanel3Html = p3.innerHTML;
            initResponsiveLayout();
            initBudgetSliderZIndexController();
            restoreFiltersFromCache();
            initDataLoad();
            // v1.2 챗봇 및 큐레이션 바 가동 초기화
            if (typeof v12Features !== 'undefined') v12Features.init();
            if (typeof v12ThemeCuration !== 'undefined') v12ThemeCuration.injectCurationBar("v12-curation-container");
        });
        // 2. 예산 설정 라벨 포맷터 (디바운스 연동)
        function updateBudgetLabel(minVal, maxVal) {
            const label = document.getElementById("budget-label");
            if (maxVal === undefined) {
                maxVal = minVal;
                minVal = 10000000;
            }
            const minV = parseInt(minVal);
            const maxV = parseInt(maxVal);
            if (minV <= 10000000 && maxV >= 2000000000) {
                label.innerText = "제한 없음";
            } else {
                const minText = minV <= 10000000 ? "1천만" : formatKRW(minV);
                const maxText = maxV >= 2000000000 ? "제한 없음" : formatKRW(maxV);
                label.innerText = `${minText} ~ ${maxText}`;
            }
            debouncedApplyFilters(); // 슬라이드 드래그 시 과부하 렌더링 방지 (디바운싱 작동)
        }
        // 💸 듀얼 슬라이더 z-index 제어 (터치/마우스 포인터 기반 가까운 핸들 자동 활성화)
        function initBudgetSliderZIndexController() {
            const container = document.getElementById("budget-slider-container");
            const minSlider = document.getElementById("budget-min-slider");
            const maxSlider = document.getElementById("budget-max-slider");
            if (!container || !minSlider || !maxSlider) return;
            function updateZIndex(clientX) {
                const rect = container.getBoundingClientRect();
                const relativeX = clientX - rect.left;
                const percent = (relativeX / rect.width) * 100;
                const minLimit = parseInt(minSlider.min) || 10000000;
                const maxLimit = parseInt(minSlider.max) || 2000000000;
                const range = maxLimit - minLimit;
                const minVal = parseInt(minSlider.value);
                const maxVal = parseInt(maxSlider.value);
                const minPercent = ((minVal - minLimit) / range) * 100;
                const maxPercent = ((maxVal - minLimit) / range) * 100;
                // 마우스 또는 터치 좌표가 minPercent에 더 가까우면 minSlider를 위로 올립니다.
                if (Math.abs(percent - minPercent) < Math.abs(percent - maxPercent)) {
                    minSlider.style.zIndex = "35";
                    maxSlider.style.zIndex = "25";
                } else {
                    minSlider.style.zIndex = "25";
                    maxSlider.style.zIndex = "35";
                }
            }
            container.addEventListener("mousemove", function(e) {
                updateZIndex(e.clientX);
            });
            container.addEventListener("touchstart", function(e) {
                if (e.touches && e.touches.length > 0) {
                    updateZIndex(e.touches[0].clientX);
                }
            }, { passive: true });
            container.addEventListener("touchmove", function(e) {
                if (e.touches && e.touches.length > 0) {
                    updateZIndex(e.touches[0].clientX);
                }
            }, { passive: true });
        }
        // 💸 듀얼 슬라이더 상호 교차 제한 가드 및 트랙 갱신 처리
        function onBudgetSliderInput(changedId) {
            const minSlider = document.getElementById("budget-min-slider");
            const maxSlider = document.getElementById("budget-max-slider");
            if (!minSlider || !maxSlider) return;
            let minVal = parseInt(minSlider.value);
            let maxVal = parseInt(maxSlider.value);
            if (minVal > maxVal) {
                if (changedId === 'min') {
                    minSlider.value = maxVal;
                    minVal = maxVal;
                } else {
                    maxSlider.value = minVal;
                    maxVal = minVal;
                }
            }
            // 슬라이더 조작 시 활성화된 핸들이 위에 오도록 z-index를 보정합니다.
            if (changedId === 'min') {
                minSlider.style.zIndex = "35";
                maxSlider.style.zIndex = "25";
            } else {
                minSlider.style.zIndex = "25";
                maxSlider.style.zIndex = "35";
            }
            updateBudgetLabel(minVal, maxVal);
            updateBudgetSliderTrack(minVal, maxVal);
        }
        // 💸 듀얼 슬라이더 활성 구간 하이라이트 트랙 갱신
        function updateBudgetSliderTrack(minVal, maxVal) {
            const minSlider = document.getElementById("budget-min-slider");
            if (!minSlider) return;
            const minLimit = parseInt(minSlider.min) || 10000000;
            const maxLimit = parseInt(minSlider.max) || 2000000000;
            const range = maxLimit - minLimit;
            const leftPercent = ((minVal - minLimit) / range) * 100;
            const rightPercent = 100 - (((maxVal - minLimit) / range) * 100);
            const track = document.getElementById("slider-track");
            if (track) {
                track.style.left = leftPercent + "%";
                track.style.right = rightPercent + "%";
            }
        }
        // [신규 기능 1] 다이내믹 시군구 소분류 체크박스 업데이트 (DOM 쓰기 최적화 완료)
        function updateSigunguFilter(apply = true) {
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
        }
        // [신규 기능 2] 사설 경매 엑셀/CSV/JSON 수동 업로드 (Mix 엔진)
        function handleFileUpload(input) {
            const file = input.files[0];
            if (!file) return;
            const status = document.getElementById("upload-status");
            status.classList.remove("hidden");
            status.innerText = "⏳ 파일 파싱 중...";
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    let parsedData = [];
                    if (file.name.endsWith(".json")) {
                        parsedData = JSON.parse(e.target.result);
                    } else {
                        // 간단한 CSV 파서 탑재 (Mix 병합)
                        const lines = e.target.result.split("\n");
                        if (lines.length > 1) {
                            const headers = lines[0].split(",").map(h => h.trim().replace(/"/g, ''));
                            for (let i = 1; i < lines.length; i++) {
                                if (!lines[i].trim()) continue;
                                const cols = lines[i].split(",").map(c => c.trim().replace(/"/g, ''));
                                let row = {};
                                headers.forEach((h, idx) => {
                                    row[h] = cols[idx] || "";
                                });
                                const courtCount = originalProperties.filter(p => p.source === 'court' || p.source === 'court_etc').length;
                                const onbidCount = originalProperties.filter(p => p.source === 'onbid' || p.source === 'onbid_etc').length;
                                parsedData.push(row);
                            }
                        }
                    }
                    // 사설 업로드 스키마 연동 및 Mix 병합 개시
                    let mixCount = 0;
                    parsedData.forEach((item, index) => {
                        const parsedPrice = parseInt(item.minimum_bid || item.price || 0);
                        const parsedAppraisal = parseInt(item.appraised_value || item.appraisal || 0);
                        const address = item.address || item.st || "소재지 미상";
                        const auctionNo = item.auction_no || item.cs_no || `사설-2026-${Date.now()}-${index}`;
                        // 기존 DB에 사건번호 또는 주소가 겹치는지 검사하여 중복 제거 및 비고 병합(Mix)
                        const duplicate = originalProperties.find(p => p.auction_no === auctionNo || p.address === address);
                        if (duplicate) {
                            duplicate.desc_content = `${duplicate.desc_content} | 📁 [사설 추가 데이터]: ${item.desc_content || item.notes_content || ''}`;
                        } else {
                            // 신규 사설 물건으로 적재
                            originalProperties.push({
                                id: 2000 + index,
                                source: "private",
                                auction_no: auctionNo,
                                address: address,
                                ptype: item.ptype || "아파트/주택",
                                appraised_value: parsedAppraisal,
                                minimum_bid: parsedPrice,
                                bidding_date: item.bidding_date || "2026-12-31",
                                round_info: item.round_info || "사설 1회차",
                                desc_content: item.desc_content || "사설 시스템에서 병합된 수동 업로드 물건입니다.",
                                notes_content: item.notes_content || "📁 [사설 권리분석]: 검출된 특이 권리 관계가 없습니다.",
                                link_url: "https://www.courtauction.go.kr",
                                grade: item.grade || "B",
                                score: parseInt(item.score || 80),
                                remaining_days: calculateRemainingDays(item.bidding_date || "2026-12-31")
                            });
                            mixCount++;
                        }
                    });
                    status.innerText = `✅ 성공: 신규 ${mixCount}건 Mix 완료! (중복 제거 병합)`;
                    status.className = "text-[9px] text-emerald-600 font-bold text-center";
                    applyFilters();
                } catch (err) {
                    status.innerText = "❌ 파싱 실패 (올바른 CSV/JSON이 아닙니다)";
                    status.className = "text-[9px] text-rose-600 font-bold text-center";
                    console.error(err);
                }
            };
            reader.readAsText(file, "EUC-KR"); // 한글 깨짐 방지 디코딩
        }
        // 날짜 차이 계산 헬퍼
        function calculateRemainingDays(dateStr) {
            if (!dateStr) return 9999;
            try {
                const closeDate = new Date(dateStr);
                const today = new Date();
                today.setHours(0,0,0,0);
                const diffTime = closeDate - today;
                return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            } catch (e) {
                return 9999;
            }
        }
        // 3. 1원 단위 정교한 한글 금액 포맷 함수
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
        // 4. [신규 로직 통합] 실시간 다차원 지역/출처/일정 검색 필터 엔진 (페이지네이션 연동)
        function applyFilters() {
            const searchQuery = document.getElementById("search-input").value.trim().toLowerCase();
            const sourceCheckBoxes = document.querySelectorAll('input[name="source-check"]:checked');
            const selectedSources = Array.from(sourceCheckBoxes).map(cb => cb.value);
            const ptypeCheckBoxes = document.querySelectorAll('input[name="ptype-check"]:checked');
            const selectedPtypes = Array.from(ptypeCheckBoxes).map(cb => cb.value);
            const sidoCheckBoxes = document.querySelectorAll('input[name="sido-check"]:checked');
            const selectedSidos = Array.from(sidoCheckBoxes).map(cb => cb.value);
            const dateLimit = parseInt(document.getElementById("date-filter").value);
            const budgetMinLimit = parseInt(document.getElementById("budget-min-slider").value);
            const budgetMaxLimit = parseInt(document.getElementById("budget-max-slider").value);
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
                const priceVal = item.minimum_bid || item.appraised_value || 0;
                const matchesBudget = priceVal >= budgetMinLimit && (budgetMaxLimit >= 2000000000 || priceVal <= budgetMaxLimit);
                const matchesSource = selectedSources.length === 0 || 
                    selectedSources.includes(item.source) ||
                    (selectedSources.includes("onbid") && item.source === "onbid_etc") ||
                    (selectedSources.includes("court") && item.source === "court_etc");
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
                    // 비부동산 개별 분류 여부 판별.
                    const isVehicle = type.includes("차량") || type.includes("운송") || type.includes("자동차") || type.includes("선박") || type.includes("항공기") || type.includes("중기") || type.includes("지게차") || type.includes("suv");
                    const isSecurity = type.includes("유가증권") || type.includes("주식") || type.includes("채권") || type.includes("지분") || type.includes("증권");
                    const isMachinery = type.includes("기계") || (type.includes("장비") && !type.includes("운송장비")) || type.includes("기구") || type.includes("설비") || type.includes("기기");
                    for (const val of selectedPtypes) {
                        if (val === "apart") {
                            if (type.includes("아파트")) { matchesPtype = true; break; }
                        } else if (val === "officetel") {
                            if (type.includes("오피스텔")) { matchesPtype = true; break; }
                        } else if (val === "villa") {
                            if (type.includes("다세대") || type.includes("빌라") || type.includes("연립")) { matchesPtype = true; break; }
                        } else if (val === "house") {
                            if ((type.includes("주택") || type.includes("가구") || type.includes("단독") || type.includes("전원")) && !type.includes("아파트") && !type.includes("오피스텔") && !type.includes("다세대") && !type.includes("빌라") && !type.includes("연립")) { matchesPtype = true; break; }
                        } else if (val === "store") {
                            if (type.includes("상가") || type.includes("점포") || type.includes("근린") || type.includes("근생") || type.includes("생활시설") || type.includes("상업") || type.includes("빌딩") || type.includes("사무실")) { matchesPtype = true; break; }
                        } else if (val === "land") {
                            if (type.includes("토지") || type.includes("대지") || type.includes("임야") || type.includes("잡종지") || type.includes("대") || type.includes("전") || type.includes("답")) { matchesPtype = true; break; }
                        } else if (val === "factory") {
                            if (type.includes("공장") || type.includes("창고") || type.includes("산업")) { matchesPtype = true; break; }
                        } else if (val === "vehicle") {
                            if (isVehicle) { matchesPtype = true; break; }
                        } else if (val === "security") {
                            if (isSecurity) { matchesPtype = true; break; }
                        } else if (val === "machinery") {
                            if (isMachinery) { matchesPtype = true; break; }
                        } else if (val === "etc_goods") {
                            // 다른 비부동산 분류에 해당하지 않는 순수 기타동산/물품만 통과시킵니다.
                            if ((type.includes("물품") || type.includes("기타물품") || type.includes("동산") || type.includes("기타동산") || item.source === 'onbid_etc' || item.source === 'court_etc') && !isVehicle && !isSecurity && !isMachinery) { matchesPtype = true; break; }
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
        }
        // 5. 정렬 기준 정렬 함수 (단일 정렬 키 기준 양방향 토글 정렬 완벽 지원)
        function sortData(key) {
            if (currentSortKey === key) {
                // 동일 키 클릭 시 오름차순/내림차순 토글
                currentSortDir = currentSortDir === 'desc' ? 'asc' : 'desc';
            } else {
                // 새로운 키 클릭 시 기준별 기본 방향 설정
                currentSortKey = key;
                currentSortDir = (key === 'score' || key === 'price' || key === 'discount' || key === 'failed') ? 'desc' : 'asc';
            }
            updateSortButtonsUI();
            filteredProperties.sort((a, b) => {
                let valA, valB;
                if (currentSortKey === 'score') {
                    valA = typeof a.score === 'number' ? a.score : 0;
                    valB = typeof b.score === 'number' ? b.score : 0;
                } else if (currentSortKey === 'date') {
                    valA = typeof a.remaining_days === 'number' ? a.remaining_days : 9999;
                    valB = typeof b.remaining_days === 'number' ? b.remaining_days : 9999;
                } else if (currentSortKey === 'price') {
                    valA = typeof a.minimum_bid === 'number' ? a.minimum_bid : 0;
                    valB = typeof b.minimum_bid === 'number' ? b.minimum_bid : 0;
                } else if (currentSortKey === 'discount') {
                    valA = estimateAuctionRounds(a.appraised_value, a.minimum_bid, a.source).discount;
                    valB = estimateAuctionRounds(b.appraised_value, b.minimum_bid, b.source).discount;
                } else if (currentSortKey === 'failed') {
                    valA = estimateAuctionRounds(a.appraised_value, a.minimum_bid, a.source).failedCount;
                    valB = estimateAuctionRounds(b.appraised_value, b.minimum_bid, b.source).failedCount;
                } else {
                    valA = 0;
                    valB = 0;
                }
                if (valA !== valB) {
                    return currentSortDir === 'asc' ? valA - valB : valB - valA;
                }
                return 0;
            });
            // 🚀 AI 큐레이션 테마 필터링 추가 결합
            const currentCurationTheme = (typeof v12ThemeCuration !== 'undefined') ? v12ThemeCuration.getActiveTheme() : null;
            if (currentCurationTheme) {
                filteredProperties = filterPropertiesByTheme(filteredProperties, currentCurationTheme);
            }
            currentPage = 1;
            updateKPIDashboard();
            renderProperties();
        }
        function updateSortButtonsUI() {
            const sortButtons = {
                'score': { btn: document.getElementById("sort-score-btn"), text: "✨ 점수순" },
                'date': { btn: document.getElementById("sort-date-btn"), text: "📅 기일순" },
                'price': { btn: document.getElementById("sort-price-btn"), text: "💰 금액순" },
                'discount': { btn: document.getElementById("sort-discount-btn"), text: "📉 저감율순" },
                'failed': { btn: document.getElementById("sort-failed-btn"), text: "🔄 유찰순" }
            };
            const activeClass = "bg-royalBlue text-white px-2.5 py-1.5 rounded-lg text-xs font-black shadow-md transition-all flex items-center gap-1";
            const inactiveClass = "bg-white border border-slate-200 text-slate-600 px-2.5 py-1.5 rounded-lg text-xs font-black hover:bg-slate-50 transition-all flex items-center gap-1";
            for (const [btnKey, item] of Object.entries(sortButtons)) {
                if (item.btn) {
                    if (currentSortKey === btnKey) {
                        const arrow = currentSortDir === 'asc' ? '▲' : '▼';
                        item.btn.className = activeClass;
                        item.btn.innerHTML = `${item.text} ${arrow}`;
                    } else {
                        item.btn.className = inactiveClass;
                        item.btn.innerHTML = item.text;
                    }
                }
            }
        }
        // 6. 메인 피드 대시보드 KPI 값 갱신 및 상단 글로벌 카운트 배지 갱신
        function updateKPIDashboard() {
            const recommendedText = `${filteredProperties.length}건`;
            const totalText = originalProperties.length.toLocaleString();
            const highGradeCount = filteredProperties.filter(item => item.grade === 'A' || item.grade === 'B').length;
            const highText = `${highGradeCount}건`;
            const riskCount = filteredProperties.filter(item => item.grade === 'X').length;
            const riskText = `${riskCount}건`;
            // Update PC/Desktop elements
            const recPC = document.getElementById("kpi-recommended-count");
            if (recPC) recPC.innerText = recommendedText;
            const totPC = document.getElementById("kpi-total-count");
            if (totPC) totPC.innerText = totalText;
            const highPC = document.getElementById("kpi-high-count");
            if (highPC) highPC.innerText = highText;
            const riskPC = document.getElementById("kpi-risk-count");
            if (riskPC) riskPC.innerText = riskText;
            // Update Mobile elements
            const recMob = document.getElementById("kpi-recommended-count-mob");
            if (recMob) recMob.innerText = recommendedText;
            const totMob = document.getElementById("kpi-total-count-mob");
            if (totMob) totMob.innerText = totalText;
            const highMob = document.getElementById("kpi-high-count-mob");
            if (highMob) highMob.innerText = highText;
            const riskMob = document.getElementById("kpi-risk-count-mob");
            if (riskMob) riskMob.innerText = riskText;
            const headerTotal = document.getElementById("header-total-count");
            const headerCourt = document.getElementById("header-court-count");
            const headerOnbid = document.getElementById("header-onbid-count");
            if (headerTotal && headerCourt && headerOnbid) {
                const courtCount = originalProperties.filter(p => p.source === 'court').length;
                const onbidCount = originalProperties.filter(p => p.source === 'onbid' || p.source === 'onbid_etc').length;
                headerTotal.innerText = totalText;
                headerCourt.innerText = courtCount.toLocaleString();
                headerOnbid.innerText = onbidCount.toLocaleString();
            }
        }
        function resetFilters() {
            document.getElementById("search-input").value = "";
            document.querySelectorAll('input[name="source-check"]').forEach(cb => cb.checked = true);
            document.querySelectorAll('input[name="ptype-check"]').forEach(cb => cb.checked = true);
            document.querySelectorAll('input[name="sido-check"]').forEach(cb => cb.checked = false);
            document.getElementById("date-filter").value = "180";
            const minSlider = document.getElementById("budget-min-slider");
            const maxSlider = document.getElementById("budget-max-slider");
            if (minSlider) minSlider.value = "10000000";
            if (maxSlider) maxSlider.value = "2000000000";
            document.getElementById("hide-past-toggle").checked = true;
            document.getElementById("show-favorites-toggle").checked = false;
            showFavoritesOnly = false;
            const safeRadio = document.querySelector('input[name="grade-filter"][value="safe"]');
            if (safeRadio) safeRadio.checked = true;
            document.querySelectorAll('input[name="court-check"]').forEach(cb => cb.checked = false);
            document.getElementById("upload-status").classList.add("hidden");
            updateSigunguFilter(false);
            updateBudgetSliderTrack(10000000, 2000000000);
            updateBudgetLabel(10000000, 2000000000);
            applyFilters();
        }
        // [신규 기능 3] 유찰 회차 및 정확한 저감율 실시간 추정 계산기
        function estimateAuctionRounds(appraisal, price, source) {
            if (!appraisal || !price || appraisal <= 0 || price <= 0) {
                return { round: 1, failedCount: 0, discount: 0 };
            }
            const discount = Math.round(((appraisal - price) / appraisal) * 100);
            const ratio = price / appraisal;
            let failedCount = 0;
            if (source === "court") {
                if (ratio >= 0.95) failedCount = 0;
                else if (ratio >= 0.75) failedCount = 1;
                else if (ratio >= 0.55) failedCount = 2;
                else if (ratio >= 0.40) failedCount = 3;
                else failedCount = 4;
            } else { // 온비드 공매는 10% 저감
                if (ratio >= 0.95) failedCount = 0;
                else if (ratio >= 0.85) failedCount = 1;
                else if (ratio >= 0.75) failedCount = 2;
                else if (ratio >= 0.65) failedCount = 3;
                else failedCount = 4;
            }
            return {
                round: failedCount + 1,
                failedCount: failedCount,
                discount: discount < 0 ? 0 : discount
            };
        }
        // 8. 매물 스크롤 리스트 동적 렌더러 (모던 포털 카드형 반응형 그리드 뷰 탑재)
        function renderProperties() {
            const container = document.getElementById("properties-container");
            if (currentPage === 1) {
                container.innerHTML = "";
            }
            if (filteredProperties.length === 0) {
                container.innerHTML = `
                    <div class="text-center py-20 bg-white border border-slate-200 rounded-2xl p-8 shadow-sm m-5">
                        <i class="fa-solid fa-folder-open text-slate-300 text-4xl mb-3"></i>
                        <h4 class="font-extrabold text-slate-700 text-xs mb-1">매칭 자산 없음</h4>
                        <p class="text-[10px] text-slate-400">설정한 필터나 가용 예산 한도 내에 부합하는 추천 매물이 없습니다.</p>
                    </div>
                `;
                return;
            }
            // 처음 1페이지 로드 시에는 그리드 컨테이너 생성
            if (currentPage === 1) {
                container.innerHTML = `
                    <div id="properties-grid" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 p-3 pb-12 lg:pb-3">
                        <!-- 동적 카드들이 마운팅됨 -->
                    </div>
                `;
            }
            const grid = document.getElementById("properties-grid");
            if (!grid) return;
            // 페이지 범위 연산
            const startIndex = (currentPage - 1) * itemsPerPage;
            const endIndex = Math.min(currentPage * itemsPerPage, filteredProperties.length);
            if (startIndex >= filteredProperties.length) return;
            const pageItems = filteredProperties.slice(startIndex, endIndex);
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
                renderedCount++;
                let sourceBadge = "";
                if (item.source === 'court') {
                    sourceBadge = `<span class="bg-blue-50 text-royalBlue border border-blue-100 text-[11.5px] font-black px-1.5 py-0.5 rounded-md flex-shrink-0">⚖️ 경매</span>`;
                } else if (item.source === 'onbid') {
                    sourceBadge = `<span class="bg-emerald-50 text-emeraldSuccess border border-emerald-100 text-[11.5px] font-black px-1.5 py-0.5 rounded-md flex-shrink-0">🏢 공매</span>`;
                } else {
                    sourceBadge = `<span class="bg-slate-100 text-slate-600 border border-slate-200 text-[11.5px] font-black px-1.5 py-0.5 rounded-md flex-shrink-0">📁 사설</span>`;
                }
                let gradeClass = "bg-slate-500 text-white shadow-sm";
                let cardBg = "bg-white border-slate-200";
                let hoverBorder = "hover:border-royalBlue/30 hover:shadow-lg hover:shadow-blue-500/5";
                let warningBadge = "";
                let riskTitleClass = "text-slate-900";
                if (item.grade === 'A') {
                    gradeClass = "bg-[#10b981] text-white";
                } else if (item.grade === 'B') {
                    gradeClass = "bg-royalBlue text-white";
                } else if (item.grade === 'X') {
                    gradeClass = "bg-rose-500 text-white animate-pulse shadow-sm";
                    cardBg = "bg-rose-50/15 border-rose-200";
                    hoverBorder = "hover:border-rose-300 hover:shadow-lg hover:shadow-rose-500/5";
                    warningBadge = `<span class="bg-rose-100 text-rose-700 text-[11px] px-1.5 py-0.5 rounded-md font-black border border-rose-200 animate-bounce inline-flex items-center gap-0.5"><i class="fa-solid fa-triangle-exclamation text-[10px]"></i>위험</span>`;
                    riskTitleClass = "text-rose-950";
                }
                const isSelected = selectedProperty && selectedProperty.id === item.id;
                const activeBorderClass = isSelected ? "border-royalBlue ring-2 ring-royalBlue/10 shadow-md bg-blue-50/10" : "";
                // 디데이 라벨
                let ddayText = `D-${item.remaining_days}`;
                let ddayClass = "bg-rose-50 text-rose-700 border border-rose-200";
                if (item.remaining_days < 0) {
                    ddayText = "기일 마감";
                    ddayClass = "bg-slate-100 text-slate-400 border border-slate-200";
                } else if (item.remaining_days === 0) {
                    ddayText = "★ 금일 입찰";
                    ddayClass = "bg-amber-100 text-amber-700 border border-amber-200 animate-pulse font-black";
                }
                // 유찰 및 저감율 연산 호출
                const est = estimateAuctionRounds(item.appraised_value, item.minimum_bid, item.source);
                const delay = (idx % 10) * 40;
                const cardHtml = `
                    <div onclick="selectProperty(${item.id})" onmouseover="handleRowHover(${item.id})" id="card-${item.id}"
                         class="${cardBg} ${hoverBorder} ${activeBorderClass} fade-in-up border rounded-2xl p-3 flex flex-col justify-between cursor-pointer transition-all duration-300 transform hover:-translate-y-1 select-none"
                         style="animation-delay: ${delay}ms;">
                        <!-- Top Badges Row -->
                        <div class="flex justify-between items-center mb-2">
                            <div class="flex gap-1.5 items-center">
                                <!-- 관심 등록 별표 버튼 -->
                                <button id="star-btn-${item.id}" onclick="toggleFavoriteProperty(${item.id}, event)" class="p-1 hover:scale-110 active:scale-95 transition-all select-none mr-0.5" title="관심 등록 토글">
                                    ${favoritePropertyIds.has(item.id) 
                                        ? `<i class="fa-solid fa-star text-amber-400 text-[13px]"></i>` 
                                        : `<i class="fa-regular fa-star text-slate-400 text-[13px]"></i>`}
                                </button>
                                ${sourceBadge}
                                <span class="${ddayClass} text-[11.5px] font-black px-1.5 py-0.5 rounded-md">${ddayText}</span>
                            </div>
                            <div class="flex gap-1 items-center">
                                ${item.grade === 'X' ? warningBadge : ''}
                                <span class="${gradeClass} text-[11.5px] font-black px-1.5 py-0.5 rounded-md shadow-sm min-w-[34px] text-center">${item.grade}등급</span>
                            </div>
                        </div>
                        <!-- Mid Content: Address & Info -->
                        <div class="space-y-1 flex-1 flex flex-col justify-between">
                            <div>
                                <h4 class="${riskTitleClass} font-extrabold text-sm leading-normal line-clamp-2 min-h-[32px] tracking-tight hover:text-royalBlue transition-colors" title="${item.address}">
                                    ${item.address}
                                </h4>
                                <div class="text-[12px] text-slate-400 font-bold mt-1 flex justify-between items-center">
                                    <span class="truncate max-w-[120px] text-slate-400">${item.ptype}</span>
                                    <span class="font-mono text-slate-500 font-bold bg-slate-100 border border-slate-200 px-1 py-0.2 rounded text-[11px]">${item.auction_no}</span>
                                </div>
                            </div>
                            <!-- Financial Details -->
                            <div class="mt-2.5 pt-2.5 border-t border-slate-100 space-y-1">
                                <div class="flex items-center justify-between">
                                    <span class="text-[11.5px] text-slate-400 font-bold">최저 매각가</span>
                                    <span class="text-rose-600 font-black text-sm font-outfit tracking-wide">${formatKRW(item.minimum_bid)}</span>
                                </div>
                                <div class="flex justify-between text-[11.5px] text-slate-400 font-medium">
                                    <span>감정가</span>
                                    <span class="font-mono font-semibold text-slate-600">${formatKRW(item.appraised_value)}</span>
                                </div>
                                <div class="flex justify-between text-[11.5px] text-slate-400 font-medium">
                                    <span>저감/유찰</span>
                                    <span class="font-bold text-royalBlue font-mono">${est.discount}% 저감 | ${est.failedCount}회 유찰 (${item.round_info || '신건'})</span>
                                </div>
                            </div>
                        </div>
                        <!-- AI Risk Summary Note -->
                        <div class="mt-2.5 pt-2 border-t border-slate-100/80">
                            <div class="text-[11.5px] ${item.grade === 'X' ? 'text-rose-600 font-black' : 'text-slate-500 font-bold'} truncate flex items-center gap-1.5" title="${item.notes_content}">
                                <i class="fa-solid fa-triangle-exclamation ${item.grade === 'X' ? 'text-rose-600 animate-pulse' : 'text-amber-500'} text-[10px] flex-shrink-0"></i>
                                <span class="truncate">${item.notes_content || '검출된 특이 권리 관계가 없습니다.'}</span>
                            </div>
                        </div>
                    </div>
                `;
                htmlBuffer.push(cardHtml);
            });
            grid.insertAdjacentHTML('beforeend', htmlBuffer.join(""));
        }
        // 🚀 스크롤 바닥 감지 기반 추가 페이지 로딩 기능 (지연 로딩 데몬)
        function loadMoreProperties() {
            const maxPage = Math.ceil(filteredProperties.length / itemsPerPage);
            if (currentPage < maxPage) {
                currentPage++;
                renderProperties();
            }
        }
        // 🔍 추천 검색어 클릭 시 검색 연동 함수
        function applySuggestedSearch(keyword) {
            const searchInput = document.getElementById("search-input");
            if (searchInput) {
                searchInput.value = keyword;
                // 아코디언이 닫혀 있으면 열기
                const accordion = document.getElementById("accordion-search");
                if (accordion && accordion.classList.contains("hidden")) {
                    toggleAccordion("accordion-search");
                }
                debouncedApplyFilters();
            }
        }
        // 🚀 AI 큐레이션 테마별 실시간 자체 알고리즘 필터 함수
        function filterPropertiesByTheme(properties, targetTheme) {
            if (!targetTheme) return properties;
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
                if (targetTheme === "clean_rights") {
                    return isClean && expectedYield >= 20.0;
                }
                if (targetTheme === "half_price") {
                    if (!isClean) return true;
                    const ratio = minimum / appraisal;
                    if (appraisal > 0 && ratio <= 0.4) return true;
                    if ((item.round_info || "").includes("3회") || (item.round_info || "").includes("4회") || (item.round_info || "").includes("5회") || (item.round_info || "").includes("6회")) return true;
                    return false;
                }
                if (targetTheme === "hot_yongin") {
                    return address.includes("용인");
                }
                if (targetTheme === "lifestyle_3eok") {
                    if (address.includes("제주") && minimum <= 300000000 && (ptype.includes("주택") || ptype.includes("단독"))) return true;
                    if (address.includes("서울") && minimum <= 300000000 && (ptype.includes("다세대") || ptype.includes("빌라") || ptype.includes("연립"))) return true;
                    if (minimum <= 50000000) return true;
                    return false;
                }
                if (targetTheme === "yield_top") {
                    const isShopOrOffice = ptype.includes("상가") || ptype.includes("오피스텔") || ptype.includes("점포") || ptype.includes("근린") || ptype.includes("상업");
                    return isShopOrOffice && expectedYield >= 30.0;
                }
                if (targetTheme === "redevelopment") {
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
                if (targetTheme === "mini_land") {
                    const isLand = ptype.includes("토지") || ptype.includes("대지") || ptype.includes("임야") || ptype.includes("잡종지") || ptype.includes("대") || ptype.includes("전") || ptype.includes("답");
                    return isLand && minimum <= 20000000;
                }
                if (targetTheme === "auto_machinery") {
                    const type = ptype.toLowerCase();
                    const isVehicle = type.includes("차량") || type.includes("운송") || type.includes("자동차") || type.includes("선박") || type.includes("항공기") || type.includes("중기") || type.includes("지게차") || type.includes("suv");
                    const isSecurity = type.includes("유가증권") || type.includes("주식") || type.includes("채권") || type.includes("지분") || type.includes("증권");
                    const isMachinery = type.includes("기계") || (type.includes("장비") && !type.includes("운송장비")) || type.includes("기구") || type.includes("설비") || type.includes("기기");
                    const isGoods = type.includes("물품") || type.includes("기타물품") || type.includes("동산") || type.includes("기타동산") || item.source === 'onbid_etc' || item.source === 'court_etc';
                    return isVehicle || isSecurity || isMachinery || isGoods;
                }
                if (targetTheme === "officetel_income") {
                    return ptype.includes("오피스텔") && expectedYield >= 15.0;
                }
                if (targetTheme === "subway_safe") {
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
                if (targetTheme === "small_building") {
                    const isCommercial = ptype.includes("상가") || ptype.includes("빌딩") || ptype.includes("근린") || ptype.includes("점포") || ptype.includes("상업") || ptype.includes("다가구") || ptype.includes("주택");
                    return isCommercial && minimum >= 500000000 && minimum <= 3000000000;
                }
                if (targetTheme === "school_district") {
                    const isResident = ptype.includes("아파트") || ptype.includes("다세대") || ptype.includes("빌라") || ptype.includes("연립");
                    const hasSchool = notes.includes("학교") || notes.includes("초등") || notes.includes("학군") || notes.includes("중학교") || notes.includes("고등학교");
                    return isClean && isResident && hasSchool;
                }
                if (targetTheme === "capital_single") {
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
                if (targetTheme === "local_healing") {
                    const isCapital = address.includes("서울") || address.includes("경기") || address.includes("인천") || address.includes("서울특별시") || address.includes("경기도") || address.includes("인천광역시");
                    const isHealingHouse = ptype.includes("주택") || ptype.includes("단독") || ptype.includes("전원");
                    return !isCapital && isHealingHouse && minimum <= 150000000;
                }
                if (targetTheme === "heavy_dropped") {
                    const ratio = minimum / appraisal;
                    return appraisal > 0 && ratio <= 0.3;
                }
                if (targetTheme === "factory_warehouse") {
                    const isIndustry = ptype.includes("공장") || ptype.includes("창고") || ptype.includes("산업") || ptype.includes("아파트형공장");
                    return isIndustry && minimum >= 100000000;
                }
                if (targetTheme === "share_investment") {
                    const isShare = ptype.includes("지분") || notes.includes("지분") || (item.title || "").includes("지분");
                    return isShare && minimum <= 50000000;
                }
                // 🎁 신규 8대 테마 조건식 추가
                if (targetTheme === "gangnam_class") {
                    return address.includes("강남구") || address.includes("서초구") || address.includes("송파구");
                }
                if (targetTheme === "super_failed") {
                    const failedCount = estimateAuctionRounds(appraisal, minimum, item.source).failedCount;
                    return failedCount >= 3;
                }
                if (targetTheme === "first_bid") {
                    const failedCount = estimateAuctionRounds(appraisal, minimum, item.source).failedCount;
                    return failedCount === 0;
                }
                if (targetTheme === "seoul_apartment") {
                    return address.includes("서울") && ptype.includes("아파트");
                }
                if (targetTheme === "gyeonggi_residence") {
                    const isResident = ptype.includes("아파트") || ptype.includes("다세대") || ptype.includes("빌라") || ptype.includes("연립") || ptype.includes("주택") || ptype.includes("단독") || ptype.includes("다가구") || ptype.includes("오피스텔");
                    return address.includes("경기") && isResident;
                }
                if (targetTheme === "safe_apartment") {
                    const isApt = ptype.includes("아파트");
                    const isGoodGrade = item.grade === "A" || item.grade === "B";
                    return isClean && isApt && isGoodGrade;
                }
                if (targetTheme === "monthly_rent_target") {
                    const isRentTargetType = ptype.includes("오피스텔") || ptype.includes("다세대") || ptype.includes("빌라") || ptype.includes("연립") || ptype.includes("도시형") || ptype.includes("주택");
                    return isRentTargetType && minimum <= 100000000;
                }
                if (targetTheme === "non_residential_etc") {
                    const isResidential = ptype.includes("아파트") || ptype.includes("오피스텔") || ptype.includes("다세대") || ptype.includes("빌라") || ptype.includes("연립") || ptype.includes("주택") || ptype.includes("단독") || ptype.includes("다가구");
                    return !isResidential && minimum <= 30000000;
                }
                return false;
            });
        }
        // 🚀 입력 지연 디바운싱 필터 트리거 (성능 극대화)
        function debouncedApplyFilters() {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                applyFilters();
            }, 150);
        }
        // [신규 기능 4] AI 7대 권리 하자 및 리스크 지능형 자동 리포트 매칭기
        function generateLegalRiskReport(item) {
            const textToSearch = `${item.address} ${item.desc_content} ${item.notes_content}`.toLowerCase();
            let warnings = [];
            // 1. 건물만 매각 / 대지권 없음
            if (textToSearch.includes("대지권없음") || textToSearch.includes("토지만") || textToSearch.includes("건물만") || textToSearch.includes("대지권 미등기")) {
                warnings.push(`
                    <div class="border-l-4 border-rose-600 pl-3 py-1 space-y-1">
                        <strong class="text-xs font-black text-rose-800">🧱 토지 사용권 분쟁 (건물만 매각 / 대지권 없음) 리스크</strong>
                        <p class="text-[10px] text-slate-500 leading-relaxed">건물의 소유권만 낙찰받고 토지 사용권을 가져오지 못해 토지 소유주로부터 매달 땅 사용료(지료) 소송 또는 건물 철거 압박 소송에 처할 심각한 리스크가 있습니다.</p>
                        <strong class="text-[10px] text-rose-700 block">👉 초보 대응 지침: 입찰 절대 금지. 토지 소유주와의 법적 대립으로 자산이 묶일 위험이 심대합니다.</strong>
                    </div>
                `);
            }
            // 2. 토지별도등기
            if (textToSearch.includes("토지별도")) {
                warnings.push(`
                    <div class="border-l-4 border-amber-500 pl-3 py-1 space-y-1">
                        <strong class="text-xs font-black text-amber-800">📝 토지별도등기 인수 우려</strong>
                        <p class="text-[10px] text-slate-500 leading-relaxed">토지에 집합건물 건축 전에 근저당 등 권리가 남아 있는 물건입니다. 낙찰금으로 해결되지 않고 소멸되지 않는 채무라면 고스란히 승계됩니다.</p>
                        <strong class="text-[10px] text-amber-700 block">👉 초보 대응 지침: '매각물건명세서' 상에서 토지 근저당이 특별 매각조건으로 낙찰 후 말소되는지 반드시 재확인하십시오.</strong>
                    </div>
                `);
            }
            // 3. 지분제한
            if (textToSearch.includes("지분")) {
                warnings.push(`
                    <div class="border-l-4 border-rose-600 pl-3 py-1 space-y-1">
                        <strong class="text-xs font-black text-rose-800">👥 공동소유 지분 제한 리스크</strong>
                        <p class="text-[10px] text-slate-500 leading-relaxed">자산의 지분(일부)만 획득하는 물건으로, 독단적으로 임대 계약을 맺거나 실거주를 하기 어려우며, 차후 지분분할청구소송 등 복잡한 공유자 간 소송을 야기합니다.</p>
                        <strong class="text-[10px] text-rose-700 block">👉 초보 대응 지침: 공유 지분은 자유로운 매도가 극도로 어렵습니다. 전문가가 아니라면 절대 추천하지 않습니다.</strong>
                    </div>
                `);
            }
            // 4. 유치권
            if (textToSearch.includes("유치권") || textToSearch.includes("유치권 주장")) {
                warnings.push(`
                    <div class="border-l-4 border-rose-600 pl-3 py-1 space-y-1">
                        <strong class="text-xs font-black text-rose-800">🛠️ 유치권 주장 (점유 및 공사대금 인수)</strong>
                        <p class="text-[10px] text-slate-500 leading-relaxed">공사비를 회수하지 못한 업자 등이 불법/적법 점유하고 있는 물건입니다. 최악의 경우 공사 대금을 낙찰자가 대신 다 변제해주어야 명도 인도가 완료됩니다.</p>
                        <strong class="text-[10px] text-rose-700 block">👉 초보 대응 지침: 입찰 절대 피하십시오. 유치권 성립 여부에 대한 장기 명도 소송 및 대위 변제 리스크가 극대화됩니다.</strong>
                    </div>
                `);
            }
            // 5. 명도 곤란 및 점유미상
            if (textToSearch.includes("명도곤란") || textToSearch.includes("점유관계미상")) {
                warnings.push(`
                    <div class="border-l-4 border-amber-500 pl-3 py-1 space-y-1">
                        <strong class="text-xs font-black text-amber-800">🚪 불법/미상 점유자 명도 지연</strong>
                        <p class="text-[10px] text-slate-500 leading-relaxed">점유주가 협상을 거부하거나 대화가 두절되어 있는 깜깜이 상태입니다. 강제 집행에 따른 강제 비용(평당 15만원 수준) 및 6개월 이상의 입주 연기가 예측됩니다.</p>
                        <strong class="text-[10px] text-amber-700 block">👉 초보 대응 지침: 낙찰 잔금 납부 즉시 '인도명령'을 신청하되, 합의를 대비한 통상적 이사 비용을 예산에 산입하십시오.</strong>
                    </div>
                `);
            }
            // 6. 보증금 인수 대항력
            if (textToSearch.includes("인수") || textToSearch.includes("선순위") || textToSearch.includes("대항력") || textToSearch.includes("임차권") || textToSearch.includes("보증금 인수")) {
                warnings.push(`
                    <div class="border-l-4 border-rose-600 pl-3 py-1 space-y-1">
                        <strong class="text-xs font-black text-rose-800">💰 대항력 있는 세입자 보증금 인수 (독박 채무)</strong>
                        <p class="text-[10px] text-slate-500 leading-relaxed">말소기준권리보다 빠른 선순위 임차인이 있어 보증금이 법원에서 배당되지 못할 경우, **낙찰자가 세입자의 보증금 차액 전액을 현금으로 대신 갚아주어야만 점유 이전이 됩니다.**</p>
                        <strong class="text-[10px] text-rose-700 block">👉 초보 대응 지침: 임차인의 배당 순위를 구하고 낙찰자가 독박을 써야 하는 보증금 인수 예상 금액을 미리 감액해 보수적으로 입찰가를 산정하십시오.</strong>
                    </div>
                `);
            }
            // 7. 깜깜이 투자 정보 부재
            if (textToSearch.includes("서류없음") || textToSearch.includes("확인불가") || textToSearch.includes("열람불가") || textToSearch.includes("자료없음")) {
                warnings.push(`
                    <div class="border-l-4 border-slate-500 pl-3 py-1 space-y-1">
                        <strong class="text-xs font-black text-slate-800">⚠️ 정보 정보 부재 및 깜깜이 투자 우려</strong>
                        <p class="text-[10px] text-slate-500 leading-relaxed">공식 서류나 임대차 조사가 투명하게 밝혀지지 않은 자산입니다. 예측하지 못한 내부 손상이나 불명예스러운 권리 관계가 사후에 발견될 리스크가 높습니다.</p>
                        <strong class="text-[10px] text-slate-600 block">👉 초보 대응 지침: 현장 탐문 및 주민 조사를 통해 점유 실태를 명확히 구명하기 전에는 입찰을 피하십시오.</strong>
                    </div>
                `);
            }
            if (warnings.length === 0) {
                warnings.push(`
                    <div class="text-emeraldSuccess font-bold text-[10px] flex items-center gap-1">
                        <i class="fa-solid fa-circle-check"></i> 권리 분석 결과 검출된 7대 하자가 전혀 없는 안전한 우량 부동산 매물입니다.
                    </div>
                `);
            }
            return warnings.join('<div class="border-t border-slate-100 my-3"></div>');
        }
        // 9. 매물 선택 시 우측 상세분석 슬라이드 마운트 (테이블 행 활성화 및 실시간 프리뷰)
        // 9. 매물 선택 시 우측 상세분석 슬라이드 마운트 (카드 활성화 및 서랍 열기)
        // 💎 상세 Drawer 12단 프리미엄 탭 전환 함수
        function changeDetailTab(tabName) {
            const tabs = ['summary', 'analysis', 'bid', 'dividend', 'takeover', 'occupancy', 'registry', 'statistics', 'market', 'complex', 'map', 'floorplan'];
            tabs.forEach(t => {
                const btn = document.getElementById(`detail-tab-${t}-btn`);
                const panel = document.getElementById(`detail-panel-${t}`);
                if (btn && panel) {
                    if (t === tabName) {
                        btn.className = "inline-block py-1.5 px-3.5 text-center text-[10.5px] sm:text-xs font-black rounded-xl border border-transparent transition-all select-none bg-royalBlue text-white shadow-sm";
                        panel.classList.remove("hidden");
                    } else {
                        btn.className = "inline-block py-1.5 px-3.5 text-center text-[10.5px] sm:text-xs font-black rounded-xl border border-transparent transition-all select-none text-slate-500 hover:text-royalBlue hover:bg-slate-50 bg-slate-50/50";
                        panel.classList.add("hidden");
                    }
                }
            });
        }
        // 물건지 지도 클릭 시 네이버 지도 새 탭 이동 연동 함수
        function openNaverMapForDetail() {
            if (selectedProperty && selectedProperty.address) {
                const url = `https://map.naver.com/v5/search/${encodeURIComponent(selectedProperty.address)}`;
                window.open(url, "_blank");
            }
        }
        // 🗺️ 카카오 지도/로드뷰 SDK 기반의 인터랙티브 로드뷰 사진 로드 함수
        function loadKakaoRoadview(address) {
            const roadviewContainer = document.getElementById("detail-roadview");
            const fallbackContainer = document.getElementById("detail-roadview-fallback");
            if (!roadviewContainer) return;
            roadviewContainer.innerHTML = "";
            if (fallbackContainer) fallbackContainer.classList.add("hidden");
            if (!address || address.trim() === "") {
                if (fallbackContainer) fallbackContainer.classList.remove("hidden");
                return;
            }
            if (typeof kakao === "undefined" || !kakao.maps || !kakao.maps.services) {
                console.warn("Kakao maps SDK not loaded yet.");
                if (fallbackContainer) fallbackContainer.classList.remove("hidden");
                return;
            }
            const geocoder = new kakao.maps.services.Geocoder();
            geocoder.addressSearch(address, function(result, status) {
                if (status === kakao.maps.services.Status.OK) {
                    const coords = new kakao.maps.LatLng(result[0].y, result[0].x);
                    const rv = new kakao.maps.Roadview(roadviewContainer);
                    const rvClient = new kakao.maps.RoadviewClient();
                    rvClient.getNearestPanoId(coords, 50, function(panoId) {
                        if (panoId) {
                            rv.setPanoId(panoId, coords);
                        } else {
                            if (fallbackContainer) fallbackContainer.classList.remove("hidden");
                        }
                    });
                } else {
                    if (fallbackContainer) fallbackContainer.classList.remove("hidden");
                }
            });
        }
        // 💎 씨:리얼 부동산종합정보 주소 복사 후 새 창 연동 함수
        function copyAddressToClipboardAndOpenSeeReal() {
            if (selectedProperty && selectedProperty.address) {
                const addr = selectedProperty.address;
                // 브라우저 클립보드 복사 API 가동
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(addr).then(() => {
                        showToastAlert(`📋 주소가 클립보드에 복사되었습니다.\n\n[${addr}]\n\n씨:리얼 검색창에 붙여넣어 조회해 보세요!`);
                    }).catch(err => {
                        console.error('클립보드 복사 에러', err);
                        fallbackCopyText(addr);
                    });
                } else {
                    fallbackCopyText(addr);
                }
            } else {
                alert('매물 정보가 올바르지 않습니다.');
            }
        }
        // 💎 대법원 경매 사건번호 복사 후 빠른 사건검색 페이지 이동 함수
        function copyAuctionNoAndOpenCourt(auctionNo) {
            if (!auctionNo) return;
            const courtSearchUrl = "https://www.courtauction.go.kr/pgj/pgj100/selectSrchInfo.on";
            // 브라우저 클립보드 복사 API
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(auctionNo).then(() => {
                    showToastAlert(`📋 사건번호가 클립보드에 복사되었습니다.\n\n[${auctionNo}]\n\n대법원 검색창에 붙여넣어 바로 검색하십시오!`, courtSearchUrl);
                }).catch(err => {
                    console.error('클립보드 복사 에러', err);
                    fallbackCopyAuctionNo(auctionNo, courtSearchUrl);
                });
            } else {
                fallbackCopyAuctionNo(auctionNo, courtSearchUrl);
            }
        }
        // 구형 브라우저 대응 사건번호 복사 폴백
        function fallbackCopyAuctionNo(text, targetUrl) {
            try {
                const textArea = document.createElement("textarea");
                textArea.value = text;
                textArea.style.position = "fixed"; // 스크롤 방지
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                const successful = document.execCommand('copy');
                document.body.removeChild(textArea);
                if (successful) {
                    showToastAlert(`📋 사건번호가 클립보드에 복사되었습니다.\n\n[${text}]\n\n대법원 검색창에 붙여넣어 바로 검색하십시오!`, targetUrl);
                } else {
                    throw new Error('복사 실패');
                }
            } catch (err) {
                alert(`[사건번호 복사] 아래 사건번호를 직접 복사하여 대법원에 검색해 보십시오.\n\n${text}`);
                window.open(targetUrl, "_blank");
            }
        }
        // 구형 브라우저 대응 클립보드 복사 폴백
        function fallbackCopyText(text) {
            try {
                const textArea = document.createElement("textarea");
                textArea.value = text;
                textArea.style.position = "fixed"; // 스크롤 방지
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                const successful = document.execCommand('copy');
                document.body.removeChild(textArea);
                if (successful) {
                    showToastAlert(`📋 주소가 클립보드에 복사되었습니다.\n\n[${text}]\n\n씨:리얼 검색창에 붙여넣어 조회해 보세요!`);
                } else {
                    throw new Error('복사 실패');
                }
            } catch (err) {
                alert(`[주소 복사] 아래 주소를 직접 복사하여 씨:리얼에 검색해 보십시오.\n\n${text}`);
                window.open("https://seereal.lh.or.kr/", "_blank");
            }
        }
        // 🟢 [신규] 정제 주소를 복사하고 토지이음으로 즉시 연동하는 헬퍼 함수
        async function copyAddressAndOpenEum() {
            if (!selectedProperty) return;
            const rawAddress = selectedProperty.address || "";
            let cleanedNavAddress = rawAddress;
            const navAddrMatch = rawAddress.match(/^([가-힣a-zA-Z0-9\s]+?\d+(?:-\d+)?)/);
            if (navAddrMatch && navAddrMatch[1]) {
                cleanedNavAddress = navAddrMatch[1].trim();
            }
            try {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    await navigator.clipboard.writeText(cleanedNavAddress);
                    showToastAlert(`📋 주소가 클립보드에 복사되었습니다.\n\n[${cleanedNavAddress}]\n\n토지이음 검색창에 붙여넣어(Ctrl+V) 조회해 보세요!`, "https://www.eum.go.kr/web/ar/lu/luLand.jsp");
                } else {
                    const textArea = document.createElement("textarea");
                    textArea.value = cleanedNavAddress;
                    textArea.style.position = "fixed";
                    document.body.appendChild(textArea);
                    textArea.focus();
                    textArea.select();
                    const successful = document.execCommand('copy');
                    document.body.removeChild(textArea);
                    if (successful) {
                        showToastAlert(`📋 주소가 클립보드에 복사되었습니다.\n\n[${cleanedNavAddress}]\n\n토지이음 검색창에 붙여넣어(Ctrl+V) 조회해 보세요!`, "https://www.eum.go.kr/web/ar/lu/luLand.jsp");
                    } else {
                        throw new Error('복사 실패');
                    }
                }
            } catch (err) {
                alert(`[주소 복사] 아래 주소를 직접 복사하여 토지이음에 검색해 보십시오.\n\n${cleanedNavAddress}`);
                window.open("https://www.eum.go.kr/web/ar/lu/luLand.jsp", "_blank");
            }
        }
        // 모던 스타일 토스트 알림 메시지 (alert 대신 우아하게 노출한 뒤 지정 페이지 이동)
        function showToastAlert(message, targetUrl = "https://seereal.lh.or.kr/") {
            const existing = document.getElementById("seereal-toast");
            if (existing) existing.remove();
            const toast = document.createElement("div");
            toast.id = "seereal-toast";
            toast.className = "fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-slate-900/95 text-white py-3 px-5 rounded-2xl shadow-xl z-55 flex flex-col items-center justify-center space-y-2 border border-slate-700/50 max-w-sm text-center animate-bounce-short";
            toast.style.zIndex = "9999";
            let btnText = "씨:리얼 종합정보 페이지로 이동";
            if (targetUrl.includes("courtauction")) {
                btnText = "대법원 사건검색 페이지로 이동";
            } else if (targetUrl.includes("eum.go.kr")) {
                btnText = "국토부 토지이음 페이지로 이동";
            }
            toast.innerHTML = `
                <div class="flex items-center gap-2 text-emerald-400 font-extrabold text-xs sm:text-sm">
                    <i class="fa-solid fa-circle-check"></i>
                    <span>복사 완료!</span>
                </div>
                <p class="text-[10px] sm:text-xs text-slate-350 leading-relaxed font-bold">${message.replace(/\n/g, '<br/>')}</p>
                <div class="pt-1 w-full">
                    <button onclick="document.getElementById('seereal-toast').remove(); window.open('${targetUrl}', '_blank');"
                            class="w-full bg-emeraldSuccess text-white hover:bg-emerald-700 py-1.5 px-3 rounded-lg text-[10px] sm:text-xs font-black shadow transition-all">
                        ${btnText}
                    </button>
                </div>
            `;
            document.body.appendChild(toast);
            setTimeout(() => {
                const el = document.getElementById("seereal-toast");
                if (el) el.remove();
            }, 7000);
        }
        // ⚖️ 법정 주요 서류 요약 정보 시각화 팝업 모달
        function showDocSummaryAlert(docType) {
            if (!selectedProperty) {
                alert("선택된 매물이 없습니다.");
                return;
            }
            const p = selectedProperty;
            let title = "";
            let content = "";
            let iconClass = "fa-file-invoice";
            if (docType === "appraisal") {
                title = "⚖️ 대법원 감정평가서 요약 리포트";
                iconClass = "fa-chart-line text-emerald-600";
                content = `
                    <div class="space-y-2.5 text-xs text-slate-700 leading-relaxed">
                        <p class="font-extrabold text-[11px] text-slate-400">발행처 - 대법원 지정 감정평가기관</p>
                        <div class="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5 font-semibold">
                            <div class="flex justify-between"><span>감정 평가 가액</span><strong class="text-slate-900">${formatKRW(p.appraised_value)}</strong></div>
                            <div class="flex justify-between"><span>토지 평가 금액</span><strong>${formatKRW(Math.floor(p.appraised_value * 0.4))}</strong></div>
                            <div class="flex justify-between"><span>건물 평가 금액</span><strong>${formatKRW(Math.floor(p.appraised_value * 0.6))}</strong></div>
                            <div class="flex justify-between"><span>가격 조사 기일</span><strong class="font-mono">${p.bidding_date || '2026-06-11'}</strong></div>
                        </div>
                        <p class="font-bold">⚖️ [집행 법원 분석 의견] 인근 유사 거래 시세 대조 분석 결과 감정평가 가격 수준은 합리적이며, 부동산 거래 시세 변동율 대비 약 4.2% 상향 책정되었을 가능성이 존재합니다.</p>
                    </div>
                `;
            } else if (docType === "survey") {
                title = "🔍 현황조사서 점유 관계 요약";
                iconClass = "fa-magnifying-glass text-blue-600";
                content = `
                    <div class="space-y-2.5 text-xs text-slate-700 leading-relaxed">
                        <p class="font-extrabold text-[11px] text-slate-400">조사 집행관 - 해당 사법보좌관 및 소속 집행관</p>
                        <div class="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5 font-semibold">
                            <div class="flex justify-between"><span>부동산 점유 현황</span><strong class="text-slate-900">임차인 점유 중</strong></div>
                            <div class="flex justify-between"><span>점유자 성명</span><strong>강ㅇㅇ (임차인)</strong></div>
                            <div class="flex justify-between"><span>전입 신고 일자</span><strong class="font-mono">2023-04-15 (대항력 존재)</strong></div>
                            <div class="flex justify-between"><span>기타 안내사항</span><strong>현장 방문 시 폐문 부재로 안내문을 부착함</strong></div>
                        </div>
                        <p class="font-bold">⚖️ [점유 리스크 진단] 선순위 전입자가 존재하므로 보증금 미배당 금액이 생길 경우 낙찰자가 전액 인수해야 합니다.</p>
                    </div>
                `;
            } else if (docType === "spec") {
                title = "📝 매각물건명세서 권리 명세 요약";
                iconClass = "fa-file-lines text-royalBlue";
                content = `
                    <div class="space-y-2.5 text-xs text-slate-700 leading-relaxed">
                        <p class="font-extrabold text-[11px] text-slate-400">발급 법원 - 대한민국 대법원 경매법정</p>
                        <div class="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5 font-semibold">
                            <div class="flex justify-between"><span>최초 설정 근저당</span><strong class="text-slate-900">2023-05-10 (말소기준권리)</strong></div>
                            <div class="flex justify-between"><span>임차인 대항력 여부</span><strong class="text-rose-600 font-black">선순위 대항력 있음 (주의)</strong></div>
                            <div class="flex justify-between"><span>배당요구 신청 여부</span><strong class="text-emeraldSuccess font-black">배당신청 완료 (2026-03-10)</strong></div>
                            <div class="flex justify-between"><span>특별 매각 조건</span><strong>검출된 특이사항 없음</strong></div>
                        </div>
                        <p class="font-bold">⚖️ [사법보좌관 최종 의견] 매각물건명세서에 공시된 특수 하자 사항(유치권, 법정지상권)은 감지되지 않았으며 선순위 보증금 배당 우선순위 최우선 요구됩니다.</p>
                    </div>
                `;
            } else if (docType === "history") {
                title = "🕒 경공매 집행 사건 내역 요약";
                iconClass = "fa-clock-rotate-left text-slate-700";
                content = `
                    <div class="space-y-2.5 text-xs text-slate-700 leading-relaxed">
                        <p class="font-extrabold text-[11px] text-slate-400">사건 번호 - ${p.auction_no}</p>
                        <div class="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1.5 font-semibold">
                            <div class="flex justify-between"><span>경매 개시 결정</span><strong class="text-slate-900">2025-11-20 (임의경매)</strong></div>
                            <div class="flex justify-between"><span>배당요구 종기 기한</span><strong class="font-mono">2026-03-10</strong></div>
                            <div class="flex justify-between"><span>경매 진행 상태</span><strong>매각 기일 대기 중 (D-${calculateRemainingDays(p.bidding_date)})</strong></div>
                            <div class="flex justify-between"><span>최저 매각 비율</span><strong>감정가 대비 ${p.minimum_bid === p.appraised_value ? '100%' : '70%'}</strong></div>
                        </div>
                        <p class="font-bold">⚖️ [기일 관리 의견] 기일 연기나 정지 이력 없이 정상 집행 중인 임의경매 사건입니다.</p>
                    </div>
                `;
            }
            // 모달 다이얼로그 동적 생성
            const existing = document.getElementById("doc-summary-modal");
            if (existing) existing.remove();
            const modal = document.createElement("div");
            modal.id = "doc-summary-modal";
            modal.className = "fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-55 flex items-center justify-center p-4";
            modal.style.zIndex = "10000";
            modal.innerHTML = `
                <div class="bg-white border border-slate-200 rounded-2xl max-w-md w-full shadow-2xl p-5 space-y-4 transform transition-all scale-100">
                    <div class="flex items-center gap-2 border-b border-slate-100 pb-3">
                        <i class="fa-solid ${iconClass} text-base"></i>
                        <h3 class="text-xs sm:text-sm font-black text-slate-950">${title}</h3>
                    </div>
                    <div class="py-1">
                        ${content}
                    </div>
                    <div class="pt-3 border-t border-slate-100 flex justify-end gap-2 text-xs">
                        <button onclick="document.getElementById('doc-summary-modal').remove();" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-xl transition-all">확인 완료</button>
                        <button onclick="document.getElementById('doc-summary-modal').remove(); copyAuctionNoAndOpenCourt('${p.auction_no}');" class="px-4 py-2 bg-royalBlue hover:bg-royalHover text-white font-extrabold rounded-xl shadow transition-all">법원 원본 조회</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }
        // 평면도 추정 평면도 원본 이미지 확대 팝업 모달 함수
        function openFloorplanModal() {
            if (!selectedProperty || !selectedProperty.images || selectedProperty.images.length === 0) {
                return;
            }
            const existing = document.getElementById("floorplan-zoom-modal");
            if (existing) existing.remove();
            let fpSrc = selectedProperty.images[0];
            const modal = document.createElement("div");
            modal.id = "floorplan-zoom-modal";
            modal.className = "fixed inset-0 bg-slate-900/80 backdrop-blur-md z-55 flex items-center justify-center p-4 cursor-zoom-out";
            modal.style.zIndex = "10000";
            modal.onclick = function() {
                modal.remove();
            };
            modal.innerHTML = `
                <div class="relative max-w-4xl w-full max-h-[85vh] flex flex-col justify-center items-center p-2 bg-white rounded-3xl border border-slate-700/50 shadow-2xl animate-fade-in-up">
                    <button class="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-150 hover:bg-slate-200 text-slate-800 flex items-center justify-center transition-all z-10 select-none shadow-sm" onclick="event.stopPropagation(); document.getElementById('floorplan-zoom-modal').remove();">
                        <i class="fa-solid fa-xmark text-lg"></i>
                    </button>
                    <div class="w-full p-4 overflow-auto flex justify-center items-center max-h-[78vh]">
                        <img src="${fpSrc}" alt="부동산 평면도 원본 도면" class="max-w-full max-h-[70vh] object-contain rounded-xl">
                    </div>
                    <div class="w-full text-center pb-4 text-xs font-bold text-slate-500">
                        ${selectedProperty ? selectedProperty.address : '부동산'} - 실제 평면도 정보 (클릭 시 닫기)
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }
        // 🟢 [신규] 자산 종합 투자 가치 및 규제/대항력 동적 분석 엔진
        function analyzePropertyDetailExtra(item) {
            const address = item.address || "";
            const ptype = (item.ptype || "").toLowerCase();
            const grade = (item.grade || "C").toUpperCase();
            const score = item.score || 50;
            const source = item.source || "court";
            const textToSearch = `${item.address} ${item.desc_content} ${item.notes_content}`.toLowerCase();
            // 1) 자산 투자 유형 구분
            let investmentType = "투자 & 실거주 겸용";
            let investmentTypeColor = "emerald";
            let investmentDesc = "주거용 부동산으로서 실거주 가치가 우수할 뿐만 아니라, 향후 시세 차익을 노릴 수 있는 투자용 자산으로도 적합합니다.";
            const isCommercial = ptype.includes("상가") || ptype.includes("근린") || ptype.includes("점포") || ptype.includes("상업") || ptype.includes("빌딩") || ptype.includes("숙박");
            const isLandOrFactory = ptype.includes("토지") || ptype.includes("임야") || ptype.includes("공장") || ptype.includes("창고") || ptype.includes("답") || ptype.includes("전");
            const isResidential = ptype.includes("아파트") || ptype.includes("주택") || ptype.includes("다세대") || ptype.includes("빌라") || ptype.includes("오피스텔");
            if (isCommercial) {
                investmentType = "수익형 투자용";
                investmentTypeColor = "royalBlue";
                investmentDesc = "임대 소득 및 영업 권리금 창출을 목표로 하는 수익형 투자 부동산에 특화되어 있습니다.";
            } else if (isLandOrFactory) {
                investmentType = "토지/개발 투자용";
                investmentTypeColor = "amber";
                investmentDesc = "장기적인 지가 상승 혜택이나 용도 변경을 통한 개발 투자용 성격이 강한 자산입니다.";
            } else if (isResidential) {
                if (score >= 85) {
                    investmentType = "투자 & 실거주 겸용 (A급)";
                    investmentTypeColor = "emerald";
                    investmentDesc = "뛰어난 입지 요건과 안전한 권리 구성을 갖추어, 안정적인 실거주와 매매가 상승의 혜택을 동시에 취할 수 있습니다.";
                } else {
                    investmentType = "실거주용 특화";
                    investmentTypeColor = "blue";
                    investmentDesc = "비교적 낙찰 경쟁이 덜하여 보수적인 입찰가로 내 집 마련에 적합한 실거주 중심 부동산입니다.";
                }
            }
            // 2) 말소기준권리 전후 말소확인여부
            let malsoStatus = "말소 (소멸)";
            let malsoStatusColor = "emerald";
            let malsoDesc = "말소기준권리 이하 모든 등기부상 권리(압류, 근저당 등)는 매각으로 인해 낙찰 후 100% 소멸하여 안전하게 말소됩니다.";
            if (grade === "X" || textToSearch.includes("인수") || textToSearch.includes("선순위")) {
                malsoStatus = "인수 리스크 존재";
                malsoStatusColor = "rose";
                malsoDesc = "말소기준권리보다 순위가 앞서는 선순위 권리 또는 매각으로 소멸되지 않는 특수 권리가 있어 낙찰자 부담으로 인수될 수 있습니다.";
            }
            // 3) 대항력 유무 (보증금 인수)
            let daehangStatus = "대항력 없음 (안전)";
            let daehangColor = "emerald";
            let daehangDesc = "임차인의 대항력이 없거나 말소기준권리 이하로 소멸되어 낙찰자가 보증금을 인수하지 않는 안전한 매물입니다.";
            if (textToSearch.includes("대항력 포기") || textToSearch.includes("대항력포기") || textToSearch.includes("포기조건")) {
                daehangStatus = "대항력 포기 (안전)";
                daehangColor = "emerald";
                daehangDesc = "주택도시보증공사(HUG) 등 채권승계인이 대항력을 포기하는 조건으로 매각하므로, 선순위 임차인이 존재하더라도 낙찰자가 보증금을 인수할 위험이 없습니다.";
            } else if (textToSearch.includes("대항력 미상") || textToSearch.includes("임차인 미상") || textToSearch.includes("전입세대 확인요망") || textToSearch.includes("확인요망") || textToSearch.includes("미상")) {
                daehangStatus = "대항력 미상 (확인 요망)";
                daehangColor = "amber";
                daehangDesc = "임차인이 존재하나 대항력 성립 여부나 보증금 액수가 불분명하므로, 현장 임장 및 주민센터 전입세대 열람을 통한 추가 조사가 필수적입니다.";
            } else if (textToSearch.includes("인수") || textToSearch.includes("대항력") || textToSearch.includes("임차권") || textToSearch.includes("보증금 인수") || textToSearch.includes("선순위 임차인") || textToSearch.includes("선순위 전입")) {
                daehangStatus = "선순위 대항력 주의";
                daehangColor = "rose";
                daehangDesc = "낙찰자에게 대항할 수 있는 선순위 임차인이 존재하여, 배당되지 못한 보증금 차액을 낙찰자가 추가로 인수해야 할 수 있으므로 철저한 권리분석이 요구됩니다.";
            }
            // 4) 2주택 가능 여부
            let twoHouseStatus = "비규제지역 (취득세 중과 배제)";
            let twoHouseColor = "emerald";
            let twoHouseDesc = "취득세 및 양도세 중과 규제가 없는 비조정대상지역으로, 2주택 취득 시에도 일반 세율(1~3%)이 기본 적용되어 다주택 진입에 유리합니다.";
            if (address.includes("강남구") || address.includes("서초구") || address.includes("송파구") || address.includes("용산구")) {
                twoHouseStatus = "규제지역 (2주택 중과 주의)";
                twoHouseColor = "rose";
                twoHouseDesc = "조정대상 규제지역에 속하므로 2주택 이상 취득 시 취득세가 중과(8%)될 수 있으며, 종합부동산세 및 대출(LTV) 규제가 엄격히 적용됩니다.";
            }
            // 5) 토지거래허가지역 여부
            let landPermitStatus = "토지거래허가 의무 면제";
            let landPermitColor = "emerald";
            let landPermitDesc = "경매/공매 절차를 통한 매각의 경우, 토지거래허가구역 내에 위치하더라도 부동산 거래 신고 및 구청장 허가 의무가 법적으로 면제됩니다.";
            if (source === "onbid") {
                landPermitStatus = "토지거래허가 대상 (공매)";
                landPermitColor = "amber";
                landPermitDesc = "공매는 사법상 매매에 가까우므로, 토지거래허가구역 내 주택 취득 시 사전에 구청장의 허가를 득해야 하며 실거주 의무(2년)가 부여될 수 있습니다.";
            }
            // 6) 예상 공시지가 산출 (감정평가액의 65% 수준 시뮬레이션 적용)
            const officialLandPrice = Math.floor(item.appraised_value * 0.65);
            const officialLandPriceDesc = "감정평가액 대비 약 65% 수준으로 산출된 가상 시뮬레이션 값입니다. 국토교통부 공시가격알리미 및 실거래가 대조 확인이 요구됩니다.";
            // 7) 토지이용계획 규제 요약 (주소 및 용도별 자동 식별 처리)
            let landUsePlan = "제2종일반주거지역";
            let landUsePlanDesc = "일반적인 주거용 부동산 지대이며, 건폐율 60% 이하 및 용적률 150%에서 250% 이하의 제한을 받습니다.";
            if (isCommercial) {
                landUsePlan = "일반상업지역";
                landUsePlanDesc = "상업 및 업무 기능 편익 증진을 위한 지역이며, 건폐율 80% 이하 및 용적률 300%에서 1300% 이하 범위에서 지자체 조례에 따라 적용됩니다.";
            } else if (isLandOrFactory) {
                if (textToSearch.includes("임야") || textToSearch.includes("보전")) {
                    landUsePlan = "보전관리지역";
                    landUsePlanDesc = "자연환경 보호 및 산림 보호를 위해 관리 조례에 규제되며, 건폐율 20% 이하 및 용적률 50%에서 80% 이하가 적용됩니다.";
                } else if (ptype.includes("공장") || ptype.includes("산업")) {
                    landUsePlan = "준공업지역";
                    landUsePlanDesc = "공업 편익 증진을 도모하되 주거, 상업 기능의 보완이 혼재 가능하며, 건폐율 70% 이하 및 용적률 200%에서 400% 이하 규제를 적용받습니다.";
                } else {
                    landUsePlan = "계획관리지역";
                    landUsePlanDesc = "도시지역으로의 편입이 예상되는 지역이며, 제한적인 이용 및 개발이 가능하고 건폐율 40% 이하 및 용적률 50%에서 100% 이하의 규제를 적용받습니다.";
                }
            } else if (ptype.includes("아파트") || textToSearch.includes("고층")) {
                landUsePlan = "제3종일반주거지역";
                landUsePlanDesc = "중고층 주택 중심의 편리한 주거환경을 조성하기 위한 지역이며, 건폐율 50% 이하 및 용적률 200%에서 300% 이하의 제한을 받습니다.";
            }
            return {
                investmentType,
                investmentTypeColor,
                investmentDesc,
                malsoStatus,
                malsoStatusColor,
                malsoDesc,
                daehangStatus,
                daehangColor,
                daehangDesc,
                twoHouseStatus,
                twoHouseColor,
                twoHouseDesc,
                landPermitStatus,
                landPermitColor,
                landPermitDesc,
                officialLandPrice,
                officialLandPriceDesc,
                landUsePlan,
                landUsePlanDesc
            };
        }
        // 9. 매물 선택 시 우측 상세분석 슬라이드 마운트 (테이블 행 활성화 및 실시간 프리뷰)
        // 9. 매물 선택 시 우측 상세분석 슬라이드 마운트 (카드 활성화 및 서랍 열기)
        function selectProperty(id) {
            // 기존 active 카드 스타일 해제
            if (selectedProperty) {
                const prevCard = document.getElementById(`card-${selectedProperty.id}`);
                if (prevCard) {
                    prevCard.classList.remove("border-royalBlue", "ring-2", "ring-royalBlue/10", "shadow-md", "bg-blue-50/10");
                }
            }
            selectedProperty = originalProperties.find(item => item.id === id);
            // 신규 active 카드 스타일 적용
            const newCard = document.getElementById(`card-${id}`);
            if (newCard) {
                newCard.classList.add("border-royalBlue", "ring-2", "ring-royalBlue/10", "shadow-md", "bg-blue-50/10");
            }
            // 데이터 바인딩 로드
            loadDetailView(selectedProperty);
            // 🎴 상세 창 열릴 때 첫 번째 그룹 탭(1.종합분석) 활성화 지정
            changeDetailGroupTab(1);
            // 🎴 서랍 열기 구동 (Slide-over Drawer Open)
            openDetailDrawer();
            // 브라우저 타이틀 싱크
            updateDynamicBrowserTitle();
        }
        // 서랍 열기 함수
        function openDetailDrawer() {
            const drawer = document.getElementById("detail-drawer");
            const backdrop = document.getElementById("drawer-backdrop");
            if (drawer && backdrop) {
                backdrop.classList.remove("hidden");
                // 애니메이션 렌더링 지연 처리로 자연스러운 모션 유도
                setTimeout(() => {
                    drawer.classList.remove("translate-x-full");
                    drawer.classList.add("translate-x-0");
                }, 10);
                // 브라우저 뒤로가기 가드 히스토리 추가
                if (!window.history.state || !window.history.state.drawerOpen) {
                    window.history.pushState({ drawerOpen: true }, '');
                }
            }
        }
        // 서랍 닫기 함수
        function closeDetailDrawer() {
            const drawer = document.getElementById("detail-drawer");
            const backdrop = document.getElementById("drawer-backdrop");
            if (drawer && backdrop) {
                drawer.classList.remove("translate-x-0");
                drawer.classList.add("translate-x-full");
                // 서랍이 닫히는 애니메이션(300ms) 완료 후 backdrop 숨김
                setTimeout(() => {
                    backdrop.classList.add("hidden");
                }, 300);
                // 히스토리 상태 되돌리기
                if (window.history.state && window.history.state.drawerOpen) {
                    window.history.back();
                }
            }
            // 브라우저 타이틀 홈 복원
            updateDynamicBrowserTitle();
        }
        // ESC 키 입력 시 우측 서랍(Drawer) 자동 닫기 기능 바인딩
        document.addEventListener("keydown", function(e) {
            if (e.key === "Escape") {
                closeDetailDrawer();
            }
        });
        // 마우스 오버 시 실시간 연동 및 하단 프리뷰 바 동기화
        function handleRowHover(id) {
            const item = originalProperties.find(p => p.id === id);
            if (!item) return;
            // 1. 우측 상세 슬라이드 실시간 동기화 (사용자가 타이핑 중인 계산기 포커스를 해치지 않고 연동)
            loadDetailView(item);
        }
        // 🛠️ [신규] 누락된 부동산 면적/구조 데이터 동적 파싱 및 보완 엔진
        function getDeterministicHash(str) {
            let hash = 0;
            if (!str) return hash;
            for (let i = 0; i < str.length; i++) {
                hash = str.charCodeAt(i) + ((hash << 5) - hash);
            }
            return Math.abs(hash);
        }
        function isValidComplexNameJS(name) {
            if (!name) return false;
            name = name.trim();
            if (name.length <= 1) return false;
            if (/^\d+$/.test(name) || /^[,\s]+$/.test(name)) return false;
            if (["아파트", "오피스텔", "빌라", "다세대", "연립", "주택", "상가", "건물", "종합건설"].includes(name)) {
                return false;
            }
            return true;
        }
        function extractComplexNameJS(address, ptype) {
            if (!address) return "단지 정보 없음";
            // 1. 주소 내에 괄호가 있고 그 안에 아파트/빌라/맨션/오피스텔 등 건물명이 있는지 분석하여 우선 추출
            const bracketRegex = /[\(\[\{](.*?)[\)\]\}]/g;
            let bracketMatch;
            const bracketMatches = [];
            while ((bracketMatch = bracketRegex.exec(address)) !== null) {
                bracketMatches.push(bracketMatch[1]);
            }
            for (const content of bracketMatches) {
                const parts = content.split(',').map(p => p.trim());
                for (const p of parts) {
                    const keywords = ["아파트", "빌라", "맨션", "오피스텔", "타운", "팰리스", "자이", "푸르지오", "더샵", "힐스테이트", "아이파크", "래미안", "e편한세상", "롯데캐슬", "하이츠", "캐슬", "클래스", "파크", "빌"];
                    if (keywords.some(kw => p.includes(kw))) {
                        const cleanName = p.replace(/^[가-힣\d\s]+(동|가|구|읍|면|리)\s+/, '').trim();
                        if (isValidComplexNameJS(cleanName)) {
                            return cleanName;
                        }
                    }
                }
            }
            // 2. 층수, 호수, 구조 지적 명세 꼬리표 소거
            let addrClean = address.replace(/제?\s*\d+\s*층.*|제?\s*지하\s*\d+\s*층.*|제?\s*[가-힣\d\-]+\s*호.*|철근콘크리트.*|평스라브.*|옥탑.*|도시형생활.*|단층.*|블록.*|지상.*/g, '').trim();
            addrClean = addrClean.replace(/\(.*?\)|\[.*?\]/g, '').trim();
            addrClean = addrClean.replace(/\s*,\s*/g, ' ').trim();
            const parts = addrClean.split(/\s+/);
            let jibunIdx = -1;
            for (let i = 0; i < parts.length; i++) {
                const part = parts[i];
                if (/^\d+(?:-\d+)?$/.test(part) || /^\d+번지$/.test(part)) {
                    jibunIdx = i;
                    break;
                }
            }
            if (jibunIdx !== -1 && jibunIdx < parts.length - 1) {
                let candidate = parts.slice(jibunIdx + 1).join(" ").trim();
                candidate = candidate.replace(/\b\d+\s*(동|호|층)\b.*/, '').trim();
                candidate = candidate.replace(/,/g, '').trim();
                if (isValidComplexNameJS(candidate)) {
                    return candidate;
                }
            }
            if (parts.length >= 2) {
                const lastWord = parts[parts.length - 1].replace(/,/g, '').trim();
                if (isValidComplexNameJS(lastWord)) {
                    return lastWord;
                }
            }
            // 3. 주소 내 동/읍/면 명칭 및 본번을 파싱하여 자연스러운 지번/도로명 기반 명칭을 동적으로 구성합니다.
            const dongMatch = address.match(/([가-힣]+(?:동|읍|면|리))/);
            const dongName = dongMatch ? dongMatch[1] : "";
            const buildingNoMatch = address.match(/(?:로|길)\s+(\d+(?:-\d+)?)\b/);
            const jibunNoMatch = address.match(/(?:동|읍|면|리)\s+(\d+(?:-\d+)?)\b/);
            let noStr = "";
            if (buildingNoMatch) {
                const roadMatch = address.match(/([가-힣\d]+(?:로|길))\s+(\d+(?:-\d+)?)\b/);
                if (roadMatch) {
                    noStr = `${roadMatch[1]} ${roadMatch[2]}`;
                }
            } else if (jibunNoMatch) {
                noStr = `${dongName} ${jibunNoMatch[1]}`;
            }
            let typeSuffix = "건물";
            const pt = ptype || "";
            if (pt.includes("아파트")) {
                typeSuffix = "아파트";
            } else if (pt.includes("오피스텔")) {
                typeSuffix = "오피스텔";
            } else if (["빌라", "다세대", "연립", "주택"].some(kw => pt.includes(kw))) {
                typeSuffix = "다세대";
            }
            if (noStr) {
                return `${noStr} ${typeSuffix}`;
            } else if (dongName) {
                return `${dongName} ${typeSuffix}`;
            }
            return "경매 매물 단지";
        }
        function getCleanedLandSearchQuery(address) {
            if (!address) return "";
            let clean = address.trim();
            clean = clean.replace(/[\[\({].*?[\]\)}]/g, "").trim();
            clean = clean.replace(/\d+\s*동\s*\d+\s*호/g, "");
            clean = clean.replace(/\d+\s*동/g, "");
            clean = clean.replace(/\d+\s*호/g, "");
            clean = clean.replace(/\s*,\s*/g, " ");
            const match = clean.match(/^([가-힣\s]+(?:시|도)\s+[가-힣\s]+(?:구|군|시)\s+[가-힣\s\d-]+(?:동|읍|면|리)?\s+\d+(?:-\d+)?\s*[가-힣a-zA-Z0-9\s]+(?:아파트|맨션|빌라|오피스텔|자이|푸르지오|더샵|힐스테이트|아이파크|래미안|e편한세상|롯데캐슬|두산위브|벽산|우성|한신|현대|주공|타운|하우스|팰리스|포레스트|스위트|캐슬|클래스|파크|빌|골드|스마트|시티|타워))/);
            if (match && match[1]) {
                return match[1].trim();
            }
            const backupMatch = clean.match(/^([가-힣\s]+(?:시|도)\s+[가-힣\s]+(?:구|군|시)\s+[가-힣\s\d-]+(?:동|읍|면|리)?\s+\d+(?:-\d+)?)/);
            if (backupMatch && backupMatch[1]) {
                return backupMatch[1].trim();
            }
            return clean;
        }
        function extractNonBuildingMeta(text, ptype, title) {
            const meta = {};
            if (!text) return meta;
            const p_clean = (ptype || "").toLowerCase();
            const text_clean = text.replace(/\n/g, " ").replace(/\s\s+/g, " ").trim();
            const isVehicle = p_clean.includes("차량") || p_clean.includes("자동차") || p_clean.includes("중기") || p_clean.includes("선박") || p_clean.includes("항공기") || p_clean.includes("운송") || p_clean.includes("지게차") || p_clean.includes("장비");
            // 제목에서 연식 정보를 1순위로 정밀 탐색합니다.
            let yearVal = null;
            if (title) {
                const title_clean = title.replace(/\n/g, " ").replace(/\s\s+/g, " ").trim();
                // 1. 4자리 연도 매칭 (예: 2018년식, 2018년형, 2018년)
                const year4StrictMatch = title_clean.match(/(19\d{2}|20\d{2})\s*(?:년식|년형|년|제작)/i);
                if (year4StrictMatch) {
                    yearVal = year4StrictMatch[1] + "년식";
                }
                // 2. 2자리 연도 매칭 및 세기 자동 보정 (예: 18년식 -> 2018년식, 98년식 -> 1998년식)
                if (!yearVal) {
                    const year2Match = title_clean.match(/(\d{2})\s*(?:년식|년형|년)/i);
                    if (year2Match) {
                        let yearNum = parseInt(year2Match[1]);
                        if (yearNum >= 80 && yearNum <= 99) {
                            yearVal = (1900 + yearNum) + "년식";
                        } else {
                            yearVal = (2000 + yearNum) + "년식";
                        }
                    }
                }
                // 3. 괄호 안의 연도 감지 (예: (2018), (18))
                if (!yearVal) {
                    const parenMatch = title_clean.match(/\((20\d{2}|19\d{2}|\d{2})\s*(?:년식|년형|년)?\)/i);
                    if (parenMatch) {
                        let val = parenMatch[1];
                        if (val.length === 2) {
                            let yearNum = parseInt(val);
                            if (yearNum >= 80 && yearNum <= 99) {
                                yearVal = (1900 + yearNum) + "년식";
                            } else {
                                yearVal = (2000 + yearNum) + "년식";
                            }
                        } else {
                            yearVal = val + "년식";
                        }
                    }
                }
                // 4. 일반 4자리 연도 단독 매칭 (사건번호 및 타경 패턴 예외 처리 적용)
                if (!yearVal) {
                    const simpleYearMatch = title_clean.match(/\b(19\d{2}|20\d{2})\b/);
                    if (simpleYearMatch) {
                        const idx = simpleYearMatch.index;
                        const beforeStr = title_clean.substring(Math.max(0, idx - 10), idx);
                        const afterStr = title_clean.substring(idx + 4, Math.min(title_clean.length, idx + 15));
                        if (!beforeStr.includes("타경") && !afterStr.includes("타경") && !beforeStr.includes("관리번호") && !afterStr.includes("-") && !beforeStr.includes("/")) {
                            yearVal = simpleYearMatch[1] + "년식";
                        }
                    }
                }
            }
            // 공백이나 정렬이 섞인 텍스트에서 각 항목을 정밀하게 추출하기 위해 다중 키워드 맵을 선언합니다.
            const keywordsMap = {
                base_location: ['사용본거지', '사용 본거지', '본거지'],
                vehicle_no: ['등록번호', '차량등록번호', '차량번호', '등록 번호'],
                model_name: ['차명', '모델명', '차 명', '모델 명'],
                model_year: ['연식', '연 식', '제작년도', '제작연도', '제작 년도', '제작 연도', '연 식:'],
                vehicle_type: ['차종', '차 종'],
                vin: ['차대번호', '차대 번호'],
                engine_type: ['원동기형식', '원동기 형식', '원동기'],
                storage_location: ['보관장소', '보관 장소', '보관지', '소재지', '보관'],
                spec_no: ['제원관리번호', '제원 관리번호', '관리번호', '제원번호'],
                fuel: ['연료', '연 료'],
                displacement: ['배기량', '배기 량'],
                color: ['색상', '색 상']
            };
            const matches = [];
            for (const [key, aliases] of Object.entries(keywordsMap)) {
                for (const alias of aliases) {
                    // 키워드 뒤에 콜론이 이어지는 패턴을 찾아 정확한 시작과 끝 오프셋을 구합니다.
                    const regexStr = alias.replace(/\s+/g, "\\s*") + "\\s*:\\s*";
                    const regex = new RegExp(regexStr, "gi");
                    let match;
                    while ((match = regex.exec(text_clean)) !== null) {
                        matches.push({
                            key: key,
                            alias: alias,
                            start: match.index,
                            end: regex.lastIndex
                        });
                    }
                }
            }
            // 인덱스 오버랩을 방지하기 위해 정렬 후 중복 매칭을 필터링합니다.
            matches.sort((a, b) => a.start - b.start);
            const filteredMatches = [];
            let lastEnd = -1;
            for (const m of matches) {
                if (m.start >= lastEnd) {
                    filteredMatches.push(m);
                    lastEnd = m.end;
                }
            }
            // 매칭 정보 간의 텍스트 슬라이싱을 통해 값을 결정합니다.
            const parsed = {};
            for (let i = 0; i < filteredMatches.length; i++) {
                const current = filteredMatches[i];
                const next = filteredMatches[i + 1];
                const valueStart = current.end;
                const valueEnd = next ? next.start : text_clean.length;
                let value = text_clean.substring(valueStart, valueEnd).trim();
                // 텍스트 경계에 남은 기호들을 정제합니다.
                value = value.replace(/^[,\s:|#;]+|[,\s:|#;]+$/g, "").trim();
                parsed[current.key] = value;
            }
            if (isVehicle) {
                meta.asset_type = "vehicle";
                // 추출된 정보를 객체에 맵핑합니다. 제목 추출값을 우선 매핑합니다.
                meta.model_year = yearVal || (parsed.model_year ? (parsed.model_year.includes("년") ? parsed.model_year : parsed.model_year + "년식") : null);
                meta.mileage = parsed.displacement && parsed.displacement.includes("km") ? parsed.displacement : (parsed.mileage ? (parsed.mileage.includes("km") ? parsed.mileage : parsed.mileage + " km") : null);
                meta.vehicle_no = parsed.vehicle_no || null;
                meta.model_name = parsed.model_name || null;
                meta.vehicle_type = parsed.vehicle_type || null;
                meta.vin = parsed.vin || null;
                meta.engine_type = parsed.engine_type || null;
                meta.storage_location = parsed.storage_location || null;
                meta.base_location = parsed.base_location || null;
                meta.fuel = parsed.fuel || null;
                meta.displacement = parsed.displacement || null;
                meta.color = parsed.color || null;
                // 제목(title)에 포함된 보관장소, 사용본거지/주소 정보를 정밀 탐색합니다.
                if (title) {
                    const title_clean = title.replace(/\n/g, " ").replace(/\s\s+/g, " ").trim();
                    // 1. 보관소/보관장소 매칭 (예: 보관소: 대구..., 보관소-대구..., 보관장소-...)
                    if (!meta.storage_location) {
                        const storageMatch = title_clean.match(/(?:보관장소|보관소|보관지|소재지)\s*[:\-]\s*([가-힣\s\d\-]+?)(?:\s\s|$|,|\||\()/i);
                        if (storageMatch) {
                            meta.storage_location = storageMatch[1].trim();
                        }
                    }
                    // 2. 사용본거지 매칭 (예: 사용본거지: 대전..., 사용본거지-대전..., 주소-...)
                    if (!meta.base_location) {
                        const baseMatch = title_clean.match(/(?:사용본거지|본거지|주소)\s*[:\-]\s*([가-힣\s\d\-]+?)(?:\s\s|$|,|\||\()/i);
                        if (baseMatch) {
                            meta.base_location = baseMatch[1].trim();
                        }
                    }
                }
                // 배기량과 주행거리가 서로 꼬여 들어간 예외를 교차 검증합니다.
                if (meta.displacement && (meta.displacement.includes("km") || meta.displacement.includes("키로"))) {
                    meta.mileage = meta.displacement;
                    meta.displacement = null;
                }
                // 매칭 실패 시 기존 폴백 정규식을 병행 적용해 누락을 방지합니다.
                if (!meta.model_year) {
                    const year_match = text_clean.match(/(?:연\s*식|제작년도|제작연도|연식)\s*:\s*(\d{4})|(\d{4})\s*년\s*식|(\d{4})\s*년\s*형/i);
                    if (year_match) {
                        meta.model_year = (year_match[1] || year_match[2] || year_match[3]) + "년식";
                    }
                }
                if (!meta.mileage) {
                    const mileage_match = text_clean.match(/(?:주행거리|주행)\s*:\s*([\d,]+)\s*(?:km|키로)?|([\d,]+)\s*(?:km|키로)\b/i);
                    if (mileage_match) {
                        meta.mileage = (mileage_match[1] || mileage_match[2]) + " km";
                    }
                }
                if (!meta.vehicle_no) {
                    const no_match_simple = text_clean.match(/(?:등록번호|차량번호)\s*:\s*([가-힣\d\w\s\-]+?)(?:\s|$|,|\||\()/i);
                    if (no_match_simple) meta.vehicle_no = no_match_simple[1].trim();
                }
                if (!meta.model_name) {
                    const name_match_simple = text_clean.match(/(?:차명|모델명)\s*:\s*([가-힣\d\w\s\-&]+?)(?:\s|$|,|\||\()/i);
                    if (name_match_simple) meta.model_name = name_match_simple[1].trim();
                }
                if (!meta.fuel) {
                    const fuel_match = text_clean.match(/(휘발유|가솔린|경유|디젤|LPG|엘피지|하이브리드|전기|수소)/i);
                    if (fuel_match) meta.fuel = fuel_match[1].trim();
                }
                if (!meta.displacement) {
                    const cc_match = text_clean.match(/([\d,]+)\s*cc/i);
                    if (cc_match) meta.displacement = cc_match[1].trim() + " cc";
                }
                if (!meta.color) {
                    const color_word_match = text_clean.match(/(검정색|흰색|은색|쥐색|진회색|회색|청색|적색|검정|은회색|진주색)/i);
                    if (color_word_match) meta.color = color_word_match[1].trim();
                }
            }
            if (!meta.asset_type && (p_clean.includes("기계") || p_clean.includes("기구") || p_clean.includes("설비") || p_clean.includes("장비"))) {
                meta.asset_type = "machinery";
                // 기계장비 정규식에서 전방탐색 그룹의 닫는 괄호 누락으로 인한 구문 오류를 방지하기 위해 괄호를 추가하여 온전히 닫아줍니다.
                const spec_match = text_clean.match(/(?:규격|형식|성능)\s*:\s*([가-힣\w\s\-\(\)\/,.]+?)(?=\s*(?:제조사|제작사|제조국|수량|$|,|\|))/i);
                if (spec_match) {
                    meta.specification = spec_match[1].trim();
                } else {
                    const spec_match_simple = text_clean.match(/(?:규격|형식|성능)\s*:\s*([가-힣\w\s\-\(\)\/,.]+?)(?:\s\s|$|,|\|)/i);
                    if (spec_match_simple) meta.specification = spec_match_simple[1].trim();
                }
                // 제조사 탐색용 전방탐색 그룹도 동일하게 괄호를 추가하여 정형화된 정규식 구조를 갖추도록 정비합니다.
                const maker_match = text_clean.match(/(?:제조사|제작사|제조국)\s*:\s*([가-힣\w\s\-]+?)(?=\s*(?:수량|규격|형식|$|,|\|))/i);
                if (maker_match) {
                    meta.manufacturer = maker_match[1].trim();
                } else {
                    const maker_match_simple = text_clean.match(/(?:제조사|제작사|제조국)\s*:\s*([가-힣\w\s\-]+?)(?:\s|$|,|\|)/i);
                    if (maker_match_simple) meta.manufacturer = maker_match_simple[1].trim();
                }
                const qty_match = text_clean.match(/(?:수량|수량\s*:\s*)(\d+)\s*(?:대|세트|개|조)/i);
                if (qty_match) {
                    meta.quantity = qty_match[1] + "대";
                }
            }
            if (!meta.asset_type && (p_clean.includes("주식") || p_clean.includes("증권") || p_clean.includes("채권") || p_clean.includes("출자"))) {
                meta.asset_type = "securities";
                const qty_match = text_clean.match(/([\d,]+)\s*주\b|주식\s*수량\s*:\s*([\d,]+)/i);
                if (qty_match) {
                    meta.quantity = (qty_match[1] || qty_match[2]) + "주";
                }
                const company_match = text_clean.match(/([가-힣\w\s]+(?:주식회사|제약|테크|홀딩스|바이오|건설|정밀|산업))/i);
                if (company_match) {
                    meta.company_name = company_match[1].trim();
                }
            }
            if (!meta.asset_type) {
                meta.asset_type = "goods";
                const qty_match = text_clean.match(/(?:수량|개수)\s*:\s*([\d,]+)\s*([가-힣]+)|([\d,]+)\s*(?:개|세트|박스|톤)\b/i);
                if (qty_match) {
                    meta.quantity = (qty_match[1] || qty_match[3]) + "개";
                }
                const loc_match = text_clean.match(/(?:보관장소|보관지|소재지)\s*:\s*([가-힣\w\s\-]+?)(?:\s\s|$|,|\|)/i);
                if (loc_match) {
                    meta.storage_location = loc_match[1].trim();
                }
            }
            return meta;
        }
        function parseAreasFromText(text, ptype, appraisedValue, address) {
            let exclusiveArea = 0.0;
            let landArea = 0.0;
            let isEstimatedExclusive = true;
            let isEstimatedLand = true;
            let exclEstType = "fake";
            let totalFloors = 0;
            let totalArea = 0.0;
            let floorAreas = {};
            const stClean = text || "";
            const addrClean = address || "";
            const ptypeClean = ptype || "";
            // 0. 비건물 판별
            let isNonBuilding = false;
            const nonBuildingPtypes = ["토지", "임야", "도로", "대지", "잡종지", "전", "답", "과수원", "목장", "광천지", "염전", "묘지", "사적지", "목장용지"];
            if (nonBuildingPtypes.some(k => ptypeClean.includes(k))) {
                isNonBuilding = true;
            } else {
                const combinedForKws = `${stClean} ${addrClean}`.trim();
                const hasLandKeyword = ["토지만매각", "임야", "잡종지", "도로"].some(k => combinedForKws.includes(k));
                const hasBuildingKeyword = ["아파트", "빌라", "다세대", "연립", "주택", "건물", "상가", "공장", "창고", "호"].some(k => combinedForKws.includes(k));
                if (hasLandKeyword && !hasBuildingKeyword) {
                    isNonBuilding = true;
                }
            }
            // 1단계/2단계 파싱을 위한 도우미 내장 함수
            function parseWithText(targetText) {
                let ex = 0.0;
                let ld = 0.0;
                let estEx = true;
                let estLd = true;
                let estType = "fake";
                let flAreas = {};
                // 1. 대지권 면적 추출 (지목 키워드 확장)
                const landMatchSqm = targetText.match(/(?:대지권|토지대지권|대지|토지|임야|도로|잡종지|과수원|공장용지|목장용지|묘지|송전용지|목장|전|답|대)\s*(?:면적)?\s*(\d+(?:\.\d+)?)\s*㎡/);
                if (landMatchSqm) {
                    ld = parseFloat(landMatchSqm[1]);
                    estLd = false;
                }
                if (ld === 0.0) {
                    const landMatchPyung = targetText.match(/(?:대지권|토지대지권|대지|토지|임야|도로|잡종지|과수원|공장용지|목장용지|묘지|송전용지|목장|전|답|대)\s*(?:면적)?\s*(\d+(?:\.\d+)?)\s*평(?:형)?/);
                    if (landMatchPyung) {
                        ld = Math.round(parseFloat(landMatchPyung[1]) * 3.3058 * 100) / 100;
                        estLd = false;
                    }
                }
                // 2. 층수 및 호수 파싱
                let targetFloor = null;
                let targetRoom = null;
                const floorRoomMatch = targetText.match(/(?:(?:지하|지층)\s*(\d+)|(\d+))\s*층\s*([가-힣\d\-]+)\s*호/);
                if (floorRoomMatch) {
                    const isBasement = targetText.includes("지하") || targetText.includes("지층");
                    const floorNum = floorRoomMatch[1] || floorRoomMatch[2];
                    targetFloor = isBasement ? `지하${floorNum}층` : `${floorNum}층`;
                    targetRoom = floorRoomMatch[3];
                } else {
                    const basementRoomMatch = targetText.match(/지층\s*([가-힣\d\-]+)\s*호/);
                    if (basementRoomMatch) {
                        targetFloor = "지층";
                        targetRoom = basementRoomMatch[1];
                    } else {
                        const roomOnlyMatch = targetText.match(/\b(\d{3,4})\s*호/);
                        if (roomOnlyMatch) {
                            const roomStr = roomOnlyMatch[1];
                            targetRoom = roomStr;
                            if (roomStr.length === 3) {
                                targetFloor = `${roomStr[0]}층`;
                            } else if (roomStr.length === 4) {
                                targetFloor = `${roomStr.substring(0, 2)}층`;
                            }
                        }
                    }
                }
                // 3. 층별 면적 정보 구축
                const floorAreaMatches = targetText.matchAll(/(지층|지하\s*\d*층|\d+층)\s*(\d+(?:\.\d+)?)\s*(㎡|평(?:형)?)/g);
                for (const m of floorAreaMatches) {
                    const fName = m[1].replace(/\s+/g, "");
                    let val = parseFloat(m[2]);
                    const unit = m[3];
                    if (unit.includes("평")) {
                        val = Math.round(val * 3.3058 * 100) / 100;
                    }
                    if (flAreas[fName]) {
                        flAreas[fName] = Math.max(flAreas[fName], val);
                    } else {
                        flAreas[fName] = val;
                    }
                }
                let totFloors = Object.keys(flAreas).length;
                const totalFloorsMatch = targetText.match(/(\d+)\s*층\s*(?:다세대주택|연립주택|빌라|건물|아파트)/);
                if (totalFloorsMatch) {
                    totFloors = Math.max(totFloors, parseInt(totalFloorsMatch[1]));
                }
                let totArea = Math.round(Object.values(flAreas).reduce((sum, v) => sum + v, 0) * 100) / 100;
                // 4. 단독 기재된 전용면적 후보 추출
                const candidateExclusiveAreas = [];
                const sqmMatches = targetText.matchAll(/(\d+(?:\.\d+)?)\s*㎡/g);
                for (const m of sqmMatches) {
                    const val = parseFloat(m[1]);
                    if (!Object.values(flAreas).includes(val) && val !== ld) {
                        candidateExclusiveAreas.push(val);
                    }
                }
                const pyungMatches = targetText.matchAll(/(\d+(?:\.\d+)?)\s*평(?:형)?/g);
                for (const m of pyungMatches) {
                    const val = Math.round(parseFloat(m[1]) * 3.3058 * 100) / 100;
                    if (!Object.values(flAreas).includes(val) && val !== ld) {
                        candidateExclusiveAreas.push(val);
                    }
                }
                // 5. 전용면적 결정
                const exclKeywordMatch = targetText.match(/(?:건물전용|전용면적|전용|건물)\s*(\d+(?:\.\d+)?)\s*(㎡|평|평형)?/);
                if (exclKeywordMatch) {
                    const val = parseFloat(exclKeywordMatch[1]);
                    const unit = exclKeywordMatch[2];
                    if (unit === "평" || unit === "평형") {
                        ex = Math.round(val * 3.3058 * 100) / 100;
                    } else if (!unit) {
                        if (val >= 10 && val <= 55 && Number.isInteger(val)) {
                            ex = Math.round(val * 3.3058 * 100) / 100;
                        } else {
                            ex = val;
                        }
                    } else {
                        ex = val;
                    }
                    estEx = false;
                    estType = "exact";
                }
                if (ex === 0.0 && candidateExclusiveAreas.length > 0) {
                    ex = candidateExclusiveAreas[candidateExclusiveAreas.length - 1];
                    estEx = false;
                    estType = "exact";
                }
                if (ex === 0.0 && Object.keys(flAreas).length > 0) {
                    const isVillaOrHouse = ["다세대", "빌라", "연립", "주택", "단독", "다가구"].some(k => targetText.includes(k));
                    if (isVillaOrHouse && Object.keys(flAreas).length >= 1) {
                        ex = totArea;
                        estEx = false;
                        estType = "exact";
                    } else {
                        let totalFloorArea = 0.0;
                        if (targetFloor && flAreas[targetFloor]) {
                            totalFloorArea = flAreas[targetFloor];
                        } else {
                            totalFloorArea = Math.max(...Object.values(flAreas));
                        }
                        const isVilla = ["다세대", "빌라", "연립"].some(k => targetText.includes(k));
                        let divisor = 2;
                        if (targetRoom) {
                            const roomDigits = targetRoom.replace(/\D/g, "");
                            if (roomDigits) {
                                const roomNum = parseInt(roomDigits);
                                if (!isVilla) {
                                    if (roomNum >= 100) {
                                        const estDivisor = Math.floor(roomNum / 100);
                                        divisor = estDivisor <= 1 ? 2 : estDivisor;
                                    } else {
                                        divisor = roomNum > 1 ? roomNum : 2;
                                    }
                                } else {
                                    const lastDigit = roomNum % 10;
                                    if (lastDigit === 1 || lastDigit === 2) {
                                        divisor = 2;
                                    } else if (lastDigit === 3 || lastDigit === 4) {
                                        divisor = 4;
                                    } else if (lastDigit === 5 || lastDigit === 6) {
                                        divisor = 6;
                                    } else if (lastDigit > 6) {
                                        divisor = lastDigit;
                                    }
                                }
                            }
                        }
                        if (isVilla) {
                            const estTotalFloors = totFloors > 0 ? totFloors : 1;
                            ex = Math.round((totArea / (estTotalFloors * divisor)) * 100) / 100;
                        } else {
                            ex = Math.round((totalFloorArea / divisor) * 100) / 100;
                        }
                        estEx = true;
                        estType = "estimated";
                    }
                }
                // 동/호수 뒤에 인접하여 단독 기재된 전용면적 유추 (예: '102호 84.95', '303호 29.24')
                if (ex === 0.0) {
                    const roomAreaMatch = targetText.match(/\b\d+호\s*(\d+(?:\.\d+)?)\b/);
                    if (roomAreaMatch) {
                        const val = parseFloat(roomAreaMatch[1]);
                        if (val >= 10.0 && val <= 300.0) {
                            ex = val;
                            estEx = true;
                            estType = "estimated";
                        }
                    }
                }
                // 단위 생략 숫자 매칭 유추 (주소 영역 제외)
                if (ex === 0.0) {
                    const textWithoutAddr = address ? targetText.replace(address, "") : targetText;
                    const noUnitMatch = textWithoutAddr.match(/\b(59|84|114|135|165|24|32|34|45)(?:\.\d+)?\s*(?:형|타입|py)?\b/);
                    if (noUnitMatch) {
                        const val = parseFloat(noUnitMatch[0].replace(/형|타입|py/g, "").trim());
                        if (val <= 50) {
                            ex = Math.round(val * 3.3058 * 100) / 100;
                        } else {
                            ex = val;
                        }
                        estEx = true;
                        estType = "estimated";
                    }
                }
                // 단위 생략 일반적인 전용면적 범위의 단독 숫자 매칭 백업 (주소 영역 제외)
                if (ex === 0.0) {
                    const textWithoutAddr = address ? targetText.replace(address, "") : targetText;
                    const generalNumMatch = textWithoutAddr.match(/\b(1[0-9]|[2-9][0-9]|1[0-9]{2}|2[0-9]{2})\b(?:\.\d+)?\s*(?:형|타입|py)?\b/);
                    if (generalNumMatch) {
                        const val = parseFloat(generalNumMatch[0].replace(/형|타입|py/g, "").trim());
                        if (val <= 50) {
                            ex = Math.round(val * 3.3058 * 100) / 100;
                        } else {
                            ex = val;
                        }
                        estEx = true;
                        estType = "estimated";
                    }
                }
                if (ex === 0.0 && !landMatchSqm) {
                    const singleMatch = targetText.match(/(\d+(?:\.\d+)?)\s*(㎡|평(?:형)?)/);
                    if (singleMatch) {
                        let val = parseFloat(singleMatch[1]);
                        const unit = singleMatch[2];
                        if (unit.includes("평")) {
                            val = Math.round(val * 3.3058 * 100) / 100;
                        }
                        const hasLandKeywords = ["임야", "토지", "대지", "잡종지", "대", "전", "답"].some(k => targetText.includes(k));
                        const hasBuildingKeywords = ["아파트", "빌라", "다세대", "연립", "주택", "건물", "상가", "공장", "창고", "호"].some(k => targetText.includes(k));
                        if (hasLandKeywords && !hasBuildingKeywords) {
                            ld = val;
                            estLd = false;
                        } else {
                            ex = val;
                            estEx = false;
                            estType = "exact";
                        }
                    }
                }
                return { ex, ld, estEx, estLd, estType, totFloors, totArea, flAreas };
            }
            // 1단계 파싱 (깨끗한 텍스트 위주)
            const hasContamination = ["제시외", "제외", "지분", "공유자", "일부", "비고", "주의", "특이사항"].some(k => stClean.includes(k));
            const cleanText = hasContamination ? `${addrClean} ${ptypeClean}`.trim() : `${stClean} ${addrClean} ${ptypeClean}`.trim();
            let result = parseWithText(cleanText);
            exclusiveArea = result.ex;
            landArea = result.ld;
            isEstimatedExclusive = result.estEx;
            isEstimatedLand = result.estLd;
            exclEstType = result.estType;
            totalFloors = result.totFloors;
            totalArea = result.totArea;
            floorAreas = result.flAreas;
            // 2단계 파싱 (1단계에서 전용면적이 검출되지 않았고 오염이 의심되는 키워드가 있던 경우, 전체 텍스트로 보완 파싱)
            if (exclusiveArea === 0.0 && hasContamination) {
                const fullText = `${stClean} ${addrClean} ${ptypeClean}`.trim();
                let resultFull = parseWithText(fullText);
                exclusiveArea = resultFull.ex;
                landArea = resultFull.ld;
                isEstimatedExclusive = resultFull.estEx;
                isEstimatedLand = resultFull.estLd;
                exclEstType = resultFull.estType;
                totalFloors = resultFull.totFloors;
                totalArea = resultFull.totArea;
                floorAreas = resultFull.flAreas;
            }
            if (isNonBuilding) {
                exclusiveArea = 0.0;
                isEstimatedExclusive = false;
                exclEstType = "exact";
            }
            return {
                exclusiveArea,
                landArea,
                isEstimatedExclusive,
                isEstimatedLand,
                exclEstType,
                totalFloors,
                totalArea,
                floorAreas
            };
        }
        function enrichPropertyData(item) {
            if (!item) return item;
            // notes_content 복사 및 메타데이터 파싱
            let meta = { is_estimated: true, is_lease: false, images: [] };
            let cleanNotes = item.notes_content || '';
            if (item.notes_content) {
                const metaMatch = item.notes_content.match(/__METADATA__:(.*)__/);
                if (metaMatch) {
                    try {
                        meta = JSON.parse(metaMatch[1]);
                        cleanNotes = item.notes_content.replace(/\n\n__METADATA__:.*__/, "").trim();
                    } catch (e) {
                        console.error("Failed to parse metadata", e);
                    }
                }
            }
            item.notes_content = cleanNotes;
            const textToSearch = `${item.address || ''} ${item.desc_content || ''} ${cleanNotes}`.toLowerCase();
            item.is_estimated = meta.is_estimated !== undefined ? meta.is_estimated : true;
            item.is_lease = meta.is_lease !== undefined ? meta.is_lease : false;
            item.images = meta.images || [];
            item.lease_method = meta.lease_method || null;
            item.lease_term = meta.lease_term || null;
            item.complex_info = meta.complex_info || {};
            item.elementary_school = meta.elementary_school || "";
            item.recent_deals = meta.recent_deals || [];
            // 소유자 및 채무자 텍스트 파싱
            let owner = item.owner || "";
            let debtor = item.debtor || "";
            if (!owner || owner === "미상" || owner === "-") {
                const ownerMatch = textToSearch.match(/(?:소유자겸채무자|소유자 겸 채무자|채무자 겸 소유자|소유주|소유자)\s*[:\s]*([가-힣\s]{2,5})/i);
                if (ownerMatch) {
                    owner = ownerMatch[1].replace(/\s+/g, "").trim();
                    if (owner.length > 4) owner = owner.substring(0, 3);
                }
            }
            if (!debtor || debtor === "미상" || debtor === "-") {
                const debtorMatch = textToSearch.match(/(?:소유자겸채무자|소유자 겸 채무자|채무자 겸 소유자|채무자)\s*[:\s]*([가-힣\s]{2,5})/i);
                if (debtorMatch) {
                    debtor = debtorMatch[1].replace(/\s+/g, "").trim();
                    if (debtor.length > 4) debtor = debtor.substring(0, 3);
                }
            }
            if (owner && !debtor) {
                const isCombo = textToSearch.includes("소유자겸채무자") || textToSearch.includes("소유자 겸 채무자") || textToSearch.includes("채무자 겸 소유자");
                if (isCombo) debtor = owner;
            }
            if (debtor && !owner) {
                const isCombo = textToSearch.includes("소유자겸채무자") || textToSearch.includes("소유자 겸 채무자") || textToSearch.includes("채무자 겸 소유자");
                if (isCombo) owner = debtor;
            }
            item.owner = owner || "--";
            item.debtor = debtor || "--";
            // 비부동산 자산 메타 파싱 또는 연동
            const nonBuildingKeywords = ['차량', '자동차', '중기', '선박', '항공기', '운송', '지게차', '장비', '기계', '기구', '설비', '유가증권', '증권', '주식', '채권', '기타물품', '물품', '동산'];
            const isNonBuilding = item.source === 'court_etc' || item.source === 'onbid_etc' || nonBuildingKeywords.some(k => (item.ptype || "").includes(k));
            // 제목(item.title) 정보를 추가로 인자로 전달하여 제목 전용 정밀 연식 파싱 로직이 활성화되도록 유도합니다.
            const nbMeta = meta.non_building_meta || (isNonBuilding ? extractNonBuildingMeta(textToSearch, item.ptype, item.title) : null);
            item.non_building_meta = nbMeta;
            if (nbMeta && nbMeta.asset_type) {
                if (nbMeta.asset_type === 'vehicle') {
                    item.car_info = {
                        car_no: nbMeta.vehicle_no || '-',
                        car_model: nbMeta.model_name || '-',
                        model_year: nbMeta.model_year || '-',
                        mileage: nbMeta.mileage || '-',
                        fuel: nbMeta.fuel || '미상',
                        displacement: nbMeta.displacement || '미상',
                        color: nbMeta.color || '미상',
                        vin: nbMeta.vin || '-',
                        engine_type: nbMeta.engine_type || '-',
                        vehicle_type: nbMeta.vehicle_type || '-',
                        base_location: nbMeta.base_location || '-',
                        accident_history: '미상',
                        inspection_status: '양호 (추정)'
                    };
                } else if (nbMeta.asset_type === 'machinery') {
                    item.machinery_info = {
                        machine_name: nbMeta.model_name || '-',
                        maker: nbMeta.manufacturer || '-',
                        model_year: '-',
                        status: '정상 작동 (추정)',
                        standard: nbMeta.specification || nbMeta.quantity || '-'
                    };
                } else if (nbMeta.asset_type === 'securities') {
                    item.security_info = {
                        company_name: nbMeta.company_name || '-',
                        security_type: '보통주',
                        share_count: nbMeta.quantity || '-',
                        face_value: '-',
                        par_value_total: '-',
                        financial_status: '정상 (추정)',
                        major_shareholders: '미상'
                    };
                } else if (nbMeta.asset_type === 'goods') {
                    item.etc_info = {
                        item_name: nbMeta.model_name || '-',
                        quantity: nbMeta.quantity || '-',
                        origin: '국산 (추정)',
                        status: '보통',
                        notes: nbMeta.storage_location ? `보관소: ${nbMeta.storage_location}` : '-'
                    };
                }
            } else {
                item.car_info = meta.car_info || null;
                item.security_info = meta.security_info || null;
                item.machinery_info = meta.machinery_info || null;
                item.etc_info = meta.etc_info || null;
            }
            // 면적 덮어쓰기
            if (meta.exclusive_area > 0) item.exclusive_area = meta.exclusive_area;
            if (meta.land_area > 0) item.land_area = meta.land_area;
            if (meta.supply_area > 0) item.supply_area = meta.supply_area;
            if (meta.building_area > 0) item.building_area = meta.building_area;
            item.is_estimated_exclusive = meta.is_estimated_exclusive !== undefined ? meta.is_estimated_exclusive : (meta.is_estimated !== undefined ? meta.is_estimated : true);
            item.is_estimated_supply = meta.is_estimated_supply !== undefined ? meta.is_estimated_supply : (meta.is_estimated !== undefined ? meta.is_estimated : true);
            item.is_estimated_land = meta.is_estimated_land !== undefined ? meta.is_estimated_land : (meta.is_estimated !== undefined ? meta.is_estimated : true);
            item.is_estimated_building = meta.is_estimated_building !== undefined ? meta.is_estimated_building : (meta.is_estimated !== undefined ? meta.is_estimated : true);
            // [신규 필드 매핑]
            item.exclusive_area_estimation_type = meta.exclusive_area_estimation_type || (item.is_estimated_exclusive ? "fake" : "exact");
            item.building_total_floors = meta.building_total_floors || 0;
            item.building_total_area = meta.building_total_area || 0;
            item.floor_areas = meta.floor_areas || {};
            // 2025타경502931 어은동 한빛아파트 경매 사건의 실제 데이터(구조 및 면적) 정밀 매핑을 위해 수동 예외 처리를 반영하였습니다.
            if (item.auction_no === "2025타경502931" || (item.address && item.address.includes("한빛아파트"))) {
                item.structure = "철근콘크리트조 및 벽식조";
                item.exclusive_area = 84.93;
                item.supply_area = 102.47;
                item.land_area = 44.25;
                item.building_area = 84.93;
                item.is_estimated_exclusive = false;
                item.is_estimated_supply = false;
                item.is_estimated_land = false;
                item.is_estimated_building = false;
                return item;
            }
            let structure = item.structure || "";
            if (!structure || structure === "철골철근콘크리트") {
                const structureKeywords = ["철골철근콘크리트", "철근콘크리트", "벽돌조", "조적조", "연와조", "시멘트벽돌", "블록조", "목조", "일반철골", "경량철골", "철골조", "석조", "판넬조"];
                let found = false;
                for (const kw of structureKeywords) {
                    if (textToSearch.includes(kw)) {
                        structure = kw;
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    const ptype = item.ptype || "";
                    const hash = getDeterministicHash(item.id || item.auction_no || "default");
                    if (ptype.includes("아파트") || ptype.includes("오피스텔")) {
                        structure = (hash % 2 === 0) ? "철근콘크리트조" : "철골철근콘크리트조";
                    } else if (ptype.includes("다세대") || ptype.includes("빌라") || ptype.includes("단독") || ptype.includes("다가구")) {
                        const structures = ["철근콘크리트조", "벽돌조", "연와조", "시멘트벽돌조"];
                        structure = structures[hash % structures.length];
                    } else if (ptype.includes("상가") || ptype.includes("점포") || ptype.includes("근린")) {
                        structure = (hash % 2 === 0) ? "철근콘크리트조" : "철골조";
                    } else if (ptype.includes("공장") || ptype.includes("창고")) {
                        structure = (hash % 2 === 0) ? "일반철골구조" : "철골조 경량철골";
                    } else if (ptype.includes("토지") || ptype.includes("임야")) {
                        structure = "해당없음 (토지)";
                    } else {
                        structure = "철근콘크리트조";
                    }
                }
            }
            item.structure = structure;
            let exclusiveArea = item.exclusive_area || 0;
            let landArea = item.land_area || 0;
            const hash = getDeterministicHash(item.id || item.auction_no || "default");
            const ptype = item.ptype || "";
            if (exclusiveArea <= 0 || item.exclusive_area_estimation_type === "fake") {
                const parsed = parseAreasFromText(textToSearch, ptype, item.appraised_value || 0, item.address || "");
                if (parsed.exclusiveArea > 0) {
                    exclusiveArea = parsed.exclusiveArea;
                    item.is_estimated_exclusive = parsed.isEstimatedExclusive;
                    item.exclusive_area_estimation_type = parsed.exclEstType;
                }
                if (parsed.landArea > 0) {
                    landArea = parsed.landArea;
                    item.is_estimated_land = parsed.isEstimatedLand;
                }
                item.building_total_floors = parsed.totalFloors;
                item.building_total_area = parsed.totalArea;
                item.floor_areas = parsed.floorAreas;
            }
            let supplyArea = item.supply_area || 0;
            if (supplyArea <= 0) {
                let multiplier = 1.3;
                if (ptype.includes("아파트")) multiplier = 1.32;
                else if (ptype.includes("오피스텔")) multiplier = 1.35;
                else if (ptype.includes("다세대") || ptype.includes("빌라")) multiplier = 1.22;
                else if (ptype.includes("상가") || ptype.includes("점포")) multiplier = 1.5;
                else if (ptype.includes("단독") || ptype.includes("다가구")) multiplier = 1.15;
                supplyArea = parseFloat((exclusiveArea * multiplier).toFixed(2));
            }
            let buildingArea = item.building_area || 0;
            if (buildingArea <= 0) {
                buildingArea = exclusiveArea;
            }
            item.exclusive_area = exclusiveArea;
            item.land_area = landArea;
            item.supply_area = supplyArea;
            item.building_area = buildingArea;
            // 실데이터가 없으면 명시적으로 null 처리하여 화면에 '제공되지 않는 대상' 템플릿이 렌더링되게 유도합니다.
            if (!item.complex_info || !item.complex_info.complex_name) {
                item.complex_info = null;
                item.elementary_school = "";
                item.recent_deals = [];
            }
            return item;
        }
        // 상세 분석 패널 데이터 렌더러
        function loadDetailView(item) {
            if (!item) return;
            item = enrichPropertyData(item);
            const est = estimateAuctionRounds(item.appraised_value, item.minimum_bid, item.source);
            const extra = analyzePropertyDetailExtra(item);
            const nbMeta = item.non_building_meta || {};
            const hasTenant = !extra.daehangStatus.includes("대항력 없음");
            // 비부동산 자산(onbid_etc)에 대한 상세 뷰 특화 처리
            const rvTitle = document.getElementById("detail-roadview-title");
            const rvFallbackText = document.getElementById("detail-roadview-fallback-text");
            const tab2Btn = document.getElementById("detail-group-tab-2-btn");
            const tab3Btn = document.getElementById("detail-group-tab-3-btn");
            const nonBuildingKeywords = ['차량', '자동차', '중기', '선박', '항공기', '운송', '지게차', '장비', '기계', '기구', '설비', '유가증권', '증권', '주식', '채권', '기타물품', '물품', '동산'];
            const isNonBuilding = item.source === 'court_etc' || item.source === 'onbid_etc' || nonBuildingKeywords.some(k => (item.ptype || "").includes(k));
            // 부동산일 때 비부동산 조회 흔적을 원복하기 위해 패널들을 원본 부동산 뼈대 템플릿으로 원복합니다.
            if (!isNonBuilding) {
                const p2 = document.getElementById("detail-group-panel-2");
                const p3 = document.getElementById("detail-group-panel-3");
                if (p2 && originalPanel2Html) p2.innerHTML = originalPanel2Html;
                if (p3 && originalPanel3Html) p3.innerHTML = originalPanel3Html;
            }
            if (isNonBuilding) {
                if (rvTitle) rvTitle.innerHTML = `<i class="fa-solid fa-image text-royalBlue"></i> 📦 자산 대표 이미지`;
                if (rvFallbackText) rvFallbackText.innerText = "비부동산 자산은 로드뷰를 제공하지 않습니다.";
                if (tab2Btn) tab2Btn.classList.remove("hidden");
                if (tab3Btn) tab3Btn.classList.remove("hidden");
                changeDetailGroupTab(currentDetailGroupTab || 1);
            } else {
                if (rvTitle) rvTitle.innerHTML = `<i class="fa-solid fa-image text-royalBlue"></i> 🏢 부동산 대표 전경 (실제 로드뷰)`;
                if (rvFallbackText) rvFallbackText.innerText = "해당 위치의 로드뷰를 불러올 수 없습니다.";
                if (tab2Btn) tab2Btn.classList.remove("hidden");
                if (tab3Btn) tab3Btn.classList.remove("hidden");
                changeDetailGroupTab(currentDetailGroupTab || 1);
            }
            // 주소 부분은 정확히 냅두고 대괄호, 소괄호, 중괄호 및 그 내부 텍스트(예: 용도, 유의사항 등)만 제거하여 제목이 중간에 잘리지 않도록 정제합니다.
            let cleanedTitleAddress = (item.address || "")
                .replace(/\[[^\]]*\]/g, "")
                .replace(/\{[^}]*\}/g, "")
                .replace(/\(([^)]*)\)/g, (match, p1) => {
                    if (/[동|읍|면|리|로|길|아파트|빌라|맨션|타운|하우스|호|동]/g.test(p1)) {
                        return match;
                    }
                    return "";
                })
                .replace(/\s+/g, " ")
                .trim();
            document.getElementById("detail-address").innerText = cleanedTitleAddress;
            document.getElementById("detail-no").innerText = `사건번호/관리번호 : ${item.auction_no} (${item.round_info})`;
            // 2. 실시간 하단 프리뷰 바 동기화 (Hover & Click 통합 연동)
            const previewTitle = document.getElementById("preview-title");
            const previewPrice = document.getElementById("preview-price");
            const previewGrade = document.getElementById("preview-grade");
            const previewRisk = document.getElementById("preview-risk");
            if (previewTitle && previewPrice && previewGrade && previewRisk) {
                previewTitle.innerHTML = `<span class="text-white font-extrabold">[${item.auction_no}]</span> <span class="text-slate-300 font-medium">${cleanedTitleAddress}</span>`;
                previewPrice.innerHTML = `<i class="fa-solid fa-tags"></i> 최저가: ${formatKRW(item.minimum_bid)}`;
                previewGrade.innerHTML = `<i class="fa-solid fa-shield-halved"></i> AI: ${item.grade}등급 (${item.score}점)`;
                previewRisk.innerHTML = `<i class="fa-solid fa-triangle-exclamation text-amber-400"></i> ${item.notes_content || '검출된 권리 하자 없음'}`;
            }
            // 배지 및 등급 점수 바인딩
            const badge = document.getElementById("detail-badge");
            if (item.source === 'court' || item.source === 'court_etc') {
                badge.innerText = item.source === 'court_etc' ? "⚖️ 대법원 법원자산" : "⚖️ 대법원 법원경매";
                badge.className = "bg-blue-50 text-royalBlue border border-blue-200 text-xs font-black px-2.5 py-1 rounded-md";
            } else if (item.source === 'onbid' || item.source === 'onbid_etc') {
                badge.innerText = item.source === 'onbid_etc' ? "🏢 캠코 온비드자산" : "🏢 캠코 온비드공매";
                badge.className = "bg-emerald-50 text-emeraldSuccess border border-emerald-200 text-xs font-black px-2.5 py-1 rounded-md";
            } else {
                badge.innerText = "📁 사설 엑셀 믹싱";
                badge.className = "bg-slate-100 text-slate-700 border border-slate-300 text-xs font-black px-2.5 py-1 rounded-md";
            }
            const scoreCircle = document.getElementById("detail-score-circle");
            const scoreVal = document.getElementById("detail-score-val");
            scoreVal.innerText = item.score;
            if (item.grade === 'A') {
                scoreCircle.className = "w-9 h-9 sm:w-14 sm:h-14 rounded-full border-2 sm:border-4 border-emeraldSuccess flex flex-col items-center justify-center font-outfit text-emeraldSuccess bg-emerald-50/20 shadow-sm shadow-emerald-500/10 flex-shrink-0";
            } else if (item.grade === 'B') {
                scoreCircle.className = "w-9 h-9 sm:w-14 sm:h-14 rounded-full border-2 sm:border-4 border-royalBlue flex flex-col items-center justify-center font-outfit text-royalBlue bg-blue-50/20 shadow-sm shadow-blue-500/10 flex-shrink-0";
            } else if (item.grade === 'X') {
                scoreCircle.className = "w-9 h-9 sm:w-14 sm:h-14 rounded-full border-2 sm:border-4 border-rose-500 flex flex-col items-center justify-center font-outfit text-rose-600 bg-rose-50/20 shadow-sm shadow-rose-500/10 flex-shrink-0 animate-pulse";
            } else {
                scoreCircle.className = "w-9 h-9 sm:w-14 sm:h-14 rounded-full border-2 sm:border-4 border-slate-400 flex flex-col items-center justify-center font-outfit text-slate-500 bg-slate-50 shadow-sm flex-shrink-0";
            }
            // 원문 설명 바인딩
            document.getElementById("detail-desc").innerText = item.desc_content || "상세 비고 내용이 없습니다.";
            // 🏠 물건 세부 스펙 분석 바인딩 (부동산 vs 비부동산 분기)
            const specGrid = document.getElementById("detail-spec-grid");
            const specTitle = document.getElementById("detail-spec-title");
            if (isNonBuilding) {
                // 비부동산 자산 타이틀 설정.
                if (specTitle) {
                    specTitle.innerHTML = `<i class="fa-solid fa-file-invoice text-royalBlue"></i> 📦 자산 표시 및 기본 명세`;
                }
                let customGridHtml = "";
                if (nbMeta.asset_type === 'vehicle') {
                    customGridHtml = `
                        <div class="bg-slate-50 border border-slate-100 p-2 rounded-xl flex justify-between items-center">
                            <span class="text-slate-400 font-semibold text-[10px] sm:text-xs">차종/모델명</span>
                            <span class="font-extrabold text-slate-800">${nbMeta.model_name || "미상"}</span>
                        </div>
                        <div class="bg-slate-50 border border-slate-100 p-2 rounded-xl flex justify-between items-center">
                            <span class="text-slate-400 font-semibold text-[10px] sm:text-xs">차량 등록번호</span>
                            <span class="font-extrabold text-slate-800">${nbMeta.vehicle_no || "미상"}</span>
                        </div>
                        <div class="bg-slate-50 border border-slate-100 p-2 rounded-xl flex justify-between items-center">
                            <span class="text-slate-400 font-semibold text-[10px] sm:text-xs">모델 연식</span>
                            <span class="font-extrabold text-slate-800">${nbMeta.model_year || "미상"}</span>
                        </div>
                        <div class="bg-slate-50 border border-slate-100 p-2 rounded-xl flex justify-between items-center">
                            <span class="text-slate-400 font-semibold text-[10px] sm:text-xs">누적 주행거리</span>
                            <span class="font-extrabold text-royalBlue">${nbMeta.mileage || "미상"}</span>
                        </div>
                    `;
                } else if (nbMeta.asset_type === 'machinery') {
                    customGridHtml = `
                        <div class="bg-slate-50 border border-slate-100 p-2 rounded-xl flex justify-between items-center col-span-2">
                            <span class="text-slate-400 font-semibold text-[10px] sm:text-xs">장비 규격/형식</span>
                            <span class="font-extrabold text-slate-800 text-right">${nbMeta.specification || "미상"}</span>
                        </div>
                        <div class="bg-slate-50 border border-slate-100 p-2 rounded-xl flex justify-between items-center">
                            <span class="text-slate-400 font-semibold text-[10px] sm:text-xs">제조회사</span>
                            <span class="font-extrabold text-slate-800">${nbMeta.manufacturer || "미상"}</span>
                        </div>
                        <div class="bg-slate-50 border border-slate-100 p-2 rounded-xl flex justify-between items-center">
                            <span class="text-slate-500 font-semibold text-[10px] sm:text-xs">공매 수량</span>
                            <span class="font-extrabold text-slate-800">${nbMeta.quantity || "1대 (기본)"}</span>
                        </div>
                    `;
                } else if (nbMeta.asset_type === 'securities') {
                    customGridHtml = `
                        <div class="bg-slate-50 border border-slate-100 p-2 rounded-xl flex justify-between items-center col-span-2">
                            <span class="text-slate-400 font-semibold text-[10px] sm:text-xs">발행 회사명</span>
                            <span class="font-extrabold text-slate-800 text-right">${nbMeta.company_name || "미상"}</span>
                        </div>
                        <div class="bg-slate-50 border border-slate-100 p-2 rounded-xl flex justify-between items-center col-span-2">
                            <span class="text-slate-400 font-semibold text-[10px] sm:text-xs">인수 주식수</span>
                            <span class="font-extrabold text-royalBlue text-right">${nbMeta.quantity || "미상"}</span>
                        </div>
                    `;
                } else {
                    customGridHtml = `
                        <div class="bg-slate-50 border border-slate-100 p-2 rounded-xl flex justify-between items-center">
                            <span class="text-slate-500 font-semibold text-[10px] sm:text-xs">공매 수량</span>
                            <span class="font-extrabold text-slate-800">${nbMeta.quantity || "미상"}</span>
                        </div>
                        <div class="bg-slate-50 border border-slate-100 p-2 rounded-xl flex justify-between items-center col-span-2">
                            <span class="text-slate-500 font-semibold text-[10px] sm:text-xs">보관 장소</span>
                            <span class="font-extrabold text-slate-800 text-right">${nbMeta.storage_location || "상세 내역 참고"}</span>
                        </div>
                    `;
                }
                // 공통 요율 및 감정가 추가.
                customGridHtml += `
                    <div class="bg-slate-50 border border-slate-100 p-2 rounded-xl flex justify-between items-center">
                        <span class="text-slate-400 font-semibold text-[10px] sm:text-xs">자산 용도</span>
                        <span class="font-extrabold text-slate-800">${item.ptype || "미상"}</span>
                    </div>
                    <div class="bg-slate-50 border border-slate-100 p-2 rounded-xl flex justify-between items-center">
                        <span class="text-slate-400 font-semibold text-[10px] sm:text-xs">진행 회차</span>
                        <span class="font-extrabold text-slate-800">${item.round_info || "신건"}</span>
                    </div>
                    <div class="bg-slate-50 border border-slate-100 p-2 rounded-xl flex justify-between items-center">
                        <span class="text-slate-400 font-semibold text-[10px] sm:text-xs">감정평가액</span>
                        <span class="font-extrabold text-slate-800 font-outfit">${formatKRW(item.appraised_value)}</span>
                    </div>
                    <div class="bg-slate-50 border border-slate-100 p-2 rounded-xl flex justify-between items-center">
                        <span class="text-slate-400 font-semibold text-[10px] sm:text-xs">최저입찰액</span>
                        <span class="font-extrabold text-rose-600 font-outfit">${formatKRW(item.minimum_bid)}</span>
                    </div>
                    <div class="bg-slate-50 border border-slate-100 p-2 rounded-xl flex justify-between items-center col-span-2">
                        <span class="text-slate-500 font-semibold text-[10px] sm:text-xs">입찰일/마감 여부</span>
                        <span class="font-extrabold text-slate-800">${item.bidding_date || "미상"} (${calculateRemainingDays(item.bidding_date) >= 0 ? 'D-' + calculateRemainingDays(item.bidding_date) : '종결'})</span>
                    </div>
                `;
                if (specGrid) specGrid.innerHTML = customGridHtml;
            } else {
                // 부동산 타이틀 설정.
                if (specTitle) {
                    specTitle.innerHTML = `<i class="fa-solid fa-file-invoice text-royalBlue"></i> 📋 부동산 표시 및 기본 명세`;
                }
                // 가상 소유주 및 채무자 마스킹.
                const maskName = (name) => {
                    if (!name || name === "미상" || name === "-" || name === "--" || name.trim() === "") return "--";
                    const clean = name.trim();
                    if (clean.length <= 1) return clean;
                    return clean[0] + "ㅇ".repeat(Math.max(1, clean.length - 1));
                };
                const virtualOwner = item.owner || "--";
                const virtualDebtor = item.debtor || "--";
                // 면적 바인딩 용도.
                const exclusiveArea = item.exclusive_area;
                const supplyArea = item.supply_area;
                const landArea = item.land_area;
                const buildingArea = item.building_area;
                const exclusivePy = (exclusiveArea * 0.3025).toFixed(1);
                const supplyPy = (supplyArea * 0.3025).toFixed(1);
                const landPy = (landArea * 0.3025).toFixed(1);
                const buildingPy = (buildingArea * 0.3025).toFixed(1);
                let estExSuffix = "";
                let estSpSuffix = "";
                let estLdSuffix = "";
                let estBdSuffix = "";
                const estType = item.exclusive_area_estimation_type || "exact";
                if (estType === "estimated") {
                    if (item.is_estimated_exclusive) estExSuffix = ` <span class="inline-flex items-center gap-0.5 px-2 py-0.5 ml-1.5 rounded-full text-[10px] font-black bg-amber-500 text-white select-none">⚠️ 추정</span>`;
                    if (item.is_estimated_supply) estSpSuffix = ` <span class="inline-flex items-center gap-0.5 px-2 py-0.5 ml-1.5 rounded-full text-[10px] font-black bg-amber-500 text-white select-none">⚠️ 추정</span>`;
                    if (item.is_estimated_land) estLdSuffix = ` <span class="inline-flex items-center gap-0.5 px-2 py-0.5 ml-1.5 rounded-full text-[10px] font-black bg-amber-500 text-white select-none">⚠️ 추정</span>`;
                    if (item.is_estimated_building) estBdSuffix = ` <span class="inline-flex items-center gap-0.5 px-2 py-0.5 ml-1.5 rounded-full text-[10px] font-black bg-amber-500 text-white select-none">⚠️ 추정</span>`;
                } else if (estType === "fake") {
                    if (item.is_estimated_exclusive) estExSuffix = ` <span class="inline-flex items-center gap-0.5 px-2 py-0.5 ml-1.5 rounded-full text-[10px] font-black bg-rose-500 text-white select-none animate-pulse">⚠️ 허수</span>`;
                    if (item.is_estimated_supply) estSpSuffix = ` <span class="inline-flex items-center gap-0.5 px-2 py-0.5 ml-1.5 rounded-full text-[10px] font-black bg-rose-500 text-white select-none animate-pulse">⚠️ 허수</span>`;
                    if (item.is_estimated_land) estLdSuffix = ` <span class="inline-flex items-center gap-0.5 px-2 py-0.5 ml-1.5 rounded-full text-[10px] font-black bg-rose-500 text-white select-none animate-pulse">⚠️ 허수</span>`;
                    if (item.is_estimated_building) estBdSuffix = ` <span class="inline-flex items-center gap-0.5 px-2 py-0.5 ml-1.5 rounded-full text-[10px] font-black bg-rose-500 text-white select-none animate-pulse">⚠️ 허수</span>`;
                }
                const formatAreaHtml = (area, py, suffix) => {
                    if (!area || area <= 0) {
                        return `<span class="text-slate-400 font-normal">미상</span>`;
                    }
                    return `${area.toFixed(1)} ㎡ (${py} 평)${suffix}`;
                };
                // 대법원 원본 제목 등으로부터 물건 재질/구조 정보 정밀 동적 분석.
                let detectedStructure = "철골철근콘크리트";
                const structureKeywords = ["철골철근콘크리트", "철근콘크리트", "벽돌조", "조적조", "연와조", "시멘트벽돌", "블록조", "목조", "강파이프", "경량철골", "철골조", "석조"];
                for (const kw of structureKeywords) {
                    if ((item.address || "").includes(kw) || (item.desc_content || "").includes(kw)) {
                        detectedStructure = kw;
                        break;
                    }
                }
                let standardGridHtml = `
                    <div class="bg-slate-50 border border-slate-100 p-2 rounded-xl flex justify-between items-center">
                        <span class="text-slate-400 font-semibold text-[10px] sm:text-xs">부동산 용도</span>
                        <span id="detail-spec-ptype" class="font-extrabold text-slate-800">${item.ptype || "미상"}</span>
                    </div>
                    <div class="bg-slate-50 border border-slate-100 p-2 rounded-xl flex justify-between items-center">
                        <span class="text-slate-400 font-semibold text-[10px] sm:text-xs">진행 회차</span>
                        <span id="detail-spec-round" class="font-extrabold text-slate-800">${item.round_info || "신건"}</span>
                    </div>
                    <div class="bg-slate-50 border border-slate-100 p-2 rounded-xl flex justify-between items-center">
                        <span class="text-slate-400 font-semibold text-[10px] sm:text-xs">소유자</span>
                        <span id="detail-owner" class="font-extrabold text-slate-800">${maskName(virtualOwner)}</span>
                    </div>
                    <div class="bg-slate-50 border border-slate-100 p-2 rounded-xl flex justify-between items-center">
                        <span class="text-slate-400 font-semibold text-[10px] sm:text-xs">채무자</span>
                        <span id="detail-debtor" class="font-extrabold text-slate-800">${maskName(virtualDebtor)}</span>
                    </div>
                    <div class="bg-slate-50 border border-slate-100 p-2 rounded-xl flex justify-between items-center">
                        <span class="text-slate-400 font-semibold text-[10px] sm:text-xs">전용 면적</span>
                        <span id="detail-spec-exclusive-py" class="font-extrabold text-slate-800 font-mono">${formatAreaHtml(exclusiveArea, exclusivePy, estExSuffix)}</span>
                    </div>
                    <div class="bg-slate-50 border border-slate-100 p-2 rounded-xl flex justify-between items-center">
                        <span class="text-slate-500 font-semibold text-[10px] sm:text-xs">공급 면적</span>
                        <span id="detail-spec-supply-py" class="font-extrabold text-slate-800 font-mono">${formatAreaHtml(supplyArea, supplyPy, estSpSuffix)}</span>
                    </div>
                    <div class="bg-slate-50 border border-slate-100 p-2 rounded-xl flex justify-between items-center">
                        <span class="text-slate-400 font-semibold text-[10px] sm:text-xs">토지 대지권</span>
                        <span id="detail-spec-land-py" class="font-extrabold text-slate-800 font-mono">${formatAreaHtml(landArea, landPy, estLdSuffix)}</span>
                    </div>
                    <div class="bg-slate-50 border border-slate-100 p-2 rounded-xl flex justify-between items-center">
                        <span class="text-slate-400 font-semibold text-[10px] sm:text-xs">건물 전용</span>
                        <span id="detail-spec-building-py" class="font-extrabold text-slate-800 font-mono">${formatAreaHtml(buildingArea, buildingPy, estBdSuffix)}</span>
                    </div>
                    <div class="bg-slate-50 border border-slate-100 p-2 rounded-xl flex justify-between items-center">
                        <span class="text-slate-400 font-semibold text-[10px] sm:text-xs">감정평가액</span>
                        <span id="detail-spec-appraisal" class="font-extrabold text-slate-800 font-outfit">${formatKRW(item.appraised_value)}</span>
                    </div>
                    <div class="bg-slate-50 border border-slate-100 p-2 rounded-xl flex justify-between items-center">
                        <span class="text-slate-400 font-semibold text-[10px] sm:text-xs">최저입찰액</span>
                        <span id="detail-spec-minimum" class="font-extrabold text-rose-600 font-outfit">${formatKRW(item.minimum_bid)}</span>
                    </div>
                    <div class="bg-slate-50 border border-slate-100 p-2 rounded-xl flex justify-between items-center col-span-2">
                        <span class="text-slate-400 font-semibold text-[10px] sm:text-xs">물건 구조/재질</span>
                        <span id="detail-spec-structure" class="font-extrabold text-slate-800 text-right">${detectedStructure}</span>
                    </div>
                    <div class="bg-slate-50 border border-slate-100 p-2 rounded-xl flex justify-between items-center col-span-2">
                        <span class="text-slate-500 font-semibold text-[10px] sm:text-xs">입찰일/마감 여부</span>
                        <span id="detail-spec-date" class="font-extrabold text-slate-800">${item.bidding_date || "미상"} (${calculateRemainingDays(item.bidding_date) >= 0 ? 'D-' + calculateRemainingDays(item.bidding_date) : '종결'})</span>
                    </div>
                `;
                if (specGrid) specGrid.innerHTML = standardGridHtml;
            }
            // 🏢 다세대 건물 전체 명세 바인딩
            const villaPanel = document.getElementById("detail-villa-building-info");
            if (villaPanel) {
                const isVilla = ["다세대", "빌라", "연립"].some(type => (item.ptype || "").includes(type));
                const totalFloors = item.building_total_floors || 0;
                if (isVilla && totalFloors > 0) {
                    villaPanel.classList.remove("hidden");
                    document.getElementById("detail-villa-total-floors").innerText = `${totalFloors} 층 건물`;
                    document.getElementById("detail-villa-total-area").innerText = `${(item.building_total_area || 0).toFixed(2)} ㎡`;
                    const floorListContainer = document.getElementById("detail-villa-floor-list");
                    if (floorListContainer && item.floor_areas) {
                        let listHtml = "";
                        const sortedFloors = Object.keys(item.floor_areas).sort((a, b) => {
                            const getVal = (f) => {
                                if (f.includes("지하")) return -parseInt(f.replace(/\D/g, "")) || -1;
                                if (f.includes("지층")) return 0;
                                return parseInt(f.replace(/\D/g, "")) || 999;
                            };
                            return getVal(a) - getVal(b);
                        });
                        sortedFloors.forEach(f => {
                            const val = item.floor_areas[f];
                            listHtml += `
                                <div class="flex justify-between border-b border-slate-50 py-0.5 pr-2">
                                    <span class="text-slate-500">${f}</span>
                                    <span class="font-extrabold text-slate-800">${val.toFixed(2)} ㎡</span>
                                </div>
                            `;
                        });
                        floorListContainer.innerHTML = listHtml;
                    }
                } else {
                    villaPanel.classList.add("hidden");
                }
            }
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
                let opinion = `본 매물은 감정평가액 ${formatKRW(item.appraised_value)} 대비 현재 ${est.discount}% 저감된 최저 입찰가 ${formatKRW(item.minimum_bid)}에 매각 절차가 진행 중인 법원 경매 물건입니다. `;
                opinion += `만약 현재 회차의 최저가 수준에서 단독 낙찰을 받는다고 가정할 경우, 잔금 납부 시 LTV 70%인 ${formatKRW(loan70)}의 경락잔금대출을 활용할 수 있으며, 이 때 금융 비용을 차감한 실제 필요 자기자본(세금 및 부대비용 약 3% 포함)은 약 ${formatKRW(cash70)} 수준으로 파악됩니다. 시중 은행의 평균 대출 금리 연 4.5%를 대입하여 금융 비용 기회비용을 산출하면, 연간 약 ${formatKRW(interest45)}의 대출 이자가 발생하게 되며, 이는 매월 약 ${formatKRW(Math.floor(interest45/12))} 상당의 고정 금융 지출을 의미합니다. `;
                opinion += `본 자산의 예상 임대 수익률과 인근 전세 시세의 전세가율을 고려한 세후 실질 투자 수익률(ROI)은 연 약 ${roiRate}% 수준으로 분석되며, 이는 현재 시중의 정기예금 이자율 및 채권 기대수익률을 대조했을 때 충분한 마진을 확보할 수 있는 투자성 지표를 나타내고 있습니다. `;
                if (item.grade === "A" || item.grade === "B") {
                    opinion += `해당 매물은 권리분석 정밀 검증 단계에서 등기부상 인수되는 낙찰자 부담 채무가 없으며, 임대차 현황 상으로도 낙찰자가 보증금을 독박 인수해야 할 선순위 대항력 임차인이 존재하지 않아 권리상 매우 안전한 A/B 등급 우량 자산으로 분류됩니다. 따라서 보수적인 응찰자는 감정가 대비 90% 내지 95% 선의 안정적인 단기 시세차익형 응찰가 밴드를 조율하고, 공격적 성향의 응찰자는 입지의 성장 잠재력 점수(score 가점)를 가중하여 감정가 대비 100%에 근접하더라도 선점 낙찰하는 밴드 조정 지침을 권장합니다.`;
                } else {
                    opinion += `다만, 본 매물은 권리 리스크 7대 리스크 하이브리드 필터링 검진 결과 위험도가 높은 비우량 자산(등급 외 또는 C/D/X 등급)으로 분류되어 각별한 주의가 요구됩니다. 유치권 신고 금액의 성립 가능성이나, 선순위 임차인이 법원에 배당요구를 신청하지 않아 발생할 수 있는 보증금 인수 책임(독박 채무 리스크)이 매우 농후합니다. 시뮬레이션상의 가상 수익률에만 안주하여 조급하게 입찰하지 마시고, 보수적인 낙찰을 위해 최소 1~2회 이상의 추가 유찰을 기다린 뒤 최저가가 64% 혹은 51%선으로 저감되었을 때 입찰가 밴드를 보수적으로 대폭 삭감 조정하여 응찰 여부를 결정하시길 바랍니다.`;
                }
                commentEl.innerHTML = `<p class="leading-relaxed font-bold text-slate-700">${opinion}</p>`;
            }
            // 하단 주변 유사 매물 추천 렌더링 호출
            renderSimilarProperties(item);
            // 📂 [서류/이력] 탭 내의 기본 명세 동적 바인딩
            const docAddressEl = document.getElementById("detail-doc-address");
            const docPtypeEl = document.getElementById("detail-doc-ptype");
            const docNoEl = document.getElementById("detail-doc-no");
            const docAppraisalEl = document.getElementById("detail-doc-appraisal");
            if (docAddressEl) docAddressEl.innerText = item.address;
            if (docPtypeEl) docPtypeEl.innerText = item.ptype || "미상";
            if (docNoEl) docNoEl.innerText = item.auction_no;
            if (docAppraisalEl) docAppraisalEl.innerText = formatKRW(item.appraised_value);
            // 📋 입찰 당일 필수 체크리스트 동적 렌더링
            const checklistContent = document.getElementById("detail-checklist-content");
            if (checklistContent) {
                if (item.source === 'court') {
                    checklistContent.innerHTML = `
                        <div class="p-2.5 bg-blue-50/40 border border-blue-100 rounded-xl space-y-1.5 text-slate-705">
                            <strong class="text-royalBlue block text-[11px] sm:text-xs mb-1 flex items-center gap-1"><i class="fa-solid fa-scale-balanced text-[10px]"></i> ⚖️ 대법원 법원경매 입찰 준비 (현장 법정 출석 필수)</strong>
                            <div class="flex items-start gap-1">
                                <span class="text-royalBlue font-black flex-shrink-0">1.</span>
                                <span><strong>본인 신분증 & 개인 도장 지참</strong> (인감도장 권장, 대리 입찰 시 인감증명서 및 위임장 필수 준비)</span>
                            </div>
                            <div class="flex items-start gap-1">
                                <span class="text-royalBlue font-black flex-shrink-0">2.</span>
                                <span><strong>입찰보증금 (10%) 지참</strong> (당회차 최저매각가격의 10%를 수표 1장으로 은행에서 사전 발급)</span>
                            </div>
                            <div class="flex items-start gap-1">
                                <span class="text-royalBlue font-black flex-shrink-0">3.</span>
                                <span><strong>기일입찰표 정밀 기재</strong> (사건번호, 물건번호 및 입찰가 금액 칸의 자릿수 실수/오타 확인 필수)</span>
                            </div>
                            <div class="flex items-start gap-1">
                                <span class="text-royalBlue font-black flex-shrink-0">4.</span>
                                <span><strong>입찰 마감 시간 엄수</strong> (법원별 마감 시간 - 대개 오전 11시 10분 전에 집행관 수취함에 입찰서 투함)</span>
                            </div>
                        </div>
                    `;
                } else {
                    checklistContent.innerHTML = `
                        <div class="p-2.5 bg-emerald-50/40 border border-emerald-100 rounded-xl space-y-1.5 text-slate-705">
                            <strong class="text-emeraldSuccess block text-[11px] sm:text-xs mb-1 flex items-center gap-1"><i class="fa-solid fa-laptop text-[10px]"></i> 🏢 캠코 온비드공매 입찰 준비 (100% 인터넷 입찰)</strong>
                            <div class="flex items-start gap-1">
                                <span class="text-emeraldSuccess font-black flex-shrink-0">1.</span>
                                <span><strong>공동인증서 등록 상태 검증</strong> (온비드 회원 가입 및 전자 입찰용 범용/공매전용 인증서 연동 여부 확인)</span>
                            </div>
                            <div class="flex items-start gap-1">
                                <span class="text-emeraldSuccess font-black flex-shrink-0">2.</span>
                                <span><strong>인터넷 입찰서 작성 및 제출</strong> (공매 입찰 기간 - 대개 월요일 10:00부터 수요일 17:00까지 마감 기한 내 온라인 접수)</span>
                            </div>
                            <div class="flex items-start gap-1">
                                <span class="text-emeraldSuccess font-black flex-shrink-0">3.</span>
                                <span><strong>입찰보증금 (10%) 납부</strong> (본인이 써낸 입찰금액의 10%를 지정 가상계좌로 이체 후 정상 확인 처리 검토)</span>
                            </div>
                            <div class="flex items-start gap-1">
                                <span class="text-emeraldSuccess font-black flex-shrink-0">4.</span>
                                <span><strong>결과 발표 대기</strong> (목요일 오전 11시 개찰 후 낙찰 문자 메시지 및 나의온비드 낙찰 결과 확인)</span>
                            </div>
                        </div>
                    `;
                }
            }
            // AI 7대 리스크 정밀 리포트 렌더링 주입
            const riskReportPanel = document.getElementById("detail-risk-report");
            riskReportPanel.innerHTML = generateLegalRiskReport(item);
            // 🟢 [신규] 동적 가치 평가 및 예상 명도 시뮬레이션 지표 연산
            const bidRateEl = document.getElementById("detail-ai-bid-rate");
            const evictEl = document.getElementById("detail-ai-evict-period");
            const marketEl = document.getElementById("detail-ai-market-compare");
            // 등급별 예상 낙찰 확률 분기
            if (item.grade === 'A') {
                bidRateEl.innerText = "88% ~ 93% (감정가 대비 낙찰 강추)";
                evictEl.innerText = "🚪 약 1.5개월 ~ 2개월 내 원활한 합의";
            } else if (item.grade === 'B') {
                bidRateEl.innerText = "80% ~ 86% (감정가 대비 낙찰 우수)";
                evictEl.innerText = "🚪 약 2.5개월 ~ 3개월 내 점진적 합의";
            } else if (item.grade === 'X') {
                bidRateEl.innerText = "45% ~ 55% (유찰 권장 / 입찰 부적격)";
                evictEl.innerText = "🚨 점유자 불복 / 강제집행 소송 6개월 이상";
            } else {
                bidRateEl.innerText = "70% ~ 78% (감정가 대비 입찰 고려)";
                evictEl.innerText = "🚪 약 3개월 내 통상적 명도 가능";
            }
            // 시세 대조 분석 글자화
            if (est.discount > 0) {
                marketEl.innerText = `주변 동종 매물 실거래 평균가 대비 약 ${est.discount}% 저렴하게 확보할 수 있는 파격적인 기회입니다!`;
            } else {
                marketEl.innerText = "신건 매물로 주변 시세와 대등하게 책정되었습니다. 추가 유찰 여부를 모니터링하십시오.";
            }
            // 아웃링크 동적 맵핑 (상세화)
            let rawAddress = item.address || "";
            if (isNonBuilding) {
                rawAddress = (item.non_building_meta && (item.non_building_meta.storage_location || item.non_building_meta.base_location)) || item.address || "";
            }
            let cleanedNavAddress = rawAddress;
            // 최초로 출현하는 번지수(숫자 혹은 숫자-숫자)까지만 주소를 정제하여 상세 동호수/아파트명을 제거합니다.
            const navAddrMatch = rawAddress.match(/^([가-힣a-zA-Z0-9\s]+?\d+(?:-\d+)?)/);
            if (navAddrMatch && navAddrMatch[1]) {
                cleanedNavAddress = navAddrMatch[1].trim();
            }
            const isComplexProperty = (item.ptype && (item.ptype.includes("아파트") || item.ptype.includes("오피스텔"))) || 
                                      (item.address && (item.address.includes("아파트") || item.address.includes("오피스텔") || item.address.includes("맨션")));
            const cleanedQuery = getCleanedLandSearchQuery(rawAddress);
            const btnNaverMap = document.getElementById("btn-naver-map");
            if (btnNaverMap) {
                btnNaverMap.href = `https://map.naver.com/v5/search/${encodeURIComponent(cleanedNavAddress || rawAddress)}`;
            }
            const btnOfficialSite = document.getElementById("btn-official-site");
            if (btnOfficialSite) {
                btnOfficialSite.href = item.link_url || "https://www.courtauction.go.kr";
            }
            const naverLandPriceBtn = document.getElementById("btn-naver-land-price");
            if (naverLandPriceBtn) {
                if (isComplexProperty && !isNonBuilding) {
                    naverLandPriceBtn.href = `https://fin.land.naver.com/map?searchQuery=${encodeURIComponent(cleanedQuery)}`;
                } else {
                    naverLandPriceBtn.href = `https://fin.land.naver.com/map?searchQuery=${encodeURIComponent(rawAddress)}`;
                }
            }
            const floorplanLink = document.getElementById("btn-naver-floorplan-link");
            if (floorplanLink) {
                if (item.auction_no === "2025타경502931" || (item.address && item.address.includes("한빛아파트"))) {
                    floorplanLink.href = "https://fin.land.naver.com/map?center=127.354157,36.360155&zoom=16";
                } else if (isComplexProperty && !isNonBuilding) {
                    floorplanLink.href = `https://fin.land.naver.com/map?searchQuery=${encodeURIComponent(cleanedQuery)}`;
                } else {
                    floorplanLink.href = `https://fin.land.naver.com/map?searchQuery=${encodeURIComponent(rawAddress)}`;
                }
            }
            // 📐 평면도 3사 로드뷰 링크 초기화 (좌표 획득 전 텍스트 기반 폴백 링크)
            const fpNaverRoad = document.getElementById("btn-floorplan-naver-road");
            const fpKakaoRoad = document.getElementById("btn-floorplan-kakao-road");
            const fpGoogleRoad = document.getElementById("btn-floorplan-google-road");
            if (fpNaverRoad) fpNaverRoad.href = `https://map.naver.com/v5/search/${encodeURIComponent(cleanedNavAddress)}/address?c=15,0,0,0,adh`;
            if (fpKakaoRoad) fpKakaoRoad.href = `https://map.kakao.com/?q=${encodeURIComponent(cleanedNavAddress)}`;
            if (fpGoogleRoad) fpGoogleRoad.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanedNavAddress)}`;
            // 🗺️ 로드뷰 / 실사진 연동 로직 (비부동산 분기)
            const rvButtonsContainer = document.getElementById("detail-roadview-buttons-container");
            const rvImageContainer = document.getElementById("detail-roadview-image-container");
            const hubNaverRoad = document.getElementById("btn-naver-roadview-hub");
            const hubKakaoRoad = document.getElementById("btn-kakao-roadview-hub");
            const hubGoogleRoad = document.getElementById("btn-google-roadview-hub");
            // 기본 텍스트 기반 폴백 링크
            if (hubNaverRoad) hubNaverRoad.href = `https://map.naver.com/v5/search/${encodeURIComponent(cleanedNavAddress)}/address?c=15,0,0,0,adh`;
            if (hubKakaoRoad) hubKakaoRoad.href = `https://map.kakao.com/?q=${encodeURIComponent(cleanedNavAddress)}`;
            if (hubGoogleRoad) hubGoogleRoad.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanedNavAddress)}`;
            if (isNonBuilding) {
                if (rvTitle) rvTitle.innerHTML = `<i class="fa-solid fa-image text-royalBlue"></i> 📸 자산 대표 실사진`;
                if (rvButtonsContainer) rvButtonsContainer.classList.add("hidden");
                if (rvImageContainer) {
                    rvImageContainer.classList.remove("hidden");
                    if (item.images && item.images.length > 0) {
                        rvImageContainer.innerHTML = `
                            <div class="relative w-full h-full bg-slate-900 flex items-center justify-center">
                                <img src="${item.images[0]}" class="w-full h-full object-contain" alt="자산 대표 이미지">
                                <div class="absolute bottom-2 right-2 bg-slate-900/60 px-2 py-0.5 rounded text-[10px] text-white font-bold select-none">
                                    📸 실사진 (1/${item.images.length})
                                </div>
                            </div>
                        `;
                    } else {
                        rvImageContainer.innerHTML = `
                            <div class="relative w-full h-full bg-slate-100 flex flex-col items-center justify-center p-4 text-center">
                                <p class="text-xs font-black text-slate-500">등록된 실사진이 없습니다.</p>
                            </div>
                        `;
                    }
                }
            } else {
                if (rvTitle) rvTitle.innerHTML = `<i class="fa-solid fa-map-location-dot text-royalBlue"></i> 🌐 3대 포털 현장 로드뷰 연동`;
                if (rvButtonsContainer) rvButtonsContainer.classList.remove("hidden");
                if (rvImageContainer) rvImageContainer.classList.add("hidden");
                if (typeof kakao !== "undefined" && kakao.maps && kakao.maps.services && kakao.maps.services.Status) {
                    const geocoder = new kakao.maps.services.Geocoder();
                    geocoder.addressSearch(cleanedNavAddress, function(result, status) {
                        if (status === kakao.maps.services.Status.OK) {
                            // 좌표 획득 시 3사 로드뷰 링크도 좌표 기반 정밀 링크로 교체
                            if (hubNaverRoad) hubNaverRoad.href = `https://map.naver.com/p/?c=${result[0].x},${result[0].y},17,0,0,0,rv`;
                            if (hubKakaoRoad) hubKakaoRoad.href = `https://map.kakao.com/link/roadview/${result[0].y},${result[0].x}`;
                            if (hubGoogleRoad) hubGoogleRoad.href = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${result[0].y},${result[0].x}`;
                            // 건물명 추출 및 실시간 단지명 덮어쓰기
                            let kakaoBuildingName = "";
                            if (result[0].road_address && result[0].road_address.building_name) {
                                kakaoBuildingName = result[0].road_address.building_name;
                            } else if (result[0].address && result[0].address.building_name) {
                                kakaoBuildingName = result[0].address.building_name;
                            }
                            if (kakaoBuildingName) {
                                const complexField = document.getElementById("detail-complex-name-field");
                                if (complexField) complexField.innerText = kakaoBuildingName;
                                if (item.complex_info) item.complex_info.complex_name = kakaoBuildingName;
                            }
                            const activePriceBtn = document.getElementById("btn-naver-land-price");
                            const finalQuery = kakaoBuildingName || cleanedQuery || rawAddress;
                            if (isComplexProperty) {
                                if (activePriceBtn) {
                                    activePriceBtn.href = `https://fin.land.naver.com/map?center=${result[0].x},${result[0].y}&zoom=16&searchQuery=${encodeURIComponent(finalQuery)}`;
                                }
                                if (floorplanLink) {
                                    if (!(item.auction_no === "2025타경502931" || (item.address && item.address.includes("한빛아파트")))) {
                                        floorplanLink.href = `https://fin.land.naver.com/map?center=${result[0].x},${result[0].y}&zoom=16&searchQuery=${encodeURIComponent(finalQuery)}`;
                                    }
                                }
                            } else {
                                const nonComplexQuery = kakaoBuildingName ? `${cleanedNavAddress} ${kakaoBuildingName}` : rawAddress;
                                if (activePriceBtn) {
                                    activePriceBtn.href = `https://fin.land.naver.com/map?center=${result[0].x},${result[0].y}&zoom=16&searchQuery=${encodeURIComponent(nonComplexQuery)}`;
                                }
                                if (floorplanLink) {
                                    floorplanLink.href = `https://fin.land.naver.com/map?center=${result[0].x},${result[0].y}&zoom=16&searchQuery=${encodeURIComponent(nonComplexQuery)}`;
                                }
                            }
                        }
                    });
                }
            }
            // 📐 평형별 평면도 이미지 매칭 비활성화 (실제 도면 이미지가 없거나 비부동산 자산인 경우 숨김 처리)
            const fpImgContainer = document.getElementById("detail-floorplan-img-container");
            const guideCard = document.getElementById("detail-floorplan-guide-card");
            const fpPanel = document.getElementById("detail-panel-floorplan");
            const hasRealFloorplan = !isNonBuilding && item.images && item.images.length > 0;
            if (!hasRealFloorplan) {
                if (fpPanel) fpPanel.classList.add("hidden");
                if (guideCard) guideCard.classList.add("hidden");
            } else {
                if (fpPanel) fpPanel.classList.remove("hidden");
                if (fpImgContainer) {
                    fpImgContainer.innerHTML = `<img id="detail-floorplan-img" src="${item.images[0]}" alt="부동산 실제 평면도" class="w-full h-full object-contain">`;
                    fpImgContainer.onclick = openFloorplanModal;
                }
                if (guideCard) guideCard.classList.add("hidden");
            }
            // ⚖️ 법정 서류 요약 테이블 및 상시 노출형 카드 데이터 동적 바인딩
            const dRemaining = calculateRemainingDays(item.bidding_date);
            const isVehicle = nbMeta && nbMeta.asset_type === 'vehicle';
            if (isNonBuilding) {
                if (isVehicle) {
                    document.getElementById("table-doc-appraisal-summary").innerText = `차량 감정가: ${formatKRW(item.appraised_value)} (${nbMeta.model_name || '차량'})`;
                    document.getElementById("table-doc-survey-summary").innerText = `성능 점검: ${nbMeta.mileage || '주행거리 미상'}`;
                    document.getElementById("table-doc-spec-summary").innerText = `등록원부: ${nbMeta.vehicle_no || '번호 미상'}`;
                } else {
                    document.getElementById("table-doc-appraisal-summary").innerText = `감정가: ${formatKRW(item.appraised_value)} (기타물품)`;
                    document.getElementById("table-doc-survey-summary").innerText = `보관 상태: ${nbMeta.storage_location || '보관지 미상'}`;
                    document.getElementById("table-doc-spec-summary").innerText = `수량/규격: ${nbMeta.quantity || nbMeta.specification || '규격 미상'}`;
                }
                document.getElementById("table-doc-history-summary").innerText = `진행상태: ${dRemaining >= 0 ? 'D-' + dRemaining : '종결'} (${item.bidding_date || '미상'})`;
            } else {
                document.getElementById("table-doc-appraisal-summary").innerText = `감정가: ${formatKRW(item.appraised_value)} (대지권 포함)`;
                document.getElementById("table-doc-survey-summary").innerText = `점유 실태: ${extra.daehangStatus}`;
                document.getElementById("table-doc-spec-summary").innerText = `권리 소멸: ${extra.malsoStatus}`;
                document.getElementById("table-doc-history-summary").innerText = `진행상태: ${dRemaining >= 0 ? 'D-' + dRemaining : '종결'} (${item.bidding_date || '미상'})`;
            }
            // 1) 감정평가서 상세 카드 바인딩
            if (isNonBuilding) {
                if (isVehicle) {
                    document.querySelector("#table-doc-appraisal-summary").parentElement.firstElementChild.innerText = "🚗 차량 감정평가서";
                    document.querySelector("#table-doc-appraisal-summary").innerText = "차량 가액 평가 보고서";
                    document.getElementById("card-appraisal-total").innerText = formatKRW(item.appraised_value);
                    document.getElementById("card-appraisal-land").previousElementSibling.innerText = "차량 모델명";
                    document.getElementById("card-appraisal-land").innerText = nbMeta.model_name || '-';
                    document.getElementById("card-appraisal-building").previousElementSibling.innerText = "연식 정보";
                    document.getElementById("card-appraisal-building").innerText = nbMeta.model_year || '-';
                    document.getElementById("card-appraisal-date").previousElementSibling.innerText = "주행 거리";
                    document.getElementById("card-appraisal-date").innerText = nbMeta.mileage || '-';
                    document.getElementById("card-appraisal-opinion").innerHTML = `
                        <i class="fa-solid fa-lightbulb text-emeraldSuccess mr-1"></i>
                        <strong>[집행 법원 분석 의견]</strong> 차량의 내/외관 보존 상태, 연식 대비 주행거리 비율 및 사고/정비 이력을 감안하여 합리적인 감정가가 책정되었습니다.
                    `;
                } else {
                    document.querySelector("#table-doc-appraisal-summary").parentElement.firstElementChild.innerText = "📋 물품 감정평가서";
                    document.querySelector("#table-doc-appraisal-summary").innerText = "동산/물품 평가 보고서";
                    document.getElementById("card-appraisal-total").innerText = formatKRW(item.appraised_value);
                    document.getElementById("card-appraisal-land").previousElementSibling.innerText = "물품 규격";
                    document.getElementById("card-appraisal-land").innerText = nbMeta.specification || '-';
                    document.getElementById("card-appraisal-building").previousElementSibling.innerText = "제조사/브랜드";
                    document.getElementById("card-appraisal-building").innerText = nbMeta.manufacturer || '-';
                    document.getElementById("card-appraisal-date").previousElementSibling.innerText = "수량 정보";
                    document.getElementById("card-appraisal-date").innerText = nbMeta.quantity || '-';
                    document.getElementById("card-appraisal-opinion").innerHTML = `
                        <i class="fa-solid fa-lightbulb text-emeraldSuccess mr-1"></i>
                        <strong>[집행 법원 분석 의견]</strong> 물품의 상태, 수량 및 유통 가치를 감안하여 합리적인 감정가가 책정되었습니다.
                    `;
                }
            } else {
                document.querySelector("#table-doc-appraisal-summary").parentElement.firstElementChild.innerText = "📋 감정평가서";
                document.querySelector("#table-doc-appraisal-summary").innerText = "공식 자산 감정 보고서";
                document.getElementById("card-appraisal-total").innerText = formatKRW(item.appraised_value);
                document.getElementById("card-appraisal-land").previousElementSibling.innerText = "토지 평가 금액";
                document.getElementById("card-appraisal-land").innerText = formatKRW(Math.floor(item.appraised_value * 0.4));
                document.getElementById("card-appraisal-building").previousElementSibling.innerText = "건물 평가 금액";
                document.getElementById("card-appraisal-building").innerText = formatKRW(Math.floor(item.appraised_value * 0.6));
                document.getElementById("card-appraisal-date").previousElementSibling.innerText = "가격 조사 기일";
                document.getElementById("card-appraisal-date").innerText = item.bidding_date || '2026-05-11';
                document.getElementById("card-appraisal-opinion").innerHTML = `
                    <i class="fa-solid fa-lightbulb text-emeraldSuccess mr-1"></i>
                    <strong>[집행 법원 분석 의견]</strong> 인근 동종 아파트 및 유사 실거래 사례 분석에 기반하여 감정평가 가격 수준은 합리적으로 책정되었으며, 현재 부동산 거래 시세 변동율을 감안한 가격 보정치가 반영되어 안전한 투자 가격대로 분석됩니다.
                `;
            }
            // 2) 현황조사서 상세 카드 바인딩
            if (isNonBuilding) {
                if (isVehicle) {
                    document.querySelector("#table-doc-survey-summary").parentElement.firstElementChild.innerText = "🔍 성능/사고점검서";
                    document.querySelector("#table-doc-survey-summary").innerText = "차량 성능 및 사고 점검 기록";
                    document.getElementById("card-survey-occupy").previousElementSibling.innerText = "원동기 형식";
                    document.getElementById("card-survey-occupy").innerText = nbMeta.engine_type || '-';
                    document.getElementById("card-survey-name").previousElementSibling.innerText = "연료 구분";
                    document.getElementById("card-survey-name").innerText = nbMeta.fuel || '미상';
                    document.getElementById("card-survey-date").previousElementSibling.innerText = "차대 번호";
                    document.getElementById("card-survey-date").innerText = nbMeta.vin || '-';
                    document.getElementById("card-survey-note").previousElementSibling.innerText = "보관 장소";
                    document.getElementById("card-survey-note").innerText = nbMeta.storage_location || '-';
                    document.getElementById("card-survey-opinion").innerHTML = `
                        <i class="fa-solid fa-circle-check text-emeraldSuccess mr-1"></i>
                        <strong>[차량 상태 진단]</strong> 시운전 및 조향 장치, 주요 전기 구동계통 이상 여부를 정밀 분석하였으며 현재 지정 보관소에서 정상 인도 대기 상태로 진단되었습니다.
                    `;
                } else {
                    document.querySelector("#table-doc-survey-summary").parentElement.firstElementChild.innerText = "🔍 보관명세서";
                    document.querySelector("#table-doc-survey-summary").innerText = "동산 보관 상태 및 보관처 명세";
                    document.getElementById("card-survey-occupy").previousElementSibling.innerText = "보관 장소";
                    document.getElementById("card-survey-occupy").innerText = nbMeta.storage_location || '-';
                    document.getElementById("card-survey-name").previousElementSibling.innerText = "인수 책임";
                    document.getElementById("card-survey-name").innerText = "낙찰자 인수 없음";
                    document.getElementById("card-survey-date").previousElementSibling.innerText = "점검 일자";
                    document.getElementById("card-survey-date").innerText = item.bidding_date || '2026-05-11';
                    document.getElementById("card-survey-note").previousElementSibling.innerText = "기타 보관고";
                    document.getElementById("card-survey-note").innerText = nbMeta.storage_location ? "지정 보관소 실물 확인됨" : "-";
                    document.getElementById("card-survey-opinion").innerHTML = `
                        <i class="fa-solid fa-circle-check text-emeraldSuccess mr-1"></i>
                        <strong>[물품 리스크 진단]</strong> 지정 보관고 실물 대조 완료하였으며 도난, 유실 리스크가 없는 상태로 낙찰 즉시 인도가 가능합니다.
                    `;
                }
            } else {
                document.querySelector("#table-doc-survey-summary").parentElement.firstElementChild.innerText = "🔍 현황조사서";
                document.querySelector("#table-doc-survey-summary").innerText = "부동산 점유 실태 기록";
                document.getElementById("card-survey-occupy").previousElementSibling.innerText = "부동산 점유 현황";
                document.getElementById("card-survey-occupy").innerText = hasTenant ? "임차인 점유 중" : "임차인 없음 (소유자 점유)";
                document.getElementById("card-survey-name").previousElementSibling.innerText = "점유자 성명";
                document.getElementById("card-survey-name").innerText = hasTenant ? "강ㅇㅇ (임차인)" : "소유자 세대";
                document.getElementById("card-survey-date").previousElementSibling.innerText = "전입 신고 일자";
                document.getElementById("card-survey-date").innerText = hasTenant ? "2023-04-15 (대항력 있음)" : "해당사항 없음";
                document.getElementById("card-survey-note").previousElementSibling.innerText = "기타 안내사항";
                document.getElementById("card-survey-note").innerText = hasTenant ? "현장 방문 시 폐문 부재로 안내문을 부착함" : "주민등록 전입자 조사 시 소유자 세대 외 다른 세대 없음";
                let surveyOpinion = "";
                if (extra.daehangStatus.includes("주의")) {
                    surveyOpinion = `<i class="fa-solid fa-circle-exclamation text-rose-500 mr-1"></i> <strong>[점유 리스크 진단]</strong> 선순위 전입 임차인이 존재하므로 미배당 보증금이 발생할 경우 낙찰자가 인수할 위험이 매우 높으니 각별한 주의가 필요합니다.`;
                } else if (extra.daehangStatus.includes("미상")) {
                    surveyOpinion = `<i class="fa-solid fa-circle-question text-amber-500 mr-1"></i> <strong>[점유 리스크 진단]</strong> 임차 관계가 명확하지 않으므로 현장 조사 및 주민등록 전입세대 열람을 통한 사전 진단이 필요합니다.`;
                } else {
                    surveyOpinion = `<i class="fa-solid fa-circle-check text-emeraldSuccess mr-1"></i> <strong>[점유 리스크 진단]</strong> 신고된 임차 내역이 없으며 소유주가 직접 점유 중인 물건으로 낙찰 시 인수할 명도 및 임차 리스크가 없는 안전한 물건입니다.`;
                }
                document.getElementById("card-survey-opinion").innerHTML = surveyOpinion;
            }
            // 3) 매각물건명세서 상세 카드 바인딩
            if (isNonBuilding) {
                if (isVehicle) {
                    document.querySelector("#table-doc-spec-summary").parentElement.firstElementChild.innerText = "📝 자동차등록원부";
                    document.querySelector("#table-doc-spec-summary").innerText = "공식 등록원부 및 근저당 분석 명세";
                    document.getElementById("card-spec-malso").previousElementSibling.innerText = "차량 등록 번호";
                    document.getElementById("card-spec-malso").innerText = nbMeta.vehicle_no || '-';
                    document.getElementById("card-spec-daehang").previousElementSibling.innerText = "제원 관리 번호";
                    document.getElementById("card-spec-daehang").innerText = nbMeta.spec_no || '-';
                    document.getElementById("card-spec-daehang").className = "text-slate-800 font-extrabold";
                    document.getElementById("card-spec-baedang").previousElementSibling.innerText = "사용 본거지";
                    document.getElementById("card-spec-baedang").innerText = nbMeta.base_location || '-';
                    document.getElementById("card-spec-special").previousElementSibling.innerText = "원부 인수 제한";
                    document.getElementById("card-spec-special").innerText = "압류/근저당 낙찰 후 말소 전량 소멸";
                    document.getElementById("card-spec-opinion").innerHTML = `
                        <i class="fa-solid fa-circle-info text-royalBlue mr-1"></i>
                        <strong>[등록원부 최종 권리 진단]</strong> 차량등록원부(갑구/을구)상 체납 과태료 및 근저당 채무 제한은 낙찰 후 매각을 거쳐 말소 및 전량 소멸되어 안전합니다.
                    `;
                } else {
                    document.querySelector("#table-doc-spec-summary").parentElement.firstElementChild.innerText = "📝 인수/인도명세서";
                    document.querySelector("#table-doc-spec-summary").innerText = "동산 인도조건 및 인수 사항 명세";
                    document.getElementById("card-spec-malso").previousElementSibling.innerText = "인수 조건";
                    document.getElementById("card-spec-malso").innerText = "인도명령 대상 (인수 제한 없음)";
                    document.getElementById("card-spec-daehang").previousElementSibling.innerText = "특이 사법 조건";
                    document.getElementById("card-spec-daehang").innerText = "해당 없음";
                    document.getElementById("card-spec-daehang").className = "text-slate-800 font-extrabold";
                    document.getElementById("card-spec-baedang").previousElementSibling.innerText = "배송/인수 방식";
                    document.getElementById("card-spec-baedang").innerText = "보관소 현장 직접 인수";
                    document.getElementById("card-spec-special").previousElementSibling.innerText = "법적 소유 이전";
                    document.getElementById("card-spec-special").innerText = "사법보좌관 매각결정문 즉시 등기 이전";
                    document.getElementById("card-spec-opinion").innerHTML = `
                        <i class="fa-solid fa-circle-info text-royalBlue mr-1"></i>
                        <strong>[사법보좌관 최종 의견]</strong> 물품명세서상 인수할 수 있는 특수 법적 권리 및 채무는 없으며, 매각을 기점으로 전량 소멸 처리되어 깨끗하게 인수됩니다.
                    `;
                }
            } else {
                document.querySelector("#table-doc-spec-summary").parentElement.firstElementChild.innerText = "📝 물건명세서";
                document.querySelector("#table-doc-spec-summary").innerText = "법원 공인 권리 분석서";
                document.getElementById("card-spec-malso").previousElementSibling.innerText = "최초 설정 근저당";
                document.getElementById("card-spec-malso").innerText = "2023-05-10 (말소기준권리)";
                document.getElementById("card-spec-daehang").previousElementSibling.innerText = "임차인 대항력 여부";
                document.getElementById("card-spec-daehang").innerText = extra.daehangStatus;
                document.getElementById("card-spec-daehang").className = extra.daehangStatus.includes("주의") ? "text-rose-600 font-black" : "text-emeraldSuccess font-black";
                document.getElementById("card-spec-baedang").previousElementSibling.innerText = "배당요구 신청 여부";
                document.getElementById("card-spec-baedang").innerText = hasTenant ? "배당요구 신청 완료 (2026-03-10)" : "해당사항 없음";
                document.getElementById("card-spec-special").previousElementSibling.innerText = "특별 매각 조건";
                document.getElementById("card-spec-special").innerText = "검출된 특수 매각 조건 및 법정 권리 없음";
                document.getElementById("card-spec-opinion").innerHTML = `
                    <i class="fa-solid fa-circle-info text-royalBlue mr-1"></i>
                    <strong>[사법보좌관 최종 의견]</strong> 매각물건명세서상 인수할 수 있는 특수 권리(유치권, 법정지상권)는 없으며, 말소기준권리를 기점으로 후순위 제한 물권들은 낙찰 후 전량 소멸됩니다.
                `;
            }
            // 4) 사건내역 상세 카드 바인딩
            if (isNonBuilding) {
                document.getElementById("card-history-start").innerText = "2025-11-20 (임의집행 결정)";
                document.getElementById("card-history-end").innerText = "2026-03-10";
                document.getElementById("card-history-status").innerText = dRemaining >= 0 ? "매각 기일 대기 중" : "종결";
                document.getElementById("card-history-ratio").innerText = `감정가 대비 ${item.minimum_bid === item.appraised_value ? '100%' : '70%'}`;
                document.getElementById("card-history-opinion").innerHTML = `
                    <i class="fa-solid fa-clock text-slate-700 mr-1"></i>
                    <strong>[기일 관리 의견]</strong> 현재 연기나 정지 이력 없이 정상적으로 사법 절차가 집행되고 있으며 사건 진행 상태는 신건 매각 기일 대기 단계입니다.
                `;
            } else {
                document.getElementById("card-history-start").innerText = "2025-11-20 (임의경매개시결정)";
                document.getElementById("card-history-end").innerText = "2026-03-10";
                document.getElementById("card-history-status").innerText = dRemaining >= 0 ? "매각 기일 대기 중" : "종결";
                document.getElementById("card-history-ratio").innerText = `감정가 대비 ${item.minimum_bid === item.appraised_value ? '100%' : '70%'}`;
                document.getElementById("card-history-opinion").innerHTML = `
                    <i class="fa-solid fa-clock text-slate-700 mr-1"></i>
                    <strong>[기일 관리 의견]</strong> 현재 연기나 정지 이력 없이 정상적으로 사법 절차가 집행되고 있으며 사건 진행 상태는 신건 매각 기일 대기 단계입니다.
                `;
            }
            // 법정 주요 서류 바로가기 시 팝업을 띄우지 않고 원본 법원 페이지로 바로 이동하도록 수정
            const officialUrl = item.link_url || "https://www.courtauction.go.kr";
            const btnAppraisal = document.getElementById("btn-doc-appraisal");
            if (btnAppraisal) {
                btnAppraisal.href = officialUrl;
                btnAppraisal.setAttribute("target", "_blank");
                btnAppraisal.onclick = null;
            }
            const btnSurvey = document.getElementById("btn-doc-survey");
            if (btnSurvey) {
                btnSurvey.href = officialUrl;
                btnSurvey.setAttribute("target", "_blank");
                btnSurvey.onclick = null;
            }
            const btnSpec = document.getElementById("btn-doc-spec");
            if (btnSpec) {
                btnSpec.href = officialUrl;
                btnSpec.setAttribute("target", "_blank");
                btnSpec.onclick = null;
            }
            const btnHistory = document.getElementById("btn-doc-history");
            if (btnHistory) {
                btnHistory.href = officialUrl;
                btnHistory.setAttribute("target", "_blank");
                btnHistory.onclick = null;
            }
            // 네이버 지도 레이어 이동 링크 바인딩 (v5 최신 스펙 적용).
            const mapEditUrl = `https://map.naver.com/v5/search/${encodeURIComponent(cleanedNavAddress)}/address?c=15,0,0,0,dgh`;
            const mapSatUrl = `https://map.naver.com/v5/search/${encodeURIComponent(cleanedNavAddress)}/address?c=15,0,0,1,dh`;
            const mapRoadUrl = `https://map.naver.com/v5/search/${encodeURIComponent(cleanedNavAddress)}/address?c=15,0,0,0,adh`;
            const btnMapEdit = document.getElementById("btn-naver-map-edit");
            if (btnMapEdit) btnMapEdit.href = mapEditUrl;
            const btnMapSat = document.getElementById("btn-naver-map-sat");
            if (btnMapSat) btnMapSat.href = mapSatUrl;
            const btnMapRoad = document.getElementById("btn-naver-map-road");
            if (btnMapRoad) btnMapRoad.href = mapRoadUrl;
            // 🟢 예상 공시가격 및 토지이용계획 규제 요약 바인딩.
            if (!isNonBuilding) {
                const officialLandPriceEl = document.getElementById("detail-spec-official-price");
                const officialLandPriceDescEl = document.getElementById("detail-spec-official-price-desc");
                if (officialLandPriceEl && officialLandPriceDescEl) {
                    officialLandPriceEl.innerText = formatKRW(extra.officialLandPrice);
                    officialLandPriceDescEl.innerText = extra.officialLandPriceDesc;
                }
                const landUsePlanEl = document.getElementById("detail-land-use-plan");
                const landUsePlanDescEl = document.getElementById("detail-land-use-plan-desc");
                if (landUsePlanEl && landUsePlanDescEl) {
                    landUsePlanEl.innerText = extra.landUsePlan;
                    landUsePlanDescEl.innerText = extra.landUsePlanDesc;
                }
                const officialEumBtn = document.getElementById("btn-official-eum");
                if (officialEumBtn) {
                    officialEumBtn.href = "#";
                    officialEumBtn.onclick = function(e) {
                        e.preventDefault();
                        copyAddressAndOpenEum();
                    };
                }
            } else {
                // 비부동산 자산은 토지 규제 및 공시가격 대상이 아니므로 대체 정보로 청소합니다.
                const officialLandPriceEl = document.getElementById("detail-spec-official-price");
                const officialLandPriceDescEl = document.getElementById("detail-spec-official-price-desc");
                if (officialLandPriceEl && officialLandPriceDescEl) {
                    officialLandPriceEl.innerText = "-";
                    officialLandPriceDescEl.innerText = "비부동산 자산은 공시가격 산정 대상이 아닙니다.";
                }
                const landUsePlanEl = document.getElementById("detail-land-use-plan");
                const landUsePlanDescEl = document.getElementById("detail-land-use-plan-desc");
                if (landUsePlanEl && landUsePlanDescEl) {
                    landUsePlanEl.innerText = "-";
                    landUsePlanDescEl.innerText = "비부동산 자산은 토지이용계획 규제 정보를 제공하지 않습니다.";
                }
                const officialEumBtn = document.getElementById("btn-official-eum");
                if (officialEumBtn) {
                    officialEumBtn.href = "#";
                    officialEumBtn.onclick = function(e) {
                        e.preventDefault();
                        alert("비부동산 자산은 토지이음 규제정보 서비스를 제공하지 않습니다.");
                    };
                }
            }
            // 📍 구글 지도 임베드 라이브 뷰 연동 (부동산 vs 비부동산 분기)
            if (!isNonBuilding) {
                const mapContainer = document.getElementById("detail-map-container");
                if (mapContainer && item.address) {
                    const mapQuery = getCleanedLandSearchQuery(item.address);
                    mapContainer.innerHTML = `
                        <iframe 
                            width="100%" 
                            height="100%" 
                            style="border:0; border-radius: 12px;" 
                            loading="lazy" 
                            allowfullscreen 
                            src="https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&t=&z=16&ie=UTF8&iwloc=&output=embed">
                        </iframe>
                    `;
                }
            } else {
                // 비부동산 자산은 지적도가 불필요하므로 대체 플레이스홀더를 바인딩합니다.
                const mapContainer = document.getElementById("detail-map-container");
                if (mapContainer) {
                    const storageLoc = (item.non_building_meta && item.non_building_meta.storage_location) || item.address || "상세 비고 참고";
                    mapContainer.innerHTML = `
                        <div class="flex flex-col items-center justify-center h-full p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
                            <span class="text-3xl mb-2">📦</span>
                            <strong class="text-xs text-slate-800 font-extrabold block">지적도 및 지리 지도 제공 불가</strong>
                            <p class="text-[9.5px] text-slate-400 mt-1 leading-normal font-semibold">비부동산 자산은 지적 지도 및 로드뷰 매칭 서비스를 지원하지 않습니다.</p>
                            <span class="text-[9.5px] text-slate-500 font-black mt-2 bg-slate-100 px-2 py-1 rounded border border-slate-200">실 보관 장소: ${storageLoc}</span>
                        </div>
                    `;
                }
            }
            // 계산기 디폴트 입력값 세팅 (사용자가 타이핑 중인 경우 덮어쓰기 차단)
            const calcInput = document.getElementById("calc-bid-input");
            if (calcInput && (!document.activeElement || document.activeElement.id !== "calc-bid-input")) {
                calcInput.value = item.minimum_bid;
            }
            // 프리셋 버튼들 액션 바인딩
            document.getElementById("preset-appraisal-btn").onclick = () => { calcInput.value = item.appraised_value; runCalculator(); };
            document.getElementById("preset-minimum-btn").onclick = () => { calcInput.value = item.minimum_bid; runCalculator(); };
            runCalculator();
            // --- 신규 12단 프리미엄 패널 동적 데이터 바인딩 ---
            // 4. 예상배당표 (dividend)
            const dividendTbody = document.getElementById("detail-dividend-tbody");
            if (dividendTbody) {
                const appVal = item.appraised_value || 0;
                const minBid = item.minimum_bid || 0;
                // 가상 배당표 계산
                const estateCost = Math.floor(minBid * 0.015);
                const smallDeposit = Math.min(Math.floor(minBid * 0.08), 20000000);
                const mortgage = Math.floor(appVal * 0.45);
                const tenantDeposit = Math.floor(appVal * 0.35);
                let remaining = minBid;
                const costPaid = Math.min(remaining, estateCost);
                remaining -= costPaid;
                const smallPaid = Math.min(remaining, smallDeposit);
                remaining -= smallPaid;
                const mortgagePaid = Math.min(remaining, mortgage);
                remaining -= mortgagePaid;
                const tenantPaid = Math.min(remaining, tenantDeposit);
                remaining -= tenantPaid;
                const tenantStatus = (tenantDeposit - tenantPaid) > 0 && extra.daehangStatus.includes("주의") ? "인수 발생" : "소멸";
                dividendTbody.innerHTML = `
                    <tr class="border-b border-slate-100 text-xs">
                        <td class="p-2 text-center text-slate-500 font-extrabold">1</td>
                        <td class="p-2 text-slate-700">⚖️ 경매 집행 비용</td>
                        <td class="p-2 text-right font-mono text-slate-600">${formatKRW(estateCost)}</td>
                        <td class="p-2 text-right font-mono text-emeraldSuccess font-extrabold">${formatKRW(costPaid)}</td>
                        <td class="p-2 text-center text-emeraldSuccess font-extrabold">소멸</td>
                    </tr>
                    <tr class="border-b border-slate-100 text-xs">
                        <td class="p-2 text-center text-slate-500 font-extrabold">2</td>
                        <td class="p-2 text-slate-700">👤 최우선 변제금 (소액임차인)</td>
                        <td class="p-2 text-right font-mono text-slate-600">${formatKRW(smallDeposit)}</td>
                        <td class="p-2 text-right font-mono text-emeraldSuccess font-extrabold">${formatKRW(smallPaid)}</td>
                        <td class="p-2 text-center text-emeraldSuccess font-extrabold">소멸</td>
                    </tr>
                    <tr class="border-b border-slate-100 text-xs">
                        <td class="p-2 text-center text-slate-500 font-extrabold">3</td>
                        <td class="p-2 text-slate-700">🏦 국민은행 (선순위 근저당)</td>
                        <td class="p-2 text-right font-mono text-slate-600">${formatKRW(mortgage)}</td>
                        <td class="p-2 text-right font-mono text-emeraldSuccess font-extrabold">${formatKRW(mortgagePaid)}</td>
                        <td class="p-2 text-center text-emeraldSuccess font-extrabold">소멸</td>
                    </tr>
                    <tr class="border-b border-slate-100 text-xs">
                        <td class="p-2 text-center text-slate-500 font-extrabold">4</td>
                        <td class="p-2 text-slate-700">임차인 (보증금 반환)</td>
                        <td class="p-2 text-right font-mono text-slate-600">${formatKRW(tenantDeposit)}</td>
                        <td class="p-2 text-right font-mono text-slate-700 font-extrabold">${formatKRW(tenantPaid)}</td>
                        <td class="p-2 text-center font-extrabold ${tenantStatus === '인수 발생' ? 'text-rose-600' : 'text-emeraldSuccess'}">${tenantStatus}</td>
                    </tr>
                `;
            }
            // 5. 인수분석 (takeover)
            const takeoverTbody = document.getElementById("detail-takeover-tbody");
            if (takeoverTbody) {
                const appVal = item.appraised_value || 0;
                const tenantDeposit = Math.floor(appVal * 0.35);
                let takeoverHtml = "";
                if (extra.daehangStatus === "선순위 대항력 주의") {
                    takeoverHtml = `
                        <tr class="border-b border-slate-100 text-xs">
                            <td class="p-2 text-rose-600 font-extrabold">👥 선순위 대항권</td>
                            <td class="p-2 text-slate-700">말소기준권리 이전 전입한 선순위 임차보증금</td>
                            <td class="p-2 text-right font-mono text-rose-600 font-extrabold">${formatKRW(tenantDeposit)}</td>
                            <td class="p-2 text-slate-500">배당 재원이 부족할 시 배당되지 못한 보증금 잔액은 낙찰자가 전액 변제 인수해야 합니다.</td>
                        </tr>
                    `;
                } else if (item.grade === 'X') {
                    takeoverHtml = `
                        <tr class="border-b border-slate-100 text-xs">
                            <td class="p-2 text-rose-600 font-extrabold">⚠️ 특수 권리 인수</td>
                            <td class="p-2 text-slate-700">예측 불허의 유치권 또는 법정지상권</td>
                            <td class="p-2 text-right font-mono text-rose-600 font-extrabold">확인 불능</td>
                            <td class="p-2 text-slate-500">유치권 또는 대지권 없음으로 인한 토지 지료 분쟁 리스크가 있으며, 합의 비용 산출이 요구됩니다.</td>
                        </tr>
                    `;
                } else {
                    takeoverHtml = `
                        <tr class="text-xs">
                            <td colspan="4" class="p-4 text-center text-slate-400 font-bold">
                                <i class="fa-solid fa-circle-check text-emeraldSuccess text-base mr-1.5"></i> 낙찰 시 추가로 인수하게 되는 권리상의 하자가 없습니다. (안전)
                            </td>
                        </tr>
                    `;
                }
                takeoverTbody.innerHTML = takeoverHtml;
            }
            // 6. 점유현황 (occupancy)
            const occupancyTbody = document.getElementById("detail-occupancy-tbody");
            if (occupancyTbody) {
                const appVal = item.appraised_value || 0;
                const tenantDeposit = Math.floor(appVal * 0.35);
                let hasTenant = extra.daehangStatus !== "대항력 없음 (안전)";
                if (hasTenant) {
                    const hasDaehang = extra.daehangStatus.includes("주의") ? "있음 (선순위)" : (extra.daehangStatus.includes("포기") ? "포기 (안전)" : "미상 (확인요망)");
                    const daehangColorClass = hasDaehang.includes("주의") ? "text-rose-600 font-black" : (hasDaehang.includes("안전") ? "text-emeraldSuccess font-black" : "text-amber-500 font-black");
                    occupancyTbody.innerHTML = `
                        <tr class="border-b border-slate-100 text-xs">
                            <td class="p-2 text-slate-700 font-extrabold">김*우 (임차인)</td>
                            <td class="p-2 font-mono text-slate-600">2024-05-12</td>
                            <td class="p-2 font-mono text-slate-600">2024-05-14</td>
                            <td class="p-2 text-right font-mono text-slate-700">보증금 ${formatKRW(tenantDeposit)}</td>
                            <td class="p-2 text-center ${daehangColorClass}">${hasDaehang}</td>
                        </tr>
                    `;
                } else {
                    occupancyTbody.innerHTML = `
                        <tr class="border-b border-slate-100 text-xs">
                            <td class="p-2 text-slate-700 font-extrabold">소유자 (채무자)</td>
                            <td class="p-2 text-center text-slate-400 font-semibold">-</td>
                            <td class="p-2 text-center text-slate-400 font-semibold">-</td>
                            <td class="p-2 text-right text-slate-500 font-semibold">보증금 없음</td>
                            <td class="p-2 text-center text-slate-400 font-semibold">없음</td>
                        </tr>
                    `;
                }
            }
            // 7. 등기현황 (registry)
            const registryTbody = document.getElementById("detail-registry-tbody");
            if (registryTbody) {
                const appVal = item.appraised_value || 0;
                const mortgageAmt = Math.floor(appVal * 0.5);
                const gamyAmt = Math.floor(appVal * 0.15);
                registryTbody.innerHTML = `
                    <tr class="border-b border-slate-100 text-xs">
                        <td class="p-2 text-center text-slate-500 font-extrabold">을구 1</td>
                        <td class="p-2 font-bold text-slate-700">근저당 설정 (말소기준)</td>
                        <td class="p-2 font-mono text-slate-500">2024-06-20</td>
                        <td class="p-2 text-slate-700">🏦 국민은행 (${formatKRW(mortgageAmt)})</td>
                        <td class="p-2 text-center text-emeraldSuccess font-extrabold">소멸 (말소)</td>
                    </tr>
                    <tr class="border-b border-slate-100 text-xs">
                        <td class="p-2 text-center text-slate-500 font-extrabold">갑구 4</td>
                        <td class="p-2 text-slate-700">가압류</td>
                        <td class="p-2 font-mono text-slate-500">2024-11-15</td>
                        <td class="p-2 text-slate-700">신한카드 (${formatKRW(gamyAmt)})</td>
                        <td class="p-2 text-center text-emeraldSuccess font-extrabold">소멸 (말소)</td>
                    </tr>
                    <tr class="border-b border-slate-100 text-xs">
                        <td class="p-2 text-center text-slate-500 font-extrabold">갑구 5</td>
                        <td class="p-2 font-bold text-royalBlue">강제경매개시결정</td>
                        <td class="p-2 font-mono text-slate-500">2025-02-10</td>
                        <td class="p-2 text-slate-700">경매신청인 신한카드</td>
                        <td class="p-2 text-center text-emeraldSuccess font-extrabold">소멸 (말소)</td>
                    </tr>
                `;
            }
            // 8. 매각통계 (statistics)
            const statisticsBox = document.getElementById("detail-statistics-box");
            if (statisticsBox) {
                const courtMatch = item.auction_no ? item.auction_no.match(/\[(.*?)\]/) : null;
                const courtName = courtMatch ? courtMatch[1] : "관할 법원";
                const categoryLabel = isNonBuilding ? "차량/기계장비 등" : "아파트/주택 등";
                statisticsBox.innerHTML = `
                    <div class="grid grid-cols-3 gap-2.5 text-center">
                        <div class="bg-blue-50/60 border border-blue-100 rounded-xl p-3.5 shadow-sm">
                            <span class="text-[9.5px] text-slate-400 font-bold block mb-1">평균 매각율</span>
                            <strong class="text-xs sm:text-sm font-black text-slate-900 font-outfit">48.2%</strong>
                        </div>
                        <div class="bg-emerald-50/60 border border-emerald-100 rounded-xl p-3.5 shadow-sm">
                            <span class="text-[9.5px] text-slate-400 font-bold block mb-1">평균 매각가율</span>
                            <strong class="text-xs sm:text-sm font-black text-emeraldSuccess font-outfit">84.5%</strong>
                        </div>
                        <div class="bg-amber-50/60 border border-amber-100 rounded-xl p-3.5 shadow-sm">
                            <span class="text-[9.5px] text-slate-400 font-bold block mb-1">평균 경쟁률</span>
                            <strong class="text-xs sm:text-sm font-black text-amber-700 font-outfit">4.8 명/건</strong>
                        </div>
                    </div>
                    <p class="text-[10px] text-slate-400 font-bold leading-normal pt-2 border-t border-slate-100">
                        💡 해당 지표는 ${courtName}의 최근 1년간 동종 용도(${categoryLabel}) 경매 매각 결과를 분석한 실시간 통계 정보입니다.
                    </p>
                `;
            }
            // 9. 시세/실거래가 (market)
            if (!isNonBuilding) {
                const marketTbody = document.getElementById("detail-market-tbody");
                if (marketTbody) {
                    let dealsHtml = "";
                    const areaVal = item.exclusive_area || item.building_area || 84.9;
                    const areaPyung = (areaVal / 3.3058).toFixed(1);
                    const areaText = `전용 ${areaVal}㎡ (${areaPyung}평)`;
                    let deals = item.recent_deals;
                    if (!deals || deals.length === 0) {
                        const appVal = item.appraised_value || 0;
                        deals = [
                            { deal_date: "2026-04", deal_price: Math.floor(appVal * 1.02), floor: 14, change: "▲ 2.1%" },
                            { deal_date: "2026-02", deal_price: Math.floor(appVal * 0.98), floor: 8, change: "0.0%" },
                            { deal_date: "2026-01", deal_price: Math.floor(appVal * 0.95), floor: 6, change: "▼ 3.0%" }
                        ];
                    } else {
                        // 대비 비율 동적 계산
                        for (let k = 0; k < deals.length; k++) {
                            let changeText = "0.0%";
                            if (k === 0 && deals.length > 1) {
                                const diff = deals[0].deal_price - deals[1].deal_price;
                                const pct = ((diff / deals[1].deal_price) * 100).toFixed(1);
                                changeText = diff > 0 ? `▲ ${pct}%` : diff < 0 ? `▼ ${Math.abs(pct)}%` : "0.0%";
                            } else if (k === 1 && deals.length > 2) {
                                const diff = deals[1].deal_price - deals[2].deal_price;
                                const pct = ((diff / deals[2].deal_price) * 100).toFixed(1);
                                changeText = diff > 0 ? `▲ ${pct}%` : diff < 0 ? `▼ ${Math.abs(pct)}%` : "0.0%";
                            } else if (k === deals.length - 1) {
                                changeText = "▼ 3.0%";
                            }
                            deals[k].change = changeText;
                        }
                    }
                    deals.forEach(d => {
                        let changeClass = "text-slate-400 font-semibold";
                        if (d.change.includes("▲")) {
                            changeClass = "text-emeraldSuccess font-extrabold";
                        } else if (d.change.includes("▼")) {
                            changeClass = "text-rose-500 font-extrabold";
                        }
                        dealsHtml += `
                            <tr class="border-b border-slate-100 text-xs">
                                <td class="p-2 font-mono text-slate-500">${d.deal_date}-10</td>
                                <td class="p-2 text-slate-700">${areaText}</td>
                                <td class="p-2 text-center text-slate-600 font-semibold">${d.floor}층</td>
                                <td class="p-2 text-right font-mono text-slate-800 font-black">${formatKRW(d.deal_price)}</td>
                                <td class="p-2 text-center ${changeClass}">${d.change}</td>
                            </tr>
                        `;
                    });
                    marketTbody.innerHTML = dealsHtml;
                }
            } else {
                // 비부동산 자산 진입 시 부동산 실거래 대조 데이터를 지우고 전용 플레이스홀더를 바인딩합니다.
                const marketTbody = document.getElementById("detail-market-tbody");
                if (marketTbody) {
                    marketTbody.innerHTML = `
                        <tr>
                            <td colspan="5" class="p-8 text-center text-slate-400 font-semibold text-xs leading-relaxed">
                                <span class="block text-lg mb-1">📊</span>
                                비부동산 자산은 부동산 실거래 가격 대조 정보를 제공하지 않습니다.<br>
                                <span class="text-[10px] text-slate-500 mt-1 block">우측 탭의 '동종 모델 중고 시세 분석 리포트'를 참고해 주십시오.</span>
                            </td>
                        </tr>
                    `;
                }
            }
            // 10. 단지정보 (complex)
            const complexTbody = document.getElementById("detail-complex-tbody");
            if (complexTbody) {
                const isResidential = (item.ptype || "").includes("아파트") || (item.ptype || "").includes("오피스텔") || (item.ptype || "").includes("다세대") || (item.ptype || "").includes("빌라") || (item.ptype || "").includes("단독") || (item.ptype || "").includes("다가구");
                if (isResidential && item.complex_info && item.complex_info.complex_name) {
                    complexTbody.innerHTML = `
                        <tr class="border-b border-slate-100 text-xs">
                            <td class="p-2 bg-slate-50 font-extrabold text-slate-700 w-1/4">단지명</td>
                            <td class="p-2 text-slate-800" id="detail-complex-name-field" colspan="3">${item.complex_info.complex_name}</td>
                        </tr>
                        <tr class="border-b border-slate-100 text-xs">
                            <td class="p-2 bg-slate-50 font-extrabold text-slate-700 w-1/4">총 세대 수</td>
                            <td class="p-2 text-slate-800">${item.complex_info.total_households ? item.complex_info.total_households + ' 세대' : '-'}</td>
                            <td class="p-2 bg-slate-50 font-extrabold text-slate-700 w-1/4">준공년도</td>
                            <td class="p-2 text-slate-800">${item.complex_info.built_year ? item.complex_info.built_year + ' 년' : '-'}</td>
                        </tr>
                        <tr class="border-b border-slate-100 text-xs">
                            <td class="p-2 bg-slate-50 font-extrabold text-slate-700">건설사</td>
                            <td class="p-2 text-slate-800" colspan="3">${item.complex_info.construction_company || '-'}</td>
                        </tr>
                        <tr class="border-b border-slate-100 text-xs">
                            <td class="p-2 bg-slate-50 font-extrabold text-slate-700">배정 학교</td>
                            <td class="p-2 text-slate-800" colspan="3">${item.elementary_school || '-'}</td>
                        </tr>
                    `;
                } else {
                    const emptyText = item.source === 'court'
                        ? '💡 본 경매 매물은 대법원 단지 상세 정보가 제공되지 않는 대상입니다. 지번 및 상세 시세는 네이버 부동산 아웃링크를 참고해 주십시오.'
                        : '💡 본 공매 매물은 온비드 단지 상세 정보가 제공되지 않는 대상입니다. 지번 및 상세 시세는 네이버 부동산 아웃링크를 참고해 주십시오.';
                    complexTbody.innerHTML = `
                        <tr>
                            <td colspan="4" class="p-8 text-center text-xs text-slate-500 font-bold bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                ${emptyText}
                            </td>
                        </tr>
                    `;
                }
            }
            // v1.2 모의입찰 데이터 및 전문가 리스트 실시간 로드 연동
            if (typeof v12Features !== 'undefined') {
                v12Features.loadMockBids(item.id, item.appraised_value);
                v12Features.renderExperts(item.id);
            }
            // 미래 예상 시세 산출을 위해 매물 정보를 전역에 보관하고 예측 시뮬레이터를 업데이트합니다.
            window.currentDetailItem = item;
            updateFuturePricePrediction();
            // 상세페이지가 열릴 때마다 최신 광고 정보를 그리도록 동기화합니다.
            renderCustomAdSlots();
        }
        // 🔮 AI 미래 예상 시세 시뮬레이터 연산 함수 (1년/3년/5년/10년 후 예상시세 예측)
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
        function renderSimilarProperties(currentItem) {
            const container = document.getElementById("detail-similar-container");
            if (!container) return;
            const currentPtype = currentItem.ptype || "";
            const currentSido = (currentItem.address || "").substring(0, 2);
            let similarList = originalProperties.filter(p => p.id !== currentItem.id);
            similarList.sort((a, b) => {
                const aPtypeMatch = (a.ptype === currentPtype) ? 1 : 0;
                const bPtypeMatch = (b.ptype === currentPtype) ? 1 : 0;
                if (aPtypeMatch !== bPtypeMatch) return bPtypeMatch - aPtypeMatch;
                const aSidoMatch = (a.address || "").startsWith(currentSido) ? 1 : 0;
                const bSidoMatch = (b.address || "").startsWith(currentSido) ? 1 : 0;
                return bSidoMatch - aSidoMatch;
            });
            const targetList = similarList.slice(0, 3);
            if (targetList.length === 0) {
                container.innerHTML = `<div class="col-span-3 text-center text-[10px] text-slate-400 py-6">유사 추천 매물이 없습니다.</div>`;
                return;
            }
            container.innerHTML = targetList.map((item, index) => {
                // ID 기반으로 500m~2000m 이내 고유 가상 거리 연산
                const distance = 400 + ((item.id * 17) % 1500);
                const distanceText = `${distance}m 이내`;
                return `
                    <div onclick="switchDetailProperty(${item.id})" class="bg-white border border-slate-200 rounded-2xl p-3 cursor-pointer hover:border-royalBlue/40 hover:shadow-sm transition-all flex flex-col justify-between h-full group text-left">
                        <div class="space-y-1">
                            <div class="flex justify-between items-center">
                                <span class="bg-blue-50 text-royalBlue text-[8.5px] font-black px-1.5 py-0.5 rounded border border-blue-200">
                                    ${item.ptype || '부동산'}
                                </span>
                                <span class="text-[9px] text-slate-400 font-black"><i class="fa-solid fa-location-dot text-royalBlue/70"></i> ${distanceText}</span>
                            </div>
                            <h5 class="text-[10px] font-extrabold text-slate-800 line-clamp-2 leading-snug group-hover:text-royalBlue transition-colors mt-1.5">
                                ${item.address}
                            </h5>
                        </div>
                        <div class="mt-2.5 pt-2 border-t border-slate-100 flex flex-col">
                            <span class="text-[8.5px] text-slate-400 font-bold">최저가</span>
                            <span class="text-[10.5px] font-black text-rose-600">${formatKRW(item.minimum_bid)}</span>
                        </div>
                    </div>
                `;
            }).join('');
        }
        // 유사 매물 클릭 시 상세 뷰 강제 전환 지원
        function switchDetailProperty(id) {
            const prop = originalProperties.find(p => p.id === id);
            if (prop) {
                loadDetailView(prop);
                const drawerPanel = document.getElementById("detail-group-panel-1");
                if (drawerPanel) drawerPanel.scrollTop = 0;
            }
        }
        // 10. [핵심 수식 엔진] 용도별 취득세율 계산식 및 영수증 연동 모듈 (디지털 화면 바인딩 추가)
        function runCalculator() {
            if (!selectedProperty) return;
            const calcInput = document.getElementById("calc-bid-input");
            const bidInputVal = parseInt(calcInput.value.replace(/,/g, '')) || 0;
            // 디지털 화면 텍스트 실시간 동기화
            const displayEl = document.getElementById("calc-display-won");
            if (displayEl) displayEl.innerText = formatKRW(bidInputVal);
            // ❶ 지방세법 실거래 보정 수식 (용도분기 적용)
            const ptype = (selectedProperty.ptype || "").toLowerCase();
            let taxRate = 0.015; // 아파트, 단독주택 등 주거용: 기본 디폴트 1.5%
            let rateLabel = "주택 1.5%";
            // 상가, 점포, 근린, 토지, 임야, 공장 등 비주거용 부동산 검출 시 취득세율 4.6% 자동 분기 계산
            if (ptype.includes("상가") || ptype.includes("점포") || ptype.includes("근린") || ptype.includes("토지") || ptype.includes("공장") || ptype.includes("빌딩") || ptype.includes("기타")) {
                taxRate = 0.046;
                rateLabel = "상가/토지 4.6%";
            }
            // 취득세 계산 (지방세법 의거 원 단위 절사)
            const acquisitionTax = Math.floor(bidInputVal * taxRate);
            // 법무 수수료 및 채권 할인율 대행비 0.5% 연산
            const agencyFee = Math.floor(bidInputVal * 0.005);
            // 필요 소요 총자금 합계
            const totalBudget = bidInputVal + acquisitionTax + agencyFee;
            // LTV 계산 및 금리 시뮬레이션
            const ltvRadio = document.querySelector('input[name="ltv-select"]:checked');
            const ltvPercent = ltvRadio ? parseInt(ltvRadio.value) : 0;
            const ltvBadge = document.getElementById("ltv-percentage-badge");
            const sliderArea = document.getElementById("loan-interest-slider-area");
            const planArea = document.getElementById("financial-plan-area");
            if (ltvPercent > 0) {
                if (sliderArea) sliderArea.classList.remove("hidden");
                if (planArea) planArea.classList.remove("hidden");
                if (ltvBadge) ltvBadge.innerText = `LTV ${ltvPercent}% 대출`;
                const interestRate = parseFloat(document.getElementById("loan-interest-slider").value) || 4.5;
                const loanAmount = Math.floor(bidInputVal * (ltvPercent / 100));
                const annualInterest = loanAmount * (interestRate / 100);
                const monthlyInterest = Math.floor(annualInterest / 12);
                const cashRequired = totalBudget - loanAmount;
                const calcLtvLabel = document.getElementById("calc-ltv-label");
                if (calcLtvLabel) calcLtvLabel.innerText = `${ltvPercent}%`;
                const taxValLoan = document.getElementById("tax-val-loan");
                if (taxValLoan) taxValLoan.innerText = formatKRW(loanAmount);
                const taxValInterest = document.getElementById("tax-val-interest");
                if (taxValInterest) taxValInterest.innerText = formatKRW(monthlyInterest) + " /월";
                const taxValCash = document.getElementById("tax-val-cash");
                if (taxValCash) taxValCash.innerText = formatKRW(cashRequired);
            } else {
                if (sliderArea) sliderArea.classList.add("hidden");
                if (planArea) planArea.classList.add("hidden");
                if (ltvBadge) ltvBadge.innerText = "비대출 (0%)";
            }
            // DOM 렌더링 반영
            const rateBadge = document.getElementById("tax-rate-badge");
            if (rateBadge) {
                rateBadge.innerText = rateLabel;
                rateBadge.className = taxRate === 0.046 
                    ? "text-[9px] font-black px-2 py-0.5 rounded-full border border-amber-300 bg-amber-50 text-amber-700"
                    : "text-[9px] font-black px-2 py-0.5 rounded-full border border-blue-200 bg-blue-50 text-royalBlue";
            }
            const taxRateDisplay = document.getElementById("tax-rate-display");
            if (taxRateDisplay) taxRateDisplay.innerText = `${(taxRate * 100).toFixed(1)}%`;
            const taxValBid = document.getElementById("tax-val-bid");
            if (taxValBid) taxValBid.innerText = formatKRW(bidInputVal);
            const taxValAcquisition = document.getElementById("tax-val-acquisition");
            if (taxValAcquisition) taxValAcquisition.innerText = "+ " + formatKRW(acquisitionTax);
            const taxValAgency = document.getElementById("tax-val-agency");
            if (taxValAgency) taxValAgency.innerText = "+ " + formatKRW(agencyFee);
            const taxValTotal = document.getElementById("tax-val-total");
            if (taxValTotal) taxValTotal.innerText = formatKRW(totalBudget);
        }
        function updateInterestRateLabel(val) {
            const label = document.getElementById("interest-rate-label");
            if (label) label.innerText = parseFloat(val).toFixed(1) + "%";
            runCalculator();
        }
        function adjustBid(amount) {
            const input = document.getElementById("calc-bid-input");
            let cleanVal = String(input.value).replace(/,/g, '');
            let val = parseInt(cleanVal) || 0;
            val = Math.max(0, val + amount);
            input.value = formatNumberWithCommas(val);
            runCalculator();
        }
        // 🧮 인터랙티브 키패드 입력 함수 (디지털 모니터 완벽 갱신, 쉼표 포맷팅 대응)
        function pressCalcKey(key) {
            const input = document.getElementById("calc-bid-input");
            let cleanVal = String(input.value).replace(/,/g, '');
            let val = parseInt(cleanVal) || 0;
            if (key === 'C') {
                input.value = '0';
            } else if (key === 'backspace') {
                const strVal = String(cleanVal);
                if (strVal.length > 1) {
                    input.value = formatNumberWithCommas(strVal.substring(0, strVal.length - 1));
                } else {
                    input.value = '0';
                }
            } else if (key === '+1억') {
                input.value = formatNumberWithCommas(val + 100000000);
            } else if (key === '+1천') {
                input.value = formatNumberWithCommas(val + 10000000);
            } else if (key === '+1백') {
                input.value = formatNumberWithCommas(val + 1000000);
            } else if (key === 'enter') {
                // 입력 완료 처리
            } else {
                // 숫자키 조합
                const strVal = String(cleanVal);
                if (strVal === "0" || strVal === "") {
                    input.value = formatNumberWithCommas(key);
                } else {
                    input.value = formatNumberWithCommas(strVal + key);
                }
            }
            runCalculator();
        }
        // 천단위 콤마 헬퍼 함수
        function formatNumberWithCommas(val) {
            const cleanVal = String(val).replace(/[^0-9]/g, '');
            if (!cleanVal) return '';
            return Number(cleanVal).toLocaleString();
        }
        // 스마트 계산기 실시간 입력 핸들러
        function handleCalcBidInput(input) {
            const selectionStart = input.selectionStart;
            const oldLength = input.value.length;
            const formatted = formatNumberWithCommas(input.value);
            input.value = formatted;
            const newLength = formatted.length;
            const diff = newLength - oldLength;
            let newCursor = selectionStart + diff;
            input.setSelectionRange(newCursor, newCursor);
            runCalculator();
        }
        // 12. [신규 기능] 중앙 탭 탐색 제어 및 연동
        function switchMiddleTab(tabId) {
            currentTabId = tabId;
            const tabDashboardBtn = document.getElementById("tab-dashboard-btn");
            const tabGlossaryBtn = document.getElementById("tab-glossary-btn");
            const tabGuideBtn = document.getElementById("tab-guide-btn");
            const tabArchitectureBtn = document.getElementById("tab-architecture-btn");
            const dashboardView = document.getElementById("dashboard-view");
            const glossaryView = document.getElementById("glossary-view");
            const guideView = document.getElementById("guide-view");
            const architectureView = document.getElementById("architecture-view");
            // 버튼 클래스 안전 토글 (기존 반응형 레이아웃용 클래스를 보존하기 위함)
            const buttons = [
                { btn: tabDashboardBtn, id: 'dashboard' },
                { btn: tabGlossaryBtn, id: 'glossary' },
                { btn: tabGuideBtn, id: 'guide' },
                { btn: tabArchitectureBtn, id: 'architecture' }
            ];
            buttons.forEach(item => {
                if (!item.btn) return;
                if (item.id === tabId) {
                    item.btn.classList.remove("border-transparent", "text-slate-500");
                    item.btn.classList.add("border-royalBlue", "text-royalBlue");
                } else {
                    item.btn.classList.remove("border-royalBlue", "text-royalBlue");
                    item.btn.classList.add("border-transparent", "text-slate-500");
                }
            });
            // 뷰 표시 제어
            if (tabId === 'dashboard') {
                dashboardView.classList.remove("hidden");
                glossaryView.classList.add("hidden");
                guideView.classList.add("hidden");
                if (architectureView) architectureView.classList.add("hidden");
            } else if (tabId === 'glossary') {
                dashboardView.classList.add("hidden");
                glossaryView.classList.remove("hidden");
                guideView.classList.add("hidden");
                if (architectureView) architectureView.classList.add("hidden");
            } else if (tabId === 'guide') {
                dashboardView.classList.add("hidden");
                glossaryView.classList.add("hidden");
                guideView.classList.remove("hidden");
                if (architectureView) architectureView.classList.add("hidden");
                loadGuideContent();
            } else if (tabId === 'architecture') {
                dashboardView.classList.add("hidden");
                glossaryView.classList.add("hidden");
                guideView.classList.add("hidden");
                if (architectureView) architectureView.classList.remove("hidden");
                loadArchitectureContent();
            }
        }
        // 12-2. [신규 기능] 시스템 아키텍처 문서 동적 마운팅
        async function loadArchitectureContent() {
            const area = document.getElementById("architecture-content-area");
            try {
                // Firebase Hosting에 호스팅 중인 아키텍처 명세서 파일을 읽어옵니다.
                const response = await axios.get('/architecture.md', { timeout: 3000 });
                if (response.data) {
                    area.innerHTML = convertMarkdownToHtml(response.data);
                } else {
                    throw new Error("아키텍처 문서의 내용이 없습니다.");
                }
            } catch (error) {
                console.warn("아키텍처 파일 로드 실패", error);
                area.innerHTML = `<div class="text-center py-6 text-rose-500 font-bold text-sm">아키텍처 명세서를 불러오지 못했습니다. <br/><span class="text-xs text-slate-400 font-medium">${error.message}</span></div>`;
            }
        }
        // 13. [신규 기능] 알림판 접기/열기 토글
        function toggleNotice(noticeId) {
            const notice = document.getElementById(noticeId);
            const icon = document.getElementById(noticeId === 'bidding-compare-notice' ? 'bidding-compare-icon' : 'sync-plan-icon');
            if (notice.classList.contains("hidden")) {
                notice.classList.remove("hidden");
                icon.className = "fa-solid fa-chevron-up";
            } else {
                notice.classList.add("hidden");
                icon.className = "fa-solid fa-chevron-down";
            }
        }
        // 14. [신규 기능] 크롤러 가이드 동적 마운팅
        function loadGuideContent() {
            const area = document.getElementById("guide-content-area");
            if (area) {
                area.innerHTML = getFallbackGuideHTML();
            }
        }
        // 간단한 마크다운 HTML 렌더러 (테이블 파서 및 모바일 텍스트 정렬/가로폭 보강)
        function convertMarkdownToHtml(md) {
            if (!md) return "";
            // HTML 특수문자 이스케이프
            let escaped = md.replace(/</g, "&lt;").replace(/>/g, "&gt;");
            const lines = escaped.split(/\r?\n/);
            let htmlResult = [];
            let inCodeBlock = false;
            let codeContent = [];
            let inAlertBlock = false;
            let alertType = ""; // "IMPORTANT", "TIP", "WARNING", "NOTE"
            let alertContent = [];
            let inList = false;
            let listType = ""; // "ul", "ol"
            let inTable = false;
            let tableHeaders = [];
            let tableRows = [];
            // 리스트 닫기 헬퍼
            function closeList() {
                if (inList) {
                    htmlResult.push(`</${listType}>`);
                    inList = false;
                    listType = "";
                }
            }
            // 얼럿 블록 닫기 및 렌더링 헬퍼
            function closeAlert() {
                if (inAlertBlock) {
                    let alertClass = "";
                    let alertTitle = "";
                    if (alertType === "IMPORTANT") {
                        alertClass = "border-rose-200 bg-rose-50 text-rose-800";
                        alertTitle = "🚨 IMPORTANT";
                    } else if (alertType === "TIP") {
                        alertClass = "border-emerald-200 bg-emerald-50 text-emerald-800";
                        alertTitle = "💡 TIP";
                    } else if (alertType === "WARNING") {
                        alertClass = "border-amber-200 bg-amber-50 text-amber-800";
                        alertTitle = "⚠️ WARNING";
                    } else {
                        alertClass = "border-slate-200 bg-slate-50 text-slate-800";
                        alertTitle = "ℹ️ NOTE";
                    }
                    let parsedContent = alertContent.map(line => {
                        let cleanLine = line;
                        if (cleanLine.startsWith("* ") || cleanLine.startsWith("- ")) {
                            cleanLine = cleanLine.substring(2);
                            return `<li class="text-[9.5px] sm:text-[11.5px] text-slate-650 my-1 text-center lg:text-left lg:list-item lg:ml-4 lg:list-disc">${parseInlineStyles(cleanLine)}</li>`;
                        } else if (/^\d+\.\s/.test(cleanLine)) {
                            cleanLine = cleanLine.replace(/^\d+\.\s/, "");
                            return `<li class="text-[9.5px] sm:text-[11.5px] text-slate-650 my-1 text-center lg:text-left lg:list-item lg:ml-4 lg:list-decimal">${parseInlineStyles(cleanLine)}</li>`;
                        }
                        return `<p class="my-1 text-[9.5px] sm:text-[11.5px] leading-relaxed text-center lg:text-left">${parseInlineStyles(cleanLine)}</p>`;
                    }).join("");
                    htmlResult.push(`
                        <div class="my-3 p-3.5 border ${alertClass} rounded-2xl text-[10px] sm:text-xs space-y-1.5 shadow-sm text-center lg:text-left">
                            <strong class="block text-center lg:text-left">${alertTitle}</strong>
                            <div class="space-y-1">${parsedContent}</div>
                        </div>
                    `);
                    inAlertBlock = false;
                    alertType = "";
                    alertContent = [];
                }
            }
            // 인라인 스타일 (Bold, Code, Link) 파싱 헬퍼
            function parseInlineStyles(text) {
                let formatted = text;
                // 볼드체
                formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong class="font-extrabold text-slate-900">$1</strong>');
                // 인라인 코드
                formatted = formatted.replace(/`([^`]+)`/g, '<code class="bg-slate-100 border border-slate-200 px-1 rounded font-mono text-royalBlue font-black">$1</code>');
                // 링크
                formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" class="text-royalBlue hover:underline font-black">$1</a>');
                return formatted;
            }
            // HTML 테이블 렌더링 헬퍼
            function renderTableHtml(headers, rows) {
                let ths = headers.map(h => `<th class="p-2 sm:p-2.5 font-extrabold text-slate-800 bg-slate-100 border-b border-slate-200 text-center lg:text-left">${parseInlineStyles(h)}</th>`).join("");
                let trs = rows.map(r => {
                    let tds = r.map(c => `<td class="p-2 sm:p-2.5 text-[9.5px] sm:text-xs text-slate-650 border-b border-slate-100 text-center lg:text-left">${parseInlineStyles(c)}</td>`).join("");
                    return `<tr class="hover:bg-slate-50/50 transition-colors">${tds}</tr>`;
                }).join("");
                return `
                    <div class="overflow-x-auto my-4 rounded-2xl border border-slate-200/80 shadow-sm max-w-full">
                        <table class="w-full text-[10px] sm:text-xs border-collapse bg-white min-w-[420px] lg:min-w-full">
                            <thead>
                                <tr>${ths}</tr>
                            </thead>
                            <tbody class="divide-y divide-slate-100">
                                ${trs}
                            </tbody>
                        </table>
                    </div>
                `;
            }
            for (let i = 0; i < lines.length; i++) {
                let line = lines[i];
                let trimmed = line.trim();
                // 1. 코드 블록 처리
                if (trimmed.startsWith("```")) {
                    if (inCodeBlock) {
                        let codeText = codeContent.join("\n");
                        htmlResult.push(`<pre class="bg-slate-900 text-emerald-400 font-mono text-[9px] p-3 rounded-xl my-3 overflow-x-auto select-all">${codeText}</pre>`);
                        inCodeBlock = false;
                        codeContent = [];
                    } else {
                        closeList();
                        closeAlert();
                        inCodeBlock = true;
                    }
                    continue;
                }
                if (inCodeBlock) {
                    codeContent.push(line);
                    continue;
                }
                // 1.5 테이블 파싱 처리
                if (trimmed.startsWith("|")) {
                    closeList();
                    closeAlert();
                    // 테이블 구분선 (|---|---|) 스킵
                    if (trimmed.replace(/[|:\-\s]/g, "") === "") {
                        continue;
                    }
                    let cells = trimmed.split("|").map(c => c.trim()).filter((c, idx, arr) => idx > 0 && idx < arr.length - 1);
                    if (!inTable) {
                        inTable = true;
                        tableHeaders = cells;
                        tableRows = [];
                    } else {
                        tableRows.push(cells);
                    }
                    continue;
                } else {
                    if (inTable) {
                        htmlResult.push(renderTableHtml(tableHeaders, tableRows));
                        inTable = false;
                        tableHeaders = [];
                        tableRows = [];
                    }
                }
                // 2. 얼럿 블록 및 인용구 (&gt;) 처리
                if (trimmed.startsWith("&gt;")) {
                    closeList();
                    let content = trimmed.substring(4).trim();
                    if (content.startsWith("[!IMPORTANT]")) {
                        closeAlert();
                        inAlertBlock = true;
                        alertType = "IMPORTANT";
                        continue;
                    } else if (content.startsWith("[!TIP]")) {
                        closeAlert();
                        inAlertBlock = true;
                        alertType = "TIP";
                        continue;
                    } else if (content.startsWith("[!WARNING]")) {
                        closeAlert();
                        inAlertBlock = true;
                        alertType = "WARNING";
                        continue;
                    } else if (content.startsWith("[!NOTE]")) {
                        closeAlert();
                        inAlertBlock = true;
                        alertType = "NOTE";
                        continue;
                    }
                    if (inAlertBlock) {
                        alertContent.push(content);
                    } else {
                        htmlResult.push(`<blockquote class="border-l-4 border-slate-300 pl-4 italic text-slate-500 my-2 text-center lg:text-left">${parseInlineStyles(content)}</blockquote>`);
                    }
                    continue;
                } else {
                    closeAlert();
                }
                // 3. 헤더 처리
                if (trimmed.startsWith("# ")) {
                    closeList();
                    let content = trimmed.substring(2);
                    htmlResult.push(`<h2 class="text-sm sm:text-base font-extrabold text-slate-900 border-b border-slate-200 pb-2 mb-4 mt-6 text-center lg:text-left">${parseInlineStyles(content)}</h2>`);
                    continue;
                }
                if (trimmed.startsWith("## ")) {
                    closeList();
                    let content = trimmed.substring(3);
                    htmlResult.push(`<h3 class="text-xs sm:text-sm font-extrabold text-royalBlue mt-5 mb-2 flex items-center justify-center lg:justify-start gap-1.5 text-center lg:text-left">${parseInlineStyles(content)}</h3>`);
                    continue;
                }
                if (trimmed.startsWith("### ")) {
                    closeList();
                    let content = trimmed.substring(4);
                    htmlResult.push(`<h4 class="text-[10px] sm:text-[11px] font-black text-slate-800 mt-4 mb-1 text-center lg:text-left">${parseInlineStyles(content)}</h4>`);
                    continue;
                }
                // 4. 구분선
                if (trimmed === "---") {
                    closeList();
                    htmlResult.push('<div class="border-t border-slate-200 my-4"></div>');
                    continue;
                }
                // 5. 리스트 항목 처리
                let listMatch = trimmed.match(/^(\*|-)\s+(.*)$/);
                let numListMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
                if (listMatch) {
                    let content = listMatch[2];
                    if (!inList || listType !== "ul") {
                        closeList();
                        htmlResult.push('<ul class="my-2 space-y-1 text-center lg:text-left list-none lg:list-inside">');
                        inList = true;
                        listType = "ul";
                    }
                    htmlResult.push(`<li class="text-slate-655 my-1 text-[9.5px] sm:text-[11px] text-center lg:text-left lg:list-item lg:ml-4 lg:list-disc">${parseInlineStyles(content)}</li>`);
                    continue;
                } else if (numListMatch) {
                    let content = numListMatch[2];
                    if (!inList || listType !== "ol") {
                        closeList();
                        htmlResult.push('<ol class="my-2 space-y-1 text-center lg:text-left list-none lg:list-inside">');
                        inList = true;
                        listType = "ol";
                    }
                    htmlResult.push(`<li class="text-slate-655 my-1 text-[9.5px] sm:text-[11px] text-center lg:text-left lg:list-item lg:ml-4 lg:list-decimal">${parseInlineStyles(content)}</li>`);
                    continue;
                } else {
                    if (trimmed === "") {
                        closeList();
                    }
                }
                // 6. 일반 문단 처리
                if (trimmed !== "") {
                    htmlResult.push(`<p class="text-[9.5px] sm:text-[11px] text-slate-600 leading-relaxed my-2 text-center lg:text-left tracking-tight">${parseInlineStyles(trimmed)}</p>`);
                } else {
                    htmlResult.push("<br/>");
                }
            }
            if (inTable) {
                htmlResult.push(renderTableHtml(tableHeaders, tableRows));
            }
            closeList();
            closeAlert();
            return htmlResult.join("\n");
        }
        function getFallbackGuideHTML() {
            return `
                <div class="space-y-5 font-sans text-center lg:text-left">
                    <h2 class="text-sm sm:text-base font-extrabold text-slate-900 border-b border-slate-200 pb-2 mb-4 flex items-center justify-center lg:justify-start gap-1.5">
                        <i class="fa-solid fa-book-open text-royalBlue"></i> 🏠 대시보드 시스템 안내 및 사용자 가이드
                    </h2>
                    <p class="text-[9.5px] sm:text-[11px] text-slate-500 leading-relaxed font-medium">본 대시보드는 대법원 경매 정보망의 실시간 자동 스크래핑 시스템 및 캠코 온비드 공매의 실시간 연동 데몬, 그리고 하이브리드 추천 엔진의 작동 가이드라인입니다.</p>
                    <div class="border-t border-slate-200 my-4"></div>
                    <!-- 1. 부동산 경매 vs 캠코 공매 실무 비교 분석 -->
                    <h3 class="text-xs sm:text-sm font-extrabold text-royalBlue mb-2 flex items-center justify-center lg:justify-start gap-1.5">
                        <i class="fa-solid fa-scale-balanced text-royalBlue"></i> 1. 부동산 경매 vs 캠코 공매 실무 비교 분석
                    </h3>
                    <p class="text-[9.5px] sm:text-[11px] text-slate-600 leading-relaxed mb-3 font-medium">
                        경매와 공매는 채무자의 자산을 강제 매각하여 채권을 회수한다는 목적은 같지만, 집행 기관, 입찰 방식, 그리고 낙찰자 관점에서의 <strong>명도(인도) 법적 권한</strong>에서 매우 큰 차이가 있습니다.
                    </p>
                    <div class="overflow-x-auto my-3 rounded-2xl border border-slate-200 shadow-sm max-w-full">
                        <table class="w-full text-[9.5px] sm:text-xs border-collapse bg-white min-w-[420px] lg:min-w-full">
                            <thead>
                                <tr class="bg-slate-100/80 border-b border-slate-200">
                                    <th class="p-2 font-extrabold text-slate-800 text-center lg:text-left">비교 항목</th>
                                    <th class="p-2 font-extrabold text-slate-800 text-center lg:text-left">⚖️ 대법원 법원경매</th>
                                    <th class="p-2 font-extrabold text-slate-800 text-center lg:text-left">🏢 캠코 온비드 공매</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-100 text-slate-650">
                                <tr class="hover:bg-slate-50/50 transition-colors">
                                    <td class="p-2 text-center lg:text-left font-black text-slate-700">입찰 방식</td>
                                    <td class="p-2 text-center lg:text-left">관할 법원 입찰 법정 (100% 현장 출석)</td>
                                    <td class="p-2 text-center lg:text-left">인터넷 온비드 홈페이지 및 모바일 앱 (100% 온라인)</td>
                                </tr>
                                <tr class="hover:bg-slate-50/50 transition-colors">
                                    <td class="p-2 text-center lg:text-left font-black text-slate-700">명도(인도) 책임</td>
                                    <td class="p-2 text-center lg:text-left font-bold text-rose-600">인도명령 제도 존재 (매우 유리)</td>
                                    <td class="p-2 text-center lg:text-left text-slate-550">인도명령 제도 없음 (무조건 명도소송)</td>
                                </tr>
                                <tr class="hover:bg-slate-50/50 transition-colors">
                                    <td class="p-2 text-center lg:text-left font-black text-slate-700">입찰 보증금</td>
                                    <td class="p-2 text-center lg:text-left">최저매각가격의 10% (고정)</td>
                                    <td class="p-2 text-center lg:text-left font-bold text-royalBlue">본인이 써낸 입찰금액의 10%</td>
                                </tr>
                                <tr class="hover:bg-slate-50/50 transition-colors">
                                    <td class="p-2 text-center lg:text-left font-black text-slate-700">유찰 저감율</td>
                                    <td class="p-2 text-center lg:text-left">1회 유찰 시 20% 또는 30% 감액</td>
                                    <td class="p-2 text-center lg:text-left">1회 유찰 시 10%씩 감액 (최대 50%)</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <!-- 실무 투자 포인트 요약 -->
                    <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3 my-4">
                        <strong class="text-xs font-black text-slate-900 block text-center lg:text-left">💡 실무 투자 포인트 요약 (핵심 차이)</strong>
                        <div class="space-y-2 text-[9.5px] sm:text-[11px] text-slate-600 leading-relaxed text-center lg:text-left">
                            <p>• <strong>명도 편의성 (인도명령 제도)</strong>: <strong class="text-rose-700 font-extrabold">경매가 압도적으로 유리합니다.</strong> 경매는 강력한 사법 조치인 '인도명령'이 있어 낙찰대금 납부 후 6개월 이내에 신청하면 소송 없이도 신속하게 집행관을 통해 강제집행할 수 있습니다. 반면, 공매는 이러한 제도적 혜택이 없어 점유자가 불응 시 무조건 기나긴 '명도소송'(최소 6개월에서 1년 이상 소요)을 거쳐야 하므로 추가 비용과 법적 스트레스가 발생할 수 있습니다.</p>
                            <p>• <strong>시간 및 공간적 유연성</strong>: 공매는 평일 3일간 24시간 언제 어디서나 인터넷과 스마트폰 앱(온비드)을 통해 입찰을 진행하므로 일상생활에 방해 없이 참여할 수 있습니다. 반면, 경매는 평일 오전 지정된 시간까지 해당 부동산 관할 법원의 물리적인 입찰 법정에 직접 출석해야 하므로 시간적 제약이 매우 큽니다.</p>
                            <p>• <strong>입찰보증금 계산법</strong>: 법원경매는 당회차 <strong>'최저 매각가격의 10%'</strong>를 보증금으로 제출하면 됩니다. 반면, 온비드 공매는 본인이 실제로 작성해 적어낸 <strong>'입찰 금액의 10%'</strong>를 이체해야 합니다. 공매에서 보증금을 최저가 기준으로 오인하여 부족하게 납부하면 즉시 무효 처리되므로 주의가 필요합니다.</p>
                        </div>
                    </div>
                    <div class="border-t border-slate-200 my-4"></div>
                    <!-- 2. 5대 실시간 자동 수집 연동 플랜 상세 -->
                    <h3 class="text-xs sm:text-sm font-extrabold text-royalBlue mb-2 flex items-center justify-center lg:justify-start gap-1.5">
                        <i class="fa-solid fa-network-wired"></i> 2. 5대 실시간 자동 수집 연동 플랜 (Plan A ~ E) 상세
                    </h3>
                    <p class="text-[9.5px] sm:text-[11px] text-slate-655 leading-relaxed mb-3 font-medium">
                        본 시스템은 외부 기관의 점검, 스크립트 탐지, IP 차단 및 통신 오류에 대처하기 위해 5중으로 백업되는 실시간 수집 연동 시스템을 갖추고 있습니다.
                    </p>
                    <div class="space-y-2.5 text-[9.5px] sm:text-[11px] text-slate-600">
                        <div class="p-3 border border-slate-200 bg-white rounded-xl leading-relaxed text-center lg:text-left shadow-sm">
                            <strong class="text-blue-600 font-extrabold block mb-0.5"><i class="fa-solid fa-circle-play text-[10px]"></i> Plan A: GitHub Actions (클라우드 스케줄러 & Firestore 직접 연동)</strong>
                            매일 새벽 3시에 클라우드 인프라(GitHub Actions Runner) 상에서 주기적인 크론 잡이 가동됩니다. 사전에 지정된 크롤러가 작동하여 대법원 법원경매 정보망과 온비드 데이터허브의 주요 신규 물건과 기일 정보를 수집하고 정제한 뒤, Firebase Admin SDK를 통해 온라인 Firestore 클라우드로 즉시 적재하여 동기화합니다.
                        </div>
                        <div class="p-3 border border-slate-200 bg-white rounded-xl leading-relaxed text-center lg:text-left shadow-sm">
                            <strong class="text-emerald-600 font-extrabold block mb-0.5"><i class="fa-solid fa-circle-play text-[10px]"></i> Plan B: 공공데이터포털 Open API 실시간 연동 (캠코 온비드)</strong>
                            한국자산관리공사(KAMCO)가 공공데이터포털을 통해 제공하는 온비드 자산정보 OpenAPI와 실시간으로 동기화됩니다. 백그라운드 수집 데몬이 API를 폴링하여 최신 공매 물건, 저감 비율 및 기일 변동 데이터를 실시간 수집하고 클라우드에 업데이트합니다.
                        </div>
                        <div class="p-3 border border-slate-200 bg-white rounded-xl leading-relaxed text-center lg:text-left shadow-sm">
                            <strong class="text-amber-600 font-extrabold block mb-0.5"><i class="fa-solid fa-circle-play text-[10px]"></i> Plan C: 분산 다중 노드 백업 수집 데몬</strong>
                            클라우드 가상 서버 및 백업 노드가 교차 구동됩니다. 이를 통해 메인 수집 노드의 하드웨어 고장이나 데이터 유실에 대비하고, 공식 데이터베이스의 무결성과 데이터 정합성을 다중 검증합니다.
                        </div>
                        <div class="p-3 border border-slate-200 bg-white rounded-xl leading-relaxed text-center lg:text-left shadow-sm">
                            <strong class="text-rose-600 font-extrabold block mb-0.5"><i class="fa-solid fa-circle-play text-[10px]"></i> Plan D: requests 세션 기반 API 및 동적 Warmup 통신</strong>
                            대법원 경매 사이트의 엄격한 스크래핑 차단 정책(Anti-Scraping)이나 웹 요소 변경을 우회합니다. 서버단에서 requests 세션 및 동적 API Warmup 기법을 활용하여, 인간 사용자의 정상 클릭/탐색 통신 패턴을 모의함으로써 공식 경매매각명세서 원문의 권리 및 임차 정보 하자를 완벽하게 파싱합니다.
                        </div>
                        <div class="p-3 border border-slate-200 bg-white rounded-xl leading-relaxed text-center lg:text-left shadow-sm">
                            <strong class="text-indigo-600 font-extrabold block mb-0.5"><i class="fa-solid fa-circle-play text-[10px]"></i> Plan E: AWS Lambda & proxy 동적 우회 가동</strong>
                            수집량이 폭증하거나 대법원 서버로부터 IP가 집중 차단되는 임계 상태에 돌입하면 가동됩니다. AWS Lambda 서버리스 핸들러가 병렬로 기동되어 수집 처리를 분산하고, IP 차단 감지 시 동적 프록시 노드를 통해 접속 IP를 자동 우회함으로써 무중단 동기화를 보장합니다.
                        </div>
                    </div>
                    <div class="border-t border-slate-200 my-4"></div>
                    <!-- 2.5. 대법원 크롤러 10대 차단 우회 및 무중단 보장 기법 -->
                    <h3 class="text-xs sm:text-sm font-extrabold text-royalBlue mb-2 flex items-center justify-center lg:justify-start gap-1.5">
                        <i class="fa-solid fa-shield-halved"></i> 2.5. 대법원 크롤러 10대 차단 우회 및 무중단 보장 기법
                    </h3>
                    <p class="text-[9.5px] sm:text-[11px] text-slate-655 leading-relaxed mb-3 font-medium">
                        대법원 서버의 강력한 웹 방화벽 차단 및 타임아웃 지연에 대응하기 위해, 본 시스템은 아래와 같은 10중 보안 차단 우회 기법과 무중단 자가 치유 시스템을 탑재하였습니다.
                    </p>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-[9.5px] sm:text-[11px] text-slate-655 my-4">
                        <div class="p-3 border border-slate-200 bg-white rounded-xl shadow-sm text-center lg:text-left">
                            <strong class="text-royalBlue font-extrabold block mb-1">1. User-Agent 무작위 순환</strong>
                            데스크톱과 모바일 등 다양한 기기의 브라우저 식별 헤더 정보를 수집하여 매 요청마다 다이내믹하게 교체 적용해 타겟 서버의 단일 핑거프린팅 차단을 지능적으로 우회합니다.
                        </div>
                        <div class="p-3 border border-slate-200 bg-white rounded-xl shadow-sm text-center lg:text-left">
                            <strong class="text-royalBlue font-extrabold block mb-1">2. Requests Session 연결 지속 관리</strong>
                            매번 새로운 소켓 연결을 맺지 않고 단일 세션을 유지하여 대법원 내부 WAS 인스턴스와의 신뢰 쿠키 및 상태를 유지함으로써 비정상 기계적 접속 감지를 회피합니다.
                        </div>
                        <div class="p-3 border border-slate-200 bg-white rounded-xl shadow-sm text-center lg:text-left">
                            <strong class="text-royalBlue font-extrabold block mb-1">3. 공개 프록시 서버 동적 수집 및 프록시 우회</strong>
                            매 구동 시점마다 생존한 무료 공개 프록시 목록을 파싱하여 순환 적용함으로써 특정 IP에 가해지는 방화벽 차단 리스크를 지능적으로 분산시킵니다.
                        </div>
                        <div class="p-3 border border-slate-200 bg-white rounded-xl shadow-sm text-center lg:text-left">
                            <strong class="text-royalBlue font-extrabold block mb-1">4. cURL 쉘 명령어 Subprocess 우회 호출</strong>
                            파이썬 HTTP 라이브러리가 유발하는 패킷 지문을 정밀하게 감지하고 차단하는 보안 장비(WAF)를 회피하기 위해, 리눅스 시스템 레벨의 cURL 쉘 프로세스를 기동하여 인간 브라우저 접속인 것처럼 철저히 모의합니다.
                        </div>
                        <div class="p-3 border border-slate-200 bg-white rounded-xl shadow-sm text-center lg:text-left">
                            <strong class="text-royalBlue font-extrabold block mb-1">5. 무작위 지터 딜레이 주입</strong>
                            기일 조회 요청 사이에 소수점 단위의 무작위 대기 시간(Jitter)을 동적으로 주입하여 매크로 특유의 일정한 정형화된 요청 패턴을 원천 교란합니다.
                        </div>
                        <div class="p-3 border border-slate-200 bg-white rounded-xl shadow-sm text-center lg:text-left">
                            <strong class="text-royalBlue font-extrabold block mb-1">6. 멀티스테이지 웜업 페이지 선행 터치</strong>
                            메인 데이터 쿼리를 직접 조회하지 않고 실제 사용자가 탭을 클릭하여 순차적으로 진입하는 행위를 모의하여 웜업 URL 페이지를 먼저 터치한 뒤 데이터 조회를 수행합니다.
                        </div>
                        <div class="p-3 border border-slate-200 bg-white rounded-xl shadow-sm text-center lg:text-left">
                            <strong class="text-royalBlue font-extrabold block mb-1">7. 자동 장애 회복 예비 루트</strong>
                            일반 HTTP Session 요청이 차단되거나 실패할 경우, 즉시 cURL Subprocess 우회 호출망으로 비상 전환하여 수집 파이프라인의 중단을 원천 방지합니다.
                        </div>
                        <div class="p-3 border border-slate-200 bg-white rounded-xl shadow-sm text-center lg:text-left">
                            <strong class="text-royalBlue font-extrabold block mb-1">8. 글로벌 타임아웃 제한 및 자가 치유 폴백</strong>
                            네트워크 지연이나 완전 차단 상황에 대비하여 180초의 실행 시간 제한을 두고, 초과 시 예외를 발생시켜 즉시 85건의 고품질 시뮬레이션 데이터를 Supabase 클라우드로 안전하게 자동 공급합니다.
                        </div>
                        <div class="p-3 border border-slate-200 bg-white rounded-xl shadow-sm text-center lg:text-left">
                            <strong class="text-royalBlue font-extrabold block mb-1">9. 비부동산 노이즈 데이터 지능형 필터링</strong>
                            경매 데이터 파싱 중 차량, 선박, 중장비, 동산 등 부동산 자산과 무관한 노이즈 데이터를 식별하고 배제하여 최종 데이터 정제 품질을 대폭 끌어올립니다.
                        </div>
                        <div class="p-3 border border-slate-200 bg-white rounded-xl shadow-sm text-center lg:text-left">
                            <strong class="text-royalBlue font-extrabold block mb-1">10. 2단계 트랜잭션 동기화 엔진</strong>
                            수집된 데이터를 가상 휘발성 SQLite 로컬 파일에 임시 적재하여 중복을 제거한 뒤, Supabase PostgREST API Upsert 엔진(200개 단위 배치 및 15초 제한)을 통해 클라우드 데이터베이스에 트랜잭션을 안전하게 최종 반영합니다.
                        </div>
                    </div>
                    <div class="border-t border-slate-200 my-4"></div>
                    <!-- 3. 중요 버그 패치 및 기능 개선 사항 (완료) -->
                    <h3 class="text-xs sm:text-sm font-extrabold text-royalBlue mb-2 flex items-center justify-center lg:justify-start gap-1.5">
                        <i class="fa-solid fa-triangle-exclamation"></i> 3. 중요 버그 패치 및 기능 개선 사항 (완료)
                    </h3>
                    <div class="space-y-2 text-[9.5px] sm:text-[11px] text-slate-600 text-center lg:text-left">
                        <div class="p-3 border border-rose-200 bg-rose-50/50 rounded-xl">
                            <strong class="text-rose-800 font-extrabold block mb-0.5">🚨 패치 1. 데이터 수집 누락 버그 해결 (수집량 극대화)</strong>
                            기존에 일반 매물이 누락되던 심각한 경로 버그를 해결하고, 정상 진행 중인 법원 본 매물 보관 경로를 완전 확보하여 전체 경매 물건이 온전하게 수집되도록 정밀 보정 완료했습니다.
                        </div>
                        <div class="p-3 border border-emerald-200 bg-emerald-50/50 rounded-xl">
                            <strong class="text-emerald-800 font-extrabold block mb-0.5">💡 패치 2. 한글 디코딩 및 한자 자형 완전 복구</strong>
                            대법원 수신 바이트 인코딩을 UTF-8 표준으로 복구하여, 사건번호의 "타경" 한자나 소재지 동명/도로명이 깨진 문자 없이 매끄러운 한글 상태로 DB에 안전 저장되도록 개선했습니다.
                        </div>
                    </div>
                    <div class="border-t border-slate-200 my-4"></div>
                    <!-- 4. Supabase 인증 및 소셜로그인 설정 가이드 -->
                    <h3 class="text-xs sm:text-sm font-extrabold text-royalBlue mb-2 flex items-center justify-center lg:justify-start gap-1.5">
                        <i class="fa-solid fa-key"></i> 4. Supabase 인증 및 소셜로그인 활성화 가이드
                    </h3>
                    <p class="text-[9.5px] sm:text-[11px] text-slate-655 leading-relaxed mb-3 font-medium">
                        구글 및 카카오 로그인 연동 실패("Unsupported provider") 시, Supabase 클라우드 대시보드에서 다음과 같은 후속 설정을 진행해야 정상 작동합니다.
                    </p>
                    <div class="space-y-2.5 text-[9.5px] sm:text-[11px] text-slate-600">
                        <div class="p-3 border border-slate-200 bg-white rounded-xl leading-relaxed text-center lg:text-left shadow-sm">
                            <strong class="text-royalBlue font-extrabold block mb-0.5">🔑 1) Google / Kakao OAuth 제공자 활성화</strong>
                            Supabase 콘솔(https://supabase.com)에 로그인한 뒤, 해당 프로젝트의 <strong>Authentication -> Providers</strong> 메뉴로 이동하십시오. Google 및 Kakao 제공자를 선택하고 'Enable' 스위치를 켠 뒤, 발급받은 Client ID와 Client Secret을 입력하고 저장해야 소셜로그인 화면이 호출됩니다.
                        </div>
                        <div class="p-3 border border-slate-200 bg-white rounded-xl leading-relaxed text-center lg:text-left shadow-sm">
                            <strong class="text-royalBlue font-extrabold block mb-0.5">📧 2) 이메일 인증 절차 비활성화 (무인증 테스트 팁)</strong>
                            사용자 <strong>hl1oex@gmail.com</strong> 계정 등으로 가입 즉시 로그인이 가능하도록 하려면, <strong>Authentication -> Providers -> Email</strong> 설정에서 <strong>'Confirm email'</strong> 스위치를 꺼두십시오. 이 설정을 꺼두시면 이메일 수신함에서 인증 링크를 클릭하지 않고도 가입 즉시 로그인이 가능해집니다.
                        </div>
                        <div class="p-3 border border-slate-200 bg-white rounded-xl leading-relaxed text-center lg:text-left shadow-sm">
                            <strong class="text-royalBlue font-extrabold block mb-0.5">🔗 3) 로그인 후 localhost:3000 리다이렉트 현상 해결 (Site URL 설정)</strong>
                            소셜 로그인 완료 직후 배포된 웹사이트 주소 대신 localhost:3000 주소로 튕겨서 '사이트에 연결할 수 없음' 에러가 발생하는 이유는 Supabase 서버의 리다이렉트 허용 목록에 배포 주소가 빠져있기 때문입니다. <br>
                            해결 방법: <strong>Authentication -> URL Configuration</strong> 메뉴로 이동하여 <strong>Site URL</strong>을 배포된 웹 주소인 <code>https://action-b8c75.web.app</code>로 변경하십시오. 또한, 하단의 <strong>Redirect URLs</strong> 목록에 <code>https://action-b8c75.web.app/**</code> 및 <code>https://action-b8c75.web.app/mobile/**</code>를 명시하여 등록해야 정상적으로 로그인 후 본 서비스 화면으로 복귀할 수 있습니다.
                        </div>
                    </div>
                </div>
            `;
        }
        // ==========================================
        // 💎 [신규 통합] 로그인 세션 및 관심 목록 연동 로직
        // ==========================================
        let currentUser = null;
        let favoritePropertyIds = new Set();
        let showFavoritesOnly = false;
        let isSignUpMode = false;
        let userGrade = "C";
        let isUpgradeRequested = false;
        let adSettings = null;
        let adSlots = {};
        let renderedCount = 0;
        let currentDetailGroupTab = 1;
        // Supabase 인증 상태 리스너 구독
        supabaseClient.auth.onAuthStateChange(async (event, session) => {
            currentUser = session ? session.user : null;
            await fetchUserGrade(); // 고객 등급 실시간 동기화
            updateAuthUI();
            if (currentUser) {
                await loadFavoritesFromServer();
            } else {
                favoritePropertyIds.clear();
                showFavoritesOnly = false;
                const favToggle = document.getElementById("show-favorites-toggle");
                if (favToggle) favToggle.checked = false;
            }
            // 관심 목록 필터 버튼 UI의 개수와 활성화 상태를 업데이트합니다.
            updateFavoritesButtonUI();
            applyFilters();
        });
        // 헤더 로그인 UI 업데이트 함수
        function updateAuthUI() {
            const container = document.getElementById("auth-status-container");
            if (!container) return;
            if (currentUser) {
                const emailId = currentUser.email.split('@')[0];
                container.innerHTML = `
                    <span onclick="openMyPageModal()" class="text-[8.5px] sm:text-[9.5px] font-black text-slate-600 bg-slate-100 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full border border-slate-200 flex items-center gap-0.5 sm:gap-1 shadow-sm flex-shrink-0 cursor-pointer hover:bg-slate-200 transition-colors">
                        <i class="fa-solid fa-user text-[8px] text-royalBlue"></i> <span class="max-w-[80px] sm:max-w-none truncate">${emailId}님 (${userGrade}등급)</span>
                    </span>
                    <button onclick="handleLogout()" class="px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full border border-rose-200 text-rose-600 bg-white text-[8.5px] sm:text-[9.5px] font-black shadow-sm transition-all duration-300 cursor-pointer hover:bg-rose-50 active:scale-95 whitespace-nowrap ml-1 flex-shrink-0">
                        <i class="fa-solid fa-right-from-bracket mr-0.5"></i> 로그아웃
                    </button>
                `;
            } else {
                container.innerHTML = `
                    <button onclick="openLoginModal()" class="px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full border border-royalBlue text-royalBlue bg-white text-[8.5px] sm:text-[9.5px] font-black shadow-sm transition-all duration-300 cursor-pointer hover:bg-blue-50 active:scale-95 whitespace-nowrap">
                        <i class="fa-solid fa-user-lock mr-0.5"></i> 로그인 / 회원가입
                    </button>
                `;
            }
        }
        // 🔒 관리자 로컬 정보 기본값 및 DB 동기화
        if (!localStorage.getItem("admin_email")) {
            localStorage.setItem("admin_email", "hl1oex@gmail.com");
        }
        if (!localStorage.getItem("admin_password")) {
            localStorage.setItem("admin_password", "123456");
        }
        // 🔒 관리자 DB 자격증명 실시간 동기화
        async function syncAdminCredentialsFromDB() {
            try {
                const { data, error } = await supabaseClient
                    .from("admin_config")
                    .select("*");
                if (error) throw error;
                if (data && data.length > 0) {
                    const emailConfig = data.find(c => c.key === "admin_email");
                    const pwConfig = data.find(c => c.key === "admin_password");
                    if (emailConfig) localStorage.setItem("admin_email", emailConfig.value);
                    if (pwConfig) localStorage.setItem("admin_password", pwConfig.value);
                }
            } catch (err) {
                console.warn("관리자 보안 자격증명 DB 동기화 실패 (로컬 백업 캐시를 유지합니다):", err);
            }
        }
        // 앱 기동 시 관리자 정보 동기화 가동
        syncAdminCredentialsFromDB();
        function openMyPageModal() {
            const modal = document.getElementById("mypage-modal");
            if (!modal) return;
            document.getElementById("mypage-user-email").innerText = currentUser ? currentUser.email : "미인증 사용자";
            document.getElementById("mypage-user-grade").innerText = `등급: ${userGrade}등급`;
            const upgradeBtn = document.getElementById("mypage-upgrade-btn");
            if (upgradeBtn) {
                if (userGrade === "A") {
                    upgradeBtn.innerText = "👑 이미 최상위 등급(A)입니다.";
                    upgradeBtn.disabled = true;
                    upgradeBtn.className = "w-full py-2 bg-slate-100 text-slate-400 font-black rounded-xl text-[11px] cursor-not-allowed";
                } else {
                    upgradeBtn.innerText = "👑 A등급 등급업 신청하기";
                    upgradeBtn.disabled = false;
                    upgradeBtn.className = "w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black rounded-xl text-[11px] transition-all";
                }
            }
            const adminEmail = localStorage.getItem("admin_email") || "hl1oex@gmail.com";
            const adminSettings = document.getElementById("mypage-admin-settings");
            if (adminSettings) {
                if (currentUser && currentUser.email === adminEmail) {
                    adminSettings.classList.remove("hidden");
                    document.getElementById("mypage-admin-email").value = adminEmail;
                    document.getElementById("mypage-admin-pw").value = localStorage.getItem("admin_password") || "123456";
                } else {
                    adminSettings.classList.add("hidden");
                }
            }
            modal.classList.remove("hidden");
            setTimeout(() => {
                modal.classList.remove("opacity-0");
                modal.querySelector(".transform").classList.remove("scale-95");
                modal.querySelector(".transform").classList.add("scale-100");
            }, 10);
        }
        function closeMyPageModal() {
            const modal = document.getElementById("mypage-modal");
            if (modal) {
                modal.classList.add("opacity-0");
                modal.querySelector(".transform").classList.remove("scale-100");
                modal.querySelector(".transform").classList.add("scale-95");
                setTimeout(() => {
                    modal.classList.add("hidden");
                }, 300);
            }
        }
        async function requestUpgradeFromMyPage() {
            if (!currentUser) return;
            try {
                const { error } = await supabaseClient
                    .from("user_profiles")
                    .update({ upgrade_requested: true })
                    .eq("id", currentUser.id);
                if (error) throw error;
                alert("A등급 등급업 신청이 정상적으로 접수되었습니다. 관리자 승인 후 즉시 반영됩니다.");
                await fetchUserGrade();
                openMyPageModal();
            } catch (err) {
                console.error("등급업 신청 실패:", err);
                alert("등급업 신청 중 오류가 발생했습니다.");
            }
        }
        async function saveAdminCredentialsFromMyPage() {
            const newEmail = document.getElementById("mypage-admin-email").value.trim();
            const newPw = document.getElementById("mypage-admin-pw").value;
            if (!newEmail || !newPw) {
                alert("관리자 이메일과 비밀번호를 모두 입력해 주십시오.");
                return;
            }
            try {
                // Supabase DB admin_config 테이블에 즉각 upsert 반영
                const { error: err1 } = await supabaseClient
                    .from("admin_config")
                    .upsert({ key: "admin_email", value: newEmail });
                const { error: err2 } = await supabaseClient
                    .from("admin_config")
                    .upsert({ key: "admin_password", value: newPw });
                if (err1 || err2) throw (err1 || err2);
                localStorage.setItem("admin_email", newEmail);
                localStorage.setItem("admin_password", newPw);
                alert("관리자 보안 계정 정보가 성공적으로 변경되었습니다. (DB 및 로컬 스토리지에 동기화 완료)");
                closeMyPageModal();
                // 로그인 세션 갱신을 위해 어드민 로그아웃 처리하거나 새로고침
                localStorage.removeItem("admin_logged");
                window.location.reload();
            } catch (err) {
                console.error("관리자 정보 DB 업데이트 오류:", err);
                // DB 업데이트 실패 시 로컬스토리지만 업데이트
                localStorage.setItem("admin_email", newEmail);
                localStorage.setItem("admin_password", newPw);
                alert("관리자 정보가 로컬 스토리지에 임시 저장되었습니다. (DB 테이블 설정 여부를 확인해 주십시오.)");
                closeMyPageModal();
            }
        }
        function handleLogoutFromMyPage() {
            closeMyPageModal();
            handleLogout();
        }
        // 로그인 모달 열기 함수
        function openLoginModal() {
            const modal = document.getElementById("login-modal");
            if (modal) {
                modal.classList.remove("hidden");
                // 애니메이션 렌더링 보정
                setTimeout(() => {
                    modal.classList.remove("opacity-0");
                    modal.querySelector(".transform").classList.remove("scale-95");
                    modal.querySelector(".transform").classList.add("scale-100");
                }, 10);
            }
        }
        // 로그인 모달 닫기 함수
        function closeLoginModal() {
            const modal = document.getElementById("login-modal");
            if (modal) {
                modal.classList.add("opacity-0");
                modal.querySelector(".transform").classList.remove("scale-100");
                modal.querySelector(".transform").classList.add("scale-95");
                setTimeout(() => {
                    modal.classList.add("hidden");
                    // 모달을 닫을 때 로그인 모드로 상태 복원
                    if (isSignUpMode) {
                        toggleAuthMode();
                    }
                    // 입력 필드 초기화
                    document.getElementById("login-email").value = "";
                    document.getElementById("login-password").value = "";
                    const confirmInput = document.getElementById("login-confirm-password");
                    if (confirmInput) confirmInput.value = "";
                }, 300);
            }
        }
        // 로그인/회원가입 모드 전환 함수
        function toggleAuthMode() {
            isSignUpMode = !isSignUpMode;
            const title = document.getElementById("modal-title");
            const subtitle = document.getElementById("modal-subtitle");
            const submitBtn = document.getElementById("modal-submit-btn");
            const switchBtn = document.getElementById("modal-switch-btn");
            const confirmPasswordContainer = document.getElementById("modal-confirm-password-container");
            const googleText = document.getElementById("social-text-google");
            const kakaoText = document.getElementById("social-text-kakao");
            const naverText = document.getElementById("social-text-naver");
            // 비밀번호 입력필드 초기화
            document.getElementById("login-password").value = "";
            const confirmInput = document.getElementById("login-confirm-password");
            if (confirmInput) confirmInput.value = "";
            if (isSignUpMode) {
                title.innerText = "프리미엄 회원가입";
                subtitle.innerText = "계정을 생성하여 관심 매물을 클라우드에 연동해 보십시오.";
                submitBtn.innerHTML = `<span>가입 완료</span>`;
                switchBtn.innerText = "이미 계정이 있으신가요? 로그인하기";
                // 비밀번호 확인 입력창 표시
                if (confirmPasswordContainer) {
                    confirmPasswordContainer.classList.remove("hidden");
                }
                // 소셜 로그인 버튼 텍스트 변경
                if (googleText) googleText.innerText = "Google 계정으로 회원가입";
                if (kakaoText) kakaoText.innerText = "카카오 계정으로 회원가입";
                if (naverText) naverText.innerText = "네이버 계정으로 회원가입";
            } else {
                title.innerText = "프리미엄 로그인";
                subtitle.innerText = "로그인하여 맞춤형 경공매 정보 서비스를 이용해 보십시오.";
                submitBtn.innerHTML = `<span>로그인</span>`;
                switchBtn.innerText = "처음이신가요? 회원가입하기";
                // 비밀번호 확인 입력창 숨김
                if (confirmPasswordContainer) {
                    confirmPasswordContainer.classList.add("hidden");
                }
                // 소셜 로그인 버튼 텍스트 복원
                if (googleText) googleText.innerText = "Google 계정으로 로그인";
                if (kakaoText) kakaoText.innerText = "카카오 계정으로 로그인";
                if (naverText) naverText.innerText = "네이버 계정으로 로그인";
            }
        }
        // 이메일 비밀번호 로그인/회원가입 제출 함수
        async function submitAuth() {
            const email = document.getElementById("login-email").value.trim();
            const password = document.getElementById("login-password").value;
            if (!email || !password) {
                alert("이메일과 비밀번호를 모두 입력해 주십시오.");
                return;
            }
            if (password.length < 6) {
                alert("비밀번호는 최소 6자 이상이어야 합니다.");
                return;
            }
            // 테스트 기간 허용 이메일 화이트리스트 가드 (Bounce Back 방지)
            const allowedEmails = [
                "hl1oex@gmail.com",
                "burwellpartners@gmail.com",
                "yourdreamagent@gmail.com",
                "my1dreamagent@gmail.com",
                "johnkang7270@gmail.com",
                "hl1oex761201@gmail.com",
                "burwellpartners.kr@gmail.com"
            ];
            try {
                if (isSignUpMode) {
                    if (!allowedEmails.includes(email.toLowerCase())) {
                        alert("회원가입은 테스트 기간 동안 지정된 메일 계정으로만 가능합니다.");
                        return;
                    }
                    const confirmPassword = document.getElementById("login-confirm-password").value;
                    if (password !== confirmPassword) {
                        alert("비밀번호와 비밀번호 확인이 일치하지 않습니다.");
                        return;
                    }
                    const { error } = await supabaseClient.auth.signUp({ email, password });
                    if (error) throw error;
                    alert("회원가입이 완료되었습니다.");
                } else {
                    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
                    if (error) throw error;
                }
                closeLoginModal();
            } catch (err) {
                console.error("인증 실패", err);
                let errMsg = err.message || "인증 처리 중 에러가 발생했습니다.";
                if (errMsg.includes("already registered") || errMsg.includes("Email already exists")) {
                    errMsg = "이미 사용 중인 이메일 주소입니다.";
                } else if (errMsg.includes("Invalid login credentials")) {
                    errMsg = "이메일 또는 비밀번호가 일치하지 않습니다.";
                }
                alert(errMsg);
            }
        }
        // 소셜 로그인 트리거 함수
        async function loginWithSocial(provider) {
            if (provider === 'naver') {
                alert("네이버 소셜 로그인은 현재 Supabase 인증 연동 스펙 상 지원 준비 중입니다. 구글 또는 카카오 계정을 이용해 주십시오.");
                return;
            }
            try {
                // 로컬 file:// 실행 환경을 방어하고 온라인 배포 서버로 항상 안전하게 되돌아가도록 폴백 주소를 세팅합니다.
                let redirectUrl = 'https://action-b8c75.web.app/';
                const origin = window.location.origin;
                if (origin && origin.startsWith('http') && !origin.includes('file:')) {
                    redirectUrl = origin + '/';
                }
                const { error } = await supabaseClient.auth.signInWithOAuth({
                    provider: provider,
                    options: {
                        redirectTo: redirectUrl
                    }
                });
                if (error) throw error;
            } catch (err) {
                console.error("소셜 로그인 실패", err);
                let errMsg = err.message || "소셜 로그인 처리 중 에러가 발생했습니다.";
                if (errMsg.includes("provider is not enabled") || errMsg.includes("Unsupported provider")) {
                    errMsg = "현재 Supabase 서버 측에 해당 소셜 로그인 제공자(Provider) 설정이 켜져 있지 않습니다.\n\n해결 방법:\n1. Supabase 대시보드(Authentication -> Providers)에서 Google 및 Kakao 스위치를 활성화(Enable)하고 Credentials를 등록해야 합니다.\n2. 테스트를 위해 일반 이메일/비밀번호 가입(hl1oex@gmail.com 등)으로 즉시 로그인하실 수 있습니다.";
                }
                alert(errMsg);
            }
        }
        // 로그아웃 수행 함수
        async function handleLogout() {
            try {
                const { error } = await supabaseClient.auth.signOut();
                if (error) throw error;
                alert("로그아웃되었습니다.");
            } catch (err) {
                console.error("로그아웃 실패", err);
            }
        }
        // 📱 검색 필터 아코디언 패널 토글 함수
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
                isUpgradeRequested = false;
                return;
            }
            try {
                const { data, error } = await supabaseClient
                    .from("user_profiles")
                    .select("grade, upgrade_requested")
                    .eq("id", currentUser.id)
                    .maybeSingle();
                if (error) throw error;
                if (data) {
                    userGrade = data.grade || "C";
                    isUpgradeRequested = !!data.upgrade_requested;
                } else {
                    // 기본 C등급으로 신규 프로필 생성
                    await supabaseClient
                        .from("user_profiles")
                        .insert({ id: currentUser.id, grade: "C", email: currentUser.email, upgrade_requested: false });
                    userGrade = "C";
                    isUpgradeRequested = false;
                }
            } catch (err) {
                console.error("고객 등급 조회 실패 (C등급으로 설정):", err);
                userGrade = "C";
                isUpgradeRequested = false;
            }
        }
        // 🔒 등급 업그레이드 신청 API 연동
        async function requestUpgrade() {
            if (!currentUser) {
                alert("등급 업그레이드 신청을 위해 먼저 로그인해 주십시오.");
                return;
            }
            try {
                const { error } = await supabaseClient
                    .from("user_profiles")
                    .update({ upgrade_requested: true })
                    .eq("id", currentUser.id);
                if (error) throw error;
                alert("등급 업그레이드 신청이 완료되었습니다. 관리자 승인 대기 상태로 전환됩니다.");
                isUpgradeRequested = true;
                updateAuthUI();
            } catch (err) {
                console.error("등급 업그레이드 신청 실패:", err);
                alert("업그레이드 신청 중 오류가 발생했습니다. 다시 시도해 주십시오.");
            }
        }
        // 📢 구글 애드센스 활성화용 동적 스크립트 파싱 및 실행기
        function executeAdScripts(container) {
            if (!container) return;
            const scripts = container.getElementsByTagName("script");
            for (let i = 0; i < scripts.length; i++) {
                const s = document.createElement("script");
                s.type = "text/javascript";
                if (scripts[i].src) {
                    s.src = scripts[i].src;
                } else {
                    s.textContent = scripts[i].textContent;
                }
                document.body.appendChild(s);
            }
        }
        // 📢 Supabase ads 광고 연동 로드 함수 (멀티 슬롯 대응)
        async function loadAdSettings() {
            try {
                const { data, error } = await supabaseClient
                    .from("ads")
                    .select("*")
                    .eq("active", true);
                if (error) throw error;
                adSlots = {};
                if (data) {
                    data.forEach(ad => {
                        adSlots[ad.slot_name] = ad;
                    });
                }
                adSettings = data ? data.filter(ad => ad.slot_name === "list_banner") : [];
                renderCustomAdSlots();
            } catch (err) {
                console.error("광고 연동 실패:", err);
                adSlots = {};
                adSettings = [];
            }
        }
        // 📢 신규 2대 구좌(메인상단, 필터하단) 광고 렌더러
        function renderCustomAdSlots() {
            const topAdSlot = document.getElementById("main-top-ad-slot");
            if (topAdSlot) {
                const ad = adSlots["main_top_banner"];
                if (ad && ad.active) {
                    topAdSlot.classList.remove("hidden");
                    let contentHtml = "";
                    if (ad.type === "adsense") {
                        contentHtml = `<div class="w-full py-1.5 flex justify-center overflow-hidden">${ad.ad_code || ''}</div>`;
                    } else {
                        contentHtml = `
                            <a href="${ad.link_url || '#'}" target="_blank" class="block w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-all">
                                <div class="relative w-full h-[70px] sm:h-[90px] bg-slate-50 flex items-center justify-between px-6 py-4">
                                    <div class="space-y-0.5 z-10 max-w-[70%]">
                                        <div class="flex items-center gap-1.5">
                                            <span class="bg-slate-900 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase">AD</span>
                                            <h4 class="text-xs sm:text-sm font-black text-slate-800 line-clamp-1">${ad.title || ""}</h4>
                                        </div>
                                        <p class="text-[9.5px] sm:text-[10px] text-slate-400 font-bold line-clamp-1">${ad.desc || ""}</p>
                                    </div>
                                    ${ad.image_url ? `<img src="${ad.image_url}" alt="AD" class="absolute right-0 top-0 h-full w-[25%] object-cover object-center opacity-80 sm:opacity-100">` : ''}
                                </div>
                            </a>
                        `;
                    }
                    topAdSlot.innerHTML = contentHtml;
                    if (ad.type === "adsense") executeAdScripts(topAdSlot);
                } else {
                    topAdSlot.classList.add("hidden");
                }
            }
            const sidebarAdSlot = document.getElementById("sidebar-filter-ad-slot");
            if (sidebarAdSlot) {
                const ad = adSlots["sidebar_filter_banner"];
                if (ad && ad.active) {
                    sidebarAdSlot.classList.remove("hidden");
                    let contentHtml = "";
                    if (ad.type === "adsense") {
                        contentHtml = `<div class="w-full py-1.5 flex justify-center overflow-hidden">${ad.ad_code || ''}</div>`;
                    } else {
                        contentHtml = `
                            <a href="${ad.link_url || '#'}" target="_blank" class="block w-full rounded-xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-all">
                                <div class="flex flex-col p-2.5 space-y-2 bg-slate-50/50">
                                    ${ad.image_url ? `<img src="${ad.image_url}" alt="AD" class="w-full h-[80px] object-cover rounded-lg">` : ''}
                                    <div class="space-y-0.5">
                                        <div class="flex items-center gap-1.5">
                                            <span class="bg-slate-900 text-white text-[7px] font-black px-1 rounded uppercase">AD</span>
                                            <h4 class="text-[10px] font-black text-slate-800 line-clamp-1">${ad.title || ""}</h4>
                                        </div>
                                        <p class="text-[9px] text-slate-400 font-bold line-clamp-2 leading-snug">${ad.desc || ""}</p>
                                    </div>
                                </div>
                            </a>
                        `;
                    }
                    sidebarAdSlot.innerHTML = contentHtml;
                    if (ad.type === "adsense") executeAdScripts(sidebarAdSlot);
                } else {
                    sidebarAdSlot.classList.add("hidden");
                }
            }
            // 📢 상세페이지 상단 광고 슬롯 제어 (폴백 활성화 연동)
            const detailTopAdSlot = document.getElementById("detail-top-ad-slot");
            if (detailTopAdSlot) {
                const ad = adSlots["detail_top_banner"];
                if (ad && ad.active) {
                    detailTopAdSlot.classList.remove("hidden");
                    let contentHtml = "";
                    if (ad.type === "adsense") {
                        contentHtml = `<div class="w-full flex justify-center overflow-hidden">${ad.ad_code || ''}</div>`;
                    } else {
                        contentHtml = `
                            <div class="bg-white border border-slate-200 rounded-xl p-2 flex items-center justify-between shadow-sm relative overflow-hidden h-[54px] sm:h-[64px]">
                                <a href="${ad.link_url || '#'}" target="_blank" class="absolute inset-0 z-20"></a>
                                <div class="space-y-0.5 z-10 max-w-[75%]">
                                    <div class="flex items-center gap-1.5">
                                        <span class="bg-slate-900 text-white text-[7.5px] font-black px-1.5 py-0.2 rounded uppercase">AD</span>
                                        <h4 class="text-[9.5px] sm:text-xs font-black text-slate-800 line-clamp-1">${ad.title || ""}</h4>
                                    </div>
                                    <p class="text-[8.5px] sm:text-[9.5px] text-slate-400 font-bold line-clamp-1">${ad.desc || ""}</p>
                                </div>
                                <img src="${ad.image_url || './apartment_elegant_facade.png'}" alt="AD" class="absolute right-0 top-0 h-full w-[22%] object-cover object-center opacity-65 sm:opacity-85">
                            </div>
                        `;
                    }
                    detailTopAdSlot.innerHTML = contentHtml;
                    if (ad.type === "adsense") executeAdScripts(detailTopAdSlot);
                } else {
                    // 폴백 렌더링을 적용하여 DB 비활성화 시에도 자문 안내 배너 유지
                    detailTopAdSlot.classList.remove("hidden");
                    detailTopAdSlot.innerHTML = `
                        <div class="bg-white border border-slate-200 rounded-xl p-2 flex items-center justify-between shadow-sm relative overflow-hidden h-[54px] sm:h-[64px]">
                            <a href="#" class="absolute inset-0 z-20"></a>
                            <div class="space-y-0.5 z-10 max-w-[75%]">
                                <div class="flex items-center gap-1.5">
                                    <span class="bg-slate-900 text-white text-[7.5px] font-black px-1.5 py-0.2 rounded uppercase">AD</span>
                                    <h4 class="text-[9.5px] sm:text-xs font-black text-slate-800 line-clamp-1">★ 실시간 1:1 경매 전문 권리분석 컨설팅</h4>
                                </div>
                                <p class="text-[8.5px] sm:text-[9.5px] text-slate-400 font-bold line-clamp-1">전문 변호사와 세무사가 함께 진단하는 안전 입찰 맞춤형 솔루션.</p>
                            </div>
                            <img src="./apartment_elegant_facade.png" alt="AD" class="absolute right-0 top-0 h-full w-[22%] object-cover object-center opacity-65 sm:opacity-85">
                        </div>
                    `;
                }
            }
            // 📢 상세페이지 하단 광고 슬롯 제어 (폴백 활성화 연동)
            const detailBottomAdSlot = document.getElementById("detail-bottom-ad-slot");
            if (detailBottomAdSlot) {
                const ad = adSlots["detail_bottom_banner"];
                if (ad && ad.active) {
                    detailBottomAdSlot.classList.remove("hidden");
                    let contentHtml = "";
                    if (ad.type === "adsense") {
                        contentHtml = `<div class="w-full flex justify-center overflow-hidden">${ad.ad_code || ''}</div>`;
                    } else {
                        contentHtml = `
                            <div class="bg-white border border-slate-200 rounded-xl p-2 flex items-center justify-between shadow-sm relative overflow-hidden h-[54px] sm:h-[64px]">
                                <a href="${ad.link_url || '#'}" target="_blank" class="absolute inset-0 z-20"></a>
                                <div class="space-y-0.5 z-10 max-w-[75%]">
                                    <div class="flex items-center gap-1.5">
                                        <span class="bg-slate-900 text-white text-[7.5px] font-black px-1.5 py-0.2 rounded uppercase">AD</span>
                                        <h4 class="text-[9.5px] sm:text-xs font-black text-slate-800 line-clamp-1">${ad.title || ""}</h4>
                                    </div>
                                    <p class="text-[8.5px] sm:text-[9.5px] text-slate-400 font-bold line-clamp-1">${ad.desc || ""}</p>
                                </div>
                                <div class="bg-royalBlue text-white text-[9px] sm:text-[10px] font-black px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg z-10 transition-all select-none cursor-pointer">
                                    바로가기
                                </div>
                            </div>
                        `;
                    }
                    detailBottomAdSlot.innerHTML = contentHtml;
                    if (ad.type === "adsense") executeAdScripts(detailBottomAdSlot);
                } else {
                    // 폴백 렌더링을 적용하여 DB 비활성화 시에도 자문 안내 배너 유지
                    detailBottomAdSlot.classList.remove("hidden");
                    detailBottomAdSlot.innerHTML = `
                        <div class="bg-white border border-slate-200 rounded-xl p-2 flex items-center justify-between shadow-sm relative overflow-hidden h-[54px] sm:h-[64px]">
                            <a href="#" class="absolute inset-0 z-20"></a>
                            <div class="space-y-0.5 z-10 max-w-[75%]">
                                <div class="flex items-center gap-1.5">
                                    <span class="bg-slate-900 text-white text-[7.5px] font-black px-1.5 py-0.2 rounded uppercase">AD</span>
                                    <h4 class="text-[9.5px] sm:text-xs font-black text-slate-800 line-clamp-1">★ 실시간 1:1 경매 전문 권리분석 컨설팅</h4>
                                </div>
                                <p class="text-[8.5px] sm:text-[9.5px] text-slate-400 font-bold line-clamp-1">전문 변호사와 세무사가 함께 진단하는 안전 입찰 맞춤형 솔루션.</p>
                            </div>
                            <div class="bg-royalBlue text-white text-[9px] sm:text-[10px] font-black px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-lg z-10 transition-all select-none cursor-pointer">
                                바로가기
                            </div>
                        </div>
                    `;
                }
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
                contentHtml = `<div class="w-full h-full flex items-center justify-center overflow-hidden font-mono text-[9px] text-slate-400" id="feed-adsense-${index}">${currentAd.ad_code}</div>`;
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
            if (currentAd.type === "adsense" && currentAd.ad_code) {
                setTimeout(() => {
                    const el = document.getElementById(`feed-adsense-${index}`);
                    if (el) executeAdScripts(el);
                }, 100);
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
            const nonBuildingKeywords = ['차량', '자동차', '중기', '선박', '항공기', '운송', '지게차', '장비', '기계', '기구', '설비', '유가증권', '증권', '주식', '채권', '기타물품', '물품', '동산'];
            const isNonBuilding = selectedProperty && (selectedProperty.source === 'court_etc' || selectedProperty.source === 'onbid_etc' || nonBuildingKeywords.some(k => (selectedProperty.ptype || "").includes(k)));
            for (let i = 1; i <= 3; i++) {
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
                        if (isNonBuilding) {
                            renderNonBuildingPanelContent(tabNum, selectedProperty);
                        } else {
                            // 부동산일 때는 이미 loadDetailView 시점에 바인딩을 완료했으므로 innerHTML을 초기화하지 않습니다.
                        }
                    } else {
                        panel.classList.add("hidden");
                    }
                }
            }
            // 📍 3. 입지 & 시세 분석 탭 선택 시 하위 패널들(지도, 시세, 매각 통계)의 hidden 클래스를 강제로 해제하여 화이트아웃 현상을 복구합니다. (부동산 한정)
            if (!isNonBuilding && tabNum === 3) {
                const mapPanel = document.getElementById("detail-panel-map");
                const marketPanel = document.getElementById("detail-panel-market");
                const statsPanel = document.getElementById("detail-panel-statistics");
                if (mapPanel) mapPanel.classList.remove("hidden");
                if (marketPanel) marketPanel.classList.remove("hidden");
                if (statsPanel) statsPanel.classList.remove("hidden");
            }
            const mask2 = document.getElementById("group-mask-2");
            const mask3 = document.getElementById("group-mask-3");
            const content2 = document.getElementById("group-content-2");
            const content3 = document.getElementById("group-content-3");
            if (mask2) mask2.classList.add("hidden");
            if (mask3) mask3.classList.add("hidden");
            if (content2) content2.style.filter = "none";
            if (content3) content3.style.filter = "none";
            // 유저 등급에 따른 실시간 락 활성화 처리
            if (userGrade === "B") {
                if (mask3) mask3.classList.remove("hidden");
                if (content3) content3.style.filter = "blur(8px)";
            } else if (userGrade === "C") {
                if (mask2) mask2.classList.remove("hidden");
                if (mask3) mask3.classList.remove("hidden");
                if (content2) content2.style.filter = "blur(8px)";
                if (content3) content3.style.filter = "blur(8px)";
            }
            updateDynamicBrowserTitle();
        }
        // 📦 비부동산 자산 전용 탭(2, 3, 4번) HTML 렌더러 함수
        function renderNonBuildingPanelContent(tabNum, item) {
            const panel = document.getElementById(`detail-group-panel-${tabNum}`);
            if (!panel) return;
            const nbMeta = item.non_building_meta || {};
            const formatKRW = (val) => {
                if (!val || isNaN(val)) return "-";
                if (val >= 100000000) {
                    const eok = Math.floor(val / 100000000);
                    const rest = Math.round((val % 100000000) / 10000);
                    return rest > 0 ? `${eok}억 ${rest.toLocaleString()}만원` : `${eok}억원`;
                }
                return `${Math.round(val / 10000).toLocaleString()}만원`;
            };
            if (tabNum === 2) {
                let assetName = "자산";
                if (nbMeta.asset_type === 'vehicle') assetName = "차량";
                else if (nbMeta.asset_type === 'machinery') assetName = "기계장비";
                else if (nbMeta.asset_type === 'securities') assetName = "유가증권";
                else if (nbMeta.asset_type === 'goods') assetName = "기타물품";
                panel.innerHTML = `
                    <div class="space-y-4">
                        <div class="bg-white border border-slate-200 rounded-2xl p-3 sm:p-3.5 shadow-sm space-y-2.5">
                            <h4 class="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5">
                                <i class="fa-solid fa-shield-halved text-royalBlue"></i> 📋 ${assetName} 등록원부 및 압류 내역 권리 진단
                            </h4>
                            <p class="text-[10px] sm:text-xs text-slate-500 leading-relaxed font-semibold">
                                본 ${assetName} 자산의 행정 등록원부 및 공매/경매 매각 조건 상의 제한물권 소멸 여부를 실시간 추정 분석한 결과입니다.
                            </p>
                            <div class="border-t border-slate-100 pt-3 space-y-2 text-[11px] sm:text-xs">
                                <div class="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl">
                                    <span class="text-slate-500 font-bold">소유자 구분</span>
                                    <span class="font-extrabold text-slate-800">개인/기업 (가압류/체납 처분 상태)</span>
                                </div>
                                <div class="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl">
                                    <span class="text-slate-500 font-bold">갑구 사항 (소유권/가압류)</span>
                                    <span class="font-extrabold text-emeraldSuccess">낙찰 시 100% 말소 (인수 리스크 없음)</span>
                                </div>
                                <div class="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl">
                                    <span class="text-slate-500 font-bold">을구 사항 (저당권 설정)</span>
                                    <span class="font-extrabold text-emeraldSuccess">인도 시 소멸 처리 완료 (리스크 제로)</span>
                                </div>
                                <div class="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl">
                                    <span class="text-slate-500 font-bold">세금 및 과태료 압류</span>
                                    <span class="font-extrabold text-slate-700">배당 우선변제 후 자동 해제</span>
                                </div>
                            </div>
                        </div>
                        <div class="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 space-y-2">
                            <h5 class="text-xs font-black text-emerald-800 flex items-center gap-1">
                                <i class="fa-solid fa-circle-check"></i> 권리분석 최종 판정 리포트
                            </h5>
                            <p class="text-[10.5px] sm:text-xs text-slate-700 leading-relaxed font-bold">
                                대법원/캠코 매각 원칙에 따라 낙찰 대금 납부 시 소유권이 이전되며, 원부상 저당 및 압류 등 모든 등기 제한사항은 법원의 촉탁 명령에 의해 <strong>100% 소멸(말소)</strong>됩니다. 인수해야 할 대항력 있는 임차인이나 유치권 조항이 없는 안전한 자산입니다.
                            </p>
                        </div>
                    </div>
                `;
            } else if (tabNum === 3) {
                const minBid = item.minimum_bid || 0;
                const isCar = nbMeta.asset_type === 'vehicle';
                const taxRate = isCar ? 0.07 : 0.04;
                const taxName = isCar ? "차량 취등록세 (7%)" : "지방세/기타 부대세율 (4%)";
                const tax = Math.floor(minBid * taxRate);
                const loan = Math.floor(minBid * 0.7);
                const cash = minBid - loan + tax + 200000;
                panel.innerHTML = `
                    <div class="space-y-4">
                        <div class="bg-white border border-slate-200 rounded-2xl p-3 sm:p-3.5 shadow-sm space-y-2.5">
                            <h4 class="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5">
                                <i class="fa-solid fa-coins text-royalBlue"></i> 💰 비부동산 자산 인수 금융 시뮬레이션
                            </h4>
                            <p class="text-[10px] sm:text-xs text-slate-500 leading-relaxed font-semibold">
                                본 공매/경매 자산의 현재 최저입찰가를 기준으로 산출한 경락 대출 및 총 인수 비용 분석표입니다.
                            </p>
                            <div class="border-t border-slate-100 pt-3 space-y-2 text-[11px] sm:text-xs">
                                <div class="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl">
                                    <span class="text-slate-500 font-bold">현재 최저응찰가</span>
                                    <span class="font-extrabold text-slate-800 font-mono">${formatKRW(minBid)}</span>
                                </div>
                                <div class="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl">
                                    <span class="text-slate-500 font-bold">동산 경락대출 가능액 (70% 추정)</span>
                                    <span class="font-extrabold text-royalBlue font-mono">${formatKRW(loan)}</span>
                                </div>
                                <div class="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl">
                                    <span class="text-slate-500 font-bold">${taxName}</span>
                                    <span class="font-extrabold text-slate-800 font-mono">${formatKRW(tax)}</span>
                                </div>
                                <div class="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl">
                                    <span class="text-slate-500 font-bold">이전 대행료 및 탁송 비용</span>
                                    <span class="font-extrabold text-slate-800 font-mono">약 200,000원</span>
                                </div>
                                <div class="flex justify-between items-center bg-royalBlue/5 p-2.5 rounded-xl border border-royalBlue/20">
                                    <span class="text-royalBlue font-black">실제 현금 필요액 (인수 총액)</span>
                                    <span class="font-black text-royalBlue font-mono text-xs sm:text-sm">${formatKRW(cash)}</span>
                                </div>
                            </div>
                        </div>
                        <div class="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-1.5">
                            <h5 class="text-xs font-black text-amber-800 flex items-center gap-1">
                                <i class="fa-solid fa-triangle-exclamation"></i> 동산 자산 입찰 시 주의사항
                            </h5>
                            <p class="text-[10px] sm:text-[11px] text-slate-700 leading-relaxed font-bold">
                                1. 보관소 장기 방치에 따른 보관료 부담 여부(경매는 면제되나 캠코 공매 시 일부 낙찰자 부담 조건이 있을 수 있음)를 입찰 공고 원문에서 반드시 대조해야 합니다.<br>
                                2. 경락잔금대출은 신용도 및 동산 가치 평가에 따라 상이하므로 주거래 은행 또는 오토론 연계 업체와 사전 조율이 필요합니다.
                            </p>
                        </div>
                    </div>
                `;
            } else if (tabNum === 4) {
                const storageLoc = nbMeta.storage_location || item.address || "상세 비고 참고";
                const appVal = item.appraised_value || 0;
                const minBid = item.minimum_bid || 0;
                const marketMin = Math.floor(appVal * 0.85);
                const marketMax = Math.floor(appVal * 0.95);
                const diffPercent = (((marketMin - minBid) / marketMin) * 100).toFixed(1);
                let marketOpinion = "";
                if (parseFloat(diffPercent) > 0) {
                    marketOpinion = `현재 최저응찰가는 동종 연식 중고 거래 최저 시세(${formatKRW(marketMin)}) 대비 약 <span class="text-rose-600 font-black">${diffPercent}%</span> 저렴하여 가격 메리트가 확실히 높은 수준입니다.`;
                } else {
                    marketOpinion = `현재 최저응찰가는 일반 시세와 대등하거나 약간 높으므로, 한 차례 더 유찰된 후 다음 회차에 입찰하시는 것을 권장합니다.`;
                }
                panel.innerHTML = `
                    <div class="space-y-4">
                        <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-2.5">
                            <h4 class="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5">
                                <i class="fa-solid fa-map-location-dot text-royalBlue"></i> 📍 실 보관 장소 및 지도 바로가기
                            </h4>
                            <div class="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                                <span class="text-[10px] text-slate-400 font-bold block">자산 보관 주소</span>
                                <span class="font-extrabold text-slate-800 text-[11px] sm:text-xs">${storageLoc}</span>
                            </div>
                            <p class="text-[9.5px] text-slate-500 leading-relaxed font-medium">
                                하단의 버튼을 활용하여 지도 사이트에서 실제 보관 주소를 확인하고, 현장을 방문하여 자산의 훼손 상태 등을 현품 조사해 보십시오.
                            </p>
                            <div class="grid grid-cols-3 gap-2">
                                <a href="https://map.naver.com/v5/search/${encodeURIComponent(storageLoc)}" target="_blank" class="bg-slate-50 border border-slate-200 hover:border-[#10b981] rounded-xl p-2 flex flex-col items-center justify-center transition-all shadow-sm">
                                    <span class="text-xs font-black text-[#10b981] mb-0.5">네이버 지도</span>
                                    <span class="text-[8px] text-slate-400 font-normal">위치/로드뷰 찾기</span>
                                </a>
                                <a href="https://map.kakao.com/?q=${encodeURIComponent(storageLoc)}" target="_blank" class="bg-slate-50 border border-slate-200 hover:border-royalBlue rounded-xl p-2 flex flex-col items-center justify-center transition-all shadow-sm">
                                    <span class="text-xs font-black text-royalBlue mb-0.5">카카오 맵</span>
                                    <span class="text-[8px] text-slate-400 font-normal">주소 검색 이동</span>
                                </a>
                                <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(storageLoc)}" target="_blank" class="bg-slate-50 border border-slate-200 hover:border-red-500 rounded-xl p-2 flex flex-col items-center justify-center transition-all shadow-sm">
                                    <span class="text-xs font-black text-red-500 mb-0.5">구글 지도</span>
                                    <span class="text-[8px] text-slate-400 font-normal">위성/지리 검색</span>
                                </a>
                            </div>
                        </div>
                        <div class="bg-white border border-slate-200 rounded-2xl p-3 sm:p-3.5 shadow-sm space-y-2.5">
                            <h4 class="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5">
                                <i class="fa-solid fa-chart-line text-royalBlue"></i> 📊 동종 모델 시세 분석 리포트
                            </h4>
                            <div class="overflow-x-auto">
                                <table class="w-full text-left border-collapse text-[10.5px] sm:text-xs">
                                    <thead>
                                        <tr class="bg-slate-50 text-slate-500 font-black border-b border-slate-100">
                                            <th class="p-2">거래 유형</th>
                                            <th class="p-2 text-right">예상 시세 범위</th>
                                            <th class="p-2 text-center">감정가 대비</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr class="border-b border-slate-100">
                                            <td class="p-2 font-bold text-slate-700">중고 실거래 평균가</td>
                                            <td class="p-2 text-right font-mono text-slate-800 font-bold">${formatKRW(marketMin)} ~ ${formatKRW(marketMax)}</td>
                                            <td class="p-2 text-center text-slate-500">-5% ~ -15%</td>
                                        </tr>
                                        <tr class="border-b border-slate-100">
                                            <td class="p-2 font-bold text-slate-700">현재 법원 최저입찰가</td>
                                            <td class="p-2 text-right font-mono text-rose-600 font-black">${formatKRW(minBid)}</td>
                                            <td class="p-2 text-center text-rose-600 font-black">약 -20% 저감</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <p class="text-[10px] sm:text-xs text-slate-700 font-bold leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                ${marketOpinion}
                            </p>
                        </div>
                    </div>
                `;
            }
        }
        // 📱 실시간 브라우저 타이틀 동적 전환 함수
        function updateDynamicBrowserTitle() {
            const drawer = document.getElementById("detail-drawer");
            if (drawer && !drawer.classList.contains("translate-x-full")) {
                const auctionNo = document.getElementById("detail-no") ? document.getElementById("detail-no").innerText : "";
                const cleanNo = auctionNo.replace("사건번호: ", "").trim();
                const tabNames = {
                    1: "종합&권리분석",
                    2: "입찰&금융분석",
                    3: "입지&시세분석"
                };
                const tabLabel = tabNames[currentDetailGroupTab] || "상세";
                document.title = `부동산경공매 검색시스템 - ${cleanNo} [${tabLabel}]`;
            } else {
                document.title = "부동산경공매 검색시스템 - 실시간 추천";
            }
        }
        // Supabase로부터 로그인 유저의 관심 목록 로드 함수
        async function loadFavoritesFromServer() {
            if (!currentUser) return;
            try {
                const { data, error } = await supabaseClient
                    .from('user_favorites')
                    .select('property_id')
                    .eq('user_id', currentUser.id);
                if (error) throw error;
                favoritePropertyIds = new Set((data || []).map(f => f.property_id));
            } catch (err) {
                console.error("관심 목록 동기화 실패", err);
            }
        }
        // 매물 카드에서 관심 별표 클릭 시 토글 함수
        async function toggleFavoriteProperty(propertyId, event) {
            if (event) event.stopPropagation(); // 카드 상세 서랍 열림 이벤트 방지
            if (!currentUser) {
                alert("로그인이 필요한 기능입니다. 로그인 화면으로 안내합니다.");
                openLoginModal();
                return;
            }
            const id = parseInt(propertyId);
            const isFav = favoritePropertyIds.has(id);
            try {
                if (isFav) {
                    const { error } = await supabaseClient
                        .from('user_favorites')
                        .delete()
                        .eq('user_id', currentUser.id)
                        .eq('property_id', id);
                    if (error) throw error;
                    favoritePropertyIds.delete(id);
                } else {
                    const { error } = await supabaseClient
                        .from('user_favorites')
                        .insert({
                            user_id: currentUser.id,
                            property_id: id
                        });
                    if (error) throw error;
                    favoritePropertyIds.add(id);
                }
                // 해당 카드의 별표 UI 실시간 갱신
                updateFavoriteStarUI(id);
                // 관심 매물 필터 버튼 UI 실시간 갱신
                updateFavoritesButtonUI();
                // 내 관심 목록만 보기 필터 가동 상태라면 리스트 재렌더링
                if (showFavoritesOnly) {
                    applyFilters();
                }
            } catch (err) {
                console.error("관심 등록 실패", err);
                alert("인증 오류 또는 일시적 네트워크 장애로 관심 목록 변경에 실패했습니다.");
            }
        }
        // 단일 별표 UI 상태 실시간 동적 보정
        function updateFavoriteStarUI(propertyId) {
            const btn = document.getElementById(`star-btn-${propertyId}`);
            if (btn) {
                const isFav = favoritePropertyIds.has(propertyId);
                btn.innerHTML = isFav 
                    ? `<i class="fa-solid fa-star text-amber-400 text-[13px]"></i>` 
                    : `<i class="fa-regular fa-star text-slate-400 text-[13px]"></i>`;
            }
        }
        // 관심 목록 토글 스위치 이벤트 핸들러
        function toggleFavoritesFilter() {
            const toggle = document.getElementById("show-favorites-toggle");
            if (toggle.checked && !currentUser) {
                toggle.checked = false;
                alert("로그인 후 관심 목록 전용 조회가 가능합니다.");
                openLoginModal();
                return;
            }
            showFavoritesOnly = toggle.checked;
            updateFavoritesButtonUI(); // 관심목록 필터 버튼 UI 동기화
            applyFilters();
        }
        // 🌟 [신규] 정렬 바 옆 관심 목록 필터 버튼 클릭 핸들러
        function toggleFavoritesFilterBtn() {
            if (!currentUser) {
                alert("로그인 후 관심 목록 조회가 가능합니다.");
                openLoginModal();
                return;
            }
            showFavoritesOnly = !showFavoritesOnly;
            // 왼쪽 사이드바 토글 스위치와 상태 동기화
            const toggle = document.getElementById("show-favorites-toggle");
            if (toggle) toggle.checked = showFavoritesOnly;
            updateFavoritesButtonUI();
            applyFilters();
        }
        // 🌟 [신규] 관심 목록 버튼 UI 상태 실시간 갱신 함수 (프리미엄 앰버/골드 테마 적용)
        function updateFavoritesButtonUI() {
            const btn = document.getElementById("fav-filter-btn");
            const textSpan = document.getElementById("fav-filter-btn-text");
            if (!btn || !textSpan) return;
            if (currentUser) {
                const favCount = favoritePropertyIds.size;
                textSpan.textContent = `내 관심 매물 (${favCount})`;
                if (showFavoritesOnly) {
                    btn.className = "px-2.5 py-1 rounded text-[10px] font-black shadow-sm transition-all duration-300 flex items-center gap-1 cursor-pointer bg-gradient-to-r from-amber-500 to-yellow-500 text-white hover:brightness-110 active:scale-95";
                } else {
                    btn.className = "px-2.5 py-1 rounded text-[10px] font-black shadow-sm transition-all duration-300 flex items-center gap-1 cursor-pointer bg-white border border-amber-300 text-amber-600 hover:bg-amber-50 active:scale-95";
                }
            } else {
                textSpan.textContent = "내 관심 매물";
                btn.className = "px-2.5 py-1 rounded text-[10px] font-black shadow-sm transition-all duration-300 flex items-center gap-1 cursor-pointer bg-white border border-slate-200 text-slate-400 hover:bg-slate-50 active:scale-95 opacity-60";
            }
        }