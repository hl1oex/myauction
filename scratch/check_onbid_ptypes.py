# -*- coding: utf-8 -*-
import requests
import json

def check():
    supabase_url = "https://ubaxyfxcsxsvrryowswb.supabase.co"
    supabase_key = "sb_publishable_JrM_2rrvppC105lHndMLkg_x2x0sLUE"
    
    headers = {
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}",
        "Content-Type": "application/json"
    }
    
    all_data = []
    from_row = 0
    step = 1000
    has_more = True
    
    while has_more:
        headers["Range"] = f"{from_row}-{from_row + step - 1}"
        res = requests.get(f"{supabase_url}/rest/v1/properties?select=source,ptype,address", headers=headers)
        if res.status_code == 206 or res.status_code == 200:
            data = res.json()
            if data:
                all_data.extend(data)
                if len(data) < step:
                    has_more = False
                else:
                    from_row += step
            else:
                has_more = False
        else:
            print(f"Error: {res.status_code} - {res.text}")
            has_more = False

            
    print(f"Total properties in DB: {len(all_data)}")
    
    distribution = {}
    for row in all_data:
        src = row.get("source", "unknown")
        pt = row.get("ptype", "unknown")
        addr = row.get("address", "")
        
        key = (src, pt)
        if key not in distribution:
            distribution[key] = []
        distribution[key].append(addr)
        
    print("Source & Ptype clean distribution:")
    for (src, pt), addrs in sorted(distribution.items(), key=lambda x: (x[0][0], len(x[1])), reverse=True):
        print(f"  Source: {src} | Ptype: {pt} -> Count: {len(addrs)}")
        if len(addrs) > 0:
            try:
                # 안전한 한글 출력 (Windows 인코딩 대응)
                print(f"    Sample address: {addrs[0]}")
            except Exception:
                pass

if __name__ == "__main__":
    check()
