import os
import sys
import requests
import urllib.parse

# 윈도우 powershell에서 UTF-8 출력을 깨지지 않게 하기 위함
try:
    sys.stdout.reconfigure(encoding='utf-8')
except AttributeError:
    pass

def test_api():
    service_key = "8f25b28707d85a7c657d76d8689bacc8e6d3c87ea74de0330b9048bc7c1f1b98"
    
    key_file_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "config", "onbid_key.txt")
    if os.path.exists(key_file_path):
        with open(key_file_path, "r", encoding="utf-8") as f:
            file_key = f.read().strip()
            if file_key:
                service_key = file_key
    
    unquoted_key = urllib.parse.unquote(service_key)
    rlst_url = "http://apis.data.go.kr/B010003/OnbidRlstListSrvc2/getRlstCltrList2"
    
    params = {
        "serviceKey": unquoted_key,
        "numOfRows": 10,
        "pageNo": 1,
        "dpslDvsCd": "0001",
        "pvctTrgtYn": "N",
        "prptDivCd": "0002",
        "returnType": "json"
    }
    
    try:
        res = requests.get(rlst_url, params=params, timeout=10)
        print("Status Code:", res.status_code)
        
        print("\n--- Try UTF-8 Decode (replace) ---")
        utf8_text = res.content.decode('utf-8', errors='replace')
        print(utf8_text[:1200])

        print("\n--- Try CP949 Decode (replace) ---")
        cp949_text = res.content.decode('cp949', errors='replace')
        print(cp949_text[:1200])

        print("\n--- Try EUC-KR Decode (replace) ---")
        euc_text = res.content.decode('euc-kr', errors='replace')
        print(euc_text[:1200])

    except Exception as e:
        print("Request failed:", e)

if __name__ == "__main__":
    test_api()
