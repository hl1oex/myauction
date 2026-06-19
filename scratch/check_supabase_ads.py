# -*- coding: utf-8 -*-
# 이 스크립트는 Supabase ads 테이블에 적재되어 있는 광고 데이터 목록을 조회하여 출력합니다.

import urllib.request
import json

url = "https://ubaxyfxcsxsvrryowswb.supabase.co/rest/v1/ads?select=*"
headers = {
    "apikey": "sb_publishable_JrM_2rrvppC105lHndMLkg_x2x0sLUE",
    "Authorization": "Bearer sb_publishable_JrM_2rrvppC105lHndMLkg_x2x0sLUE"
}

req = urllib.request.Request(url, headers=headers)

try:
    with urllib.request.urlopen(req) as response:
        html = response.read().decode('utf-8')
        data = json.loads(html)
        print(json.dumps(data, indent=2, ensure_ascii=True))
except Exception as e:
    print("오류 발생", e)
