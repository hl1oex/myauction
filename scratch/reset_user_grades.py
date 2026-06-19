# 한국어 주석: 가입 회원 목록을 먼저 조회한 후 개별 ID 단위로 안전하게 등급을 C등급으로 리셋합니다.
import json
import urllib.request

base_url = "https://ubaxyfxcsxsvrryowswb.supabase.co/rest/v1/user_profiles"
headers = {
    "apikey": "sb_publishable_JrM_2rrvppC105lHndMLkg_x2x0sLUE",
    "Authorization": "Bearer sb_publishable_JrM_2rrvppC105lHndMLkg_x2x0sLUE",
    "Content-Type": "application/json"
}

try:
    # 1. 먼저 전체 사용자 목록을 조회합니다.
    select_req = urllib.request.Request(f"{base_url}?select=*", headers=headers)
    with urllib.request.urlopen(select_req) as response:
        users = json.loads(response.read().decode('utf-8'))
    
    # 2. 각 사용자 ID를 순회하며 개별 PATCH로 등급을 리셋합니다.
    print(f"[*] 총 {len(users)}명의 회원 등급 리셋 작업을 시작합니다.")
    for u in users:
        user_id = u["id"]
        email = u["email"]
        update_url = f"{base_url}?id=eq.{user_id}"
        
        data = {
            "grade": "C",
            "upgrade_requested": False
        }
        
        patch_req = urllib.request.Request(
            update_url, 
            data=json.dumps(data).encode('utf-8'), 
            headers=headers, 
            method='PATCH'
        )
        
        with urllib.request.urlopen(patch_req) as patch_res:
            print(f"[+] {email} ({user_id}) -> C등급 리셋 완료")
            
    print("[+] 모든 회원 등급이 C등급으로 안전하게 일괄 초기화 완료되었습니다.")
except Exception as e:
    print("Error:", e)
