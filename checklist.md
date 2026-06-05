# 프로젝트 구현 체크리스트

React Native 모바일 앱 개발 과정의 세부 단계별 체크리스트입니다.

- [x] 모바일 앱 개발 환경 구축
  - [x] Expo CLI를 이용해 blank-typescript 기반 프로젝트 초기화 진행
  - [x] 불필요한 기본 파일 정리 및 폴더 구조 설정
- [x] 디자인 시스템 및 스타일링 설정
  - [x] 로열 펄 화이트 스타일을 모바일 화면에 구현
  - [x] 다크 모드 고려 및 모바일용 UI 테마 컬러 정의
- [x] API 데이터 연동 모듈 개발
  - [x] Axios를 이용한 FastAPI 통신 모듈 구축
  - [x] 로컬/외부 IP 설정을 지원하는 동적 API 베이스 URL 기능 구현
- [x] 개별 화면 UI 및 로직 구현
  - [x] FeedScreen (메인 추천 피드)
  - [x] DetailScreen (권리분석 상세)
  - [x] GlossaryScreen (법률 리스크 사전)
  - [x] GuideScreen (크롤러 가이드)
- [x] 네비게이션 연동 및 동작 확인
  - [x] React Navigation (또는 Expo Router) 설정
  - [x] 탭 간 화면 전환 및 파라미터 전달 테스트
- [x] 최종 검증 및 동작 테스트
  - [x] 타입 검사 및 린트 오류 확인
  - [x] 실제 데이터 렌더링 확인
- [x] Firebase 활용한 사용자 인증 및 클라우드 동기화
  - [x] Firebase SDK 패키지 설치 및 설정 파일 작성
  - [x] Firestore 기반 관심 매물 추가/삭제 로직 구축
  - [x] 로그인 및 회원가입 인증 화면 구현
  - [x] 메인 내비게이션 탭 연동 및 UI 적용
- [x] 데이터베이스 및 백엔드 레이어의 완전한 온라인화 (대안 B)
  - [x] requirements.txt에 firebase-admin 패키지 정의
  - [x] database.py에 클라우드 Firestore 데이터 업로드 엔진 탑재
  - [x] 모바일 앱 src/utils/api.ts의 조회 엔진을 Firestore SDK로 전면 마이그레이션
  - [x] 모바일 앱 FeedScreen.tsx의 로컬 서버 설정 잔재 제거 및 린트 오류 해결
- [/] v1.1 온라인 배포 및 가독성 개선 작업
  - [x] PC 대시보드 index.html 폰트 크기 스케일업
  - [x] 모바일 앱 컴포넌트 및 화면(Feed, Detail, Auth, Favorites) 가독성 스케일업
  - [x] Firebase Hosting 설정 및 Expo Web 빌드 경로(/mobile) 맵핑
  - [x] Firebase Hosting 통합 온라인 배포 완수
  - [x] PC 대시보드 index.html 탭바 grid grid-cols-3 반응형 개선 및 레이아웃 여백 촘촘화
  - [x] PC 대시보드 index.html Firebase SDK 연동 및 Firestore 직접 조회 전환 (DB 해결)

