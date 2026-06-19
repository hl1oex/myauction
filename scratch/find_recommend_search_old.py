# old_index.html 내의 모든 '추천' 관련 라인을 정밀 분석하여 상단 추천 검색어의 위치와 마크업을 복원하기 위한 스크립트입니다.
def find_recommendations():
    old_file = r"d:\BackUp\OneDrive\AI공부\Real estate auction\scratch\old_index.html"
    try:
        with open(old_file, "r", encoding="utf-16") as f:
            content = f.read()
    except Exception:
        with open(old_file, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()

    lines = content.splitlines()
    matches = []
    for idx, line in enumerate(lines):
        # 추천, AI, 검색, tag, chip 등 유관 단어 탐색
        # 특히 UI 요소로서 칩 형태(class에 rounded나 border, px, py 등이 포함된)를 위주로 봅니다.
        if "추천" in line or "AI" in line or "검색" in line or "tag" in line.lower() or "chip" in line.lower():
            # 라인 인덱스와 텍스트를 저장합니다.
            matches.append((idx + 1, line.strip()))

    # 결과를 저장할 파일
    out_file = r"d:\BackUp\OneDrive\AI공부\Real estate auction\scratch\old_recommend_lines.txt"
    with open(out_file, "w", encoding="utf-8") as out_f:
        for num, text in matches:
            out_f.write(f"Line {num}: {text}\n")
    print(f"Extraction completed. {len(matches)} lines written to scratch/old_recommend_lines.txt")

if __name__ == "__main__":
    find_recommendations()
