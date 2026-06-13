# -*- coding: utf-8 -*-
# 온비드 상세 HTML 디버그 파일에서 모든 이미지 태그를 추출하여 출력하는 스크립트입니다.
import sys
from bs4 import BeautifulSoup

try:
    sys.stdout.reconfigure(encoding='utf-8')
except AttributeError:
    pass

def find_imgs():
    with open("scratch/onbid_detail_debug.html", "r", encoding="utf-8") as f:
        html = f.read()
    
    soup = BeautifulSoup(html, "html.parser")
    img_tags = soup.find_all("img")
    print(f"Total img tags: {len(img_tags)}")
    for i, img in enumerate(img_tags):
        src = img.get("src", "")
        alt = img.get("alt", "")
        print(f"[{i}] src: {src} | alt: {alt}")

if __name__ == "__main__":
    find_imgs()
