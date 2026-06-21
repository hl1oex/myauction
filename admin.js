        let currentTabId = "ad-tab";
        let adSettings = { slot_name: 'list_banner', is_active: true, type: 'direct', image_url: '', link_url: '', code: '' };
        let usersList = [];
        window.onload = function() {
            if (!localStorage.getItem("admin_email")) {
                localStorage.setItem("admin_email", "hl1oex@gmail.com");
            }
            if (!localStorage.getItem("admin_password")) {
                localStorage.setItem("admin_password", "123456");
            }
            checkAdminAuth();
            document.title = "부동산경공매 검색시스템 - 백엔드 관리자";
        };
        // 탭 토글링 구현
        function switchTab(tabId) {
            const tabs = ['ad-tab', 'user-tab', 'mock-bid-tab', 'consultation-tab', 'telegram-tab'];
            tabs.forEach(t => {
                const panel = document.getElementById(`panel-${t}`);
                const btn = document.getElementById(`btn-${t}`);
                if (t === tabId) {
                    if (panel) panel.classList.remove('hidden');
                    if (btn) btn.className = "w-full text-left bg-royalBlue text-white border border-royalBlue px-4 py-3 rounded-xl font-black text-xs flex items-center gap-3 transition-all shadow-sm";
                } else {
                    if (panel) panel.classList.add('hidden');
                    if (btn) btn.className = "w-full text-left bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 px-4 py-3 rounded-xl font-black text-xs flex items-center gap-3 transition-all";
                }
            });
            currentTabId = tabId;
            try {
                if (tabId === 'mock-bid-tab') {
                    if (typeof loadMockBidsList === 'function') {
                        loadMockBidsList();
                    }
                } else if (tabId === 'consultation-tab') {
                    if (typeof loadConsultationsList === 'function') {
                        loadConsultationsList();
                    }
                } else if (tabId === 'telegram-tab') {
                    if (typeof loadTelegramAdminSettings === 'function') {
                        loadTelegramAdminSettings();
                    }
                    if (typeof loadTelegramLogs === 'function') {
                        loadTelegramLogs(1);
                    }
                }
            } catch (err) {
                console.error("탭 변경 후 데이터 로딩 실패:", err);
            }
        }
        // 폼 필드 토글
        function toggleFormFields(type) {
            const direct = document.getElementById("direct-fields");
            const adsense = document.getElementById("adsense-fields");
            if (type === 'direct') {
                direct.classList.remove('hidden');
                adsense.classList.add('hidden');
            } else {
                direct.classList.add('hidden');
                adsense.classList.remove('hidden');
            }
            updatePreview(type);
        }
        // 에뮬레이터 실시간 렌더러
        function updatePreview(type) {
            const slotName = document.getElementById("ad-slot-select")?.value || "list_banner";
            const cardFrame = document.getElementById("ad-preview-card");
            const container = document.getElementById("ad-preview-container");
            const title = document.getElementById("ad-title").value || "★ 프리미엄 경공매 투자 VIP 멤버십 모집";
            const desc = document.getElementById("ad-desc").value || "오직 1%를 위한 NPL 부실채권 및 지분 경매 핵심 노하우 단독 공개. 지금 가입 시 30% 한정 할인 적용!";
            const image = document.getElementById("ad-image-url").value || "./apartment_elegant_facade.png";
            const link = document.getElementById("ad-link-url").value || "#";
            const code = document.getElementById("ad-code").value || "";
            // 구좌에 맞춰 프레임 규격 동적 변경
            if (slotName === "main_top_banner" || slotName === "detail_top_banner" || slotName === "detail_bottom_banner") {
                cardFrame.className = "w-full max-w-[800px] min-h-[90px] bg-white border border-slate-200 rounded-2xl p-3 shadow-sm relative overflow-hidden transition-all hover:shadow-md flex flex-col justify-center";
            } else if (slotName === "sidebar_filter_banner") {
                cardFrame.className = "w-[240px] min-h-[220px] bg-white border border-slate-200 rounded-2xl p-3 shadow-sm relative overflow-hidden transition-all hover:shadow-md flex flex-col justify-between";
            } else {
                cardFrame.className = "w-[300px] min-h-[360px] bg-white border border-slate-200 rounded-2xl p-3 shadow-sm relative overflow-hidden transition-all hover:shadow-md flex flex-col justify-between";
            }
            if (type === 'direct') {
                if (slotName === "main_top_banner" || slotName === "detail_top_banner" || slotName === "detail_bottom_banner") {
                    container.innerHTML = `
                        <a href="${link}" target="_blank" class="relative w-full h-[70px] bg-slate-100 flex items-center justify-between px-6 py-4 rounded-xl overflow-hidden group">
                            <div class="space-y-0.5 z-10 max-w-[70%]">
                                <div class="flex items-center gap-1.5">
                                    <span class="bg-slate-900 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase">AD</span>
                                    <h4 class="text-xs font-black text-slate-800 line-clamp-1 group-hover:text-royalBlue transition-colors">${title}</h4>
                                </div>
                                <p class="text-[10px] text-slate-400 font-bold line-clamp-1">${desc}</p>
                            </div>
                            <img src="${image}" alt="광고" class="absolute right-0 top-0 h-full w-[25%] object-cover group-hover:scale-105 transition-transform duration-300">
                        </a>
                    `;
                } else if (slotName === "sidebar_filter_banner") {
                    container.innerHTML = `
                        <a href="${link}" target="_blank" class="flex flex-col justify-between h-full space-y-2 group">
                            <div class="relative w-full h-[90px] rounded-xl overflow-hidden bg-slate-100 border border-slate-200/60">
                                <img src="${image}" alt="광고" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
                                <span class="absolute top-1 left-1 bg-slate-900/60 text-white text-[7px] font-black px-1 py-0.2 rounded uppercase">AD</span>
                            </div>
                            <div class="space-y-0.5">
                                <h4 class="text-[10px] font-black text-slate-800 line-clamp-1 group-hover:text-royalBlue transition-colors">
                                    ${title}
                                </h4>
                                <p class="text-[9px] text-slate-400 font-bold line-clamp-2 leading-tight">
                                    ${desc}
                                </p>
                            </div>
                            <div class="text-[9.5px] font-black text-royalBlue pt-1 border-t border-slate-100 flex items-center justify-between">
                                <span>바로가기</span>
                                <i class="fa-solid fa-arrow-right text-[8px] group-hover:translate-x-0.5 transition-transform"></i>
                            </div>
                        </a>
                    `;
                } else {
                    container.innerHTML = `
                        <a href="${link}" target="_blank" class="flex flex-col justify-between h-full space-y-2 group">
                            <div class="relative w-full h-[110px] rounded-xl overflow-hidden bg-slate-100 border border-slate-200/60">
                                <img src="${image}" alt="광고" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
                                <span class="absolute top-1.5 left-1.5 bg-slate-900/60 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase">AD</span>
                            </div>
                            <div class="space-y-1 flex-1 flex flex-col justify-between">
                                <div>
                                    <h4 class="text-xs font-black text-slate-800 line-clamp-2 leading-snug group-hover:text-royalBlue transition-colors">
                                        ${title}
                                    </h4>
                                    <p class="text-[10px] text-slate-400 font-bold line-clamp-2 mt-1 leading-normal">
                                        ${desc}
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
            } else {
                const minH = slotName === "main_top_banner" ? "70px" : (slotName === "sidebar_filter_banner" ? "180px" : "300px");
                container.innerHTML = `
                    <div class="w-full h-full bg-slate-50 border border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center p-3 overflow-hidden text-[9px] text-slate-400 font-bold font-mono min-h-[${minH}]">
                        <i class="fa-solid fa-code text-amber-500 text-sm mb-1.5"></i>
                        <span>[구글 애드센스 HTML 렌더링 영역]</span>
                        <div class="truncate max-w-[80%] text-slate-350 mt-1">${code.replace(/</g, '&lt;')}</div>
                    </div>
                `;
            }
        }
        // 전역 이미지 보정용 이미지 객체
        let uploadedImage = null;
        // 미니맵 노출 하이라이트 제어
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
        }
        // AI 카피 제안 1.5초 로딩 연출 및 추천 목록 바인딩
        function triggerAiCopywriterSuggestions(fileName) {
            const loader = document.getElementById("ai-copy-loader");
            const suggestionsContainer = document.getElementById("ai-copy-suggestions-container");
            const listContainer = document.getElementById("ai-copy-list");
            if (!loader || !suggestionsContainer || !listContainer) return;
            loader.classList.remove("hidden");
            suggestionsContainer.classList.add("hidden");
            setTimeout(() => {
                loader.classList.add("hidden");
                suggestionsContainer.classList.remove("hidden");
                // 파일 이름 또는 임의 분위기에 따른 맞춤 광고 카피 제안 데이터
                const mockSuggestions = [
                    {
                        type: "🔥 프리미엄 투자 모집형",
                        title: "★ 프리미엄 경공매 투자 VIP 멤버십 모집",
                        desc: "오직 1%를 위한 NPL 부실채권 및 지분 경매 핵심 노하우 단독 공개. 지금 가입 시 30% 한정 할인 적용!"
                    },
                    {
                        type: "⚡ 소액 실전 투자형",
                        title: "⚡ 소액으로 시작하는 전국 부동산 틈새투자",
                        desc: "단돈 1천만원으로 공매 지분 및 NPL 소득 극대화 전략 전격 대공개! 지금 상담 신청하고 가이드북을 받으세요."
                    },
                    {
                        type: "🛡️ 초보자 안전 권리분석형",
                        title: "🛡️ 초보자도 100% 안전한 법적 권리 리스크 특강",
                        desc: "대항력, 유치권 등 7대 치명적인 법적 함정을 완벽히 피하는 명도 비법서 독점 제공."
                    }
                ];
                listContainer.innerHTML = mockSuggestions.map((s, idx) => `
                    <div onclick="applyAiCopy('${s.title.replace(/'/g, "\\'")}', '${s.desc.replace(/'/g, "\\'")}')" class="border border-slate-150 p-2.5 rounded-xl hover:border-royalBlue hover:bg-blue-50/20 cursor-pointer transition-all duration-200">
                        <div class="flex items-center justify-between mb-1">
                            <span class="bg-royalBlue/10 text-royalBlue text-[8px] font-black px-2 py-0.5 rounded-full">${s.type}</span>
                            <span class="text-[8px] text-slate-400 font-bold">클릭 시 자동 적용</span>
                        </div>
                        <h4 class="text-[10px] font-black text-slate-800 line-clamp-1">${s.title}</h4>
                        <p class="text-[9px] text-slate-500 font-semibold mt-0.5 line-clamp-1">${s.desc}</p>
                    </div>
                `).join("");
            }, 1500);
        }
        // 제안 카피 적용
        function applyAiCopy(title, desc) {
            document.getElementById("ad-title").value = title;
            document.getElementById("ad-desc").value = desc;
            const type = document.querySelector('input[name="ad_type"]:checked').value;
            updatePreview(type);
        }
        // 업로드 이미지 처리 및 Canvas 로딩
        function loadUploadedImage(event) {
            const file = event.target.files[0];
            if (!file) return;
            // AI 카피 제안 연출 트리거
            triggerAiCopywriterSuggestions(file.name);
            const reader = new FileReader();
            reader.onload = function(e) {
                uploadedImage = new Image();
                uploadedImage.onload = function() {
                    document.getElementById("btn-open-canvas").classList.remove("hidden");
                    const opSlider = document.getElementById("slider-opacity");
                    if (opSlider) opSlider.value = 100;
                    openCanvasEditor();
                    applyFiltersToCanvas(); // 첫 렌더링
                };
                uploadedImage.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
        // Canvas 에디터 패널 제어
        function openCanvasEditor() {
            const panel = document.getElementById("canvas-editor-panel");
            if (panel) panel.classList.remove("hidden");
            // 초기 캔버스 사이즈에 맞춤 드로잉
            applyFiltersToCanvas();
        }
        function closeCanvasEditor() {
            const panel = document.getElementById("canvas-editor-panel");
            if (panel) panel.classList.add("hidden");
        }
        // Canvas 필터 및 보정 갱신
        function applyFiltersToCanvas() {
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
        }
        // Canvas 텍스트 오버레이 그리기
        function drawCanvasText(skipFilterUpdate = false) {
            if (!skipFilterUpdate) {
                applyFiltersToCanvas();
                return;
            }
            const canvas = document.getElementById("ad-edit-canvas");
            const ctx = canvas.getContext("2d");
            const content = document.getElementById("canvas-text-content").value;
            const size = document.getElementById("canvas-text-size").value;
            const color = document.getElementById("canvas-text-color").value;
            const xPercent = document.getElementById("canvas-text-x").value;
            const yPercent = document.getElementById("canvas-text-y").value;
            const strokeWidth = document.getElementById("canvas-text-stroke-width").value;
            const strokeColor = document.getElementById("canvas-text-stroke-color").value;
            const shadowBlur = document.getElementById("canvas-text-shadow-blur").value;
            const shadowColor = document.getElementById("canvas-text-shadow-color").value;
            // 헥스 텍스트 업데이트
            document.getElementById("canvas-text-color-hex").value = color;
            document.getElementById("canvas-text-stroke-hex").value = strokeColor;
            document.getElementById("canvas-text-shadow-hex").value = shadowColor;
            if (!content) return;
            ctx.save();
            ctx.font = `bold ${size}px Inter, "Noto Sans KR", sans-serif`;
            ctx.textBaseline = "middle";
            const x = (canvas.width * xPercent) / 100;
            const y = (canvas.height * yPercent) / 100;
            // 그림자 설정
            if (parseInt(shadowBlur) > 0) {
                ctx.shadowColor = shadowColor;
                ctx.shadowBlur = shadowBlur;
                ctx.shadowOffsetX = 2;
                ctx.shadowOffsetY = 2;
            }
            // 테두리(스트로크) 그리기
            if (parseInt(strokeWidth) > 0) {
                ctx.strokeStyle = strokeColor;
                ctx.lineWidth = strokeWidth;
                ctx.lineJoin = "round";
                ctx.strokeText(content, x, y);
            }
            // 내부 텍스트 그리기
            ctx.fillStyle = color;
            ctx.fillText(content, x, y);
            ctx.restore();
        }
        // Canvas base64 데이터 적용
        function applyCanvasToAdUrl() {
            const canvas = document.getElementById("ad-edit-canvas");
            const dataUrl = canvas.toDataURL("image/png");
            document.getElementById("ad-image-url").value = dataUrl;
            const type = document.querySelector('input[name="ad_type"]:checked').value;
            updatePreview(type);
            closeCanvasEditor();
            alert("편집하고 꾸민 배너 이미지가 폼에 정상 바인딩되었습니다. 하단 '광고 설정 업데이트 적용'을 눌러 최종 배포를 완성하십시오.");
        }
        // Supabase 연동 - 광고 설정 로드
        async function loadAdSettings() {
            const slotName = document.getElementById("ad-slot-select")?.value || "list_banner";
            // 미니맵 하이라이트 동기화
            updateMinimapHighlight(slotName);
            try {
                const { data, error } = await supabaseClient
                    .from('ads')
                    .select('*')
                    .eq('slot_name', slotName)
                    .single();
                if (error && error.code !== 'PGRST116') throw error;
                if (data) {
                    adSettings = data;
                    document.getElementById("ad-toggle").checked = data.active;
                    document.getElementById("ad-toggle-label").innerText = data.active ? "활성" : "비활성";
                    document.getElementById("ad-title").value = data.title || "";
                    document.getElementById("ad-desc").value = data.desc || "";
                    document.getElementById("ad-image-url").value = data.image_url || "";
                    document.getElementById("ad-link-url").value = data.link_url || "";
                    document.getElementById("ad-code").value = data.ad_code || "";
                    const radios = document.getElementsByName("ad_type");
                    radios.forEach(r => {
                        if (r.value === data.type) {
                            r.checked = true;
                            toggleFormFields(data.type);
                        }
                    });
                } else {
                    adSettings = { slot_name: slotName, active: false, type: 'direct', title: '', desc: '', image_url: '', link_url: '', ad_code: '' };
                    document.getElementById("ad-toggle").checked = false;
                    document.getElementById("ad-toggle-label").innerText = "비활성";
                    document.getElementById("ad-title").value = "";
                    document.getElementById("ad-desc").value = "";
                    document.getElementById("ad-image-url").value = "";
                    document.getElementById("ad-link-url").value = "";
                    document.getElementById("ad-code").value = "";
                    const radios = document.getElementsByName("ad_type");
                    radios.forEach(r => {
                        if (r.value === 'direct') r.checked = true;
                    });
                    toggleFormFields('direct');
                }
            } catch (err) {
                console.warn("광고 테이블 설정 로드 실패 (아직 테이블 미설정일 수 있습니다)", err);
                updatePreview('direct');
            }
        }
        async function onAdSlotChange() {
            await loadAdSettings();
        }
        // 광고 설정 저장
        async function saveAdSettings() {
            const slotName = document.getElementById("ad-slot-select")?.value || "list_banner";
            const isActive = document.getElementById("ad-toggle").checked;
            const type = document.querySelector('input[name="ad_type"]:checked').value;
            const title = document.getElementById("ad-title").value;
            const desc = document.getElementById("ad-desc").value;
            const imageUrl = document.getElementById("ad-image-url").value;
            const linkUrl = document.getElementById("ad-link-url").value;
            const adCode = document.getElementById("ad-code").value;
            try {
                const { error } = await supabaseClient
                    .from('ads')
                    .upsert({
                        slot_name: slotName,
                        active: isActive,
                        type: type,
                        title: title,
                        desc: desc,
                        image_url: imageUrl,
                        link_url: linkUrl,
                        ad_code: adCode
                    }, { onConflict: 'slot_name' });
                if (error) throw error;
                alert("광고판 설정이 성공적으로 업데이트되었습니다.");
                updatePreview(type);
            } catch (err) {
                console.error("광고 설정 저장 오류", err);
                alert("설정 저장에 실패했습니다. DB 테이블 셋업 탭의 SQL 가이드를 수행했는지 확인해주시기 바랍니다.");
            }
        }
        // 토글 조작 시 상태 즉시 적용
        async function saveAdStatus() {
            const slotName = document.getElementById("ad-slot-select")?.value || "list_banner";
            const isActive = document.getElementById("ad-toggle").checked;
            document.getElementById("ad-toggle-label").innerText = isActive ? "활성" : "비활성";
            try {
                const { error } = await supabaseClient
                    .from('ads')
                    .update({ active: isActive })
                    .eq('slot_name', slotName);
                if (error) throw error;
            } catch (err) {
                console.warn("DB 광고 스위치 조작 실패", err);
            }
        }
        // 퀵 기간 연장 캘린더 일동 적용 유틸리티
        function setQuickExpiry(userId, days) {
            const dateInput = document.getElementById(`expiry-${userId}`);
            if (!dateInput) return;
            if (days === 'infinite') {
                dateInput.value = "9999-12-31";
            } else {
                const d = new Date();
                d.setDate(d.getDate() + parseInt(days));
                const offset = d.getTimezoneOffset();
                const localDate = new Date(d.getTime() - (offset*60*1000));
                dateInput.value = localDate.toISOString().split('T')[0];
            }
        }
        // Supabase 연동 - 가입 유저 리스트 로드
        // 전역 회원 목록 데이터 캐시
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
                
                // 가입 경로 (provider) 판별
                let providerStr = "이메일";
                if (u.provider) {
                    const p = u.provider.toLowerCase();
                    if (p === 'google') providerStr = "구글";
                    else if (p === 'kakao') providerStr = "카카오";
                    else if (p === 'naver') providerStr = "네이버";
                    else providerStr = u.provider;
                }

                // 2단계 멤버십 등급 단순화 (regular / premium)
                const membershipTier = u.membership_tier || 'regular';
                
                // 기간 기한 설정값
                let expiryStr = "";
                if (u.membership_expires_at) {
                    const expDate = new Date(u.membership_expires_at);
                    const offset = expDate.getTimezoneOffset();
                    const local = new Date(expDate.getTime() - (offset*60*1000));
                    expiryStr = local.toISOString().split('T')[0];
                }
                // 가입일 포맷팅
                let signUpDateStr = "정보 없음";
                if (u.created_at) {
                    const cDate = new Date(u.created_at);
                    signUpDateStr = cDate.toLocaleDateString('ko-KR', {
                        year: '2-digit',
                        month: '2-digit',
                        day: '2-digit'
                    });
                }

                // 텔레그램 연동 정보 포맷팅
                const telegramIdStr = u.telegram_chat_id 
                    ? `<span class="inline-flex items-center gap-1 bg-blue-50 text-[#229ED9] text-[10px] font-black px-2 py-0.5 rounded-full border border-blue-150"><i class="fa-brands fa-telegram text-[11px]"></i> ${u.telegram_chat_id}</span>`
                    : `<span class="text-slate-350 text-[10px] font-semibold">미연동</span>`;

                return `
                    <tr class="border-b border-slate-100 hover:bg-slate-50/50">
                        <td class="p-3 text-center text-slate-500 font-bold">${idx + 1}</td>
                        <td class="p-3 text-slate-800 font-extrabold select-all">
                            <div class="flex items-center gap-1.5 flex-wrap">
                                <span class="cursor-pointer text-royalBlue hover:underline" onclick="showUserDetailModal('${u.id}')">${u.email}</span>
                                ${upgradeBadge}
                            </div>
                        </td>
                        <td class="p-3 text-center text-slate-600 font-extrabold">${providerStr}</td>
                        <td class="p-3 text-center">${telegramIdStr}</td>
                        <td class="p-3 text-center text-slate-600 font-extrabold">${signUpDateStr}</td>
                        <td class="p-3 text-center">
                            <div class="flex flex-col gap-1.5 items-center justify-center">
                                <select id="tier-${u.id}" class="text-xs p-1.5 border border-slate-200 rounded-lg bg-white font-extrabold text-slate-700 focus:border-royalBlue outline-none w-[150px]">
                                    <option value="regular" ${membershipTier === 'regular' ? 'selected' : ''}>일반 (regular)</option>
                                    <option value="premium" ${membershipTier === 'premium' ? 'selected' : ''}>⭐ 프리미엄 (premium)</option>
                                </select>
                                ${u.upgrade_requested ? `
                                    <div class="flex gap-1 mt-1">
                                        <button onclick="approveUpgradeRequest('${u.id}', '${u.email}')" class="bg-emeraldSuccess hover:bg-emerald-700 text-white text-[9px] font-black px-2 py-1 rounded shadow-sm">승인 (프리미엄)</button>
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
                            <button onclick="saveUserCurationConfig('${u.id}')" class="bg-royalBlue hover:bg-royalHover text-white text-[10.5px] font-black px-3.5 py-2 rounded-xl transition-all shadow-md select-none">
                                저장
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        }
        // 회원 정보 및 이용 기간 변경 최종 DB 저장
        async function saveUserCurationConfig(userId) {
            const tier = document.getElementById(`tier-${userId}`).value;
            const expiryVal = document.getElementById(`expiry-${userId}`).value;
            const grade = (tier === 'premium') ? 'A' : 'C'; // 2단계 통합 등급 매핑
            let expiresAt = null;
            if (expiryVal) {
                expiresAt = new Date(expiryVal).toISOString();
            }
            try {
                const { error } = await supabaseClient
                    .from('user_profiles')
                    .update({
                        grade: grade,
                        membership_tier: tier,
                        membership_expires_at: expiresAt,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', userId);
                if (error) throw error;
                alert("회원 등급 권한 및 이용 기간이 성공적으로 저장되었습니다.");
                loadUsersList();
            } catch (err) {
                console.error("회원 설정 저장 실패", err);
                alert("설정 저장 처리에 실패하였습니다.");
            }
        }
        // 등업 요청 승인 액션
        async function approveUpgradeRequest(userId, email) {
            if (!confirm(`${email} 회원의 등업 요청을 승인하시겠습니까?\n\n[승인 효과: 프리미엄 등급 변경 + 이용 기간 오늘부터 30일 설정]`)) return;
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + 30);
            try {
                const { error } = await supabaseClient
                    .from('user_profiles')
                    .update({
                        grade: 'A',
                        membership_tier: 'premium',
                        membership_expires_at: expiryDate.toISOString(),
                        upgrade_requested: false,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', userId);
                if (error) throw error;
                alert("등업 신청이 성공적으로 승인 결재되었습니다.");
                loadUsersList();
            } catch (err) {
                console.error("등업 승인 실패", err);
                alert("승인 결재 처리에 실패하였습니다.");
            }
        }
        // 회원 전체 정보 엑셀(CSV) 다운로드
        function exportUsersToCSV() {
            if (!usersList || usersList.length === 0) {
                alert("다운로드할 회원 데이터가 존재하지 않습니다.");
                return;
            }
            const headers = ["No.", "아이디(이메일)", "가입경로", "멤버십등급", "이용만료일", "등업요청여부", "가입일"];
            const rows = usersList.map((u, idx) => {
                let providerStr = "이메일";
                if (u.provider) {
                    const p = u.provider.toLowerCase();
                    if (p === 'google') providerStr = "구글";
                    else if (p === 'kakao') providerStr = "카카오";
                    else if (p === 'naver') providerStr = "네이버";
                    else providerStr = u.provider;
                }
                const membershipTier = (u.membership_tier === 'premium' || u.grade === 'A' || u.grade === 'B') ? '프리미엄' : '일반';
                let expiryStr = "무제한";
                if (u.membership_expires_at) {
                    const expDate = new Date(u.membership_expires_at);
                    const offset = expDate.getTimezoneOffset();
                    const local = new Date(expDate.getTime() - (offset*60*1000));
                    expiryStr = local.toISOString().split('T')[0];
                }
                const upgradeReq = u.upgrade_requested ? "요청중" : "N";
                const signUpDate = u.created_at ? new Date(u.created_at).toISOString().split('T')[0] : "";
                return [
                    idx + 1,
                    u.email || "",
                    providerStr,
                    membershipTier,
                    expiryStr,
                    upgradeReq,
                    signUpDate
                ];
            });
            let csvContent = "\uFEFF";
            csvContent += headers.join(",") + "\r\n";
            rows.forEach(row => {
                const escapedRow = row.map(val => {
                    const strVal = String(val);
                    if (strVal.includes(",") || strVal.includes("\"") || strVal.includes("\n")) {
                        return `"${strVal.replace(/"/g, '""')}"`;
                    }
                    return strVal;
                });
                csvContent += escapedRow.join(",") + "\r\n";
            });
            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `경공매시스템_회원리스트_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
        window.exportUsersToCSV = exportUsersToCSV;
        window.approveUpgradeRequest = approveUpgradeRequest;
        window.saveUserCurationConfig = saveUserCurationConfig;
        // 등업 요청 반려 액션
        async function denyUpgradeRequest(userId) {
            if (!confirm("해당 회원의 등업 요청을 반려하시겠습니까? (등급 및 기간은 유지되며 요청 상태만 초기화됩니다)")) return;
            try {
                const { error } = await supabaseClient
                    .from('user_profiles')
                    .update({
                        upgrade_requested: false,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', userId);
                if (error) throw error;
                alert("등업 신청이 반려 처리되었습니다.");
                loadUsersList();
            } catch (err) {
                console.error("등업 반려 실패", err);
                alert("반려 처리에 실패하였습니다.");
            }
        }
        // 모의입찰 데이터 목록 실시간 로드
        async function loadMockBidsList() {
            const tbody = document.getElementById("mock-bid-list-tbody");
            if (!tbody) return;
            try {
                const { data: bids, error: bidErr } = await supabaseClient
                    .from('mock_bids')
                    .select('*')
                    .order('created_at', { ascending: false });
                if (bidErr) throw bidErr;
                if (!bids || bids.length === 0) {
                    tbody.innerHTML = `
                        <tr>
                            <td colspan="5" class="p-8 text-center text-slate-400 font-bold">현재 등록된 모의입찰 참여 내역이 없습니다.</td>
                        </tr>
                    `;
                    return;
                }
                // properties와 user_profiles를 fetch해서 메모리 매핑
                const propertyIds = [...new Set(bids.map(b => b.property_id))];
                const userIds = [...new Set(bids.map(b => b.user_id))];
                const { data: props } = await supabaseClient
                    .from('properties')
                    .select('id, address, auction_no')
                    .in('id', propertyIds);
                const { data: profiles } = await supabaseClient
                    .from('user_profiles')
                    .select('id, email')
                    .in('id', userIds);
                const propMap = {};
                if (props) {
                    props.forEach(p => propMap[p.id] = p);
                }
                const userMap = {};
                if (profiles) {
                    profiles.forEach(u => userMap[u.id] = u);
                }
                tbody.innerHTML = bids.map(b => {
                    const prop = propMap[b.property_id] || { address: '알 수 없는 매물', auction_no: '-' };
                    const user = userMap[b.user_id] || { email: '알 수 없는 사용자' };
                    const dateStr = b.created_at ? new Date(b.created_at).toLocaleString('ko-KR') : '-';
                    return `
                        <tr class="border-b border-slate-100 hover:bg-slate-50/50">
                            <td class="p-3 text-slate-800 font-extrabold select-all">${user.email}</td>
                            <td class="p-3 text-slate-600">
                                <div class="font-extrabold text-slate-800 truncate max-w-[280px]">${prop.address}</div>
                                <div class="text-[10px] text-slate-400 mt-0.5">${prop.auction_no}</div>
                            </td>
                            <td class="p-3 text-right font-mono text-rose-600 font-black">${formatKRW(b.bid_price)}</td>
                            <td class="p-3 text-center font-mono text-slate-455 text-[10.5px]">${dateStr}</td>
                            <td class="p-3 text-center">
                                <button onclick="deleteMockBid(${b.property_id}, '${b.user_id}')" class="bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-600 font-bold px-2 py-1 rounded text-[10px] transition-all">삭제</button>
                            </td>
                        </tr>
                    `;
                }).join('');
            } catch (err) {
                console.error("모의입찰 목록 조회 실패", err);
                tbody.innerHTML = `
                    <tr>
                        <td colspan="5" class="p-8 text-center text-rose-500 font-black">
                            <i class="fa-solid fa-triangle-exclamation"></i> 모의입찰 정보를 조회할 수 없습니다.
                        </td>
                    </tr>
                `;
            }
        }
        // 모의입찰 기록 강제 삭제
        async function deleteMockBid(propertyId, userId) {
            if (!confirm("해당 회원의 가상 모의입찰 기록을 삭제하시겠습니까?")) return;
            try {
                const { error } = await supabaseClient
                    .from('mock_bids')
                    .delete()
                    .eq('property_id', propertyId)
                    .eq('user_id', userId);
                if (error) throw error;
                alert("가상 모의입찰 기록이 정상적으로 삭제 처리되었습니다.");
                loadMockBidsList();
            } catch (err) {
                console.error("모의입찰 삭제 실패", err);
                alert("기록 삭제 처리에 실패하였습니다.");
            }
        }
        // 전문가 상담 신청 데이터 목록 실시간 로드
        async function loadConsultationsList() {
            const tbody = document.getElementById("consultation-list-tbody");
            if (!tbody) return;
            try {
                const { data: list, error: err } = await supabaseClient
                    .from('expert_consultations')
                    .select('*')
                    .order('created_at', { ascending: false });
                if (err) throw err;
                if (!list || list.length === 0) {
                    tbody.innerHTML = `
                        <tr>
                            <td colspan="6" class="p-8 text-center text-slate-400 font-bold">현재 접수된 전문가 상담 신청 내역이 없습니다.</td>
                        </tr>
                    `;
                    return;
                }
                const propertyIds = [...new Set(list.map(b => b.property_id))].filter(Boolean);
                const userIds = [...new Set(list.map(b => b.user_id))].filter(Boolean);
                let props = [];
                if (propertyIds.length > 0) {
                    const { data, error } = await supabaseClient
                        .from('properties')
                        .select('id, address, auction_no')
                        .in('id', propertyIds);
                    if (!error && data) {
                        props = data;
                    }
                }
                let profiles = [];
                if (userIds.length > 0) {
                    const { data, error } = await supabaseClient
                        .from('user_profiles')
                        .select('id, email')
                        .in('id', userIds);
                    if (!error && data) {
                        profiles = data;
                    }
                }
                const propMap = {};
                props.forEach(p => {
                    if (p && p.id) {
                        propMap[p.id] = p;
                    }
                });
                const userMap = {};
                profiles.forEach(u => {
                    if (u && u.id) {
                        userMap[u.id] = u;
                    }
                });
                tbody.innerHTML = list.map(c => {
                    const prop = propMap[c.property_id] || { address: '알 수 없는 매물', auction_no: '-' };
                    const user = userMap[c.user_id] || { email: '알 수 없는 사용자' };
                    const dateStr = c.created_at ? new Date(c.created_at).toLocaleString('ko-KR') : '-';
                    const statusClass = c.status === 'completed' ? 'bg-emerald-50 text-emeraldSuccess border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse';
                    const statusText = c.status === 'completed' ? '완료' : '대기 중';
                    return `
                        <tr class="border-b border-slate-100 hover:bg-slate-50/50">
                            <td class="p-3 text-slate-800 font-extrabold select-all">${user.email || '알 수 없는 사용자'}</td>
                            <td class="p-3 text-slate-600">
                                <div class="font-extrabold text-slate-800 truncate max-w-[200px]">${prop.address || '알 수 없는 매물'}</div>
                                <div class="text-[10px] text-slate-400 mt-0.5">${prop.auction_no || '-'}</div>
                            </td>
                            <td class="p-3 text-slate-700 font-extrabold">${c.expert_name || '-'}</td>
                            <td class="p-3 text-center">
                                <span class="border text-[9px] font-black px-1.5 py-0.5 rounded ${statusClass}">${statusText}</span>
                            </td>
                            <td class="p-3 text-center font-mono text-slate-455 text-[10.5px]">${dateStr}</td>
                            <td class="p-3 text-center flex justify-center gap-1">
                                <button onclick="toggleConsultationStatus(${c.id}, '${c.status}')" class="bg-blue-50 border border-blue-200 hover:bg-blue-100 text-royalBlue font-bold px-2 py-1 rounded text-[10px] transition-all">
                                    ${c.status === 'completed' ? '대기 전환' : '처리 완료'}
                                </button>
                                <button onclick="deleteConsultation(${c.id})" class="bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-600 font-bold px-2 py-1 rounded text-[10px] transition-all">삭제</button>
                            </td>
                        </tr>
                    `;
                }).join('');
            } catch (err) {
                console.error("전문가 상담 목록 조회 실패", err);
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" class="p-8 text-center text-rose-500 font-black">
                            <i class="fa-solid fa-triangle-exclamation"></i> 전문가 상담 신청 정보를 조회할 수 없습니다.
                        </td>
                    </tr>
                `;
            }
        }
        // 상담 상태 토글
        async function toggleConsultationStatus(id, currentStatus) {
            const nextStatus = currentStatus === 'completed' ? 'pending' : 'completed';
            try {
                const { error } = await supabaseClient
                    .from('expert_consultations')
                    .update({ status: nextStatus })
                    .eq('id', id);
                if (error) throw error;
                loadConsultationsList();
            } catch (err) {
                console.error("상담 상태 변경 실패:", err);
                alert("상태 변경 처리에 실패하였습니다.");
            }
        }
        // 상담 기록 삭제
        async function deleteConsultation(id) {
            if (!confirm("해당 전문가 상담 신청 기록을 삭제하시겠습니까?")) return;
            try {
                const { error } = await supabaseClient
                    .from('expert_consultations')
                    .delete()
                    .eq('id', id);
                if (error) throw error;
                alert("상담 신청 기록이 정상적으로 삭제 처리되었습니다.");
                loadConsultationsList();
            } catch (err) {
                console.error("상담 기록 삭제 실패:", err);
                alert("기록 삭제 처리에 실패하였습니다.");
            }
        }
        // 예외 방어용 수동 회원 강제 등록
        async function registerUserManually() {
            const email = document.getElementById("new-user-email").value.trim();
            if (!email) {
                alert("이메일 주소를 입력해 주십시오.");
                return;
            }
            try {
                // Supabase auth.users에서 이 이메일의 유저 ID를 찾아 가져오거나, 
                // 없으면 가상의 유니크 UUID로 생성하여 user_profiles에 강제 바인딩합니다.
                // 보통 이미 Supabase auth에 가입한 유저가 존재하지만 user_profiles에 행이 유실된 경우를 위함입니다.
                // 임시 가상 UUID 생성
                const tempUuid = '00000000-0000-0000-0000-' + Math.floor(Math.random() * 1000000000000).toString().padStart(12, '0');
                const { error } = await supabaseClient
                    .from('user_profiles')
                    .insert({
                        id: tempUuid,
                        email: email,
                        grade: 'C',
                        updated_at: new Date().toISOString()
                    });
                if (error) throw error;
                alert("수동 회원이 'C등급'으로 성공적으로 신규 등록되었습니다. 목록에서 권한 등급을 상향시켜 주십시오.");
                document.getElementById("new-user-email").value = "";
                loadUsersList();
            } catch (err) {
                console.error("수동 등록 실패", err);
                alert("회원 등록에 실패하였습니다. 이미 존재하는 이메일이거나 데이터베이스 오류입니다.");
            }
        }
        // SQL 코드 복사
        function copySQLCode() {
            const code = document.getElementById("sql-code-block").innerText;
            navigator.clipboard.writeText(code).then(() => {
                alert("SQL 셋업 구문이 클립보드에 전체 복사되었습니다.");
            }).catch(err => {
                console.error("복사 실패", err);
            });
        }
        // 🔑 어드민 로그인 보안 관리
        function checkAdminAuth() {
            const logged = localStorage.getItem("admin_logged");
            if (logged === "true") {
                const overlay = document.getElementById("admin-login-overlay");
                if (overlay) overlay.classList.add("hidden");
                const badge = document.getElementById("admin-user-badge");
                if (badge) {
                    badge.innerText = "hl1oex@gmail.com (시스템관리자)";
                    badge.classList.remove("hidden");
                }
                const logoutBtn = document.getElementById("admin-logout-btn");
                if (logoutBtn) logoutBtn.classList.remove("hidden");
                loadAdSettings();
                loadUsersList();
            } else {
                const overlay = document.getElementById("admin-login-overlay");
                if (overlay) overlay.classList.remove("hidden");
                const badge = document.getElementById("admin-user-badge");
                if (badge) badge.classList.add("hidden");
                const logoutBtn = document.getElementById("admin-logout-btn");
                if (logoutBtn) logoutBtn.classList.add("hidden");
            }
        }
        async function adminLogin() {
            const email = document.getElementById("login-email").value.trim();
            const pw = document.getElementById("login-password").value;
            try {
                const { data, error } = await supabaseClient
                    .from("admin_config")
                    .select("*");
                if (error) throw error;
                let adminEmail = "hl1oex@gmail.com";
                let adminPw = "123456";
                if (data && data.length > 0) {
                    const emailConfig = data.find(c => c.key === "admin_email");
                    const pwConfig = data.find(c => c.key === "admin_password");
                    if (emailConfig) adminEmail = emailConfig.value;
                    if (pwConfig) adminPw = pwConfig.value;
                }
                if (email === adminEmail && pw === adminPw) {
                    localStorage.setItem("admin_email", adminEmail);
                    localStorage.setItem("admin_password", adminPw);
                    localStorage.setItem("admin_logged", "true");
                    checkAdminAuth();
                } else {
                    alert("관리자 계정명 또는 비밀번호가 올바르지 않습니다.");
                }
            } catch (err) {
                console.error("관리자 DB 인증 실패, 로컬 스토리지로 폴백하여 로그인 검증을 진행합니다.", err);
                const backupEmail = localStorage.getItem("admin_email") || "hl1oex@gmail.com";
                const backupPw = localStorage.getItem("admin_password") || "123456";
                if (email === backupEmail && pw === backupPw) {
                    localStorage.setItem("admin_logged", "true");
                    checkAdminAuth();
                } else {
                    alert("관리자 계정명 또는 비밀번호가 올바르지 않습니다.");
                }
            }
        }
        function adminLogout() {
            localStorage.removeItem("admin_logged");
            window.location.reload();
        }
        // 🎨 배너 이미지 리소스 탐색기
        let tempSelectedImage = "";
        function openImageExplorer() {
            tempSelectedImage = "";
            const items = document.querySelectorAll(".explorer-item");
            items.forEach(el => el.className = "border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 cursor-pointer hover:border-royalBlue hover:shadow-sm p-1.5 space-y-1 explorer-item");
            const modal = document.getElementById("image-explorer-modal");
            if (modal) modal.classList.remove("hidden");
        }
        function closeImageExplorer() {
            const modal = document.getElementById("image-explorer-modal");
            if (modal) modal.classList.add("hidden");
        }
        function selectExplorerImage(path) {
            tempSelectedImage = path;
            const items = document.querySelectorAll(".explorer-item");
            items.forEach(el => el.className = "border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 cursor-pointer hover:border-royalBlue hover:shadow-sm p-1.5 space-y-1 explorer-item");
            let targetId = "explorer-img-1";
            if (path.includes("floorplan")) targetId = "explorer-img-2";
            else if (path.includes("favicon")) targetId = "explorer-img-3";
            const el = document.getElementById(targetId);
            if (el) {
                el.className = "border border-royalBlue ring-2 ring-royalBlue/15 bg-blue-50/20 rounded-2xl overflow-hidden cursor-pointer p-1.5 space-y-1 explorer-item";
            }
        }
        function applyExplorerImage(path) {
            const input = document.getElementById("ad-image-url");
            if (input) input.value = path;
            const type = document.querySelector('input[name="ad_type"]:checked').value;
            updatePreview(type);
            closeImageExplorer();
        }
        function confirmExplorerImage() {
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
            
            // 가입일 바인딩
            let createdStr = "정보 없음";
            if (user.created_at) {
                const cDate = new Date(user.created_at);
                createdStr = cDate.toLocaleDateString('ko-KR') + " " + cDate.toLocaleTimeString('ko-KR');
            }
            document.getElementById("detail-modal-created").innerText = createdStr;

            // 텔레그램 연동 정보 바인딩
            document.getElementById("detail-modal-telegram").innerText = user.telegram_chat_id || "미연동";

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
        }

        // ✈️ 텔레그램 설정 로드 및 동기화
        async function loadTelegramAdminSettings() {
            try {
                const { data, error } = await supabaseClient
                    .from('admin_config')
                    .select('*');
                if (error) throw error;
                if (data && data.length > 0) {
                    const alertEnabled = data.find(c => c.key === 'telegram_alert_enabled');
                    const alertDday = data.find(c => c.key === 'alert_d_day_enabled');
                    const alertUnderbid = data.find(c => c.key === 'alert_underbid_enabled');
                    
                    document.getElementById('tg-alert-global-toggle').checked = alertEnabled ? alertEnabled.value === 'true' : true;
                    document.getElementById('tg-alert-dday-toggle').checked = alertDday ? alertDday.value === 'true' : true;
                    document.getElementById('tg-alert-underbid-toggle').checked = alertUnderbid ? alertUnderbid.value === 'true' : true;
                }
            } catch (err) {
                console.error("텔레그램 어드민 설정 로드 실패", err);
            }
        }

        // ✈️ 텔레그램 설정 변경 사항 DB 저장
        async function saveTelegramAdminSettings() {
            const alertEnabled = document.getElementById('tg-alert-global-toggle').checked ? 'true' : 'false';
            const alertDday = document.getElementById('tg-alert-dday-toggle').checked ? 'true' : 'false';
            const alertUnderbid = document.getElementById('tg-alert-underbid-toggle').checked ? 'true' : 'false';
            
            try {
                const updates = [
                    { key: 'telegram_alert_enabled', value: alertEnabled },
                    { key: 'alert_d_day_enabled', value: alertDday },
                    { key: 'alert_underbid_enabled', value: alertUnderbid }
                ];
                
                for (const u of updates) {
                    const { error } = await supabaseClient
                        .from('admin_config')
                        .upsert({ key: u.key, value: u.value }, { onConflict: 'key' });
                    if (error) throw error;
                }
                console.log("텔레그램 자동 발송 설정 저장 완료");
            } catch (err) {
                console.error("텔레그램 어드민 설정 저장 실패", err);
                alert("설정 저장에 실패했습니다.");
            }
        }

        // ✈️ 사용자명이나 Chat ID 기반으로 실제 텔레그램 Chat ID를 해결하는 헬퍼 함수
        async function resolveTelegramChatId(botToken, identifier) {
            if (!identifier) return null;
            if (/^\d+$/.test(identifier) || /^\-\d+$/.test(identifier)) {
                return identifier;
            }
            
            const cleanUsername = identifier.replace(/^@/, '').trim().toLowerCase();
            if (!cleanUsername) return null;
            
            try {
                const res = await fetch(`https://api.telegram.org/bot${botToken}/getUpdates?offset=-10`);
                if (!res.ok) throw new Error("Telegram API Error");
                const body = await res.json();
                if (body.ok && body.result) {
                    for (let i = body.result.length - 1; i >= 0; i--) {
                        const update = body.result[i];
                        const message = update.message || update.edited_message || update.channel_post;
                        if (message && message.from) {
                            const fromUser = message.from.username || "";
                            if (fromUser.toLowerCase() === cleanUsername) {
                                return message.from.id.toString();
                            }
                        }
                    }
                }
            } catch (err) {
                console.warn("Telegram getUpdates를 통한 Chat ID 해결 실패", err);
            }
            return null;
        }

        // ✈️ 기획 알림 테마 변경 시 메시지 컴파일
        async function onTelegramThemeChange() {
            const theme = document.getElementById("tg-theme-select").value;
            const textarea = document.getElementById("tg-theme-message");
            if (!theme) {
                textarea.value = "";
                return;
            }
            textarea.value = "⏳ 매물 데이터를 분석하고 템플릿을 생성하는 중입니다...";
            try {
                let query = supabaseClient.from('properties').select('*');
                const todayStr = new Date().toISOString().split('T')[0];
                
                if (theme === 'dday') {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    const tomorrowStr = tomorrow.toISOString().split('T')[0];
                    query = query.gte('bidding_date', todayStr).lte('bidding_date', tomorrowStr);
                } else if (theme === 'hot') {
                    query = query.gte('score', 80).order('score', { ascending: false });
                } else if (theme === 'small') {
                    query = query.lte('minimum_bid', 100000000).order('minimum_bid', { ascending: true });
                }
                
                const { data, error } = await query.limit(50);
                if (error) throw error;
                
                let filtered = data || [];
                if (theme === 'underbid') {
                    filtered = filtered.filter(p => p.appraised_value && p.minimum_bid && p.minimum_bid < p.appraised_value);
                }
                
                const targetItems = filtered.slice(0, 5);
                if (targetItems.length === 0) {
                    textarea.value = `📢 [부동산경공매 검색시스템] 기획 추천 알림\n\n현재 해당 테마에 부합하는 분석 매물이 존재하지 않습니다.`;
                    return;
                }
                
                let msg = `📢 [부동산경공매 검색시스템] 기획 추천 알림\n\n`;
                const themeNames = {
                    'dday': '⏰ 입찰 기일 임박 매물 (D-1/D-Day)',
                    'underbid': '📉 회차 갱신 유찰 매물',
                    'hot': '🏆 AI 투자 추천 매물 (Score 80점 이상)',
                    'small': '💰 소액 투자 추천 매물 (최저가 1억 이하)'
                };
                msg += `📌 오늘의 추천 테마: ${themeNames[theme] || '특선 매물'}\n`;
                msg += `회원님을 위한 엄선된 핵심 경공매 매물 정보를 공유해 드립니다.\n\n`;
                
                targetItems.forEach((p, idx) => {
                    const priceRatio = p.appraised_value ? Math.round((p.minimum_bid / p.appraised_value) * 100) : 100;
                    const discountRate = 100 - priceRatio;
                    
                    msg += `${idx + 1}. [${p.source === 'court' || p.source === 'court_etc' ? '경매' : '공매'}] ${p.auction_no || p.case_number || '관리번호'}\n`;
                    msg += `- 소재지: ${p.address || '--'}\n`;
                    msg += `- 감정가: ${(p.appraised_value || 0).toLocaleString()}원\n`;
                    msg += `- 최저가: ${(p.minimum_bid || 0).toLocaleString()}원 (${discountRate}% 저감)\n`;
                    msg += `- 입찰일: ${p.bidding_date || '--'}\n`;
                    msg += `- AI 투자등급: ${p.grade || 'C'}등급 (Score: ${p.score || 0}점)\n`;
                    msg += `- 상세분석 확인하기: https://myauction.r-e.kr/?detail=${p.id}\n\n`;
                });
                
                msg += `※ 상세 권리분석 및 예상배당표, LTV 금융 시뮬레이션은 공식 사이트 상세페이지에서 즉시 확인하실 수 있습니다.`;
                textarea.value = msg;
            } catch (err) {
                console.error("테마 매물 로딩 실패", err);
                textarea.value = "⚠️ 매물 데이터를 불러오는 도중 오류가 발생했습니다.";
            }
        }

        // ✈️ 테마별 기획 알림 즉시 단체 발송 실행
        async function sendTelegramThemeAlert() {
            const gradeTarget = document.getElementById("tg-target-grade").value;
            const message = document.getElementById("tg-theme-message").value.trim();
            if (!message) {
                alert("전송할 메시지 본문을 입력해 주십시오.");
                return;
            }
            
            if (!confirm("선택하신 회원들에게 메시지를 즉시 일괄 발송하시겠습니까?")) return;
            
            try {
                const { data: configData, error: configErr } = await supabaseClient
                    .from('admin_config')
                    .select('*')
                    .eq('key', 'telegram_bot_token')
                    .single();
                if (configErr) throw configErr;
                const botToken = configData ? configData.value : '8852350792:AAEBPlA64GIztJa8XeSrqQd4-1rvJbvsOiA';
                
                let userQuery = supabaseClient.from('user_profiles').select('*').not('telegram_chat_id', 'is', null);
                const { data: users, error: userErr } = await userQuery;
                if (userErr) throw userErr;
                
                let targets = (users || []).filter(u => u.telegram_chat_id && u.telegram_chat_id.trim() !== "");
                if (gradeTarget === 'premium') {
                    targets = targets.filter(u => u.membership_tier === 'premium');
                } else if (gradeTarget === 'A') {
                    targets = targets.filter(u => u.grade === 'A');
                }
                
                if (targets.length === 0) {
                    alert("발송 대상 회원(텔레그램 연동 완료)이 존재하지 않습니다.");
                    return;
                }
                
                let successCount = 0;
                let failCount = 0;
                
                alert(`총 ${targets.length}명의 회원에게 텔레그램 발송을 시작합니다.`);
                
                for (const user of targets) {
                    const identifier = user.telegram_chat_id;
                    const chatId = await resolveTelegramChatId(botToken, identifier);
                    
                    if (!chatId) {
                        await supabaseClient.from('telegram_alert_logs').insert({
                            user_id: user.id,
                            alert_type: 'theme_manual',
                            message: message,
                            status: 'fail',
                            error_message: `사용자명(${identifier})에 해당하는 Chat ID 조회 실패`
                        });
                        failCount++;
                        continue;
                    }
                    
                    try {
                        const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                chat_id: chatId,
                                text: message
                            })
                        });
                        
                        const tgResult = await tgRes.json();
                        if (tgResult.ok) {
                            await supabaseClient.from('telegram_alert_logs').insert({
                                user_id: user.id,
                                alert_type: 'theme_manual',
                                message: message,
                                status: 'success'
                            });
                            successCount++;
                        } else {
                            await supabaseClient.from('telegram_alert_logs').insert({
                                user_id: user.id,
                                alert_type: 'theme_manual',
                                message: message,
                                status: 'fail',
                                error_message: tgResult.description || '텔레그램 API 전송 거부'
                            });
                            failCount++;
                        }
                    } catch (err) {
                        await supabaseClient.from('telegram_alert_logs').insert({
                            user_id: user.id,
                            alert_type: 'theme_manual',
                            message: message,
                            status: 'fail',
                            error_message: err.message || '네트워크 통신 오류'
                        });
                        failCount++;
                    }
                }
                
                alert(`텔레그램 단체 발송이 완료되었습니다.\n성공: ${successCount}건 / 실패: ${failCount}건`);
                loadTelegramLogs(1);
            } catch (err) {
                console.error("텔레그램 기획 알림 발송 중 에러 발생", err);
                alert("알림 발송 처리 중 에러가 발생했습니다: " + err.message);
            }
        }

        // ✈️ 당일 알림 배치 수동 즉시 실행 트리거
        async function triggerTelegramNotifierManual() {
            if (!confirm("당일 알림 배치 작업을 수동으로 즉시 구동하시겠습니까?")) return;
            
            try {
                const { data: configData, error: configErr } = await supabaseClient
                    .from('admin_config')
                    .select('*');
                if (configErr) throw configErr;
                
                const alertEnabled = configData.find(c => c.key === 'telegram_alert_enabled')?.value === 'true';
                const alertDday = configData.find(c => c.key === 'alert_d_day_enabled')?.value === 'true';
                const alertUnderbid = configData.find(c => c.key === 'alert_underbid_enabled')?.value === 'true';
                const botToken = configData.find(c => c.key === 'telegram_bot_token')?.value || '8852350792:AAEBPlA64GIztJa8XeSrqQd4-1rvJbvsOiA';
                
                if (!alertEnabled) {
                    alert("⚠️ 텔레그램 알림 발송 설정이 전면 비활성화 상태입니다. 설정을 켜고 실행해 주십시오.");
                    return;
                }
                
                if (!alertDday && !alertUnderbid) {
                    alert("⚠️ 세부 알림 설정이 모두 비활성화 상태입니다.");
                    return;
                }
                
                const { data: users, error: userErr } = await supabaseClient
                    .from('user_profiles')
                    .select('*')
                    .not('telegram_chat_id', 'is', null);
                if (userErr) throw userErr;
                
                const tgUsers = (users || []).filter(u => u.telegram_chat_id && u.telegram_chat_id.trim() !== "");
                if (tgUsers.length === 0) {
                    alert("텔레그램 수신처가 등록된 회원이 존재하지 않습니다.");
                    return;
                }
                
                const { data: favorites, error: favErr } = await supabaseClient
                    .from('user_favorites')
                    .select('user_id, property_id');
                if (favErr) throw favErr;
                
                if (!favorites || favorites.length === 0) {
                    alert("등록된 회원 관심 매물이 존재하지 않습니다.");
                    return;
                }
                
                const favPropIds = [...new Set(favorites.map(f => f.property_id))];
                const { data: properties, error: propErr } = await supabaseClient
                    .from('properties')
                    .select('*')
                    .in('id', favPropIds);
                if (propErr) throw propErr;
                
                const propMap = new Map(properties.map(p => [p.id, p]));
                
                const today = new Date();
                today.setHours(0,0,0,0);
                const tomorrow = new Date(today.getTime() + 86400000);
                const tomorrowStr = tomorrow.toISOString().split('T')[0];
                const todayStr = today.toISOString().split('T')[0];
                
                let sendCount = 0;
                let failCount = 0;
                
                alert("관심 매물 분석 및 알림 전송을 구동합니다.");
                
                for (const user of tgUsers) {
                    const userFavs = favorites.filter(f => f.user_id === user.id);
                    if (userFavs.length === 0) continue;
                    
                    const identifier = user.telegram_chat_id;
                    let chat_id = null;
                    
                    for (const fav of userFavs) {
                        const p = propMap.get(fav.property_id);
                        if (!p) continue;
                        
                        let isDdayAlert = false;
                        let isUnderbidAlert = false;
                        
                        if (alertDday && p.bidding_date === tomorrowStr) {
                            isDdayAlert = true;
                        }
                        
                        let isUpdatedToday = false;
                        if (p.updated_at) {
                            const updateDate = new Date(p.updated_at).toISOString().split('T')[0];
                            if (updateDate === todayStr) {
                                isUpdatedToday = true;
                            }
                        }
                        if (alertUnderbid && isUpdatedToday && p.appraised_value && p.minimum_bid && p.minimum_bid < p.appraised_value) {
                            isUnderbidAlert = true;
                        }
                        
                        if (!isDdayAlert && !isUnderbidAlert) continue;
                        
                        if (!chat_id) {
                            chat_id = await resolveTelegramChatId(botToken, identifier);
                        }
                        
                        const alertType = isDdayAlert ? 'D-Day 임박' : '유찰 감지';
                        if (!chat_id) {
                            await supabaseClient.from('telegram_alert_logs').insert({
                                user_id: user.id,
                                property_id: p.id,
                                alert_type: alertType,
                                message: `[발송대기] 텔레그램 사용자명(${identifier})에 매핑되는 Chat ID 조회 불가`,
                                status: 'fail',
                                error_message: '사용자명에 해당하는 Chat ID를 찾을 수 없습니다.'
                            });
                            failCount++;
                            continue;
                        }
                        
                        let alertText = "";
                        if (isDdayAlert) {
                            alertText = `⏰ [부동산경공매 검색시스템] 관심 매물 입찰 기일 임박(D-1) 안내\n\n`;
                            alertText += `회원님이 등록하신 관심 매물의 입찰 기일이 내일로 다가왔습니다. 놓치지 마시고 확인하세요!\n\n`;
                        } else {
                            alertText = `📉 [부동산경공매 검색시스템] 관심 매물 유찰(가격 저감) 발생 안내\n\n`;
                            alertText += `회원님이 등록하신 관심 매물이 유찰되어 최저입찰가가 하락하여 업데이트되었습니다. 새로운 기회를 확인해 보세요!\n\n`;
                        }
                        
                        const priceRatio = p.appraised_value ? Math.round((p.minimum_bid / p.appraised_value) * 100) : 100;
                        const discountRate = 100 - priceRatio;
                        
                        alertText += `▶ [${p.source === 'court' || p.source === 'court_etc' ? '경매' : '공매'}] ${p.auction_no || p.case_number || '관리번호'}\n`;
                        alertText += `- 소재지: ${p.address || '--'}\n`;
                        alertText += `- 감정가: ${(p.appraised_value || 0).toLocaleString()}원\n`;
                        alertText += `- 최저가: ${(p.minimum_bid || 0).toLocaleString()}원 (${discountRate}% 저감)\n`;
                        alertText += `- 입찰일: ${p.bidding_date || '--'}\n`;
                        alertText += `- AI 추천등급: ${p.grade || 'C'}등급 (Score: ${p.score || 0}점)\n`;
                        alertText += `- 상세분석 바로가기: https://myauction.r-e.kr/?detail=${p.id}\n\n`;
                        alertText += `※ 자세한 소요자금 계획서 계산과 AI 명도 리포트는 공식 사이트에서 실시간 조회 가능합니다.`;
                        
                        try {
                            const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    chat_id: chat_id,
                                    text: alertText
                                })
                            });
                            
                            const tgResult = await tgRes.json();
                            if (tgResult.ok) {
                                await supabaseClient.from('telegram_alert_logs').insert({
                                    user_id: user.id,
                                    property_id: p.id,
                                    alert_type: alertType,
                                    message: alertText,
                                    status: 'success'
                                });
                                sendCount++;
                            } else {
                                await supabaseClient.from('telegram_alert_logs').insert({
                                    user_id: user.id,
                                    property_id: p.id,
                                    alert_type: alertType,
                                    message: alertText,
                                    status: 'fail',
                                    error_message: tgResult.description || '텔레그램 API 전송 거부'
                                });
                                failCount++;
                            }
                        } catch (err) {
                            await supabaseClient.from('telegram_alert_logs').insert({
                                user_id: user.id,
                                property_id: p.id,
                                alert_type: alertType,
                                message: alertText,
                                status: 'fail',
                                error_message: err.message || '네트워크 오류'
                            });
                            failCount++;
                        }
                    }
                }
                
                alert(`⚡ 수동 알림 배치 작업 완료!\n분석/전송 성공: ${sendCount}건 / 실패 및 대기: ${failCount}건`);
                loadTelegramLogs(1);
            } catch (err) {
                console.error("수동 배치 실행 중 에러 발생", err);
                alert("배치 실행 도중 에러가 발생했습니다: " + err.message);
            }
        }

        // ✈️ 텔레그램 발송 이력 로그 로드 및 페이징
        let currentTgLogsPage = 1;
        const tgLogsPerPage = 10;

        async function loadTelegramLogs(page) {
            currentTgLogsPage = page;
            const from = (page - 1) * tgLogsPerPage;
            const to = from + tgLogsPerPage - 1;
            
            const tbody = document.getElementById("tg-logs-tbody");
            if (!tbody) return;
            
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="p-8 text-center text-slate-400">
                        <i class="fa-solid fa-spinner animate-spin"></i> 발송 로그를 불러오는 중입니다...
                    </td>
                </tr>
            `;
            
            try {
                const { count, error: countErr } = await supabaseClient
                    .from('telegram_alert_logs')
                    .select('*', { count: 'exact', head: true });
                if (countErr) throw countErr;
                
                const totalCount = count || 0;
                const totalPages = Math.max(1, Math.ceil(totalCount / tgLogsPerPage));
                
                const { data, error } = await supabaseClient
                    .from('telegram_alert_logs')
                    .select('*, user_profiles(email), properties(auction_no, address, source)')
                    .order('id', { ascending: false })
                    .range(from, to);
                if (error) throw error;
                
                document.getElementById("tg-logs-page-info").innerText = `${page} / ${totalPages} 페이지 (총 ${totalCount}건)`;
                document.getElementById("tg-logs-prev-btn").disabled = page === 1;
                document.getElementById("tg-logs-next-btn").disabled = page === totalPages;
                
                if (!data || data.length === 0) {
                    tbody.innerHTML = `
                        <tr>
                            <td colspan="6" class="p-8 text-center text-slate-400">발송 로그가 존재하지 않습니다.</td>
                        </tr>
                    `;
                    return;
                }
                
                tbody.innerHTML = data.map((log, idx) => {
                    const rowNo = totalCount - from - idx;
                    const email = log.user_profiles ? log.user_profiles.email : '알수없음';
                    
                    let propInfo = '-';
                    if (log.properties) {
                        const sourceKo = log.properties.source === 'court' || log.properties.source === 'court_etc' ? '경매' : '공매';
                        propInfo = `[${sourceKo}] ${log.properties.auction_no || '번호미상'}`;
                    }
                    
                    let statusBadge = '';
                    if (log.status === 'success') {
                        statusBadge = `<span class="bg-emerald-50 text-emeraldSuccess border border-emerald-200 px-2 py-0.5 rounded text-[10px]">성공</span>`;
                    } else {
                        statusBadge = `<span class="bg-rose-50 text-rose-600 border border-rose-200 px-2 py-0.5 rounded text-[10px] cursor-help" title="${log.error_message || ''}">실패</span>`;
                    }
                    
                    const dateStr = new Date(log.created_at).toLocaleString('ko-KR', { hour12: false });
                    
                    return `
                        <tr class="border-b border-slate-100 hover:bg-slate-50/50">
                            <td class="p-3 text-center text-slate-500 font-bold">${rowNo}</td>
                            <td class="p-3 text-slate-800 font-extrabold select-all">${email}</td>
                            <td class="p-3 text-slate-700 font-bold">${propInfo}</td>
                            <td class="p-3 text-center font-black text-slate-600">${log.alert_type}</td>
                            <td class="p-3 text-center">
                                <div class="flex flex-col items-center gap-1">
                                    ${statusBadge}
                                    ${log.status === 'fail' ? `<span class="text-[9px] text-rose-500 max-w-[200px] truncate leading-tight">${log.error_message || ''}</span>` : ''}
                                </div>
                            </td>
                            <td class="p-3 text-center font-mono text-slate-455 text-[10.5px]">${dateStr}</td>
                        </tr>
                    `;
                }).join('');
                
            } catch (err) {
                console.error("텔레그램 발송 로그 조회 실패", err);
                tbody.innerHTML = `
                    <tr>
                        <td colspan="6" class="p-8 text-center text-rose-500 font-black">
                            <i class="fa-solid fa-triangle-exclamation"></i> 발송 로그 정보를 조회할 수 없습니다.
                        </td>
                    </tr>
                `;
            }
        }

        // ✈️ 텔레그램 발송 이력 로그 페이지 변경
        function changeTgLogsPage(direction) {
            const nextPage = currentTgLogsPage + direction;
            if (nextPage < 1) return;
            loadTelegramLogs(nextPage);
        }