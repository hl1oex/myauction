# index.html의 applyFilters 함수 후반부(3170~3300 라인)를 분석하여 정확한 삽입 위치를 찾기 위한 스크립트입니다.
def find_end_section():
    filepath = r"d:\BackUp\OneDrive\AI공부\Real estate auction\index.html"
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
    except Exception as e:
        print(f"Error: {e}")
        return

    lines = content.splitlines()
    matches = []
    
    start = 3170
    end = min(len(lines), 3300)
    for c in range(start, end):
        matches.append(f"Line {c+1}: {lines[c]}")
        
    output_path = r"d:\BackUp\OneDrive\AI공부\Real estate auction\scratch\apply_filters_end_result.txt"
    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(matches))
    print("Function end section written successfully.")

if __name__ == "__main__":
    find_end_section()
