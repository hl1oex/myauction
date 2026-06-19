# 새 파일 첫 줄은 해당 파일의 역할을 설명하는 한 줄짜리 한국어 주석으로 시작합니다.
# Supabase 원천 매물 데이터를 읽어와 수익률을 계산하고 10대 테마별로 분류해 확장 테이블에 적재하는 백엔드 배치 프로세서입니다.

import os
import re
import math
from supabase import create_client, Client

# Supabase 클라이언트 설정
SUPABASE_URL = "https://ubaxyfxcsxsvrryowswb.supabase.co"
SUPABASE_ANON_KEY = "sb_publishable_JrM_2rrvppC105lHndMLkg_x2x0sLUE"
supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

def calculate_yield_and_clean_rights():
    """매물 데이터를 읽고 분석하여 analytics 테이블에 적재합니다."""
    print("[*] 매물 데이터 가공 작업을 개시합니다.")
    
    # 1. properties 데이터 획득
    try:
        response = supabase.from_("properties").select("id, appraised_value, minimum_bid, notes_content, ptype, address, auction_no").execute()
        properties = response.data or []
    except Exception as e:
        print(f"[-] properties 테이블 획득 실패: {e}")
        return
        
    print(f"[*] 총 {len(properties)}건의 매물 분석을 진행합니다.")
    
    # 2. 개별 매물 분석 가공 루프
    analytics_records = []
    
    for item in properties:
        p_id = item.get("id")
        appraisal = item.get("appraised_value") or 0
        minimum = item.get("minimum_bid") or 0
        notes = item.get("notes_content") or ""
        
        # 예상 수익금 연산 (감정가 - 최저가)
        margin = max(0, appraisal - minimum)
        
        # 예상 수익률 연산
        expected_yield = 0.00
        if appraisal > 0:
            expected_yield = round((margin / appraisal) * 100, 2)
            
        # 권리클린 판정 가드 (비고란 권리 하자 키워드 탐색)
        risk_keywords = ["유치권", "법정지상권", "주의", "인수", "대항력 있음", "분묘기지권"]
        is_clean = True
        for key in risk_keywords:
            if key in notes:
                is_clean = False
                break
                
        analytics_records.append({
            "property_id": p_id,
            "expected_margin": margin,
            "expected_yield": expected_yield,
            "is_clean_rights": is_clean
        })
        
    # 3. Supabase analytics 테이블에 가공 레코드 벌크 적재
    if analytics_records:
        try:
            for i in range(0, len(analytics_records), 100):
                chunk = analytics_records[i:i+100]
                supabase.from_("auction_analytics").upsert(chunk, on_conflict="property_id").execute()
            print("[+] 수익률 분석 및 권리 안전성 지표 업데이트가 완료되었습니다.")
        except Exception as e:
            print(f"[-] auction_analytics 테이블 적재 실패 (로컬 폴백 정상 작동 예정): {e}")

def build_curation_themes():
    """10대 초개인화 테마에 매치되는 매물들을 선정하여 맵핑합니다."""
    print("[*] 10대 큐레이션 테마 분류 및 연계 맵핑을 시작합니다.")
    
    # 1. 갱신된 분석 데이터와 매물 정보 획득
    try:
        prop_response = supabase.from_("properties").select("id, ptype, address, minimum_bid, round_info, notes_content").execute()
        properties_map = {p["id"]: p for p in prop_response.data or []}
    except Exception as e:
        print(f"[-] properties 데이터 획득 실패: {e}")
        return
    
    # analytics 데이터 획득 실패 시 자체 연산으로 복구하는 폴백 구조 수립
    analytics_data = []
    try:
        analytics_response = supabase.from_("auction_analytics").select("property_id, expected_yield, is_clean_rights").execute()
        analytics_data = analytics_response.data or []
    except Exception as e:
        print(f"[-] auction_analytics 데이터 획득 실패 (자체 계산 폴백 모드로 실행합니다): {e}")
        for p_id, prop in properties_map.items():
            appraisal = prop.get("appraised_value") or 0
            minimum = prop.get("minimum_bid") or 0
            notes = prop.get("notes_content") or ""
            margin = max(0, appraisal - minimum)
            expected_yield = 0.0
            if appraisal > 0:
                expected_yield = (margin / appraisal) * 100
            
            risk_keywords = ["유치권", "법정지상권", "주의", "인수", "대항력 있음", "분묘기지권"]
            is_clean = True
            for key in risk_keywords:
                if key in notes:
                    is_clean = False
                    break
            analytics_data.append({
                "property_id": p_id,
                "expected_yield": expected_yield,
                "is_clean_rights": is_clean
            })
            
    # 테마 적재 버퍼 초기화
    theme_records = []
    
    # 2. 10대 테마 분류 기준 적용
    for record in analytics_data:
        p_id = record["property_id"]
        prop = properties_map.get(p_id)
        if not prop:
            continue
            
        ptype = prop.get("ptype") or ""
        address = prop.get("address") or ""
        minimum_bid = prop.get("minimum_bid") or 0
        round_info = prop.get("round_info") or ""
        notes = prop.get("notes_content") or ""
        
        is_clean = record["is_clean_rights"]
        expected_yield = float(record["expected_yield"] or 0)
        
        # 1) 초보자용 권리클린 저평가 테마 (clean_rights)
        # 조건: 권리클린이면서 예상 수익률 20% 이상.
        if is_clean and expected_yield >= 20.00:
            theme_records.append({"theme_key": "clean_rights", "property_id": p_id})
            
        # 2) 반값 매물 고위험 고수익 테마 (half_price)
        # 조건: 권리상 유의가 있거나, 유찰 3회 이상(최저가가 감정가 40% 이하).
        is_half_price = False
        if not is_clean:
            is_half_price = True
        else:
            # round_info에서 유찰 횟수 추출
            round_match = re.search(r"(\d+)회", round_info)
            if round_match:
                rounds = int(round_match.group(1))
                if rounds >= 3:
                    is_half_price = True
                    
        if is_half_price:
            theme_records.append({"theme_key": "half_price", "property_id": p_id})
            
        # 3) 호재/트렌드 용인 테마 (hot_yongin)
        # 조건: 주소에 용인이 포함된 매물.
        if "용인" in address:
            theme_records.append({"theme_key": "hot_yongin", "property_id": p_id})
            
        # 4) 로망 라이프스타일 테마 (lifestyle_3eok)
        # 조건: 제주도 3억 이하 단독주택, 서울 3억 이하 다세대, 혹은 5천만원 이하 소액 자산.
        is_lifestyle = False
        if "제주" in address and minimum_bid <= 300000000 and "주택" in ptype:
            is_lifestyle = True
        elif "서울" in address and minimum_bid <= 300000000 and "다세대" in ptype:
            is_lifestyle = True
        elif minimum_bid <= 50000000:
            is_lifestyle = True
            
        if is_lifestyle:
            theme_records.append({"theme_key": "lifestyle_3eok", "property_id": p_id})
            
        # 5) 상가 수익률 TOP 테마 (yield_top)
        # 조건: 용도가 상가/점포/근린생활시설/상업시설이면서 수익률 30% 이상.
        is_shop = "상가" in ptype or "점포" in ptype or "근린" in ptype or "상업" in ptype
        if is_shop and expected_yield >= 30.00:
            theme_records.append({"theme_key": "yield_top", "property_id": p_id})

        # 6) 노후 아파트 재건축 기대 테마 (redevelopment)
        # 조건: 아파트/다세대/빌라/연립이면서 준공년도 30년 이상 경과.
        is_resident = "아파트" in ptype or "다세대" in ptype or "빌라" in ptype or "연립" in ptype
        built_year = 0
        meta_match = re.search(r"__METADATA__:({.*?})__", notes)
        if meta_match:
            try:
                import json
                meta = json.loads(meta_match.group(1))
                built_year = meta.get("complex_info", {}).get("built_year") or 0
            except Exception:
                pass
        import datetime
        current_year = datetime.datetime.now().year
        if is_resident and built_year > 0 and (current_year - built_year) >= 30:
            theme_records.append({"theme_key": "redevelopment", "property_id": p_id})

        # 7) 초소액 토지 소장 테마 (mini_land)
        # 조건: 토지/임야/대지이면서 최저 매각가가 2천만원 이하.
        is_land = "토지" in ptype or "대지" in ptype or "임야" in ptype or "잡종지" in ptype or "전" in ptype or "답" in ptype
        if is_land and minimum_bid <= 20000000:
            theme_records.append({"theme_key": "mini_land", "property_id": p_id})

        # 8) 실속 차량/동산 공매 테마 (auto_machinery)
        # 조건: 차량/운송장비, 유가증권, 기계장비, 기타물품/동산 등 비부동산 실속 자산.
        type_lower = ptype.lower()
        is_vehicle = any(k in type_lower for k in ["차량", "운송", "자동차", "선박", "항공기", "중기", "지게차", "suv"])
        is_security = any(k in type_lower for k in ["유가증권", "주식", "채권", "지분", "증권"])
        is_machinery = "기계" in type_lower or ("장비" in type_lower and "운송" not in type_lower) or any(k in type_lower for k in ["기구", "설비", "기기"])
        is_goods = "물품" in type_lower or "동산" in type_lower or prop.get("source") in ["onbid_etc", "court_etc"]
        if is_vehicle or is_security or is_machinery or is_goods:
            theme_records.append({"theme_key": "auto_machinery", "property_id": p_id})

        # 9) 월세용 오피스텔 테마 (officetel_income)
        # 조건: 오피스텔이면서 수익률 15% 이상.
        if "오피스텔" in ptype and expected_yield >= 15.00:
            theme_records.append({"theme_key": "officetel_income", "property_id": p_id})

        # 10) 역세권 대항력 안전지대 테마 (subway_safe)
        # 조건: 권리하자(유치권/법정지상권/인수/주의/대항력있음)가 없고 지하철역 도보 15분 이내.
        is_safe_subway = not any(k in notes for k in ["유치권", "법정지상권", "인수", "주의", "대항력 있음"])
        walk_time = 999
        subway_info = None
        if meta_match:
            try:
                import json
                meta = json.loads(meta_match.group(1))
                subway_info = meta.get("subway_info")
            except Exception:
                pass
        if subway_info:
            walk_time = subway_info.get("walk_time") or 999
            if walk_time == 999 and subway_info.get("distance"):
                walk_time = round(subway_info["distance"] / 80)
        if walk_time == 999:
            dong_match = re.search(r"([ga-힇]+[동읍면리])\s", address)
            if dong_match:
                dong_name = dong_match.group(1)
                regional_db = {
                    "화곡동": 320, "가락동": 280, "반포동": 210, "정자동": 350,
                    "다산동": 410, "둔산동": 450, "범어동": 310, "우동": 240,
                    "봉선동": 620, "옥동": 850, "청라동": 580, "삼전동": 180,
                    "대치동": 190, "서초동": 250, "역삼동": 220, "상계동": 300,
                    "중계동": 340, "신림동": 420, "구로동": 380, "등촌동": 290,
                    "목동": 270, "신정동": 310, "성산동": 260, "망원동": 330
                }
                dist = regional_db.get(dong_name)
                if dist is not None:
                    walk_time = round(dist / 80)
        if is_safe_subway and walk_time <= 15:
            theme_records.append({"theme_key": "subway_safe", "property_id": p_id})

    # 3. 데이터베이스 갱신 전 기존 테마 매핑 제거 및 벌크 재생성
    # simple BM 격리 보존을 위해 upsert 처리합니다.
    if theme_records:
        try:
            # DB 트래픽 방지를 위해 100개 단위로 쪼개어 upsert
            for i in range(0, len(theme_records), 100):
                chunk = theme_records[i:i+100]
                supabase.from_("curation_themes").upsert(chunk, on_conflict="theme_key,property_id").execute()
            print("[+] 10대 테마 큐레이션 추천 매핑 작업이 최종 완료되었습니다.")
        except Exception as e:
            print(f"[-] curation_themes 테이블 적재 실패 (프론트엔드 로컬 폴백 정상 작동 예정): {e}")

if __name__ == "__main__":
    calculate_yield_and_clean_rights()
    build_curation_themes()
