// 깉 뙆씪 泥 以꾩 빐떦 뙆씪쓽 뿭븷쓣 꽕紐낇븯뒗 븳 以꾩쭨由 븳援뼱 二쇱꽍쑝濡 떆옉빀땲떎.
// v1.2 珥덇컻씤솕 紐⑥쓽엯李, 쟾臾멸 愿묎퀬, 봽由щ몄뾼 럹씠썡, 洹몃━怨 뵆濡쒗똿 AI 梨쀫큸쓣 넻빀 젣뼱븯뒗 봽濡좏듃뿏뱶 紐⑤뱢엯땲떎.

const v12Features = (function() {
    let chatbotOpen = false;
    let chatHistory = [
        { sender: 'bot', message: '븞뀞븯꽭슂! AI 寃쎈ℓ 踰뺣졊 룄슦誘몄엯땲떎. 쑀移섍텒, 踰뺤젙吏긽沅, 빆젰 벑 뼱젮슫 寃쎈ℓ 슜뼱굹 沅뚮━遺꾩꽍뿉 빐 렪븯寃 臾쇱뼱蹂댁꽭슂.' }
    ];

    // 1. 珥덇린솕 諛 뵆濡쒗똿 梨쀫큸 二쇱엯
    function init() {
        injectChatbotUI();
        bindChatbotEvents();
    }

    // 2. 슦痢 븯떒 뵆濡쒗똿 梨쀫큸 留덊겕뾽 二쇱엯
    function injectChatbotUI() {
        if (document.getElementById("v12-floating-chatbot-container")) return;

        const chatbotHtml = `
            <div id="v12-floating-chatbot-container" class="fixed bottom-6 right-6 z-50 font-sans select-none">
                <!-- 뫁湲怨 삁걶 뵆濡쒗똿 踰꾪듉 -->
                <button onclick="v12Features.toggleChatbot()" id="v12-chatbot-trigger" class="w-14 h-14 rounded-full bg-gradient-to-tr from-royalBlue to-indigo-600 hover:from-royalHover hover:to-indigo-700 text-white flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-all duration-300 relative group border border-white/20">
                    <span class="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border border-white animate-ping"></span>
                    <span class="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border border-white"></span>
                    <i class="fa-solid fa-comments text-xl"></i>
                    <!-- 留먰뭾꽑 댋똻 -->
                    <span class="absolute right-16 scale-0 group-hover:scale-100 bg-slate-900/90 backdrop-blur-sm text-white text-[10px] font-bold py-1 px-2.5 rounded-lg whitespace-nowrap shadow-md transition-all duration-200">AI 寃쎈ℓ 踰뺣쪧 梨쀫큸</span>
                </button>

                <!-- 梨쀫큸 솕 李 (Glassmorphism 쟻슜) -->
                <div id="v12-chatbot-window" class="absolute bottom-16 right-0 w-[330px] sm:w-[360px] h-[450px] bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl shadow-2xl flex flex-col justify-between overflow-hidden hidden transform translate-y-4 opacity-0 transition-all duration-300">
                    <!-- 뿤뜑 쁺뿭 -->
                    <div class="bg-gradient-to-r from-royalBlue to-indigo-600 text-white p-3.5 flex items-center justify-between border-b border-royalHover/30">
                        <div class="flex items-center gap-2">
                            <div class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
                            <div>
                                <h4 class="text-xs font-black tracking-wide flex items-center gap-1">
                                    <i class="fa-solid fa-robot"></i> AI 寃쎈ℓ 踰뺣쪧 룄슦誘
                                </h4>
                                <p class="text-[9px] text-blue-100 font-medium mt-0.5">踰뺤썝 뙋濡 諛 踰뺣졊 떎떆媛 옄臾</p>
                            </div>
                        </div>
                        <button onclick="v12Features.toggleChatbot()" class="text-white hover:text-slate-200 text-sm p-1 select-none">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>

                    <!-- 솕 硫붿떆吏 쁺뿭 -->
                    <div id="v12-chatbot-messages" class="flex-1 overflow-y-auto p-4 space-y-3.5 custom-scrollbar bg-slate-50/50 text-[11px] sm:text-xs">
                        <!-- 솕 궡뿭 룞쟻 留덉슫똿 -->
                    </div>

                    <!-- 異붿쿇 吏덈Ц  踰꾪듉 -->
                    <div class="px-3 py-2 bg-slate-100 border-t border-slate-200/50 flex flex-wrap gap-1.5" id="v12-chatbot-quick-tags">
                        <button onclick="v12Features.askQuickQuestion('쑀移섍텒씠 떊怨좊맂 留ㅻЪ 븞쟾븳媛슂?')" class="bg-white border border-slate-200 hover:border-royalBlue hover:bg-blue-50 text-slate-600 text-[10px] px-2 py-1 rounded-lg transition-all">쑀移섍텒 由ъ뒪겕</button>
                        <button onclick="v12Features.askQuickQuestion('꽑닚쐞 엫李⑥씤쓽 빆젰씠 臾댁뾿씤媛슂?')" class="bg-white border border-slate-200 hover:border-royalBlue hover:bg-blue-50 text-slate-600 text-[10px] px-2 py-1 rounded-lg transition-all">빆젰 뙋蹂</button>
                        <button onclick="v12Features.askQuickQuestion('紐낅룄 媛뺤젣吏묓뻾 鍮꾩슜怨 젅李⑤뒗 뼱뼸寃 릺굹슂?')" class="bg-white border border-slate-200 hover:border-royalBlue hover:bg-blue-50 text-slate-600 text-[10px] px-2 py-1 rounded-lg transition-all">紐낅룄 吏묓뻾</button>
                    </div>

                    <!-- 뫖꽣 엯젰李 쁺뿭 -->
                    <div class="p-3 border-t border-slate-200 bg-white flex gap-1.5 items-center">
                        <input type="text" id="v12-chatbot-input" placeholder="吏덈Ц 궡슜쓣 엯젰빐 二쇱꽭슂." class="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-royalBlue focus:bg-white transition-all text-slate-800">
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

    // 3. 梨쀫큸 씠踰ㅽ듃 諛붿씤뵫
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

    // 4. 梨쀫큸 李 넗湲 빖뱾윭
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

    // 5. 梨쀫큸 솕 궡슜 젋뜑留
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

        // 뒪겕濡 븯떒 씠룞
        container.scrollTop = container.scrollHeight;
    }

    // 6. 吏덈Ц 쟾넚 濡쒖쭅
    function sendMessage() {
        const input = document.getElementById("v12-chatbot-input");
        if (!input) return;

        const text = input.value.trim();
        if (!text) return;

        // 쑀 솕 異붽
        chatHistory.push({ sender: 'user', message: text });
        input.value = "";
        renderChatbotHistory();

        // 梨쀫큸 씠븨 紐⑥뀡 뿰異
        chatHistory.push({ sender: 'bot', message: '<i class="fa-solid fa-ellipsis animate-bounce"></i> 떟蹂 遺꾩꽍 以묒엯땲떎.' });
        renderChatbotHistory();

        setTimeout(() => {
            // 씠븨 硫붿떆吏 젣嫄
            chatHistory.pop();
            
            // 踰뺣졊 룄슦誘 쓳떟 洹쒖튃 諛 뙋濡 湲곕컲 깮꽦
            const response = generateAIResponse(text);
            chatHistory.push({ sender: 'bot', message: response });
            renderChatbotHistory();
        }, 800);
    }

    //  吏덈Ц 엯젰
    function askQuickQuestion(questionText) {
        const input = document.getElementById("v12-chatbot-input");
        if (input) {
            input.value = questionText;
            sendMessage();
        }
    }

    // 7. 踰뺣졊 룄슦誘 洹쒖튃 湲곕컲 쓳떟 깮꽦湲
    function generateAIResponse(query) {
        const q = query.toLowerCase();
        
        if (q.includes("쑀移섍텒")) {
            return `윖좑툘 <strong>쑀移섍텒 愿젴 踰뺣쪧 옄臾 寃곌낵</strong><br><br>
                    誘쇰쾿 젣320議곗뿉 쓽븯硫 씤쓽 臾쇨굔쓣 젏쑀븳 옄뒗 洹 臾쇨굔뿉 愿븯뿬 깮湲 梨꾧텒씠 蹂젣湲곗뿉 엳뒗 寃쎌슦, 蹂젣瑜 諛쏆쓣 븣源뚯 洹 臾쇨굔쓣 쑀移섑븷 沅뚮━媛 엳뒿땲떎.<br><br>
                    <strong>윊 寃쎈ℓ 떎쟾 똻</strong><br>
                    1. <strong>뵾떞蹂댁콈沅뚯쓽 꽦由 뿬遺:</strong> 떒닚븳 沅뚮━湲덉씠굹 씠궗鍮꾩슜, 꽕怨꾨퉬 벑 쑀移섍텒 긽씠 릺吏 紐삵븯硫 삤吏 怨듭궗湲 梨꾧텒(寃щ젴꽦)留 꽦由쏀빀땲떎.<br>
                    2. <strong>쟻踰뺥븳 젏쑀 뿬遺:</strong> 寃쎈ℓ媛쒖떆寃곗젙 湲곗엯벑湲 쟾遺꽣 젏쑀瑜 媛쒖떆븯怨 엳뼱빞 굺李곗옄뿉寃 빆븷 닔 엳뒿땲떎.<br>
                    3. <strong>쓳:</strong> 쑀移섍텒遺議댁옱솗씤 냼넚 諛 씤룄紐낅졊쓣 넻빐 꽦由 슂嫄 씈寃곗쓣 쟻洹 援щ챸븯뿬 諛곗젣븷 닔 엳뒿땲떎.`;
        }
        
        if (q.includes("빆젰") || q.includes("엫李⑥씤")) {
            return `윊 <strong>꽑닚쐞 엫李⑥씤 빆젰 옄臾 寃곌낵</strong><br><br>
                    二쇳깮엫李⑤낫샇踰 젣3議곗뿉 뵲씪 엫李⑥씤씠 二쇳깮쓽 씤룄 二쇰쇰벑濡(쟾엯떊怨)쓣 留덉튇 븣뿉뒗 洹 떎쓬 궇遺꽣 젣3옄뿉 븯뿬 슚젰씠 깮源곷땲떎.<br><br>
                    <strong>윊 寃쎈ℓ 떎쟾 똻</strong><br>
                    1. <strong>빆젰 湲곗씪:</strong> 엫李⑥씤쓽 二쇰쇰벑濡 쟾엯떊怨 씡씪(삤쟾 0떆)怨 벑湲곕벑蹂 긽 留먯냼湲곗沅뚮━(洹쇱떦 꽕젙 벑)쓽 궇吏쒕 珥 떒쐞濡 鍮꾧탳빐빞 빀땲떎.<br>
                    2. <strong>蹂댁쬆湲 씤닔 由ъ뒪겕:</strong> 꽑닚쐞 엫李⑥씤씠 諛곕떦슂援щ 븯吏 븡븯嫄곕굹 諛곕떦湲덉뿉꽌 蹂댁쬆湲덉쓣 쟾븸 蹂젣諛쏆 紐삵븯뒗 寃쎌슦, 誘몃젣 蹂댁쬆湲 옍븸 굺李곗옄媛 臾댁“嫄 쟾븸 씤닔빐빞 紐낅룄諛쏆쓣 닔 엳뒿땲떎.`;
        }

        if (q.includes("紐낅룄") || q.includes("媛뺤젣吏묓뻾")) {
            return `윓 <strong>紐낅룄 諛 媛뺤젣吏묓뻾 젅李 옄臾 寃곌낵</strong><br><br>
                    遺룞궛씤룄紐낅졊 굺李곗옄媛 留ㅺ컖湲덉쓣 쟾븸 궔遺븳 썑 6媛쒖썡 씠궡뿉 踰뺤썝뿉 떊泥븷 닔 엳뒗 떊냽 紐낅룄 젅李⑥엯땲떎.<br><br>
                    <strong>윊 寃쎈ℓ 떎쟾 똻</strong><br>
                    1. <strong>吏묓뻾 鍮꾩슜:</strong> 넻긽 븘뙆듃쓽 寃쎌슦 룊떦 빟 12~15留뚯썝 꽑쓽 媛뺤젣吏묓뻾 鍮꾩슜씠 냼슂맗땲떎.<br>
                    2. <strong>빀쓽 紐낅룄 沅뚯옣:</strong> 臾대━븳 媛뺤젣吏묓뻾 룊洹 3媛쒖썡 씠긽쓽 냼넚/湲 湲곌컙怨 媛먯젙쟻 由쎌씠 뵲瑜대濡 씠궗鍮꾩슜 吏썝(룊떦 10留뚯썝 꽑)쓣 넻븳 썝留뚰븳 紐낅룄 빀쓽媛 寃쎌젣쟻쑝濡 썾뵮 쑀由ы빀땲떎.`;
        }

        if (q.includes("蹂댁쬆湲") || q.includes("理쒖슦꽑")) {
            return `윊 <strong>理쒖슦꽑蹂젣湲 諛 냼븸엫李⑥씤 옄臾 寃곌낵</strong><br><br>
                    냼븸엫李⑥씤 踰뺤씠 젙븳 븳룄 궡뿉꽌 蹂댁쬆湲 以 씪젙븸쓣 떎瑜 떞蹂대Ъ沅뚯옄蹂대떎 슦꽑븯뿬 蹂젣諛쏆쓣 沅뚮━媛 엳뒿땲떎.<br><br>
                    <strong>윊 寃쎈ℓ 떎쟾 똻</strong><br>
                    1. <strong>湲곗 떆젏 二쇱쓽:</strong> 냼븸엫李⑥씤쓽 湲곗 踰붿쐞뒗 엫李⑥씤쓽 엯二 떆젏씠 븘땲씪 벑湲곕벑蹂 긽 理쒖큹 꽑닚쐞 洹쇱떦沅 꽕젙씪 떦떆쓽 떆뻾졊 湲곗쓣 뵲由낅땲떎.<br>
                    2. <strong>諛곕떦 슂援 븘닔:</strong> 냼븸엫李⑥씤씠씪룄 踰뺤썝씠 젙븳 諛곕떦슂援ъ쥌湲곗씪 씠궡뿉 諛섎뱶떆 諛곕떦슂援 떊泥꽌瑜 젣異쒗빐빞 理쒖슦꽑蹂젣湲덉쓣 닔졊븷 닔 엳뒿땲떎.`;
        }

        if (q.includes("踰뺤젙吏긽沅")) {
            return `윧 <strong>踰뺤젙吏긽沅 옄臾 寃곌낵</strong><br><br>
                    誘쇰쾿 젣366議곗뿉 뵲씪 넗吏 洹 吏긽 嫄대Ъ씠 룞씪씤뿉寃 냽븯떎媛 넗吏굹 嫄대Ъ씠 留ㅺ컖릺뼱 냼쑀옄媛 떎瑜닿쾶 맂 븣, 넗吏 냼쑀옄뒗 嫄대Ъ 냼쑀옄뿉 븯뿬 吏긽沅뚯쓣 꽕젙븳 寃껋쑝濡 遊낅땲떎.<br><br>
                    <strong>윊 寃쎈ℓ 떎쟾 똻</strong><br>
                    1. <strong>꽦由 슂嫄:</strong> 떦沅 꽕젙 떦떆뿉 넗吏 쐞뿉 諛섎뱶떆 嫄대Ъ씠 議댁옱빐빞 븯硫, 넗吏 嫄대Ъ쓽 냼쑀二쇨 룞씪빐빞 꽦由쏀빀땲떎.<br>
                    2. <strong>吏猷 냼넚 뿰怨:</strong> 꽦由쏀븯뜑씪룄 吏긽沅뚯옄뒗 넗吏 궗슜猷(吏猷)瑜 궡빞 븯誘濡 吏猷뚮 2湲 씠긽 뿰泥댄븷 寃쎌슦 踰뺤젙吏긽沅 냼硫 泥援ш 媛뒫빀땲떎.`;
        }

        // 湲곕낯 fallback 떟蹂
        return `윣 <strong>엯젰븯떊 寃쎈ℓ 踰뺣쪧 옄臾 떟蹂</strong><br><br>
                슂泥븯떊 吏덈Ц "${query}"뿉 븳 젙諛 뙋濡 遺꾩꽍쓣 留덉낀뒿땲떎.<br><br>
                寃쎄났留 젅李 긽 듅蹂꾨ℓ媛곸“嫄 솗씤 諛 留ㅺ컖臾쇨굔紐낆꽭꽌쓽 鍮꾧퀬 沅뚮━ 蹂룞 湲곕줉쓣 瑗쇨세엳 솗씤븯떆湲 諛붾엻땲떎. 異붽쟻씤 꽭遺 沅뚮━愿怨 遺꾩꽍씠 븘슂븯떆硫 긽꽭럹씠吏 븯떒뿉 뿰怨꾨맂 젙떇 벑濡 留ㅼ닔떊泥由 쟾臾멸 1:1 쑀꽑 옄臾 긽떞쓣 떊泥빐 蹂댁떆뒗 寃껋쓣 媛뺣젰엳 異붿쿇빐 뱶由쎈땲떎.`;
    }

    // 8. 紐⑥쓽엯李 뜲씠꽣 議고쉶 諛 젋뜑留
    async function loadMockBids(propertyId, appraisedValue, minimumBid) {
        const countEl = document.getElementById("v12-mock-bids-count");
        const avgPriceEl = document.getElementById("v12-mock-avg-price");
        const ratioEl = document.getElementById("v12-mock-ratio");
        const msgEl = document.getElementById("v12-mock-bid-message");

        const appraisedEl = document.getElementById("v12-mock-appraised-value");
        const minimumEl = document.getElementById("v12-mock-minimum-bid");
        if (appraisedEl && appraisedValue) {
            appraisedEl.innerText = formatNumberWithCommas(appraisedValue) + "썝";
        }
        if (minimumEl && minimumBid) {
            minimumEl.innerText = formatNumberWithCommas(minimumBid) + "썝";
        }

        if (!countEl || !avgPriceEl || !ratioEl) return;

        try {
            // DB뿉꽌 紐⑥쓽엯李 뜲씠꽣 議고쉶
            const { data, error } = await supabaseClient
                .from("mock_bids")
                .select("bid_price")
                .eq("property_id", propertyId);

            if (error) throw error;

            const bids = data || [];
            const count = bids.length;
            
            countEl.innerText = `${count.toLocaleString()}紐 李몄뿬 以`;

            if (count > 0) {
                const total = bids.reduce((acc, curr) => acc + Number(curr.bid_price), 0);
                const avg = Math.round(total / count);
                
                // 븳湲 룷留 蹂솚
                avgPriceEl.innerText = formatKRW(avg);

                if (appraisedValue > 0) {
                    const ratio = ((avg / appraisedValue) * 100).toFixed(1);
                    ratioEl.innerText = `${ratio}%`;
                } else {
                    ratioEl.innerText = "--%";
                }
            } else {
                avgPriceEl.innerText = "0썝";
                ratioEl.innerText = "--%";
            }

            // 蹂몄씤씠 씠誘 엯李고뻽뒗吏 議고쉶븯뿬 踰꾪듉 긽깭 蹂寃
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
                    input.value = formatNumberWithCommas(userBid.bid_price);
                    updateMockBidSpread(parseInt(userBid.bid_price) || 0);
                    if (msgEl) {
                        msgEl.innerHTML = `<span class="text-emeraldSuccess"><i class="fa-solid fa-circle-check"></i> 씠誘 紐⑥쓽엯李곗뿉 李몄뿬븯뀲뒿땲떎. (닔젙 媛뒫)</span>`;
                        msgEl.classList.remove("hidden");
                    }
                } else {
                    if (input) input.value = "";
                    updateMockBidSpread(0);
                    if (msgEl) msgEl.classList.add("hidden");
                }
            } else {
                updateMockBidSpread(0);
                if (msgEl) {
                    msgEl.innerHTML = `<span class="text-rose-500 font-bold"><i class="fa-solid fa-triangle-exclamation"></i> 濡쒓렇씤 떆 紐⑥쓽엯李 李몄뿬媛 媛뒫빀땲떎.</span>`;
                    msgEl.classList.remove("hidden");
                }
            }
        } catch (err) {
            console.error("紐⑥쓽엯李 넻怨 議고쉶 떎뙣:", err);
        }
    }

    // 泥쒕떒쐞 肄ㅻ쭏 뿬띁 븿닔
    function formatNumberWithCommas(val) {
        const cleanVal = String(val).replace(/[^0-9]/g, '');
        if (!cleanVal) return '';
        return Number(cleanVal).toLocaleString();
    }

    // 紐⑥쓽엯李 엯젰 븘뱶 엯젰 빖뱾윭
    function handleMockBidInput(input) {
        const selectionStart = input.selectionStart;
        const oldLength = input.value.length;
        
        const formatted = formatNumberWithCommas(input.value);
        input.value = formatted;
        
        const newLength = formatted.length;
        const diff = newLength - oldLength;
        let newCursor = selectionStart + diff;
        input.setSelectionRange(newCursor, newCursor);
        
        const bidPrice = parseInt(formatted.replace(/,/g, '')) || 0;
        updateMockBidSpread(bidPrice);
    }

    // 紐⑥쓽엯李 븘슂 鍮꾩슜 떎떆媛 뒪봽젅뱶 슂빟 뿰룞
    function updateMockBidSpread(bidPrice) {
        const container = document.getElementById("v12-mock-bid-spread-container");
        if (!container) return;
        
        if (bidPrice <= 0) {
            container.classList.add("hidden");
            return;
        }
        
        container.classList.remove("hidden");
        
        // 痍⑤뱷꽭 슂쑉 援щ퀎 (ptype뿉 뵲씪 鍮꾩＜깮 4.6%, 二쇳깮 1.5%)
        let taxRate = 0.015;
        if (window.selectedProperty) {
            const ptype = (window.selectedProperty.ptype || "").toLowerCase();
            if (ptype.includes("긽媛") || ptype.includes("젏룷") || ptype.includes("洹쇰┛") || ptype.includes("넗吏") || ptype.includes("怨듭옣") || ptype.includes("鍮뚮뵫") || ptype.includes("湲고")) {
                taxRate = 0.046;
            }
        }
        
        const acquisitionTax = Math.floor(bidPrice * taxRate);
        const agencyFee = Math.floor(bidPrice * 0.005);
        const totalBudget = bidPrice + acquisitionTax + agencyFee;
        const loanAmount = Math.floor(bidPrice * 0.70);
        const cashRequired = Math.max(0, totalBudget - loanAmount);
        
        const taxEl = document.getElementById("v12-mock-spread-tax");
        const agencyEl = document.getElementById("v12-mock-spread-agency");
        const loanEl = document.getElementById("v12-mock-spread-loan");
        const totalEl = document.getElementById("v12-mock-spread-total");
        const cashEl = document.getElementById("v12-mock-spread-cash");
        
        if (taxEl) taxEl.innerText = formatKRW(acquisitionTax);
        if (agencyEl) agencyEl.innerText = "+ " + formatKRW(agencyFee);
        if (loanEl) loanEl.innerText = formatKRW(loanAmount);
        if (totalEl) totalEl.innerText = formatKRW(totalBudget);
        if (cashEl) cashEl.innerText = formatKRW(cashRequired);
    }

    // 9. 紐⑥쓽엯李곌 젣異
    async function submitMockBid(propertyId, appraisedValue) {
        if (!currentUser) {
            alert("濡쒓렇씤씠 븘슂븳 꽌鍮꾩뒪엯땲떎. 뿤뜑뿉꽌 濡쒓렇씤쓣 吏꾪뻾빐 二쇱떗떆삤.");
            return;
        }

        const input = document.getElementById("v12-mock-bid-input");
        if (!input) return;

        const bidPrice = parseInt(input.value.replace(/,/g, '').trim());
        if (isNaN(bidPrice) || bidPrice <= 0) {
            alert("쑀슚븳 媛긽 엯李곌寃⑹쓣 엯젰빐 二쇱떗떆삤.");
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

            alert("紐⑥쓽엯李 李몄뿬媛 젙긽쟻쑝濡 湲곕줉릺뿀뒿땲떎!");
            // 떎떆媛 由щ줈뵫
            await loadMockBids(propertyId, appraisedValue);
            
            // 쟾뿭 留ㅻЪ 뜲씠꽣 걧젅씠뀡 떎떆媛 媛깆떊쓣 쐞빐 罹먯떆 뜲씠꽣 濡쒕뱶 諛 븘꽣 옱諛섏쁺
            if (typeof window.loadv12CurationData === "function") {
                await window.loadv12CurationData();
            }
            if (typeof window.applyFilters === "function") {
                window.applyFilters();
            }
        } catch (err) {
            console.error("紐⑥쓽엯李 젣異 떎뙣:", err);
            alert("紐⑥쓽엯李 泥섎━ 以 삤瑜섍 諛쒖깮뻽뒿땲떎. 떎떆 떆룄빐 二쇱떗떆삤.");
        }
    }

    // 10. 봽由щ몄뾼 寃곗젣 諛 뾽洹몃젅씠뱶 紐⑥쓽
    async function payPremiumAndUpgrade() {
        if (!currentUser) {
            alert("濡쒓렇씤씠 븘슂빀땲떎.");
            return;
        }

        const confirmPay = confirm("쁾 v1.2 봽由щ몄뾼 硫ㅻ쾭떗 援щ룆 븞궡 쁾\n\n썡 19,900썝뿉 AI 젙諛 닔씡瑜 遺꾩꽍, 沅뚮━ 븞쟾룄 寃利, 踰뺤썝/삩鍮꾨뱶 誘몄긽 벑湲곕 옄룞 뿴엺 삙깮쓣 臾댁젣븳쑝濡 씠슜븯떎 닔 엳뒿땲떎.\n\n援щ룆쓣 떆옉븯떆寃좎뒿땲源?");
        if (!confirmPay) return;

        try {
            // DB쓽 user_profiles 뀒씠釉 membership_tier瑜 premium쑝濡 媛깆떊
            const { error } = await supabaseClient
                .from("user_profiles")
                .update({ membership_tier: 'premium', grade: 'A' })
                .eq("id", currentUser.id);

            if (error) throw error;

            alert("윃 봽由щ몄뾼 寃곗젣 諛 援щ룆 듅씤씠 꽦怨듭쟻쑝濡 셿猷뚮릺뿀뒿땲떎! 紐⑤뱺 봽由щ몄뾼 遺꾩꽍 룄援ш 臾댁젣븳 媛쒕갑맗땲떎.");
            
            // 쟾뿭 蹂닔 뾽뜲씠듃 諛 UI 깉濡쒓퀬移
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
            console.error("援щ룆 寃곗젣 떎뙣:", err);
            alert("寃곗젣 泥섎━ 以 꽌踰 넻떊 뿉윭媛 諛쒖깮뻽뒿땲떎.");
        }
    }

    // 11. 寃쎈ℓ 쟾臾멸(留ㅼ닔떊泥由ъ씤) 봽濡쒗븘 愿묎퀬 由ъ뒪듃 젋뜑留
    async function renderExperts(propertyId) {
        const container = document.getElementById("v12-experts-list");
        if (!container) return;

        // 엫쓽쓽 쟾臾멸 紐⑸줉 뜲씠꽣 (뀒씠釉 遺옱 삉뒗 뜲씠꽣 議고쉶 삤瑜 떆 蹂듦뎄 뤃諛)
        const fallbackExperts = [
            {
                id: 'fallback-1',
                name: "젙寃쎌슦 쟾臾 蹂샇궗",
                office: "踰뺣Т踰뺤씤 븳鍮 寃쎈ℓ 쟾떞 꽱꽣",
                license: "꽌슱쉶 10452샇",
                success_rate: "98.5%",
                phone: "02-588-4900",
                intro: "듅닔 쑀移섍텒, 踰뺤젙吏긽沅 蹂듭옟 냼넚 紐낅룄 냼넚 諛 뙋濡 遺꾩꽍 뻾 20뀈 寃쎈젰쓽 踰좏뀒옉 踰뺣쪧 由ъ씤엯땲떎.",
                img: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
            },
            {
                id: 'fallback-2',
                name: "씠닚떊 벑濡 怨듭씤以묎컻궗",
                office: "異⑸Т 寃쎄났留 留ㅼ닔由 以묎컻踰뺤씤",
                license: "寃쎄린 슜씤 581샇 (留ㅼ닔由ъ씤 젙떇 벑濡)",
                success_rate: "96.2%",
                phone: "031-289-4980",
                intro: "슜씤 諛섎룄泥 겢윭뒪꽣 諛 寃쎄린 궓遺沅 긽媛 닔씡瑜 TOP 鍮뚮뵫 寃쎈ℓ, 떊냽 紐낅룄 쟾臾 留ㅼ닔떊泥由ъ씤엯땲떎.",
                img: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&auto=format&fit=crop&q=60&ixlib=rb-4.0.3"
            }
        ];

        let experts = [];
        try {
            const { data, error } = await supabaseClient
                .from('experts')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            experts = data || [];
        } catch (err) {
            console.warn("쟾臾멸 DB 뿰룞 떎뙣濡 濡쒖뺄 뤃諛 쟾臾멸 由ъ뒪듃瑜 媛룞빀땲떎.", err);
        }

        if (experts.length === 0) {
            experts = fallbackExperts;
        }

        container.innerHTML = experts.map((exp, idx) => `
            <div class="bg-slate-50 border border-slate-100 rounded-xl p-3.5 hover:border-royalBlue/30 hover:bg-blue-50/10 transition-all flex items-start gap-3">
                <img src="${exp.img}" alt="${exp.name}" class="w-12 h-12 rounded-xl object-cover border border-slate-200 flex-shrink-0">
                <div class="flex-1 min-w-0 space-y-1">
                    <div class="flex items-center justify-between">
                        <strong class="text-xs sm:text-sm font-black text-slate-800">${exp.name}</strong>
                        <span class="bg-indigo-50 text-indigo-700 border border-indigo-100 text-[9px] font-black px-1.5 py-0.5 rounded">굺李곗꽦怨듬쪧 ${exp.success_rate}</span>
                    </div>
                    <p class="text-[10px] text-slate-400 font-bold">${exp.office} | ${exp.license}</p>
                    <p class="text-[11px] text-slate-600 font-medium leading-relaxed">${exp.intro}</p>
                    <div class="pt-2 flex items-center gap-2">
                        <a href="tel:${exp.phone}" class="inline-flex items-center gap-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold px-2 py-1.5 rounded-lg select-none">
                            <i class="fa-solid fa-phone text-royalBlue"></i> 쟾솕 뿰寃
                        </a>
                        <button onclick="v12Features.requestExpertConsultation(${propertyId}, '${exp.name.replace(/'/g, "\\'")}')" class="inline-flex items-center gap-1 bg-royalBlue hover:bg-royalHover text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm transition-all select-none">
                            <i class="fa-solid fa-envelope"></i> 삩씪씤 긽떞 떊泥
                        </button>
                    </div>
                </div>
            </div>
        `).join("");
    }

    // 쟾臾멸 긽떞 떊泥 API 뿰룞
    async function requestExpertConsultation(propertyId, expertName) {
        if (!currentUser) {
            alert("濡쒓렇씤씠 븘슂븳 꽌鍮꾩뒪엯땲떎. 뿤뜑뿉꽌 濡쒓렇씤쓣 吏꾪뻾빐 二쇱떗떆삤.");
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

            alert(`${expertName} 쟾臾멸뿉寃 臾대즺 쟾솕/삩씪씤 긽떞 떊泥씠 꽌踰꾩뿉 젙긽 젒닔릺뿀뒿땲떎! 24떆媛 씠궡뿉 븞궡 硫붿씪씠 諛쒖넚맗땲떎.`);
        } catch (err) {
            console.error("쟾臾멸 긽떞 떊泥 떎뙣:", err);
            alert("긽떞 떊泥 泥섎━ 以 꽌踰 넻떊 삤瑜섍 諛쒖깮뻽뒿땲떎. 떎떆 떆룄빐 二쇱떗떆삤.");
        }
    }

    // 湲덉븸 떒쐞瑜 븳湲(뼲/留뚯썝)濡 룷留룻빐二쇰뒗 븿닔
    function formatKRW(val) {
        if (!val || isNaN(val)) return "0썝";
        if (val >= 100000000) {
            const eok = Math.floor(val / 100000000);
            const rest = Math.round((val % 100000000) / 10000);
            return rest > 0 ? `${eok}뼲 ${rest.toLocaleString()}留뚯썝` : `${eok}뼲썝`;
        }
        return `${Math.round(val / 10000).toLocaleString()}留뚯썝`;
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
        requestExpertConsultation: requestExpertConsultation,
        handleMockBidInput: handleMockBidInput,
        updateMockBidSpread: updateMockBidSpread
    };
})();

// 湲濡쒕쾶 諛붿씤뵫 쟻슜
window.v12Features = v12Features;
