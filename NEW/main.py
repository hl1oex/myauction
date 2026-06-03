import os
import sys
import uvicorn
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

# sys.path에 현재 경로 추가
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

from database import get_db_connection, init_db
from scheduler import start_scheduler

app = FastAPI(
    title="AI 부동산 경시/공매 실시간 데이터 연동 API Server",
    description="하이브리드 모바일/데스크톱 앱에 100% 실시간 정제 데이터를 공급해 주는 경량 API 서버입니다.",
    version="1.0"
)

# 🔒 CORS 정책 설정 (매우 중요!): index.html 단일 로컬 파일에서 호출할 수 있도록 전체 전면 개방
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    """서버 구동과 동시에 SQLite 테이블 초기화 및 24시간 백그라운드 수집 데몬 작동"""
    init_db()
    start_scheduler()

@app.get("/")
def read_root():
    return {
        "success": True,
        "message": "🏛️ AI Real Estate Auction API Server is Running!",
        "status": "NORMAL"
    }

@app.get("/api/properties")
def get_properties(
    source: str = Query(None, description="필터: 'court' (법원 경매) 또는 'onbid' (캠코 공매)"),
    search: str = Query(None, description="주소 또는 키워드 통합 검색")
):
    """클라이언트 앱으로 실시간 경매/공매 목록을 전송하는 핵심 API"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    query = "SELECT * FROM properties"
    params = []
    conditions = []
    
    if source:
        conditions.append("source = ?")
        params.append(source)
        
    if search:
        conditions.append("(address LIKE ? OR desc_content LIKE ? OR notes_content LIKE ? OR auction_no LIKE ?)")
        search_param = f"%{search}%"
        params.extend([search_param, search_param, search_param, search_param])
        
    if conditions:
        query += " WHERE " + " AND ".join(conditions)
        
    query += " ORDER BY score DESC, remaining_days ASC"
    
    try:
        cursor.execute(query, params)
        rows = cursor.fetchall()
        results = [dict(row) for row in rows]
        return {
            "success": True,
            "count": len(results),
            "data": results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"데이터베이스 조회 에러: {str(e)}")
    finally:
        conn.close()

@app.get("/api/status")
def get_sync_status():
    """수집기 스케줄러 동동 상태 상태 및 로그 확인 API"""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT * FROM sync_logs ORDER BY timestamp DESC LIMIT 10")
        rows = cursor.fetchall()
        logs = [dict(row) for row in rows]
        
        cursor.execute("SELECT MAX(timestamp) FROM sync_logs WHERE task_name='court_scraper' AND status='SUCCESS'")
        last_court = cursor.fetchone()[0]
        
        cursor.execute("SELECT MAX(timestamp) FROM sync_logs WHERE task_name='onbid_fetcher' AND status='SUCCESS'")
        last_onbid = cursor.fetchone()[0]
        
        return {
            "success": True,
            "last_court_sync": last_court or "기록 없음",
            "last_onbid_sync": last_onbid or "기록 없음",
            "logs": logs
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

if __name__ == "__main__":
    # 포트 8000번으로 로컬 Uvicorn 서버 실행
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
