import requests
import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

url = "https://ubaxyfxcsxsvrryowswb.supabase.co/rest/v1/properties"
headers = {
    "apikey": "sb_publishable_JrM_2rrvppC105lHndMLkg_x2x0sLUE",
    "Authorization": "Bearer sb_publishable_JrM_2rrvppC105lHndMLkg_x2x0sLUE"
}

params = {
    "auction_no": "ilike.*100097*"
}

response = requests.get(url, headers=headers, params=params)
if response.status_code == 200:
    data = response.json()
    print(json.dumps(data, indent=2, ensure_ascii=False))
else:
    print(f"Error: {response.status_code}")
    print(response.text)
