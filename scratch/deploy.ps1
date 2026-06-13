# deploy.ps1 - 이 빌드 스크립트는 수정한 index.html 복사, Expo 모바일 앱 export 및 Firebase 배포를 일괄 자동 수행합니다.
$ErrorActionPreference = "Stop"

Write-Host "1. index.html 복사 중..."
Copy-Item -Path "index.html" -Destination "dist/index.html" -Force

Write-Host "2. 모바일 앱 빌드(Expo Export) 중..."
Set-Location "mobile-app"
npx expo export

Write-Host "3. 모바일 빌드 자산 dist/mobile 로 복사 중..."
Set-Location ..
Remove-Item -Path "dist/mobile" -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path "dist/mobile" -Force
Copy-Item -Path "mobile-app/dist/*" -Destination "dist/mobile" -Recurse -Force

Write-Host "4. Firebase Hosting 배포 중..."
firebase deploy --only hosting

Write-Host "✅ 배포 완료!"
