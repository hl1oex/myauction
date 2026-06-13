# -*- coding: utf-8 -*-
# Supabase DB에 적재된 매물 메타데이터 중 면적 추정 타입 및 다세대 건물 층 정보를 분석합니다.
import json
import requests

def inspect():
    supabase_url = "https://ubaxyfxcsxsvrryowswb.supabase.co"
    supabase_key = "sb_publishable_JrM_2rrvppC105lHndMLkg_x2x0sLUE"
    
    headers = {
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}",
        "Content-Type": "application/json"
    }
    
    res = requests.get(f"{supabase_url}/rest/v1/properties?select=id,source,auction_no,address,ptype,notes_content&limit=100", headers=headers)
    if res.status_code == 200:
        data = res.json()
        print(f"[*] Supabase에서 {len(data)}개의 매물을 로드했습니다.")
        
        fake_count = 0
        for item in data:
            notes = item.get("notes_content", "") or ""
            meta_json = None
            clean_notes = notes
            if "__METADATA__:" in notes:
                try:
                    parts = notes.split("__METADATA__:")
                    if len(parts) > 1:
                        meta_str = parts[1].split("__")[0]
                        meta_json = json.loads(meta_str)
                        clean_notes = parts[0].strip()
                except Exception as e:
                    pass
            
            est_type = "No Meta"
            if meta_json:
                est_type = meta_json.get("exclusive_area_estimation_type", "N/A")
            
            if est_type == "fake" or not meta_json:
                fake_count += 1
                print(f"[{fake_count}] ID: {item.get('id')} | Ptype: {item.get('ptype')} | EstType: {est_type}")
                print(f"  Addr: {item.get('address')}")
                print(f"  Notes: {clean_notes[:200]}")
                print("-" * 60)
                if fake_count >= 15:
                    break
    else:
        print(f"[-] Error: {res.status_code} - {res.text}")

if __name__ == "__main__":
    inspect()

