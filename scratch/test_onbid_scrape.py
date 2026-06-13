# -*- coding: utf-8 -*-
import sys
import io
import requests
from bs4 import BeautifulSoup

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

def test_scrape(cltr_mng_no, pbct_no):
    url = f"https://www.onbid.co.kr/op/cltrpbancinf/cltrdtl/CltrDtlController/mvmnCltrDtl.do?cltrMngNo={cltr_mng_no}&pbctNo={pbct_no}"
    print(f"Scraping {url}...")
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36"
    }
    
    try:
        res = requests.get(url, headers=headers, timeout=15)
        print("Status Code:", res.status_code)
        if res.status_code == 200:
            soup = BeautifulSoup(res.text, "html.parser")
            
            with open("scratch/onbid_sample.html", "w", encoding="utf-8") as f:
                f.write(soup.prettify())
            print("Saved raw HTML sample to scratch/onbid_sample.html")
            
            # Find specific detail text
            title = soup.find("div", class_="op_detail_title")
            if not title:
                title = soup.find("div", class_="title_box01")
            
            if title:
                print("Title found:", title.text.strip())
            else:
                h1 = soup.find("h1")
                h2 = soup.find("h2")
                h3 = soup.find("h3")
                print("H1:", h1.text.strip() if h1 else None)
                print("H2:", h2.text.strip() if h2 else None)
                print("H3:", h3.text.strip() if h3 else None)
                
            # Find image URLs
            img_tags = soup.find_all("img")
            print(f"Found {len(img_tags)} img tags.")
            for i, img in enumerate(img_tags[:15]):
                src = img.get("src", "")
                alt = img.get("alt", "")
                print(f"Img {i}: src={src}, alt={alt}")
        else:
            print("Error response status:", res.status_code)
    except Exception as e:
        print("Scraping failed:", e)

if __name__ == "__main__":
    # Test with management number cltrMngNo=2013101600218, pbctNo=6012534
    test_scrape("2013101600218", "6012534")
