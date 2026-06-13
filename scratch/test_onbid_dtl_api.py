# -*- coding: utf-8 -*-
# 온비드 부동산 물건 상세 조회 API의 동작을 테스트하는 스크립트입니다.
import os
import sys
import requests
import urllib.parse

try:
    sys.stdout.reconfigure(encoding='utf-8')
except AttributeError:
    pass

def test_dtl_api(cltr_mng_no, pbct_cdtn_no):
    service_key = "8f25b28707d85a7c657d76d8689bacc8e6d3c87ea74de0330b9048bc7c1f1b98"
    
    key_file_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "config", "onbid_key.txt")
    if os.path.exists(key_file_path):
        with open(key_file_path, "r", encoding="utf-8") as f:
            file_key = f.read().strip()
            if file_key:
                service_key = file_key
    
    unquoted_key = urllib.parse.unquote(service_key)
    quoted_key = urllib.parse.quote(unquoted_key)
    
    # 공공데이터포털 공식 차세대 부동산 물건상세조회 API 스펙
    url = "http://apis.data.go.kr/B010003/OnbidRlstDtlSrvc2/getRlstDtlInf2"
    
    # 1. Unquoted key 테스트
    print("\n==========================================")
    print("Testing with UNQUOTED service key...")
    params = {
        "serviceKey": unquoted_key,
        "pageNo": "1",
        "numOfRows": "10",
        "resultType": "json",
        "cltrMngNo": cltr_mng_no,
        "pbctCdtnNo": pbct_cdtn_no
    }
    
    try:
        res = requests.get(url, params=params, timeout=10)
        print(f"Status Code: {res.status_code}")
        text = res.content.decode('utf-8', errors='replace')
        print("Response Preview:")
        print(text[:2000])
    except Exception as e:
        print("Request failed:", e)
        
    # 2. Quoted key 테스트 (직접 쿼리 구성)
    print("\n==========================================")
    print("Testing with QUOTED service key...")
    query_str = f"serviceKey={quoted_key}&pageNo=1&numOfRows=10&resultType=json&cltrMngNo={cltr_mng_no}&pbctCdtnNo={pbct_cdtn_no}"
    full_url = f"{url}?{query_str}"
    
    try:
        res = requests.get(full_url, timeout=10)
        print(f"Status Code: {res.status_code}")
        text = res.content.decode('utf-8', errors='replace')
        print("Response Preview:")
        print(text[:2000])
    except Exception as e:
        print("Request failed:", e)

if __name__ == "__main__":
    # 최신 목록 조회 결과인 2026-0300-002152, 5962095로 테스트
    test_dtl_api("2026-0300-002152", "5962095")
