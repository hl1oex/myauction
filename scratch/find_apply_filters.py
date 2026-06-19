# index.html의 applyFilters 함수 구현과 내부 정렬/필터링 조건식을 정밀 분석하기 위한 스크립트입니다.
def find_apply_filters():
    filepath = r"d:\BackUp\OneDrive\AI공부\Real estate auction\index.html"
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
    except Exception as e:
        print(f"Error reading file: {e}")
        return

    lines = content.splitlines()
    matches = []
    
    # applyFilters 함수 선언을 탐색합니다.
    target_idx = -1
    for idx, line in enumerate(lines):
        if "function applyFilters(" in line:
            target_idx = idx
            break

    if target_idx != -1:
        # 함수 주변 100줄을 추출합니다.
        start = max(0, target_idx - 10)
        end = min(len(lines), target_idx + 120)
        for c in range(start, end):
            matches.append(f"Line {c+1}: {lines[c]}")
            
        output_path = r"d:\BackUp\OneDrive\AI공부\Real estate auction\scratch\apply_filters_result.txt"
        with open(output_path, "w", encoding="utf-8") as f:
            f.write("\n".join(matches))
        print("applyFilters section written to scratch/apply_filters_result.txt successfully.")
    else:
        print("applyFilters function not found.")

if __name__ == "__main__":
    find_apply_filters()
