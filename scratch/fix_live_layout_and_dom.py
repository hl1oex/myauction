# -*- coding: utf-8 -*-
# index.html의 상세 탭 2번 닫는 태그 누락 해결 및 탭별 여백/패딩 톤앤매너 통일 스크립트입니다.

def main():
    filepath = "index.html"
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
    except Exception as e:
        print(f"Failed to read index.html: {e}")
        return

    # 1. 상세 탭 2번(detail-group-panel-2)의 닫는 </div> 태그 삽입 버그 교정
    # group-mask-2 뒤에서 닫아주지 않아 하단 광고판이 탭 2 내부에 갇히는 현상을 해결합니다.
    target_mask = """            <div id="group-mask-2" class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-30 flex flex-col items-center justify-center text-center p-6 hidden">
                <div class="bg-white border border-slate-200 rounded-2xl p-6 max-w-sm shadow-2xl space-y-3">
                    <i class="fa-solid fa-lock text-rose-500 text-3xl"></i>
                    <h4 class="text-slate-800 text-sm font-black">🔒 입찰 & 금융 분석 열람 제한</h4>
                    <p class="text-slate-500 text-[10.5px] leading-relaxed font-semibold">본 매물의 입찰 & 금융 상세 시뮬레이션은 프리미엄 회원 등급 전용 콘텐츠입니다. 등급을 상향하여 정밀 ROI 분석을 확인해 보세요.</p>
                    <button onclick="v12Features.payPremiumAndUpgrade()" class="w-full bg-royalBlue text-white font-extrabold text-xs py-2 rounded-xl shadow-md hover:bg-royalHover transition-all">등급 상향 신청하기</button>
                </div>
        </div>"""

    replacement_mask = """            <div id="group-mask-2" class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-30 flex flex-col items-center justify-center text-center p-6 hidden">
                <div class="bg-white border border-slate-200 rounded-2xl p-6 max-w-sm shadow-2xl space-y-3">
                    <i class="fa-solid fa-lock text-rose-500 text-3xl"></i>
                    <h4 class="text-slate-800 text-sm font-black">🔒 입찰 & 금융 분석 열람 제한</h4>
                    <p class="text-slate-500 text-[10.5px] leading-relaxed font-semibold">본 매물의 입찰 & 금융 상세 시뮬레이션은 프리미엄 회원 등급 전용 콘텐츠입니다. 등급을 상향하여 정밀 ROI 분석을 확인해 보세요.</p>
                    <button onclick="v12Features.payPremiumAndUpgrade()" class="w-full bg-royalBlue text-white font-extrabold text-xs py-2 rounded-xl shadow-md hover:bg-royalHover transition-all">등급 상향 신청하기</button>
                </div>
            </div>
        </div>"""

    content = content.replace(target_mask, replacement_mask)

    # 2. 탭 1 카드 패딩(p-4 -> p-3 sm:p-3.5)으로 반응형 슬림화 적용
    content = content.replace("class=\"bg-white border border-slate-200 rounded-2xl p-4 shadow-sm w-full space-y-4\"", "class=\"bg-white border border-slate-200 rounded-2xl p-3 sm:p-3.5 shadow-sm w-full space-y-3\"")
    content = content.replace("class=\"bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3\"", "class=\"bg-white border border-slate-200 rounded-2xl p-3 sm:p-3.5 shadow-sm space-y-2.5\"")
    content = content.replace("class=\"bg-amber-50/30 border border-amber-200/60 rounded-2xl p-4 shadow-sm space-y-2.5\"", "class=\"bg-amber-50/30 border border-amber-200/60 rounded-2xl p-3 sm:p-3.5 shadow-sm space-y-2\"")
    content = content.replace("class=\"bg-white border border-slate-200 rounded-2xl p-4 space-y-2.5 shadow-sm\"", "class=\"bg-white border border-slate-200 rounded-2xl p-3 sm:p-3.5 space-y-2 shadow-sm\"")

    # 3. 탭 간 카드 간격(space-y-4 sm:space-y-5 -> space-y-3 sm:space-y-3.5) 통일
    content = content.replace("id=\"group-content-2\" class=\"space-y-4 sm:space-y-5 w-full\"", "id=\"group-content-2\" class=\"space-y-3 sm:space-y-3.5 w-full\"")
    content = content.replace("id=\"group-content-3\" class=\"space-y-4 sm:space-y-5 w-full\"", "id=\"group-content-3\" class=\"space-y-3 sm:space-y-3.5 w-full\"")
    content = content.replace("id=\"detail-panel-bid\" class=\"space-y-4 sm:space-y-5\"", "id=\"detail-panel-bid\" class=\"space-y-3 sm:space-y-3.5\"")
    content = content.replace("id=\"detail-panel-map\" class=\"space-y-4 sm:space-y-5\"", "id=\"detail-panel-map\" class=\"space-y-3 sm:space-y-3.5\"")

    try:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)
        print("Successfully fixed HTML DOM nesting and scaled margins/paddings.")
    except Exception as e:
        print(f"Failed to write index.html: {e}")

if __name__ == "__main__":
    main()
