# 만료 회원 등급 자동 복구 배치를 수동 가동하여 검증하는 스크립트입니다.

import os
import sys
import json
import requests
from datetime import datetime, timezone

# scrapers 폴더를 모듈 경로에 추가하여 함수를 가져오거나 직접 구현합니다.
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "scrapers"))
from run_daily_scrapers import process_expired_users

if __name__ == "__main__":
    print("[*] 테스트용 만료 회원 복구 배치 작업을 실행합니다.")
    process_expired_users()
    print("[+] 실행을 완료하였습니다.")
