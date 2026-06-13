import requests
import json

url = "https://ubaxyfxcsxsvrryowswb.supabase.co/rest/v1/properties?auction_no=eq.2013-101600-218"
headers = {
    "apikey": "sb_publishable_JrM_2rrvppC105lHndMLkg_x2x0sLUE",
    "Authorization": "Bearer sb_publishable_JrM_2rrvppC105lHndMLkg_x2x0sLUE"
}

try:
    res = requests.get(url, headers=headers)
    print("Status Code:", res.status_code)
    if res.status_code == 200:
        data = res.json()
        print("Data found:")
        print(json.dumps(data, indent=2, ensure_ascii=False))
    else:
        print("Error response:", res.text)
except Exception as e:
    print("Exception occurred:", e)
