# -*- coding: utf-8 -*-
import re

def main():
    files = ['index.html', 'v1.2/frontend/components/v12_features.js', 'v1.2/frontend/components/ThemeCurationOverlay.js']
    
    for filepath in files:
        # Try reading with different encodings
        encodings = ['utf-8', 'cp949', 'utf-16', 'utf-16-le', 'utf-16-be']
        content = ""
        for enc in encodings:
            try:
                with open(filepath, 'r', encoding=enc) as f:
                    content = f.read()
                print(f"\n--- Successfully read {filepath} with {enc} ---")
                break
            except Exception as e:
                continue
                
        if not content:
            print(f"Failed to read {filepath}")
            continue
            
        lines = content.splitlines()
        search_terms = ["큐레이션", "AI추천", "activeTheme", "v12-curation", "v12ThemeCuration", "AI 추천", "전체 피드", "권리클린", "반값 역전세", "상가 수익률"]
        for idx, line in enumerate(lines):
            line_num = idx + 1
            if any(term in line for term in search_terms):
                try:
                    print(f"{line_num}: {line.strip()[:150]}")
                except Exception:
                    # Fallback to ascii/ignore print
                    clean_line = line.encode('ascii', 'ignore').decode('ascii')
                    print(f"{line_num} (error): {clean_line.strip()[:150]}")

if __name__ == '__main__':
    main()
