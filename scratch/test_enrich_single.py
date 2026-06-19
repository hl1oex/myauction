# -*- coding: utf-8 -*-
# 특정 주소를 대상으로 V-World 및 공공데이터포털 건축물대장 API 연동을 통합 테스트하는 스크립트입니다.
import sys
import os

sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "scrapers"))

from vworld_client import get_vworld_geocode, get_vworld_land_info
from data_go_kr_client import fetch_building_register_title, fetch_building_register_floors

def test_single_address(address):
    print(f"\n==================================================")
    print(f"[*] 테스트 주소: {address}")
    print(f"==================================================")
    
    # 1. V-World 지오코딩 및 PNU 생성
    print("[*] 1단계: V-World 지오코딩 및 PNU 확보 시도...")
    geo = get_vworld_geocode(address)
    if not geo:
        print("[-] 지오코딩 실패!")
        return
        
    print(f"[+] 지오코딩 성공!")
    print(f"    - 위도(Latitude): {geo['lat']}")
    print(f"    - 경도(Longitude): {geo['lng']}")
    print(f"    - PNU 코드: {geo['pnu']}")
    
    # 2. V-World 2D 지적도/용도지역 조회
    print("\n[*] 2단계: V-World 공시지가 및 규제 정보 조회...")
    land = get_vworld_land_info(geo['lat'], geo['lng'], geo['pnu'])
    print(f"    - 공시지가: {land.get('official_land_price')} 원/㎡")
    print(f"    - 용도지역: {land.get('land_use_regulation')}")
    
    # 3. 건축물대장 API 연동
    print("\n[*] 3단계: 공공데이터포털 건축물대장 API 조회...")
    if geo['pnu']:
        title = fetch_building_register_title(geo['pnu'])
        if title:
            print(f"[+] 표제부 정보 획득 성공!")
            print(f"    - 준공년도 (built_year): {title.get('built_year')}년")
            print(f"    - 총 세대수 (total_households): {title.get('total_households')}세대")
            print(f"    - 주구조/재질 (building_structure): {title.get('building_structure')}")
            print(f"    - 자주식/기계식 총 주차대수 (parking_count): {title.get('parking_count')}대")
        else:
            print("[-] 표제부 정보 획득 실패 (인증키 미등록 상태이거나 승인 대기)")
            
        floors = fetch_building_register_floors(geo['pnu'])
        if floors:
            print(f"[+] 층별 개요 정보 획득 성공!")
            print(f"    - 건물 전체 층수: {floors.get('building_total_floors')}층")
            print(f"    - 건물 연면적 합계: {floors.get('building_total_area')} ㎡")
            print(f"    - 층별 면적 리스트:")
            for fl, val in floors.get('floor_areas', {}).items():
                print(f"        * {fl}: {val} ㎡")
        else:
            print("[-] 층별 개요 정보 획득 실패 (인증키 미등록 상태이거나 승인 대기)")
    else:
        print("[-] PNU 코드가 누락되어 건축물대장 API를 조회할 수 없습니다.")

if __name__ == "__main__":
    # 사용자의 실제 캡처 화면 상의 매물 주소
    target_addr = "세종특별자치시 해밀동 701 메종블룸"
    test_single_address(target_addr)
