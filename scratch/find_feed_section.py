# index.html 파일 내에서 properties-container와 center-feed-section 등 중앙 피드 영역의 위치를 파악하기 위한 스크립트입니다.
def find_feed_section():
    filepath = r"d:\BackUp\OneDrive\AI공부\Real estate auction\index.html"
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
    except Exception as e:
        print(f"Error reading file: {e}")
        return

    lines = content.splitlines()
    matches = []
    
    # properties-container, center-feed-section, feed 등의 영문 키워드로 라인을 수집합니다.
    for idx, line in enumerate(lines):
        lower_line = line.lower()
        if "properties-container" in lower_line or "center-feed-section" in lower_line or "main-grid-container" in lower_line or "curation-bar" in lower_line:
            matches.append(f"Line {idx+1}: {line.strip()}")
            
            # 주변 10줄을 덤프해봅니다.
            matches.append("Context:")
            start = max(0, idx - 8)
            end = min(len(lines), idx + 8)
            for c in range(start, end):
                marker = ">>" if c == idx else "  "
                matches.append(f"  {marker} {c+1}: {lines[c]}")
            matches.append("-" * 50)

    output_path = r"d:\BackUp\OneDrive\AI공부\Real estate auction\scratch\feed_section_result.txt"
    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(matches))
    print(f"Done. Saved to scratch/feed_section_result.txt. Total matches: {len(matches)//4}")

if __name__ == "__main__":
    find_feed_section()
