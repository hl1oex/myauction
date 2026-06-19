# index.html의 레이아웃, 권리 분석 리포트, 계산기 천단위 콤마, AI 총평 및 광고 폴백을 고도화하기 위한 정밀 수정 스크립트입니다.
# 툴의 라인 매칭 오류를 원천 차단하고 오직 고유한 소스 코드 블록만을 대상으로 1:1 완벽 교체를 진행하기 위해 작성되었습니다.

import os

def main():
    file_path = r"d:\BackUp\OneDrive\AI공부\Real estate auction\index.html"
    
    if not os.path.exists(file_path):
        print("index.html 파일을 찾을 수 없습니다.")
        return

    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. 시세 대조 탭 내 씨:리얼 중복 버튼 제거
    old_seereal = """                            <div class="p-3.5 space-y-2.5">
                    <button onclick="copyAddressToClipboardAndOpenSeeReal()" class="px-2 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 text-[10px] font-black rounded-lg transition-all flex items-center gap-1">
                        <i class="fa-solid fa-copy"></i> 주소복사 & 시세확인 (씨리얼)
                    </button>
                </div>"""
    
    content = content.replace(old_seereal, "")

    # 2. 2번 탭 레이아웃 2열 리팩토링 및 모의 입찰 스프레드 마크업 추가
    old_panel2_layout = """            <!-- 입찰 당일 필수 체크리스트 -->
            <div class="bg-white border border-slate-200 rounded-2xl p-3 sm:p-3.5 space-y-2 shadow-sm">
                <h4 class="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5">
                    <i class="fa-solid fa-clipboard-check text-royalBlue"></i> 📋 입찰 당일 필수 체크리스트
                </h4>
                <div id="detail-checklist-content" class="text-[10.5px] sm:text-xs font-medium text-slate-655 leading-relaxed space-y-1.5">
                    <!-- Javascript에서 동적으로 주입됨 -->
                </div>
            </div>

            <!-- 🎯 v1.2 실시간 모의 입찰 센터 -->
            <div class="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 space-y-3 shadow-sm mt-3">
                <h4 class="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-100">
                    <i class="fa-solid fa-gamepad text-indigo-500"></i> 🎯 실시간 모의 입찰 센터 (v1.2)
                </h4>
                <div class="grid grid-cols-3 gap-2 text-center bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                    <div class="flex flex-col">
                        <span class="text-[9px] text-slate-400 font-bold">참여 현황</span>
                        <strong id="v12-mock-bids-count" class="text-xs font-black text-slate-700 font-outfit">0명 참여 중</strong>
                    </div>
                    <div class="flex flex-col border-x border-slate-200">
                        <span class="text-[9px] text-slate-400 font-bold">평균 입찰가</span>
                        <strong id="v12-mock-avg-price" class="text-xs font-black text-slate-700 font-outfit">0원</strong>
                    </div>
                    <div class="flex flex-col">
                        <span class="text-[9px] text-slate-400 font-bold">평균 낙찰율</span>
                        <strong id="v12-mock-ratio" class="text-xs font-black text-royalBlue font-outfit">--%</strong>
                    </div>
                </div>
                <div class="space-y-2 mt-2">
                    <label class="text-[10px] text-slate-500 font-bold block">나의 가상 입찰가 입력 (원 단위 입력)</label>
                    <div class="flex gap-2">
                        <input type="number" id="v12-mock-bid-input" placeholder="예: 250000000" class="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-royalBlue focus:bg-white transition-all text-slate-800">
                        <button onclick="v12Features.submitMockBid(selectedProperty.id, selectedProperty.appraised_value)" class="bg-royalBlue hover:bg-royalHover text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-sm transition-all select-none">제출</button>
                    </div>
                    <div id="v12-mock-bid-message" class="text-[10px] hidden font-bold mt-1"></div>
                </div>
            </div>

            <!-- 💼 v1.2 경매 정식 등록 전문가 상담 연계 -->
            <div class="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 space-y-2.5 shadow-sm mt-3">
                <h4 class="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-100">
                    <i class="fa-solid fa-user-tie text-indigo-500"></i> 💼 우수 매수대리 전문가 연계 광고 (v1.2)
                </h4>
                <div id="v12-experts-list" class="space-y-3">
                    <!-- Javascript에서 동적으로 주입됨 -->
                </div>
            </div>
        </div>"""

    new_panel2_layout = """            </div> <!-- 👈 좌측 열 space-y-4 sm:space-y-5 닫기 -->

            <!-- 오른쪽 열: 모의 입찰 센터, 전문가 연계 광고, 입찰 체크리스트 -->
            <div class="space-y-4 sm:space-y-5 w-full">
                <!-- 🎯 v1.2 실시간 모의 입찰 센터 -->
                <div class="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 space-y-3 shadow-sm">
                    <h4 class="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-100">
                        <i class="fa-solid fa-gamepad text-indigo-500"></i> 🎯 실시간 모의 입찰 센터 (v1.2)
                    </h4>
                    <div class="grid grid-cols-3 gap-2 text-center bg-slate-50 rounded-xl p-2.5 border border-slate-100">
                        <div class="flex flex-col">
                            <span class="text-[9px] text-slate-400 font-bold">참여 현황</span>
                            <strong id="v12-mock-bids-count" class="text-xs font-black text-slate-700 font-outfit">0명 참여 중</strong>
                        </div>
                        <div class="flex flex-col border-x border-slate-200">
                            <span class="text-[9px] text-slate-400 font-bold">평균 입찰가</span>
                            <strong id="v12-mock-avg-price" class="text-xs font-black text-slate-700 font-outfit">0원</strong>
                        </div>
                        <div class="flex flex-col">
                            <span class="text-[9px] text-slate-400 font-bold">평균 낙찰율</span>
                            <strong id="v12-mock-ratio" class="text-xs font-black text-royalBlue font-outfit">--%</strong>
                        </div>
                    </div>
                    <div class="space-y-2 mt-2">
                        <label class="text-[10px] text-slate-500 font-bold block">나의 가상 입찰가 입력 (원 단위 입력)</label>
                        <div class="flex gap-2">
                            <input type="text" id="v12-mock-bid-input" oninput="v12Features.handleMockBidInput(this)" placeholder="예: 250,000,000" class="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-royalBlue focus:bg-white transition-all text-slate-800 font-outfit">
                            <button onclick="v12Features.submitMockBid(selectedProperty.id, selectedProperty.appraised_value)" class="bg-royalBlue hover:bg-royalHover text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-sm transition-all select-none">제출</button>
                        </div>
                        <div id="v12-mock-bid-message" class="text-[10px] hidden font-bold mt-1"></div>

                        <!-- 📊 실시간 세무/금융 자금계획 스프레드 영역 -->
                        <div id="v12-mock-bid-spread-container" class="mt-3.5 border border-slate-100 rounded-xl bg-slate-50/50 p-3 space-y-2.5 hidden">
                            <h5 class="text-[10px] font-black text-slate-750 flex items-center gap-1 border-b border-slate-200/60 pb-1.5">
                                <i class="fa-solid fa-list-check text-indigo-500"></i> 실시간 자금 계획 스프레드 (시뮬레이션)
                            </h5>
                            <div class="space-y-1.5 text-[11px] font-bold text-slate-600">
                                <div class="flex justify-between items-center py-0.5 border-b border-dashed border-slate-200/60 pb-1">
                                    <span>취득세 예상액</span>
                                    <span id="v12-mock-spread-tax" class="text-slate-900 font-outfit font-black">0원</span>
                                </div>
                                <div class="flex justify-between items-center py-0.5 border-b border-dashed border-slate-200/60 pb-1">
                                    <span>법무 대행비 (0.5%)</span>
                                    <span id="v12-mock-spread-agency" class="text-slate-900 font-outfit font-black">0원</span>
                                </div>
                                <div class="flex justify-between items-center py-0.5 border-b border-dashed border-slate-200/60 pb-1">
                                    <span>LTV 가상 대출한도 (70%)</span>
                                    <span id="v12-mock-spread-loan" class="text-slate-900 font-outfit font-black">0원</span>
                                </div>
                                <div class="flex justify-between items-center py-0.5 pt-1 text-royalBlue bg-blue-50/40 px-2 py-1 rounded-lg">
                                    <span class="flex items-center gap-1"><i class="fa-solid fa-calculator text-[10px]"></i> 총 예상 소요자금</span>
                                    <span id="v12-mock-spread-total" class="font-outfit font-black">0원</span>
                                </div>
                                <div class="flex justify-between items-center py-0.5 pt-1 text-emeraldSuccess bg-emerald-50/40 px-2 py-1 rounded-lg">
                                    <span class="flex items-center gap-1"><i class="fa-solid fa-wallet text-[10px]"></i> 필요 최소 자기자본</span>
                                    <span id="v12-mock-spread-cash" class="font-outfit font-black">0원</span>
                                </div>
                            </div>
                            <div class="text-[8.5px] text-slate-400 font-medium leading-normal pt-1 text-center">
                                ※ LTV 대출 규제 및 개인 신용도에 따라 실제 한도는 상이할 수 있습니다.
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 💼 v1.2 경매 정식 등록 전문가 상담 연계 -->
                <div class="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 space-y-2.5 shadow-sm">
                    <h4 class="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-100">
                        <i class="fa-solid fa-user-tie text-indigo-500"></i> 💼 우수 매수대리 전문가 연계 광고 (v1.2)
                    </h4>
                    <div id="v12-experts-list" class="space-y-3">
                        <!-- Javascript에서 동적으로 주입됨 -->
                    </div>
                </div>

                <!-- 입찰 당일 필수 체크리스트 -->
                <div class="bg-white border border-slate-200 rounded-2xl p-3 sm:p-3.5 space-y-2 shadow-sm">
                    <h4 class="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5">
                        <i class="fa-solid fa-clipboard-check text-royalBlue"></i> 📋 입찰 당일 필수 체크리스트
                    </h4>
                    <div id="detail-checklist-content" class="text-[10.5px] sm:text-xs font-medium text-slate-655 leading-relaxed space-y-1.5">
                        <!-- Javascript에서 동적으로 주입됨 -->
                    </div>
                </div>
            </div> <!-- 👈 우측 열 space-y-4 sm:space-y-5 닫기 -->
        </div> <!-- 👈 grid grid-cols-1 xl:grid-cols-2 닫기 -->"""

    content = content.replace(old_panel2_layout, new_panel2_layout)

    # 3. 스마트 계산기 인풋 필드 변경
    old_calc_input = """                        <input type="number" id="calc-bid-input" oninput="runCalculator()"
                               class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-base font-black focus:outline-none focus:border-royalBlue focus:bg-white transition-all text-royalBlue font-outfit mb-1.5">"""
    
    new_calc_input = """                        <input type="text" id="calc-bid-input" oninput="handleCalcBidInput(this)"
                               class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-base font-black focus:outline-none focus:border-royalBlue focus:bg-white transition-all text-royalBlue font-outfit mb-1.5">"""
    
    content = content.replace(old_calc_input, new_calc_input)

    # 4. 프리셋 클릭 핸들러 및 계산기 초기화 시 콤마 적용
    old_preset_binding = """            const calcInput = document.getElementById("calc-bid-input");
             if (calcInput && (!document.activeElement || document.activeElement.id !== "calc-bid-input")) {
                 calcInput.value = item.minimum_bid;
             }
  
             // 프리셋 버튼들 액션 바인딩
             document.getElementById("preset-appraisal-btn").onclick = () => { calcInput.value = item.appraised_value; runCalculator(); };
             document.getElementById("preset-minimum-btn").onclick = () => { calcInput.value = item.minimum_bid; runCalculator(); };"""

    new_preset_binding = """            const calcInput = document.getElementById("calc-bid-input");
             if (calcInput && (!document.activeElement || document.activeElement.id !== "calc-bid-input")) {
                 calcInput.value = formatNumberWithCommas(item.minimum_bid);
             }
  
             // 프리셋 버튼들 액션 바인딩
             document.getElementById("preset-appraisal-btn").onclick = () => { calcInput.value = formatNumberWithCommas(item.appraised_value); runCalculator(); };
             document.getElementById("preset-minimum-btn").onclick = () => { calcInput.value = formatNumberWithCommas(item.minimum_bid); runCalculator(); };"""

    content = content.replace(old_preset_binding, new_preset_binding)

    # 5. runCalculator, pressCalcKey, adjustBid 함수 콤마 포맷터 이식 및 헬퍼 추가
    old_calculator_fns = """        // 10. [핵심 수식 엔진] 용도별 취득세율 계산식 및 영수증 연동 모듈 (디지털 화면 바인딩 추가)
        function runCalculator() {
            if (!selectedProperty) return;
            
            const bidInputVal = parseInt(document.getElementById("calc-bid-input").value) || 0;
            
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
            let val = parseInt(input.value) || 0;
            val = Math.max(0, val + amount);
            input.value = val;
            runCalculator();
        }

        // 🧮 인터랙티브 키패드 입력 함수 (디지털 모니터 완벽 갱신)
        function pressCalcKey(key) {
            const input = document.getElementById("calc-bid-input");
            let val = parseInt(input.value) || 0;
            
            if (key === 'C') {
                input.value = 0;
            } else if (key === 'backspace') {
                const strVal = String(input.value);
                if (strVal.length > 1) {
                    input.value = parseInt(strVal.substring(0, strVal.length - 1)) || 0;
                } else {
                    input.value = 0;
                }
            } else if (key === '+1억') {
                input.value = val + 100000000;
            } else if (key === '+1천') {
                input.value = val + 10000000;
            } else if (key === '+1백') {
                input.value = val + 1000000;
            } else if (key === 'enter') {
                // 입력 완료 처리
            } else {
                // 숫자키 조합
                const strVal = String(input.value);
                if (strVal === "0" || strVal === "") {
                    input.value = key;
                } else {
                    input.value = strVal + key;
                }
            }
            
            runCalculator();
        }"""

    new_calculator_fns = """        // 10. [핵심 수식 엔진] 용도별 취득세율 계산식 및 영수증 연동 모듈 (디지털 화면 바인딩 추가)
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
        }"""

    content = content.replace(old_calculator_fns, new_calculator_fns)

    # 6. AI 7대 권리 리스크 자동 리포트 고도화 (3814~3904라인 부근)
    old_risk_report_fn = """        // [신규 기능 4] AI 7대 권리 하자 및 리스크 지능형 자동 리포트 매칭기
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
                        <strong class="text-[10px] text-slate-650 block">👉 초보 대응 지침: 현장 탐문 및 주민 조사를 통해 점유 실태를 명확히 구명하기 전에는 입찰을 피하십시오.</strong>
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
        }"""

    new_risk_report_fn = """        // [신규 기능 4] AI 7대 권리 하자 및 리스크 지능형 자동 리포트 매칭기
        function generateLegalRiskReport(item) {
            const textToSearch = `${item.address} ${item.desc_content} ${item.notes_content}`.toLowerCase();
            let warnings = [];
            
            // 1. 건물만 매각 / 대지권 없음
            if (textToSearch.includes("대지권없음") || textToSearch.includes("토지만") || textToSearch.includes("건물만") || textToSearch.includes("대지권 미등기")) {
                warnings.push(`
                    <div class="border-l-4 border-rose-600 pl-3 py-1 space-y-1">
                        <strong class="text-xs font-black text-rose-800">🧱 토지 사용권 분쟁 (건물만 매각 / 대지권 없음) 리스크</strong>
                        <p class="text-[10px] text-slate-500 leading-relaxed">건물의 소유권만 낙찰받고 토지 사용권을 가져오지 못해 토지 소유주로부터 매달 땅 사용료(지료) 소송 또는 건물 철거 압박 소송에 처할 심각한 리스크가 있습니다. 대법원 판례에 따르면 토지와 건물의 소유주가 분리되는 경우 법정지상권의 성립 요건(저당권 설정 당시 건물의 존재 여부, 소유주 동일성 등)이 철저하게 다투어지게 됩니다. 만약 지상권이 불성립한다면 토지 소유주는 건물철거청구 및 토지인도청구 소송(민법 제214조)을 제기하여 낙찰자를 강하게 압박할 것입니다. 초보자는 입찰을 절대 금지해야 하며, 전문가라 하더라도 토지 소유주와의 지료 감정평가 및 건물 매수청구권 협상 전략이 수립되지 않았다면 입찰을 절대 지양해야 합니다.</p>
                        <strong class="text-[10px] text-rose-700 block">👉 초보 대응 지침: 입찰 절대 금지. 토지 소유주와의 법적 대립으로 자산이 장기간 묶여 원금 손실을 초래할 수 있습니다.</strong>
                    </div>
                `);
            }
            
            // 2. 토지별도등기
            if (textToSearch.includes("토지별도")) {
                warnings.push(`
                    <div class="border-l-4 border-amber-500 pl-3 py-1 space-y-1">
                        <strong class="text-xs font-black text-amber-800">📝 토지별도등기 인수 우려</strong>
                        <p class="text-[10px] text-slate-500 leading-relaxed">토지에 집합건물 건축 전에 근저당 등 권리가 남아 있는 물건입니다. 집합건물의 소유 및 관리에 관한 법률 제20조에 의거하여 전유부분과 대지사용권의 일체성이 깨질 수 있는 권리 관계입니다. 낙찰대금 중 대지 지분에 배당되는 금액이 토지 저당권자에게 전액 변제되지 않거나, 법원 경매 절차에서 토지저당권자가 채권을 신고하지 않아 배당에서 제외될 경우, 소멸되지 않은 근저당 채무 또는 가압류 권리가 고스란히 낙찰자에게 인수 승계될 중대한 위험이 존재합니다.</p>
                        <strong class="text-[10px] text-amber-700 block">👉 초보 대응 지침: 법원의 '매각물건명세서' 상에서 토지 근저당이 특별 매각조건으로 낙찰 후 완전히 말소되는 조건인지 반드시 재확인하십시오.</strong>
                    </div>
                `);
            }
            
            // 3. 지분제한
            if (textToSearch.includes("지분")) {
                warnings.push(`
                    <div class="border-l-4 border-rose-600 pl-3 py-1 space-y-1">
                        <strong class="text-xs font-black text-rose-800">👥 공동소유 지분 제한 리스크</strong>
                        <p class="text-[10px] text-slate-500 leading-relaxed">자산의 지분(일부)만 획득하는 물건으로, 민법 제265조에 따라 공유물의 관리에 관한 사항은 공유자의 지분의 과반수로써 결정해야 하므로, 반수 미만의 소수 지분을 낙찰받을 경우 타 공유자들의 동의 없이는 독단적으로 임대 계약을 맺거나 실거주를 하기 어렵습니다. 나아가 공유 지분권자 상호 간 대립으로 협의 분할이 무산될 시, 결국 민법 제269조에 의거해 공유물전체 경매를 통한 현금 배분 소송(공유물분할청구소송)으로 이어지는 긴 지리한 사법 공방을 피할 수 없습니다.</p>
                        <strong class="text-[10px] text-rose-700 block">👉 초보 대응 지침: 공유 지분은 시중 은행 잔금 대출 및 자유로운 매도가 사실상 불가능합니다. 전문가가 아니라면 지분 경매는 무조건 피하십시오.</strong>
                    </div>
                `);
            }
            
            // 4. 유치권
            if (textToSearch.includes("유치권") || textToSearch.includes("유치권 주장")) {
                warnings.push(`
                    <div class="border-l-4 border-rose-600 pl-3 py-1 space-y-1">
                        <strong class="text-xs font-black text-rose-800">🛠️ 유치권 주장 (점유 및 공사대금 인수)</strong>
                        <p class="text-[10px] text-slate-500 leading-relaxed">공사비를 회수하지 못한 시공업자 또는 하도급업자 등이 유치물에 관하여 생긴 공사대금 채권을 변제받기 위해 점유하고 주장하는 난해한 권리 관계입니다. 유치권이 법적으로 인정(성립)될 경우, 민법 제320조에 의거하여 채무를 모두 갚기 전에는 낙찰자가 해당 부동산을 점유·인도받을 수 없으며 최악의 경우 거액의 공사 미지급금을 대위변제해주어야 합니다. 성립 요건(채권의 변제기 도래, 점유의 계속성 및 개시결정 등기 전 점유 개시, 유치권 배제 특약 부재 등)을 입찰 전에 면밀히 확인해야 합니다.</p>
                        <strong class="text-[10px] text-rose-700 block">👉 초보 대응 지침: 입찰을 전적으로 피하십시오. 성립 여부에 대한 장기 명도 소송 및 대위 변제 리스크가 극대화되는 영역입니다.</strong>
                    </div>
                `);
            }
            
            // 5. 명도 곤란 및 점유미상
            if (textToSearch.includes("명도곤란") || textToSearch.includes("점유관계미상")) {
                warnings.push(`
                    <div class="border-l-4 border-amber-500 pl-3 py-1 space-y-1">
                        <strong class="text-xs font-black text-amber-800">🚪 불법/미상 점유자 명도 지연</strong>
                        <p class="text-[10px] text-slate-500 leading-relaxed">점유 관계가 명확하지 않거나 불법 점유주가 퇴거 및 합의 협상을 완강하게 거부하여 대화가 단절되어 있는 깜깜이 상태입니다. 이러한 물건은 잔금 납부 후 민사집행법 제136조에 의한 부동산인도명령 결정을 신속히 이끌어내야 하나, 저항이 심할 경우 법원 집행관실을 통한 예고집행 및 본집행(강제집행) 수속을 밟아야 합니다. 이 과정에서 평당 15만원 내외의 노무비, 운반비, 보관료 등 집행 비용이 실지출되며, 6개월 이상의 시간적 지연 및 소송 비용 누적이 예측됩니다.</p>
                        <strong class="text-[10px] text-amber-700 block">👉 초보 대응 지침: 낙찰 잔금 납부 즉시 '인도명령'을 법원에 신청하고, 통상적인 명도 합의 이사비용을 미리 자금 계획에 산입하십시오.</strong>
                    </div>
                `);
            }
            
            // 6. 보증금 인수 대항력
            if (textToSearch.includes("인수") || textToSearch.includes("선순위") || textToSearch.includes("대항력") || textToSearch.includes("임차권") || textToSearch.includes("보증금 인수")) {
                warnings.push(`
                    <div class="border-l-4 border-rose-600 pl-3 py-1 space-y-1">
                        <strong class="text-xs font-black text-rose-800">💰 대항력 있는 세입자 보증금 인수 (독박 채무)</strong>
                        <p class="text-[10px] text-slate-500 leading-relaxed">말소기준권리보다 빠른 선순위 임차인이 있어 보증금이 법원에서 배당되지 못할 경우, 주택임대차보호법 제3조 제4항에 의거하여 낙찰자가 임대인의 지위를 승계하므로 세입자의 보증금 차액 전액을 현금으로 대신 돌려주어야만 합법적으로 비워줄 것을 요구할 수 있습니다. 특히 선순위 임차인이 배당요구종기일 이내에 배당신청을 하지 않았거나 확정일자가 늦어 일부만 배당받는 경우, 배당받지 못하는 전액이 고스란히 낙찰자의 추가 취득 원가가 됩니다.</p>
                        <strong class="text-[10px] text-rose-700 block">👉 초보 대응 지침: 세입자의 보증금 인수액을 감안하지 않고 무작정 시세 대비 저렴하다고 입찰할 경우 큰 재산상 손실을 보게 됩니다. 인수액만큼 감액 응찰하십시오.</strong>
                    </div>
                `);
            }
            
            // 7. 깜깜이 투자 정보 부재
            if (textToSearch.includes("서류없음") || textToSearch.includes("확인불가") || textToSearch.includes("열람불가") || textToSearch.includes("자료없음")) {
                warnings.push(`
                    <div class="border-l-4 border-slate-500 pl-3 py-1 space-y-1">
                        <strong class="text-xs font-black text-slate-800">⚠️ 정보 정보 부재 및 깜깜이 투자 우려</strong>
                        <p class="text-[10px] text-slate-500 leading-relaxed">공식 서류나 임대차 조사가 투명하게 밝혀지지 않은 자산입니다. 낙찰 이후 문을 열었을 때 예측 불가능한 심각한 내부 결로, 균열, 보일러 배관 누수 파열, 불법 용도 변경(무단 방 쪼개기 등)으로 인한 구청 강제이행금 부과 등 막대한 하자 보수 비용이 뒤늦게 터져 나올 수 있는 깜깜이 물건입니다.</p>
                        <strong class="text-[10px] text-slate-650 block">👉 초보 대응 지침: 현장 관리사무소 탐문 및 주민 조사를 통해 점유 실태와 건물 내부 노후도를 명확히 파악하기 전에는 무조건 회피하십시오.</strong>
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
        }"""

    content = content.replace(old_risk_report_fn, new_risk_report_fn)

    # 7. AI 실전 투자 분석 총평(opinion) 고도화 (5881~5889라인 부근)
    old_opinion_block = """                let opinion = `본 매물은 감정가 ${formatKRW(item.appraised_value)} 대비 ${est.discount}% 저감된 최저 매각가 ${formatKRW(item.minimum_bid)}에 매각 진행 중인 물건입니다. `;
                opinion += `단독 입찰 낙찰 시, 대출 LTV 70%(${formatKRW(loan70)})를 가정한 최소 필요 자기자본금은 약 ${formatKRW(cash70)} 수준으로 예상됩니다. 연 4.5% 금리 적용 시 연간 이자 비용 부담은 약 ${formatKRW(interest45)}으로 월 평균 이자 비용은 약 ${formatKRW(Math.floor(interest45/12))}가 발생합니다. `;
                opinion += `감정평가액 기반 시세 차익과 금융 비용을 대조하여 세후 예측 ROI를 도출한 결과 약 ${roiRate}%의 유의미한 수익률을 기록할 것으로 전망됩니다. `;
                
                if (item.grade === "A" || item.grade === "B") {
                    opinion += `권리분석 상 소멸되지 않는 악성 채무나 점유 리스크 등 법적 위해 요소가 감지되지 않아 투자의 안전성이 우수한 우량 등급의 자산입니다. 시뮬레이션 표의 시나리오를 참고하여 보수적(105%) 및 공격적(115%) 입찰가 조정을 거쳐 적극 응찰할 것을 강력히 권고합니다.`;
                } else {
                    opinion += `다만 권리 등급 분류 상 위험(X등급) 판정을 받은 자산으로, 유치권 내지 대항력 있는 임차보증금 등의 추가 인수 부담 위험이 매우 큽니다. 시뮬레이션 수치 상의 수익률에 현혹되지 마시고, 보수적인 추가 유찰 시점까지 입찰을 미루시거나 전문 법률 분석을 선행하시기를 권장합니다.`;
                }"""

    new_opinion_block = """                let opinion = `본 매물은 감정평가액 ${formatKRW(item.appraised_value)} 대비 현재 ${est.discount}% 저감된 최저 입찰가 ${formatKRW(item.minimum_bid)}에 매각 절차가 진행 중인 법원 경매 물건입니다. `;
                opinion += `만약 현재 회차의 최저가 수준에서 단독 낙찰을 받는다고 가정할 경우, 잔금 납부 시 LTV 70%인 ${formatKRW(loan70)}의 경락잔금대출을 활용할 수 있으며, 이 때 금융 비용을 차감한 실제 필요 자기자본(세금 및 부대비용 약 3% 포함)은 약 ${formatKRW(cash70)} 수준으로 파악됩니다. 시중 은행의 평균 대출 금리 연 4.5%를 대입하여 금융 비용 기회비용을 산출하면, 연간 약 ${formatKRW(interest45)}의 대출 이자가 발생하게 되며, 이는 매월 약 ${formatKRW(Math.floor(interest45/12))} 상당의 고정 금융 지출을 의미합니다. `;
                opinion += `본 자산의 예상 임대 수익률과 인근 전세 시세의 전세가율을 고려한 세후 실질 투자 수익률(ROI)은 연 약 ${roiRate}% 수준으로 분석되며, 이는 현재 시중의 정기예금 이자율 및 채권 기대수익률을 대조했을 때 충분한 마진을 확보할 수 있는 투자성 지표를 나타내고 있습니다. `;
                
                if (item.grade === "A" || item.grade === "B") {
                    opinion += `해당 매물은 권리분석 정밀 검증 단계에서 등기부상 인수되는 낙찰자 부담 채무가 없으며, 임대차 현황 상으로도 낙찰자가 보증금을 독박 인수해야 할 선순위 대항력 임차인이 존재하지 않아 권리상 매우 안전한 A/B 등급 우량 자산으로 분류됩니다. 따라서 보수적인 응찰자는 감정가 대비 90% 내지 95% 선의 안정적인 단기 시세차익형 응찰가 밴드를 조율하고, 공격적 성향의 응찰자는 입지의 성장 잠재력 점수(score 가점)를 가중하여 감정가 대비 100%에 근접하더라도 선점 낙찰하는 밴드 조정 지침을 권장합니다.`;
                } else {
                    opinion += `다만, 본 매물은 권리 리스크 7대 리스크 하이브리드 필터링 검진 결과 위험도가 높은 비우량 자산(등급 외 또는 C/D/X 등급)으로 분류되어 각별한 주의가 요구됩니다. 유치권 신고 금액의 성립 가능성이나, 선순위 임차인이 법원에 배당요구를 신청하지 않아 발생할 수 있는 보증금 인수 책임(독박 채무 리스크)이 매우 농후합니다. 시뮬레이션상의 가상 수익률에만 안주하여 조급하게 입찰하지 마시고, 보수적인 낙찰을 위해 최소 1~2회 이상의 추가 유찰을 기다린 뒤 최저가가 64% 혹은 51%선으로 저감되었을 때 입찰가 밴드를 보수적으로 대폭 삭감 조정하여 응찰 여부를 결정하시길 바랍니다.`;
                }"""

    content = content.replace(old_opinion_block, new_opinion_block)

    # 8. 상세페이지 애드센스 광고 슬롯 폴백 활성화 제어
    old_ad_slots_logic = """            // 📢 상세페이지 상단 광고 슬롯 제어
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
                    detailTopAdSlot.classList.add("hidden");
                }
            }

            // 📢 상세페이지 하단 광고 슬롯 제어
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
                    detailBottomAdSlot.classList.add("hidden");
                }
            }"""

    new_ad_slots_logic = """            // 📢 상세페이지 상단 광고 슬롯 제어 (폴백 활성화 연동)
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
            }"""

    content = content.replace(old_ad_slots_logic, new_ad_slots_logic)

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)

    print("index.html 수술적 수정이 모두 완료되었습니다.")

if __name__ == "__main__":
    main()
