# 이 파일은 캠코 온비드 비부동산 자산 시뮬레이션 데이터를 Supabase 클라우드 데이터베이스에 강제 동기화하기 위한 스크립트입니다.
import sys
import os
import sqlite3

# scrapers 폴더를 path에 추가하여 모듈을 가져올 수 있도록 처리합니다.
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scrapers.onbid_fetcher import (
    generate_simulated_onbid_data,
    init_db,
    save_to_db,
    sync_sqlite_to_supabase
)

def run_sync():
    """모의 데이터를 인메모리 SQLite에 적재 후 Supabase 클라우드 서버로 밀어넣는 핵심 실행 함수입니다."""
    print("[*] 강제 동기화 프로세스를 기동합니다.")
    try:
        conn = sqlite3.connect(":memory:")
        conn.row_factory = sqlite3.Row
        init_db(conn)
        
        # 고품질 비부동산 포함 34건의 시뮬레이션 데이터를 생성합니다.
        sim_data = generate_simulated_onbid_data()
        success_count = save_to_db(conn, sim_data)
        print(f"[+] SQLite 메모리 데이터베이스에 적재 완료하였습니다. 건수: {success_count}건.")
        
        # Supabase 클라우드로 즉시 동기화 전송을 개시합니다.
        sync_sqlite_to_supabase(conn)
        conn.close()
        print("[+] 동기화가 성공적으로 완료되었습니다.")
    except Exception as e:
        print(f"[-] 동기화 작업 도중 오류가 발생하였습니다. 오류 내용: {e}")

if __name__ == "__main__":
    run_sync()
