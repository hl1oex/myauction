# -*- coding: utf-8 -*-
# 2025타경9483 사건의 실제 데이터 확인을 위한 검증용 스크립트.
import requests
import json
import sys

# Windows에서 콘솔 출력이 cp949로 막히는 문제를 방지하기 위해 utf-8로 강제 재설정
sys.stdout.reconfigure(encoding='utf-8')

url = "https://ubaxyfxcsxsvrryowswb.supabase.co/rest/v1/properties?auction_no=eq.2025타경9483"
headers = {
    "apikey": "sb_publishable_JrM_2rrvppC105lHndMLkg_x2x0sLUE",
    "Authorization": "Bearer sb_publishable_JrM_2rrvppC105lHndMLkg_x2x0sLUE"
}

try:
    res = requests.get(url, headers=headers)
    if res.status_code == 200:
        data = res.json()
        print(json.dumps(data, indent=2, ensure_ascii=False))
    else:
        print("Error:", res.text)
except Exception as e:
    print("Error:", e)
