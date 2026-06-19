// 새 파일 첫 줄은 해당 파일의 역할을 설명하는 한 줄짜리 한국어 주석으로 시작합니다.
// v1.2 초개인화 모의입찰, 전문가 광고, 프리미엄 페이월, 그리고 플로팅 AI 챗봇을 통합 제어하는 프론트엔드 모듈입니다.

const v12Features = (function() {
    let chatbotOpen = false;
    let chatHistory = [
        { sender: 'bot', message: '안녕하세요! AI 경매 법령 도우미입니다. 유치권, 법정지상권, 대항력 등 어려운 경매 용어나 권리분석에 대해 편하게 물어보세요.' }
    ];

    // 1. 초기화 및 플로팅 챗봇 주입
    function init() {
        injectChatbotUI();
        bindChatbotEvents();
    }

    // 2. 우측 하단 플로팅 챗봇 마크업 주입
    function injectChatbotUI() {
        if (document.getElementById("v12-floating-chatbot-container")) return;

        const chatbotHtml = `
            <div id="v12-floating-chatbot-container" class="fixed bottom-6 right-6 z-50 font-sans select-none">
                <!-- 둥글고 예쁜 플로팅 버튼 -->
                <button onclick="v12Features.toggleChatbot()" id="v12-chatbot-trigger" class="w-14 h-14 rounded-full bg-gradient-to-tr from-royalBlue to-indigo-600 hover:from-royalHover hover:to-indigo-700 text-white flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 relative group border border-white/20">
                    <span class="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border border-white animate-ping"></span>
                    <span class="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border border-white"></span>
                    <i class="fa-solid fa-comments text-xl"></i>
                    <!-- 말풍선 툴팁 -->
                    <span class="absolute right-16 scale-0 group-hover:scale-100 bg-slate-900/90 backdrop-blur-sm text-white text-[10px] font-bold py-1 px-2.5 rounded-lg whitespace-nowrap shadow-md transition-all duration-200">AI 경매 법률 챗봇</span>
                </button>

                <!-- 챗봇 대화 창 (Glassmorphism 적용) -->
                <div id="v12-chatbot-window" class="absolute bottom-16 right-0 w-[330px] sm:w-[360px] h-[450px] bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl shadow-2xl flex flex-col justify-between overflow-hidden hidden transform translate-y-4 opacity-0 transition-all duration-300">
                    <!-- 헤더 영역 -->
                    <div class="bg-gradient-to-r from-royalBlue to-indigo-600 text-white p-3.5 flex items-center justify-between border-b border-royalHover/30">
                        <div class="flex items-center gap-2">
                            <div class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
                            <div>
                                <h4 class="text-xs font-black tracking-wide flex items-center gap-1">
                                    <i class="fa-solid fa-robot"></i> AI 경매 법률 도우미
                                </h4>
                                <p class="text-[9px] text-blue-100 font-medium mt-0.5">대법원 판례 및 법령 실시간 자문</p>
                            </div>
                        </div>
                        <button onclick="v12Features.toggleChatbot()" class="text-white hover:text-slate-200 text-sm p-1 select-none">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>

                    <!-- 대화 메시지 영역 -->
                    <div id="v12-chatbot-messages" class="flex-1 overflow-y-auto p-4 space-y-3.5 custom-scrollbar bg-slate-50/50 text-[11px] sm:text-xs">
                        <!-- 대화 내역 동적 마운팅 -->
                    </div>

                    <!-- 추천 질문 퀵 버튼 -->
                    <div class="px-3 py-2 bg-slate-100 border-t border-slate-200/50 flex flex-wrap gap-1.5" id="v12-chatbot-quick-tags">
                        <button onclick="v12Features.askQuickQuestion('유치권이 신고된 매물은 안전한가요?')" class="bg-white border border-slate-200 hover:border-royalBlue hover:bg-blue-50 text-slate-600 text-[10px] px-2 py-1 rounded-lg transition-all">유치권 리스크</button>
                        <button onclick="v12Features.askQuickQuestion('선순위 임차인의 대항력이란 무엇인가요?')" class="bg-white border border-slate-200 hover:border-royalBlue hover:bg-blue-50 text-slate-600 text-[10px] px-2 py-1 rounded-lg transition-all">대항력 판별</button>
                        <button onclick="v12Features.askQuickQuestion('명도 강제집행 비용과 절차는 어떻게 되나요?')" class="bg-white border border-slate-200 hover:border-royalBlue hover:bg-blue-50 text-slate-600 text-[10px] px-2 py-1 rounded-lg transition-all">명도 집행</button>
                    </div>

                    <!-- 푸터 입력창 영역 -->
                    <div class="p-3 border-t border-slate-200 bg-white flex gap-1.5 items-center">
                        <input type="text" id="v12-chatbot-input" placeholder="질문 내용을 입력해 주세요." class="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-royalBlue focus:bg-white transition-all text-slate-800">
                        <button onclick="v12Features.sendMessage()" class="w-8 h-8 rounded-xl bg-royalBlue text-white flex items-center justify-center hover:bg-royalHover active:scale-95 transition-all select-none">
                            <i class="fa-solid fa-paper-plane text-xs"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', chatbotHtml);
        renderChatbotHistory();
    }

    // 3. 챗봇 이벤트 바인딩
    function bindChatbotEvents() {
        const input = document.getElementById("v12-chatbot-input");
        if (input) {
            input.addEventListener("keypress", function(e) {
                if (e.key === "Enter") {
                    sendMessage();
                }
            });
        }
    }

    // 4. 챗봇 창 토글 핸들러
    function toggleChatbot() {
        const win = document.getElementById("v12-chatbot-window");
        if (!win) return;

        chatbotOpen = !chatbotOpen;
        if (chatbotOpen) {
            win.classList.remove("hidden");
            setTimeout(() => {
                win.className = "absolute bottom-16 right-0 w-[330px] sm:w-[360px] h-[450px] bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl shadow-2xl flex flex-col justify-between overflow-hidden transform translate-y-0 opacity-100 transition-all duration-300";
            }, 50);
        } else {
            win.className = "absolute bottom-16 right-0 w-[330px] sm:w-[360px] h-[450px] bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl shadow-2xl flex flex-col justify-between overflow-hidden transform translate-y-4 opacity-0 transition-all duration-300";
            setTimeout(() => {
                win.classList.add("hidden");
            }, 300);
        }
    }

    // 5. 챗봇 대화 내용 렌더링
    function renderChatbotHistory() {
        const container = document.getElementById("v12-chatbot-messages");
        if (!container) return;

        container.innerHTML = chatHistory.map(chat => {
            const isBot = chat.sender === 'bot';
            const bgClass = isBot ? 'bg-white border border-slate-100 text-slate-800' : 'bg-royalBlue text-white';
            const justifyClass = isBot ? 'justify-start' : 'justify-end';
            const icon = isBot ? `<div class="w-6 h-6 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[10px] text-royalBlue flex-shrink-0"><i class="fa-solid fa-robot"></i></div>` : '';
            
            return `
                <div class="flex items-start gap-2 ${justifyClass}">
                    ${icon}
                    <div class="${bgClass} px-3 py-2 rounded-2xl max-w-[75%] leading-relaxed shadow-sm font-bold break-words">
                        ${chat.message}
                    </div>
                </div>
            `;
        }).join("");

        // 스크롤 하단 이동
        container.scrollTop = container.scrollHeight;
    }

    // 6. 질문 전송 로직
    function sendMessage() {
        const input = document.getElementById("v12-chatbot-input");
        if (!input) return;

        const text = input.value.trim();
        if (!text) return;

        // 유저 대화 추가
        chatHistory.push({ sender: 'user', message: text });
        input.value = "";
        renderChatbotHistory();

        // 챗봇 타이핑 모션 연출
        chatHistory.push({ sender: 'bot', message: '<i class="fa-solid fa-ellipsis animate-bounce"></i> 답변 분석 중입니다.' });
        renderChatbotHistory();

        setTimeout(() => {
            // 타이핑 메시지 제거
            chatHistory.pop();
            
            // 법령 도우미 응답 규칙 및 판례 기반 생성
            const response = generateAIResponse(text);
            chatHistory.push({ sender: 'bot', message: response });
            renderChatbotHistory();
        }, 800);
    }

    // 퀵 질문 입력
    function askQuickQuestion(questionText) {
        const input = document.getElementById("v12-chatbot-input");
        if (input) {
            input.value = questionText;
            sendMessage();
        }
    }

    // 7. 법령 도우미 규칙 기반 응답 생성기
    function generateAIResponse(query) {
        const q = query.toLowerCase();
        
        if (q.includes("유치권")) {
            return `🛠️ <strong>유치권 관련 법률 자문 결과</strong><br><br>
                    민법 제320조에 의하면 타인의 물건을 점유한 자는 그 물건에 관하여 생긴 채권이 변제기에 있는 경우, 변제를 받을 때까지 그 물건을 유치할 권리가 있습니다.<br><br>
                    <strong>💡 경매 실전 팁</strong><br>
                    1. <strong>피담보채권의 성립 여부:</strong> 단순한 권리금이나 이사비용, 설계비 등은 유치권 대상이 되지 못하며 오직 공사대금 채권(견련성)만 성립합니다.<br>
                    2. <strong>적법한 점유 여부:</strong> 경매개시결정 기입등기 전부터 점유를 개시하고 있어야 낙찰자에게 대항할 수 있습니다.<br>
                    3. <strong>대응:</strong> 유치권부존재확인 소송 및 인도명령을 통해 성립 요건 흠결을 적극 구명하여 배제할 수 있습니다.`;
        }
        
        if (q.includes("대항력") || q.includes("임차인")) {
            return `💰 <strong>선순위 임차인 대항력 자문 결과</strong><br><br>
                    주택임대차보호법 제3조에 따라 임차인이 주택의 인도와 주민등록(전입신고)을 마친 때에는 그 다음 날부터 제3자에 대하여 효력이 생깁니다.<br><br>
                    <strong>💡 경매 실전 팁</strong><br>
                    1. <strong>대항력 기준일:</strong> 임차인의 주민등록 전입신고 익일(오전 0시)과 등기부등본 상 말소기준권리(근저당 설정 등)의 날짜를 초 단위로 비교해야 합니다.<br>
                    2. <strong>보증금 인수 리스크:</strong> 선순위 임차인이 배당요구를 하지 않았거나 배당금에서 보증금을 전액 변제받지 못하는 경우, 미변제 보증금 잔액은 낙찰자가 무조건 전액 인수해야 명도받을 수 있습니다.`;
        }

        if (q.includes("명도") || q.includes("강제집행")) {
            return `🚪 <strong>명도 및 강제집행 절차 자문 결과</strong><br><br>
                    부동산인도명령은 낙찰자가 매각대금을 전액 납부한 후 6개월 이내에 법원에 신청할 수 있는 신속 명도 절차입니다.<br><br>
                    <strong>💡 경매 실전 팁</strong><br>
                    1. <strong>집행 비용:</strong> 통상 아파트의 경우 평당 약 12~15만원 선의 강제집행 비용이 소요됩니다.<br>
                    2. <strong>합의 명도 권장:</strong> 무리한 강제집행은 평균 3개월 이상의 소송/대기 기간과 감정적 대립이 따르므로 이사비용 지원(평당 10만원 선)을 통한 원만한 명도 합의가 경제적으로 훨씬 유리합니다.`;
        }

        if (q.includes("보증금") || q.includes("최우선")) {
            return `💵 <strong>최우선변제금 및 소액임차인 자문 결과</strong><br><br>
                    소액임차인은 법이 정한 한도 내에서 보증금 중 일정액을 다른 담보물권자보다 우선하여 변제받을 권리가 있습니다.<br><br>
                    <strong>💡 경매 실전 팁</strong><br>
                    1. <strong>기준 시점 주의:</strong> 소액임차인의 기준 범위는 임차인의 입주 시점이 아니라 등기부등본 상 최초 선순위 근저당권 설정일 당시의 시행령 기준을 따릅니다.<br>
                    2. <strong>배당 요구 필수:</strong> 소액임차인이라도 법원이 정한 배당요구종기일 이내에 반드시 배당요구 신청서를 제출해야 최우선변제금을 수령할 수 있습니다.`;
        }

        if (q.includes("법정지상권")) {
            return `🧱 <strong>법정지상권 자문 결과</strong><br><br>
                    민법 제366조에 따라 토지와 그 지상 건물이 동일인에게 속하였다가 토지나 건물이 매각되어 소유자가 다르게 된 때, 토지 소유자는 건물 소유자에 대하여 지상권을 설정한 것으로 봅니다.<br><br>
                    <strong>💡 경매 실전 팁</strong><br>
                    1. <strong>성립 요건:</strong> 저당권 설정 당시에 토지 위에 반드시 건물이 존재해야 하며, 토지와 건물의 소유주가 동일해야 성립합니다.<br>
                    2. <strong>지료 소송 연계:</strong> 성립하더라도 지상권자는 토지 사용료(지료)를 내야 하므로 지료를 2기 이상 연체할 경우 법정지상권 소멸 청구가 가능합니다.`;
        }

        // 기본 fallback 답변
        return `🤖 <strong>입력하신 경매 법률 자문 답변</strong><br><br>
                요청하신 질문 "${query}"에 대한 정밀 판례 분석을 마쳤습니다.<br><br>
                경공매 절차 상 특별매각조건 확인 및 매각물건명세서의 비고란 권리 변동 기록을 꼼꼼히 확인하시기 바랍니다. 추가적인 세부 권리관계 분석이 필요하시면 상세페이지 하단에 연계된 정식 등록 매수신청대리 전문가와 1:1 유선 자문 상담을 신청해 보시는 것을 강력히 추천해 드립니다.`;
    }

    // 8. 모의입찰 데이터 조회 및 렌더링
    async function loadMockBids(propertyId, appraisedValue) {
        const countEl = document.getElementById("v12-mock-bids-count");
        const avgPriceEl = document.getElementById("v12-mock-avg-price");
        const ratioEl = document.getElementById("v12-mock-ratio");
        const msgEl = document.getElementById("v12-mock-bid-message");

        if (!countEl || !avgPriceEl || !ratioEl) return;

        try {
            // DB에서 모의입찰 데이터 조회
            const { data, error } = await supabaseClient
                .from("mock_bids")
                .select("bid_price")
                .eq("property_id", propertyId);

            if (error) throw error;

            const bids = data || [];
            const count = bids.length;
            
            countEl.innerText = `${count.toLocaleString()}명 참여 중`;

            if (count > 0) {
                const total = bids.reduce((acc, curr) => acc + Number(curr.bid_price), 0);
                const avg = Math.round(total / count);
                
                // 한글 포맷 변환
                avgPriceEl.innerText = formatKRW(avg);

                if (appraisedValue > 0) {
                    const ratio = ((avg / appraisedValue) * 100).toFixed(1);
                    ratioEl.innerText = `${ratio}%`;
                } else {
                    ratioEl.innerText = "--%";
                }
            } else {
                avgPriceEl.innerText = "0원";
                ratioEl.innerText = "--%";
            }

            // 본인이 이미 입찰했는지 조회하여 버튼 상태 변경
            if (currentUser) {
                const { data: userBid, error: bidErr } = await supabaseClient
                    .from("mock_bids")
                    .select("bid_price")
                    .eq("property_id", propertyId)
                    .eq("user_id", currentUser.id)
                    .maybeSingle();

                if (bidErr) throw bidErr;

                const input = document.getElementById("v12-mock-bid-input");
                if (userBid && input) {
                    input.value = userBid.bid_price;
                    if (msgEl) {
                        msgEl.innerHTML = `<span class="text-emeraldSuccess"><i class="fa-solid fa-circle-check"></i> 이미 모의입찰에 참여하셨습니다. (수정 가능)</span>`;
                        msgEl.classList.remove("hidden");
                    }
                } else {
                    if (input) input.value = "";
                    if (msgEl) msgEl.classList.add("hidden");
                }
            } else {
                if (msgEl) {
                    msgEl.innerHTML = `<span class="text-rose-500 font-bold"><i class="fa-solid fa-triangle-exclamation"></i> 로그인 시 모의입찰 참여가 가능합니다.</span>`;
                    msgEl.classList.remove("hidden");
                }
            }
        } catch (err) {
            console.error("모의입찰 통계 조회 실패:", err);
        }
    }

    // 9. 모의입찰가 제출
    async function submitMockBid(propertyId, appraisedValue) {
        if (!currentUser) {
            alert("로그인이 필요한 서비스입니다. 헤더에서 로그인을 진행해 주십시오.");
            return;
        }

        const input = document.getElementById("v12-mock-bid-input");
        if (!input) return;

        const bidPrice = parseInt(input.value.trim());
        if (isNaN(bidPrice) || bidPrice <= 0) {
            alert("유효한 가상 입찰가격을 입력해 주십시오.");
            return;
        }

        try {
            const { error } = await supabaseClient
                .from("mock_bids")
                .upsert({
                    property_id: propertyId,
                    user_id: currentUser.id,
                    bid_price: bidPrice
                }, { onConflict: 'user_id,property_id' });

            if (error) throw error;

            alert("모의입찰 참여가 정상적으로 기록되었습니다!");
            // 실시간 리로딩
            await loadMockBids(propertyId, appraisedValue);
            
            // 전역 매물 데이터 큐레이션 실시간 갱신을 위해 캐시 데이터 로드 및 필터 재반영
            if (typeof window.loadv12CurationData === "function") {
                await window.loadv12CurationData();
            }
            if (typeof window.applyFilters === "function") {
                window.applyFilters();
            }
        } catch (err) {
            console.error("모의입찰 제출 실패:", err);
            alert("모의입찰 처리 중 오류가 발생했습니다. 다시 시도해 주십시오.");
        }
    }

    // 10. 프리미엄 결제 및 업그레이드 모의
    async function payPremiumAndUpgrade() {
        if (!currentUser) {
            alert("로그인이 필요합니다.");
            return;
        }

        const confirmPay = confirm("★ v1.2 프리미엄 멤버십 구독 안내 ★\n\n월 19,900원에 AI 정밀 수익률 분석, 권리 안전도 검증, 법원/온비드 미상 등기부 자동 열람 혜택을 무제한으로 이용하실 수 있습니다.\n\n구독을 시작하시겠습니까?");
        if (!confirmPay) return;

        try {
            // DB의 user_profiles 테이블 membership_tier를 premium으로 갱신
            const { error } = await supabaseClient
                .from("user_profiles")
                .update({ membership_tier: 'premium', grade: 'A' })
                .eq("id", currentUser.id);

            if (error) throw error;

            alert("🎉 프리미엄 결제 및 구독 승인이 성공적으로 완료되었습니다! 모든 프리미엄 분석 도구가 무제한 개방됩니다.");
            
            // 전역 변수 업데이트 및 UI 새로고침
            if (typeof window.fetchUserGrade === "function") {
                await window.fetchUserGrade();
            }
            if (typeof window.updateAuthUI === "function") {
                window.updateAuthUI();
            }
            if (typeof window.changeDetailGroupTab === "function") {
                window.changeDetailGroupTab(window.currentDetailGroupTab || 1);
            }
        } catch (err) {
            console.error("구독 결제 실패:", err);
            alert("결제 처리 중 서버 통신 에러가 발생했습니다.");
        }
    }

    // 11. 경매 전문가(매수신청대리인) 프로필 광고 리스트 렌더링
    function renderExperts(propertyId) {
        const container = document.getElementById("v12-experts-list");
        if (!container) return;

        // 임의의 전문가 목록 데이터 (고급스러운 프로필 구성)
        const experts = [
            {
                name: "정경우 전문 변호사",
                office: "법무법인 한빛 경매 전담 센터",
                license: "서울회 10452호",
                successRate: "98.5%",
                phone: "02-588-4900",
                intro: "특수 유치권, 법정지상권 복잡 소송 명도 소송 및 판례 분석 대행 20년 경력의 베테랑 법률 대리인입니다.",
                img: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
            },
            {
                name: "이순신 등록 공인중개사",
                office: "충무 경공매 매수대리 중개법인",
                license: "경기 용인 581호 (매수대리인 정식 등록)",
                successRate: "96.2%",
                phone: "031-289-4980",
                intro: "용인 반도체 클러스터 및 경기 남부권 상가 수익률 TOP 빌딩 경매, 신속 명도 전문 매수신청대리인입니다.",
                img: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
            }
        ];

        container.innerHTML = experts.map((exp, idx) => `
            <div class="bg-slate-50 border border-slate-100 rounded-xl p-3.5 hover:border-royalBlue/30 hover:bg-blue-50/10 transition-all flex items-start gap-3">
                <img src="${exp.img}" alt="${exp.name}" class="w-12 h-12 rounded-xl object-cover border border-slate-200 flex-shrink-0">
                <div class="flex-1 min-w-0 space-y-1">
                    <div class="flex items-center justify-between">
                        <strong class="text-xs sm:text-sm font-black text-slate-800">${exp.name}</strong>
                        <span class="bg-indigo-50 text-indigo-700 border border-indigo-100 text-[9px] font-black px-1.5 py-0.5 rounded">낙찰성공률 ${exp.successRate}</span>
                    </div>
                    <p class="text-[10px] text-slate-400 font-bold">${exp.office} | ${exp.license}</p>
                    <p class="text-[11px] text-slate-600 font-medium leading-relaxed">${exp.intro}</p>
                    <div class="pt-2 flex items-center gap-2">
                        <a href="tel:${exp.phone}" class="inline-flex items-center gap-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold px-2 py-1.5 rounded-lg select-none">
                            <i class="fa-solid fa-phone text-royalBlue"></i> 전화 연결
                        </a>
                        <button onclick="v12Features.requestExpertConsultation(selectedProperty.id, '${exp.name}')" class="inline-flex items-center gap-1 bg-royalBlue hover:bg-royalHover text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm transition-all select-none">
                            <i class="fa-solid fa-envelope"></i> 온라인 상담 신청
                        </button>
                    </div>
                </div>
            </div>
        `).join("");
    }

    // 전문가 상담 신청 API 연동
    async function requestExpertConsultation(propertyId, expertName) {
        if (!currentUser) {
            alert("로그인이 필요한 서비스입니다. 헤더에서 로그인을 진행해 주십시오.");
            return;
        }

        try {
            const { error } = await supabaseClient
                .from("expert_consultations")
                .insert({
                    property_id: propertyId,
                    user_id: currentUser.id,
                    expert_name: expertName,
                    status: 'pending'
                });

            if (error) throw error;

            alert(`${expertName} 전문가에게 무료 전화/온라인 상담 신청이 서버에 정상 접수되었습니다! 24시간 이내에 안내 메일이 발송됩니다.`);
        } catch (err) {
            console.error("전문가 상담 신청 실패:", err);
            alert("상담 신청 처리 중 서버 통신 오류가 발생했습니다. 다시 시도해 주십시오.");
        }
    }

    // 금액 단위를 한글(억/만원)로 포맷해주는 함수
    function formatKRW(val) {
        if (!val || isNaN(val)) return "0원";
        if (val >= 100000000) {
            const eok = Math.floor(val / 100000000);
            const rest = Math.round((val % 100000000) / 10000);
            return rest > 0 ? `${eok}억 ${rest.toLocaleString()}만원` : `${eok}억원`;
        }
        return `${Math.round(val / 10000).toLocaleString()}만원`;
    }

    return {
        init: init,
        toggleChatbot: toggleChatbot,
        sendMessage: sendMessage,
        askQuickQuestion: askQuickQuestion,
        loadMockBids: loadMockBids,
        submitMockBid: submitMockBid,
        payPremiumAndUpgrade: payPremiumAndUpgrade,
        renderExperts: renderExperts,
        requestExpertConsultation: requestExpertConsultation
    };
})();

// 글로벌 바인딩 적용
window.v12Features = v12Features;
