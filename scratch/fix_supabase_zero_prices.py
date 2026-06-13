# Supabase DB에 등록된 매물 중 감정가 혹은 최저가가 0원 이하인 비정상 데이터를 
# 상호 대입 및 최소 10,000,000원 보정 규칙으로 강제 갱신하는 1회성 마이그레이션 스크립트입니다.
import requests
import json

supabase_url = "https://ubaxyfxcsxsvrryowswb.supabase.co"
apikey = "sb_publishable_JrM_2rrvppC105lHndMLkg_x2x0sLUE"
headers = {
    "apikey": apikey,
    "Authorization": f"Bearer {apikey}",
    "Content-Type": "application/json",
    "Prefer": "resolution=merge-duplicates"
}

# 1. 0원 이하인 매물들을 조회합니다.
query_url = f"{supabase_url}/rest/v1/properties?or=(minimum_bid.lte.0,appraised_value.lte.0)"

try:
    res = requests.get(query_url, headers=headers)
    if res.status_code == 200:
        properties = res.json()
        print(f"[*] 보정 대상 0원 매물 {len(properties)}건을 발견했습니다.")
        
        updated_count = 0
        # Supabase API를 통한 개별/배치 업데이트를 수행합니다.
        # on_conflict=auction_no 를 활용해 upsert를 실행합니다.
        upsert_url = f"{supabase_url}/rest/v1/properties?on_conflict=auction_no"
        
        batch_size = 50
        for i in range(0, len(properties), batch_size):
            batch = properties[i:i+batch_size]
            payload = []
            
            for p in batch:
                appraisal = p.get("appraised_value") or 0
                price = p.get("minimum_bid") or 0
                
                # 교차 대입 및 1천만원 폴백 규칙 가동
                if appraisal <= 0 and price > 0:
                    appraisal = price
                if price <= 0 and appraisal > 0:
                    price = appraisal
                if appraisal <= 0 and price <= 0:
                    appraisal = 10000000
                    price = 10000000
                
                p["appraised_value"] = int(appraisal)
                p["minimum_bid"] = int(price)
                
                # 불필요한 자동생성 필드는 제외
                if "updated_at" in p:
                    del p["updated_at"]
                
                payload.append(p)
            
            # Upsert 요청
            res_upsert = requests.post(upsert_url, headers=headers, json=payload)
            if res_upsert.status_code in [200, 201]:
                updated_count += len(payload)
                print(f"[+] {updated_count}건 보정 완료...")
            else:
                print(f"[-] 업로드 실패 ({res_upsert.status_code}): {res_upsert.text}")
                
        print(f"[+] 완료! 총 {updated_count}건의 0원 매물이 완벽하게 교정되었습니다.")
    else:
        print("[-] 0원 매물 조회 실패:", res.text)
except Exception as e:
    print("[-] 마이그레이션 실행 중 예외 발생:", e)
