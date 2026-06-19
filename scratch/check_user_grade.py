# 한국어 주석: Supabase DB에서 현재 가입자들의 등급과 업그레이드 요청 정보를 상세 조회합니다.
import json
import urllib.request

url = "https://ubaxyfxcsxsvrryowswb.supabase.co/rest/v1/user_profiles?select=*"
headers = {
    "apikey": "sb_publishable_JrM_2rrvppC105lHndMLkg_x2x0sLUE"
}
req = urllib.request.Request(url, headers=headers)
try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode('utf-8'))
        print(json.dumps(data, indent=2, ensure_ascii=False))
except Exception as e:
    print("Error:", e)
