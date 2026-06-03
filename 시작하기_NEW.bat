@echo off
cd /d "%~dp0"
chcp 65001 >nul
title [AI 부동산 경공매 실시간 시스템 v1.0]

echo [+] Real-estate-auction 폴더 내의 프리미엄 펄 화이트 크롬 연동 시스템을 시작합니다...
echo.
if exist "Real-estate-auction\시작하기_NEW.bat" (
    call "Real-estate-auction\시작하기_NEW.bat"
) else (
    echo [❌] Real-estate-auction\시작하기_NEW.bat 파일을 찾을 수 없습니다!
    pause
)
