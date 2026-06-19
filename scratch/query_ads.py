# -*- coding: utf-8 -*-
import json
import urllib.request
import sys

def main():
    # 윈도우 콘솔 UTF-8 출력 보장.
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
        
    url = "https://ubaxyfxcsxsvrryowswb.supabase.co/rest/v1/ads"
    headers = {
        "apikey": "sb_publishable_JrM_2rrvppC105lHndMLkg_x2x0sLUE",
        "Authorization": "Bearer sb_publishable_JrM_2rrvppC105lHndMLkg_x2x0sLUE"
    }
    
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode('utf-8'))
            print("=== ADS TABLE DATA ===")
            print(json.dumps(data, indent=4, ensure_ascii=False))
    except Exception as e:
        print("Error fetching ads:", e)

if __name__ == "__main__":
    main()
