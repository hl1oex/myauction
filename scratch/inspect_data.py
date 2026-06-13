import requests
import json

url = "https://ubaxyfxcsxsvrryowswb.supabase.co/rest/v1/properties?limit=10"
headers = {
    "apikey": "sb_publishable_JrM_2rrvppC105lHndMLkg_x2x0sLUE",
    "Authorization": "Bearer sb_publishable_JrM_2rrvppC105lHndMLkg_x2x0sLUE"
}

try:
    res = requests.get(url, headers=headers)
    if res.status_code == 200:
        data = res.json()
        with open("scratch/inspected_properties.json", "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print("Success! Inspected properties saved to scratch/inspected_properties.json")
    else:
        print("Error:", res.text)
except Exception as e:
    print("Error:", e)
