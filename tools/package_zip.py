import os
import zipfile
import sys

def package_project():
    project_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    output_filename = os.path.join(project_dir, "경매_추천_시스템_v1.0.zip")
    
    print("=======================================================================")
    print("📦 배포용 경매 추천 시스템 ZIP 패키징 스크립트")
    print("=======================================================================")
    print(f"프로젝트 경로: {project_dir}")
    print(f"생성할 ZIP 파일명: {output_filename}")
    print("-----------------------------------------------------------------------")
    
    # 1. Create README.txt dynamically if it doesn't exist
    readme_path = os.path.join(project_dir, "README.txt")
    readme_content = """=======================================================================
🏠 부동산 경매 추천 시스템 v1.0 사용 설명서
=======================================================================

이 폴더는 부동산 경매를 처음 접하는 초보자 분들도 손쉽게 
분석하고 가치 판단을 내릴 수 있도록 돕는 추천 프로그램 패키지입니다.

-----------------------------------------------------------------------
🚀 시작 방법 (Windows PC 기준)
-----------------------------------------------------------------------
1. 압축을 완전히 해제합니다.
2. 폴더 내의 [시작하기.bat] 파일을 더블 클릭하여 실행합니다.
   * 최초 실행 시 필요한 라이브러리를 자동 설치하므로 약간의 시간이 소요될 수 있습니다.
   * 컴퓨터에 파이썬(Python)이 설치되어 있지 않다면 창에 뜨는 안내에 따라 설치 후 다시 구동해 주세요.

-----------------------------------------------------------------------
📂 주요 폴더 및 구성 정보
-----------------------------------------------------------------------
* [시작하기.bat]: 프로그램 시작 및 라이브러리 자동 구성 실행 파일
* [src/app.py]: 웹 대시보드 화면 및 핵심 추천/권리 분석 엔진 소스코드
* [tools/court_scraper.py]: 대법원 공식 경매 정보망 실시간 수집기
* [대법원 크롤러 사용법 가이드.md]: 서버 수집 및 연동에 대한 개발 가이드
* [README.txt]: 본 안내문

-----------------------------------------------------------------------
⚠️ 법적 면책 조항 및 면책 고지
-----------------------------------------------------------------------
본 추천 시스템이 검출하는 위험 권리 관계 분석 결과는 대법원 법원경매 정보망의
공식 공고 및 설명 텍스트를 기초로 한 기계적인 1차 분석 결과입니다.
실제 입찰에 참여하기 전에는 반드시 등기부등본 열람, 전입세대확인서 열람, 
현장 조사 등을 통해 정확한 권리 분석 및 하자를 본인 책임하에 재검증하셔야 합니다.
"""
    
    with open(readme_path, "w", encoding="utf-8") as rf:
        rf.write(readme_content)
    print("[+] README.txt 작성 완료!")
    
    # Exclude list for packaging
    exclude_dirs = {
        ".git", ".github", ".vscode", ".venv", "venv", "env", "__pycache__", "mcp"
    }
    exclude_files = {
        "경매_추천_시스템.zip", "경매_추천_시스템_v1.0.zip", "play.exe"
    }
    
    zip_count = 0
    with zipfile.ZipFile(output_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(project_dir):
            # Modify dirs in-place to skip excluded directories
            dirs[:] = [d for d in dirs if d not in exclude_dirs]
            
            for file in files:
                if file in exclude_files:
                    continue
                if file.endswith(('.pyc', '.log', '.tmp')):
                    continue
                    
                file_path = os.path.join(root, file)
                # Compute relative path for inside zip archive
                rel_path = os.path.relpath(file_path, project_dir)
                
                zipf.write(file_path, rel_path)
                zip_count += 1
                
    print(f"[+] 성공: 총 {zip_count}개의 파일이 '{os.path.basename(output_filename)}' 압축파일에 적재되었습니다.")
    print("=======================================================================")
    print("이제 이 ZIP 파일을 다른 분들에게 그대로 전달하여 실행하게 하시면 됩니다!")
    print("=======================================================================")

if __name__ == "__main__":
    import sys
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except AttributeError:
        pass  # For older Python versions
    package_project()
