# -*- coding: utf-8 -*-
# scratch/inspect_theme_counts.py
# Supabase 실시간 데이터를 긁어와 각 AI 추천 테마별 매칭 데이터 건수를 진단합니다.

import json
import urllib.request
import re
from datetime import datetime

def calculate_remaining_days(date_str):
    if not date_str:
        return 9999
    try:
        close_date = datetime.strptime(date_str, "%Y-%m-%d")
        today = datetime.now()
        today = datetime(today.year, today.month, today.day)
        diff = close_date - today
        return diff.days
    except:
        return 9999

def estimate_rounds(appraisal, minimum, source):
    if not appraisal or not minimum or appraisal <= 0 or minimum <= 0:
        return {"round": 1, "failedCount": 0, "discount": 0}
    discount = round(((appraisal - minimum) / appraisal) * 100)
    
    # 간이 유찰 횟수 유추
    failed_count = 0
    if source in ["court", "court_etc"]:
        if discount >= 20:
            failed_count = 1
        if discount >= 36:
            failed_count = 2
        if discount >= 48:
            failed_count = 3
        if discount >= 59:
            failed_count = 4
    else:  # onbid
        if discount >= 10:
            failed_count = 1
        if discount >= 20:
            failed_count = 2
        if discount >= 30:
            failed_count = 3
        if discount >= 40:
            failed_count = 4
            
    return {"round": failed_count + 1, "failedCount": failed_count, "discount": discount}

def main():
    url = "https://ubaxyfxcsxsvrryowswb.supabase.co/rest/v1/properties?select=*"
    headers = {
        "apikey": "sb_publishable_JrM_2rrvppC105lHndMLkg_x2x0sLUE",
        "Authorization": "Bearer sb_publishable_JrM_2rrvppC105lHndMLkg_x2x0sLUE"
    }
    
    print("[*] Supabase properties 데이터 로딩 중...")
    
    # 1,000건 제한을 극복하기 위해 페이징
    all_data = []
    has_more = True
    offset = 0
    step = 1000
    
    while has_more:
        # Range 헤더를 이용해 페이징 처리
        req = urllib.request.Request(f"{url}&limit={step}&offset={offset}", headers=headers)
        try:
            with urllib.request.urlopen(req) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                if data and len(data) > 0:
                    all_data.extend(data)
                    print(f"    - Loaded {len(all_data)} items...")
                    if len(data) < step:
                        has_more = False
                    else:
                        offset += step
                else:
                    has_more = False
        except Exception as e:
            print(f"[-] Error loading data offset {offset}: {e}")
            has_more = False
            
    print(f"[+] 데이터 로딩 완료. 총 {len(all_data)}건의 매물이 존재합니다.")
    
    # 데이터 가공
    properties = []
    for item in all_data:
        rem_days = calculate_remaining_days(item.get("bidding_date"))
        properties.append({
            **item,
            "remaining_days": rem_days
        })
        
    # 테마별 필터 검사
    themes = {
        "clean_rights": "권리클린 (Expected Yield >= 20%, 권리하자 없음)",
        "half_price": "반값 격전지 (최저가/감정가 <= 40% 또는 유찰 3회 이상)",
        "hot_yongin": "반도체 HOT 용인 (주소에 '용인' 포함)",
        "lifestyle_3eok": "제주/서울 3억 이하 (제주주택 3억이하 / 서울빌라 3억이하 / 최저가 5천이하)",
        "yield_top": "상가 수익률 TOP (상업용자산 + Expected Yield >= 30%)",
        "redevelopment": "아파트 재건축 (주거용 + 준공 30년 이상)",
        "mini_land": "초소액 토지 (토지/대지/임야 등 + 최저가 2천만원 이하)",
        "auto_machinery": "실속 차량/동산 (차량/기계/유가증권/동산류)",
        "officetel_income": "월세 오피스텔 (오피스텔 + Expected Yield >= 15%)",
        "subway_safe": "역세권 대항력 안전 (도보 15분 이내 역세권 + 권리하자 없음)",
        "small_building": "꼬마빌딩 건물주 (상가/빌딩/다가구 등 + 최저가 5억~30억)",
        "school_district": "학세권 우수 교육 (주거용 + 학교/학군 키워드 포함 + 권리하자 없음)",
        "capital_single": "수도권 1인 가구 갭 (수도권 소형주택 + 2억 이하 + 도보 10분 역세권)",
        "local_healing": "지방 힐링 세컨하우스 (비수도권 주택 + 1억5천 이하)",
        "heavy_dropped": "줍줍! 70% 폭락 (최저가/감정가 <= 30%)",
        "factory_warehouse": "창업/물류 공장창고 (공장/창고 + 최저가 3억 이상)",
        "share_investment": "소액 지분 틈새투자 (지분 매물 + 최저가 5천만원 이하)"
    }
    
    print("\n=== 테마별 매칭 건수 진단 ===")
    
    for key, desc in themes.items():
        matched = 0
        for item in properties:
            address = item.get("address") or ""
            ptype = item.get("ptype") or ""
            notes = item.get("notes_content") or ""
            appraisal = item.get("appraised_value") or 0
            minimum = item.get("minimum_bid") or 0
            margin = max(0, appraisal - minimum)
            
            # expectedYield
            yield_val = 0.0
            if appraisal > 0:
                yield_val = (margin / appraisal) * 100
                
            # isClean
            risk_keywords = ["유치권", "법정지상권", "주의", "인수", "대항력 있음", "분묘기지권"]
            is_clean = True
            for k in risk_keywords:
                if k in notes:
                    is_clean = False
                    break
                    
            if key == "clean_rights":
                if is_clean and yield_val >= 20.0:
                    matched += 1
            elif key == "half_price":
                ratio = minimum / appraisal if appraisal > 0 else 1.0
                round_info = item.get("round_info") or ""
                if ratio <= 0.4:
                    matched += 1
                elif any(x in round_info for x in ["3회", "4회", "5회", "6회"]):
                    matched += 1
            elif key == "hot_yongin":
                if "용인" in address:
                    matched += 1
            elif key == "lifestyle_3eok":
                is_jeju_house = "제주" in address and minimum <= 300000000 and any(x in ptype for x in ["주택", "단독"])
                is_seoul_villa = "서울" in address and minimum <= 300000000 and any(x in ptype for x in ["다세대", "빌라", "연립"])
                if is_jeju_house or is_seoul_villa or minimum <= 50000000:
                    matched += 1
            elif key == "yield_top":
                is_shop_or_office = any(x in ptype for x in ["상가", "오피스텔", "점포", "근린", "상업"])
                if is_shop_or_office and yield_val >= 30.0:
                    matched += 1
            elif key == "redevelopment":
                # redevelopment는 준공년도를 알아야 하는데 metadata 파싱 필요
                built_year = 0
                meta_match = re.search(r"__METADATA__:({.*})__", notes)
                if meta_match:
                    try:
                        meta = json.loads(meta_match.group(1))
                        built_year = meta.get("complex_info", {}).get("built_year") or 0
                    except:
                        pass
                current_year = datetime.now().year
                is_resident = any(x in ptype for x in ["아파트", "다세대", "빌라", "연립"])
                if is_resident and built_year > 0 and (current_year - built_year) >= 30:
                    matched += 1
            elif key == "mini_land":
                is_land = any(x in ptype for x in ["토지", "대지", "임야", "잡종지", "대", "전", "답"])
                if is_land and minimum <= 20000000:
                    matched += 1
            elif key == "auto_machinery":
                type_lower = ptype.lower()
                is_vehicle = any(x in type_lower for x in ["차량", "운송", "자동차", "선박", "항공기", "중기", "지게차", "suv"])
                is_security = any(x in type_lower for x in ["유가증권", "주식", "채권", "지분", "증권"])
                is_machinery = any(x in type_lower for x in ["기계", "장비", "기구", "설비", "기기"]) and "운송장비" not in type_lower
                is_goods = any(x in type_lower for x in ["물품", "기타물품", "동산", "기타동산"]) or item.get("source") in ["onbid_etc", "court_etc"]
                if is_vehicle or is_security or is_machinery or is_goods:
                    matched += 1
            elif key == "officetel_income":
                if "오피스텔" in ptype and yield_val >= 15.0:
                    matched += 1
            elif key == "subway_safe":
                # subway_info 또는 metadata 내 walk_time 파싱
                walk_time = 999
                subway_info = item.get("subway_info") or None
                meta_match = re.search(r"__METADATA__:({.*})__", notes)
                if meta_match:
                    try:
                        meta = json.loads(meta_match.group(1))
                        if "subway_info" in meta:
                            subway_info = meta["subway_info"]
                    except:
                        pass
                if subway_info:
                    walk_time = subway_info.get("walk_time") or 999
                    if walk_time == 999 and subway_info.get("distance"):
                        walk_time = round(subway_info["distance"] / 80)
                if walk_time == 999:
                    dong_match = re.search(r"([가-힣]+(?:동|읍|면|리))\s", address)
                    if dong_match:
                        dong_name = dong_match.group(1)
                        REGIONAL_INFRA_DB = {
                            "화곡동": 320, "가락동": 280, "반포동": 210, "정자동": 350,
                            "다산동": 410, "둔산동": 450, "범어동": 310, "우동": 240,
                            "봉선동": 620, "옥동": 850, "청라동": 580, "삼전동": 180,
                            "대치동": 190, "서초동": 250, "역삼동": 220, "상계동": 300,
                            "중계동": 340, "신림동": 420, "구로동": 380, "등촌동": 290,
                            "목동": 270, "신정동": 310, "성산동": 260, "망원동": 330
                        }
                        if dong_name in REGIONAL_INFRA_DB:
                            walk_time = round(REGIONAL_INFRA_DB[dong_name] / 80)
                if is_clean and walk_time <= 15:
                    matched += 1
            elif key == "small_building":
                is_commercial = any(x in ptype for x in ["상가", "빌딩", "근린", "점포", "상업", "다가구", "주택"])
                if is_commercial and 500000000 <= minimum <= 3000000000:
                    matched += 1
            elif key == "school_district":
                is_resident = any(x in ptype for x in ["아파트", "다세대", "빌라", "연립"])
                has_school = any(x in notes for x in ["학교", "초등", "학군", "중학교", "고등학교"])
                if is_clean and is_resident and has_school:
                    matched += 1
            elif key == "capital_single":
                is_capital = any(x in address for x in ["서울", "경기", "인천"])
                is_single = any(x in ptype for x in ["오피스텔", "다세대", "빌라", "연립", "도시형"])
                walk_time = 999
                # subway_info 파싱
                subway_info = item.get("subway_info") or None
                meta_match = re.search(r"__METADATA__:({.*})__", notes)
                if meta_match:
                    try:
                        meta = json.loads(meta_match.group(1))
                        if "subway_info" in meta:
                            subway_info = meta["subway_info"]
                    except:
                        pass
                if subway_info:
                    walk_time = subway_info.get("walk_time") or 999
                    if walk_time == 999 and subway_info.get("distance"):
                        walk_time = round(subway_info["distance"] / 80)
                if walk_time == 999:
                    dong_match = re.search(r"([가-힣]+(?:동|읍|면|리))\s", address)
                    if dong_match:
                        dong_name = dong_match.group(1)
                        REGIONAL_INFRA_DB = {
                            "화곡동": 320, "가락동": 280, "반포동": 210, "정자동": 350,
                            "다산동": 410, "둔산동": 450, "범어동": 310, "우동": 240,
                            "봉선동": 620, "옥동": 850, "청라동": 580, "삼전동": 180,
                            "대치동": 190, "서초동": 250, "역삼동": 220, "상계동": 300,
                            "중계동": 340, "신림동": 420, "구로동": 380, "등촌동": 290,
                            "목동": 270, "신정동": 310, "성산동": 260, "망원동": 330
                        }
                        if dong_name in REGIONAL_INFRA_DB:
                            walk_time = round(REGIONAL_INFRA_DB[dong_name] / 80)
                if is_capital and is_single and minimum <= 200000000 and walk_time <= 10:
                    matched += 1
            elif key == "local_healing":
                is_capital = any(x in address for x in ["서울", "경기", "인천", "서울특별시", "경기도", "인천광역시"])
                is_healing = any(x in ptype for x in ["주택", "단독", "전원"])
                if not is_capital and is_healing and minimum <= 150000000:
                    matched += 1
            elif key == "heavy_dropped":
                ratio = minimum / appraisal if appraisal > 0 else 1.0
                if ratio <= 0.3:
                    matched += 1
            elif key == "factory_warehouse":
                is_industry = any(x in ptype for x in ["공장", "창고", "산업", "아파트형공장"])
                if is_industry and minimum >= 300000000:
                    matched += 1
            elif key == "share_investment":
                is_share = "지분" in ptype or "지분" in notes or "지분" in item.get("title", "")
                if is_share and minimum <= 50000000:
                    matched += 1
                    
        print(f" -> {key:18}: {matched:5} 건 매칭 ({desc})")

if __name__ == "__main__":
    main()
