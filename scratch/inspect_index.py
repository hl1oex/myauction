import re

def search_keywords(file_path, keywords):
    encodings = ['utf-8', 'cp949', 'euc-kr', 'latin-1']
    content = None
    for enc in encodings:
        try:
            with open(file_path, 'r', encoding=enc) as f:
                content = f.read()
                print(f"Successfully loaded file with encoding: {enc}")
                break
        except Exception as e:
            continue
            
    if content is None:
        print("Failed to load file with any common encoding.")
        return
        
    for kw in keywords:
        matches = [m.start() for m in re.finditer(kw, content, re.IGNORECASE)]
        print(f"\nKeyword '{kw}': Found {len(matches)} occurrences.")
        for idx in matches[:15]:
            start = max(0, idx - 100)
            end = min(len(content), idx + 200)
            snippet = content[start:end].replace('\n', ' [NL] ')
            # Clean snippet for cp949 console printing
            safe_snippet = ""
            for char in snippet:
                if ord(char) < 128:
                    safe_snippet += char
                else:
                    safe_snippet += f"[{ord(char)}]"
            print(f"  - Position {idx}: ... {safe_snippet} ...")

def dump_loadDetailView(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    idx = content.find("function loadDetailView(item)")
    if idx != -1:
        snippet = content[idx:idx+12000].replace('\n', ' [NL] ')
        safe_snippet = ""
        for char in snippet:
            if ord(char) < 128:
                safe_snippet += char
            else:
                safe_snippet += f"[{ord(char)}]"
        print(safe_snippet)

search_keywords("index.html", ["complex_name", "elementary_school", "recent_deals", "detail-panel-complex"])










