# make_favicon_transparent.py
# 생성된 파비콘 이미지의 검은색 배경(안쪽 및 바깥쪽)을 투명 알파 채널로 변경하여 favicon.png 파일로 저장하는 스크립트입니다.

import os
from PIL import Image

def process_favicon():
    # 입력 이미지 경로
    input_path = r"C:\Users\hl1oe\.gemini\antigravity-ide\brain\8284c596-fdad-4b72-9792-b472c69e906b\favicon_combined_shield_gavel_1781881916779.png"
    
    # 출력 이미지 경로 (루트 및 모바일 에셋, 모바일 빌드 에셋 등 다중 동기화 대상)
    output_root = r"d:\BackUp\OneDrive\AI공부\Real estate auction\favicon.png"
    output_mobile = r"d:\BackUp\OneDrive\AI공부\Real estate auction\mobile-app\assets\favicon.png"
    
    if not os.path.exists(input_path):
        print(f"[ERROR] 입력 파일이 존재하지 않습니다: {input_path}")
        return

    # 이미지 열기 및 RGBA 변환
    img = Image.open(input_path).convert("RGBA")
    datas = img.getdata()

    newData = []
    # 어두운 픽셀(R, G, B가 모두 45 이하인 검은색 배경 영역)을 완전 투명하게 전환합니다.
    threshold = 45
    for item in datas:
        r, g, b, a = item
        if r < threshold and g < threshold and b < threshold:
            newData.append((255, 255, 255, 0))  # 투명 채널로 교체
        else:
            # 실버 테두리 및 내부 음영 대비를 위해 선명도를 유지합니다.
            newData.append((r, g, b, 255))

    img.putdata(newData)
    
    # 루트 폴더에 저장
    img.save(output_root, "PNG")
    print(f"[OK] 루트 favicon.png 저장 성공: {output_root}")
    
    # 모바일 앱 에셋 폴더에 저장
    os.makedirs(os.path.dirname(output_mobile), exist_ok=True)
    img.save(output_mobile, "PNG")
    print(f"[OK] 모바일 favicon.png 저장 성공: {output_mobile}")

if __name__ == "__main__":
    process_favicon()
