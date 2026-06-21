# 관심 등록 매물의 기일 임박 및 유찰 소식을 감지하여 텔레그램 알림을 자동 전송하는 독립형 배치 프로그램입니다.
import os
import re
import datetime
import requests
import json

def get_supabase_client_info():
    """클라우드 업로드에 사용할 Supabase 연결 자격 증명을 로드합니다."""
    url = os.environ.get("SUPABASE_URL")
    service_key = os.environ.get("SUPABASE_SERVICE_KEY")
    if url and service_key:
        return url, service_key
        
    config_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "config", "supabase_config.json")
    if os.path.exists(config_path):
        try:
            with open(config_path, "r", encoding="utf-8") as f:
                config = json.load(f)
                return config.get("supabase_url"), config.get("supabase_service_key")
        except Exception as e:
            print(f"[-] Supabase 설정 파일 파싱 오류: {e}")
    return None, None

async_headers = None

def get_headers(key):
    return {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }

def get_telegram_updates(bot_token):
    """텔레그램 봇의 getUpdates API를 조회하여 최근 대화 상대방의 username과 chat ID를 매핑합니다."""
    url = f"https://api.telegram.org/bot{bot_token}/getUpdates?offset=-20"
    mapping = {}
    try:
        res = requests.get(url, timeout=10)
        if res.status_code == 200:
            data = res.json()
            if data.get("ok") and "result" in data:
                for update in data["result"]:
                    message = update.get("message") or update.get("edited_message") or update.get("channel_post")
                    if message and "from" in message:
                        from_user = message["from"]
                        username = from_user.get("username")
                        chat_id = from_user.get("id")
                        if username and chat_id:
                            mapping[username.lower()] = str(chat_id)
    except Exception as e:
        print(f"[-] 텔레그램 getUpdates 조회 중 에러가 발생했습니다. {e}")
    return mapping

def resolve_chat_id(identifier, username_mapping):
    """사용자가 등록한 정보(아이디 또는 Chat ID 숫자)를 바탕으로 실제 Chat ID를 정제하여 반환합니다."""
    if not identifier:
        return None
    val = identifier.strip()
    # 숫자 형태면 직접 Chat ID로 사용합니다.
    if val.isdigit() or (val.startswith("-") and val[1:].isdigit()):
        return val
    # @사용자명 형태인 경우 매핑 딕셔너리에서 찾아봅니다.
    clean_username = val.replace("@", "").lower().strip()
    return username_mapping.get(clean_username)

def main():
    supabase_url, supabase_key = get_supabase_client_info()
    if not supabase_url or not supabase_key:
        print("[-] Supabase 접속 정보가 누락되어 배치 알림 처리를 진행할 수 없습니다.")
        return

    headers = get_headers(supabase_key)
    
    # 1. admin_config로부터 텔레그램 알림 발송 활성화 여부 및 봇 토큰 조회
    config_url = f"{supabase_url}/rest/v1/admin_config"
    try:
        res = requests.get(config_url, headers=headers, timeout=15)
        if res.status_code != 200:
            print(f"[-] admin_config 조회 실패 ({res.status_code}). 알림 배치를 건너뜁니다.")
            return
        config_list = res.json()
    except Exception as e:
        print(f"[-] admin_config 통신 오류 발생. {e}")
        return

    config_dict = {c["key"]: c["value"] for c in config_list}
    alert_enabled = config_dict.get("telegram_alert_enabled") == "true"
    alert_dday = config_dict.get("alert_d_day_enabled") == "true"
    alert_underbid = config_dict.get("alert_underbid_enabled") == "true"
    bot_token = config_dict.get("telegram_bot_token") or "8852350792:AAEBPlA64GIztJa8XeSrqQd4-1rvJbvsOiA"

    if not alert_enabled:
        print("[*] 전체 텔레그램 알림 자동 발송 스위치가 꺼져 있습니다. 배치를 종료합니다.")
        return

    if not alert_dday and not alert_underbid:
        print("[*] 세부 알림(D-Day, 유찰) 제어 기능이 모두 꺼져 있습니다. 배치를 종료합니다.")
        return

    # 2. 텔레그램 아이디가 등록된 활성 회원 프로필 조회
    users_url = f"{supabase_url}/rest/v1/user_profiles?telegram_chat_id=not.is.null"
    try:
        res = requests.get(users_url, headers=headers, timeout=15)
        if res.status_code != 200:
            print(f"[-] user_profiles 조회 실패. 알림 배치를 종료합니다.")
            return
        users = res.json()
    except Exception as e:
        print(f"[-] 회원 조회 중 통신 오류가 발생했습니다. {e}")
        return

    tg_users = [u for u in users if u.get("telegram_chat_id") and u["telegram_chat_id"].strip() != ""]
    if not tg_users:
        print("[*] 텔레그램 수신처가 등록된 회원이 존재하지 않습니다. 배치를 종료합니다.")
        return

    # 3. 회원들의 관심 매물 목록 조회
    fav_url = f"{supabase_url}/rest/v1/user_favorites"
    try:
        res = requests.get(fav_url, headers=headers, timeout=15)
        if res.status_code != 200:
            print(f"[-] 관심 매물 정보 조회 실패. 알림 배치를 종료합니다.")
            return
        favorites = res.json()
    except Exception as e:
        print(f"[-] 관심 매물 조회 중 통신 오류가 발생했습니다. {e}")
        return

    if not favorites:
        print("[*] 등록된 관심 매물이 없어 전송할 내역이 없습니다.")
        return

    # 4. 대상 매물 정보 상세 조회
    fav_prop_ids = list(set([f["property_id"] for f in favorites]))
    if not fav_prop_ids:
        print("[*] 관심 매물 리스트에 유효한 매물이 없습니다.")
        return

    # 대량의 property_id 쿼리를 위한 안전 처리
    ids_str = ",".join([str(pid) for pid in fav_prop_ids])
    properties_url = f"{supabase_url}/rest/v1/properties?id=in.({ids_str})"
    try:
        res = requests.get(properties_url, headers=headers, timeout=15)
        if res.status_code != 200:
            print(f"[-] properties 데이터 조회 실패. 배치를 종료합니다.")
            return
        properties = res.json()
    except Exception as e:
        print(f"[-] 매물 정보 조회 중 통신 오류가 발생했습니다. {e}")
        return

    prop_map = {p["id"]: p for p in properties}

    # 날짜 분석 계산 준비
    today = datetime.date.today()
    tomorrow = today + datetime.timedelta(days=1)
    tomorrow_str = tomorrow.strftime("%Y-%m-%d")
    today_str = today.strftime("%Y-%m-%d")

    # 텔레그램 Updates 대화 상대방 매핑 수집
    username_mapping = get_telegram_updates(bot_token)

    send_success = 0
    send_fail = 0

    print(f"[*] 총 {len(tg_users)}명의 텔레그램 연동 회원을 대상으로 알림 판정을 가동합니다.")

    # 5. 회원별 루프를 돌면서 관심 물건 분석 및 발송
    for user in tg_users:
        user_favs = [f for f in favorites if f["user_id"] == user["id"]]
        if not user_favs:
            continue

        identifier = user["telegram_chat_id"]
        chat_id = resolve_chat_id(identifier, username_mapping)

        for fav in user_favs:
            p = prop_map.get(fav["property_id"])
            if not p:
                continue

            is_dday_alert = False
            is_underbid_alert = False

            # A. D-1 임박 알림 판정 (bidding_date가 내일인 경우)
            if alert_dday and p.get("bidding_date") == tomorrow_str:
                is_dday_alert = True

            # B. 유찰 감지 판정 (오늘 업데이트 되었고, 감정가보다 최저가가 낮으며 최초 회차가 아닌 경우)
            is_updated_today = False
            if p.get("updated_at"):
                try:
                    update_date_str = p["updated_at"].split("T")[0]
                    if update_date_str == today_str:
                        is_updated_today = True
                except Exception:
                    pass

            appraised = p.get("appraised_value") or 0
            minimum = p.get("minimum_bid") or 0
            if alert_underbid and is_updated_today and appraised > 0 and minimum > 0 and minimum < appraised:
                is_underbid_alert = True

            if not is_dday_alert and not is_underbid_alert:
                continue

            alert_type = "D-Day 임박" if is_dday_alert else "유찰 감지"
            log_url = f"{supabase_url}/rest/v1/telegram_alert_logs"

            if not chat_id:
                # Chat ID 해결 실패 시 로그를 남김
                payload = {
                    "user_id": user["id"],
                    "property_id": p["id"],
                    "alert_type": alert_type,
                    "message": f"[발송대기] 텔레그램 사용자명({identifier})에 매핑되는 Chat ID 조회 불가",
                    "status": "fail",
                    "error_message": "사용자명에 해당하는 Chat ID를 찾을 수 없습니다. 봇에 들어가 시작을 누르셔야 합니다."
                }
                requests.post(log_url, headers=headers, json=payload, timeout=10)
                send_fail += 1
                continue

            # 알림 메시지 본문 작성
            if is_dday_alert:
                alert_text = f"⏰ [부동산경공매 검색시스템] 관심 매물 입찰 기일 임박(D-1) 안내\n\n"
                alert_text += f"회원님이 등록하신 관심 매물의 입찰 기일이 내일로 다가왔습니다. 놓치지 마시고 확인하세요!\n\n"
            else:
                alert_text = f"📉 [부동산경공매 검색시스템] 관심 매물 유찰(가격 저감) 발생 안내\n\n"
                alert_text += f"회원님이 등록하신 관심 매물이 유찰되어 최저입찰가가 하락하여 업데이트되었습니다. 새로운 기회를 확인해 보세요!\n\n"

            price_ratio = int((minimum / appraised) * 100) if appraised > 0 else 100
            discount_rate = 100 - price_ratio

            alert_text += f"▶ [{ '경매' if p.get('source') in ['court', 'court_etc'] else '공매' }] { p.get('auction_no') or '관리번호' }\n"
            alert_text += f"- 소재지: { p.get('address') or '--' }\n"
            alert_text += f"- 감정가: { appraised:, }원\n"
            alert_text += f"- 최저가: { minimum:, }원 ({ discount_rate }% 저감)\n"
            alert_text += f"- 입찰일: { p.get('bidding_date') or '--' }\n"
            alert_text += f"- AI 추천등급: { p.get('grade') or 'C' }등급 (Score: { p.get('score') or 0 }점)\n"
            alert_text += f"- 상세분석 바로가기: https://myauction.r-e.kr/?detail={ p['id'] }\n\n"
            alert_text += f"※ 자세한 소요자금 계획서 계산과 AI 명도 리포트는 공식 사이트에서 실시간 조회 가능합니다."

            # 텔레그램 전송 API 호출
            tg_send_url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
            try:
                res = requests.post(tg_send_url, json={
                    "chat_id": chat_id,
                    "text": alert_text
                }, timeout=15)
                
                tg_result = res.json()
                if res.status_code == 200 and tg_result.get("ok"):
                    payload = {
                        "user_id": user["id"],
                        "property_id": p["id"],
                        "alert_type": alert_type,
                        "message": alert_text,
                        "status": "success"
                    }
                    requests.post(log_url, headers=headers, json=payload, timeout=10)
                    send_success += 1
                else:
                    err_msg = tg_result.get("description") or "텔레그램 API 전송 실패"
                    payload = {
                        "user_id": user["id"],
                        "property_id": p["id"],
                        "alert_type": alert_type,
                        "message": alert_text,
                        "status": "fail",
                        "error_message": err_msg
                    }
                    requests.post(log_url, headers=headers, json=payload, timeout=10)
                    send_fail += 1
            except Exception as err:
                payload = {
                    "user_id": user["id"],
                    "property_id": p["id"],
                    "alert_type": alert_type,
                    "message": alert_text,
                    "status": "fail",
                    "error_message": str(err)
                }
                requests.post(log_url, headers=headers, json=payload, timeout=10)
                send_fail += 1

    print(f"[+] 텔레그램 배치 전송 완료. 성공: {send_success}건, 실패: {send_fail}건")

if __name__ == "__main__":
    main()
