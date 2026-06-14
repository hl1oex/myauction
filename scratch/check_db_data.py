# -*- coding: utf-8 -*-
import os
import sys
import json
import requests
import re

def get_supabase_client_info():
    config_path = r"d:\BackUp\OneDrive\AI공부\Real estate auction\config\supabase_config.json"
    if os.path.exists(config_path):
        try:
            with open(config_path, "r", encoding="utf-8") as f:
                config = json.load(f)
                return config.get("supabase_url"), config.get("supabase_service_key")
        except Exception as e:
            print(f"[-] Supabase 설정 파일 파싱 오류: {e}")
    return None, None

def check_db():
    supabase_url, supabase_key = get_supabase_client_info()
    if not supabase_url or not supabase_key:
        print("[-] Supabase 정보가 누락되었습니다.")
        return

    headers = {
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}",
        "Content-Type": "application/json"
    }

    # exclusive_area, land_area 컬럼을 제외하고 조회
    url = f"{supabase_url}/rest/v1/properties?select=id,source,auction_no,address,ptype,appraised_value,minimum_bid,notes_content&limit=30"
    res = requests.get(url, headers=headers)
    if res.status_code != 200:
        print(f"[-] 매물 조회 실패: {res.status_code} - {res.text}")
        return

    properties = res.json()
    print(f"[*] Supabase에서 {len(properties)}개의 매물을 조회했습니다.")
    
    for i, item in enumerate(properties):
        print(f"\n--- [{i+1}] ID: {item.get('id')} ({item.get('source')}) ---")
        print(f"사건번호: {item.get('auction_no')}")
        print(f"구분: {item.get('ptype')}")
        print(f"주소: {item.get('address')}")
        
        notes = item.get("notes_content", "") or ""
        meta = None
        if "__METADATA__:" in notes:
            meta_match = re.search(r'__METADATA__:(.*?)__', notes)
            if meta_match:
                try:
                    meta = json.loads(meta_match.group(1))
                    print(f"메타데이터 - 전용면적: {meta.get('exclusive_area')}㎡, 대지면적: {meta.get('land_area')}㎡, 추정여부: {meta.get('is_estimated_exclusive')}")
                    print(f"메타데이터 - 단지정보: {meta.get('complex_info')}")
                    print(f"메타데이터 - 실거래가: {meta.get('recent_deals')}")
                except Exception as e:
                    print(f"메타데이터 파싱 에러: {e}")
        else:
            print("메타데이터가 존재하지 않습니다.")
        
        notes_clean = notes.split("__METADATA__:")[0].strip()
        print(f"비고(일부): {notes_clean[:120]}...")

if __name__ == "__main__":
    check_db()
