# -*- coding: utf-8 -*-
# 건축HUB API getBrTitleInfo 및 getBrFlrOulnInfo 작동 여부를 테스트하는 스크립트입니다.
import requests
import xml.etree.ElementTree as ET
import json

SERVICE_KEY = "2cbbe1ae9e7e239e9bcbe588e79888fbfba31b8f44c65a1f848d7aeb8755059d"
# 세종특별자치시 해밀동 701의 PNU에서 추출한 정보
# PNU: 3611011600107010000 -> sigunguCd: 36110, bjdongCd: 11600, platGbCd: 0, bun: 0701, ji: 0000
params = {
    "serviceKey": SERVICE_KEY,
    "sigunguCd": "36110",
    "bjdongCd": "11600",
    "platGbCd": "0",
    "bun": "0701",
    "ji": "0000",
    "numOfRows": "10",
    "pageNo": "1"
}

def test_hub_title():
    # BldRgstHubService 엔드포인트 테스트
    url = "http://apis.data.go.kr/1613000/BldRgstHubService/getBrTitleInfo"
    try:
        res = requests.get(url, params=params, timeout=8)
        print(f"Title Info Status: {res.status_code}")
        if res.status_code == 200:
            print("Response Sample (first 500 chars):")
            print(res.text[:500])
            root = ET.fromstring(res.text)
            result_code = root.find(".//resultCode")
            result_msg = root.find(".//resultMsg")
            print(f"Result Code: {result_code.text if result_code is not None else 'N/A'}")
            print(f"Result Msg: {result_msg.text if result_msg is not None else 'N/A'}")
        else:
            print(res.text)
    except Exception as e:
        print(f"Error: {e}")

def test_hub_floors():
    url = "http://apis.data.go.kr/1613000/BldRgstHubService/getBrFlrOulnInfo"
    try:
        res = requests.get(url, params=params, timeout=8)
        print(f"\nFloor Info Status: {res.status_code}")
        if res.status_code == 200:
            print("Response Sample (first 500 chars):")
            print(res.text[:500])
        else:
            print(res.text)
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_hub_title()
    test_hub_floors()
