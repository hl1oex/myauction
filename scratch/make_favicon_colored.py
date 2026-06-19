# -*- coding: utf-8 -*-
# 이 스크립트는 밝은 배경의 탭바에서 은색/흰색 로고가 묻혀 보이지 않는 문제를 근본적으로 해결하기 위해
# 로고 선의 색상을 진한 로열 블루 또는 딥 블랙으로 색상 치환하여 고시인성 파비콘을 만드는 스크립트입니다.

import os
import sys
from PIL import Image

sys.stdout.reconfigure(encoding='utf-8')

def convert_favicon_color(input_path, output_path, color_rgb):
    try:
        img = Image.open(input_path).convert("RGBA")
        width, height = img.size
        pixels = img.load()
        
        # 새로운 이미지 버퍼 생성
        new_img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        new_pixels = new_img.load()
        
        threshold = 50
        # 8방향 경계선 확장을 통해 선 굵기도 함께 보강합니다.
        # 기존 이미지에서 선이 있는 부분(RGB 값이 임계값 50을 넘는 부분)을 타겟 컬러로 칠합니다.
        for y in range(height):
            for x in range(width):
                r, g, b, a = pixels[x, y]
                if a > 0 and (r > threshold or g > threshold or b > threshold):
                    # 투명도가 있는 선 부분을 타겟 컬러로 치환하고 알파값은 보존(또는 완전 불투명화)합니다.
                    new_pixels[x, y] = (color_rgb[0], color_rgb[1], color_rgb[2], a)
                    
        # 1픽셀 볼드화 처리 (시인성 추가 개선)
        final_img = new_img.copy()
        final_pixels = final_img.load()
        
        for y in range(1, height - 1):
            for x in range(1, width - 1):
                r, g, b, a = new_pixels[x, y]
                if a == 0:
                    # 주변에 색상이 채워진 픽셀이 있다면 확장
                    neighbors = [
                        new_pixels[x-1, y-1][3], new_pixels[x, y-1][3], new_pixels[x+1, y-1][3],
                        new_pixels[x-1, y][3],                           new_pixels[x+1, y][3],
                        new_pixels[x-1, y+1][3], new_pixels[x, y+1][3], new_pixels[x+1, y+1][3]
                    ]
                    if any(alpha > 100 for alpha in neighbors):
                        final_pixels[x, y] = (color_rgb[0], color_rgb[1], color_rgb[2], 255)
                        
        final_img.save(output_path, "PNG")
        print(f"[OK] 생성 완료: {output_path}")
    except Exception as e:
        print(f"[ERR] 색상 가공 오류: {str(e)}")

def main():
    input_path = r"C:\Users\hl1oe\.gemini\antigravity-ide\brain\8284c596-fdad-4b72-9792-b472c69e906b\favicon_combined_shield_gavel_1781881916779.png"
    output_dir = r"C:\Users\hl1oe\.gemini\antigravity-ide\brain\8284c596-fdad-4b72-9792-b472c69e906b"
    
    if not os.path.exists(input_path):
        print(f"[ERR] 원본 이미지가 존재하지 않습니다: {input_path}")
        return
        
    print("[*] 고시인성 컬러 치환 파비콘 생성 프로세스를 가동합니다.")
    
    # 1. 로열 블루 버전 (RGB: 30, 64, 175) - 사이트 메인 컬러 테마와 통일
    convert_favicon_color(input_path, os.path.join(output_dir, "favicon_royalblue.png"), (30, 64, 175))
    
    # 2. 딥 블랙 버전 (RGB: 15, 23, 42) - 최강의 대비 시인성 제공
    convert_favicon_color(input_path, os.path.join(output_dir, "favicon_deepblack.png"), (15, 23, 42))

if __name__ == "__main__":
    main()
