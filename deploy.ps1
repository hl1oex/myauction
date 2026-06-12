# 이 스크립트는 모바일 웹앱을 Expo로 빌드하고 dist 폴더 구조를 동기화한 뒤 Firebase Hosting에 최종 배포하는 자동화 스크립트입니다.
Write-Host "[*] 빌드 및 배포 자동화 프로세스를 시작합니다." -ForegroundColor Cyan

# 1. 모바일 앱 빌드
Write-Host "[*] 1/4. 모바일 React Native Expo 웹 빌드 중..." -ForegroundColor Yellow
cd mobile-app
npx expo export
if ($LASTEXITCODE -ne 0) {
    Write-Error "[-] Expo Web 빌드 실패!"
    cd ..
    exit 1
}
cd ..

# 2. 빌드 디렉토리 동기화
Write-Host "[*] 2/4. 빌드 결과물 동기화 및 파일 복사 중..." -ForegroundColor Yellow
if (-not (Test-Path "dist")) {
    New-Item -ItemType Directory -Path "dist"
}
if (-not (Test-Path "dist/mobile")) {
    New-Item -ItemType Directory -Path "dist/mobile"
}

Copy-Item -Path "mobile-app/dist/*" -Destination "dist/mobile/" -Recurse -Force
Copy-Item -Path "index.html" -Destination "dist/" -Force
Copy-Item -Path "admin.html" -Destination "dist/" -Force
Copy-Item -Path "favicon.png" -Destination "dist/" -Force
Copy-Item -Path "apartment_elegant_facade.png" -Destination "dist/" -Force
Copy-Item -Path "floorplan_modern_apartment.png" -Destination "dist/" -Force

# 3. 상대 경로 치환 패치 적용
Write-Host "[*] 3/4. relative_path_patch.py 파이썬 후처리 가동 중..." -ForegroundColor Yellow
python scratch/relative_path_patch.py
if ($LASTEXITCODE -ne 0) {
    Write-Error "[-] 상대 경로 후처리 패치 실패!"
    exit 1
}

# 4. Firebase Hosting 최종 배포
Write-Host "[*] 4/4. Firebase Hosting 실서버 온라인 배포 중..." -ForegroundColor Yellow
firebase deploy
if ($LASTEXITCODE -ne 0) {
    Write-Error "[-] Firebase 배포 실패!"
    exit 1
}

Write-Host "[+] 모든 빌드 및 Firebase 배포 프로세스가 성공적으로 완료되었습니다!" -ForegroundColor Green
