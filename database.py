# SQLite 로컬 저장소 정의 및 클라우드 Firestore 동기화를 제어하는 통합 데이터베이스 제어 파일입니다.
import sqlite3
import os

# SQLite 데이터베이스 파일의 상대 경로 설정 (Real-estate-auction 폴더 내부)
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "auction.db")

def get_db_connection():
    """데이터베이스 파일에 연결하는 커넥션 객체 생성"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # 조회 결과를 딕셔너리 형태로 가져오도록 설정
    return conn

def init_db():
    """서버 최초 가동 시 테이블 구조가 없으면 생성"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. 경매 및 공매 물건 데이터를 저장할 테이블
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS properties (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source TEXT NOT NULL,          -- 'court' (법원 경매) 또는 'onbid' (온비드 공매)
        auction_no TEXT UNIQUE,       -- 사건번호 혹은 관리번호 (고유키)
        address TEXT NOT NULL,         -- 소재지 주소
        ptype TEXT,                    -- 부동산 용도 유형
        appraised_value REAL,          -- 감정가
        minimum_bid REAL,              -- 최저입찰가
        bidding_date TEXT,             -- 매각기일 (YYYY-MM-DD)
        round_info TEXT,               -- 입찰 차수 및 상태
        desc_content TEXT,             -- 법원 비고/공고 원문 상세
        notes_content TEXT,            -- 권리분석 특이사항
        link_url TEXT,                 -- 공식 사이트 바로가기 상세 URL
        grade TEXT,                    -- AI 등급 (A, B, C, X 등)
        score INTEGER,                 -- AI 적합도 점수 (0~100)
        remaining_days INTEGER,        -- 남은 기일 수 D-Day
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    # 2. 크롤러 동작 상태 로그를 저장할 테이블
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sync_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_name TEXT NOT NULL,       -- 'court_scraper' 또는 'onbid_fetcher'
        status TEXT NOT NULL,          -- 'SUCCESS' or 'FAILED'
        item_count INTEGER DEFAULT 0,  -- 수집된 물건 개수
        error_msg TEXT,                -- 오류 메시지
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    
    conn.commit()
    conn.close()
    print("[+] Subfolder Real-estate-auction/auction.db Database initialized successfully!")

# Firebase Admin SDK 관련 패키지를 제거하고 Supabase REST API를 활용해 데이터를 안전하게 동기화하도록 개량하였습니다.
import requests
import json
from datetime import datetime, timezone

def get_supabase_client_info():
    """환경 변수 또는 로컬 supabase_config.json 파일로부터 Supabase URL과 Service Key를 로드합니다."""
    # 1. 환경 변수 확인 (GitHub Actions 등 온라인 구동 환경용)
    url = os.environ.get("SUPABASE_URL")
    service_key = os.environ.get("SUPABASE_SERVICE_KEY")
    
    if url and service_key:
        return url, service_key
        
    # 2. 로컬 파일 확인
    config_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "config", "supabase_config.json")
    if os.path.exists(config_path):
        try:
            with open(config_path, "r", encoding="utf-8") as f:
                config = json.load(f)
                return config.get("supabase_url"), config.get("supabase_service_key")
        except Exception as e:
            print(f"[-] Supabase 설정 파일 파싱 오류: {e}")
            
    return None, None

def sync_sqlite_to_supabase():
    """SQLite에 적재된 경매/공매 매물 데이터를 Supabase PostgreSQL 클라우드로 동기화합니다."""
    supabase_url, supabase_key = get_supabase_client_info()
    if not supabase_url or not supabase_key or "placeholder" in supabase_url:
        print("[-] Supabase 접속 정보가 누락되었거나 데모 상태입니다. 동기화를 생략합니다.")
        return
        
    print("[*] SQLite -> Supabase PostgreSQL 동기화를 시작합니다.")
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # properties 테이블의 모든 데이터를 쿼리합니다.
        cursor.execute("SELECT * FROM properties")
        rows = cursor.fetchall()
        
        headers = {
            "apikey": supabase_key,
            "Authorization": f"Bearer {supabase_key}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates"
        }
        
        # 사건번호(auction_no) 충돌 시 업데이트하도록 Upsert API 엔드포인트를 호출합니다.
        upsert_url = f"{supabase_url}/rest/v1/properties?on_conflict=auction_no"
        count = 0
        batch_size = 200
        batch_data = []
        
        for row in rows:
            data = dict(row)
            # D-Day 계산은 모바일/웹 프론트엔드에서 계산하므로 D-Day 컬럼은 업로드하지 않거나 기본값 처리합니다.
            if "remaining_days" in data:
                del data["remaining_days"]
            if "updated_at" in data:
                del data["updated_at"]
                
            # PostgreSQL bigint 데이터 형식과 맞추기 위해 실수를 정수형으로 명시적 캐스팅합니다.
            if "appraised_value" in data and data["appraised_value"] is not None:
                try:
                    data["appraised_value"] = int(float(data["appraised_value"]))
                except Exception:
                    pass
            if "minimum_bid" in data and data["minimum_bid"] is not None:
                try:
                    data["minimum_bid"] = int(float(data["minimum_bid"]))
                except Exception:
                    pass
                
            batch_data.append(data)
            count += 1
            
            # API 부하 분산과 안정적 전송을 위해 200개 단위로 끊어 업로드합니다.
            if len(batch_data) >= batch_size:
                res = requests.post(upsert_url, headers=headers, json=batch_data, timeout=15)
                if res.status_code not in [200, 201]:
                    print(f"[-] 매물 업로드 실패 ({res.status_code}): {res.text}")
                    return
                print(f"[+] {count}개 매물 업로드 완료...")
                batch_data = []

        # 루프 완료 후 남은 데이터가 있다면 마저 전송합니다.
        if batch_data:
            res = requests.post(upsert_url, headers=headers, json=batch_data, timeout=15)
            if res.status_code not in [200, 201]:
                print(f"[-] 남은 매물 업로드 실패 ({res.status_code}): {res.text}")
                return
            print(f"[+] 최종 {count}개 매물 업로드 완료...")
            
        print(f"[+] Supabase 동기화 완료: 총 {count}개 매물이 전송되었습니다.")
        
        # 마지막 동기화 시간과 수집기 로그도 Supabase sync_info 테이블에 업로드하여 앱이 참조할 수 있게 합니다.
        cursor.execute("SELECT * FROM sync_logs ORDER BY timestamp DESC LIMIT 5")
        log_rows = cursor.fetchall()
        logs_list = [dict(log) for log in log_rows]
        
        status_payload = {
            "id": 1,
            "last_sync_timestamp": datetime.now(timezone.utc).isoformat(),
            "total_properties_count": count,
            "logs": logs_list
        }
        
        status_upsert_url = f"{supabase_url}/rest/v1/sync_info?on_conflict=id"
        res_status = requests.post(status_upsert_url, headers=headers, json=status_payload, timeout=15)
        if res_status.status_code not in [200, 201]:
            print(f"[-] 동기화 상태 로그 업로드 실패 ({res_status.status_code}): {res_status.text}")
            return
            
        print("[+] 동기화 상태 로그 업로드 완료!")
        
    except Exception as e:
        print(f"[-] Supabase 동기화 중 오류 발생: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    init_db()
    sync_sqlite_to_supabase()
