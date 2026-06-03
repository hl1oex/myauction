import os
import re
import time
import random
import datetime
import requests
import sqlite3
import urllib.parse
from bs4 import BeautifulSoup

# DB 경로 설정 (부모 폴더의 auction.db)
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "auction.db")

# 전국 법원 코드 정보
COURT_CODES = {
    "B000210": "서울중앙지방법원",
    "B000211": "서울동부지방법원",
    "B000212": "서울남부지방법원",
    "B000213": "서울북부지방법원",
    "B000214": "서울서부지방법원",
    "B000240": "인천지방법원",
    "B000241": "인천지방법원 부천지원",
    "B000250": "수원지방법원",
    "B000251": "수원지방법원 성남지원",
    "B000252": "수원지방법원 여주지원",
    "B000253": "수원지방법원 평택지원",
    "B000254": "수원지방법원 안산지원",
    "B000255": "수원지방법원 안양지원",
    "B000260": "춘천지방법원",
    "B000261": "춘천지방법원 강릉지원",
    "B000262": "춘천지방법원 원주지원",
    "B000263": "춘천지방법원 속초지원",
    "B000264": "춘천지방법원 영월지원",
    "B000270": "대전지방법원",
    "B000271": "대전지방법원 홍성지원",
    "B000272": "대전지방법원 공주지원",
    "B000273": "대전지방법원 논산지원",
    "B000274": "대전지방법원 천안지원",
    "B000275": "대전지방법원 서산지원",
    "B000280": "청주지방법원",
    "B000281": "청주지방법원 충주지원",
    "B000282": "청주지방법원 제천지원",
    "B000283": "청주지방법원 영동지원",
    "B000285": "대구지방법원",
    "B000286": "대구지방법원 안동지원",
    "B000287": "대구지방법원 경주지원",
    "B000288": "대구지방법원 김천지원",
    "B000289": "대구지방법원 상주지원",
    "B000290": "대구지방법원 의성지원",
    "B000291": "대구지방법원 영덕지원",
    "B000292": "대구지방법원 포항지원",
    "B000293": "대구지방법원 서부지원",
    "B000300": "부산지방법원",
    "B000301": "부산지방법원 동부지원",
    "B000302": "울산지방법원",
    "B000303": "창원지방법원",
    "B000304": "창원지방법원 마산지원",
    "B000305": "부산지방법원 서부지원",
    "B000306": "창원지방법원 진주지원",
    "B000307": "창원지방법원 통영지원",
    "B000308": "창원지방법원 밀양지원",
    "B000309": "창원지방법원 거창지원",
    "B000310": "광주지방법원",
    "B000311": "광주지방법원 목포지원",
    "B000312": "광주지방법원 장흥지원",
    "B000313": "광주지방법원 순천지원",
    "B000314": "광주지방법원 해남지원",
    "B000320": "전주지방법원",
    "B000321": "전주지방법원 군산지원",
    "B000322": "전주지방법원 정읍지원",
    "B000323": "전주지방법원 남원지원",
    "B000330": "제주지방법원"
}

# 하드필터 제외 단어 규칙 (내장 룰 구조)
HARDFILTER_RULES = {
    "구조": ["지분", "대지권없음", "토지별도", "건물만", "토지만", "대지권 미등기"],
    "점유": ["점유관계미상", "유치권", "명도곤란", "유치권 주장"],
    "추가비용": ["인수", "선순위", "선순위 임차인", "대항력", "임차권", "보증금 인수"],
    "정보부족": ["서류없음", "확인불가", "열람불가", "자료없음"]
}

def clean_html(text):
    if not text:
        return ""
    clean = re.sub(r'<.*?>', ' ', text)
    clean = re.sub(r'\s+', ' ', clean)
    return clean.strip()

def extract_price(text):
    cleaned = clean_html(text)
    no_commas = cleaned.replace(",", "")
    matches = re.findall(r'\d+', no_commas)
    for m in matches:
        val = int(m)
        if val >= 100000:
            return val
    return 0

def clean_address(address):
    address = clean_html(address)
    if not address:
        return ""
    address = re.sub(r'\[상세내역\]|\[상세\]', '', address).strip()
    return address

def calculate_remaining_days(close_date_str):
    if not close_date_str:
        return 9999
    try:
        close_date = datetime.datetime.strptime(close_date_str, "%Y-%m-%d").date()
        today = datetime.date.today()
        return (close_date - today).days
    except ValueError:
        return 9999

def evaluate_hardfilter(address, desc, notes):
    search_text = f"{address} {desc} {notes}"
    for category, keywords in HARDFILTER_RULES.items():
        for kw in keywords:
            if kw in search_text:
                return False  # 필터에 걸림 (위험 매물)
    return True  # 필터 통과 (안전 매물)

def compute_softscore(price, close_date_str):
    # 100% 무인 기본 통과 조건 기준 점수화식 산출
    score = 60
    
    # 1. 서류 완전성 (법원 공식은 기본 가점)
    score += 10
    
    # 2. 예산 적합성 (초기값으로 무조건 가점)
    score += 10
    
    # 3. 기일 여유
    remaining_days = calculate_remaining_days(close_date_str)
    if 0 <= remaining_days <= 90:
        score += 5
        
    # 4. 희망 용도 및 지역 (기본값 매칭)
    score += 10
    
    # 등급 매핑
    if score >= 90:
        grade = "A"
    elif score >= 80:
        grade = "B"
    elif score >= 70:
        grade = "C"
    elif score >= 60:
        grade = "D"
    else:
        grade = "E"
        
    return score, grade, remaining_days

def save_to_db(properties_list):
    """수집된 대법원 경매 목록을 auction.db에 INSERT OR REPLACE 처리"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    success_count = 0
    for p in properties_list:
        try:
            cursor.execute("""
            INSERT OR REPLACE INTO properties (
                source, auction_no, address, ptype, appraised_value, minimum_bid,
                bidding_date, round_info, desc_content, notes_content, link_url,
                grade, score, remaining_days, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            """, (
                p["source"], p["auction_no"], p["address"], p["ptype"],
                p["appraised_value"], p["minimum_bid"], p["bidding_date"],
                p["round_info"], p["desc_content"], p["notes_content"], p["link_url"],
                p["grade"], p["score"], p["remaining_days"]
            ))
            success_count += 1
        except Exception as e:
            print(f"Error saving property {p['auction_no']}: {e}")
            
    conn.commit()
    conn.close()
    return success_count

def log_sync_status(status, count, error_msg=""):
    """동기화 상태 로그를 sync_logs 테이블에 입력"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    try:
        cursor.execute("""
        INSERT INTO sync_logs (task_name, status, item_count, error_msg)
        VALUES (?, ?, ?, ?)
        """, ('court_scraper', status, count, error_msg))
        conn.commit()
    except Exception as e:
        print(f"Error logging sync status: {e}")
    finally:
        conn.close()

def scrape_court_data():
    warmup_url = "https://www.courtauction.go.kr/pgj/index.on?w2xPath=/pgj/ui/pgj100/PGJ143M01.xml&pgjId=143M01"
    post_url = "https://www.courtauction.go.kr/pgj/pgj143/selectRletDspslPbanc.on"
    detail_url = "https://www.courtauction.go.kr/pgj/pgj143/selectRletDspslPbancDtl.on"
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Origin": "https://www.courtauction.go.kr",
        "Referer": warmup_url
    }
    
    combined_results = []
    scraper_error = ""
    
    print("Initiating requests session warmup for Supreme Court...")
    session = requests.Session()
    
    try:
        r_warmup = session.get(warmup_url, headers=headers, timeout=10)
        if r_warmup.status_code != 200:
            raise ConnectionError(f"Warmup page access failed (Status Code: {r_warmup.status_code})")
            
        # 3개월 윈도우 생성
        query_months = []
        today = datetime.date.today()
        for i in range(3):
            y = today.year
            m = today.month + i
            if m > 12:
                y += (m - 1) // 12
                m = (m - 1) % 12 + 1
            query_months.append(f"{y}{m:02d}")
            
        sessions_list = []
        
        # 대표 법원 위주 추출
        target_courts = list(COURT_CODES.items())[:10]  # 상위 10개 대표 법원
        
        for ymd in query_months[:2]: # 2달치 범위 우선 검색
            for court_code, court_name in target_courts:
                print(f"Fetching scheduled sessions for {ymd} at {court_name} ({court_code})...")
                payload = {
                    "dma_srchDspslPbanc": {
                        "srchYmd": ymd,
                        "cortOfcCd": court_code,
                        "bidDvsCd": "000331",
                        "srchBtnYn": "Y"
                    }
                }
                
                time.sleep(0.01 + random.random() * 0.02)
                
                try:
                    r = session.post(post_url, json=payload, headers=headers, timeout=10)
                    r.encoding = 'utf-8'
                    if r.status_code == 200:
                        data = r.json()
                        found_sessions = data.get("data", {}).get("dlt_rletDspslPbancLst", [])
                        if found_sessions:
                            sessions_list.extend(found_sessions)
                except Exception as ex:
                    print(f"Error fetching sessions for {court_name}: {ex}")
                    
        print(f"Querying details for {len(sessions_list)} sessions...")
        
        # 상세 조회 및 저장
        for idx, target in enumerate(sessions_list[:15]): # 페이징 제한
            detail_payload = {
                "dma_srchGnrlPbanc": {
                    "dspslRealId": target.get("dspslRealId"),
                    "cortOfcCd": target.get("cortOfcCd"),
                    "jdbnCd": target.get("jdbnCd"),
                    "dspslDxdyYmd": target.get("dspslDxdyYmd")
                }
            }
            
            time.sleep(0.1 + random.random() * 0.05)
            
            try:
                r_detail = session.post(detail_url, json=detail_payload, headers=headers, timeout=15)
                r_detail.encoding = 'utf-8'
                if r_detail.status_code == 200:
                    detail_data = r_detail.json()
                    result = detail_data.get("data", {}).get("result", {})
                    
                    raw_items = []
                    for item in result.get("dspslPbanc", {}).get("pbancInfo", {}).get("lst", []):
                        raw_items.append(item)
                    for item in result.get("crrctPbancLst", []):
                        raw_items.append(item)
                        
                    for raw_item in raw_items:
                        cs_no = clean_html(raw_item.get("csNo", ""))
                        if not cs_no:
                            continue
                            
                        address = clean_address(raw_item.get("st", ""))
                        appraisal = extract_price(raw_item.get("aeeEvlAmt", "0"))
                        price = extract_price(raw_item.get("lwsDspslPrc", "0"))
                        ptype = raw_item.get("dspslUsgNm", "") or raw_item.get("usgNm", "기타")
                        
                        # 🚫 [비부동산 데이터 차단] 자동차, 중기, 선박, 항공기, 기계, 기구, 차량, 동산, 유가증권, 물품, 권리 등 배제
                        ptype_lower = ptype.lower()
                        if any(kw in ptype_lower for kw in ["자동차", "중기", "선박", "항공기", "기계", "기구", "차량", "동산", "유가증권", "물품", "어업권", "광업권"]):
                            continue
                            
                        # 주소에 차량 관련 단어가 있으면 추가 배제 (2중 안전 장치)
                        address_lower = address.lower()
                        if any(kw in address_lower for kw in ["등록번호:", "차명:", "차대번호:", "원동기형식:"]):
                            continue
                            
                        close_date_raw = target.get("dspslDxdyYmd", "")
                        close_date = ""
                        if close_date_raw and len(close_date_raw) == 8:
                            close_date = f"{close_date_raw[:4]}-{close_date_raw[4:6]}-{close_date_raw[6:]}"
                            
                        desc = clean_html(raw_item.get("crrctCtt", "") or raw_item.get("crrctPbancCtt", ""))
                        notes = clean_html(raw_item.get("dspslRmk", ""))
                        
                        # 낙찰종결 스킵
                        text_to_check = f"{address} {desc} {notes} {raw_item.get('dspslStatNm', '')}".lower()
                        if any(kw in text_to_check for kw in ["낙찰", "매각결정", "종결"]):
                            continue
                            
                        # 1. 하드필터 적용
                        is_passed = evaluate_hardfilter(address, desc, notes)
                        
                        if is_passed:
                            # 2. 소프트 점수 산출
                            score, grade, rem_days = compute_softscore(price, close_date)
                        else:
                            # 위험 물건은 즉시 X등급 / 0점 부여
                            score, grade = 0, "X"
                            rem_days = calculate_remaining_days(close_date)
                            notes = f"⚠️ 하드필터 제외 단어 검출! (투자 주의 요망) | {notes}"
                            
                        combined_results.append({
                            "source": "court",
                            "auction_no": cs_no,
                            "address": address,
                            "appraised_value": appraisal,
                            "minimum_bid": price,
                            "ptype": ptype,
                            "bidding_date": close_date,
                            "round_info": target.get("dspslDxdyYmd", "") + " 회차 정보",
                            "desc_content": desc or "상세 정보 요약 내용이 존재하지 않습니다.",
                            "notes_content": notes or "검출된 법적 리스크 권리 인수 특이사항이 없습니다.",
                            "link_url": f"https://www.courtauction.go.kr",
                            "grade": grade,
                            "score": score,
                            "remaining_days": rem_days
                        })
            except Exception as d_ex:
                print(f"Error parsing detail: {d_ex}")
                
        # DB에 저장 실행
        if combined_results:
            success_count = save_to_db(combined_results)
            log_sync_status("SUCCESS", success_count)
            print(f"[+] Court data synchronized successfully! Total: {success_count} listings.")
        else:
            log_sync_status("SUCCESS", 0)
            
    except Exception as e:
        scraper_error = str(e)
        log_sync_status("FAILED", 0, scraper_error)
        print(f"[-] Supreme Court scraper global exception: {e}")

if __name__ == "__main__":
    scrape_court_data()
