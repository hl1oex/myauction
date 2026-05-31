@echo off
cd /d "%~dp0"
chcp 949 >nul
title [하이브리드 경매/공매 Recommender 시작하기]

echo =======================================================================
echo [하이브리드 법원 경매 및 온비드 공매 추천 시스템 런처]
echo =======================================================================
echo.
echo 이 스크립트는 실행 환경을 자동으로 분석하고 필요한 패키지를 설치한 뒤,
echo 웹 대시보드를 바로 브라우저에 띄워 드립니다.
echo.

:: 1. 파이썬 설치 여부 확인
python --version >nul 2>&1
if errorlevel 1 (
    echo [오류] 컴퓨터에 Python이 설치되어 있지 않거나 환경변수 PATH에 등록되지 않았습니다!
    echo.
    echo 해결 방법:
    echo 1. 웹 브라우저에서 https://www.python.org/downloads/ 에 접속합니다.
    echo 2. 최신버전 Python 다운로드 버튼을 누릅니다.
    echo 3. 설치 프로그램 실행 후, 반드시 하단에 있는 Add Python to PATH 체크박스를 체크하고 설치를 진행해 주세요.
    echo 4. 설치 완료 후 이 창을 닫고 '시작하기.bat'를 다시 더블 클릭 하시면 됩니다.
    echo.
    pause
    exit /b
)

echo [+] 파이썬 설치 확인 완료!
echo.

:: 2. 가상환경 구성 확인 및 생성
if not exist ".venv" (
    echo [+] 가상 독립 환경 폴더가 존재하지 않아 신규 생성 중입니다... 최초 1회만 실행됨
    python -m venv .venv
    if errorlevel 1 (
        echo [오류] 가상 환경 생성 실패! 파이썬 설치 상태를 확인해 주세요.
        pause
        exit /b
    )
    echo [+] 가상 독립 환경 생성 완료!
    echo.
)

:: 3. 가상환경 활성화
echo [+] 가상 독립 환경 활성화 중...
call .venv\Scripts\activate.bat
if errorlevel 1 (
    echo [오류] 가상 환경 활성화 실패!
    pause
    exit /b
)

:: 4. 의존성 패키지 검사 및 자동 설치
echo [+] 필수 프로그램 라이브러리 검사 중...
python -c "import streamlit, requests, pandas, openpyxl, bs4" >nul 2>&1
if errorlevel 1 (
    echo [+] 미설치된 라이브러리가 발견되어 설치를 시작합니다.
    echo [+] 라이브러리 검사 및 최신화 설치 중... 최초 1회는 수 분이 소요될 수 있습니다.
    python -m pip install --upgrade pip --quiet
    pip install -r requirements.txt --no-cache-dir --quiet
    if errorlevel 1 (
        echo [오류] 라이브러리 설치 중 오류가 발생했습니다. 인터넷 연결 상태를 확인해 주세요.
        pause
        exit /b
    )
    echo [+] 라이브러리 설치 완료!
    echo.
) else (
    echo [+] 모든 필수 라이브러리가 이미 설치되어 있어 라이브러리 확인을 건너뜁니다. 빠른 실행
    echo.
)

:: 5. 실시간 데이터 존재 여부 검사 및 안내
if not exist "input_sources\json\court.json" (
    echo [안내] 최초 실행이므로 수집된 실시간 데이터베이스가 발견되지 않았습니다.
    echo        대시보드 실행 후 대법원 크롤러 사용 가이드 탭을 참고하여
    echo        수집기 tools/court_scraper.py 를 구동하시거나 사설 파일을 업로드해 주세요.
    echo.
)

:: 6. 크롬 브라우저 감지 및 스트림릿 서버 구동
echo =======================================================================
echo [+] 웹 브라우저 대시보드 서버를 시작합니다!
echo =======================================================================
echo.

:: Chrome 경로를 PATH에 추가하여 감지 및 실행을 단순화
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" set "PATH=%ProgramFiles%\Google\Chrome\Application;%PATH%"
if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" set "PATH=%ProgramFiles(x86)%\Google\Chrome\Application;%PATH%"
if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" set "PATH=%LocalAppData%\Google\Chrome\Application;%PATH%"

:: Chrome이 사용 가능한지 확인 (registry 또는 PATH 상에 존재하는지)
where chrome.exe >nul 2>&1
if not errorlevel 1 goto LAUNCH_CHROME

reg query "HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\chrome.exe" >nul 2>&1
if not errorlevel 1 goto LAUNCH_CHROME

reg query "HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\App Paths\chrome.exe" >nul 2>&1
if not errorlevel 1 goto LAUNCH_CHROME

:: Chrome이 감지되지 않는 경우
echo [안내] 크롬 브라우저가 감지되지 않아 시스템 기본 브라우저를 사용해 실행합니다.
streamlit run src/app.py
goto END

:LAUNCH_CHROME
echo [+] 크롬 브라우저를 발견하여 크롬으로 대시보드를 실행합니다.
:: 4초 후 크롬에서 대시보드가 열리도록 백그라운드 대기 작업 시작 (서버 구동 대기)
start /b cmd /c "ping 127.0.0.1 -n 5 >nul && start chrome http://127.0.0.1:8501"
streamlit run src/app.py --server.headless true
goto END

:END
pause
