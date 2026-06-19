# V-World OpenAPI를 활용하여 주소를 위경도 좌표 및 PNU 코드로 변환하고 지적도/용도지역 정보를 수집하는 연동 모듈입니다.
import requests
import json
import re

VWORLD_KEY = "D800A359-1931-3017-BDD2-E0E42CA9F4EB"

def get_vworld_reverse_geocode_pnu(lng, lat):
    """위경도 좌표를 기반으로 리버스 지오코딩을 수행하여 19자리 PNU 코드를 조합합니다."""
    url = "http://api.vworld.kr/req/address"
    params = {
        "service": "address",
        "request": "getAddress",
        "version": "2.0",
        "crs": "epsg:4326",
        "point": f"{lng},{lat}",
        "type": "BOTH",
        "format": "json",
        "key": VWORLD_KEY
    }
    try:
        res = requests.get(url, params=params, timeout=5)
        if res.status_code == 200:
            data = res.json()
            results = data.get("response", {}).get("result", [])
            for r in results:
                if r.get("type") == "parcel":
                    structure = r.get("structure", {})
                    level4LC = structure.get("level4LC", "")
                    level5 = structure.get("level5", "")
                    text = r.get("text", "")
                    
                    if level4LC and level5:
                        is_mountain = False
                        if "산" in level5 or "산" in text:
                            is_mountain = True
                            
                        clean_jibun = re.sub(r'[^0-9\-]', '', level5)
                        if not clean_jibun:
                            continue
                            
                        if '-' in clean_jibun:
                            parts = clean_jibun.split('-')
                            bun = parts[0].zfill(4)
                            ji = parts[1].zfill(4)
                        else:
                            bun = clean_jibun.zfill(4)
                            ji = '0000'
                            
                        plat_gb = '2' if is_mountain else '1'
                        pnu = level4LC + plat_gb + bun + ji
                        print(f"[DEBUG] Reverse Geocode PNU Assembled: {pnu}")
                        return pnu
    except Exception as e:
        print(f"[-] V-World 리버스 지오코딩 PNU 획득 실패: {e}")
    return ""

def get_vworld_geocode(address):
    """주소를 위경도 좌표 및 PNU 코드로 변환합니다.
    
    정제된 주소에서 동, 호, 층 및 지상/지하 표기를 절단하여 지오코더 매칭 성공률을 극대화합니다.
    """
    if not address:
        return None
        
    # 주소 정제 (동, 호, 층, 지상, 지하, 가동/나동 등의 상세 정보 제거)
    addr_clean = re.sub(r'\s*\d+동\s*\d+호.*|\s*\d+층.*|\s*지하\s*\d+층.*|\s*[가-힣]\s*동\s*\d+호.*|\s*제?\s*\d+\s*호.*', '', address).strip()
    
    url = "http://api.vworld.kr/req/address"
    params = {
        "service": "address",
        "request": "getcoord",
        "version": "2.0",
        "crs": "epsg:4326",
        "address": addr_clean,
        "refine": "true",
        "simple": "false",
        "format": "json",
        "key": VWORLD_KEY
    }
    
    # 도로명 주소와 지번 주소의 패턴에 따라 type 변수 분기
    if any(k in addr_clean for k in ["로 ", "길 "]):
        params["type"] = "ROAD"
    else:
        params["type"] = "PARCEL"
        
    lat, lng, pnu_val = None, None, ""
    
    try:
        res = requests.get(url, params=params, timeout=5)
        if res.status_code == 200:
            data = res.json()
            print(f"[DEBUG] V-World Geocode Response: {json.dumps(data, indent=2, ensure_ascii=False)}")
            response_data = data.get("response", {})
            if response_data.get("status") == "OK":
                result = response_data.get("result", {})
                point = result.get("point", {})
                refined = result.get("refined", {})
                structure = refined.get("structure", {})
                pnu_val = structure.get("pnu", "")
                lat = float(point.get("y", 0.0))
                lng = float(point.get("x", 0.0))
    except Exception as e:
        print(f"[-] V-World 지오코딩 1차 실패: {e}")
        
    # 만약 1차 지오코딩 실패 또는 좌표 미획득 시, 반대 타입으로 2차 시도
    if lat is None or lng is None:
        params["type"] = "PARCEL" if params["type"] == "ROAD" else "ROAD"
        try:
            res = requests.get(url, params=params, timeout=5)
            if res.status_code == 200:
                data = res.json()
                response_data = data.get("response", {})
                if response_data.get("status") == "OK":
                    result = response_data.get("result", {})
                    point = result.get("point", {})
                    refined = result.get("refined", {})
                    structure = refined.get("structure", {})
                    pnu_val = structure.get("pnu", "")
                    lat = float(point.get("y", 0.0))
                    lng = float(point.get("x", 0.0))
        except Exception as e:
            print(f"[-] V-World 지오코딩 2차 실패: {e}")
            
    # 좌표 획득에 성공했으나 PNU가 없으면 리버스 지오코딩으로 수동 조립 시도
    if lat is not None and lng is not None and not pnu_val:
        pnu_val = get_vworld_reverse_geocode_pnu(lng, lat)
        
    if lat is not None and lng is not None:
        print(f"[DEBUG] Final Geocode - Lat: {lat}, Lng: {lng}, PNU: {pnu_val}")
        return {
            "lat": lat,
            "lng": lng,
            "pnu": pnu_val
        }
        
    return None

def get_vworld_land_info(lat, lng, pnu):
    """좌표 및 PNU를 기준으로 공시지가와 토지이용계획 용도지역을 조회합니다.
    
    연속지적도 레이어를 쿼리하여 공시지가를 획득하고, 용도지역 레이어에서 명칭을 획득합니다.
    """
    info = {
        "official_land_price": None,
        "land_use_regulation": None
    }
    
    # 1. 연속지적도(LP_PA_CBND_BUBUN) 조회를 통한 공시지가 (jiga) 획득
    if pnu:
        url = "http://api.vworld.kr/req/data"
        params = {
            "service": "data",
            "request": "GetFeature",
            "key": VWORLD_KEY,
            "data": "LP_PA_CBND_BUBUN",
            "geomFilter": f"POINT({lng} {lat})",
            "crs": "epsg:4326",
            "format": "json"
        }
        try:
            res = requests.get(url, params=params, timeout=5)
            if res.status_code == 200:
                data = res.json()
                features = data.get("response", {}).get("result", {}).get("featureCollection", {}).get("features", [])
                if features:
                    properties = features[0].get("properties", {})
                    jiga = properties.get("jiga")
                    if jiga:
                        try:
                            info["official_land_price"] = int(jiga)
                        except ValueError:
                            pass
        except Exception as e:
            print(f"[-] V-World 지적도 조회 실패: {e}")
            
    # 2. 용도지역(LT_C_UQ111) 조회를 통한 용도지역명 (uqa112) 획득
    url = "http://api.vworld.kr/req/data"
    params = {
        "service": "data",
        "request": "GetFeature",
        "key": VWORLD_KEY,
        "data": "LT_C_UQ111",
        "geomFilter": f"POINT({lng} {lat})",
        "crs": "epsg:4326",
        "format": "json"
    }
    try:
        res = requests.get(url, params=params, timeout=5)
        if res.status_code == 200:
            data = res.json()
            features = data.get("response", {}).get("result", {}).get("featureCollection", {}).get("features", [])
            if features:
                properties = features[0].get("properties", {})
                uqa112 = properties.get("uqa112")
                if uqa112:
                    info["land_use_regulation"] = uqa112
    except Exception as e:
        print(f"[-] V-World 용도지역 조회 실패: {e}")
        
    return info
