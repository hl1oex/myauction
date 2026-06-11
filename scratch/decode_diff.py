# -*- coding: utf-8 -*-
import sys

def try_decode():
    try:
        with open("git_diff_index.txt", "r", encoding="utf-8") as f:
            content = f.read()
    except Exception as e:
        print("Error reading file:", e)
        return

    # 깨진 한글 복원: utf-8 텍스트 -> cp949 바이트로 인코딩 -> utf-8로 디코딩
    restored_chars = []
    for char in content:
        try:
            # 개별 글자 단위로 시도하여 깨지지 않는 특수문자나 이모지는 그대로 두고, 깨진 한글만 복원
            # 깨진 한글은 주로 cp949 범위 내의 글자들(예: 怨쇨굅, 留ㅻЪ)
            b = char.encode('cp949')
            # 이 바이트들을 모아서 디코딩해야 할 수도 있으므로, 글자 단위보다는 바이트 단위 처리가 나을 수 있으나
            # 원래 UTF-8 바이트들이 CP949 글자로 매핑된 것이므로 글자 단위 변환도 유효할 수 있습니다.
            # 하지만 UTF-8 한 글자는 3바이트이므로, 깨진 글자 2~3개가 합쳐져서 하나의 한글 글자가 됩니다.
            # 따라서 전체 바이트를 구해야 합니다.
        except:
            pass
            
    # 전체를 cp949로 인코딩 후 utf-8로 디코딩하는 방식 (에러는 대체문자로 처리)
    try:
        # cp949로 인코딩하여 원본 바이트 스트림 복원
        raw_bytes = content.encode('cp949', errors='ignore')
        # utf-8로 디코딩하여 한글 복원
        restored = raw_bytes.decode('utf-8', errors='replace')
        
        with open("scratch/restored_git_diff.txt", "w", encoding="utf-8") as out:
            out.write(restored)
        print("Successfully restored diff to scratch/restored_git_diff.txt")
    except Exception as e:
        print("Decode failed:", e)

if __name__ == "__main__":
    try_decode()
