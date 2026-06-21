# 매일 1회 대법원 경매 및 캠코 온비드 공매 크롤러를 통합 가동하고 결과를 이메일로 전송하는 스크립트입니다.

import os
import sys
import subprocess
import time
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def send_email(subject, body):
    # Github Secrets 또는 환경 변수로부터 SMTP 설정값을 가져옵니다.
    smtp_user = os.environ.get("SMTP_USER")
    smtp_pass = os.environ.get("SMTP_PASS")
    smtp_host = os.environ.get("SMTP_HOST", "smtp.gmail.com")
    smtp_port_raw = os.environ.get("SMTP_PORT", "587")
    smtp_port = int(smtp_port_raw)
    recipient = "hl1oex@gmail.com"

    if not smtp_user or not smtp_pass:
        print("[!] 이메일 전송 설정(SMTP_USER 또는 SMTP_PASS 환경 변수)이 지정되지 않았습니다. 메일 발송을 건너뜁니다.")
        return False

    try:
        # 이메일 메시지를 구성합니다.
        msg = MIMEMultipart()
        msg["From"] = smtp_user
        msg["To"] = recipient
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "plain", "utf-8"))

        if smtp_port == 465:
            server = smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=15)
            server.login(smtp_user, smtp_pass)
        else:
            server = smtplib.SMTP(smtp_host, smtp_port, timeout=15)
            server.starttls()
            server.login(smtp_user, smtp_pass)
            
        server.sendmail(smtp_user, recipient, msg.as_string())
        server.close()
        print(f"[+] 성공/실패 결과를 {recipient} 메일로 성공적으로 리포트하였습니다.")
        return True
    except Exception as e:
        print(f"[-] 1차 SMTP 전송 실패 ({str(e)}). 포트/보안 방식 자동 전환 폴백 재시도를 수행합니다.")
        try:
            fallback_port = 465 if smtp_port != 465 else 587
            if fallback_port == 465:
                server = smtplib.SMTP_SSL(smtp_host, fallback_port, timeout=15)
                server.login(smtp_user, smtp_pass)
            else:
                server = smtplib.SMTP(smtp_host, fallback_port, timeout=15)
                server.starttls()
                server.login(smtp_user, smtp_pass)
            server.sendmail(smtp_user, recipient, msg.as_string())
            server.close()
            print(f"[+] 포트 전환 폴백으로 결과를 {recipient} 메일로 성공적으로 리포트하였습니다.")
            return True
        except Exception as fallback_e:
            print(f"[!] 이메일 발송 중 최종 오류가 발생하였습니다. {str(fallback_e)}")
            print("[*] TIP: Gmail SMTP 사용 시 일반 비밀번호 대신 구글 계정 설정의 '앱 비밀번호(App Password)'를 생성해 사용해야 인증이 성공합니다.")
            return False

def main():
    print("[*] 부동산경공매 검색시스템 일일 통합 크롤러 가동을 시작합니다.")
    
    # 1. 캠코 온비드 공매 수집기 가동
    start_time = time.time()
    print("[*] 1/2. 캠코 온비드 공매 수집기(onbid_fetcher.py)를 실행합니다.")
    onbid_res = subprocess.run([sys.executable, "scrapers/onbid_fetcher.py"], capture_output=True, text=True, encoding="utf-8", errors="ignore")
    onbid_duration = round(time.time() - start_time, 2)
    onbid_status = "성공" if onbid_res.returncode == 0 else "실패"
    print(f"[+] 온비드 공매 수집 완료. 상태: {onbid_status}, 소요 시간: {onbid_duration}초.")

    # 2. 대법원 법원경매 수집기 가동
    start_time = time.time()
    print("[*] 2/2. 대법원 법원경매 수집기(court_scraper.py)를 실행합니다.")
    court_res = subprocess.run([sys.executable, "scrapers/court_scraper.py"], capture_output=True, text=True, encoding="utf-8", errors="ignore")
    court_duration = round(time.time() - start_time, 2)
    court_status = "성공" if court_res.returncode == 0 else "실패"
    print(f"[+] 법원 경매 수집 완료. 상태: {court_status}, 소요 시간: {court_duration}초.")

    # 3. 텔레그램 알림 배치 발송기 가동
    start_time = time.time()
    print("[*] 3/3. 텔레그램 알림 배치 발송기(telegram_notifier.py)를 실행합니다.")
    tg_res = subprocess.run([sys.executable, "scrapers/telegram_notifier.py"], capture_output=True, text=True, encoding="utf-8", errors="ignore")
    tg_duration = round(time.time() - start_time, 2)
    tg_status = "성공" if tg_res.returncode == 0 else "실패"
    print(f"[+] 텔레그램 알림 배치 완료. 상태: {tg_status}, 소요 시간: {tg_duration}초.")

    # 이메일 전송용 보고서 본문을 생성합니다.
    subject = f"[부동산경공매 검색시스템] 일일 크롤링 완료 리포트 (종합 상태: {'성공' if onbid_status == '성공' and court_status == '성공' and tg_status == '성공' else '주의 요망'})"
    
    body = f"""부동산경공매 검색시스템 일일 크롤링 통계 및 실행 로그 리포트입니다.

[1] 캠코 온비드 공매 수집기 (onbid_fetcher.py)
- 실행 상태: {onbid_status}
- 소요 시간: {onbid_duration}초
- 반환 코드: {onbid_res.returncode}

[2] 대법원 법원경매 수집기 (court_scraper.py)
- 실행 상태: {court_status}
- 소요 시간: {court_duration}초
- 반환 코드: {court_res.returncode}

[3] 텔레그램 알림 배치 발송기 (telegram_notifier.py)
- 실행 상태: {tg_status}
- 소요 시간: {tg_duration}초
- 반환 코드: {tg_res.returncode}

--------------------------------------------------
[상세 로그 - 온비드 공매 수집기]
{onbid_res.stdout}
{onbid_res.stderr if onbid_res.stderr else "오류 로그 없음."}

--------------------------------------------------
[상세 로그 - 대법원 법원경매 수집기]
{court_res.stdout}
{court_res.stderr if court_res.stderr else "오류 로그 없음."}

--------------------------------------------------
[상세 로그 - 텔레그램 알림 배치 발송기]
{tg_res.stdout}
{tg_res.stderr if tg_res.stderr else "오류 로그 없음."}
"""

    # 이메일 리포트 발송을 실행합니다.
    send_email(subject, body)

    # 크롤러 및 알림 배치 중 하나라도 실패했다면 비정상 코드로 종료하되 로그가 남도록 조치합니다.
    if onbid_res.returncode != 0 or court_res.returncode != 0 or tg_res.returncode != 0:
        print("[!] 프로세스 일부가 정상적으로 작동하지 않았습니다. 통합 프로세스를 실패 처리합니다.")
        sys.exit(1)
    else:
        print("[+] 모든 크롤러 및 알림 배치가 성공적으로 가동을 완료하였습니다.")
        sys.exit(0)

if __name__ == "__main__":
    main()
