# -*- coding: utf-8 -*-
# 이 스크립트는 파비콘의 가독성을 높이기 위해 선을 굵게 하거나 어두운 아웃라인을 둘러서
# 브라우저 다크 모드와 라이트 모드 모두에서 선명하게 보이도록 가공하는 스크립트입니다.

import os
import sys
from PIL import Image, ImageFilter, ImageEnhance

sys.stdout.reconfigure(encoding='utf-8')

def add_outline_and_bold(input_path, output_path, mode="normal", outline_width=1):
    try:
        img = Image.open(input_path).convert("RGBA")
        width, height = img.size
        
        # 1. 1차 가공: 배경 투명화 및 실버/화이트 라인 강조
        # 밝기 및 대비 강화
        bright_enhancer = ImageEnhance.Brightness(img)
        img = bright_enhancer.enhance(1.3)
        contrast_enhancer = ImageEnhance.Contrast(img)
        img = contrast_enhancer.enhance(2.5)
        
        pixels = img.load()
        
        # 배경 투명화 마스크 생성 (임계값 50 이하 검은색 제거)
        threshold = 50
        mask = Image.new("L", (width, height), 0)
        mask_pixels = mask.load()
        
        for y in range(height):
            for x in range(width):
                r, g, b, a = pixels[x, y]
                if r > threshold or g > threshold or b > threshold:
                    mask_pixels[x, y] = 255  # 선이 있는 영역
                else:
                    pixels[x, y] = (0, 0, 0, 0)  # 투명화
                    
        # 2. 굵기 조절 (Dilation 효과)
        if mode == "bold":
            # 선 자체를 사방으로 1픽셀씩 확장하여 흰색 선 자체를 두껍게 만듭니다.
            temp_mask = mask.copy()
            temp_mask_pixels = temp_mask.load()
            for y in range(1, height - 1):
                for x in range(1, width - 1):
                    if mask_pixels[x, y] == 0:
                        # 8방향 중 하나라도 흰색이면 자신도 확장합니다.
                        neighbors = [
                            mask_pixels[x-1, y-1], mask_pixels[x, y-1], mask_pixels[x+1, y-1],
                            mask_pixels[x-1, y],                       mask_pixels[x+1, y],
                            mask_pixels[x-1, y+1], mask_pixels[x, y+1], mask_pixels[x+1, y+1]
                        ]
                        if any(n == 255 for n in neighbors):
                            temp_mask_pixels[x, y] = 255
                            pixels[x, y] = (255, 255, 255, 255)  # 확장된 곳을 흰색으로 보강
            mask = temp_mask
            mask_pixels = mask.load()
            
        # 3. 아웃라인(외곽선) 칠하기
        # 선 주위의 투명한 영역 중 경계선을 찾아 검은색(또는 어두운 블루네이비)으로 칠합니다.
        out_img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        out_pixels = out_img.load()
        
        # 기본 화질 복사
        for y in range(height):
            for x in range(width):
                out_pixels[x, y] = pixels[x, y]
                
        # 지정된 두께만큼 외곽에 검은색 아웃라인 추가
        for dist in range(1, outline_width + 1):
            temp_img = out_img.copy()
            temp_pixels = temp_img.load()
            
            for y in range(1, height - 1):
                for x in range(1, width - 1):
                    # 현재 픽셀이 완전히 투명한데 경계에 불투명한 픽셀이 있는 경우
                    _, _, _, cur_a = temp_pixels[x, y]
                    if cur_a == 0:
                        neighbors_a = [
                            temp_pixels[x-1, y-1][3], temp_pixels[x, y-1][3], temp_pixels[x+1, y-1][3],
                            temp_pixels[x-1, y][3],                           temp_pixels[x+1, y][3],
                            temp_pixels[x-1, y+1][3], temp_pixels[x, y+1][3], temp_pixels[x+1, y+1][3]
                        ]
                        if any(a > 0 for a in neighbors_a):
                            # 경계를 명확한 검은색 아웃라인(0, 0, 0, 255)으로 보강하여 선명도 극대화
                            out_pixels[x, y] = (0, 0, 0, 255)
                            
        out_img.save(output_path, "PNG")
        print(f"[OK] 생성 완료: {output_path}")
    except Exception as e:
        print(f"[ERR] 가공 오류: {str(e)}")

def main():
    input_path = r"C:\Users\hl1oe\.gemini\antigravity-ide\brain\8284c596-fdad-4b72-9792-b472c69e906b\favicon_combined_shield_gavel_1781881916779.png"
    output_dir = r"C:\Users\hl1oe\.gemini\antigravity-ide\brain\8284c596-fdad-4b72-9792-b472c69e906b"
    
    if not os.path.exists(input_path):
        print(f"[ERR] 원본 이미지가 존재하지 않습니다: {input_path}")
        return
        
    print("[*] 고시인성 파비콘 대비/두께 강화 세트 가동 중입니다.")
    
    # 1단계: 선명한 흰색 라인 + 얇은 검은색 아웃라인 (1px)
    add_outline_and_bold(input_path, os.path.join(output_dir, "favicon_bold_1.png"), mode="normal", outline_width=1)
    
    # 2단계: 선명한 흰색 라인 + 굵은 검은색 아웃라인 (2px)
    add_outline_and_bold(input_path, os.path.join(output_dir, "favicon_bold_2.png"), mode="normal", outline_width=2)
    
    # 3단계: 흰색 선 자체 볼드화 + 검은색 아웃라인 (1px) (최강 시인성 버전)
    add_outline_and_bold(input_path, os.path.join(output_dir, "favicon_bold_3.png"), mode="bold", outline_width=1)

if __name__ == "__main__":
    main()
