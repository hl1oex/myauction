# Supabase DB에서 가장 최근에 업데이트된 properties 매물의 타임스탬프와 개수를 조회하는 테스트 스크립트입니다.
import requests
import json

url = "https://ubaxyfxcsxsvrryowswb.supabase.co/rest/v1/properties?select=updated_at,auction_no,source&order=updated_at.desc&limit=10"
headers = {
    "apikey": "sb_publishable_JrM_2rrvppC105lHndMLkg_x2x0sLUE",
    "Authorization": "Bearer sb_publishable_JrM_2rrvppC105lHndMLkg_x2x0sLUE"
}

try:
    res = requests.get(url, headers=headers)
    print("Status Code:", res.status_code)
    if res.status_code == 200:
        data = res.json()
        print("Latest updated properties in Supabase:")
        for p in data:
            print(f"- {p['auction_no']} | Source: {p['source']} | Updated At: {p['updated_at']}")
    else:
        print("Error response:", res.text)
except Exception as e:
    print("Exception occurred:", e)
