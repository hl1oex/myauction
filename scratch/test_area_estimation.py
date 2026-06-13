# -*- coding: utf-8 -*-
# 이 파일은 고도화된 면적 추정 알고리즘을 다양한 조건에서 검증하는 테스트 파일입니다.

import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scrapers.court_scraper import extract_court_areas

def run_tests():
    test_cases = [
        {
            "name": "인천 부영빌라 (단독 전용면적 37.76㎡ 존재 - exact 실제)",
            "text": "인천광역시 남동구 간석동 37-239 부영빌라 3층02호 철근콘크리트조 4층 다세대주택 1층 118.39㎡ 2층 118.39㎡ 3층 118.39㎡ 4층 118.39㎡ 지층 87.40㎡ 철근콘크리트조 37.76㎡ 토지별도등기있음",
            "expected_excl": 37.76,
            "expected_est": False,
            "expected_type": "exact",
            "expected_floors": 5,
            "expected_total_area": 560.96
        },
        {
            "name": "다세대 연면적 베이스 추정 (단독 면적 없음 - 다세대 3층02호 -> 560.96 / (5 * 2) = 56.10㎡)",
            "text": "인천광역시 남동구 간석동 37-239 부영빌라 3층02호 철근콘크리트조 4층 다세대주택 1층 118.39㎡ 2층 118.39㎡ 3층 118.39㎡ 4층 118.39㎡ 지층 87.40㎡",
            "expected_excl": 56.1,
            "expected_est": True,
            "expected_type": "estimated",
            "expected_floors": 5,
            "expected_total_area": 560.96
        },
        {
            "name": "대구 신기모란아파트 601호 (30.63㎡ 단독 면적 존재 - exact 실제)",
            "text": "대구광역시 동구 신기동 573 신기모란아파트 1동 5층601호 철근콘크리트조 슬래브지붕 5층 아파트 지층 194.4㎡ 1층 575.82㎡ 2층 575.82㎡ 3층 575.82㎡ 4층 575.82㎡ 5층 575.82㎡ 철근콘크리트조 30.63㎡",
            "expected_excl": 30.63,
            "expected_est": False,
            "expected_type": "exact",
            "expected_floors": 6,
            "expected_total_area": 3073.5
        },
        {
            "name": "대구 신기모란아파트 601호 (단독 면적 없음 - 백의 자리 divisor 6분할 추정 -> 575.82 / 6 = 95.97㎡)",
            "text": "대구광역시 동구 신기동 573 신기모란아파트 1동 5층601호 철근콘크리트조 슬래브지붕 5층 아파트 지층 194.4㎡ 1층 575.82㎡ 2층 575.82㎡ 3층 575.82㎡ 4층 575.82㎡ 5층 575.82㎡",
            "expected_excl": 95.97,
            "expected_est": True,
            "expected_type": "estimated",
            "expected_floors": 6,
            "expected_total_area": 3073.5
        },
        {
            "name": "건물 키워드 단독 면적 (정밀 기재 - exact 실제)",
            "text": "인천광역시 남동구 간석동 37-239 부영빌라 3층02호 건물 59.9㎡",
            "expected_excl": 59.9,
            "expected_est": False,
            "expected_type": "exact",
            "expected_floors": 0,
            "expected_total_area": 0.0
        },
        {
            "name": "토지/임야 비건물 자산 (ptype='임야' -> exclusive_area=0.0)",
            "text": "충청남도 아산시 음봉면 산동리 산24-40 임야 465㎡",
            "ptype": "임야",
            "expected_excl": 0.0,
            "expected_est": False,
            "expected_type": "exact",
            "expected_floors": 0,
            "expected_total_area": 0.0
        },
        {
            "name": "단일 면적 수치 단독 존재 (층별 목록 없음 -> exact 격상)",
            "text": "대구광역시 동구 신기동 573 신기모란아파트 1동 5층601호 30.63㎡",
            "expected_excl": 30.63,
            "expected_est": False,
            "expected_type": "exact",
            "expected_floors": 0,
            "expected_total_area": 0.0
        },
        {
            "name": "층별 리스트 존재 & 대상 층 누락 (최대치 575.82㎡ 기반 6분할 -> 95.97㎡ estimated)",
            "text": "대구광역시 동구 신기동 573 신기모란아파트 1동 601호 철근콘크리트조 슬래브지붕 5층 아파트 지층 194.4㎡ 1층 575.82㎡ 2층 575.82㎡ 3층 575.82㎡ 4층 575.82㎡ 5층 575.82㎡",
            "expected_excl": 95.97,
            "expected_est": True,
            "expected_type": "estimated",
            "expected_floors": 6,
            "expected_total_area": 3073.5
        }
    ]

    print("[*] 면적 파싱, 추정 신뢰도 및 다세대 명세 분석 단위 테스트를 시작합니다.")
    all_passed = True
    for i, tc in enumerate(test_cases, 1):
        (
            excl, land, is_est_ex, is_est_ld,
            excl_est_type, total_floors, total_area, floor_areas
        ) = extract_court_areas(tc["text"], tc.get("ptype", ""))
        
        passed_excl = abs(excl - tc["expected_excl"]) < 0.01
        passed_est = is_est_ex == tc["expected_est"]
        passed_type = excl_est_type == tc["expected_type"]
        passed_floors = total_floors == tc["expected_floors"]
        passed_total_area = abs(total_area - tc["expected_total_area"]) < 0.01
        
        if passed_excl and passed_est and passed_type and passed_floors and passed_total_area:
            print(f"[OK] 테스트 {i}: {tc['name']} 통과 (결과: 면적={excl}㎡, 타입={excl_est_type}, 층수={total_floors}층, 합계={total_area}㎡)")
        else:
            print(f"[FAIL] 테스트 {i}: {tc['name']} 실패!")
            print(f"  - 면적: 예상={tc['expected_excl']}㎡, 실제={excl}㎡ ({passed_excl})")
            print(f"  - 추정여부: 예상={tc['expected_est']}, 실제={is_est_ex} ({passed_est})")
            print(f"  - 신뢰도타입: 예상={tc['expected_type']}, 실제={excl_est_type} ({passed_type})")
            print(f"  - 건물층수: 예상={tc['expected_floors']}, 실제={total_floors} ({passed_floors})")
            print(f"  - 합계면적: 예상={tc['expected_total_area']}㎡, 실제={total_area}㎡ ({passed_total_area})")
            all_passed = False
            
    if all_passed:
        print("[+] 모든 면적 추정 고도화 테스트 케이스가 성공적으로 통과되었습니다!")
    else:
        print("[-] 일부 테스트 케이스에서 실패가 발견되었습니다. 디버깅이 필요합니다.")

if __name__ == "__main__":
    run_tests()
