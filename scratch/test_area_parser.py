# -*- coding: utf-8 -*-
# 고도화된 extract_court_areas 알고리즘을 다양한 제목 및 소재지 텍스트로 테스트하는 스크립트입니다.
import re

# 테스트 대상 함수 복사본 (버그 수정 버전)
def extract_court_areas(st_text, ptype="", appraised_value=0, address=""):
    exclusive_area = 0.0
    land_area = 0.0
    is_estimated_exclusive = True
    is_estimated_land = True
    
    excl_est_type = "fake"
    total_floors = 0
    total_area = 0.0
    floor_areas = {}

    st_clean = st_text or ""
    addr_clean = address or ""
    combined_text = f"{st_clean} {addr_clean}".strip()
    
    # 0. ptype 유추 보강
    ptype_clean = ptype or ""
    if not ptype_clean or ptype_clean in ["기타", "대지", "토지", "--"]:
        apt_kws = ["아파트", "래미안", "힐스테이트", "자이", "푸르지오", "더샵", "e편한세상", "롯데캐슬", "아이파크", "두산위브", "벽산", "우성", "현대", "한신", "주공", "타운"]
        villa_kws = ["빌라", "다세대", "연립", "맨션", "하이츠", "빌", "주택"]
        officetel_kws = ["오피스텔", "아파텔"]
        
        if any(k in combined_text for k in apt_kws):
            ptype_clean = "아파트"
        elif any(k in combined_text for k in officetel_kws):
            ptype_clean = "오피스텔"
        elif any(k in combined_text for k in villa_kws):
            ptype_clean = "다세대"

    is_non_building = False
    non_building_ptypes = ["토지", "임야", "도로", "대지", "잡종지", "전", "답", "과수원", "목장", "광천지", "염전", "묘지", "사적지", "목장용지"]
    if any(k in ptype_clean for k in non_building_ptypes):
        is_non_building = True
    else:
        has_land_keyword = any(k in combined_text for k in ["토지만매각", "임야", "잡종지", "도로"])
        has_building_keyword = any(k in combined_text for k in ["아파트", "빌라", "다세대", "연립", "주택", "건물", "상가", "공장", "창고", "호"])
        if has_land_keyword and not has_building_keyword:
            is_non_building = True

    # 1. 대지권 면적 추출 (㎡ 및 평 단위 지원)
    land_match_sqm = re.search(r'(?:대지권|토지대지권|대지|토지)\s*(?:면적)?\s*(\d+(?:\.\d+)?)\s*㎡', combined_text)
    if land_match_sqm:
        try:
            land_area = float(land_match_sqm.group(1))
            is_estimated_land = False
        except ValueError:
            pass
    if land_area == 0.0:
        land_match_pyung = re.search(r'(?:대지권|토지대지권|대지|토지)\s*(?:면적)?\s*(\d+(?:\.\d+)?)\s*평(?:형)?', combined_text)
        if land_match_pyung:
            try:
                land_area = round(float(land_match_pyung.group(1)) * 3.3058, 2)
                is_estimated_land = False
            except ValueError:
                pass

    # 2. 층수 및 호수 파싱
    target_floor = None
    target_room = None
    
    floor_room_match = re.search(r'(?:(?:지하|지층)\s*(\d+)|(\d+))\s*층\s*([가-힣\d\-]+)\s*호', combined_text)
    if floor_room_match:
        is_basement = "지하" in floor_room_match.group(0) or "지층" in floor_room_match.group(0)
        floor_num = floor_room_match.group(1) or floor_room_match.group(2)
        target_floor = f"지하{floor_num}층" if is_basement else f"{floor_num}층"
        target_room = floor_room_match.group(3)
    else:
        basement_room_match = re.search(r'지층\s*([가-힣\d\-]+)\s*호', combined_text)
        if basement_room_match:
            target_floor = "지층"
            target_room = basement_room_match.group(1)
        else:
            room_only_match = re.search(r'\b(\d{3,4})\s*호', combined_text)
            if room_only_match:
                room_str = room_only_match.group(1)
                target_room = room_str
                if len(room_str) == 3:
                    target_floor = f"{room_str[0]}층"
                elif len(room_str) == 4:
                    target_floor = f"{room_str[:2]}층"

    # 3. 층별 면적 정보 딕셔너리 구축 (㎡ 및 평 단위 지원)
    floor_area_matches = re.finditer(r'(지층|지하\s*\d*층|\d+층)\s*(\d+(?:\.\d+)?)\s*(㎡|평(?:형)?)', combined_text)
    for m in floor_area_matches:
        f_name = m.group(1).replace(" ", "")
        val = float(m.group(2))
        unit = m.group(3)
        if "평" in unit:
            val = round(val * 3.3058, 2)
        floor_areas[f_name] = val

    total_floors = len(floor_areas)
    total_floors_match = re.search(r'(\d+)\s*층\s*(?:다세대주택|연립주택|빌라|건물|아파트)', combined_text)
    if total_floors_match:
        try:
            total_floors = max(total_floors, int(total_floors_match.group(1)))
        except ValueError:
            pass

    total_area = round(sum(floor_areas.values()), 2)

    # 4. 단독 기재된 전용면적 후보 추출
    candidate_exclusive_areas = []
    all_area_matches_sqm = re.findall(r'(\d+(?:\.\d+)?)\s*㎡', combined_text)
    for val_str in all_area_matches_sqm:
        try:
            val = float(val_str)
            if val not in floor_areas.values() and val != land_area:
                candidate_exclusive_areas.append(val)
        except ValueError:
            pass
            
    all_area_matches_pyung = re.findall(r'(\d+(?:\.\d+)?)\s*평(?:형)?', combined_text)
    for val_str in all_area_matches_pyung:
        try:
            val = round(float(val_str) * 3.3058, 2)
            if val not in floor_areas.values() and val != land_area:
                candidate_exclusive_areas.append(val)
        except ValueError:
            pass

    # 5. 전용면적 결정
    excl_keyword_match = re.search(r'(?:건물전용|전용면적|전용|건물)\s*(\d+(?:\.\d+)?)\s*(㎡|평|평형)?', combined_text)
    if excl_keyword_match:
        try:
            val = float(excl_keyword_match.group(1))
            unit = excl_keyword_match.group(2)
            if unit == "평" or unit == "평형":
                exclusive_area = round(val * 3.3058, 2)
            elif not unit:
                if 10 <= val <= 55 and val.is_integer():
                    exclusive_area = round(val * 3.3058, 2)
                else:
                    exclusive_area = val
            else:
                exclusive_area = val
            is_estimated_exclusive = False
            excl_est_type = "exact"
        except ValueError:
            pass

    if exclusive_area == 0.0 and candidate_exclusive_areas:
        exclusive_area = candidate_exclusive_areas[-1]
        is_estimated_exclusive = False
        excl_est_type = "exact"

    if exclusive_area == 0.0 and floor_areas:
        total_floor_area = 0.0
        if target_floor and target_floor in floor_areas:
            total_floor_area = floor_areas[target_floor]
        else:
            total_floor_area = max(floor_areas.values())
            
        is_villa = any(k in combined_text for k in ["다세대", "빌라", "연립"])
        divisor = 2
        if target_room:
            room_digits = re.sub(r'\D', '', target_room)
            if room_digits:
                try:
                    room_num = int(room_digits)
                    if not is_villa:
                        if room_num >= 100:
                            est_divisor = room_num // 100
                            if est_divisor <= 1:
                                divisor = 2
                            else:
                                divisor = est_divisor
                        else:
                            divisor = room_num if room_num > 1 else 2
                    else:
                        last_digit = room_num % 10
                        if last_digit in [1, 2]:
                            divisor = 2
                        elif last_digit in [3, 4]:
                            divisor = 4
                        elif last_digit in [5, 6]:
                            divisor = 6
                        elif last_digit > 6:
                            divisor = last_digit
                except ValueError:
                    pass
                    
        if is_villa:
            est_total_floors = total_floors if total_floors > 0 else 1
            exclusive_area = round(total_area / (est_total_floors * divisor), 2)
        else:
            exclusive_area = round(total_floor_area / divisor, 2)
            
        is_estimated_exclusive = True
        excl_est_type = "estimated"

    # 단위 생략 숫자 매칭 유추 (예: '아파트 84.95', '오피스텔 59')
    if exclusive_area == 0.0:
        no_unit_match = re.search(r'\b(59|84|114|135|165|24|32|34|45)(?:\.\d+)?\s*(?:형|타입|py)?\b', combined_text)
        if no_unit_match:
            try:
                val = float(no_unit_match.group(0).split()[0].replace("형", "").replace("타입", "")) # 숫자만 정확히 발췌
                if val <= 50:
                    exclusive_area = round(val * 3.3058, 2)
                else:
                    exclusive_area = val
                is_estimated_exclusive = True
                excl_est_type = "estimated"
            except ValueError:
                pass

    if exclusive_area == 0.0 and not land_match_sqm and not land_match_pyung:
        single_match = re.search(r'(\d+(?:\.\d+)?)\s*(㎡|평(?:형)?)', combined_text)
        if single_match:
            try:
                val = float(single_match.group(1))
                unit = single_match.group(2)
                if "평" in unit:
                    val = round(val * 3.3058, 2)
                has_land_keywords = any(k in combined_text for k in ["임야", "토지", "대지", "잡종지", "대", "전", "답"])
                has_building_keywords = any(k in combined_text for k in ["아파트", "빌라", "다세대", "연립", "주택", "건물", "상가", "공장", "창고", "호"])
                if has_land_keywords and not has_building_keywords:
                    land_area = val
                    is_estimated_land = False
                else:
                    exclusive_area = val
                    is_estimated_exclusive = False
                    excl_est_type = "exact"
            except ValueError:
                pass

    if exclusive_area == 0.0 and ptype_clean:
        if any(k in ptype_clean for k in ["아파트", "오피스텔"]):
            exclusive_area = 84.9
            is_estimated_exclusive = True
            excl_est_type = "estimated"
        elif any(k in ptype_clean for k in ["다세대", "빌라", "연립", "주택"]):
            exclusive_area = 59.9
            is_estimated_exclusive = True
            excl_est_type = "estimated"

    if exclusive_area == 0.0:
        excl_est_type = "fake"

    if is_non_building:
        exclusive_area = 0.0
        is_estimated_exclusive = False
        excl_est_type = "exact"

    return exclusive_area, land_area, excl_est_type

# 테스트 기동
test_cases = [
    ("서울 아파트 전용 18평 낙찰가 6억", "아파트", 59.5, 0.0),
    ("강남구 대치동 자이아파트 101동 804호 84.95 대지권 42.1㎡", "아파트", 84.95, 42.1),
    ("인천 오피스텔 302호 24평형 대지 8.2평", "오피스텔", 79.34, 27.11),
    ("경기도 연립주택 지층 101호 전용 59㎡ 대지권 30㎡", "다세대", 59.0, 30.0),
    ("강원도 토지 대지 250평 매각", "토지", 0.0, 826.45),
    ("대전 유성구 한빛아파트 120동 1502호 84형", "기타", 84.0, 0.0)
]

print("[*] 파싱 알고리즘 통합 테스트를 개시합니다.")
all_passed = True
for idx, (txt, ptype, exp_ex, exp_ld) in enumerate(test_cases):
    ex, ld, est_type = extract_court_areas(txt, ptype)
    # 오차 범위 0.5 이내로 일치 체크
    pass_ex = abs(ex - exp_ex) < 0.5
    pass_ld = abs(ld - exp_ld) < 0.5
    if pass_ex and pass_ld:
        print(f"[+] Case {idx+1} 성공: '{txt}' -> 전용={ex}㎡(예상={exp_ex}), 대지={ld}㎡(예상={exp_ld})")
    else:
        print(f"[-] Case {idx+1} 실패: '{txt}' -> 전용={ex}㎡(예상={exp_ex}), 대지={ld}㎡(예상={exp_ld})")
        all_passed = False

if all_passed:
    print("[+] 모든 테스트 케이스가 성공적으로 검증되었습니다!")
else:
    print("[-] 일부 테스트 케이스에서 매칭 실패가 검출되었습니다.")
