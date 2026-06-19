# index.html의 renderProperties 함수 내부에서 매물 카드가 동적으로 그려지는 부분을 찾아 AI 뱃지 UI 연동 지점을 분석하기 위한 스크립트입니다.
def find_render_properties():
    filepath = r"d:\BackUp\OneDrive\AI공부\Real estate auction\index.html"
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
    except Exception as e:
        print(f"Error: {e}")
        return

    lines = content.splitlines()
    matches = []
    
    target_idx = -1
    for idx, line in enumerate(lines):
        if "function renderProperties(" in line:
            target_idx = idx
            break

    if target_idx != -1:
        # renderProperties 함수 시작부터 100줄을 추출합니다.
        start = target_idx
        end = min(len(lines), target_idx + 150)
        for c in range(start, end):
            matches.append(f"Line {c+1}: {lines[c]}")
            
        output_path = r"d:\BackUp\OneDrive\AI공부\Real estate auction\scratch\render_properties_result.txt"
        with open(output_path, "w", encoding="utf-8") as f:
            f.write("\n".join(matches))
        print("renderProperties section written successfully.")
    else:
        print("renderProperties function not found.")

if __name__ == "__main__":
    find_render_properties()
