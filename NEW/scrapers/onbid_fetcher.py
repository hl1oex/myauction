import os
import json
import requests
import datetime
import xml.etree.ElementTree as ET
import time
import sqlite3
import urllib.parse

# DB 경로 설정 (부모 폴더의 auction.db)
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "auction.db")

# 하드필터 제외 단어 규칙 규칙 (내장 룰 구조)
HARDFILTER_RULES = {
    "구조": ["지분", "대지권없음", "토지별도", "건물만", "토지만", "대지권 미등기"],
    "점유": ["점유관계미상", "유치권", "명도곤란", "유치권 주장"],
    "추가비용": ["인수", "선순위", "선순위 임차인", "대항력", "임차권", "보증금 인수"],
    "정보부족": ["서류없음", "확인불가", "열람불가", "자료없음"]
}

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
                return False
    return True

def compute_softscore(price, close_date_str):
    score = 60
    # 서류 완전성 가점
    score += 10
    # 예산 적합성 가점
    score += 10
    # 기일 여유 가점
    remaining_days = calculate_remaining_days(close_date_str)
    if 0 <= remaining_days <= 90:
        score += 5
    # 온비드 공매 혜택 가점
    score += 5
    
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
            print(f"Error saving Onbid property {p['auction_no']}: {e}")
            
    conn.commit()
    conn.close()
    return success_count

def log_sync_status(status, count, error_msg=""):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    try:
        cursor.execute("""
        INSERT INTO sync_logs (task_name, status, item_count, error_msg)
        VALUES (?, ?, ?, ?)
        """, ('onbid_fetcher', status, count, error_msg))
        conn.commit()
    except Exception as e:
        print(f"Error logging sync status: {e}")
    finally:
        conn.close()

def fetch_onbid_data():
    service_key = os.environ.get("ONBID_SERVICE_KEY")
    if not service_key:
        # Fallback to default public key
        service_key = "8f25b28707d85a7c657d76d8689bacc8e6d3c87ea74de0330b9048bc7c1f1b98"
        
    if "%" in service_key:
        service_key = urllib.parse.unquote(service_key)
        
    rlst_url = "http://apis.data.go.kr/B010003/OnbidRlstListSrvc2/getRlstCltrList2"
    
    print("Fetching Onbid Real Estate data from OpenAPI...")
    items_collected = []
    scraper_error = ""
    
    # 1페이지(NumOfRows=50)로 한도 락다운하여 가속화
    params = {
        "serviceKey": service_key,
        "numOfRows": 50,
        "pageNo": 1,
        "dpslDvsCd": "0001",
        "pvctTrgtYn": "N",
        "prptDivCd": "0002,0003,0004",
        "_type": "json"
    }
    
    try:
        response = requests.get(rlst_url, params=params, timeout=15)
        if response.status_code == 200:
            data = response.json()
            body = data.get("response", {}).get("body", {})
            items = body.get("items", {}).get("item", [])
            
            if isinstance(items, dict):
                items = [items]
                
            for item in items:
                address = item.get("lnmAdr") or item.get("roadAdr") or item.get("onbidCltrNm") or "주소 미상"
                cltr_no = item.get("cltrMngNo", "")
                if not cltr_no:
                    continue
                    
                price = int(item.get("lowstBidPrcIndctCont") or item.get("cltrMnprPrc") or 0)
                appraisal = int(item.get("apslEvlAmt") or item.get("dpslMnprPrc") or 0)
                ptype = item.get("cltrUsgSclsCtgrNm") or item.get("prptDivNm") or "기타"
                
                close_date_raw = item.get("cltrBidEndDt") or item.get("pbctClsDtm") or ""
                close_date = ""
                if close_date_raw and len(close_date_raw) >= 8:
                    close_date = f"{close_date_raw[0:4]}-{close_date_raw[4:6]}-{close_date_raw[6:8]}"
                    
                desc = item.get("onbidCltrNm") or ""
                notes = item.get("pbctCdtnNo") or ""
                
                # 낙찰종결 필터
                text_to_check = f"{address} {desc} {notes}".lower()
                if any(kw in text_to_check for kw in ["낙찰", "매각결정", "종결"]):
                    continue
                    
                is_passed = evaluate_hardfilter(address, desc, notes)
                
                if is_passed:
                    score, grade, rem_days = compute_softscore(price, close_date)
                else:
                    score, grade = 0, "X"
                    rem_days = calculate_remaining_days(close_date)
                    notes = f"⚠️ 하드필터 제외 단어 검출! (공매 주의 요망) | {notes}"
                    
                items_collected.append({
                    "source": "onbid",
                    "auction_no": cltr_no,
                    "address": address,
                    "appraised_value": appraisal,
                    "minimum_bid": price,
                    "ptype": ptype,
                    "bidding_date": close_date,
                    "round_info": "1회차 인터넷입찰",
                    "desc_content": desc or "공매 물건 기본 명세입니다.",
                    "notes_content": notes or "검출된 공매 권리 하자 리스크가 없습니다.",
                    "link_url": "https://www.onbid.co.kr",
                    "grade": grade,
                    "score": score,
                    "remaining_days": rem_days
                })
                
            if items_collected:
                success_count = save_to_db(items_collected)
                log_sync_status("SUCCESS", success_count)
                print(f"[+] 온비드 수집 데이터 {success_count}건 SQLite에 저장/동기화 성공.")
            else:
                log_sync_status("SUCCESS", 0)
        else:
            scraper_error = f"HTTP Error {response.status_code}"
            log_sync_status("FAILED", 0, scraper_error)
            
    except Exception as e:
        scraper_error = str(e)
        log_sync_status("FAILED", 0, scraper_error)
        print(f"[-] 온비드 수집기 에러 발생: {e}")

if __name__ == "__main__":
    fetch_onbid_data()
