# make_favicon_contrasted.py
# 파비콘의 대비와 밝기를 3단계로 조절하여 탭바에서 선명하게 보이도록 고시인성 투명 PNG를 생성하는 스크립트입니다.

import os
from PIL import Image, ImageEnhance

def generate_step_favicons():
    # 원본 방패+입찰봉+집 조합 이미지 경로
    input_path = r"C:\Users\hl1oe\.gemini\antigravity-ide\brain\8284c596-fdad-4b72-9792-b472c69e906b\favicon_combined_shield_gavel_1781881916779.png"
    output_dir = r"C:\Users\hl1oe\.gemini\antigravity-ide\brain\8284c596-fdad-4b72-9792-b472c69e906b"
    
    if not os.path.exists(input_path):
        print(f"[ERROR] 원본 이미지가 없습니다: {input_path}")
        return

    # 대비 조절 배율 정의 (1단계: 선명도 개선, 2단계: 고대비 실버, 3단계: 극대비 백은색 라인)
    steps = [
        {"factor": 1.5, "name": "favicon_contrasted_1.png", "desc": "1단계 (대비 1.5배 강화)"},
        {"factor": 2.2, "name": "favicon_contrasted_2.png", "desc": "2단계 (대비 2.2배 고시인성)"},
        {"factor": 3.5, "name": "favicon_contrasted_3.png", "desc": "3단계 (대비 3.5배 극대비 화이트실버)"}
    ]

    for step in steps:
        img = Image.open(input_path).convert("RGBA")
        
        # 1. 밝기(Brightness) 약간 상향하여 어두운 회색 선을 밝게 보정
        bright_enhancer = ImageEnhance.Brightness(img)
        img = bright_enhancer.enhance(1.2)
        
        # 2. 대비(Contrast) 강화를 통해 선의 경계를 뚜렷하게 보정
        contrast_enhancer = ImageEnhance.Contrast(img)
        img = contrast_enhancer.enhance(step["factor"])
        
        datas = img.getdata()
        newData = []
        
        # 검은색 배경 투명화 처리 (임계값 50 이하)
        threshold = 50
        for item in datas:
            r, g, b, a = item
            if r < threshold and g < threshold and b < threshold:
                newData.append((255, 255, 255, 0))  # 배경 완전 투명화
            else:
                # 색상값 보강을 위해 완전 불투명 처리
                newData.append((r, g, b, 255))
                
        img.putdata(newData)
        
        # 타겟 경로에 저장
        dest_path = os.path.join(output_dir, step["name"])
        img.save(dest_path, "PNG")
        print(f"[OK] {step['desc']} 생성 성공: {dest_path}")

if __name__ == "__main__":
    generate_step_favicons()
