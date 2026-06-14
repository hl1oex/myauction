# -*- coding: utf-8 -*-
# DetailScreen.tsx 파일의 333라인부터 748라인까지를 삭제하는 스크립트입니다.
# Rule 6 준수: 문장 끝에 콜론 사용을 금지합니다.
import os

file_path = r"d:\BackUp\OneDrive\AI공부\Real estate auction\mobile-app\src\screens\DetailScreen.tsx"

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# 1-indexed 라인번호 기준으로 333라인(index 332)부터 748라인(index 747)까지 삭제합니다.
# 파이썬 슬라이싱: index 332부터 747까지 (lines[332:748])
del lines[332:748]

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("라인 삭제를 완료하였습니다.")
