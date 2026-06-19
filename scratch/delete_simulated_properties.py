import json
import urllib.request
import urllib.parse

print("Supabase 모의 데이터 삭제 프로세스를 기동합니다.")

headers = {
    "apikey": "sb_publishable_JrM_2rrvppC105lHndMLkg_x2x0sLUE",
    "Authorization": "Bearer sb_publishable_JrM_2rrvppC105lHndMLkg_x2x0sLUE"
}

query1 = urllib.parse.quote("*2026타경100*")
url1 = f"https://ubaxyfxcsxsvrryowswb.supabase.co/rest/v1/properties?auction_no=ilike.{query1}"
req1 = urllib.request.Request(url1, headers=headers, method="DELETE")
try:
    with urllib.request.urlopen(req1) as response:
        print("[+] 2026타경100% 삭제 완료. 응답 상태:", response.status)
except Exception as e:
    print("[-] 1차 삭제 에러:", e)

query2 = urllib.parse.quote("*2026타경10100*")
url2 = f"https://ubaxyfxcsxsvrryowswb.supabase.co/rest/v1/properties?auction_no=ilike.{query2}"
req2 = urllib.request.Request(url2, headers=headers, method="DELETE")
try:
    with urllib.request.urlopen(req2) as response:
        print("[+] 2026타경10100 삭제 완료. 응답 상태:", response.status)
except Exception as e:
    print("[-] 2차 삭제 에러:", e)
