# V-World 지오코딩 API 및 공공데이터포털 건축물대장 API 연동 테스트를 위한 검증 스크립트입니다.
import sys
import os

# scrapers 폴더 임포트 가능하도록 경로 설정
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "scrapers"))

try:
    from vworld_client import get_vworld_geocode, get_vworld_land_info
    from data_go_kr_client import fetch_building_register_title, fetch_building_register_floors
    print("[+] API 연동 모듈을 정상적으로 임포트하였습니다.")
except ImportError as e:
    print(f"[-] 임포트 오류 발생: {e}")
    sys.exit(1)

def main():
    # 테스트용 주소
    test_address = "서울특별시 강남구 테헤란로 322"
    print(f"\n[*] 1단계: V-World 지오코딩 테스트 (대상 주소: {test_address})")
    
    geo_info = get_vworld_geocode(test_address)
    if geo_info:
        print(f"[+] 지오코딩 성공!")
        print(f"    - 위도(lat): {geo_info['lat']}")
        print(f"    - 경도(lng): {geo_info['lng']}")
        print(f"    - PNU 코드: {geo_info['pnu']}")
        
        print("\n[*] 2단계: V-World 2D데이터 API 테스트 (공시지가 및 용도지역 조회)")
        land_info = get_vworld_land_info(geo_info['lat'], geo_info['lng'], geo_info['pnu'])
        print(f"[+] 데이터 조회 완료!")
        print(f"    - 공시지가: {land_info['official_land_price']} 원/㎡")
        print(f"    - 용도지역: {land_info['land_use_regulation']}")
        
        print("\n[*] 3단계: 공공데이터포털 건축물대장 API 테스트")
        pnu = geo_info['pnu']
        title_info = fetch_building_register_title(pnu)
        if title_info:
            print("[+] 건축물대장 표제부 조회 성공!")
            print(f"    - 준공년도: {title_info['built_year']}")
            print(f"    - 총 세대수: {title_info['total_households']}")
            print(f"    - 주구조(재질): {title_info['building_structure']}")
            print(f"    - 주차대수: {title_info['parking_count']}")
        else:
            print("[-] 건축물대장 표제부 조회 실패. 인증키(data_go_kr_key.txt) 미등록 상태이거나 API 서비스 승인 대기 상태일 수 있습니다.")
            
        floors_info = fetch_building_register_floors(pnu)
        if floors_info:
            print("[+] 건축물대장 층별개요 조회 성공!")
            print(f"    - 건물 층수: {floors_info['building_total_floors']}")
            print(f"    - 전체 면적 합계: {floors_info['building_total_area']} ㎡")
            print("    - 층별 면적 명세:")
            for fl, val in floors_info['floor_areas'].items():
                print(f"        * {fl}: {val} ㎡")
        else:
            print("[-] 건축물대장 층별개요 조회 실패. 인증키 미등록 상태이거나 API 서비스 승인 대기 상태일 수 있습니다.")
    else:
        print("[-] V-World 지오코딩 조회 실패. 주소 정제 실패 또는 네트워크 불안정 상태일 수 있습니다.")

if __name__ == "__main__":
    main()
