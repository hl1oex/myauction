# checklist.md와 context-notes.md 파일에서 '검색어'나 '추천' 관련 기재 사항을 추출하기 위한 분석 스크립트입니다.
def find_notes():
    files = [
        r"d:\BackUp\OneDrive\AI공부\Real estate auction\checklist.md",
        r"d:\BackUp\OneDrive\AI공부\Real estate auction\context-notes.md",
        r"d:\BackUp\OneDrive\AI공부\Real estate auction\architecture.md"
    ]
    
    matches = []
    for filepath in files:
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()
        except Exception:
            try:
                with open(filepath, "r", encoding="cp949", errors="ignore") as f:
                    content = f.read()
            except Exception as e:
                print(f"Error reading {filepath}: {e}")
                continue
                
        lines = content.splitlines()
        for idx, line in enumerate(lines):
            # '추천'이나 '검색' 등의 유관 텍스트 필터링
            if "추천" in line or "검색" in line or "tag" in line.lower() or "chip" in line.lower() or "ai" in line.lower():
                matches.append(f"File: {filepath.split('\\')[-1]} | Line {idx+1}: {line.strip()}")
                
    output_path = r"d:\BackUp\OneDrive\AI공부\Real estate auction\scratch\checklist_search_result.txt"
    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(matches))
    print(f"Extraction complete. Found {len(matches)} lines. Saved to scratch/checklist_search_result.txt")

if __name__ == "__main__":
    find_notes()
