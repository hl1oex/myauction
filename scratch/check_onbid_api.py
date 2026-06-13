# -*- coding: utf-8 -*-
import os
import requests
import datetime
import urllib.parse
import json

def check_api():
    service_key = None
    key_file_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "config", "onbid_key.txt")
    if os.path.exists(key_file_path):
        with open(key_file_path, "r", encoding="utf-8") as f:
            service_key = f.read().strip()
    
    if not service_key:
        service_key = "8f25b28707d85a7c657d76d8689bacc8e6d3c87ea74de0330b9048bc7c1f1b98"

    
    # 30일 이내
    today_dt = datetime.date.today()
    end_dt = today_dt + datetime.timedelta(days=30)
    start_ymd = today_dt.strftime("%Y%m%d")
    end_ymd = end_dt.strftime("%Y%m%d")
    
    api_configs = [
        {"type": "rlst", "url": "http://apis.data.go.kr/B010003/OnbidRlstListSrvc2/getRlstCltrList2"},
        {"type": "car", "url": "http://apis.data.go.kr/B010003/OnbidCarListSrvc2/getCarCltrList2"},
        {"type": "mvast", "url": "http://apis.data.go.kr/B010003/OnbidMvastListSrvc2/getMvastCltrList2"}
    ]
    
    for config in api_configs:
        asset_type = config["type"]
        url = config["url"]
        print(f"\nChecking Onbid {asset_type} API...")
        
        # dpslDvsCd: 0001 (매각), 0002 (임대)
        # prptDivCd: 0002 (국유재산), 0003 (수탁/위임)
        params = {
            "serviceKey": service_key,
            "numOfRows": 10,
            "pageNo": 1,
            "dpslDvsCd": "0001",
            "pvctTrgtYn": "N",
            "prptDivCd": "0002",
            "returnType": "json",
            "bidPrdYmdStart": start_ymd,
            "bidPrdYmdEnd": end_ymd
        }
        
        try:
            res = requests.get(url, params=params, timeout=10)
            print("Status Code:", res.status_code)
            if res.status_code == 200:
                print("Content Length:", len(res.text))
                if res.text.strip().startswith("<?xml") or "<response>" in res.text:
                    print("XML Response (Snippet):", res.text[:200])
                else:
                    data = res.json()
                    response_node = data.get("response", {})
                    header = response_node.get("header", {})
                    body = response_node.get("body", {})
                    print("ResultCode:", header.get("resultCode"))
                    print("ResultMsg:", header.get("resultMsg"))
                    print("TotalCount:", body.get("totalCount"))
                    items = body.get("items", {}).get("item", [])
                    print(f"Items returned: {len(items)}")
                    if items:
                        first_item = items[0]
                        print("First Item Name:", first_item.get("onbidCltrNm"))
                        print("First Item Ptype:", first_item.get("cltrUsgSclsCtgrNm") or first_item.get("prptDivNm"))
            else:
                print("Error Response:", res.text[:200])
        except Exception as e:
            print("Request failed:", e)

if __name__ == "__main__":
    check_api()
