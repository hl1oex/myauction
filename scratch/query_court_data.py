# -*- coding: utf-8 -*-
import json
import urllib.request
from collections import Counter

def main():
    url = "https://ubaxyfxcsxsvrryowswb.supabase.co/rest/v1/properties?select=*"
    headers = {
        "apikey": "sb_publishable_JrM_2rrvppC105lHndMLkg_x2x0sLUE"
    }
    
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode('utf-8'))
            print(f"=== TOTAL PROPERTIES IN DB: {len(data)} ===")
            
            court_data = [item for item in data if item.get("source") in ["court", "court_etc"]]
            print(f"Court properties count: {len(court_data)}")
            
            courts = [item.get("court") for item in court_data if item.get("court")]
            court_counts = Counter(courts)
            print("\n--- Court distribution ---")
            for c, count in court_counts.most_common(20):
                print(f"{c}: {count}건")
                
            addresses = [item.get("address", "") for item in court_data]
            sidos = []
            for addr in addresses:
                parts = addr.split()
                if parts:
                    sidos.append(parts[0][:2])
            sido_counts = Counter(sidos)
            print("\n--- Region distribution (Sido) ---")
            for s, count in sido_counts.most_common():
                print(f"{s}: {count}건")
                
    except Exception as e:
        print("Error fetching court properties:", e)

if __name__ == "__main__":
    main()
