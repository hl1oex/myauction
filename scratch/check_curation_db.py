# -*- coding: utf-8 -*-
import json
import urllib.request

def check_table(table_name):
    url = f"https://ubaxyfxcsxsvrryowswb.supabase.co/rest/v1/{table_name}?select=count"
    headers = {
        "apikey": "sb_publishable_JrM_2rrvppC105lHndMLkg_x2x0sLUE",
        "Authorization": "Bearer sb_publishable_JrM_2rrvppC105lHndMLkg_x2x0sLUE",
        "Prefer": "count=exact"
    }
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req) as response:
            count = response.headers.get("Content-Range")
            print(f"[*] Table '{table_name}': Count/Range = {count}")
            
            # 상위 5개 데이터 확인
            data_url = f"https://ubaxyfxcsxsvrryowswb.supabase.co/rest/v1/{table_name}?limit=5"
            data_req = urllib.request.Request(data_url, headers=headers)
            with urllib.request.urlopen(data_req) as data_resp:
                samples = json.loads(data_resp.read().decode('utf-8'))
                print(f"[*] Samples from '{table_name}':")
                print(json.dumps(samples, indent=2, ensure_ascii=False))
    except Exception as e:
        print(f"[-] Error checking '{table_name}': {e}")

def main():
    print("=== CHECKING CURATION TABLES IN SUPABASE ===")
    check_table("curation_themes")
    check_table("auction_analytics")
    check_table("properties")

if __name__ == "__main__":
    main()
