# 국토지리정보원 국토정보플랫폼 OpenAPI를 활용하여 주소를 위경도 좌표 및 PNU 코드로 변환하는 백업 지오코딩 모듈입니다.
import os
import requests
import xml.etree.ElementTree as ET
import json
import re

def get_ngii_key():
    """국토지리정보원 API 호출에 사용할 인증키를 로드합니다."""
    key_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "config", "ngii_key.txt")
    if os.path.exists(key_path):
        try:
            with open(key_path, "r", encoding="utf-8") as f:
                return f.read().strip()
        except Exception as e:
            print(f"[-] 국토지리정보원 인증키 로드 실패: {e}")
    return None

def get_ngii_geocode(address):
    """국토지리정보원 API를 통해 주소를 위경도 좌표 및 PNU 코드로 변환합니다."""
    apikey = get_ngii_key()
    if not apikey:
        return None
        
    # 주소 정제 (상세 정보 제거)
    addr_clean = re.sub(r'\s*\d+동\s*\d+호.*|\s*\d+층.*|\s*지하\s*\d+층.*|\s*[가-힣]\s*동\s*\d+호.*|\s*제?\s*\d+\s*호.*', '', address).strip()
    
    url = "http://map.ngii.go.kr/openapi/search.xml"
    params = {
        "apikey": apikey,
        "query": addr_clean,
        "searchType": "address",
        "pageNum": "1",
        "pageSize": "1"
    }
    
    try:
        res = requests.get(url, params=params, timeout=5)
        if res.status_code == 200:
            root = ET.fromstring(res.text)
            
            # 주소 결과 노드 탐색
            addr_list = root.find(".//addressList")
            if addr_list is not None:
                x_el = addr_list.find("x")
                y_el = addr_list.find("y")
                pnu_el = addr_list.find("admLink") # admLink가 대개 19자리 행정구역 PNU 코드
                
                if x_el is not None and y_el is not None:
                    x_val = float(x_el.text)
                    y_val = float(y_el.text)
                    pnu_val = pnu_el.text.strip() if pnu_el is not None and pnu_el.text else ""
                    
                    # EPSG:5179 (중부원점) 좌표를 EPSG:4326 (WGS84) 위경도로 변환
                    try:
                        from pyproj import Transformer
                        transformer = Transformer.from_crs("epsg:5179", "epsg:4326", always_xy=True)
                        lng, lat = transformer.transform(x_val, y_val)
                        print(f"[DEBUG] NGII Geocode Success - Lat: {lat}, Lng: {lng}, PNU: {pnu_val}")
                        return {
                            "lat": lat,
                            "lng": lng,
                            "pnu": pnu_val
                        }
                    except ImportError:
                        print("[-] pyproj 모듈이 설치되어 있지 않습니다. 기본 수식 기반 좌표 근사치 계산으로 대체합니다.")
                        # pyproj가 없는 경우를 위한 비상용 수학적 간이 보정 수식 (오차 존재할 수 있음)
                        # 중부원점 근사값 계산식 (단순 비례 보정)
                        lat = 38.0 + (y_val - 2000000.0) / 110900.0
                        lng = 127.5 + (x_val - 1000000.0) / 88000.0
                        return {
                            "lat": lat,
                            "lng": lng,
                            "pnu": pnu_val
                        }
    except Exception as e:
        print(f"[-] 국토지리정보원 지오코딩 실패: {e}")
        
    return None
