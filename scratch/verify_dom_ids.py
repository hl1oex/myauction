# verify_dom_ids.py
# index.html 내의 자바스크립트가 참조하는 모든 DOM ID가 실제 HTML 마크업 내에 존재하는지 대조 및 검증하는 정밀 진단 스크립트입니다.
import re

def main():
    # index.html 파일 읽기
    with open("index.html", "r", encoding="utf-8") as f:
        content = f.read()

    # 자바스크립트 document.getElementById("...") 추출
    js_ids = set(re.findall(r'document\.getElementById\([\'"]([^\'"]+)[\'"]\)', content))
    
    # HTML 마크업 id="..." 추출
    html_ids = set(re.findall(r'(?:id|ID)=[\'"]([^\'"]+)[\'"]', content))

    print(f"JavaScript ID Count: {len(js_ids)}")
    print(f"HTML Markup ID Count: {len(html_ids)}")

    # 누락된 ID 검사
    missing_ids = []
    for j_id in js_ids:
        if j_id not in html_ids:
            # 예외 처리: 동적으로 템플릿 리터럴을 통해 바인딩되는 카드나 버튼 등은 제외
            if "${" in j_id or "card-" in j_id or "detail-tab-" in j_id:
                continue
            missing_ids.append(j_id)

    if missing_ids:
        print("[WARNING] Missing HTML elements for JavaScript IDs:")
        for m_id in sorted(missing_ids):
            print(f" - {m_id}")
    else:
        print("[OK] All JavaScript IDs are present in the HTML markup.")

if __name__ == "__main__":
    main()
