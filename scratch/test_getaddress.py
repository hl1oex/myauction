# V-World getAddress API 테스트용 스크립트입니다.
import requests
import json

VWORLD_KEY = "D800A359-1931-3017-BDD2-E0E42CA9F4EB"

def test_reverse_geocode(lng, lat):
    url = "http://api.vworld.kr/req/address"
    params = {
        "service": "address",
        "request": "getAddress",
        "version": "2.0",
        "crs": "epsg:4326",
        "point": f"{lng},{lat}",
        "type": "BOTH",
        "format": "json",
        "key": VWORLD_KEY
    }
    try:
        res = requests.get(url, params=params, timeout=5)
        if res.status_code == 200:
            print("Response:")
            print(json.dumps(res.json(), indent=2, ensure_ascii=False))
        else:
            print(f"Status Code: {res.status_code}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    # 테헤란로 322 좌표
    test_reverse_geocode("127.04658240803988", "37.503235619618486")
