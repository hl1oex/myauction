# index.html의 최하단 스크립트 임포트 및 초기화 영역의 위치를 파악하기 위한 스크립트입니다.
def find_script_imports():
    filepath = r"d:\BackUp\OneDrive\AI공부\Real estate auction\index.html"
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
    except Exception as e:
        print(f"Error reading file: {e}")
        return

    lines = content.splitlines()
    matches = []
    
    # </body> 닫기 태그나 스크립트 태그가 밀집된 최하단 영역을 찾습니다.
    # index.html이 9127줄이므로, 9000줄 이후나 </body> 근처를 수색합니다.
    target_idx = -1
    for idx, line in enumerate(lines):
        if "</body>" in line.lower() or "</html>" in line.lower():
            target_idx = idx
            break

    if target_idx != -1:
        start = max(0, target_idx - 100)
        end = min(len(lines), target_idx + 10)
        for c in range(start, end):
            matches.append(f"Line {c+1}: {lines[c]}")
            
        output_path = r"d:\BackUp\OneDrive\AI공부\Real estate auction\scratch\script_imports_result.txt"
        with open(output_path, "w", encoding="utf-8") as f:
            f.write("\n".join(matches))
        print("Script imports section written to scratch/script_imports_result.txt successfully.")
    else:
        print("Body tag close not found.")

if __name__ == "__main__":
    find_script_imports()
