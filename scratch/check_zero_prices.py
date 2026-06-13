# Supabase DB에서 최저가가 0원이거나 감정가가 0원인 물건들을 조회하는 테스트 스크립트입니다.
import requests
import json

url = "https://ubaxyfxcsxsvrryowswb.supabase.co/rest/v1/properties?or=(minimum_bid.lte.0,appraised_value.lte.0)"
headers = {
    "apikey": "sb_publishable_JrM_2rrvppC105lHndMLkg_x2x0sLUE",
    "Authorization": "Bearer sb_publishable_JrM_2rrvppC105lHndMLkg_x2x0sLUE"
}

try:
    res = requests.get(url, headers=headers)
    print("Status Code:", res.status_code)
    if res.status_code == 200:
        data = res.json()
        print(f"Found {len(data)} zero-price properties:")
        for p in data[:10]:
            print(f"- {p['auction_no']} | {p['address']} | 감정가: {p['appraised_value']} | 최저가: {p['minimum_bid']}")
    else:
        print("Error response:", res.text)
except Exception as e:
    print("Exception occurred:", e)
