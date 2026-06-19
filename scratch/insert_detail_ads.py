# -*- coding: utf-8 -*-
import json
import urllib.request

def main():
    url = "https://ubaxyfxcsxsvrryowswb.supabase.co/rest/v1/ads"
    headers = {
        "apikey": "sb_publishable_JrM_2rrvppC105lHndMLkg_x2x0sLUE",
        "Authorization": "Bearer sb_publishable_JrM_2rrvppC105lHndMLkg_x2x0sLUE",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates"
    }
    
    # 주입할 상세페이지 광고 슬롯 데이터 정의
    data = [
        {
            "slot_name": "detail_top_banner",
            "active": True,
            "type": "direct",
            "title": "💎 [상세 상단] 실시간 경매 낙찰 예측 프리미엄 서비스",
            "desc": "과거 낙찰가 데이터 분석을 통해 가장 높은 확률의 입찰가를 추천합니다.",
            "image_url": "./ad_banner_detail_top.png",
            "link_url": "https://www.myauction.r-e.kr"
        },
        {
            "slot_name": "detail_mid_banner",
            "active": True,
            "type": "direct",
            "title": "⚡ [상세 중간] 특수물건 권리분석 및 리스크 진단 전문 과정",
            "desc": "유치권, 법정지상권 등 고난도 특수물건 수익 극대화 전략 패키지 강의.",
            "image_url": "./ad_banner_detail_mid.png",
            "link_url": "https://www.myauction.r-e.kr"
        },
        {
            "slot_name": "detail_bottom_banner",
            "active": True,
            "type": "direct",
            "title": "🔥 [상세 하단] NPL 부실채권 투자 비공개 회원 전용 컨설팅",
            "desc": "은행 부실채권 매입을 통한 경매 선점 전략 및 배당금 극대화 매니지먼트.",
            "image_url": "./ad_banner_sidebar.png",
            "link_url": "https://www.myauction.r-e.kr"
        },
        {
            "slot_name": "detail_footer_banner",
            "active": True,
            "type": "direct",
            "title": "🎁 [상세 최하단] 부동산 경공매 초보 탈출 핵심 가이드북 증정",
            "desc": "기초 권리분석부터 단독 입찰서 작성법까지 담은 2026 개정판 PDF 즉시 다운로드.",
            "image_url": "./ad_banner_detail_footer.png",
            "link_url": "https://www.myauction.r-e.kr"
        }
    ]
    
    req = urllib.request.Request(url, headers=headers, data=json.dumps(data).encode('utf-8'), method='POST')
    try:
        with urllib.request.urlopen(req) as response:
            print("=== INSERT SUCCESS ===")
            print("Status Code:", response.status)
    except Exception as e:
        print("Error inserting ads:", e)

if __name__ == "__main__":
    main()
