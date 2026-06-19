# old_index.html의 상단 헤더 구조를 분석하여 AI 추천 검색어가 어디에 배치되어 있었는지 확인하는 스크립트입니다.
def inspect_old_header():
    filepath = r"d:\BackUp\OneDrive\AI공부\Real estate auction\scratch\old_index.html"
    try:
        with open(filepath, "r", encoding="utf-16") as f:
            content = f.read()
    except Exception as e:
        print(f"Error reading file with UTF-16: {e}")
        # UTF-8로 시도
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()
        except Exception as e2:
            print(f"Error reading file with UTF-8: {e2}")
            return

    lines = content.splitlines()
    output = []
    
    # 헤더 관련 주요 키워드 탐색 (예: header, logo, 상단, top 등)
    # 또한 AI추천 검색어로 의심되는 키워드를 찾습니다.
    for idx, line in enumerate(lines):
        if "header" in line.lower() or "navbar" in line.lower() or "ai-search" in line.lower() or "추천 검색" in line or "AI 추천" in line:
            # 매칭된 라인 주변을 저장합니다.
            output.append(f"--- Line {idx + 1} ---")
            context_range = range(max(0, idx - 10), min(len(lines), idx + 15))
            for c_idx in context_range:
                marker = ">>" if c_idx == idx else "  "
                output.append(f"{marker} {c_idx + 1}: {lines[c_idx]}")
            output.append("")

    output_path = r"d:\BackUp\OneDrive\AI공부\Real estate auction\scratch\inspect_old_header_result.txt"
    with open(output_path, "w", encoding="utf-8") as out_f:
        out_f.write("\n".join(output))
    print("Old header inspect complete. Written to scratch/inspect_old_header_result.txt successfully.")

if __name__ == "__main__":
    inspect_old_header()
