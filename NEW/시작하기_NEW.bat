@echo off
cd /d "%~dp0"
chcp 65001 >nul
title [AI 부동산 경공매 실시간 시스템 v1.0]

echo =======================================================================
echo     [AI 부동산 경공매 통합 추천 시스템 실시간 서버/앱 구동 엔진]
echo =======================================================================
echo.
echo [+] 시스템을 감지하고 가상 환경 활성화를 시도합니다...
echo.

:: 1. 가상환경 (.venv) 위치 탐색
set "VENV_PATH=..\.venv"
if not exist "%VENV_PATH%\Scripts\activate.bat" (
    set "VENV_PATH=.venv"
)
if not exist "%VENV_PATH%\Scripts\activate.bat" (
    echo [❌] 부모 폴더 또는 현재 폴더에 가상환경(.venv)이 존재하지 않습니다!
    echo     '시작하기.bat'를 먼저 한 번 실행하여 가상환경을 구축해주십시오.
    pause
    exit /b
)

:: 2. 가상환경 활성화 및 라이브러리 검증
echo [+] 가상환경을 활성화합니다 (%VENV_PATH%)...
call "%VENV_PATH%\Scripts\activate.bat"
if errorlevel 1 (
    echo [❌] 가상환경 활성화에 실패했습니다.
    pause
    exit /b
)

echo [+] 필수 패키지 (fastapi, uvicorn, apscheduler) 설치 상태를 정밀 체크합니다...
python -c "import fastapi, uvicorn, apscheduler" >nul 2>&1
if errorlevel 1 (
    echo [⚠️] 필수 패키지가 누락되어 백그라운드에서 자동 설치를 개시합니다...
    python -m pip install fastapi uvicorn apscheduler
    if errorlevel 1 (
        echo [❌] 라이브러리 설치 중 에러가 발생했습니다. 네트워크 상태를 확인해주십시오.
        pause
        exit /b
    )
    echo [+] 라이브러리 설치가 성공적으로 완료되었습니다!
    echo.
) else (
    echo [+] 모든 필수 라이브러리 상태 정상 확인 (완료)
    echo.
)

:: 3. 클라이언트 웹 앱 (index.html) 자동 구동 예약 (서버 구동 직전 약 2초 후 브라우저 오픈)
echo [+] 브라우저 클라이언트 연결 엔진을 실행 예약합니다...
start /b cmd /c "timeout /t 2 >nul && start "" "index.html""

:: 4. FastAPI 실시간 API 백엔드 서버 가동
echo =======================================================================
echo     🟢 AI 실시간 연동 서버를 가동합니다. (포트: 8000)
echo     (서버를 종료하시려면 본 CMD 창에서 Ctrl + C 를 누르십시오.)
echo =======================================================================
echo.
python main.py
pause
