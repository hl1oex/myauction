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
- [x] v1.1 온라인 배포 및 가독성 개선 작업
  - [x] PC 대시보드 index.html 폰트 크기 스케일업
  - [x] 모바일 앱 컴포넌트 및 화면(Feed, Detail, Auth, Favorites) 가독성 스케일업
  - [x] Firebase Hosting 설정 및 Expo Web 빌드 경로(/mobile) 맵핑
  - [x] Firebase Hosting 통합 온라인 배포 완수
  - [x] PC 대시보드 index.html 탭바 grid grid-cols-3 반응형 개선 및 레이아웃 여백 촘촘화
  - [x] PC 대시보드 index.html Firebase SDK 연동 및 Firestore 직접 조회 전환 (DB 해결)
- [x] UI 여백 축소 및 모바일 시군구 지역 분류 확장 작업
  - [x] PC 대시보드 index.html 폰트 크기 배율 하향 및 여백 촘촘화
  - [x] 모바일 앱 FeedScreen.tsx 시도/시군구 필터 전국 확장 및 ScrollView 가로 스크롤 적용
- [x] 데이터 저장 및 렌더링 무한 로딩 버그 수정 작업
  - [x] PC 대시보드 index.html Firestore 실시간 연동 빈 응답 예외 복구 및 ID 타입 덮어쓰기 해결
  - [x] 모바일 앱 utils/api.ts 데이터 로딩 시 ID 누락 예방 처리 보완
  - [x] 대법원 경매 데이터 수집 제한 해제 및 수집량 증폭 패치 적용
- [ ] 시스템 온라인 연동 상태 진단 및 아키텍처 문서화 작업
  - [x] PC 대시보드 및 모바일 앱 온라인 Firestore 직접 연동 상태 정밀 검증
  - [ ] 사용자의 로컬 파일 삭제 가이드 피드백 수렴 및 선별 정리
  - [x] 전체 아키텍처 및 시스템 흐름 상세 명세서(architecture.md) 작성
- [x] 대시보드 탭 전환 레이아웃 깨짐 및 노출 복구 버그 픽스
  - [x] PC 대시보드 index.html 탭 전환 시 클래스명 덮어쓰기 개량 (`classList` 적용)
  - [x] 반응형 레이아웃 리사이즈 시 `hidden` 클래스 유실 및 탭 상태 충돌 방지 로직 적용
  - [x] 데스크톱 및 모바일 해상도 탭 전환 상호 검증
- [ ] 모바일 UI 가독성 및 Firestore 할당량 초과 대응 패치
  - [ ] FeedScreen.tsx 필터 라벨, 칩, 토글 등 전반적인 폰트 크기 스케일업
  - [ ] FeedScreen.tsx Firestore 로드 실패 시 LocalStorage 복구 캐싱 메커니즘 탑재
  - [ ] 모바일 앱 정적 웹 빌드 및 Firebase Hosting 재배포





