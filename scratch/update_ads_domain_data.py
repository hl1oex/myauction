# -*- coding: utf-8 -*-
# Supabase DB의 ads 테이블에 남아있는 구 임시 도메인 경로를 공식 도메인으로 일괄 정정하는 파이썬 스크립트입니다.
import urllib.request
import json
import sys

def main():
    # 윈도우 콘솔 UTF-8 출력 보장.
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
        
    url = "https://ubaxyfxcsxsvrryowswb.supabase.co/rest/v1/ads"
    headers = {
        "apikey": "sb_publishable_JrM_2rrvppC105lHndMLkg_x2x0sLUE",
        "Authorization": "Bearer sb_publishable_JrM_2rrvppC105lHndMLkg_x2x0sLUE",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }
    
    # 1. 기존 광고 목록을 조회합니다.
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode('utf-8'))
    except Exception as e:
        print("광고 데이터 조회 실패", e)
        return

    print("=== 기존 광고 데이터 분석 시작 ===")
    
    # 2. 임시 도메인을 포함하는 광고 데이터를 찾아서 공식 도메인으로 수정 패치를 가합니다.
    for ad in data:
        ad_id = ad.get("id")
        link_url = ad.get("link_url") or ""
        image_url = ad.get("image_url") or ""
        
        need_update = False
        update_payload = {}
        
        if "action-b8c75" in link_url:
            new_link = link_url.replace("action-b8c75.web.app", "www.myauction.r-e.kr")
            update_payload["link_url"] = new_link
            need_update = True
            print(f"ID {ad_id}의 link_url 변경 예정: {link_url} -> {new_link}")
            
        if "action-b8c75" in image_url:
            new_image = image_url.replace("action-b8c75.web.app", "www.myauction.r-e.kr")
            update_payload["image_url"] = new_image
            need_update = True
            print(f"ID {ad_id}의 image_url 변경 예정: {image_url} -> {new_image}")
            
        if need_update:
            # 개별 광고 행을 패치 업데이트합니다.
            patch_url = f"https://ubaxyfxcsxsvrryowswb.supabase.co/rest/v1/ads?id=eq.{ad_id}"
            patch_req = urllib.request.Request(
                patch_url,
                data=json.dumps(update_payload).encode('utf-8'),
                headers=headers,
                method="PATCH"
            )
            try:
                with urllib.request.urlopen(patch_req) as patch_resp:
                    print(f"ID {ad_id} 업데이트 성공.")
            except Exception as patch_err:
                print(f"ID {ad_id} 업데이트 실패", patch_err)
                
    print("=== 데이터 도메인 갱신 프로세스 완료 ===")

if __name__ == "__main__":
    main()
