# index.html의 cardHtml 템플릿 리터럴의 하단 부분(3520~3600 라인)을 분석하여 AI 지표 뱃지의 올바른 주입 위치를 확인하기 위한 스크립트입니다.
def find_card_end():
    filepath = r"d:\BackUp\OneDrive\AI공부\Real estate auction\index.html"
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
    except Exception as e:
        print(f"Error: {e}")
        return

    lines = content.splitlines()
    matches = []
    
    start = 3520
    end = min(len(lines), 3600)
    for c in range(start, end):
        matches.append(f"Line {c+1}: {lines[c]}")
        
    output_path = r"d:\BackUp\OneDrive\AI공부\Real estate auction\scratch\card_html_end_result.txt"
    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(matches))
    print("Card end section written successfully.")

if __name__ == "__main__":
    find_card_end()
