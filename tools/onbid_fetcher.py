import os
import json
import requests
import datetime
import xml.etree.ElementTree as ET

def fetch_onbid_data():
    service_key = os.environ.get("ONBID_SERVICE_KEY", "8f25b28707d85a7c657d76d8689bacc8e6d3c87ea74de0330b9048bc7c1f1b98")
    url = "http://apis.data.go.kr/B010003/OnbidRlstListSrvc2/getRlstCltrList2"
    
    params = {
        "serviceKey": service_key,
        "numOfRows": 100,
        "pageNo": 1,
        "dpslDvsCd": "0001",
        "_type": "json"
    }
    
    combined_results = []
    scraper_error = ""
    
    print("Fetching Onbid public sale data...")
    try:
        response = requests.get(url, params=params, timeout=10)
        print(f"Onbid API response status code: {response.status_code}")
        
        if response.status_code == 200:
            content = response.text.strip()
            if content.startswith("{"):
                try:
                    data = response.json()
                    # Check if error message inside JSON (e.g. invalid key)
                    if "response" in data and "header" in data["response"]:
                        result_code = data["response"]["header"].get("resultCode")
                        if result_code != "00":
                            scraper_error = data["response"]["header"].get("resultMsg", "API Error")
                    
                    items = data.get("response", {}).get("body", {}).get("items", {}).get("item", [])
                    if isinstance(items, dict):
                        items = [items]
                    for item in items:
                        combined_results.append(parse_json_item(item))
                except Exception as e:
                    scraper_error = f"JSON parse error: {e}"
            else:
                try:
                    # XML Response
                    root = ET.fromstring(response.content)
                    # Check for errMsg or resultCode
                    result_code_elem = root.find(".//resultCode")
                    if result_code_elem is not None and result_code_elem.text != "00":
                        msg_elem = root.find(".//resultMsg")
                        scraper_error = msg_elem.text if msg_elem is not None else "API Error"
                        
                    items = root.findall(".//item")
                    for item in items:
                        combined_results.append(parse_xml_item(item))
                except Exception as e:
                    scraper_error = f"XML parse error: {e}"
        else:
            scraper_error = f"HTTP Error Status {response.status_code}"
    except Exception as e:
        scraper_error = str(e)
        print(f"API Request failed: {e}")
        
    # Save the output (No mock fallback data!)
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

def parse_json_item(item):
    return {
        "item_id": str(item.get("cltrMngNo", item.get("CLTR_MNG_NO", ""))),
        "source": "onbid",
        "address": item.get("lnmAdr", item.get("LNM_ADR", item.get("roadAdr", item.get("ROAD_ADR", "주소 미상")))),
        "price": int(item.get("cltrMnprPrc", item.get("CLTR_MNPR_PRC", 0))),
        "appraisal": int(item.get("dpslMnprPrc", item.get("DPSL_MNPR_PRC", 0))),
        "ptype": item.get("prptDivNm", item.get("PRPT_DIV_NM", "기타")),
        "close_date": item.get("pbctClsDtm", item.get("PBCT_CLS_DTM", ""))[:10] if item.get("pbctClsDtm", item.get("PBCT_CLS_DTM", "")) else "",
        "docs_ok": "예" if item.get("docsOk", "N") == "Y" else "아니오",
        "desc": item.get("cltrNm", item.get("CLTR_NM", "")),
        "notes": item.get("pbctCdtnNo", item.get("PBCT_CDTN_NO", ""))
    }

def parse_xml_item(item):
    def get_val(tag_name, default=""):
        elem = item.find(tag_name)
        if elem is not None and elem.text:
            return elem.text.strip()
        return default

    close_date_raw = get_val("pbctClsDtm")
    close_date = close_date_raw[:10] if close_date_raw else ""

    try:
        price = int(get_val("cltrMnprPrc", "0"))
    except ValueError:
        price = 0

    try:
        appraisal = int(get_val("dpslMnprPrc", "0"))
    except ValueError:
        appraisal = 0

    return {
        "item_id": get_val("cltrMngNo"),
        "source": "onbid",
        "address": get_val("lnmAdr", get_val("roadAdr", "주소 미상")),
        "price": price,
        "appraisal": appraisal,
        "ptype": get_val("prptDivNm", "기타"),
        "close_date": close_date,
        "docs_ok": "예" if get_val("docsOk") == "Y" else "아니오",
        "desc": get_val("cltrNm"),
        "notes": get_val("pbctCdtnNo")
    }

if __name__ == "__main__":
    fetch_onbid_data()
