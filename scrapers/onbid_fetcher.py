# -*- coding: utf-8 -*-
# 한국자산관리공사 온비드 공매 물건 수집 및 클라우드 Supabase DB 연동 모듈입니다.
import os
import json
import requests
import datetime
import xml.etree.ElementTree as ET
import time
import sqlite3
import urllib.parse
import random
from bs4 import BeautifulSoup

# SQLite 인메모리 데이터베이스를 활용하여 로컬 I/O 생성을 완전히 차단합니다.
DB_PATH = ":memory:"

def scrape_onbid_web_details(url, is_lease):
    """온비드 공식 상세페이지 웹사이트를 직접 크롤링하여 실사진 목록 및 임대방식 등의 상세 정보를 추출합니다."""
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
        "Referer": "https://www.onbid.co.kr/op/cltrpbancinf/toppagemng/unfsrch/UnfSrchController/mvmnUnfSrchClg.do"
    }
    result = {
        "images": [],
        "ptype_detail": None,
        "bid_method": None,
        "lease_method": None,
        "lease_term": None,
        "round": None,
        "failed_count": None,
        "success": False
    }
    try:
        # API 및 웹 서버 과부하 방지 딜레이 적용
        time.sleep(0.3 + random.random() * 0.3)
        res = requests.get(url, headers=headers, timeout=12)
        if res.status_code == 200:
            soup = BeautifulSoup(res.text, "html.parser")
            
            # 1. 실제 물건 사진 이미지 URL 목록 파싱
            images = []
            for img in soup.find_all("img"):
                src = img.get("src", "")
                if "dnldImgFile.do" in src or "FileMngPrcsController" in src:
                    full_url = src
                    if not src.startswith("http"):
                        full_url = "https://www.onbid.co.kr" + src
                    if full_url not in images:
                        images.append(full_url)
            result["images"] = images
            
            # 2. 동적 텍스트 매칭 기반 상세 명세 파싱
            def get_val(label_text):
                for span in soup.find_all(class_=["tit01", "tit02"]):
                    if label_text in span.text:
                        parent = span.find_parent(class_=["tit_box", "tit_box01", "tit_box02"])
                        if parent:
                            sibling = parent.find_next_sibling(class_="txt_box01")
                            if sibling:
                                return sibling.text.strip().replace("\n", " ").replace("  ", " ")
                        item = span.find_parent(class_="item")
                        if item:
                            val_box = item.find(class_="txt_box01")
                            if val_box:
                                return val_box.text.strip().replace("\n", " ").replace("  ", " ")
                return None
                
            result["ptype_detail"] = get_val("재산유형")
            result["bid_method"] = get_val("입찰방식")
            result["lease_method"] = get_val("임대방식")
            result["lease_term"] = get_val("임대기간")
            result["round"] = get_val("회차")
            result["failed_count"] = get_val("유찰횟수")
            result["success"] = True
    except Exception as e:
        print(f"[-] Web scraping details failed for {url} with error {e}")
    return result


def init_db(conn):
    """메모리 내에 경매 및 공매 물건 테이블 구조를 동적으로 구축합니다."""
    cursor = conn.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS properties (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source TEXT NOT NULL,
        auction_no TEXT UNIQUE,
        address TEXT NOT NULL,
        ptype TEXT,
        appraised_value REAL,
        minimum_bid REAL,
        bidding_date TEXT,
        round_info TEXT,
        desc_content TEXT,
        notes_content TEXT,
        link_url TEXT,
        grade TEXT,
        score INTEGER,
        remaining_days INTEGER,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS sync_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_name TEXT NOT NULL,
        status TEXT NOT NULL,
        item_count INTEGER DEFAULT 0,
        error_msg TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)
    conn.commit()

def get_supabase_client_info():
    """클라우드 업로드에 사용할 Supabase 연결 자격 증명을 로드합니다."""
    url = os.environ.get("SUPABASE_URL")
    service_key = os.environ.get("SUPABASE_SERVICE_KEY")
    if url and service_key:
        return url, service_key
        
    config_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "config", "supabase_config.json")
    if os.path.exists(config_path):
        try:
            with open(config_path, "r", encoding="utf-8") as f:
                config = json.load(f)
                return config.get("supabase_url"), config.get("supabase_service_key")
        except Exception as e:
            print(f"[-] Supabase 설정 파일 파싱 오류: {e}")
    return None, None

def sync_sqlite_to_supabase(conn):
    """메모리 SQLite 데이터를 온라인 Supabase PostgreSQL 클라우드로 즉시 업로드합니다."""
    supabase_url, supabase_key = get_supabase_client_info()
    if not supabase_url or not supabase_key or "placeholder" in supabase_url:
        print("[-] Supabase 접속 정보가 누락되었거나 데모 상태입니다. 동기화를 생략합니다.")
        return
        
    print("[*] SQLite -> Supabase PostgreSQL 동기화를 시작합니다.")
    cursor = conn.cursor()
    
    try:
        cursor.execute("SELECT * FROM properties")
        rows = cursor.fetchall()
        
        headers = {
            "apikey": supabase_key,
            "Authorization": f"Bearer {supabase_key}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates"
        }
        
        upsert_url = f"{supabase_url}/rest/v1/properties?on_conflict=auction_no"
        count = 0
        batch_size = 200
        batch_data = []
        
        for row in rows:
            data = dict(row)
            if "id" in data:
                del data["id"]
            if "remaining_days" in data:
                del data["remaining_days"]
            if "updated_at" in data:
                del data["updated_at"]
                
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
            
            if len(batch_data) >= batch_size:
                res = requests.post(upsert_url, headers=headers, json=batch_data, timeout=15)
                if res.status_code not in [200, 201]:
                    print(f"[-] 매물 업로드 실패 ({res.status_code}): {res.text}")
                    return
                print(f"[+] {count}개 매물 업로드 완료...")
                batch_data = []

        if batch_data:
            res = requests.post(upsert_url, headers=headers, json=batch_data, timeout=15)
            if res.status_code not in [200, 201]:
                print(f"[-] 남은 매물 업로드 실패 ({res.status_code}): {res.text}")
                return
            print(f"[+] 최종 {count}개 매물 업로드 완료...")
            
        print(f"[+] Supabase 동기화 완료: 총 {count}개 매물이 전송되었습니다.")
        
        cursor.execute("SELECT * FROM sync_logs ORDER BY timestamp DESC LIMIT 5")
        log_rows = cursor.fetchall()
        logs_list = [dict(log) for log in log_rows]
        
        status_payload = {
            "id": 1,
            "last_sync_timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
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


# 하드필터 제외 단어 규칙 (내장 룰 구조)
HARDFILTER_RULES = {
    "구조": ["지분", "대지권없음", "토지별도", "건물만", "토지만", "대지권 미등기"],
    "점유": ["점유관계미상", "유치권", "명도곤란", "유치권 주장"],
    "추가비용": ["인수", "선순위", "선순위 임차인", "대항력", "임차권", "보증금 인수"],
    "정보부족": ["서류없음", "확인불가", "열람불가", "자료없음"]
}

def safe_int(val_str, default=0):
    if not val_str:
        return default
    cleaned = "".join([c for c in str(val_str) if c.isdigit() or c == '-'])
    if not cleaned:
        return default
    try:
        return int(cleaned)
    except ValueError:
        return default

def calculate_remaining_days(close_date_str):
    if not close_date_str:
        return 9999
    try:
        close_date = datetime.datetime.strptime(close_date_str, "%Y-%m-%d").date()
        today = datetime.date.today()
        return (close_date - today).days
    except ValueError:
        return 9999

def compute_softscore(price, appraisal, address, ptype, close_date_str, desc, notes):
    # 기본 스코어는 60점 시작
    score = 60
    
    # 1. 문서 완전성 및 예산 적합성 (기본 가점 +15)
    score += 15
    
    # 2. 기일 임박 시급성 및 여유도 (+5)
    remaining_days = calculate_remaining_days(close_date_str)
    if 0 <= remaining_days <= 14:
        score += 5  # 매우 임박하여 즉시 분석 필요
    elif 15 <= remaining_days <= 90:
        score += 3  # 안정적 검토 가능
        
    # 3. 입지 우수성 가점 (+10)
    # 서울 핵심 지역(강남, 서초, 송파) 및 성남 분당구 검출 시 가점 부여
    address_clean = address or ""
    if any(loc in address_clean for loc in ["강남구", "서초구", "송파구", "분당구"]):
        score += 10
        
    # 4. 용도 선호 유형 가점 (+10)
    # 아파트, 오피스텔 등 선호도 높은 주거용 부동산 가점
    ptype_clean = ptype or ""
    if any(pref in ptype_clean for pref in ["아파트", "오피스텔", "주택"]):
        score += 10
    elif any(pref in ptype_clean for pref in ["상가", "점포", "근린"]):
        score += 5
        
    # 5. 유찰 할인율 매력도 (+10)
    # 감정가 대비 최저가 저감폭 계산 (유찰 횟수가 많고 가격 매력도가 클수록 가점)
    if appraisal and appraisal > 0 and price and price > 0:
        discount_ratio = (appraisal - price) / appraisal
        if discount_ratio >= 0.30:
            score += 10  # 30% 이상 초저가 할인 매물
        elif discount_ratio >= 0.20:
            score += 5   # 20% 이상 일반 할인 매물

    # 6. 리스크 감점 세분화
    # 6.1 치명적 리스크 검사 -> 강제 X등급 및 0점 처리
    fatal_keywords = ["대지권없음", "건물만", "토지만", "대지권 미등기", "유치권", "유치권 주장", "지분"]
    search_text = f"{address} {desc} {notes}".lower()
    
    for kw in fatal_keywords:
        if kw in search_text:
            return 0, "X", remaining_days
            
    # 6.2 일반/주의 리스크 검사 -> 부분 감점 (건당 -25, 최소 0점 한도)
    moderate_keywords = ["점유관계미상", "명도곤란", "선순위 임차인", "대항력", "임차권", "보증금 인수", "토지별도", "서류없음", "확인불가", "열람불가", "자료없음"]
    moderate_count = 0
    for kw in moderate_keywords:
        if kw in search_text:
            moderate_count += 1
            
    if moderate_count > 0:
        score = max(0, score - 25)
        
    # 최종 등급 매핑
    if score >= 90:
        grade = "A"
    elif score >= 80:
        grade = "B"
    elif score >= 70:
        grade = "C"
    elif score >= 50:
        grade = "D"
    else:
        grade = "E"
        
    # 만약 주의 리스크가 검출되었는데 점수 상으로 A/B인 경우 D등급으로 보정하여 안전성 확보
    if moderate_count > 0 and grade in ["A", "B", "C"]:
        grade = "D"
        
    return score, grade, remaining_days

def save_to_db(conn, properties_list):
    """메모리 SQLite 연결 객체를 직접 수령하여 매물 데이터를 대량으로 인서트합니다."""
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
    return success_count

def log_sync_status(conn, status, count, error_msg=""):
    """메모리 SQLite 연결 객체를 수령하여 크롤링 실행 로그를 추가합니다."""
    cursor = conn.cursor()
    try:
        cursor.execute("""
        INSERT INTO sync_logs (task_name, status, item_count, error_msg)
        VALUES ('onbid_fetcher', ?, ?, ?)
        """, (status, count, error_msg))
        conn.commit()
    except Exception as e:
        print(f"Error logging sync status: {e}")

# 모의 데이터 생성 함수가 완전히 제거되었습니다.



def fetch_onbid_api_details(service_key, cltr_mng_no, pbct_cdtn_no, asset_type='rlst'):
    """온비드 차세대 부동산/차량/동산 물건상세조회 오픈 API를 호출하여 정밀한 실사진 및 임대조건 정보를 가져옵니다."""
    if asset_type == 'car':
        url = "http://apis.data.go.kr/B010003/OnbidCarDtlSrvc2/getCarDtlInf2"
    elif asset_type == 'mvast':
        url = "http://apis.data.go.kr/B010003/OnbidMvastDtlSrvc2/getMvastDtlInf2"
    else:
        url = "http://apis.data.go.kr/B010003/OnbidRlstDtlSrvc2/getRlstDtlInf2"
        
    result = {
        "images": [],
        "ptype_detail": None,
        "lease_method": None,
        "lease_term": None,
        "round": None,
        "failed_count": None,
        "desc_detail": None,
        "success": False
    }
    
    try:
        params = {
            "serviceKey": service_key,
            "pageNo": "1",
            "numOfRows": "10",
            "resultType": "json",
            "cltrMngNo": cltr_mng_no
        }
        if pbct_cdtn_no:
            params["pbctCdtnNo"] = pbct_cdtn_no
            
        res = None
        for attempt in range(3):
            try:
                time.sleep(0.2 + attempt * 0.3 + random.random() * 0.2)
                res = requests.get(url, params=params, timeout=10)
                if res.status_code == 200:
                    break
            except Exception as conn_err:
                if attempt == 2:
                    raise conn_err
                print(f"[*] API 상세조회 접속 재시도 중 (시도 {attempt + 1}/3)오류: {conn_err}")
                
        if res and res.status_code == 200:
            data = res.json()
            if "response" in data:
                data = data["response"]
            header = data.get("header", {})
            if header.get("resultCode") == "00":
                body = data.get("body", {})
                items = body.get("items", {})
                if items:
                    item_list = items.get("item", [])
                    if isinstance(item_list, dict):
                        item_list = [item_list]
                    if item_list:
                        dtl = item_list[0]
                        images = []
                        img_list = dtl.get("upsCltrImgUrlList") or dtl.get("cltrImgUrlList") or dtl.get("imgUrlList") or []
                        if isinstance(img_list, dict):
                            img_list = [img_list]
                        for img_item in img_list:
                            url_val = img_item.get("upsCltrImgUrl") or img_item.get("cltrImgUrl") or img_item.get("imgUrl") or img_item.get("fileUrl")
                            if url_val:
                                images.append(url_val)
                        result["images"] = images
                        result["ptype_detail"] = dtl.get("cltrUsgSclsCtgrNm") or dtl.get("prptDivNm")
                        result["bid_method"] = dtl.get("bidMtdNm")
                        result["lease_method"] = dtl.get("leaseMtdNm") or dtl.get("dpslDvsNm")
                        result["lease_term"] = dtl.get("leaseTerm")
                        result["round"] = dtl.get("pbctNo")
                        result["failed_count"] = dtl.get("fldCnt") or dtl.get("failedCount")
                        result["desc_detail"] = dtl.get("onbidCltrNm") or dtl.get("cltrNm")
                        result["success"] = True
    except Exception as e:
        print(f"[-] Onbid API details failed for {cltr_mng_no} with error {e}")
    return result

def process_single_item(raw_info, service_key):
    """단일 온비드 매물 아이템의 상세 정보를 OpenAPI 또는 웹 스크래핑으로 수집하여 가공합니다."""
    item = raw_info["item"]
    asset_type = raw_info["asset_type"]
    dpsl_cd = raw_info["dpsl_cd"]
    
    cltr_area_text = ""
    land_area_text = ""
    bdng_area_text = ""
    
    if isinstance(item, ET.Element):
        cltr_no = item.findtext("cltrMngNo") or ""
        if not cltr_no:
            return None
        address = item.findtext("lnmAdr") or item.findtext("roadAdr") or item.findtext("onbidCltrNm") or "--"
        price = safe_int(item.findtext("lowstBidPrcIndctCont") or item.findtext("cltrMnprPrc") or 0)
        appraisal = safe_int(item.findtext("apslEvlAmt") or item.findtext("dpslMnprPrc") or 0)
        ptype = item.findtext("cltrUsgSclsCtgrNm") or item.findtext("prptDivNm") or "--"
        close_date_raw = item.findtext("cltrBidEndDt") or item.findtext("pbctClsDtm") or ""
        desc = item.findtext("onbidCltrNm") or ""
        notes = item.findtext("pbctCdtnNo") or ""
        
        cltr_area_text = item.findtext("cltrArea") or item.findtext("sqmsArea") or ""
        land_area_text = item.findtext("landSqmsArea") or ""
        bdng_area_text = item.findtext("bdngSqmsArea") or ""
        
        onbid_cltr_no = item.findtext("onbidCltrno") or ""
        pbct_no = item.findtext("pbctNo") or ""
        pbct_cdtn_no = item.findtext("pbctCdtnNo") or ""
        prpt_div_cd = item.findtext("prptDivCd") or ""
        onbid_pbanc_no = item.findtext("onbidPbancNo") or ""
    else:
        cltr_no = item.get("cltrMngNo", "")
        if not cltr_no:
            return None
        address = item.get("lnmAdr") or item.get("roadAdr") or item.get("onbidCltrNm") or "--"
        price = safe_int(item.get("lowstBidPrcIndctCont") or item.get("cltrMnprPrc") or 0)
        appraisal = safe_int(item.get("apslEvlAmt") or item.get("dpslMnprPrc") or 0)
        ptype = item.get("cltrUsgSclsCtgrNm") or item.get("prptDivNm") or "--"
        close_date_raw = item.get("cltrBidEndDt") or item.get("pbctClsDtm") or ""
        desc = item.get("onbidCltrNm") or ""
        notes = item.get("pbctCdtnNo") or ""
        
        cltr_area_text = item.get("cltrArea") or item.get("sqmsArea") or ""
        land_area_text = item.get("landSqmsArea") or ""
        bdng_area_text = item.get("bdngSqmsArea") or ""
        
        onbid_cltr_no = item.get("onbidCltrno", "")
        pbct_no = item.get("pbctNo", "")
        pbct_cdtn_no = item.get("pbctCdtnNo", "")
        prpt_div_cd = item.get("prptDivCd", "")
        onbid_pbanc_no = item.get("onbidPbancNo", "")
    
    ptype_lower = ptype.lower()
    is_etc_asset = (asset_type in ["car", "mvast"]) or any(kw in ptype_lower for kw in ["자동차", "중기", "선박", "항공기", "기계", "기구", "차량", "동산", "유가증권", "물품", "어업권", "광업권"])
    address_lower = address.lower()
    if any(kw in address_lower for kw in ["등록번호:", "차명:", "차대번호:", "원동기형식:"]):
        is_etc_asset = True
        
    current_source = "onbid_etc" if is_etc_asset else "onbid"
    
    if asset_type == "car":
        if ptype == "--" or not any(kw in ptype for kw in ["차량", "운송", "자동차", "선박"]):
            ptype = "차량/운송장비"
    elif asset_type == "mvast":
        if ptype == "--":
            ptype = "기타물품"
            
    close_date = ""
    if close_date_raw and len(close_date_raw) >= 8:
        close_date = f"{close_date_raw[0:4]}-{close_date_raw[4:6]}-{close_date_raw[6:8]}"
        
    text_to_check = f"{address} {desc} {notes}".lower()
    if any(kw in text_to_check for kw in ["낙찰", "매각결정", "종결"]):
        return None
        
    if price <= 0 and appraisal > 0:
        price = appraisal
    if appraisal <= 0 and price > 0:
        appraisal = price
        
    def clean_float(val):
        if not val:
            return 0.0
        try:
            return float(str(val).replace(",", "").strip())
        except ValueError:
            return 0.0
            
    ex_area = clean_float(cltr_area_text)
    ld_area = clean_float(land_area_text)
    bu_area = clean_float(bdng_area_text)
    
    su_area = round(ex_area * 1.35, 2) if ex_area > 0 else 0.0
    if bu_area <= 0:
        bu_area = ex_area
        
    is_lease = (dpsl_cd == "0002")
    detail_info = None
    
    if cltr_no:
        api_detail = fetch_onbid_api_details(service_key, cltr_no, pbct_cdtn_no, asset_type)
        if api_detail and api_detail["success"]:
            detail_info = api_detail
            
    if not detail_info and asset_type == "rlst" and onbid_cltr_no and pbct_no and pbct_cdtn_no and prpt_div_cd and onbid_pbanc_no:
        detail_url = f"https://www.onbid.co.kr/op/cltrpbancinf/cltrdtl/CltrDtlController/mvmnCltrDtl.do?cltrScrnGrpCd=0001&cltrPrptDivCd={prpt_div_cd}&onbidCltrno={onbid_cltr_no}&onbidPbancNo={onbid_pbanc_no}&pbctNo={pbct_no}&pbctCdtnNo={pbct_cdtn_no}"
        web_detail = scrape_onbid_web_details(detail_url, is_lease)
        if web_detail and web_detail["success"]:
            detail_info = web_detail
            
    is_estimated = True
    images = []
    lease_method = None
    lease_term = None
    
    if detail_info:
        is_estimated = False
        images = detail_info["images"]
        lease_method = detail_info["lease_method"]
        lease_term = detail_info["lease_term"]
        
        if detail_info.get("round"):
            round_info = f"{detail_info['round']}회차 인터넷입찰"
        else:
            if detail_info.get("failed_count"):
                try:
                    failed_val = int("".join([c for c in detail_info["failed_count"] if c.isdigit()]))
                    round_info = f"{failed_val + 1}회차 인터넷입찰"
                except Exception:
                    round_info = "1회차 인터넷입찰"
            else:
                round_info = "임대 1회차" if is_lease else "1회차 인터넷입찰"
                
        if detail_info["ptype_detail"]:
            ptype = detail_info["ptype_detail"]
    else:
        round_info = "임대 1회차" if is_lease else "1회차 인터넷입찰"
        
    complex_info = {}
    elementary_school = ""
    recent_deals = []
    
    area_meta = {
        "exclusive_area": ex_area,
        "supply_area": su_area,
        "land_area": ld_area,
        "building_area": bu_area,
        "is_estimated_exclusive": ex_area <= 0,
        "is_estimated_supply": True if ex_area > 0 else False,
        "is_estimated_land": ld_area <= 0,
        "is_estimated_building": bu_area <= 0,
        "complex_info": complex_info,
        "elementary_school": elementary_school,
        "recent_deals": recent_deals,
        "is_estimated": is_estimated,
        "is_lease": is_lease,
        "lease_method": lease_method,
        "lease_term": lease_term,
        "images": images,
        "exclusive_area_estimation_type": "exact"
    }
    
    meta_json = json.dumps(area_meta, ensure_ascii=False)
    final_notes = notes or "검출된 공매 권리 하자 리스크가 없습니다."
    final_notes = final_notes + f"\n\n__METADATA__:{meta_json}__"
    
    lease_prefix = "[임대] " if is_lease else ""
    
    score, grade, rem_days = compute_softscore(
        price=price,
        appraisal=appraisal,
        address=address,
        ptype=ptype,
        close_date_str=close_date,
        desc=desc,
        notes=notes
    )
    
    if grade == "X":
        final_notes = f"⚠️ 치명적 AI 하자 분류! (입찰 비권장) | {final_notes}"
    elif grade == "D":
        final_notes = f"🟡 AI 주의 리스크 검출! (특별 매각조건 등 확인 권장) | {final_notes}"
        
    return {
        "source": current_source,
        "auction_no": cltr_no,
        "address": address,
        "appraised_value": appraisal,
        "minimum_bid": price,
        "ptype": ptype,
        "bidding_date": close_date,
        "round_info": round_info,
        "desc_content": lease_prefix + (desc or "공매 물건 기본 명세입니다."),
        "notes_content": final_notes,
        "link_url": "https://www.onbid.co.kr",
        "grade": grade,
        "score": score,
        "remaining_days": rem_days
    }


def fetch_onbid_data():
    service_key = os.environ.get("ONBID_SERVICE_KEY")
    
    try:
        key_file_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "config", "onbid_key.txt")
        if os.path.exists(key_file_path):
            with open(key_file_path, "r", encoding="utf-8") as f:
                file_key = f.read().strip()
                if file_key:
                    service_key = file_key
    except Exception as key_err:
        print(f"[-] 서비스키 파일 로드 오류: {key_err}")
        
    if not service_key:
        service_key = "8f25b28707d85a7c657d76d8689bacc8e6d3c87ea74de0330b9048bc7c1f1b98"
        
    if "%" in service_key:
        service_key = urllib.parse.unquote(service_key)
        
    api_configs = [
        {"type": "rlst", "url": "http://apis.data.go.kr/B010003/OnbidRlstListSrvc2/getRlstCltrList2"},
        {"type": "car", "url": "http://apis.data.go.kr/B010003/OnbidCarListSrvc2/getCarCltrList2"},
        {"type": "mvast", "url": "http://apis.data.go.kr/B010003/OnbidMvastListSrvc2/getMvastCltrList2"}
    ]
    
    print("Fetching Onbid Real Estate/Car/Mvast data from OpenAPI...")
    raw_items_list = []
    
    today_dt = datetime.date.today()
    end_dt = today_dt + datetime.timedelta(days=30)
    start_ymd = today_dt.strftime("%Y%m%d")
    end_ymd = end_dt.strftime("%Y%m%d")
    
    target_div_codes = ["0002", "0003"]
    dpsl_codes = ["0001", "0002"]
    
    try:
        for config in api_configs:
            asset_type = config["type"]
            rlst_url = config["url"]
            print(f"Fetching Onbid {asset_type} data from OpenAPI...")
            
            for dpsl_cd in dpsl_codes:
                for code in target_div_codes:
                    for page in range(1, 2):
                        params = {
                            "serviceKey": service_key,
                            "numOfRows": 100,
                            "pageNo": page,
                            "dpslDvsCd": dpsl_cd,
                            "pvctTrgtYn": "N",
                            "prptDivCd": code,
                            "returnType": "json",
                            "bidPrdYmdStart": start_ymd,
                            "bidPrdYmdEnd": end_ymd
                        }
                        
                        time.sleep(0.5 + random.random() * 0.5)
                        try:
                            response = requests.get(rlst_url, params=params, timeout=10)
                            if response.status_code == 200:
                                response.encoding = "utf-8"
                                text = response.text
                                items = []
                                total_count = 0
                                
                                if text.strip().startswith("<?xml") or "<response>" in text:
                                    root = ET.fromstring(text)
                                    
                                    header = root.find("header")
                                    if header is None:
                                        cmm_header = root.find("cmmMsgHeader")
                                        if cmm_header is not None:
                                            res_code = cmm_header.findtext("returnReasonCode") or ""
                                            res_msg = cmm_header.findtext("returnAuthMsg") or cmm_header.findtext("errMsg") or ""
                                        else:
                                            res_code = ""
                                            res_msg = ""
                                    else:
                                        res_code = header.findtext("resultCode") if header is not None else ""
                                        res_msg = header.findtext("resultMsg") if header is not None else ""
                                        
                                    if res_code != "00" and res_code != "":
                                        print(f"[DEBUG] Onbid API Response Error: {res_msg} (code: {res_code})")
                                        continue
                                    
                                    body = root.find("body")
                                    if body is not None:
                                        items_node = body.find("items")
                                        if items_node is not None:
                                            items = items_node.findall("item")
                                        total_count_text = body.findtext("totalCount")
                                        if total_count_text:
                                            total_count = safe_int(total_count_text)
                                else:
                                    data = response.json()
                                    header = data.get("response", {}).get("header", {})
                                    if header.get("resultCode") != "00":
                                        print(f"[DEBUG] Onbid API Response Error: {header.get('resultMsg')} (code: {header.get('resultCode')})")
                                        continue
                                        
                                    body = data.get("response", {}).get("body", {})
                                    items = body.get("items", {}).get("item", [])
                                    if isinstance(items, dict):
                                        items = [items]
                                    total_count = safe_int(body.get("totalCount", 0))
                                
                                if not items:
                                    break
                                    
                                for item in items:
                                    raw_items_list.append({
                                        "item": item,
                                        "asset_type": asset_type,
                                        "dpsl_cd": dpsl_cd
                                    })
                            
                            if len(items) == 0 or (page * 100) >= total_count:
                                break
                            else:
                                break
                        except Exception as e:
                            print(f"Error requesting page {page} for code {code}: {e}")
                            break
                            
        import concurrent.futures
        print(f"[*] 총 {len(raw_items_list)}건의 온비드 매물 후보가 수집되었습니다. 병렬 분석을 시작합니다.")
        items_collected = []
        with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
            futures = [executor.submit(process_single_item, raw, service_key) for raw in raw_items_list]
            for idx, fut in enumerate(concurrent.futures.as_completed(futures)):
                try:
                    res = fut.result()
                    if res:
                        items_collected.append(res)
                    if (idx + 1) % 50 == 0 or (idx + 1) == len(raw_items_list):
                        print(f"[+] 온비드 매물 상세 분석 중: {idx + 1}/{len(raw_items_list)}건 완료...")
                except Exception as fut_err:
                    print(f"[-] 개별 온비드 매물 병렬 가공 중 오류 발생: {fut_err}")
                    
        unique_items = []
        seen = set()
        for item in items_collected:
            if item["auction_no"] not in seen:
                seen.add(item["auction_no"])
                unique_items.append(item)
        items_collected = unique_items
        
        debug_sources = {}
        for item in items_collected:
            s = item.get("source")
            debug_sources[s] = debug_sources.get(s, 0) + 1
        print(f"[*] Collected sources: {debug_sources}")
        
        conn = sqlite3.connect(":memory:")
        conn.row_factory = sqlite3.Row
        init_db(conn)

        if items_collected:
            success_count = save_to_db(conn, items_collected)
            log_sync_status(conn, "SUCCESS", success_count)
            print(f"[+] Onbid data synchronized successfully! Total: {success_count} listings.")
            try:
                sync_sqlite_to_supabase(conn)
            except Exception as sync_err:
                print(f"[-] 클라우드 Supabase 동기화 전송 과정에서 오류가 발생했습니다. {sync_err}")
        else:
            raise Exception("API 응답 물건 리스트가 비어있습니다.")
        conn.close()
            
    except Exception as e:
        print(f"[!] Onbid API 수집 프로세스 최종 실패: {e}")
        # 임의의 가상 데이터(시뮬레이션) 폴백 적재 루틴을 전면 차단하여 기존 실데이터를 온전히 보존합니다.


if __name__ == "__main__":
    fetch_onbid_data()
