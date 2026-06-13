# -*- coding: utf-8 -*-
# 온비드 웹 상세 페이지의 다양한 파라미터 조합을 테스트하여 크롤링 가능 여부를 확인하는 스크립트입니다.
import sys
import io
import requests
from bs4 import BeautifulSoup

try:
    sys.stdout.reconfigure(encoding='utf-8')
except AttributeError:
    pass

def test_scrape_variants(cltr_mng_no, pbct_no, pbct_cdtn_no=None):
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36"
    }
    
    # 1. 사용자가 준 URL 구조
    base_url = "https://www.onbid.co.kr/op/cltrpbancinf/cltrdtl/CltrDtlController/mvmnCltrDtl.do"
    
    urls = [
        f"{base_url}?cltrMngNo={cltr_mng_no}&pbctNo={pbct_no}",
        f"{base_url}?cltrMngNo={cltr_mng_no.replace('-', '')}&pbctNo={pbct_no}",
    ]
    if pbct_cdtn_no:
        urls.append(f"{base_url}?cltrMngNo={cltr_mng_no}&pbctNo={pbct_no}&pbctCdtnNo={pbct_cdtn_no}")
        urls.append(f"{base_url}?cltrMngNo={cltr_mng_no.replace('-', '')}&pbctNo={pbct_no}&pbctCdtnNo={pbct_cdtn_no}")
        
    for url in urls:
        print(f"Scraping: {url}")
        try:
            res = requests.get(url, headers=headers, timeout=10)
            print("Status Code:", res.status_code)
            if res.status_code == 200:
                soup = BeautifulSoup(res.text, "html.parser")
                title = soup.find("div", class_="title_box01") or soup.find("h3") or soup.find("h2")
                print("Title:", title.text.strip() if title else "Not Found")
                img_tags = soup.find_all("img")
                print(f"Found {len(img_tags)} image tags.")
                for i, img in enumerate(img_tags[:5]):
                    print(f"Img {i}: {img.get('src')}")
                break
        except Exception as e:
            print("Failed:", e)

if __name__ == "__main__":
    # 최근 온비드 물건 (2026-0300-002152, pbctNo=10056561, pbctCdtnNo=5962095)
    test_scrape_variants("2026-0300-002152", "10056561", "5962095")
