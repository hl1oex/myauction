# checklist.md 파일에 유실된 슬랙/텔레그램 공유 관련 체크리스트를 cp949 인코딩을 고려하여 완료 상태로 추가하는 스크립트입니다.
import os

def main():
    target_path = "checklist.md"
    if not os.path.exists(target_path):
        print("checklist.md 파일을 찾을 수 없습니다.")
        return

    # CP949 인코딩으로 읽기 시도
    try:
        with open(target_path, "r", encoding="cp949") as f:
            content = f.read()
        encoding_used = "cp949"
    except UnicodeDecodeError:
        with open(target_path, "r", encoding="utf-8") as f:
            content = f.read()
        encoding_used = "utf-8"

    print(f"파일을 {encoding_used} 인코딩으로 읽었습니다.")

    # 추가할 완료 항목 정의
    appendix = """
- [x] [사용자 요청] 슬랙 및 텔레그램 공유 기능 고도화 및 모바일 UI 최적화
  - [x] 모바일 상세 화면(DetailScreen.tsx) 헤더 내 이모지 공유 버튼을 제거하고 summaryCard 하단에 프리미엄 가로행 공유 버튼 세트 이식
  - [x] 모바일 앱(네이티브 및 웹 통합)에서 텔레그램 Chat ID를 입력 및 관리할 수 있는 커스텀 모달 UI 탑재
  - [x] PC 웹 대시보드(index.js) 내 슬랙 및 텔레그램 공유 연동 로직 정상 동작 여부 검토 및 보강
  - [x] 모바일 앱 빌드 컴파일 검증 및 deploy.ps1 실행을 통한 Firebase Hosting 실서버 무결성 최종 배포
"""

    # 중복 추가 방지 검사
    if "[사용자 요청] 슬랙 및 텔레그램 공유 기능 고도화" not in content:
        # 파일 끝에 붙이기
        content_norm = content.rstrip() + "\n" + appendix
        with open(target_path, "w", encoding=encoding_used, newline="") as f:
            f.write(content_norm)
        print("성공적으로 완료 체크리스트 항목을 추가했습니다.")
    else:
        # 이미 존재하지만 미완료 상태라면 완료 상태로 치환
        content_norm = content.replace("[ ] [사용자 요청] 슬랙", "[x] [사용자 요청] 슬랙")
        content_norm = content_norm.replace("[ ] 모바일 상세 화면", "[x] [모바일 상세 화면")
        content_norm = content_norm.replace("[ ] 모바일 앱(네이티브", "[x] [모바일 앱(네이티브")
        content_norm = content_norm.replace("[ ] PC 웹 대시보드", "[x] [PC 웹 대시보드")
        content_norm = content_norm.replace("[ ] 모바일 앱 빌드", "[x] [모바일 앱 빌드")
        
        with open(target_path, "w", encoding=encoding_used, newline="") as f:
            f.write(content_norm)
        print("기존 체크리스트 항목을 완료 상태로 갱신했습니다.")

if __name__ == "__main__":
    main()
