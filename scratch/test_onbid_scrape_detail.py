# -*- coding: utf-8 -*-
# 온비드 실제 상세페이지 URL을 호출하여 실사진 및 상세 정보(면적, 조건, 회차, 임대방식 등)를 파싱하는 테스트 스크립트입니다.
import sys
import io
import requests
from bs4 import BeautifulSoup

try:
    sys.stdout.reconfigure(encoding='utf-8')
except AttributeError:
    pass

def scrape_onbid_detail(url):
    print(f"Scraping: {url}")
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
        "Referer": "https://www.onbid.co.kr/op/cltrpbancinf/toppagemng/unfsrch/UnfSrchController/mvmnUnfSrchClg.do"
    }
    
    try:
        res = requests.get(url, headers=headers, timeout=15)
        print("Status Code:", res.status_code)
        if res.status_code == 200:
            soup = BeautifulSoup(res.text, "html.parser")
            
            # HTML 저장해서 확인해보기 위함
            with open("scratch/onbid_detail_debug.html", "w", encoding="utf-8") as f:
                f.write(soup.prettify())
            print("[+] Saved HTML to scratch/onbid_detail_debug.html")
            
            # 1. 사진(이미지) 목록 추출하기
            # 온비드 상세페이지의 갤러리나 슬라이더에서 실제 이미지 소스를 찾습니다.
            # 보통 thumbnail 이미지들이나 큰 이미지들이 img 태그의 특정 alt나 src 경로를 가집니다.
            images = []
            img_tags = soup.find_all("img")
            for img in img_tags:
                src = img.get("src", "")
                alt = img.get("alt", "")
                # 온비드의 실제 물건 사진은 보통 '/cm/file/fileDownload.do' 또는 특정 이미지 업로드 경로를 가집니다.
                if "/cm/file/fileDownload.do" in src or "fileMngNo" in src:
                    full_url = src
                    if not src.startswith("http"):
                        full_url = "https://www.onbid.co.kr" + src
                    if full_url not in images:
                        images.append(full_url)
            print(f"[+] Found {len(images)} property images:")
            for img in images:
                print(" -", img)
                
            # 2. 상세 정보 동적 추출하기 (재산유형, 면적, 회차, 임대방식, 임대기간 등)
            # PC 컨테이너와 모바일 컨테이너 모두 검색
            def get_detail_val(label_text):
                # 웅담리 페이지의 라벨 매칭을 위해 tit01, tit02 등을 찾습니다.
                for span in soup.find_all(class_=["tit01", "tit02"]):
                    if label_text in span.text:
                        # 부모 요소를 찾고 그 다음에 있는 txt_box01 형제 노드를 찾습니다.
                        parent = span.find_parent(class_=["tit_box", "tit_box01", "tit_box02"])
                        if parent:
                            sibling = parent.find_next_sibling(class_="txt_box01")
                            if sibling:
                                return sibling.text.strip().replace("\n", " ").replace("  ", " ")
                        # 부모 아이템 단위에서 찾기
                        item = span.closest(".item") if hasattr(span, "closest") else span.find_parent(class_="item")
                        if item:
                            val_box = item.find(class_="txt_box01")
                            if val_box:
                                return val_box.text.strip().replace("\n", " ").replace("  ", " ")
                return None
            
            print("\n--- Extracted Values ---")
            print("재산유형:", get_detail_val("재산유형"))
            print("입찰방식:", get_detail_val("입찰방식"))
            print("임대방식:", get_detail_val("임대방식"))
            print("임대기간:", get_detail_val("임대기간"))
            print("회차:", get_detail_val("회차"))
            print("유찰횟수:", get_detail_val("유찰횟수"))
            
        else:
            print("[-] HTTP Error Status:", res.status_code)
    except Exception as e:
        print("[-] Scraping failed:", e)

if __name__ == "__main__":
    # 웅담리 실제 온비드 상세페이지 URL
    target_url = "https://www.onbid.co.kr/op/cltrpbancinf/cltrdtl/CltrDtlController/mvmnCltrDtl.do?cltrScrnGrpCd=0001&cltrPrptDivCd=0010&onbidCltrno=1643439&onbidPbancNo=889390&pbctNo=10065475&pbctCdtnNo=6012534"
    scrape_onbid_detail(target_url)
