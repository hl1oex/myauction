import os
import json
import requests
import datetime
import xml.etree.ElementTree as ET
import time
import urllib.parse

def fetch_onbid_data():
    # 1. Try to read from environment variable
    service_key = os.environ.get("ONBID_SERVICE_KEY")
    
    # 2. If not in environment, try to read from config/onbid_key.txt (Local Config)
    if not service_key:
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        key_file_path = os.path.join(base_dir, "config", "onbid_key.txt")
        if os.path.exists(key_file_path):
            try:
                with open(key_file_path, "r", encoding="utf-8") as f:
                    service_key = f.read().strip()
                if service_key:
                    print(f"[+] config/onbid_key.txt 파일에서 API 키를 로드했습니다.")
            except Exception as e:
                print(f"[-] API 키 파일 읽기 실패: {e}")
                
    # 3. Fallback to default key if still empty
    if not service_key:
        service_key = "8f25b28707d85a7c657d76d8689bacc8e6d3c87ea74de0330b9048bc7c1f1b98"
        
    # Check if the key needs to be unquoted
    if "%" in service_key:
        service_key = urllib.parse.unquote(service_key)
        
    rlst_url = "http://apis.data.go.kr/B010003/OnbidRlstListSrvc2/getRlstCltrList2"
    mvhcl_url = "http://apis.data.go.kr/B010003/OnbidMvhclListSrvc2/getMvhclCltrList2"
    
    # Fetch Real Estate
    print("Fetching Onbid Real Estate data...")
    rlst_items, rlst_err = fetch_paginated_data(rlst_url, service_key, {"prptDivCd": "0002,0003,0004,0005,0006,0007,0008,0010"})
    print(f"Collected {len(rlst_items)} Real Estate items. (Error: {rlst_err})")
    
    # Fetch Movables/Vehicles
    print("Fetching Onbid Movables/Vehicles data...")
    mvhcl_items, mvhcl_err = fetch_paginated_data(mvhcl_url, service_key, {"prptDivCd": "0002,0003,0004,0005,0006,0007,0008,0010"})
    print(f"Collected {len(mvhcl_items)} Movables/Vehicles items. (Error: {mvhcl_err})")
    
    combined_results = rlst_items + mvhcl_items
    scraper_error = rlst_err or mvhcl_err
    
    # De-duplicate items by cltrMngNo (keep first)
    unique_results = []
    seen_ids = set()
    for item in combined_results:
        item_id = item.get("item_id")
        if item_id and item_id not in seen_ids:
            seen_ids.add(item_id)
            unique_results.append(item)
    combined_results = unique_results

    # Save the output
    output_dir = "input_sources/json"
    os.makedirs(output_dir, exist_ok=True)
    output_file = os.path.join(output_dir, "onbid.json")
    
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(combined_results, f, ensure_ascii=False, indent=2)
        
    print(f"Successfully saved {len(combined_results)} Onbid items to {output_file}.")
    
    # Save a metadata file indicating if the scraper had an error
    meta_file = os.path.join(output_dir, "onbid_meta.json")
    meta_info = {
        "success": len(combined_results) > 0 and not scraper_error,
        "item_count": len(combined_results),
        "error_msg": scraper_error,
        "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    with open(meta_file, "w", encoding="utf-8") as f:
        json.dump(meta_info, f, ensure_ascii=False, indent=2)

def fetch_paginated_data(url, service_key, extra_params):
    page = 1
    items_collected = []
    scraper_error = ""
    
    while page <= 10:  # Fetch up to 10 pages (max 1000 items)
        params = {
            "serviceKey": service_key,
            "numOfRows": 100,
            "pageNo": page,
            "dpslDvsCd": "0001",
            "pvctTrgtYn": "N",
            "_type": "json"
        }
        params.update(extra_params)
        
        try:
            time.sleep(0.1)  # Politeness delay
            response = requests.get(url, params=params, timeout=15)
            if response.status_code != 200:
                scraper_error = f"HTTP Error Status {response.status_code}"
                break
                
            content = response.text.strip()
            if not content:
                break
                
            if content.startswith("{"):
                try:
                    data = response.json()
                    if "response" in data and "header" in data["response"]:
                        result_code = data["response"]["header"].get("resultCode")
                        if result_code != "00":
                            scraper_error = data["response"]["header"].get("resultMsg", "API Error")
                            break
                    
                    body = data.get("response", {}).get("body", {})
                    items = body.get("items", {}).get("item", [])
                    if isinstance(items, dict):
                        items = [items]
                    
                    for item in items:
                        parsed = parse_json_item(item)
                        # Exclude sold/completed items
                        text_to_check = f"{parsed.get('address', '')} {parsed.get('desc', '')} {parsed.get('notes', '')} {parsed.get('item_id', '')}".lower()
                        if any(kw in text_to_check for kw in ["낙찰", "매각결정", "종결"]):
                            continue
                        items_collected.append(parsed)
                        
                    raw_items_count = len(items)
                    total_count = int(body.get("totalCount", 0))
                    if raw_items_count == 0 or (page * 100) >= total_count:
                        break
                except Exception as e:
                    scraper_error = f"JSON parse error: {e}"
                    break
            else:
                try:
                    root = ET.fromstring(response.content)
                    result_code_elem = root.find(".//resultCode")
                    if result_code_elem is not None and result_code_elem.text != "00":
                        msg_elem = root.find(".//resultMsg")
                        scraper_error = msg_elem.text if msg_elem is not None else "API Error"
                        break
                        
                    items = root.findall(".//item")
                    for item in items:
                        parsed = parse_xml_item(item)
                        # Exclude sold/completed items
                        text_to_check = f"{parsed.get('address', '')} {parsed.get('desc', '')} {parsed.get('notes', '')} {parsed.get('item_id', '')}".lower()
                        if any(kw in text_to_check for kw in ["낙찰", "매각결정", "종결"]):
                            continue
                        items_collected.append(parsed)
                        
                    raw_items_count = len(items)
                    total_elem = root.find(".//totalCount")
                    total_count = int(total_elem.text) if total_elem is not None and total_elem.text else 0
                    if raw_items_count == 0 or (page * 100) >= total_count:
                        break
                except Exception as e:
                    scraper_error = f"XML parse error: {e}"
                    break
            
            page += 1
        except Exception as e:
            scraper_error = str(e)
            break
            
    return items_collected, scraper_error

def parse_json_item(item):
    def get_val(keys, default=""):
        if isinstance(keys, str):
            keys = [keys]
        for key in keys:
            val = item.get(key)
            if val is not None and str(val).strip() != "None" and str(val).strip() != "":
                return str(val).strip()
        return default

    address = get_val(["onbidCltrNm", "ONBID_CLTR_NM", "lnmAdr", "LNM_ADR", "roadAdr", "ROAD_ADR"], "주소 미상")

    close_date_raw = get_val(["cltrBidEndDt", "CLTR_BID_END_DT", "pbctClsDtm", "PBCT_CLS_DTM"], "")
    close_date = ""
    if close_date_raw:
        if len(close_date_raw) >= 8 and close_date_raw.isdigit():
            close_date = f"{close_date_raw[0:4]}-{close_date_raw[4:6]}-{close_date_raw[6:8]}"
        else:
            close_date = close_date_raw[:10]

    price_val = get_val(["lowstBidPrcIndctCont", "LOWST_BID_PRC_INDCT_CONT", "cltrMnprPrc", "CLTR_MNPR_PRC"], "0")
    try:
        price = int(price_val)
    except ValueError:
        price = 0

    appraisal_val = get_val(["apslEvlAmt", "APSL_EVL_AMT", "dpslMnprPrc", "DPSL_MNPR_PRC"], "0")
    try:
        appraisal = int(appraisal_val)
    except ValueError:
        appraisal = 0

    ptype = get_val(["cltrUsgSclsCtgrNm", "CLTR_USG_SCLS_CTGR_NM", "cltrUsgMclsCtgrNm", "CLTR_USG_MCLS_CTGR_NM", "prptDivNm", "PRPT_DIV_NM"], "기타")
    desc = get_val(["onbidCltrNm", "ONBID_CLTR_NM", "cltrNm", "CLTR_NM"], "")

    return {
        "item_id": get_val(["cltrMngNo", "CLTR_MNG_NO"], ""),
        "source": "onbid",
        "address": address,
        "price": price,
        "appraisal": appraisal,
        "ptype": ptype,
        "close_date": close_date,
        "docs_ok": "예" if get_val(["docsOk", "DOCS_OK"]) == "Y" else "아니오",
        "desc": desc,
        "notes": get_val(["pbctCdtnNo", "PBCT_CDTN_NO"], "")
    }

def parse_xml_item(item):
    def get_val(tag_names, default=""):
        if isinstance(tag_names, str):
            tag_names = [tag_names]
        for name in tag_names:
            elem = item.find(name)
            if elem is not None and elem.text and elem.text.strip() != "None" and elem.text.strip() != "":
                return elem.text.strip()
        return default

    address = get_val(["onbidCltrNm", "lnmAdr", "roadAdr"], "주소 미상")

    close_date_raw = get_val(["cltrBidEndDt", "pbctClsDtm"], "")
    close_date = ""
    if close_date_raw:
        if len(close_date_raw) >= 8 and close_date_raw.isdigit():
            close_date = f"{close_date_raw[0:4]}-{close_date_raw[4:6]}-{close_date_raw[6:8]}"
        else:
            close_date = close_date_raw[:10]

    price_val = get_val(["lowstBidPrcIndctCont", "cltrMnprPrc"], "0")
    try:
        price = int(price_val)
    except ValueError:
        price = 0

    appraisal_val = get_val(["apslEvlAmt", "dpslMnprPrc"], "0")
    try:
        appraisal = int(appraisal_val)
    except ValueError:
        appraisal = 0

    ptype = get_val(["cltrUsgSclsCtgrNm", "cltrUsgMclsCtgrNm", "prptDivNm"], "기타")
    desc = get_val(["onbidCltrNm", "cltrNm"], "")

    return {
        "item_id": get_val(["cltrMngNo"], ""),
        "source": "onbid",
        "address": address,
        "price": price,
        "appraisal": appraisal,
        "ptype": ptype,
        "close_date": close_date,
        "docs_ok": "예" if get_val(["docsOk"]) == "Y" else "아니오",
        "desc": desc,
        "notes": get_val(["pbctCdtnNo"])
    }

if __name__ == "__main__":
    fetch_onbid_data()
