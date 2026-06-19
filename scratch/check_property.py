# -*- coding: utf-8 -*-
import requests
import json

url = "https://ubaxyfxcsxsvrryowswb.supabase.co/rest/v1/properties"
anon_key = "sb_publishable_JrM_2rrvppC105lHndMLkg_x2x0sLUE"

headers = {
    "apikey": anon_key,
    "Authorization": f"Bearer {anon_key}",
    "Content-Type": "application/json"
}

params = {
    "auction_no": "eq.제주지방법원 2024타경4447",
    "select": "*"
}

response = requests.get(url, headers=headers, params=params)
if response.status_code == 200:
    data = response.json()
    if data:
        item = data[0]
        for k, v in item.items():
            if k != "notes_content" and k != "desc_content":
                print(f"{k}: {v}")
        notes = item.get('notes_content', '')
        if "__METADATA__:" in notes:
            meta_part = notes.split("__METADATA__:")[1].split("__")[0]
            print("Metadata part:")
            print(meta_part)
else:
    print(f"Failed to fetch: {response.status_code}")
