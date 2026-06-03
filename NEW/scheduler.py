import os
import sys
import datetime
from apscheduler.schedulers.background import BackgroundScheduler

# sys.path에 부모 폴더와 scrapers 폴더를 추가하여 임포트 원활하게 설정
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)
sys.path.append(os.path.join(current_dir, "scrapers"))

from scrapers.court_scraper import scrape_court_data
from scrapers.onbid_fetcher import fetch_onbid_data

def run_court_scraper_task():
    print(f"[{datetime.datetime.now()}] [Plan A] Supreme Court scraper task initialized...")
    try:
        scrape_court_data()
    except Exception as e:
        print(f"[-] [플랜 A] 대법원 크롤러 구동 에러: {e}")

def run_onbid_fetcher_task():
    print(f"[{datetime.datetime.now()}] [Plan B] OnBid fetcher task initialized...")
    try:
        fetch_onbid_data()
    except Exception as e:
        print(f"[-] [플랜 B] 온비드 수집기 구동 에러: {e}")

def start_scheduler():
    """FastAPI 웹 서버 구동과 동시에 스케줄러를 백그라운드 스레드로 가동"""
    scheduler = BackgroundScheduler(timezone="Asia/Seoul")
    
    # 1. 플랜 A: 대법원 경매는 매일 새벽 3시 0분에 자동 실행
    scheduler.add_job(run_court_scraper_task, 'cron', hour=3, minute=0, id='court_scraper_job')
    
    # 2. 플랜 B: 온비드 OpenAPI는 1시간에 한 번씩 수집 실행
    scheduler.add_job(run_onbid_fetcher_task, 'interval', hours=1, id='onbid_fetcher_job')
    
    # 3. 테스트/초기화 목적: 서버 구동 즉시 비동기로 1회씩 크롤링 우선 실행
    scheduler.add_job(run_court_scraper_task, 'date', run_date=datetime.datetime.now() + datetime.timedelta(seconds=2))
    scheduler.add_job(run_onbid_fetcher_task, 'date', run_date=datetime.datetime.now() + datetime.timedelta(seconds=5))
    
    scheduler.start()
    print("[Scheduler] 24-hour automatic synchronization scheduler running smoothly!")

if __name__ == "__main__":
    # 단독 스케줄러 테스트용
    start_scheduler()
    import time
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        pass
