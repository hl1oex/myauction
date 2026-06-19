# index.html의 메인 자바스크립트 시작 부분과 DOMContentLoaded 이벤트를 분석하기 위한 스크립트입니다.
def find_script_start():
    filepath = r"d:\BackUp\OneDrive\AI공부\Real estate auction\index.html"
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
    except Exception as e:
        print(f"Error reading file: {e}")
        return

    lines = content.splitlines()
    matches = []
    
    # script 태그나 DOMContentLoaded 관련 부분을 수색합니다.
    for idx, line in enumerate(lines):
        if "DOMContentLoaded" in line or "<script>" in line or "loadData" in line:
            # line_number를 구하고 그 주변을 기록합니다.
            matches.append(f"Line {idx+1}: {line.strip()}")
            matches.append("Context:")
            start = max(0, idx - 5)
            end = min(len(lines), idx + 6)
            for c in range(start, end):
                marker = ">>" if c == idx else "  "
                matches.append(f"  {marker} {c+1}: {lines[c]}")
            matches.append("-" * 50)

    output_path = r"d:\BackUp\OneDrive\AI공부\Real estate auction\scratch\script_start_result.txt"
    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(matches))
    print(f"Done. Saved to scratch/script_start_result.txt. Matches: {len(matches)//4}")

if __name__ == "__main__":
    find_script_start()
