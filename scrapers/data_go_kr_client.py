# 공공데이터포털(Data.go.kr)의 국토교통부 건축물대장 API를 연동하여 건물의 층별 명세 및 단지 정보 실데이터를 획득하는 모듈입니다.
import os
import requests
import xml.etree.ElementTree as ET
import json

def get_data_go_kr_key():
    """공공데이터포털 API 호출에 사용할 인증키를 로드합니다."""
    key_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "config", "data_go_kr_key.txt")
    if os.path.exists(key_path):
        try:
            with open(key_path, "r", encoding="utf-8") as f:
                return f.read().strip()
        except Exception as e:
            print(f"[-] 공공데이터포털 인증키 로드 실패: {e}")
    return None

def parse_pnu_code(pnu):
    """19자리 PNU 코드를 분석하여 건축물대장 API에 필요한 시군구, 법정동, 번, 지를 획득합니다."""
    if not pnu or len(pnu) < 19:
        return None
        
    sigungu_cd = pnu[0:5]
    bjdong_cd = pnu[5:10]
    plat_gb_cd = "0" if pnu[10] == "1" else "1" # PNU 1(대지) -> 대장 0, PNU 2(산) -> 대장 1
    bun = pnu[11:15]
    ji = pnu[15:19]
    
    return {
        "sigunguCd": sigungu_cd,
        "bjdongCd": bjdong_cd,
        "platGbCd": plat_gb_cd,
        "bun": bun,
        "ji": ji
    }

def fetch_building_register_title(pnu):
    """건축물대장 표제부 조회를 통해 총 세대수, 준공년도(사용승인일), 주구조명 정보를 획득합니다."""
    service_key = get_data_go_kr_key()
    if not service_key:
        return None
        
    pnu_parts = parse_pnu_code(pnu)
    if not pnu_parts:
        return None
        
    # 건축HUB API 엔드포인트 적용
    url = "http://apis.data.go.kr/1613000/BldRgstHubService/getBrTitleInfo"
    params = {
        "serviceKey": service_key,
        "sigunguCd": pnu_parts["sigunguCd"],
        "bjdongCd": pnu_parts["bjdongCd"],
        "platGbCd": pnu_parts["platGbCd"],
        "bun": pnu_parts["bun"],
        "ji": pnu_parts["ji"],
        "numOfRows": "10",
        "pageNo": "1"
    }
    
    try:
        res = requests.get(url, params=params, timeout=8)
        if res.status_code == 200:
            root = ET.fromstring(res.text)
            
            # 응답 코드 검증
            result_code = root.find(".//resultCode")
            if result_code is not None and result_code.text != "00":
                print(f"[-] 건축물대장 API 오류 ({result_code.text}): {root.find('.//resultMsg').text}")
                return None
                
            items = root.findall(".//item")
            if not items:
                return None
                
            # 가장 신뢰도 높은 첫 번째 주 건축물 정보를 선택
            item = items[0]
            
            # 사용승인일 파싱 (예: '20200812' -> '2020')
            use_aprv_day = item.find("useAprvDay")
            built_year = None
            if use_aprv_day is not None and use_aprv_day.text and len(use_aprv_day.text) >= 4:
                try:
                    built_year = int(use_aprv_day.text[:4])
                except ValueError:
                    pass
                    
            # 총 세대수
            fmly_co = item.find("fmlyCo")
            total_households = 0
            if fmly_co is not None and fmly_co.text:
                try:
                    total_households = int(fmly_co.text)
                except ValueError:
                    pass
                    
            # 세대수가 0이면 가구수나 호수도 추가 확인
            if total_households == 0:
                hseh_co = item.find("hsehCo")
                if hseh_co is not None and hseh_co.text:
                    try:
                        total_households = int(hseh_co.text)
                    except ValueError:
                        pass
                        
            # 주구조
            strct_cd_nm = item.find("strctCdNm")
            building_structure = strct_cd_nm.text.strip() if strct_cd_nm is not None and strct_cd_nm.text else None
            
            # 주차대수 (자주식 + 기계식)
            indr_auto_utcnt = item.find("indrAutoUtcnt") # 옥내 자주식
            oudr_auto_utcnt = item.find("oudrAutoUtcnt") # 옥외 자주식
            indr_mech_utcnt = item.find("indrMechUtcnt") # 옥내 기계식
            oudr_mech_utcnt = item.find("oudrMechUtcnt") # 옥외 기계식
            
            parking_count = 0
            for parking_field in [indr_auto_utcnt, oudr_auto_utcnt, indr_mech_utcnt, oudr_mech_utcnt]:
                if parking_field is not None and parking_field.text:
                    try:
                        parking_count += int(parking_field.text)
                    except ValueError:
                        pass
                        
            return {
                "built_year": built_year,
                "total_households": total_households if total_households > 0 else None,
                "building_structure": building_structure,
                "parking_count": parking_count if parking_count > 0 else None
            }
    except Exception as e:
        print(f"[-] 건축물대장 표제부 API 통신 실패: {e}")
        
    return None

def fetch_building_register_floors(pnu):
    """건축물대장 층별개요 조회를 통해 각 층의 명칭 및 전용면적 명세를 가져옵니다."""
    service_key = get_data_go_kr_key()
    if not service_key:
        return None
        
    pnu_parts = parse_pnu_code(pnu)
    if not pnu_parts:
        return None
        
    # 건축HUB API 엔드포인트 적용
    url = "http://apis.data.go.kr/1613000/BldRgstHubService/getBrFlrOulnInfo"
    params = {
        "serviceKey": service_key,
        "sigunguCd": pnu_parts["sigunguCd"],
        "bjdongCd": pnu_parts["bjdongCd"],
        "platGbCd": pnu_parts["platGbCd"],
        "bun": pnu_parts["bun"],
        "ji": pnu_parts["ji"],
        "numOfRows": "100",
        "pageNo": "1"
    }
    
    try:
        res = requests.get(url, params=params, timeout=8)
        if res.status_code == 200:
            root = ET.fromstring(res.text)
            
            result_code = root.find(".//resultCode")
            if result_code is not None and result_code.text != "00":
                return None
                
            items = root.findall(".//item")
            if not items:
                return None
                
            floor_areas = {}
            total_area = 0.0
            max_floor = 0
            
            for item in items:
                flr_no_el = item.find("flrNo")
                flr_gb_cd_nm = item.find("flrGbCdNm")
                area_el = item.find("area")
                
                if area_el is not None and area_el.text:
                    try:
                        area_val = float(area_el.text)
                        flr_no = int(flr_no_el.text) if flr_no_el is not None and flr_no_el.text else 1
                        flr_gb = flr_gb_cd_nm.text.strip() if flr_gb_cd_nm is not None and flr_gb_cd_nm.text else "지상"
                        
                        if flr_gb == "지하":
                            floor_label = f"지하{flr_no}층"
                        elif flr_gb == "지층":
                            floor_label = "지층"
                        else:
                            floor_label = f"{flr_no}층"
                            max_floor = max(max_floor, flr_no)
                            
                        floor_areas[floor_label] = area_val
                        total_area += area_val
                    except ValueError:
                        pass
                        
            return {
                "floor_areas": floor_areas,
                "building_total_area": total_area,
                "building_total_floors": max_floor if max_floor > 0 else len(floor_areas)
            }
    except Exception as e:
        print(f"[-] 건축물대장 층별 API 통신 실패: {e}")
        
    return None

def fetch_land_price(pnu):
    """국토교통부 개별공시지가정보 서비스를 통해 대상 필지의 공시지가(원/㎡)를 획득합니다."""
    service_key = get_data_go_kr_key()
    if not service_key or not pnu:
        return None
        
    url = "http://apis.data.go.kr/1611000/IndvdLandPriceService/getIndvdLandPriceAttr"
    params = {
        "serviceKey": service_key,
        "pnu": pnu,
        "numOfRows": "1",
        "pageNo": "1"
    }
    try:
        res = requests.get(url, params=params, timeout=5)
        if res.status_code == 200:
            root = ET.fromstring(res.text)
            jiga_el = root.find(".//jiga")
            if jiga_el is not None and jiga_el.text:
                try:
                    return int(jiga_el.text)
                except ValueError:
                    pass
    except Exception as e:
        print(f"[-] 개별공시지가 API 조회 실패: {e}")
    return None

def fetch_land_use_plan(pnu):
    """국토교통부 토지이용계획정보 서비스를 통해 용도지역 지정 구분 정보를 획득합니다."""
    service_key = get_data_go_kr_key()
    if not service_key or not pnu:
        return None
        
    url = "http://apis.data.go.kr/1611000/LndUsePlanInfoService/getLndUsePlanInfoAttr"
    params = {
        "serviceKey": service_key,
        "pnu": pnu,
        "numOfRows": "10",
        "pageNo": "1"
    }
    try:
        res = requests.get(url, params=params, timeout=5)
        if res.status_code == 200:
            root = ET.fromstring(res.text)
            items = root.findall(".//item")
            for item in items:
                cn_el = item.find("prposAreaDstrcCodeNm")
                if cn_el is not None and cn_el.text and "주거" in cn_el.text or "상업" in cn_el.text or "공업" in cn_el.text or "녹지" in cn_el.text:
                    return cn_el.text.strip()
            # 마땅한 용도지역 키워드가 없는 경우 첫번째 아이템 이름 리턴
            if items:
                cn_el = items[0].find("prposAreaDstrcCodeNm")
                if cn_el is not None and cn_el.text:
                    return cn_el.text.strip()
    except Exception as e:
        print(f"[-] 토지이용계획 API 조회 실패: {e}")
    return None

def fetch_rental_transactions(pnu, target_area=84.9):
    """국토교통부 아파트/주택 전월세 실거래자료 조회를 통해 최근 3건 실거래가 기록을 가져옵니다."""
    service_key = get_data_go_kr_key()
    if not service_key or not pnu:
        return []
        
    pnu_parts = parse_pnu_code(pnu)
    if not pnu_parts:
        return []
        
    # 법정동코드(5자리) 및 년월(최근 3개월 범위 탐색)
    lawd_cd = pnu_parts["sigunguCd"]
    import datetime
    today = datetime.date.today()
    
    # 아파트 전월세 실거래 API 엔드포인트
    url = "http://apis.data.go.kr/1613000/RTMSDataSvcAptRent/getRTMSDataSvcAptRent"
    
    # 최근 3개월 중 데이터가 나오는 월 조회
    for i in range(3):
        target_date = today - datetime.timedelta(days=i*30)
        deal_ymd = target_date.strftime("%Y%m")
        params = {
            "serviceKey": service_key,
            "LAWD_CD": lawd_cd,
            "DEAL_YMD": deal_ymd
        }
        try:
            res = requests.get(url, params=params, timeout=6)
            if res.status_code == 200:
                root = ET.fromstring(res.text)
                items = root.findall(".//item")
                
                deals = []
                for item in items:
                    area_el = item.find("exclUsvArea") # 전용면적
                    floor_el = item.find("floor")
                    deposit_el = item.find("guaranteeAmt") # 보증금
                    year_el = item.find("dealYear")
                    month_el = item.find("dealMonth")
                    
                    if area_el is not None and deposit_el is not None:
                        try:
                            area_val = float(area_el.text)
                            # 면적이 타겟 면적과 오차 10㎡ 이내인 유사 면적군 필터링
                            if abs(area_val - target_area) < 10:
                                deposit_val = int(deposit_el.text.replace(",", "").strip()) * 10000 # 만원 단위 -> 원 단위
                                floor_val = int(floor_el.text) if floor_el is not None and floor_el.text else 5
                                year_val = year_el.text if year_el is not None else ""
                                month_val = month_el.text if month_el is not None else ""
                                
                                deals.append({
                                    "deal_date": f"{year_val}-{month_val.zfill(2)}" if year_val and month_val else "2026-03",
                                    "deal_price": deposit_val,
                                    "floor": floor_val
                                })
                        except ValueError:
                            pass
                
                if deals:
                    # 최근 3건 리턴
                    return sorted(deals, key=lambda x: x["deal_date"], reverse=True)[:3]
        except Exception as e:
            print(f"[-] 실거래가 API 조회 실패 ({deal_ymd}): {e}")
            
    return []
