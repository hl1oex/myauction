import requests
import json

url = "https://ubaxyfxcsxsvrryowswb.supabase.co/rest/v1/properties"
headers = {
    "apikey": "sb_publishable_JrM_2rrvppC105lHndMLkg_x2x0sLUE",
    "Authorization": "Bearer sb_publishable_JrM_2rrvppC105lHndMLkg_x2x0sLUE"
}

res = requests.get(url, headers=headers)
if res.status_code == 200:
    data = res.json()
    print(f"Total properties: {len(data)}")
    naver_links = []
    for d in data:
        for key in ['link_url', 'notes_content', 'desc_content']:
            val = d.get(key)
            if val and 'naver' in val:
                naver_links.append((d.get('auction_no'), key, val[:150]))
    
    print(f"Found {len(naver_links)} items containing 'naver':")
    for item in naver_links[:10]:
        print(f"  Auction No: {item[0]}, Key: {item[1]}, Value: {item[2]}")
else:
    print("Failed to fetch data:", res.status_code)
