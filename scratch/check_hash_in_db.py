# Supabase DB에서 특정 문자열(해시값)이 필드값에 포함되어 있는 행을 수색하는 테스트 스크립트입니다.
import requests
import json

supabase_url = "https://ubaxyfxcsxsvrryowswb.supabase.co"
apikey = "sb_publishable_JrM_2rrvppC105lHndMLkg_x2x0sLUE"
headers = {
    "apikey": apikey,
    "Authorization": f"Bearer {apikey}",
    "Content-Type": "application/json"
}

hash_val = "2cbbe1ae9e7e239e9bcbe588e79888fbfba31b8f44c65a1f848d7aeb8755059d"

# notes_content, address, desc_content, auction_no 등에서 문자열이 포함되는지 확인합니다.
url = f"{supabase_url}/rest/v1/properties?or=(notes_content.fts.{hash_val},address.fts.{hash_val},desc_content.fts.{hash_val},auction_no.eq.{hash_val})"

try:
    res = requests.get(url, headers=headers)
    print("Status Code:", res.status_code)
    if res.status_code == 200:
        data = res.json()
        print(f"Found {len(data)} properties containing the hash:")
        print(json.dumps(data, indent=2, ensure_ascii=False))
    else:
        print("Error response:", res.text)
except Exception as e:
    print("Exception occurred:", e)
