# -*- coding: utf-8 -*-
# 이 스크립트는 프로젝트 내의 모든 PNG 이미지를 찾아 용량을 압축하는 스크립트입니다.
# 파일 이름과 포맷은 그대로 유지하여 코드 변경 없이 전송 용량을 줄입니다.

import os
import sys
from PIL import Image

sys.stdout.reconfigure(encoding='utf-8')

# 압축 대상 디렉토리 정의
TARGET_DIRS = [
    ".",
    "./mobile-app/assets"
]

def compress_png(file_path):
    try:
        old_size = os.path.getsize(file_path)
        
        # 이미지 열기
        img = Image.open(file_path)
        
        # 알파 채널 보존 설정
        save_kwargs = {"optimize": True}
        
        # P 모드(팔레트) 변환 시 알파 채널이 깨질 우려가 있으므로, 투명도가 있는 RGBA인 경우 그대로 optimize 저장
        if img.mode in ("RGBA", "LA") or (img.mode == "P" and "transparency" in img.info):
            img.save(file_path, "PNG", **save_kwargs)
        else:
            # RGB인 경우 팔레트 모드로 변환하여 압축률을 극대화
            img = img.convert("P", palette=Image.ADAPTIVE, colors=256)
            img.save(file_path, "PNG", **save_kwargs)
            
        new_size = os.path.getsize(file_path)
        reduction = old_size - new_size
        percent = (reduction / old_size) * 100 if old_size > 0 else 0
        
        if reduction > 0:
            print(f"[OK] {file_path} 압축 완료. {old_size//1024}KB -> {new_size//1024}KB ({percent:.1f}% 감소)")
        else:
            print(f"[-] {file_path} 용량 변화 없음. 압축 건너뜀.")
    except Exception as e:
        print(f"[ERR] {file_path} 압축 중 오류 발생: {str(e)}")

def main():
    print("[*] 정적 이미지 자산 용량 다이어트 프로세스를 가동합니다.")
    
    for base_dir in TARGET_DIRS:
        if not os.path.exists(base_dir):
            continue
            
        print(f"[*] 대상 폴더 검색 중: {base_dir}")
        for filename in os.listdir(base_dir):
            # 파일이 .png 확장자인 경우에만 압축 가동
            if filename.lower().endswith(".png"):
                # favicon_concept와 같이 백업 목적이거나 임시 생성된 대안 이미지는 제외하고 실제 사용 파일 위주로 압축
                if "favicon_concept" in filename or "favicon_contrasted" in filename:
                    continue
                file_path = os.path.join(base_dir, filename)
                if os.path.isfile(file_path):
                    compress_png(file_path)

if __name__ == "__main__":
    main()
