import sqlite3
import os

# SQLite 데이터베이스 파일의 상대 경로 설정 (NEW 폴더 내부)
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
    print("[+] NEW/auction.db Database and tables initialized successfully!")

if __name__ == "__main__":
    init_db()
