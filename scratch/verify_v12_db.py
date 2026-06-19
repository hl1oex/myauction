# 한국어 주석: Supabase 데이터베이스 내 v1.2 신규 테이블(mock_bids, expert_consultations)의 연동 무결성을 REST API로 진단합니다.
import json
import urllib.request

def check_table(table_name):
    url = f"https://ubaxyfxcsxsvrryowswb.supabase.co/rest/v1/{table_name}?select=*&limit=1"
    headers = {
        "apikey": "sb_publishable_JrM_2rrvppC105lHndMLkg_x2x0sLUE"
    }
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode('utf-8'))
            print(f"[OK] 테이블 '{table_name}' 조회 성공. 데이터 건수: {len(data)}")
            return True
    except Exception as e:
        print(f"[ERROR] 테이블 '{table_name}' 조회 중 예외 발생: {e}")
        return False

print("=== v1.2 연동용 Supabase DB 테이블 검증 프로세스 ===")
check_table("mock_bids")
check_table("expert_consultations")
check_table("user_profiles")
