# index.html에서 loadDetailView의 위치를 찾습니다.
import os

def find_load_detail():
    filepath = r"d:\BackUp\OneDrive\AI공부\Real estate auction\index.html"
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
    except Exception as e:
        print(f"Error: {e}")
        return

    lines = content.splitlines()
    matches = []
    
    for idx, line in enumerate(lines):
        if "function loadDetailView" in line or "loadDetailView" in line:
            matches.append(f"Line {idx+1}: {line.strip()}")
            
    print(f"Found {len(matches)} matches.")
    for m in matches[:30]:
        print(m)

if __name__ == "__main__":
    find_load_detail()
