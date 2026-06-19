# -*- coding: utf-8 -*-
# index.html의 오타 클래스 수정 및 상세페이지 여백 슬림화 톤앤매너 패치 스크립트입니다.
import re

def main():
    filepath = "index.html"
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
    except Exception as e:
        print(f"Failed to read index.html: {e}")
        return

    # 1. 오타 클래스(text-slate-450 -> text-slate-400 / text-slate-455 -> text-slate-500) 치환
    content = content.replace("text-slate-450", "text-slate-400")
    content = content.replace("text-slate-455", "text-slate-500")

    # 2. 상세 Drawer 내부 탭 패널의 패딩/여백 컴팩트하게 축소
    # detail-group-panel-1 ~ 3
    content = content.replace(
        'id="detail-group-panel-1" class="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 sm:space-y-5 custom-scrollbar bg-slate-50/50"',
        'id="detail-group-panel-1" class="flex-1 overflow-y-auto p-3 sm:p-3.5 space-y-3 sm:space-y-3.5 custom-scrollbar bg-slate-50/50"'
    )
    content = content.replace(
        'id="detail-group-panel-2" class="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 sm:space-y-5 custom-scrollbar bg-slate-50/50 hidden relative"',
        'id="detail-group-panel-2" class="flex-1 overflow-y-auto p-3 sm:p-3.5 space-y-3 sm:space-y-3.5 custom-scrollbar bg-slate-50/50 hidden relative"'
    )
    content = content.replace(
        'id="detail-group-panel-3" class="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 sm:space-y-5 custom-scrollbar bg-slate-50/50 hidden relative"',
        'id="detail-group-panel-3" class="flex-1 overflow-y-auto p-3 sm:p-3.5 space-y-3 sm:space-y-3.5 custom-scrollbar bg-slate-50/50 hidden relative"'
    )

    # 3. 각 탭 패널 내부 개별 카드의 패딩 슬림화 (p-4 sm:p-5, p-3.5 sm:p-4 -> p-3 sm:p-3.5)
    # 대표 이미지 및 기본 명세 카드 패딩
    content = content.replace(
        'id="detail-panel-summary" class="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm w-full space-y-4"',
        'id="detail-panel-summary" class="bg-white border border-slate-200 rounded-2xl p-3 sm:p-3.5 shadow-sm w-full space-y-3"'
    )
    # 위치 지도 카드 패딩
    content = content.replace(
        'class="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 space-y-2.5 shadow-sm"',
        'class="bg-white border border-slate-200 rounded-2xl p-3 sm:p-3.5 space-y-2 shadow-sm"'
    )
    # 네이버 연동 허브 카드 패딩
    content = content.replace(
        'class="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 space-y-3 shadow-sm"',
        'class="bg-white border border-slate-200 rounded-2xl p-3 sm:p-3.5 space-y-2 shadow-sm"'
    )
    # 최근 1년 매각 통계 카드 패딩
    content = content.replace(
        'class="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 shadow-sm space-y-3"',
        'class="bg-white border border-slate-200 rounded-2xl p-3 sm:p-3.5 space-y-2 shadow-sm"'
    )
    # AI 낙찰 시뮬레이션 카드 여백/패딩
    content = content.replace(
        'class="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-3.5 sm:p-4 space-y-2.5 shadow-sm mb-4"',
        'class="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-3 sm:p-3.5 space-y-2 shadow-sm mb-3"'
    )
    # 세법 계산기 카드 패딩
    content = content.replace(
        'class="bg-white border border-slate-200 rounded-2xl p-3.5 sm:p-4 shadow-sm space-y-3 max-w-[720px] mx-auto w-full"',
        'class="bg-white border border-slate-200 rounded-2xl p-3 sm:p-3.5 shadow-sm space-y-2.5 max-w-[720px] mx-auto w-full"'
    )
    # AI 실전 투자 분석 총평 카드 패딩
    content = content.replace(
        'class="bg-amber-50/30 border border-amber-200/60 rounded-2xl p-3.5 sm:p-4 space-y-2 shadow-sm"',
        'class="bg-amber-50/30 border border-amber-200/60 rounded-2xl p-3 sm:p-3.5 space-y-2 shadow-sm"'
    )

    # 4. 카드 제목 H4 태그의 톤앤매너 통일 (text-royalBlue로 되어 튀는 것 등을 다른 카드들과 매끄럽게 통일)
    content = content.replace(
        'h4 class="text-xs sm:text-sm font-black text-royalBlue flex items-center gap-1.5"',
        'h4 class="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-1.5"'
    )

    try:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)
        print("Successfully updated index.html typos, layouts, and tone-and-manner.")
    except Exception as e:
        print(f"Failed to write index.html: {e}")

if __name__ == "__main__":
    main()
