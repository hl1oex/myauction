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

# Firebase Admin SDK 관련 패키지를 활용해 데이터를 안전하게 동기화하기 위해 모듈을 추가 구성하였습니다.
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore

def get_firestore_client():
    """Firebase 서비스 계정 키 파일을 사용해 Firestore 클라이언트를 반환합니다."""
    # config 폴더 내에 서비스 계정 키를 배치하도록 가이드합니다.
    key_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "config", "serviceAccountKey.json")
    
    if not os.path.exists(key_path):
        print(f"[-] Firebase 서비스 계정 키를 찾을 수 없습니다: {key_path}")
        print("    Firebase Console -> 프로젝트 설정 -> 서비스 계정에서 새 비공개 키를 생성하여 저장해 주십시오.")
        return None
        
    try:
        # 이미 초기화된 앱이 있는지 확인합니다.
        if not firebase_admin._apps:
            cred = credentials.Certificate(key_path)
            firebase_admin.initialize_app(cred)
        return firestore.client()
    except Exception as e:
        print(f"[-] Firebase Admin SDK 초기화 오류 발생: {e}")
        return None

def sync_sqlite_to_firestore():
    """SQLite에 적재된 경매/공매 매물 데이터를 Firestore 클라우드로 동기화합니다."""
    db_fs = get_firestore_client()
    if not db_fs:
        print("[-] Firestore 클라이언트 초기화 실패로 동기화를 생략합니다.")
        return
        
    print("[*] SQLite -> Firestore 동기화를 시작합니다.")
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # properties 테이블의 모든 데이터를 쿼리합니다.
        cursor.execute("SELECT * FROM properties")
        rows = cursor.fetchall()
        
        # Firestore의 'properties' 컬렉션을 타겟으로 설정합니다.
        # 고유값인 SQLite의 id를 문서 ID로 활용합니다.
        batch = db_fs.batch()
        count = 0
        
        for row in rows:
            data = dict(row)
            doc_id = str(data["id"])
            doc_ref = db_fs.collection("properties").document(doc_id)
            
            # Firestore 업로드 포맷에 맞춰 데이터 타입을 정비합니다.
            batch.set(doc_ref, data)
            count += 1
            
            # Firestore Batch는 500개 제한이 있으므로 나누어 커밋합니다.
            if count % 400 == 0:
                batch.commit()
                batch = db_fs.batch()
                print(f"[+] {count}개 매물 업로드 완료...")
                
        if count % 400 != 0:
            batch.commit()
            
        print(f"[+] Firestore 동기화 완료: 총 {count}개 매물이 전송되었습니다.")
        
        # 마지막 동기화 시간과 수집기 로그도 Firestore에 업로드하여 모바일 앱이 참조할 수 있게 합니다.
        cursor.execute("SELECT * FROM sync_logs ORDER BY timestamp DESC LIMIT 5")
        log_rows = cursor.fetchall()
        logs_list = [dict(log) for log in log_rows]
        
        status_ref = db_fs.collection("status").document("sync_info")
        status_ref.set({
            "last_sync_timestamp": firestore.SERVER_TIMESTAMP,
            "total_properties_count": count,
            "logs": logs_list
        })
        print("[+] 동기화 상태 로그 업로드 완료!")
        
    except Exception as e:
        print(f"[-] Firestore 동기화 중 오류 발생: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    init_db()
