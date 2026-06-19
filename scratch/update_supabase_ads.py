# -*- coding: utf-8 -*-
import urllib.request
import json

ids = [1, 10, 11, 16, 17, 18, 19]
url_base = "https://ubaxyfxcsxsvrryowswb.supabase.co/rest/v1/ads?id=eq.{}"
headers = {
    "apikey": "sb_publishable_JrM_2rrvppC105lHndMLkg_x2x0sLUE",
    "Authorization": "Bearer sb_publishable_JrM_2rrvppC105lHndMLkg_x2x0sLUE",
    "Content-Type": "application/json",
    "Prefer": "return=minimal"
}

for i in ids:
    url = url_base.format(i)
    data = {"type": "direct"}
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode('utf-8'),
        headers=headers,
        method="PATCH"
    )
    try:
        with urllib.request.urlopen(req) as response:
            print(f"ID {i} 업데이트 완료")
    except Exception as e:
        print(f"ID {i} 업데이트 실패:", e)
