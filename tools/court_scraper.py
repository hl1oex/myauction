import os
import re
import json
import time
import random
import datetime
import requests
import urllib.parse
import sys
from bs4 import BeautifulSoup

# Setup paths for reliable imports
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(base_dir)
sys.path.append(os.path.join(base_dir, "src"))

from hardfilter import evaluate_hardfilter, load_rules

# Static nationwide court codes in Korea
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

def get_naver_search_details(case_no):
    """
    Search Naver for rights analysis or blog posts matching the case number.
    Extracts snippets to provide internet analysis notes.
    """
    if not case_no:
        return ""
    query = f"{case_no} 경매"
    search_url = f"https://search.naver.com/search.naver?query={urllib.parse.quote(query)}"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
    }
    try:
        # Prevent quick successive requests to avoid block
        time.sleep(0.3 + random.random() * 0.3)
        r = requests.get(search_url, headers=headers, timeout=5)
        if r.status_code == 200:
            soup = BeautifulSoup(r.text, 'html.parser')
            snippets = []
            for el in soup.select(".api_txt_lines, .dsc_txt, .total_dsc, .sds-comps-text"):
                txt = el.get_text().strip()
                if txt and len(txt) > 20 and txt not in snippets:
                    snippets.append(txt)
                    if len(snippets) >= 2:
                        break
            if snippets:
                return " | ".join(snippets)
    except Exception as e:
        print(f"Naver search failed for {case_no}: {e}")
    return ""

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
            raise ConnectionError(f"웜업 GET 페이지 접속 실패 (상태코드: {r_warmup.status_code})")
            
        # Build query months (12-month window for upcoming 1 year)
        query_months = []
        today = datetime.date.today()
        for i in range(12):
            y = today.year
            m = today.month + i
            if m > 12:
                y += (m - 1) // 12
                m = (m - 1) % 12 + 1
            query_months.append(f"{y}{m:02d}")
            
        sessions_list = []
        # Loop through all 3 months and all 57 courts
        for ymd in query_months:
            for court_code, court_name in COURT_CODES.items():
                print(f"Fetching scheduled sessions for {ymd} at {court_name} ({court_code})...")
                payload = {
                    "dma_srchDspslPbanc": {
                        "srchYmd": ymd,
                        "cortOfcCd": court_code,
                        "bidDvsCd": "000331",
                        "srchBtnYn": "Y"
                    }
                }
                
                # Small delay between court queries to be polite
                time.sleep(0.05 + random.random() * 0.1)
                
                try:
                    r = session.post(post_url, json=payload, headers=headers, timeout=10)
                    r.encoding = 'utf-8'
                    if r.status_code == 200:
                        data = r.json()
                        found_sessions = data.get("data", {}).get("dlt_rletDspslPbancLst", [])
                        if found_sessions:
                            print(f"  Found {len(found_sessions)} sessions.")
                            sessions_list.extend(found_sessions)
                except Exception as ex:
                    print(f"  Error fetching sessions for {court_code} in {ymd}: {ex}")
                    
        # Now, query details for each session to extract real properties
        print(f"Querying details for {len(sessions_list)} sessions...")
        
        # Load Hard Filter rules once to avoid repeating loading file
        rules = load_rules()
        
        for idx, target in enumerate(sessions_list):
            print(f"[{idx+1}/{len(sessions_list)}] Querying session ID: {target.get('dspslRealId')}")
            
            detail_payload = {
                "dma_srchGnrlPbanc": {
                    "dspslRealId": target.get("dspslRealId"),
                    "cortOfcCd": target.get("cortOfcCd"),
                    "jdbnCd": target.get("jdbnCd"),
                    "dspslDxdyYmd": target.get("dspslDxdyYmd")
                }
            }
            
            time.sleep(1.0 + random.random() * 0.5)
            
            r_detail = None
            for attempt in range(3):
                try:
                    r_detail = session.post(detail_url, json=detail_payload, headers=headers, timeout=15)
                    r_detail.encoding = 'utf-8'
                    break
                except Exception as ex:
                    print(f"  Attempt {attempt+1} failed for session {target.get('dspslRealId')}: {ex}")
                    time.sleep(2.0 + random.random())
            
            if r_detail is not None and r_detail.status_code == 200:
                detail_data = r_detail.json()
                result = detail_data.get("data", {}).get("result", {})
                
                raw_items = []
                # Add regular items
                for item in result.get("dspslPbanc", {}).get("pbancInfo", {}).get("lst", []):
                    raw_items.append(item)
                # Add corrected items
                for item in result.get("crrctPbancLst", []):
                    raw_items.append(item)
                # Add withdrawn items
                for item in result.get("rtrcnPbancLst", []):
                    raw_items.append(item)
                    
                for raw_item in raw_items:
                    cs_no = clean_html(raw_item.get("csNo", ""))
                    if not cs_no:
                        continue
                        
                    raw_addr = raw_item.get("st", "")
                    address = clean_address(raw_addr)
                    
                    appraisal = extract_price(raw_item.get("aeeEvlAmt", "0"))
                    price = extract_price(raw_item.get("lwsDspslPrc", "0"))
                    ptype = raw_item.get("dspslUsgNm", "") or raw_item.get("usgNm", "기타")
                    
                    close_date_raw = target.get("dspslDxdyYmd", "")
                    close_date = ""
                    if close_date_raw and len(close_date_raw) == 8:
                        close_date = f"{close_date_raw[:4]}-{close_date_raw[4:6]}-{close_date_raw[6:]}"
                        
                    desc = clean_html(raw_item.get("crrctCtt", "") or raw_item.get("crrctPbancCtt", ""))
                    notes = clean_html(raw_item.get("dspslRmk", ""))
                    
                    # Exclude sold/completed items
                    text_to_check = f"{address} {desc} {notes} {raw_item.get('dspslStatNm', '')}".lower()
                    if any(kw in text_to_check for kw in ["낙찰", "매각결정", "종결"]):
                        print(f"  Item {cs_no} is already sold/completed. Skipping.")
                        continue

                    # Optimization: Only search Naver for items that PASS the hard filter!
                    is_passed, _ = evaluate_hardfilter({"address": address, "desc": desc, "notes": notes}, rules)
                    
                    search_info = ""
                    if is_passed:
                        print(f"  Item {cs_no} passed hard filter. Fetching Naver Search info...")
                        search_info = get_naver_search_details(cs_no)
                        if search_info:
                            print("    Successfully fetched Naver Search info.")
                            notes = (notes + f" [인터넷 분석 정보: {search_info}]").strip()
                    else:
                        print(f"  Item {cs_no} failed hard filter. Skipping Naver Search query.")
                    
                    combined_results.append({
                        "item_id": cs_no,
                        "source": "court",
                        "address": address,
                        "price": price,
                        "appraisal": appraisal,
                        "ptype": ptype,
                        "close_date": close_date,
                        "docs_ok": "예",
                        "desc": desc,
                        "notes": notes
                    })
            else:
                if r_detail is not None:
                    print(f"Session {target.get('dspslRealId')} detail API failed (status: {r_detail.status_code})")
                else:
                    print(f"Session {target.get('dspslRealId')} detail API failed (Connection error)")
                
    except Exception as e:
        scraper_error = str(e)
        print(f"Scraper failed with error: {e}")

    output_dir = "input_sources/json"
    os.makedirs(output_dir, exist_ok=True)
    output_file = os.path.join(output_dir, "court.json")
    
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(combined_results, f, ensure_ascii=False, indent=2)
        
    print(f"Successfully saved {len(combined_results)} court items to {output_file}.")
    
    meta_file = os.path.join(output_dir, "court_meta.json")
    meta_info = {
        "success": len(combined_results) > 0 and not scraper_error,
        "item_count": len(combined_results),
        "error_msg": scraper_error,
        "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    with open(meta_file, "w", encoding="utf-8") as f:
        json.dump(meta_info, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    scrape_court_data()
