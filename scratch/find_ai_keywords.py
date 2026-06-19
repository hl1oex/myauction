# old_index.html에서 AI 추천 검색어 관련 UI와 스크립트를 찾기 위한 분석 스크립트입니다.
import re

def search_keywords():
    filepath = r"d:\BackUp\OneDrive\AI공부\Real estate auction\scratch\old_index.html"
    encodings = ["utf-16", "utf-8", "cp949", "utf-16-le", "utf-16-be"]
    content = None
    for enc in encodings:
        try:
            with open(filepath, "r", encoding=enc) as f:
                content = f.read()
                print(f"Successfully read with {enc} encoding.")
                break
        except Exception as e:
            continue

    if not content:
        print("Failed to read the file.")
        return

    output_lines = []
    lines = content.splitlines()
    for idx, line in enumerate(lines):
        # AI 추천 검색어 관련 텍스트나 'recommend', 'ai-search-tags', 'tag' 등이 있는 부분을 탐색합니다.
        if "AI" in line or "추천" in line or "tag" in line or "recommend" in line or "검색" in line:
            context_range = range(max(0, idx - 5), min(len(lines), idx + 6))
            output_lines.append(f"--- Line {idx + 1} ---")
            for c_idx in context_range:
                marker = ">>" if c_idx == idx else "  "
                output_lines.append(f"{marker} {c_idx + 1}: {lines[c_idx]}")
            output_lines.append("")

    # 결과를 텍스트 파일에 안전하게 utf-8로 저장합니다.
    output_path = r"d:\BackUp\OneDrive\AI공부\Real estate auction\scratch\ai_keywords_result.txt"
    try:
        with open(output_path, "w", encoding="utf-8") as out_f:
            out_f.write("\n".join(output_lines))
        print("Results written to scratch/ai_keywords_result.txt successfully.")
    except Exception as e:
        print(f"Error writing output file: {e}")

if __name__ == "__main__":
    search_keywords()
