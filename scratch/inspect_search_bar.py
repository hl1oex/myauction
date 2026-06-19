# index.html의 상단 검색바 주변 구조를 분석하기 위한 스크립트입니다.
def inspect_search_bar():
    filepath = r"d:\BackUp\OneDrive\AI공부\Real estate auction\index.html"
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
    except Exception as e:
        print(f"Error reading file: {e}")
        return

    lines = content.splitlines()
    target_idx = -1
    for idx, line in enumerate(lines):
        # 검색어 입력 input 필드의 일반적인 ID나 클래스명을 탐색합니다.
        if "search-input" in line or "search-bar" in line or "placeholder=" in line:
            if "input" in line or "div" in line:
                target_idx = idx
                print(f"Found match at line {idx + 1}: {line}")
                break

    if target_idx != -1:
        # 매칭된 줄 주변 50줄을 출력합니다.
        context_range = range(max(0, target_idx - 25), min(len(lines), target_idx + 25))
        output = []
        for c_idx in context_range:
            marker = ">>" if c_idx == target_idx else "  "
            output.append(f"{marker} {c_idx + 1}: {lines[c_idx]}")
        
        # 파일에 써서 상세 확인합니다.
        output_path = r"d:\BackUp\OneDrive\AI공부\Real estate auction\scratch\inspect_search_result.txt"
        with open(output_path, "w", encoding="utf-8") as out_f:
            out_f.write("\n".join(output))
        print("Detailed search bar context written to scratch/inspect_search_result.txt successfully.")
    else:
        print("Search bar element not found.")

if __name__ == "__main__":
    inspect_search_bar()
