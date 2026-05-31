import os
import sys
import threading
import json
import requests
import pandas as pd
import streamlit as st
import datetime
import textwrap

def get_legal_risk_warning(reason_str):
    warnings = []
    
    # Check for Land Right issues
    if any(kw in reason_str for kw in ["대지권없음", "토지만", "건물만", "대지권 미등기"]):
        warnings.append(
            "<div style='margin-bottom: 0.8rem; border-left: 4px solid #ef4444; padding-left: 10px;'>"
            "<strong>🧱 토지 사용권 분쟁 (건물만 매각 / 대지권 없음) 리스크</strong><br/>"
            "<span style='font-size: 0.9em; color: #475569;'>건물의 소유권만 낙찰받고 토지 소유권은 가져오지 못하는 상태입니다. "
            "추후 토지 소유주로부터 매달 땅값 지료(사용료) 청구 소송을 당하거나, 건물 철거 소송을 당해 낙찰 자산을 잃을 수 있습니다.</span><br/>"
            "<span style='font-size: 0.85em; color: #b91c1c; font-weight: bold;'>👉 초보자 대응 지침: 입찰 절대 금지. 토지 소유자와의 긴 소송이나 지료 청구 압박에 처해 낙찰 대금 전체를 허공에 날릴 위험이 매우 높습니다.</span>"
            "</div>"
        )
        
    if "토지별도" in reason_str:
        warnings.append(
            "<div style='margin-bottom: 0.8rem; border-left: 4px solid #f59e0b; padding-left: 10px;'>"
            "<strong>📝 토지별도등기 인수 리스크</strong><br/>"
            "<span style='font-size: 0.9em; color: #475569;'>토지에 별도의 근저당이나 담보권이 남아 있는 건물입니다. "
            "낙찰대금으로 토지 저당권이 말소되지 않을 경우, 그 근저당 채무가 낙찰자에게 승계되어 대지 지분을 잃을 우려가 큽니다.</span><br/>"
            "<span style='font-size: 0.85em; color: #d97706; font-weight: bold;'>👉 초보자 대응 지침: '매각물건명세서' 상에서 토지별도저당이 낙찰로 소멸되는지 반드시 확인해야 합니다. 소멸하지 않고 인수되는 채무가 있다면 입찰하지 마십시오.</span>"
            "</div>"
        )
        
    if "지분" in reason_str:
        warnings.append(
            "<div style='margin-bottom: 0.8rem; border-left: 4px solid #ef4444; padding-left: 10px;'>"
            "<strong>👥 공동소유 지분 제한 리스크</strong><br/>"
            "<span style='font-size: 0.9em; color: #475569;'>부동산 전체가 아닌 일부 지분(예: 1/2)만 소유하게 되는 물건입니다. "
            "단독으로 실거주나 임대를 마음대로 놓을 수 없으며, 타 공유자들과의 공유물분할소송 등 긴 법정 소송을 겪을 가능성이 농후합니다.</span><br/>"
            "<span style='font-size: 0.85em; color: #b91c1c; font-weight: bold;'>👉 초보자 대응 지침: 지분 물건은 임대/처분이 제한됩니다. 타 공유자의 우선매수청구권 행사 여부 및 공유물 관계를 완벽히 파악할 수 있는 전문가가 아니라면 입찰하지 마십시오.</span>"
            "</div>"
        )
        
    # Check for possession issues
    if any(kw in reason_str for kw in ["유치권", "유치권 주장"]):
        warnings.append(
            "<div style='margin-bottom: 0.8rem; border-left: 4px solid #ef4444; padding-left: 10px;'>"
            "<strong>🛠️ 유치권 행사 (명도 거부 및 채무 인수) 리스크</strong><br/>"
            "<span style='font-size: 0.9em; color: #475569;'>공사비를 받지 못한 건설 업자 등이 부동산을 불법/적법 점유하고 있는 상태입니다. "
            "단순 인도명령이 기각되어 수년에 걸친 '명도소송'을 치러야 할 수 있으며, 유치권이 정당할 시 공사비를 낙찰자가 대신 다 갚아주어야 합니다.</span><br/>"
            "<span style='font-size: 0.85em; color: #b91c1c; font-weight: bold;'>👉 초보자 대응 지침: 입찰 절대 피하십시오. 진짜 유치권인지 허위 유치권인지의 증빙 확인이 대단히 어렵고, 명도 해결 시까지 막대한 이자 손실이 발생합니다.</span>"
            "</div>"
        )
        
    if "명도곤란" in reason_str or "점유관계미상" in reason_str:
        warnings.append(
            "<div style='margin-bottom: 0.8rem; border-left: 4px solid #f59e0b; padding-left: 10px;'>"
            "<strong>🚪 불법/미상 점유자 명도 지연 리스크</strong><br/>"
            "<span style='font-size: 0.9em; color: #475569;'>점유 관계가 불분명하거나 대화가 거부되는 점유자가 거주 중입니다. "
            "이주 협상이 어긋나면 강제집행(평당 10~15만원 집행비 발생)을 밟아야 하며, 수개월간의 입주 지연이 수반됩니다.</span><br/>"
            "<span style='font-size: 0.85em; color: #d97706; font-weight: bold;'>👉 초보자 대응 지침: 법적 인도명령 신청을 낙찰 후 잔금 납부 시 바로 청구하고, 점유자와의 타협을 위해 통상적인 이사비 및 강제집행 예산을 미리 공제하고 응찰가를 잡으십시오.</span>"
            "</div>"
        )
        
    # Check for financial liabilities
    if any(kw in reason_str for kw in ["인수", "선순위", "대항력", "임차권", "보증금 인수"]):
        warnings.append(
            "<div style='margin-bottom: 0.8rem; border-left: 4px solid #ef4444; padding-left: 10px;'>"
            "<strong>💰 대항력 있는 세입자 보증금 대위변제 (인수) 리스크</strong><br/>"
            "<span style='font-size: 0.9em; color: #475569;'>말소기준권리보다 전입신고가 빠른 임차인으로 법적으로 보호받습니다. "
            "낙찰대금에서 보증금이 전액 변제되지 않을 시, **낙찰자가 세입자의 보증금 미변제 잔액을 현금으로 전부 대신 갚아주어야만 집을 넘겨받을 수 있습니다.**</span><br/>"
            "<span style='font-size: 0.85em; color: #b91c1c; font-weight: bold;'>👉 초보자 대응 지침: 임차인의 배당 순위와 예상 배당액을 철저히 분석하여, 낙찰자가 독박 써야 하는 '보증금 인수액'을 구하고, 이를 최저입찰가나 감정가에서 제해 차감한 입찰 한도를 설정하십시오.</span>"
            "</div>"
        )
        
    if any(kw in reason_str for kw in ["서류없음", "확인불가", "열람불가", "자료없음"]):
        warnings.append(
            "<div style='margin-bottom: 0.8rem; border-left: 4px solid #6b7280; padding-left: 10px;'>"
            "<strong>⚠️ 정보 부재 및 깜깜이 투자 리스크</strong><br/>"
            "<span style='font-size: 0.9em; color: #475569;'>공식 매각 정보망이나 현황조사서가 공개되지 않아 권리분석이 불가능한 물건입니다. "
            "어떤 하자가 숨겨져 있을지 모르며, 사후 문제 해결 비용은 온전히 낙찰자 몫이 됩니다.</span><br/>"
            "<span style='font-size: 0.85em; color: #374151; font-weight: bold;'>👉 초보자 대응 지침: 입찰 절대 금지. 정보가 공식 공개될 때까지 기다리거나, 완벽하게 권리 관계를 파악하기 전까지는 도박 투자를 무조건 피하십시오.</span>"
            "</div>"
        )
        
    if not warnings:
        warnings.append(
            "<div style='color: #4b5563; font-size: 0.9em;'>"
            "검출된 제외 키워드에 대해 일반적인 리스크 분석이 매칭되지 않았습니다. 대법원 매각물건명세서의 특이사항을 필히 재확인해 주세요."
            "</div>"
        )
        
    return "<div style='background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 1rem; margin-top: 1rem;'>" \
           "<p style='margin-bottom: 0.8rem; color: #78350f; font-weight: bold;'>⚠️ 일반 초보자를 위한 상세 법적 위험 및 예상 소송 문제 분석:</p>" \
           + "".join(warnings) + \
           "</div>"


# Setup paths for reliable imports
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(base_dir)
sys.path.append(os.path.join(base_dir, "src"))

from completeness import check_completeness
from hardfilter import evaluate_hardfilter, load_rules
from softscore import compute_softscore
from tools.convert_csv_to_json import parse_uploaded_file

def render_html(html_str):
    cleaned_lines = [line.strip() for line in html_str.splitlines()]
    cleaned_html = "\n".join(cleaned_lines).strip()
    st.markdown(cleaned_html, unsafe_allow_html=True)


# Set Streamlit Page Configuration
st.set_page_config(
    page_title="부동산 경매 추천 시스템 v1.0",
    page_icon="🏠",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Helper function to format KRW currency cleanly
def format_krw(val):
    if val is None or val == 0:
        return "0원"
    if val >= 10000000000000:
        return "제한 없음"
    
    uk = val // 100000000
    remainder = val % 100000000
    man = remainder // 10000
    won = remainder % 10000
    
    parts = []
    if uk > 0:
        parts.append(f"{uk}억")
    if man > 0:
        parts.append(f"{man:,}만")
    if won > 0 or not parts:
        parts.append(f"{won}원")
    else:
        parts.append("원")
        
    return " ".join(parts).replace(" 원", "원")

# Helper function to estimate bidding rounds (회차), failed auctions (유찰 수), and discount rate (저감율)
def estimate_auction_rounds(appraisal, price, source):
    if not appraisal or not price or appraisal <= 0 or price <= 0:
        return 1, 0, 0.0
    
    discount_rate = ((appraisal - price) / appraisal) * 100.0
    if discount_rate < 0:
        discount_rate = 0.0
        
    # Estimate failed count based on source
    if source == "court":
        ratio = price / appraisal
        if ratio >= 0.95:
            failed_count = 0
        elif ratio >= 0.75:
            failed_count = 1
        elif ratio >= 0.60:
            failed_count = 2
        elif ratio >= 0.48:
            failed_count = 3
        elif ratio >= 0.38:
            failed_count = 4
        else:
            failed_count = 5
    elif source == "onbid":
        ratio = price / appraisal
        if ratio >= 0.95:
            failed_count = 0
        elif ratio >= 0.85:
            failed_count = 1
        elif ratio >= 0.75:
            failed_count = 2
        elif ratio >= 0.65:
            failed_count = 3
        elif ratio >= 0.55:
            failed_count = 4
        else:
            failed_count = 5
    else:
        ratio = price / appraisal
        if ratio >= 0.95:
            failed_count = 0
        elif ratio >= 0.75:
            failed_count = 1
        elif ratio >= 0.60:
            failed_count = 2
        else:
            failed_count = 3

    bidding_round = failed_count + 1
    return bidding_round, failed_count, discount_rate

# Helper function to get colorful styling and info for Grade X cards
def get_risk_card_style(reason_str):
    # Default
    border_color = "#dc2626"      # red
    bg_gradient = "linear-gradient(135deg, #fff5f5 0%, #ffe3e3 100%)"
    text_color = "#991b1b"
    badge_text = "🚨 치명적 위험"
    
    reason_str = reason_str or ""
    if any(kw in reason_str for kw in ["지분", "대지권없음", "건물만", "토지만", "유치권"]):
        border_color = "#b91c1c"  # deep red
        bg_gradient = "linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)"
        text_color = "#9f1239"
        badge_text = "🧱 소유권/점유 하자"
    elif any(kw in reason_str for kw in ["인수", "선순위", "대항력", "임차권", "보증금 인수"]):
        border_color = "#ea580c"  # orange
        bg_gradient = "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)"
        text_color = "#c2410c"
        badge_text = "💰 인수 비용 리스크"
    elif any(kw in reason_str for kw in ["서류없음", "확인불가", "열람불가", "자료없음"]):
        border_color = "#4b5563"  # grey
        bg_gradient = "linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)"
        text_color = "#374151"
        badge_text = "⚠️ 정보 누락 리스크"
        
    return border_color, bg_gradient, text_color, badge_text

# Helper function to get the last synchronization date and time
def get_sync_timestamp():
    court_path = os.path.join(base_dir, "input_sources", "json", "court.json")
    onbid_path = os.path.join(base_dir, "input_sources", "json", "onbid.json")
    
    latest_time = 0
    if os.path.exists(court_path):
        latest_time = max(latest_time, os.path.getmtime(court_path))
    if os.path.exists(onbid_path):
        latest_time = max(latest_time, os.path.getmtime(onbid_path))
        
    if latest_time > 0:
        dt = datetime.datetime.fromtimestamp(latest_time)
        days_kr = ["월", "화", "수", "목", "금", "토", "일"]
        day_name = days_kr[dt.weekday()]
        return dt.strftime(f"%Y년 %m월 %d일 %H시 %M분 %S초 ({day_name}요일)")
    return "수집 기록 없음"

def sanitize_text(text):
    if not text:
        return ""
    import re
    s = str(text)
    
    # Remove escaped HTML tags and variants before we do any standard escaping
    bad_phrases = [
        "&amp;lt;/div&amp;gt;", "&amp;lt;div&amp;gt;",
        "&amp;lt;/div", "&amp;lt;div",
        "&lt;/div&gt;", "&lt;div&gt;",
        "&lt;/div", "&lt;div",
        "</div>", "<div>",
        "</ div>", "<div>",
        "</div", "<div",
        "&lt;br&gt;", "&lt;br /&gt;", "<br>", "<br/>", "<br />",
        "&amp;lt;br&amp;gt;"
    ]
    for bp in bad_phrases:
        s = s.replace(bp, " ")
        s = s.replace(bp.upper(), " ")
        
    # Also remove any HTML tag patterns
    s = re.sub(r'<[^>]*>', ' ', s)
    s = re.sub(r'&lt;[^&]*&gt;', ' ', s)
    s = re.sub(r'&amp;lt;[^&]*&amp;gt;', ' ', s)
    
    # Escape standard HTML specials for safe browser rendering
    s = s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;").replace("'", "&#x27;")
    
    # Clean up double spaces
    s = re.sub(r'\s+', ' ', s)
    return s.strip()


# Helper functions for validation & dynamic region filtering
def validate_realtime_data(db_name, path, count):
    """
    Validates if the dataset is fresh and contains real data.
    Returns: (is_realtime, status_message)
    """
    meta_path = path.replace(".json", "_meta.json")
    
    if not os.path.exists(path) or count == 0:
        return False, f"🚨 **{db_name} 실시간 데이터 누락**: 로컬 데이터베이스 파일이 비어있거나 존재하지 않습니다. 페이크(Mock) 데이터 사용은 불가능하며, 실시간 수집 연동에 장애가 있습니다."
        
    if not os.path.exists(meta_path):
        return False, f"⚠️ **{db_name} 실시간 메타 정보 없음**: 최근 수집 스크립트 실행 기록이 없어 실시간 데이터임을 보장할 수 없습니다."
        
    try:
        with open(meta_path, "r", encoding="utf-8") as f:
            meta = json.load(f)
            
        success = meta.get("success", False)
        timestamp_str = meta.get("timestamp", "")
        item_count = meta.get("item_count", 0)
        error_msg = meta.get("error_msg", "")
        
        if not success:
            return False, f"🚨 **{db_name} 최근 수집 실패**: 메타 파일에 수집 실패가 기록되었습니다. (오류: {error_msg}, 시도 시각: {timestamp_str}). 실시간 데이터가 아닙니다."
            
        if item_count == 0 or count == 0:
            return False, f"🚨 **{db_name} 데이터 건수 오류**: 적재된 데이터가 0건입니다. 실시간 수집 연동이 비정상적입니다."
            
        if timestamp_str:
            last_run = datetime.datetime.strptime(timestamp_str, "%Y-%m-%d %H:%M:%S")
            now = datetime.datetime.now()
            hours_elapsed = (now - last_run).total_seconds() / 3600.0
            
            # Since cron schedule is daily, allow 36 hours for daily run window
            if hours_elapsed > 36.0:
                return False, f"⚠️ **{db_name} 데이터 만료 (최신 아님)**: 마지막 성공적인 수집 시점이 {timestamp_str} ({hours_elapsed:.1f}시간 전)으로, 36시간 기준을 초과하여 실시간 데이터가 아닙니다."
                
        return True, f"✅ **{db_name} 실시간 데이터 정상 연동**: {timestamp_str}에 정상 수집된 리얼 데이터 ({count}건)가 안전하게 연동되었습니다."
    except Exception as e:
        return False, f"🚨 **{db_name} 메타 파싱 오류**: {e}. 실시간 데이터 여부를 판단할 수 없습니다."

def address_matches_regions(address, selected_sigungus):
    if not selected_sigungus:
        return True
    clean_addr = address.replace("사용본거지:", "").strip()
    
    for sigungu_full in selected_sigungus:
        parts = sigungu_full.split()
        sido_part = parts[0]
        sigungu_part = " ".join(parts[1:])
        
        sido_matches = False
        if sido_part == "서울" and ("서울" in clean_addr or "특별시" in clean_addr):
            sido_matches = True
        elif sido_part == "경기" and ("경기" in clean_addr):
            sido_matches = True
        elif sido_part == "인천" and ("인천" in clean_addr):
            sido_matches = True
        elif sido_part == "부산" and ("부산" in clean_addr):
            sido_matches = True
        elif sido_part == "대구" and ("대구" in clean_addr):
            sido_matches = True
        elif sido_part == "광주" and ("광주" in clean_addr):
            sido_matches = True
        elif sido_part == "대전" and ("대전" in clean_addr):
            sido_matches = True
        elif sido_part == "울산" and ("울산" in clean_addr):
            sido_matches = True
        elif sido_part == "세종" and ("세종" in clean_addr):
            sido_matches = True
        elif sido_part == "강원" and ("강원" in clean_addr):
            sido_matches = True
        elif sido_part == "충북" and ("충북" in clean_addr or "충청북" in clean_addr):
            sido_matches = True
        elif sido_part == "충남" and ("충남" in clean_addr or "충청남" in clean_addr):
            sido_matches = True
        elif sido_part == "전북" and ("전북" in clean_addr or "전라북" in clean_addr):
            sido_matches = True
        elif sido_part == "전남" and ("전남" in clean_addr or "전라남" in clean_addr):
            sido_matches = True
        elif sido_part == "경북" and ("경북" in clean_addr or "경상북" in clean_addr):
            sido_matches = True
        elif sido_part == "경남" and ("경남" in clean_addr or "경상남" in clean_addr):
            sido_matches = True
        elif sido_part == "제주" and ("제주" in clean_addr):
            sido_matches = True
        elif sido_part in clean_addr:
            sido_matches = True
            
        if sido_matches and sigungu_part in clean_addr:
            return True
    return False

def address_matches_sido(address, selected_sido):
    if not selected_sido or selected_sido == "전국":
        return True
    clean_addr = address.replace("사용본거지:", "").strip()
    
    sido_aliases = {
        "서울": ["서울", "특별시"],
        "경기": ["경기", "경기도"],
        "인천": ["인천", "인천광역시"],
        "부산": ["부산", "부산광역시"],
        "대구": ["대구", "대구광역시"],
        "광주": ["광주", "광주광역시"],
        "대전": ["대전", "대전광역시"],
        "울산": ["울산", "울산광역시"],
        "세종": ["세종", "세종특별자치시"],
        "강원": ["강원", "강원도"],
        "충북": ["충북", "충청북도", "충청북"],
        "충남": ["충남", "충청남도", "충청남"],
        "전북": ["전북", "전라북도", "전라북"],
        "전남": ["전남", "전라남도", "전라남"],
        "경북": ["경북", "경상북도", "경상북"],
        "경남": ["경남", "경상남도", "경상남"],
        "제주": ["제주", "제주특별자치도"]
    }
    
    aliases = sido_aliases.get(selected_sido, [selected_sido])
    for alias in aliases:
        if alias in clean_addr:
            return True
    return False

# Static dictionary of all 17 Sidos and their Sigungus in South Korea
FULL_REGIONS = {
    "서울": ["강남구", "강동구", "강북구", "강서구", "관악구", "광진구", "구로구", "금천구", "노원구", "도봉구", "동대문구", "동작구", "마포구", "서대문구", "서초구", "성동구", "성북구", "송파구", "양천구", "영등포구", "용산구", "은평구", "종로구", "중구", "중랑구"],
    "부산": ["강서구", "금정구", "기장군", "남구", "동구", "동래구", "부산진구", "북구", "사상구", "사하구", "서구", "수영구", "연제구", "영도구", "중구", "해운대구"],
    "대구": ["남구", "달서구", "달성군", "동구", "북구", "서구", "수성구", "중구", "군위군"],
    "인천": ["강화군", "계양구", "남동구", "동구", "미추홀구", "부평구", "서구", "연수구", "옹진군", "중구"],
    "광주": ["광산구", "남구", "동구", "북구", "서구"],
    "대전": ["대덕구", "동구", "서구", "유성구", "중구"],
    "울산": ["남구", "동구", "북구", "울주군", "중구"],
    "세종": ["세종시"],
    "경기": [
        "가평군", "고양시 덕양구", "고양시 일산동구", "고양시 일산서구", "과천시", "광명시", "광주시", "구리시", 
        "군포시", "김포시", "남양주시", "동두천시", "부천시", "성남시 분당구", "성남시 수정구", "성남시 중원구", 
        "수원시 권선구", "수원시 영통구", "수원시 장안구", "수원시 팔달구", "시흥시", "안산시 단원구", 
        "안산시 상록구", "안성시", "안양시 동안구", "안양시 만안구", "양주시", "양평군", "여주시", 
        "연천군", "오산시", "용인시 기흥구", "용인시 수지구", "용인시 처인구", "의왕시", "의정부시", 
        "이천시", "파주시", "평택시", "포천시", "하남시", "화성시"
    ],
    "강원": [
        "강릉시", "고성군", "동해시", "삼척시", "속초시", "양구군", "양양군", "영월군", "원주시", 
        "인제군", "정선군", "철원군", "춘천시", "태백시", "평창군", "홍천군", "화천군", "횡성군"
    ],
    "충북": [
        "괴산군", "단양군", "보은군", "영동군", "옥천군", "음성군", "제천시", "증평군", "진천군", 
        "청주시 상당구", "청주시 서원구", "청주시 청원구", "청주시 흥덕구", "충주시"
    ],
    "충남": [
        "계룡시", "공주시", "금산군", "논산시", "당진시", "부여군", "서산시", "서천군", "아산시", 
        "예산군", "천안시 동남구", "천안시 서북구", "청양군", "태안군", "홍성군"
    ],
    "전북": [
        "고창군", "군산시", "김제시", "남원시", "무주군", "부안군", "순창군", "완주군", "익산시", 
        "임실군", "장수군", "전주시 덕진구", "전주시 완산구", "정읍시", "진안군"
    ],
    "전남": [
        "강진군", "고흥군", "곡성군", "광양시", "구례군", "나주시", "담양군", "목포시", "무안군", 
        "보성군", "순천시", "신안군", "여수시", "영광군", "영암군", "완도군", "장성군", "장흥군", 
        "진도군", "함평군", "해남군", "화순군"
    ],
    "경북": [
        "경산시", "경주시", "고령군", "구미시", "김천시", "문경시", "봉화군", "상주시", "성주군", 
        "안동시", "영덕군", "영양군", "영주시", "영천시", "예천군", "울릉군", "울진군", "의성군", 
        "청도군", "청송군", "칠곡군", "포항시 남구", "포항시 북구"
    ],
    "경남": [
        "거제시", "거창군", "고성군", "김해시", "남해군", "밀양시", "사천시", "산청군", "양산시", 
        "의령군", "진주시", "창녕군", "창원시 마산합포구", "창원시 마산회원구", "창원시 성산구", 
        "창원시 의창구", "창원시 진해구", "통영시", "하동군", "함안군", "함양군", "합천군"
    ],
    "제주": ["제주시", "서귀포시"]
}

# Inject custom premium CSS styling (including Mouse Hover Card animation styles)
render_html("""
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&family=Noto+Sans+KR:wght@300;400;700&display=swap');
    
    html, body, [class*="css"] {
        font-family: 'Noto Sans KR', 'Outfit', sans-serif;
    }
    
    /* Modern Glassmorphic Title Header */
    .title-container {
        background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #111827 100%);
        padding: 1.6rem 2.2rem;
        border-radius: 16px;
        color: white;
        margin-bottom: 2rem;
        box-shadow: 0 10px 30px rgba(15, 23, 42, 0.15);
        border: 1px solid rgba(99, 102, 241, 0.2);
        position: relative;
        overflow: hidden;
    }
    
    .title-container::after {
        content: "";
        position: absolute;
        top: -50%;
        right: -20%;
        width: 300px;
        height: 300px;
        background: radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, rgba(99, 102, 241, 0) 70%);
        pointer-events: none;
    }
    
    .title-flex {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 1.2rem;
    }
    
    .title-container h1 {
        font-size: 1.65rem;
        font-weight: 800;
        margin: 0;
        background: linear-gradient(135deg, #ffffff 0%, #cbd5e1 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        display: inline-flex;
        align-items: center;
        gap: 8px;
    }
    
    .version-tag {
        background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
        color: #ffffff;
        font-size: 0.8rem;
        font-weight: 700;
        padding: 4px 10px;
        border-radius: 20px;
        box-shadow: 0 0 12px rgba(79, 70, 229, 0.35);
        text-shadow: none;
        -webkit-text-fill-color: initial;
        display: inline-block;
        letter-spacing: 0.05em;
    }
    
    .title-container p {
        font-size: 0.88rem;
        margin: 0.4rem 0 0 0;
        color: #94a3b8;
        font-weight: 400;
    }
    
    .sync-time-badge {
        background: rgba(255, 255, 255, 0.07);
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 12px;
        padding: 8px 16px;
        font-size: 0.85rem;
        color: #cbd5e1;
        display: flex;
        align-items: center;
        gap: 8px;
        backdrop-filter: blur(5px);
    }
    
    .sync-dot {
        width: 8px;
        height: 8px;
        background-color: #10b981;
        border-radius: 50%;
        display: inline-block;
        box-shadow: 0 0 8px #10b981;
        animation: sync-pulse 2s infinite;
    }
    
    @keyframes sync-pulse {
        0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
        70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
        100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
    }
    
    /* Modern Status Cards */
    .status-card {
        padding: 1.8rem;
        border-radius: 16px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.02);
        margin-bottom: 2rem;
        border: 1px solid rgba(226, 232, 240, 0.8);
    }
    
    .status-normal {
        background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
        border-left: 6px solid #16a34a;
        color: #14532d;
    }
    
    .status-partial {
        background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
        border-left: 6px solid #d97706;
        color: #78350f;
    }
    
    .status-fail {
        background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
        border-left: 6px solid #dc2626;
        color: #7f1d1d;
        animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
        0% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.4); }
        70% { box-shadow: 0 0 0 10px rgba(220, 38, 38, 0); }
        100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0); }
    }
    
    /* Sleek KPI Cards */
    .kpi-container {
        display: flex;
        gap: 1.5rem;
        margin-bottom: 2.5rem;
    }
    
    .kpi-card {
        flex: 1;
        background: rgba(255, 255, 255, 0.8);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        padding: 1.8rem;
        border-radius: 20px;
        box-shadow: 0 4px 24px rgba(15, 23, 42, 0.04);
        border: 1px solid rgba(226, 232, 240, 0.8);
        text-align: center;
        transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    }
    
    .kpi-card:hover {
        transform: translateY(-6px);
        box-shadow: 0 20px 40px rgba(99, 102, 241, 0.08);
        border-color: rgba(99, 102, 241, 0.35);
    }
    
    .kpi-val {
        font-size: 2.6rem;
        font-weight: 800;
        background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #7c3aed 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-top: 0.6rem;
        font-family: 'Outfit', sans-serif;
    }
    
    .kpi-label {
        font-size: 0.95rem;
        color: #64748b;
        text-transform: uppercase;
        font-weight: 700;
        letter-spacing: 0.05em;
    }
    
    /* Curated Harmonic Badges */
    .badge {
        padding: 6px 14px;
        border-radius: 8px;
        font-weight: 700;
        font-size: 0.85em;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
        display: inline-block;
    }
    
    .badge-a { background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); color: #1e40af; border: 1px solid #bfdbfe; }
    .badge-b { background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); color: #15803d; border: 1px solid #bbf7d0; }
    .badge-c { background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); color: #b45309; border: 1px solid #fde68a; }
    .badge-d { background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%); color: #7e22ce; border: 1px solid #e9d5ff; }
    .badge-e { background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); color: #475569; border: 1px solid #e2e8f0; }
    .badge-x { background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); color: #b91c1c; border: 1px solid #fecaca; }
    
    .criteria-box {
        background-color: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 1.5rem;
        margin-bottom: 2rem;
        font-size: 0.95rem;
        color: #334155;
        line-height: 1.6;
    }
    
    .criteria-title {
        font-weight: 700;
        color: #0f172a;
        margin-bottom: 0.75rem;
        font-size: 1.1rem;
    }
    
    /* Interactive Hover Cards */
    .hover-card {
        border: 1px solid #e2e8f0;
        border-radius: 16px;
        padding: 1.5rem;
        margin-bottom: 1.2rem;
        background-color: #ffffff;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
        transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        position: relative;
        overflow: hidden;
    }
    
    .card-court { border-left: 5px solid #2563eb !important; }
    .card-onbid { border-left: 5px solid #10b981 !important; }
    .card-private { border-left: 5px solid #64748b !important; }
    
    .hover-card:hover {
        border-color: rgba(99, 102, 241, 0.35);
        box-shadow: 0 15px 35px rgba(99, 102, 241, 0.08);
        transform: translateY(-3px) scale(1.002);
    }
    
    .hover-summary {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .hover-label-indicator {
        font-size: 0.8rem;
        font-weight: 700;
        color: #2563eb;
        background-color: #eff6ff;
        border: 1px solid #bfdbfe;
        padding: 6px 14px;
        border-radius: 8px;
        transition: all 0.25s ease;
    }
    
    .hover-card:hover .hover-label-indicator {
        color: #334155;
        background-color: #f1f5f9;
        border-color: #cbd5e1;
    }
    
    .hover-detail {
        max-height: 0;
        opacity: 0;
        transition: max-height 0.5s ease, opacity 0.5s ease, margin-top 0.5s ease;
        overflow: hidden;
        margin-top: 0;
    }
    
    .hover-card:hover .hover-detail {
        max-height: 2000px;
        opacity: 1;
        margin-top: 1.4rem;
        border-top: 1px dashed #e2e8f0;
        padding-top: 1.4rem;
    }
    
    /* Elegant styling for sidebar buttons */
    /* Primary buttons (Matching button) - Premium Soft Blue Pastel */
    div.stButton > button[data-testid="stBaseButton-primary"] {
        background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%) !important;
        color: #0369a1 !important;
        border: 1px solid #bae6fd !important;
        font-weight: 700 !important;
        border-radius: 10px !important;
        padding: 0.6rem 1.5rem !important;
        box-shadow: 0 4px 12px rgba(3, 105, 161, 0.08) !important;
        transition: all 0.25s ease !important;
        width: 100%;
    }
    
    div.stButton > button[data-testid="stBaseButton-primary"]:hover {
        background: linear-gradient(135deg, #bae6fd 0%, #7dd3fc 100%) !important;
        color: #02507d !important;
        border-color: #7dd3fc !important;
        box-shadow: 0 6px 18px rgba(3, 105, 161, 0.15) !important;
        transform: translateY(-1px);
    }
 
    /* Secondary buttons (Reset button) - Soft Slate Grey */
    div.stButton > button[data-testid="stBaseButton-secondary"] {
        background: #f8fafc !important;
        color: #64748b !important;
        border: 1px solid #e2e8f0 !important;
        font-weight: 600 !important;
        border-radius: 8px !important;
        padding: 0.5rem 1.2rem !important;
        box-shadow: 0 1px 2px rgba(0,0,0,0.02) !important;
        transition: all 0.25s ease !important;
        width: 100%;
    }
    
    div.stButton > button[data-testid="stBaseButton-secondary"]:hover {
        background: #f1f5f9 !important;
        color: #334155 !important;
        border-color: #cbd5e1 !important;
        box-shadow: 0 2px 4px rgba(0,0,0,0.04) !important;
    }
 
    /* Main Reset button in sidebar - High visibility warning style (soft rose/red) */
    .stSidebar div.stButton > button[data-testid="stBaseButton-secondary"]:not([key*="sigungu"]):not([key*="ptype"]) {
        background: linear-gradient(135deg, #fff5f5 0%, #ffe3e3 100%) !important;
        color: #e03131 !important;
        border: 1.5px solid #ffc9c9 !important;
        font-weight: 700 !important;
        font-size: 0.95rem !important;
        border-radius: 8px !important;
        padding: 0.6rem 1.2rem !important;
        box-shadow: 0 2px 8px rgba(224, 49, 49, 0.08) !important;
        transition: all 0.25s ease !important;
        width: 100% !important;
    }
    
    .stSidebar div.stButton > button[data-testid="stBaseButton-secondary"]:not([key*="sigungu"]):not([key*="ptype"]):hover {
        background: linear-gradient(135deg, #ffe3e3 0%, #ffd8d8 100%) !important;
        color: #c92a2a !important;
        border-color: #ffa8a8 !important;
        box-shadow: 0 4px 12px rgba(224, 49, 49, 0.15) !important;
    }
 
    /* Click micro-animation feedback (버튼 클릭 시 물리적 하강 피드백) */
    div.stButton > button:active {
        transform: translateY(1px) scale(0.985) !important;
        box-shadow: 0 1px 2px rgba(0,0,0,0.05) !important;
        transition: all 0.05s ease !important;
    }
 
    /* Make the sidebar container border and background highly visible and premium */
    .stSidebar div[data-testid="stVerticalBlockBorderWrapper"] {
        border: 1.5px solid #cbd5e1 !important; /* Darker, clearer border */
        border-radius: 14px !important;
        background-color: #f8fafc !important; /* Soft premium slate background */
        padding: 1.2rem !important;
        box-shadow: 0 4px 20px rgba(15, 23, 42, 0.04) !important;
        margin-bottom: 1.5rem !important;
    }
 
    /* Custom title for the sidebar card */
    .sidebar-card-title {
        font-size: 1.25rem !important;
        font-weight: 800 !important;
        color: #0f172a !important;
        border-bottom: 2px solid #3b82f6 !important;
        padding-bottom: 10px !important;
        margin-bottom: 18px !important;
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
        letter-spacing: -0.02em;
    }
 
    /* High contrast text elements inside the sidebar container to make filters highly visible */
    .stSidebar [data-testid="stVerticalBlockBorderWrapper"] label p {
        font-weight: 700 !important;
        color: #0f172a !important;
        font-size: 0.9rem !important;
    }
 
    /* Style the expander title/summary inside the container */
    .stSidebar [data-testid="stVerticalBlockBorderWrapper"] details summary p {
        font-weight: 700 !important;
        color: #1e293b !important;
        font-size: 0.88rem !important;
    }
 
    /* Checkbox labels styling inside the container */
    .stSidebar [data-testid="stVerticalBlockBorderWrapper"] [data-testid="stCheckbox"] label span {
        font-weight: 500 !important;
        color: #334155 !important;
        font-size: 0.85rem !important;
    }
 
    /* Tactile feedback for HTML link buttons (HTML 링크 버튼 클릭 효과) */
    a[href*="courtauction"] {
        transition: all 0.25s ease !important;
    }
    a[href*="courtauction"]:hover {
        background-color: #1d4ed8 !important;
        transform: translateY(-1px) !important;
        box-shadow: 0 6px 15px rgba(37,99,235,0.25) !important;
    }
    a[href*="courtauction"]:active {
        transform: translateY(1px) scale(0.98) !important;
        box-shadow: 0 2px 4px rgba(37,99,235,0.1) !important;
    }
 
    /* Force columns in the sidebar to stay side-by-side in one row without stacking */
    .stSidebar [data-testid="stHorizontalBlock"] {
        flex-direction: row !important;
        flex-wrap: nowrap !important;
        align-items: center !important;
        gap: 0.5rem !important;
    }
 
    .stSidebar [data-testid="stHorizontalBlock"] > div {
        width: 50% !important;
        min-width: unset !important;
        flex: 1 1 0% !important;
    }
 
    /* Style for select/deselect utility buttons inside sidebar columns */
    .stSidebar [data-testid="stHorizontalBlock"] button[data-testid="stBaseButton-secondary"] {
        background: #f8fafc !important;
        color: #64748b !important;
        border: 1px solid #e2e8f0 !important;
        font-weight: 600 !important;
        font-size: 0.75rem !important;
        padding: 4px 4px !important;
        height: 28px !important;
        min-height: unset !important;
        box-shadow: 0 1px 2px rgba(0,0,0,0.02) !important;
        border-radius: 6px !important;
        width: 100% !important;
        line-height: 1.2 !important;
        transition: all 0.25s ease !important;
        white-space: nowrap !important;
    }
 
    .stSidebar [data-testid="stHorizontalBlock"] button[data-testid="stBaseButton-secondary"]:hover {
        background: #f1f5f9 !important;
        color: #334155 !important;
        border-color: #cbd5e1 !important;
        box-shadow: 0 2px 4px rgba(0,0,0,0.04) !important;
    }
 
    /* Responsive grid inside hover cards */
    .hover-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.5rem;
    }
    
    /* Mobile responsive layouts & media queries */
    @media (max-width: 768px) {
        .kpi-container {
            flex-direction: column !important;
            gap: 1rem !important;
        }
        
        .hover-grid {
            grid-template-columns: 1fr !important;
            gap: 0.8rem !important;
        }
        
        .title-container h1 {
            font-size: 1.25rem !important;
        }
        .title-container p {
            font-size: 0.75rem !important;
        }
        .title-container {
            padding: 1.0rem 1.2rem !important;
        }
        
        .status-card {
            padding: 1.0rem !important;
            margin-bottom: 1.2rem !important;
        }
        .status-card h4 {
            font-size: 1.0rem !important;
            line-height: 1.4 !important;
        }
        .status-card p {
            font-size: 0.85rem !important;
            line-height: 1.4 !important;
        }
        
        .kpi-card {
            margin-bottom: 1.0rem !important;
            padding: 1.2rem 1.5rem !important;
        }
        .kpi-val {
            font-size: 2.0rem !important;
        }
        
        .criteria-box {
            padding: 1.0rem !important;
            font-size: 0.85rem !important;
        }
        
        .hover-card {
            padding: 1.0rem !important;
        }
        
        .hover-summary {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 0.6rem !important;
        }
        .hover-summary > div {
            display: flex;
            flex-direction: column;
            gap: 0.4rem;
        }
        .hover-summary > div > span {
            margin-right: 0 !important;
            margin-bottom: 0.2rem;
            display: inline-block;
        }
        .hover-summary > div > strong {
            display: block;
        }
        .hover-summary > div > span:last-child {
            margin-left: 0 !important;
            display: block;
            font-size: 0.85em;
        }
        .hover-label-indicator {
            width: 100% !important;
            text-align: center !important;
        }
    }
    </style>
""")

# Display last sync time
sync_time = get_sync_timestamp()

# Application Header
render_html(f"""
    <div class="title-container">
        <div class="title-flex">
            <div>
                <h1>🏠 부동산 경매 추천 시스템 <span style="font-size: 0.55em; font-weight: normal; opacity: 0.7; margin-left: 8px; vertical-align: middle;">v1.0</span></h1>
                <p>GitHub Actions 기반의 매일 새벽 자동 스크래핑과 사설 보조 데이터 수동 보완 기능의 시너지</p>
            </div>
            <div class="sync-time-badge">
                <span class="sync-dot"></span>
                <span>마지막 동기화: {sync_time}</span>
            </div>
        </div>
    </div>
""")

# Application Header Info Box: Onbid Online Bidding Highlight
render_html("""
    <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border: 2px solid #10b981; border-radius: 12px; padding: 1.4rem 1.8rem; margin-bottom: 2rem; box-shadow: 0 10px 25px rgba(16,185,129,0.1); display: flex; align-items: center; gap: 20px;">
        <div style="font-size: 2.8rem;">🏢</div>
        <div>
            <h4 style="margin: 0; color: #047857; font-size: 1.25rem; font-weight: 800; display: flex; align-items: center; gap: 8px;">
                💡 [핵심 차이] 법원 경매 vs 온비드 공매 입찰방식 비교
            </h4>
            <p style="margin: 0.5rem 0 0 0; color: #065f46; font-size: 0.95rem; line-height: 1.6;">
                • ⚖️ <strong>대법원 법원경매:</strong> 당일 아침 지정된 법원 법정에 <strong>직접 물리적으로 방문</strong>해야만 입찰에 참여할 수 있습니다.<br/>
                • 🏢 <strong>캠코 온비드 공매:</strong> 법원에 갈 필요 전혀 없이, 집이나 사무실에서 스마트폰 또는 PC를 통해 <strong>100% 인터넷 입찰(onbid.co.kr)</strong>로 편리하게 참여가 가능합니다!
            </p>
        </div>
    </div>
""")

# Load official local files (No raw URLs to guarantee real local database state)
def load_local_datasets():
    court_list = []
    onbid_list = []
    
    court_path = os.path.join(base_dir, "input_sources", "json", "court.json")
    if os.path.exists(court_path):
        try:
            with open(court_path, "r", encoding="utf-8") as f:
                court_list = json.load(f)
        except Exception as e:
            st.error(f"대법원 데이터 로드 실패: {e}")
            
    onbid_path = os.path.join(base_dir, "input_sources", "json", "onbid.json")
    if os.path.exists(onbid_path):
        try:
            with open(onbid_path, "r", encoding="utf-8") as f:
                onbid_list = json.load(f)
        except Exception as e:
            st.error(f"온비드 데이터 로드 실패: {e}")
            
    return court_list, onbid_list

# Load the real-only local databases
court_raw, onbid_raw = load_local_datasets()

# Helper for background updater thread
def run_background_update():
    lock_path = os.path.join(base_dir, "input_sources", "json", "scraper.lock")
    try:
        print("[Background Update] Starting background scrape...")
        from tools.onbid_fetcher import fetch_onbid_data
        from tools.court_scraper import scrape_court_data
        fetch_onbid_data()
        scrape_court_data()
        print("[Background Update] Background scrape finished.")
    except Exception as e:
        print(f"[Background Update] Error: {e}")
    finally:
        if os.path.exists(lock_path):
            try:
                os.remove(lock_path)
            except Exception:
                pass

def trigger_background_update_if_needed():
    court_path = os.path.join(base_dir, "input_sources", "json", "court.json")
    onbid_path = os.path.join(base_dir, "input_sources", "json", "onbid.json")
    lock_path = os.path.join(base_dir, "input_sources", "json", "scraper.lock")
    
    needs_update = False
    now = datetime.datetime.now()
    
    # Check if lock file exists
    if os.path.exists(lock_path):
        try:
            mtime = datetime.datetime.fromtimestamp(os.path.getmtime(lock_path))
            # If lock is older than 1 hour, treat it as stale and allow execution
            if (now - mtime).total_seconds() > 3600:
                print("[Background Update] Stale lock file found. Removing.")
                os.remove(lock_path)
            else:
                print("[Background Update] Scraper is already running (locked). Skipping.")
                return
        except Exception:
            pass
            
    for path in [court_path, onbid_path]:
        if not os.path.exists(path):
            needs_update = True
            break
        mtime = datetime.datetime.fromtimestamp(os.path.getmtime(path))
        if (now - mtime).total_seconds() > 86400:  # 24 hours
            needs_update = True
            break
            
    if needs_update:
        if "update_thread" not in st.session_state or not st.session_state["update_thread"].is_alive():
            # Create lock file
            try:
                with open(lock_path, "w") as lf:
                    lf.write(now.strftime("%Y-%m-%d %H:%M:%S"))
            except Exception:
                pass
            t = threading.Thread(target=run_background_update, daemon=True)
            st.session_state["update_thread"] = t
            t.start()
            st.toast("🔄 24시간 지난 오래된 데이터를 백그라운드에서 자동 업데이트 중입니다...", icon="⚙️")

# Trigger background update check
trigger_background_update_if_needed()

# Callback to reset search filters safely before widget instantiation
def reset_filters():
    st.session_state["sel_sido_box"] = "전국"
    st.session_state["sel_source"] = "전체보기 (법원 경매 + 온비드 공매)"
    st.session_state["search_query_box"] = ""
    for k in list(st.session_state.keys()):
        if k.startswith("cb_ptype_"):
            st.session_state[k] = True
        if k.startswith("cb_sigungu_"):
            st.session_state[k] = False
    st.session_state["sel_budget"] = "제한 없음"
    st.session_state["sel_time"] = "3개월 이내"
    st.session_state["prev_sido"] = "전국"

# Initialize Session States
if "private_data" not in st.session_state:
    st.session_state["private_data"] = []
if "uploaded_filename" not in st.session_state:
    st.session_state["uploaded_filename"] = ""

# Sidebar Setup
with st.sidebar.container(border=True):
    st.markdown('<div class="sidebar-card-title">🔍 상세 검색 조건 설정</div>', unsafe_allow_html=True)
    
    # 🔍 통합 키워드 검색창 추가
    search_query = st.text_input(
        "🔍 통합 키워드 검색 (실시간)",
        value="",
        placeholder="예: 평택시, 아파트, 자동차, 2022타경",
        key="search_query_box",
        help="주소, 사건/관리번호, 물건 유형, 설명/비고 텍스트에서 실시간으로 키워드를 검색합니다."
    )
    
    # Reset Search Filter button at the top of the container using safe callback
    if st.button("🔄 필터 초기화", key="reset_filter_top", help="검색 필터를 전국 및 3개월 이내 전체보기 상태로 복원합니다.", type="secondary", on_click=reset_filters):
        st.rerun()

    ptype_opts = [
        "아파트", "다세대 (빌라/연립)", "단독/다가구/전원주택", "오피스텔", 
        "상가/점포/근린상가", "토지/대지/임야", "공장/창고", 
        "[동산] 자동차 / 운송장비", "[동산] 기계 / 장비", "[동산] 물품 / 예술품", 
        "[동산] 유가증권 / 회원권", "기타/미분류"
    ]

    # Initialize widget session states for resetting
    if "sel_sido_box" not in st.session_state:
        st.session_state["sel_sido_box"] = "전국"
    if "sel_source" not in st.session_state:
        st.session_state["sel_source"] = "전체보기 (법원 경매 + 온비드 공매)"
    if "sel_budget" not in st.session_state:
        st.session_state["sel_budget"] = "제한 없음"
    if "sel_time" not in st.session_state:
        st.session_state["sel_time"] = "3개월 이내"

    # Initialize property type checkboxes to True (all selected by default, Excel style)
    for opt in ptype_opts:
        cb_key = f"cb_ptype_{opt}"
        if cb_key not in st.session_state:
            st.session_state[cb_key] = True

    # 💡 초보자를 위한 안내 가이드 카드 추가
    st.info(
        "💡 **초보자 가이드**\n\n"
        "처음이시라면 기본 설정 상태에서 아래의 **[매칭 추천 시작]** 버튼을 바로 누르셔도 좋습니다. "
        "기본적으로 최근 3개월 내의 모든 추천 매물을 보여줍니다."
    )

    # 0. Select Source (All, Court, Onbid)
    selected_source = st.selectbox(
        "⚖️ 물건 출처 선택",
        ["전체보기 (법원 경매 + 온비드 공매)", "대법원 법원경매만 보기", "캠코 온비드 공매만 보기"],
        key="sel_source",
        help="조회하고자 하는 매물의 공식 수집망 출처를 필터링합니다."
    )

    st.markdown("---")

    # 1. Select metropolitan/province (Sido)
    selected_sido = st.selectbox(
        "📍 1단계: 관심 지역(시/도) 선택", 
        ["전국"] + list(FULL_REGIONS.keys()), 
        key="sel_sido_box",
        help="부동산이 위치한 특별시, 광역시, 도 단위 행정구역을 선택합니다. '전국'을 선택하시면 우리나라 전체 매물을 검색합니다."
    )
    selected_sidos = ["전국"] if selected_sido == "전국" else [selected_sido]

    # Detect change in Sido and reset Sigungu choice to prevent value mismatch crash
    if "prev_sido" not in st.session_state:
        st.session_state["prev_sido"] = selected_sido

    if st.session_state["prev_sido"] != selected_sido:
        # Reset all sigungu checkbox values to False
        for k in list(st.session_state.keys()):
            if k.startswith("cb_sigungu_"):
                st.session_state[k] = False
        st.session_state["prev_sido"] = selected_sido

    # 2. Dynamically resolve Sigungu options based on selected Sidos
    sigungu_opts = []
    if selected_sido == "전국":
        for sd in FULL_REGIONS:
            sigungu_opts.extend([f"{sd} {sg}" for sg in FULL_REGIONS[sd]])
    else:
        sigungu_opts.extend([f"{selected_sido} {sg}" for sg in FULL_REGIONS[selected_sido]])
    sigungu_opts = sorted(sigungu_opts)

    selected_sigungus = []
    if selected_sido == "전국":
        st.info("💡 전국 단위 검색 중입니다. 특정 시/도를 선택하시면 세부 시/군/구 체크박스 필터가 나타납니다.")
    else:
        with st.expander(f"📍 2단계: {selected_sido} 세부 지역 선택 (중복 설정)", expanded=True):
            col_sg1, col_sg2 = st.columns(2)
            with col_sg1:
                if st.button("전체선택", key="btn_sigungu_all"):
                    for opt in sigungu_opts:
                        st.session_state[f"cb_sigungu_{opt}"] = True
            with col_sg2:
                if st.button("전체해제", key="btn_sigungu_none"):
                    for opt in sigungu_opts:
                        st.session_state[f"cb_sigungu_{opt}"] = False
                    
            with st.container(height=240):
                for opt in sigungu_opts:
                    cb_key = f"cb_sigungu_{opt}"
                    if cb_key not in st.session_state:
                        st.session_state[cb_key] = False
                    is_checked = st.checkbox(opt, key=cb_key)
                    if is_checked:
                        selected_sigungus.append(opt)

    # 3. Budget Upper Limit (Single Selectbox)
    budget_opts = ["5천만 원", "1억 원", "2억 원", "3억 원", "5억 원", "7억 원", "10억 원", "15억 원", "20억 원", "30억 원", "제한 없음"]
    selected_budget = st.selectbox(
        "💰 3단계: 최대 매입 예산 설정", 
        budget_opts, 
        index=len(budget_opts)-1, 
        key="sel_budget",
        help="경매나 공매의 최저 입찰가격 상한선을 설정합니다. 이 가격 이하로 시작하는 안전한 매물만 필터링되어 나타납니다."
    )

    # 4. Bidding Date Window (Single Select)
    time_opts = ["1개월 이내", "3개월 이내", "6개월 이내", "1년 이내", "2년 이내", "3년 이내", "5년 이내", "제한 없음"]
    selected_timeline = st.selectbox(
        "📅 4단계: 입찰 마감 기한 설정", 
        time_opts, 
        key="sel_time",
        help="실제 법원에 가서 입찰하거나 온비드로 입찰서를 제출해야 하는 마감기한(매각기일)이 남은 기간입니다. 보통 '3개월 이내'를 추천합니다."
    )

    # 5. Preferred Property Type
    with st.expander("🏢 5단계: 부동산 종류 선택 (중복 설정)", expanded=False):
        col_pt1, col_pt2 = st.columns(2)
        with col_pt1:
            if st.button("전체선택", key="btn_ptype_all"):
                for opt in ptype_opts:
                    st.session_state[f"cb_ptype_{opt}"] = True
        with col_pt2:
            if st.button("전체해제", key="btn_ptype_none"):
                for opt in ptype_opts:
                    st.session_state[f"cb_ptype_{opt}"] = False

        selected_ptypes = []
        for opt in ptype_opts:
            cb_key = f"cb_ptype_{opt}"
            if cb_key not in st.session_state:
                st.session_state[cb_key] = True
            is_checked = st.checkbox(opt, key=cb_key)
            if is_checked:
                selected_ptypes.append(opt)

    # 6. Display Limits to prevent browser crash
    st.markdown("---")
    st.subheader("📊 화면 표시 개수 설정")
    display_limit = st.slider(
        "추천 매물 표시 개수", 
        min_value=5, 
        max_value=100, 
        value=20, 
        step=5,
        key="display_limit"
    )
    display_filtered_limit = st.slider(
        "위험 매물 표시 개수", 
        min_value=5, 
        max_value=50, 
        value=10, 
        step=5,
        key="display_filtered_limit"
    )

    # Search trigger button (Primary, soft blue styled)
    if st.button("🔍 매칭 추천 시작 / 조건 반영", type="primary"):
        st.toast("⚡ 매칭 조건이 실시간 반영되었습니다!", icon="✅")


# Process parameters based on selections
def get_ptype_keywords(selected_types):
    kws = []
    for sel_type in selected_types:
        if sel_type == "다세대 (빌라/연립)":
            kws.extend(["다세대", "빌라", "연립", "다세대주택", "연립주택"])
        elif sel_type == "단독/다가구/전원주택":
            kws.extend(["단독", "다가구", "주택", "단독주택", "전원주택"])
        elif sel_type == "상가/점포/근린상가":
            kws.extend(["상가", "점포", "근린", "상업", "근린생활시설"])
        elif sel_type == "토지/대지/임야":
            kws.extend(["토지", "대지", "임야", "땅"])
        elif sel_type == "공장/창고":
            kws.extend(["공장", "창고"])
        elif sel_type == "아파트":
            kws.append("아파트")
        elif sel_type == "오피스텔":
            kws.append("오피스텔")
        elif sel_type == "[동산] 자동차 / 운송장비":
            kws.extend(["자동차", "운송장비", "차량", "승용차", "승합차", "화물차", "이륜차", "특수차", "선박", "항공기"])
        elif sel_type == "[동산] 기계 / 장비":
            kws.extend(["기계", "장비", "건설기계", "의료장비", "설비", "기계기구"])
        elif sel_type == "[동산] 물품 / 예술품":
            kws.extend(["물품", "예술품", "골동품", "귀금속", "보석", "시계", "명품", "가구", "의류", "가전", "사무용품"])
        elif sel_type == "[동산] 유가증권 / 회원권":
            kws.extend(["유가증권", "회원권", "주식", "채권", "콘도", "골프회원권", "지분증권"])
        else:
            kws.extend(["기타", "미분류"])
    return kws

budget_map = {
    "5천만 원": 50000000,
    "1억 원": 100000000,
    "2억 원": 200000000,
    "3억 원": 300000000,
    "5억 원": 500000000,
    "7억 원": 700000000,
    "10억 원": 1000000000,
    "15억 원": 1500000000,
    "20억 원": 2000000000,
    "30억 원": 3000000000,
    "제한 없음": 10000000000000
}

time_map = {
    "1개월 이내": 30,
    "3개월 이내": 90,
    "6개월 이내": 180,
    "1년 이내": 365,
    "2년 이내": 730,
    "3년 이내": 1095,
    "5년 이내": 1825,
    "제한 없음": 99999
}

# Apply parameters instantly
budget_val = budget_map.get(selected_budget, 10000000000000)
    
time_val = time_map.get(selected_timeline, 99999)
active_regions = selected_sigungus
active_ptypes = selected_ptypes
preferred_ptype_keywords = get_ptype_keywords(selected_ptypes)
filter_sido = selected_sido


# File Upload Section in Sidebar (Outside form)
st.sidebar.markdown("---")
st.sidebar.subheader("📤 사설 경매 파일 수동 업로드 (선택)")
uploaded_file = st.sidebar.file_uploader(
    "사설 일정표(Excel/CSV) 업로드", 
    type=["csv", "xls", "xlsx"]
)

if uploaded_file is not None:
    if st.session_state["uploaded_filename"] != uploaded_file.name:
        try:
            parsed_data = parse_uploaded_file(uploaded_file, uploaded_file.name)
            st.session_state["private_data"] = parsed_data
            st.session_state["uploaded_filename"] = uploaded_file.name
            st.sidebar.success(f"성공적으로 {len(parsed_data)}건의 사설 데이터를 추출 및 맵핑하였습니다!")
        except Exception as e:
            st.sidebar.error(f"파일 처리 오류: {e}")

# Check Reset Upload button
if st.sidebar.button("업로드 파일 초기화"):
    st.session_state["private_data"] = []
    st.session_state["uploaded_filename"] = ""
    st.rerun()

# Deduplication and Merging logic
def merge_pools(court_list, onbid_list, private_list):
    merged = {}
    
    # Merge Official datasets first
    for item in court_list + onbid_list:
        addr = str(item.get("address", "")).strip()
        if addr:
            merged[addr] = item.copy()
            
    # Merge private items
    for item in private_list:
        addr = str(item.get("address", "")).strip()
        if not addr:
            continue
            
        if addr in merged:
            official_item = merged[addr]
            desc_ext = item.get("desc", "")
            notes_ext = item.get("notes", "")
            
            if desc_ext:
                official_item["desc"] = (official_item.get("desc", "") + f" [사설비고: {desc_ext}]").strip()
            if notes_ext:
                official_item["notes"] = (official_item.get("notes", "") + f" [사설참고: {notes_ext}]").strip()
        else:
            new_item = item.copy()
            new_item["source"] = "private"
            merged[addr] = new_item
            
    return list(merged.values())

court_count = len(court_raw)
onbid_count = len(onbid_raw)
private_max = len(st.session_state["private_data"])

# Calculate Data Completeness Sensor
status, status_message, ratio = check_completeness(court_count, onbid_count, private_max)

# Rollover logic application:
if status == 'FAIL' and private_max > 0:
    recommendation_pool = st.session_state["private_data"].copy()
else:
    recommendation_pool = merge_pools(court_raw, onbid_raw, st.session_state["private_data"])

# Load Rules for Hard Filter
rules = load_rules()

# Process Pool: run Hard Filter and Soft Score
recommended_list = []
filtered_list = []

for item in recommendation_pool:
    # 0. Exclude sold/completed items
    text_to_check = f"{item.get('address', '')} {item.get('desc', '')} {item.get('notes', '')} {item.get('item_id', '')}".lower()
    if any(kw in text_to_check for kw in ["낙찰", "매각결정", "종결"]):
        continue

    is_passed, reasons = evaluate_hardfilter(item, rules)
    
    if not is_passed:
        item_copy = item.copy()
        item_copy["grade"] = "X"
        item_copy["score"] = 0
        reason_str = ", ".join([f"{cat}({', '.join(kws)})" for cat, kws in reasons.items()])
        item_copy["filter_reason"] = reason_str
        filtered_list.append(item_copy)
    else:
        score, grade, breakdown = compute_softscore(
            item, 
            budget_max=budget_val, 
            time_days=time_val, 
            preferred_region="상관없음", 
            preferred_ptype="상관없음" 
        )
        
        item_copy = item.copy()
        item_copy["score"] = score
        item_copy["grade"] = grade
        item_copy["remaining_days"] = breakdown.get("remaining_days", 9999)
        item_copy["score_breakdown"] = breakdown
        recommended_list.append(item_copy)

# --- STRICT FILTERING BASED ON SEARCH WIDGETS ---
strictly_matched_recommended = []
strictly_matched_filtered = []

for item in recommended_list:
    # 0. Source Filter Check
    if selected_source == "대법원 법원경매만 보기" and item.get("source") != "court":
        continue
    if selected_source == "캠코 온비드 공매만 보기" and item.get("source") != "onbid":
        continue

    # 0.1 Unified Keyword Search
    search_query_clean = search_query.strip().lower()
    if search_query_clean:
        match_text = f"{item.get('address', '')} {item.get('item_id', '')} {item.get('ptype', '')} {item.get('desc', '')} {item.get('notes', '')}".lower()
        words = search_query_clean.split()
        if not all(word in match_text for word in words):
            continue

    price = item.get("price", 0)
    address = item.get("address", "")
    ptype = item.get("ptype", "")
    remaining_days = item.get("remaining_days", 9999)
    
    if price > budget_val:
        continue
    if remaining_days > time_val:
        continue
    if filter_sido != "전국":
        if not address_matches_sido(address, filter_sido):
            continue
    if active_regions:
        if not address_matches_regions(address, active_regions):
            continue
    if active_ptypes:
        if not any(kw in ptype for kw in preferred_ptype_keywords):
            continue
            
    strictly_matched_recommended.append(item)

for item in filtered_list:
    # 0. Source Filter Check
    if selected_source == "대법원 법원경매만 보기" and item.get("source") != "court":
        continue
    if selected_source == "캠코 온비드 공매만 보기" and item.get("source") != "onbid":
        continue

    # 0.1 Unified Keyword Search
    search_query_clean = search_query.strip().lower()
    if search_query_clean:
        match_text = f"{item.get('address', '')} {item.get('item_id', '')} {item.get('ptype', '')} {item.get('desc', '')} {item.get('notes', '')}".lower()
        words = search_query_clean.split()
        if not all(word in match_text for word in words):
            continue

    price = item.get("price", 0)
    address = item.get("address", "")
    ptype = item.get("ptype", "")
    
    if price > budget_val:
        continue
    if filter_sido != "전국":
        if not address_matches_sido(address, filter_sido):
            continue
    if active_regions:
        if not address_matches_regions(address, active_regions):
            continue
    if active_ptypes:
        if not any(kw in ptype for kw in preferred_ptype_keywords):
            continue
            
    strictly_matched_filtered.append(item)

# Sort Recommended items
strictly_matched_recommended = sorted(strictly_matched_recommended, key=lambda x: (-x["score"], x["remaining_days"]))

# Perform real-time data validation
court_path = os.path.join(base_dir, "input_sources", "json", "court.json")
onbid_path = os.path.join(base_dir, "input_sources", "json", "onbid.json")

is_court_realtime, court_status_msg = validate_realtime_data("대법원 경매", court_path, court_count)
is_onbid_realtime, onbid_status_msg = validate_realtime_data("캠코 온비드 공매", onbid_path, onbid_count)

if is_court_realtime and is_onbid_realtime:
    realtime_status = "NORMAL"
    realtime_status_desc = "🟢 모든 공식 수집 채널이 실시간 리얼 데이터 상태입니다. 신뢰할 수 있는 실시간 법률 정보 분석입니다."
elif is_court_realtime or is_onbid_realtime:
    realtime_status = "PARTIAL"
    realtime_status_desc = "🟡 일부 수집 채널에 오류가 있어 최신 실시간 정보를 불러올 수 없습니다. 아래 연동 알림을 확인하세요."
else:
    realtime_status = "FAIL"
    realtime_status_desc = "🔴 실시간 데이터 로드 실패. 저장된 데이터가 없거나 수집에 오류가 발생했습니다. 페이크 데이터 사용은 원천 금지됩니다."

# Render Completeness / Realtime Status Box

# 3 Main Tabs Setup for Beginner Accessibility
tab_dashboard, tab_glossary, tab_guide = st.tabs([
    "🎯 매칭 추천 대시보드", 
    "📚 초보자 필수 용어 및 법적 리스크 사전", 
    "⚙️ 대법원 크롤러 사용 가이드"
])

with tab_dashboard:
    if "update_thread" in st.session_state and st.session_state["update_thread"].is_alive():
        st.info("🔄 **실시간 백그라운드 데이터 수집 진행 중**: 오래된 데이터(24시간 초과)의 갱신이 백그라운드에서 자동으로 실행되고 있습니다. 완료 후 화면 조작 시 새로운 데이터가 대시보드에 반영됩니다.")
    st.subheader("📊 실시간 데이터 완전성 센서 상태")

    if realtime_status == 'NORMAL':
        render_html(f"""
            <div class="status-card status-normal">
                <h4>🟢 실시간 경매/공매 데이터 연동 정상 (NORMAL)</h4>
                <p>{realtime_status_desc}</p>
                <small style="opacity: 0.8;"><b>데이터 검증 기준:</b> 최근 36시간 이내 수집 성공 및 데이터 1건 이상 적재 완료</small>
            </div>
        """)
    elif realtime_status == 'PARTIAL':
        render_html(f"""
            <div class="status-card status-partial">
                <h4>🟡 실시간 데이터 일부 주의 (PARTIAL)</h4>
                <p>{realtime_status_desc}</p>
                <small style="opacity: 0.8;"><b>데이터 검증 기준:</b> 최근 36시간 이내 수집 성공 및 데이터 1건 이상 적재 완료</small>
            </div>
        """)
    else: # FAIL
        render_html(f"""
            <div class="status-card status-fail">
                <h4>🔴 실시간 데이터 연동 장애 (FAIL)</h4>
                <p>{realtime_status_desc}</p>
                <small style="opacity: 0.8;"><b>데이터 검증 기준:</b> 최근 36시간 이내 수집 성공 및 데이터 1건 이상 적재 완료</small>
            </div>
        """)

    # Render Sensor Statistics
    col_stat1, col_stat2, col_stat3, col_stat4 = st.columns(4)
    with col_stat1:
        st.metric("법원 경매 물건 수 (Court Count)", f"{court_count}건", delta="실시간 수집" if is_court_realtime else "장애/지연", delta_color="normal" if is_court_realtime else "inverse")
    with col_stat2:
        st.metric("온비드 공매 물건 수 (Onbid Count)", f"{onbid_count}건", delta="실시간 수집" if is_onbid_realtime else "장애/지연", delta_color="normal" if is_onbid_realtime else "inverse")
    with col_stat3:
        st.metric("사설 파일 적재 수 (Private Max)", f"{private_max}건")
    with col_stat4:
        st.metric("완전성 비율 (Ratio)", f"{ratio:.2%}")

    # Display Scraping Failures (Real-Only check!)
    st.write("---")
    st.subheader("📢 실시간 수집 연동 상태 알림")

    col_m1, col_m2 = st.columns(2)
    with col_m1:
        if is_court_realtime:
            st.success(court_status_msg)
        else:
            st.error(court_status_msg)

    with col_m2:
        if is_onbid_realtime:
            st.success(onbid_status_msg)
        else:
            st.error(onbid_status_msg + "\n\n💡 **온비드 연동 장애시 플랜B 해결 가이드**: 공공데이터포털 API 키 만료로 인해 수집이 안될 때, 온비드 홈페이지에서 '공고일정표' 엑셀/CSV 파일을 직접 다운로드받아 좌측 사이드바 **[사설 경매 파일 수동 업로드]**에 드래그하여 올려주시면 정상적으로 데이터가 병합되어 작동합니다.")

    if selected_source == "캠코 온비드 공매만 보기":
        st.write("---")
        render_html("""
            <div style="background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%); border: 1.5px solid #10b981; border-radius: 12px; padding: 1.5rem; margin-top: 1rem; box-shadow: 0 4px 15px rgba(16,185,129,0.05);">
                <h4 style="margin: 0 0 0.8rem 0; color: #047857; font-size: 1.15rem; font-weight: 800; display: flex; align-items: center; gap: 8px;">
                    🏢 온비드(Onbid) 공매 단독 상세 브리핑 모드 (인터넷 입찰 특화)
                </h4>
                <p style="margin: 0 0 1rem 0; color: #065f46; font-size: 0.9rem; line-height: 1.6;">
                    현재 <strong>캠코 온비드 공매만 보기</strong> 필터가 활성화되어 있습니다. 온비드 공매는 법정 방문 필요 없이 인터넷으로 전국 물건에 입찰할 수 있는 막강한 장점이 있습니다. 아래의 핵심 가이드를 참고하여 입찰을 진행해 보세요.
                </p>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div style="background: white; padding: 1rem; border-radius: 8px; border: 1px solid #d1fae5; box-shadow: 0 2px 8px rgba(0,0,0,0.02);">
                        <strong style="color: #047857; font-size: 0.95rem; display: block; margin-bottom: 0.5rem;">🔑 온비드 인터넷 입찰 3단계 준비:</strong>
                        <ol style="margin: 0; padding-left: 1.2rem; font-size: 0.85rem; color: #374151; line-height: 1.5;">
                            <li><strong>온비드 가입 & 인증서 등록:</strong> 공동인증서(범용 또는 온비드전용)를 등록해야 온라인 서명이 가능합니다.</li>
                            <li><strong>입찰보증금 마련:</strong> 최저입찰가 혹은 본인 입찰가의 10%(공고마다 다름)를 계좌에 보증금으로 준비합니다.</li>
                            <li><strong>인터넷 입찰서 제출:</strong> 물건의 '입찰기간' 내에 온비드 사이트에서 입찰서를 작성하고 부여된 가상계좌로 보증금을 송금하면 완료!</li>
                        </ol>
                    </div>
                    <div style="background: white; padding: 1rem; border-radius: 8px; border: 1px solid #d1fae5; box-shadow: 0 2px 8px rgba(0,0,0,0.02);">
                        <strong style="color: #047857; font-size: 0.95rem; display: block; margin-bottom: 0.5rem;">⭐ 온비드 공매의 핵심 체크포인트:</strong>
                        <ul style="margin: 0; padding-left: 1.2rem; font-size: 0.85rem; color: #374151; line-height: 1.5;">
                            <li><strong>사건번호 대신 '관리번호':</strong> 온비드는 사건번호가 아닌 14자리 <strong>'물건관리번호'</strong>(예: 2026-XXXXXX-XXX)로 검색 및 입찰을 진행합니다.</li>
                            <li><strong>수일간 진행되는 입찰기간:</strong> 단 몇 시간 동안만 기일입찰을 하는 법원경매와 달리, 공매는 보통 <strong>월요일 10:00부터 수요일 17:00까지</strong> 3일간 넉넉하게 입찰을 접수합니다.</li>
                            <li><strong>신속한 보증금 환불:</strong> 패찰 시 등록한 본인 환불 계좌로 <strong>개찰 당일(통상 목요일) 오후</strong>에 즉시 자동 환불됩니다.</li>
                        </ul>
                    </div>
                </div>
            </div>
        """)

    # Detailed Search Conditions Dashboard
    st.write("---")
    st.subheader("📈 상세 검색 조건 대시보드")

    active_regions_str = ', '.join(active_regions) if active_regions else '전체'
    active_ptypes_str = '전체' if len(active_ptypes) == len(ptype_opts) else (', '.join(active_ptypes) if active_ptypes else '선택없음')

    # Dynamic mode indicator check
    is_default_filters = (
        selected_sido == "전국" and 
        len(selected_sigungus) == 0 and 
        selected_budget == "제한 없음" and 
        selected_timeline == "3개월 이내" and 
        (len(selected_ptypes) == 0 or len(selected_ptypes) == len(ptype_opts))
    )

    mode_indicator = (
        "<span style='color: #2563eb; font-weight: bold;'>[기본조회: 3달치 전체]</span>" 
        if is_default_filters 
        else "<span style='color: #10b981; font-weight: bold;'>[필터적용중]</span>"
    )

    # Render Beautiful Premium Table for Active Settings
    settings_html = f"""
    <div style="overflow-x: auto; margin-top: 0.5rem; margin-bottom: 1.5rem; border-radius: 8px; border: 1px solid #e2e8f0; background-color: #ffffff;">
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem;">
            <thead>
                <tr style="background-color: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
                    <th style="padding: 10px 16px; font-weight: 700; color: #1e293b; width: 40%;">검색 조건 항목</th>
                    <th style="padding: 10px 16px; font-weight: 700; color: #1e293b;">설정값</th>
                </tr>
            </thead>
            <tbody>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 10px 16px; font-weight: 600; color: #334155; background-color: #f8fafc;">📍 선택된 희망 지역 (시/도 및 시/군/구)</td>
                    <td style="padding: 10px 16px; color: #0f172a;">{', '.join(selected_sidos) if selected_sidos else '선택안함'} / {active_regions_str}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 10px 16px; font-weight: 600; color: #334155; background-color: #f8fafc;">💰 예산 상한선 필터</td>
                    <td style="padding: 10px 16px; color: #0f172a; font-weight: 700;">{format_krw(budget_val)}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e2e8f0;">
                    <td style="padding: 10px 16px; font-weight: 600; color: #334155; background-color: #f8fafc;">📅 기일 기간 제한 필터</td>
                    <td style="padding: 10px 16px; color: #0f172a;">{f"{time_val}일 이내" if time_val != 99999 else "제한 없음"}</td>
                </tr>
                <tr>
                    <td style="padding: 10px 16px; font-weight: 600; color: #334155; background-color: #f8fafc;">🏢 희망 부동산 유형 필터</td>
                    <td style="padding: 10px 16px; color: #0f172a;">{active_ptypes_str}</td>
                </tr>
            </tbody>
        </table>
    </div>
    """
    render_html(settings_html)

    render_html(f"""
        <div class="criteria-box">
            <div class="criteria-title">🎯 매칭 추천 채점 기준 및 등급 안내</div>
            하드필터 위험 키워드가 단 하나도 검출되지 않은 클린 매물을 대상으로 사용자 조건 적합도 점수(최대 100점)를 계산합니다.<br>
            현재 적용 상태: {mode_indicator}
            <ul>
                <li><b>기본 점수:</b> 60점 기본 부여</li>
                <li><b>서류 완전성 (+10점):</b> 대법원/온비드 공식 매각공고 문서 및 권리관계 입증 서류가 확인될 경우</li>
                <li><b>예산 적합성 (+10점):</b> 물건의 최저입찰가가 설정한 예산 상한선 이하일 경우</li>
                <li><b>입찰 기일 여유 (+5점):</b> 입찰 기일까지의 남은 기간이 설정한 제한 기간 이내일 경우</li>
                <li><b>선호 지역 (+5점):</b> 물건의 소재지 주소에 입력한 희망 지역명이 포함될 경우</li>
                <li><b>용도 유형 일치 (+5점):</b> 선택한 희망 부동산 유형과 물건의 용도가 일치할 경우</li>
                <li><b>사설 데이터 패널티 (-2점):</b> 출처가 공인망이 아닌 사설 보조 데이터일 때 리스크 보정 감점</li>
            </ul>
            <b>등급 매핑:</b> 90점 이상 <b>A등급</b>, 80점대 <b>B등급</b>, 70점대 <b>C등급</b>, 60점대 <b>D등급</b>, 60점 미만 <b>E등급</b>
        </div>
    """)

    kpi_col1, kpi_col2, kpi_col3 = st.columns(3)
    with kpi_col1:
        render_html(f"""
            <div class="kpi-card">
                <div class="kpi-label">추천 적합 매물</div>
                <div class="kpi-val">{len(strictly_matched_recommended)}건</div>
            </div>
        """)
    with kpi_col2:
        render_html(f"""
            <div class="kpi-card">
                <div class="kpi-label">하드필터 탈락 매물 (X등급)</div>
                <div class="kpi-val" style="color: #c53030;">{len(strictly_matched_filtered)}건</div>
            </div>
        """)
    with kpi_col3:
        high_match = sum(1 for x in strictly_matched_recommended if x["grade"] in ["A", "B"])
        render_html(f"""
            <div class="kpi-card">
                <div class="kpi-label">고적합 매물 (A~B등급)</div>
                <div class="kpi-val" style="color: #2f855a;">{high_match}건</div>
            </div>
        """)

    # Client-Side Table Sorting Javascript
    render_html("""
    <script>
    function sortHtmlTable(tableId, colIndex, isNumeric) {
        const table = document.getElementById(tableId);
        if (!table) return;
        const tbody = table.querySelector('tbody');
        const rows = Array.from(tbody.querySelectorAll('tr'));
        let asc = table.getAttribute('data-sort-dir') !== 'asc';
        table.setAttribute('data-sort-dir', asc ? 'asc' : 'desc');

        // Update visual sorting indicator icons
        const headers = table.querySelectorAll('th');
        headers.forEach((th, idx) => {
            let text = th.innerText.replace(' ▲', '').replace(' ▼', '');
            if (idx === colIndex) {
                th.innerText = text + (asc ? ' ▲' : ' ▼');
            } else {
                th.innerText = text;
            }
        });

        rows.sort((a, b) => {
            let cellA = a.cells[colIndex];
            let cellB = b.cells[colIndex];
            let valA = cellA.innerText.trim();
            let valB = cellB.innerText.trim();

            // Handle direct score values inside inner elements
            const badgeA = cellA.querySelector('.badge-score');
            const badgeB = cellB.querySelector('.badge-score');
            if (badgeA && badgeB) {
                valA = badgeA.innerText.trim();
                valB = badgeB.innerText.trim();
            }

            if (isNumeric) {
                let numA = parseFloat(valA.replace(/[^0-9.-]/g, ''));
                let numB = parseFloat(valB.replace(/[^0-9.-]/g, ''));
                if (isNaN(numA)) numA = 0;
                if (isNaN(numB)) numB = 0;
                return asc ? numA - numB : numB - numA;
            }
            return asc ? valA.localeCompare(valB) : valB.localeCompare(valA);
        });

        rows.forEach(row => tbody.appendChild(row));
    }
    </script>
    """)

    # Render Table 1: Recommended Properties (Score column FIRST for numerical sorting!)
    st.write("---")
    st.subheader("🎯 맞춤형 추천 매물 목록 (종합 평가 점수순)")
    if strictly_matched_recommended:
        # Render Beautiful Custom HTML Table
        table_rows = []
        display_recommended = strictly_matched_recommended[:display_limit]
        st.info("💡 **편리한 정렬 안내**: 테이블 각 열의 제목(예: 매치 점수, 최저 입찰가, 매각 기일 등)을 클릭하시면 해당 열을 기준으로 오름차순/내림차순 정렬이 즉시 이루어집니다.")
        st.markdown(f"**전체 {len(strictly_matched_recommended)}건 중 조건에 부합하는 상위 {len(display_recommended)}개 추천 매물을 표시합니다. (기본 정렬: 종합 추천 점수 높은 순)**")
        import urllib.parse
        for idx, item in enumerate(display_recommended):
            appraisal = item.get("appraisal", 0)
            price = item.get("price", 0)
            
            bidding_round, failed_count, discount_rate = estimate_auction_rounds(appraisal, price, item.get("source"))
            discount_rate_str = f"<span style='color: #ef4444; font-weight: 700;'>▼ {discount_rate:.0f}%</span>" if discount_rate > 0 else "0%"

            appraisal_formatted = format_krw(appraisal)
            price_formatted = format_krw(price)

            grade_class = f"badge-{item['grade'].lower()}"
            grade_badge = f"<span class='badge {grade_class}' style='padding: 4px 8px; border-radius: 6px; font-weight: 700; font-size: 0.85em;'>{item['grade']}등급</span>"

            score_badge = f"<span class='badge-score' style='background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; padding: 4px 10px; border-radius: 20px; font-weight: 700; font-size: 0.9em; box-shadow: 0 2px 4px rgba(37,99,235,0.2);'>{item['score']}점</span>"

            # Dynamic source-based link and color-coded table source badge
            if item.get("source") == "court":
                link_url = "https://www.courtauction.go.kr"
                link_title = "대법원 경매 공식조회 이동"
                source_badge_table = "<span style='background-color: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; font-size: 0.78em; padding: 2px 6px; border-radius: 4px; font-weight: 700; margin-right: 6px; vertical-align: middle;'>⚖️ 법원</span>"
            elif item.get("source") == "onbid":
                link_url = "https://www.onbid.co.kr"
                link_title = "온비드 공매 공식조회 이동"
                source_badge_table = "<span style='background-color: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; font-size: 0.78em; padding: 2px 6px; border-radius: 4px; font-weight: 700; margin-right: 6px; vertical-align: middle;'>🏢 온비드</span>"
            else:
                link_url = "https://www.courtauction.go.kr"
                link_title = "사설 경매 일정표 조회"
                source_badge_table = "<span style='background-color: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; font-size: 0.78em; padding: 2px 6px; border-radius: 4px; font-weight: 700; margin-right: 6px; vertical-align: middle;'>📁 사설</span>"

            # Clean variables for HTML safety
            addr_clean = sanitize_text(item["address"])
            item_id_clean = sanitize_text(item["item_id"])
            ptype_clean = sanitize_text(item["ptype"])
            close_date_clean = sanitize_text(item["close_date"])

            direct_link = f"<a href='{link_url}' target='_blank' style='text-decoration: none; color: #2563eb; font-weight: 700; font-size: 1.1em;' title='{link_title}'>🔗</a> <a href='https://map.naver.com/v5/search/{urllib.parse.quote(addr_clean)}' target='_blank' style='text-decoration: none; color: #059669; font-weight: 700; font-size: 1.1em; margin-left: 6px;' title='네이버 지도로 바로 연결'>🗺️</a>"

            row_html = f"""
            <tr style="border-bottom: 1px solid #e2e8f0; transition: background-color 0.2s;">
                <td style="padding: 12px 16px; font-weight: 700; text-align: center; white-space: nowrap;">{score_badge}</td>
                <td style="padding: 12px 16px; text-align: center; white-space: nowrap;">{grade_badge}</td>
                <td style="padding: 12px 16px; font-weight: 600; color: #0f172a; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="{item_id_clean}">{source_badge_table}{item_id_clean}</td>
                <td style="padding: 12px 16px; color: #334155; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="{addr_clean}">{addr_clean}</td>
                <td style="padding: 12px 16px; color: #475569; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="{ptype_clean}">{ptype_clean}</td>
                <td style="padding: 12px 16px; font-weight: 700; color: #1e293b; text-align: right; line-height: 1.4;">{price_formatted} <br/> <span style="color: #64748b; font-size: 0.85em; font-weight: normal;">감정: {appraisal_formatted}</span></td>
                <td style="padding: 12px 16px; text-align: center; line-height: 1.4; white-space: nowrap;"><span style="color: #1e3a8a; font-weight: 700;">{bidding_round}회차</span> <br/> <span style="color: #475569; font-size: 0.85em;">(유찰 {failed_count}회)</span></td>
                <td style="padding: 12px 16px; text-align: center; white-space: nowrap;">{discount_rate_str}</td>
                <td style="padding: 12px 16px; color: #475569; font-weight: 500; text-align: center; white-space: nowrap;">{close_date_clean}</td>
                <td style="padding: 12px 16px; text-align: center; white-space: nowrap;">{direct_link}</td>
            </tr>
            """
            table_rows.append(row_html)

        table_body = "\n".join(table_rows)
        table_html = f"""
        <div style="overflow-x: auto; margin-bottom: 2rem; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(0,0,0,0.03); background-color: #ffffff;">
            <table id="rec-table" style="width: 100%; min-width: 1350px; table-layout: fixed; border-collapse: collapse; text-align: left; font-size: 0.9rem;">
                <thead>
                    <tr style="background-color: #0f172a; color: #f8fafc; border-bottom: 2px solid #cbd5e1;">
                        <th onclick="sortHtmlTable('rec-table', 0, true)" style="padding: 14px 16px; font-weight: 700; text-align: center; width: 100px; cursor: pointer; user-select: none;">매치 점수 ↕</th>
                        <th onclick="sortHtmlTable('rec-table', 1, false)" style="padding: 14px 16px; font-weight: 700; text-align: center; width: 80px; cursor: pointer; user-select: none;">등급 ↕</th>
                        <th onclick="sortHtmlTable('rec-table', 2, false)" style="padding: 14px 16px; font-weight: 700; width: 150px; cursor: pointer; user-select: none;">사건/관리번호 ↕</th>
                        <th onclick="sortHtmlTable('rec-table', 3, false)" style="padding: 14px 16px; font-weight: 700; width: 260px; cursor: pointer; user-select: none;">소재지 주소 ↕</th>
                        <th onclick="sortHtmlTable('rec-table', 4, false)" style="padding: 14px 16px; font-weight: 700; width: 120px; cursor: pointer; user-select: none;">물건 용도 ↕</th>
                        <th onclick="sortHtmlTable('rec-table', 5, true)" style="padding: 14px 16px; font-weight: 700; text-align: right; width: 180px; cursor: pointer; user-select: none;">최저 입찰가 / 감정가 ↕</th>
                        <th onclick="sortHtmlTable('rec-table', 6, true)" style="padding: 14px 16px; font-weight: 700; text-align: center; width: 140px; cursor: pointer; user-select: none;">입찰 회차 / 유찰 ↕</th>
                        <th onclick="sortHtmlTable('rec-table', 7, true)" style="padding: 14px 16px; font-weight: 700; text-align: center; width: 110px; cursor: pointer; user-select: none;">감정가 대비 저감 ↕</th>
                        <th onclick="sortHtmlTable('rec-table', 8, false)" style="padding: 14px 16px; font-weight: 700; text-align: center; width: 110px; cursor: pointer; user-select: none;">매각 기일 ↕</th>
                        <th style="padding: 14px 16px; font-weight: 700; text-align: center; width: 100px; user-select: none;">이동</th>
                    </tr>
                </thead>
                <tbody>
                    {table_body}
                </tbody>
            </table>
        </div>
        """
        render_html(table_html)

        # Premium Hover Cards for Recommended listings (Auto expanded on mouse hover)
        st.markdown("#### 🔍 매물별 상세 분석 및 비고/특이사항 원문 열람 (마우스 오버 시 자동 전개)")
        for idx, item in enumerate(display_recommended):
            safety_reminder_html = (
                "<div style='background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 0.8rem; margin-top: 1rem; color: #166534; font-size: 0.9em;'>"
                "✅ <strong>초보자 안심 권리분석 완료:</strong> 본 매물은 권리상 위험 요소(선순위 보증금 인수, 유치권 점유, 대지권 상실 등)가 검출되지 않은 안전한 추천 등급 매물입니다. 단, 입찰 전 현장 조사 및 등기부등본 열람은 필수입니다."
                "</div>"
            )
            appraisal = item.get("appraisal", 0)
            price = item.get("price", 0)
            
            bidding_round, failed_count, discount_rate = estimate_auction_rounds(appraisal, price, item.get("source"))
            discount_str = f" (감정가 대비 ▼{discount_rate:.0f}% 저감)" if discount_rate > 0 else ""

            bd = item.get("score_breakdown", {})
            source_name = '대법원 법원경매' if item['source'] == 'court' else ('온비드 공유공매' if item['source'] == 'onbid' else '사설 일정표')

            # Check if Naver search info is present in notes (which has [인터넷 분석 정보: ...])
            notes_text = item.get("notes", "")
            naver_info = ""
            if "[인터넷 분석 정보:" in notes_text:
                parts = notes_text.split("[인터넷 분석 정보:")
                notes_clean = parts[0].strip()
                naver_info = parts[1].replace("]", "").strip()
            else:
                notes_clean = notes_text

            desc_content = item.get("desc") if item.get("desc") else "등록된 법원 비고 및 설명 정보가 없습니다."
            notes_content = notes_clean if notes_clean else "특이사항에 잡힌 권리상 하자가 발견되지 않았습니다. (법적 책임은 대법원 정보망에서 필히 재확인 요망)"

            # Escaping and cleaning tags to remove </div> and prevent HTML leakage
            desc_content = sanitize_text(desc_content)
            notes_content = sanitize_text(notes_content)
            naver_info = sanitize_text(naver_info)

            naver_search_html = ""
            if naver_info:
                naver_search_html = f"""
                <div style="margin-top: 1rem;">
                    <p style="margin-bottom: 0.5rem; color: #1e3a8a;"><b>🌐 인터넷 검색 기반 추가 분석 정보 (네이버 분석):</b></p>
                    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 1rem; color: #166534; font-size: 0.9em; line-height: 1.5;">
                        ℹ️ {naver_info}
                    </div>
                </div>
                """

            appraisal_formatted = format_krw(appraisal)
            price_formatted = format_krw(price)

            addr_clean = sanitize_text(item['address'])
            addr_parts = addr_clean.split()
            location_header = f"{addr_parts[0]} {addr_parts[1]}" if len(addr_parts) > 1 else addr_clean

            item_id_clean = sanitize_text(item['item_id'])
            ptype_clean = sanitize_text(item['ptype'])
            close_date_clean = sanitize_text(item['close_date'])

            # Set dynamic card styling based on source
            if item.get("source") == "court":
                card_link_url = "https://www.courtauction.go.kr"
                card_link_btn_text = "🔗 대법원 법원경매 사건검색 바로가기"
                card_badge = f"<span class='badge' style='background-color: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; font-size: 0.78em; padding: 4px 8px; border-radius: 6px; font-weight: 700; margin-right: 10px; vertical-align: middle;'>⚖️ 대법원 경매</span>"
                onbid_guide_html = ""
            elif item.get("source") == "onbid":
                card_link_url = "https://www.onbid.co.kr"
                card_link_btn_text = "🔗 온비드 공매 물건검색 바로가기"
                card_badge = f"<span class='badge' style='background-color: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; font-size: 0.78em; padding: 4px 8px; border-radius: 6px; font-weight: 700; margin-right: 10px; vertical-align: middle;'>🏢 온비드 공매</span>"
                onbid_guide_html = f"""
                <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 1.0rem; margin-top: 1rem; color: #047857; font-size: 0.9em; line-height: 1.5;">
                    💡 <strong>온비드 공매 핵심 데이터 분석 가이드:</strong><br/>
                    • <strong>온라인 인터넷 입찰:</strong> 이 물건은 대법원 경매와 달리 법원에 직접 방문할 필요 없이 <strong>온비드 홈페이지(onbid.co.kr)에서 공인인증서로 집에서 입찰 가능</strong>합니다.<br/>
                    • <strong>물건관리번호 검색:</strong> 온비드 검색 시 사건번호가 아닌 관리번호(<strong>{item_id_clean}</strong>)를 입력해야 조회됩니다.<br/>
                    • <strong>입찰 기간 확인:</strong> 공매는 보통 수일간(예: 월~수) 입찰을 진행한 후 목요일에 개찰합니다. 입찰 기간 마감 시간을 엄수해 주세요.
                </div>
                """
            else:
                card_link_url = "https://www.courtauction.go.kr"
                card_link_btn_text = "🔗 사설 일정표 원본 보기"
                card_badge = f"<span class='badge' style='background-color: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; font-size: 0.78em; padding: 4px 8px; border-radius: 6px; font-weight: 700; margin-right: 10px; vertical-align: middle;'>📁 사설 경매</span>"
                onbid_guide_html = ""

            card_html = f"""
            <div class="hover-card card-{item.get('source', 'court')}">
                <div class="hover-summary">
                    <div>
                        <span class="badge badge-{item['grade'].lower()}" style="padding: 6px 12px; border-radius: 8px; font-weight: 700; font-size: 0.9em; margin-right: 10px;">{item['grade']}등급 - {item['score']}점</span>
                        {card_badge}
                        <strong style="font-size: 1.15em; color: #0f172a;">{item_id_clean}</strong>
                        <span style="color: #64748b; margin-left: 10px;">| {location_header} | {ptype_clean}</span>
                    </div>
                    <div class="hover-label-indicator">
                        ⚡ 마우스 오버하여 상세정보 보기
                    </div>
                </div>
                <div class="hover-detail">
                    <div class="hover-grid" style="font-size: 0.95em; color: #334155; line-height: 1.6;">
                        <div>
                            <p style="margin: 4px 0;"><b>사건/관리번호:</b> {item_id_clean} ({source_name})</p>
                            <p style="margin: 4px 0;"><b>소재지 주소:</b> {addr_clean}</p>
                            <p style="margin: 4px 0;"><b>물건 유형/용도:</b> {ptype_clean}</p>
                            <p style="margin: 4px 0;"><b>매각/입찰 기일:</b> {close_date_clean} (남은 일정: {item['remaining_days']}일)</p>
                        </div>
                        <div>
                            <p style="margin: 4px 0;"><b>감정 평가액:</b> {appraisal_formatted}</p>
                            <p style="margin: 4px 0;"><b>최저 입찰가격:</b> {price_formatted} <span style="color: #ef4444; font-weight: bold;">{discount_str}</span></p>
                            <p style="margin: 4px 0;"><b>입찰 진행 상태:</b> <span style="color: #1e3a8a; font-weight: 700;">{bidding_round}회차 입찰</span> (유찰 {failed_count}회)</p>
                            <p style="margin: 4px 0; font-size: 0.9em; color: #475569;"><b>매치 점수 상세:</b> 기본 60점 + 서류 {bd.get('docs_score',0)}점 + 예산 {bd.get('budget_score',0)}점 + 일정 {bd.get('time_score',0)}점 + 지역 {bd.get('region_score',0)}점 + 용도 {bd.get('ptype_score',0)}점 - 사설패널티 {bd.get('private_penalty',0)}점 = <b>{item['score']}점</b></p>
                        </div>
                    </div>
                    {onbid_guide_html}
                    <div style="margin-top: 1rem; border-top: 1px dashed #eaedf1; padding-top: 1rem;">
                        <p style="margin-bottom: 0.5rem;"><b>📝 법원 비고 및 설명 원문 (아주 상세):</b></p>
                        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem; color: #1e293b; font-size: 0.9em; line-height: 1.5;">
                            {desc_content}
                        </div>
                    </div>
                    <div style="margin-top: 1rem;">
                        <p style="margin-bottom: 0.5rem; color: #b91c1c;"><b>⚠️ 권리 관계 특이사항 및 주의사항 (아주 상세):</b></p>
                        <div style="background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 8px; padding: 1rem; color: #7f1d1d; font-size: 0.9em; line-height: 1.5;">
                            {notes_content}
                        </div>
                    </div>
                    {naver_search_html}
                    {safety_reminder_html}
                    <div style="margin-top: 1rem; text-align: right;">
                        <a href="https://map.naver.com/v5/search/{urllib.parse.quote(addr_clean)}" target="_blank" style="display: inline-block; background-color: #059669; color: white; padding: 8px 16px; border-radius: 6px; font-weight: 700; text-decoration: none; font-size: 0.85em; box-shadow: 0 4px 10px rgba(5,150,105,0.15); transition: background-color 0.2s; margin-right: 8px;">
                            🗺️ 네이버 지도 바로가기
                        </a>
                        <a href="{card_link_url}" target="_blank" style="display: inline-block; background-color: #2563eb; color: white; padding: 8px 16px; border-radius: 6px; font-weight: 700; text-decoration: none; font-size: 0.85em; box-shadow: 0 4px 10px rgba(37,99,235,0.15); transition: background-color 0.2s;">
                            {card_link_btn_text}
                        </a>
                    </div>
                </div>
            </div>
            """
            render_html(card_html)
    else:
        st.info("설정한 검색 조건에 부합하는 리얼 추천 매물이 없습니다. 좌측 검색창에서 범위를 넓히거나 다른 지역을 복수 선택해 보세요.")

    # Render Table 2: Filtered Properties (Grade X)
    st.write("---")
    st.subheader("🚫 위험 차단 및 불완전 매물 목록 (X등급 - 추천 제외)")

    render_html("""
        <div class="criteria-box">
            <div class="criteria-title">⚠️ 위험 차단 (X등급) 키워드 및 제외 조건</div>
            주소, 비고, 특이사항 텍스트에 아래 카테고리의 <b>제외 위험 키워드가 단 하나라도 매칭될 경우</b> 권리 분석 실패 리스크 방지를 위해 추천에서 강제 제외시킵니다.
            <ul>
                <li><b>구조적 소유권 하자 (구조):</b> '지분' (토지/건물 지분 매각), '대지권없음', '토지별도' (토지별도등기 존재), '건물만', '토지만', '대지권 미등기'</li>
                <li><b>점유 및 인도 리스크 (점유):</b> '점유관계미상' (인도명령 거부 및 미상 점유 존재), '유치권', '명도곤란', '유치권 주장' (유치권 신고 접수 포함)</li>
                <li><b>인수 비용 발생 리스크 (추가비용):</b> '인수', '선순위', '선순위 임차인', '대항력', '임차권', '보증금 인수' (낙찰자가 임차인 보증금을 안아주어야 하는 경우)</li>
                <li><b>정보 완전성 불충분 (정보부족):</b> '서류없음', '확인불가', '열람불가', '자료없음' (법적 하자를 검토하기 위한 공식 서류 열람 불가)</li>
            </ul>
        </div>
    """)

    if strictly_matched_filtered:
        # Render Colorful Custom cards for Filtered items (No table!)
        display_filtered = strictly_matched_filtered[:display_filtered_limit]
        st.markdown(f"**전체 {len(strictly_matched_filtered)}건 중 대표적인 상위 {len(display_filtered)}개 제외 매물을 컬러풀 카드 타입으로 표시합니다. (마우스 오버 시 자동 전개)**")
        import urllib.parse
        for item in display_filtered:
            # Clean variables for HTML safety
            addr_clean = sanitize_text(item["address"])
            item_id_clean = sanitize_text(item["item_id"])
            ptype_clean = sanitize_text(item["ptype"])
            reason_clean = sanitize_text(item["filter_reason"])
            price_formatted = format_krw(item.get("price", 0))

            legal_warning_html = get_legal_risk_warning(reason_clean)
            desc_content = item.get("desc") if item.get("desc") else "등록된 비고가 없습니다."
            notes_content = item.get("notes") if item.get("notes") else "등록된 특이사항이 없습니다."

            # Escaping and cleaning tags to remove </div> and prevent HTML leakage
            desc_content = sanitize_text(desc_content)
            notes_content = sanitize_text(notes_content)

            addr_parts = addr_clean.split()
            location_header = f"{addr_parts[0]} {addr_parts[1]}" if len(addr_parts) > 1 else addr_clean
            source_name = '대법원 법원경매' if item['source'] == 'court' else ('온비드 공유공매' if item['source'] == 'onbid' else '사설 일정표')

            # Dynamic colorful style based on risk keywords
            border_color, bg_gradient, text_color, badge_text = get_risk_card_style(reason_clean)

            # Set dynamic card styling based on source
            if item.get("source") == "court":
                card_link_url = "https://www.courtauction.go.kr"
                card_link_btn_text = "🔗 대법원 법원경매 사건검색 바로가기"
                card_badge = f"<span class='badge' style='background-color: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; font-size: 0.78em; padding: 4px 8px; border-radius: 6px; font-weight: 700; margin-right: 10px; vertical-align: middle;'>⚖️ 대법원 경매</span>"
            elif item.get("source") == "onbid":
                card_link_url = "https://www.onbid.co.kr"
                card_link_btn_text = "🔗 온비드 공매 물건검색 바로가기"
                card_badge = f"<span class='badge' style='background-color: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; font-size: 0.78em; padding: 4px 8px; border-radius: 6px; font-weight: 700; margin-right: 10px; vertical-align: middle;'>🏢 온비드 공매</span>"
            else:
                card_link_url = "https://www.courtauction.go.kr"
                card_link_btn_text = "🔗 사설 일정표 원본 보기"
                card_badge = f"<span class='badge' style='background-color: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; font-size: 0.78em; padding: 4px 8px; border-radius: 6px; font-weight: 700; margin-right: 10px; vertical-align: middle;'>📁 사설 경매</span>"

            card_html = f"""
            <div class="hover-card" style="border-left: 6px solid {border_color}; background: {bg_gradient};">
                <div class="hover-summary">
                    <div>
                        <span class="badge" style="background-color: #ef4444; color: white; padding: 6px 12px; border-radius: 8px; font-weight: 700; font-size: 0.9em; margin-right: 10px;">X등급 (제외)</span>
                        <span class="badge" style="background-color: {border_color}; color: white; padding: 4px 8px; border-radius: 6px; font-weight: 700; font-size: 0.8em; margin-right: 10px; vertical-align: middle;">{badge_text}</span>
                        {card_badge}
                        <strong style="font-size: 1.15em; color: #0f172a;">{item_id_clean}</strong>
                        <span style="color: #64748b; margin-left: 10px;">| {location_header} | {ptype_clean}</span>
                    </div>
                    <div style="font-size: 0.85rem; font-weight: 700; color: #dc2626; background-color: #fef2f2; border: 1px solid #fecaca; padding: 6px 12px; border-radius: 8px;">
                        🚨 차단사유: {reason_clean.split(',')[0]}
                    </div>
                </div>
                <div class="hover-detail">
                    <div style="font-size: 0.95em; color: #334155; line-height: 1.6;">
                        <p style="margin: 4px 0;"><b>사건/관리번호:</b> {item_id_clean} ({source_name})</p>
                        <p style="margin: 4px 0;"><b>소재지 주소:</b> {addr_clean}</p>
                        <p style="margin: 4px 0;"><b>물건 유형/용도:</b> {ptype_clean}</p>
                        <p style="margin: 4px 0;"><b>최저 입찰가격:</b> {price_formatted}</p>
                        <p style="margin: 4px 0; color: #dc2626; font-weight: bold;">🚨 제외 차단 사유 (검출 키워드): {reason_clean}</p>
                        {legal_warning_html}
                    </div>
                    <div style="margin-top: 1rem; border-top: 1px dashed #eaedf1; padding-top: 1rem;">
                        <p style="margin-bottom: 0.5rem;"><b>📝 법원 비고 및 설명 원문:</b></p>
                        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem; color: #1e293b; font-size: 0.9em; line-height: 1.5;">
                            {desc_content}
                        </div>
                    </div>
                    <div style="margin-top: 1rem;">
                        <p style="margin-bottom: 0.5rem;"><b>⚠️ 권리 관계 특이사항 원문:</b></p>
                        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem; color: #1e293b; font-size: 0.9em; line-height: 1.5;">
                            {notes_content}
                        </div>
                    </div>
                    <div style="margin-top: 1rem; text-align: right;">
                        <a href="https://map.naver.com/v5/search/{urllib.parse.quote(addr_clean)}" target="_blank" style="display: inline-block; background-color: #059669; color: white; padding: 8px 16px; border-radius: 6px; font-weight: 700; text-decoration: none; font-size: 0.85em; box-shadow: 0 4px 10px rgba(5,150,105,0.15); transition: background-color 0.2s; margin-right: 8px;">
                            🗺️ 네이버 지도 바로가기
                        </a>
                        <a href="{card_link_url}" target="_blank" style="display: inline-block; background-color: #b91c1c; color: white; padding: 8px 16px; border-radius: 6px; font-weight: 700; text-decoration: none; font-size: 0.85em; box-shadow: 0 4px 10px rgba(185,28,28,0.15); transition: background-color 0.2s;">
                            {card_link_btn_text}
                        </a>
                    </div>
                </div>
            </div>
            """
            render_html(card_html)
    else:
        st.success("권리 하자 또는 점유 리스크 등으로 걸러진 X등급 물건이 없습니다. 안전한 경매 환경입니다.")

    # Section explaining the Private Data Scraper mix method
    st.write("---")
    st.subheader("💡 사설 데이터 수집 및 믹스(Mix) 가이드 (테스트)")
    with st.expander("🔗 유료 사설 경매 정보 사이트 자동 크롤링 시뮬레이션 및 데이터 결합 방법"):
        st.markdown("""
            사설 경매 정보 사이트(마이옥션, 태인경매 등)는 회원 가입 및 로그인 인증이 필요한 폐쇄형 DB로 운영되어 무단 대량 수집 시 법적 조치를 받을 수 있습니다. 
            다만, 개인적인 학습 및 모니터링 편의를 위해 **로컬 환경에서 검색 결과를 자동으로 긁어와 병합하는 프로토타입 스크립트**를 동봉해 두었습니다.

            #### 1. 작동 방식 개요
            - [private_scraper_test.py](file:///d:/BackUp/OneDrive/AI공부/Real%20estate%20auction/tools/private_scraper_test.py) 파일에 해당 로직이 선구축되어 있습니다.
            - `requests`와 `BeautifulSoup`을 사용하여 가입하신 사이트의 세션(Cookies)을 탑재한 후, 사건번호와 소재지, 최저가 등을 파싱하여 `input_sources/json/private_scraped.json` 파일로 저장합니다.

            #### 2. 로컬 실행 및 믹스 방법
            터미널을 통해 아래 명령어를 실행하여 수집 시뮬레이션을 진행할 수 있습니다:
            ```bash
            python tools/private_scraper_test.py
            ```
            이후 생성된 사설 수집 파일을 왼쪽 사이드바 파일 업로더에 올리시면, **공식망 정보와 주소 기반으로 즉시 중복이 제거되며 병합**됩니다. 
            - **동일 주소 매칭 시:** 공식망 대법원/온비드 경매 정보를 메인 정보로 두고, 사설 데이터에 들어있던 특이사항이나 비고(전문가 한줄평 등)를 `[사설비고: ...]` 형태로 메인 데이터 비고 뒤에 결합(Merge)합니다.
            - **단독 사설 매물 매칭 시:** 새로운 추천 풀에 자동 추가되며, 사설 보조 데이터 품질 리스크를 감안하여 **-2점의 감점 페널티**가 적용된 후 등급이 매겨집니다.
        """)

# --- BEGINNER GLOSSARY TAB ---
with tab_glossary:
    st.markdown("## 📚 초보자를 위한 경매 용어 및 법적 리스크 백과사전")
    st.markdown(
        "부동산 경매는 법률 용어와 하자가 얽혀 있어 사전지식이 없는 일반 사용자에게는 진입장벽이 매우 높습니다. "
        "아래 사전을 통해 필수적인 권리분석 개념과 낙찰 후 직면할 수 있는 법적 문제들을 쉽게 이해해 보세요."
    )
    st.write("---")
    
    # 1. 경매의 기초 개념
    st.markdown("### 1️⃣ 경매의 기초 개념")
    col1, col2 = st.columns(2)
    with col1:
        with st.expander("💰 최저입찰가 (Minimum Bid Price)"):
            st.markdown(
                "**설명:** 경매 물건의 매각을 시작할 때 법원이 지정한 가장 낮은 입찰 금액입니다. "
                "아무도 이 가격 이상으로 입찰하지 않아 유찰(낙찰자가 없음)되면 보통 법원에 따라 최저입찰가가 20%~30%씩 감액(저감)되어 다음 입찰 일정이 잡힙니다.\n\n"
                "**주의점:** 입찰 시 반드시 이 금액 이상으로 적어야 합니다. 단 1원이라도 낮게 적어 제출하면 보증금을 냈더라도 무효 처리됩니다."
            )
        with st.expander("⚖️ 감정평가액 (Appraisal Value)"):
            st.markdown(
                "**설명:** 감정평가사가 해당 부동산의 시세, 위치, 상태 등을 종합 고려하여 평가한 경매 개시 시점의 가치입니다.\n\n"
                "**주의점:** 감정평가 시점은 대개 경매 개시 결정 직후(보통 실제 입찰일보다 6개월~1년 전)이므로, "
                "현재 시장 시세와 괴리가 클 수 있습니다. 반드시 현재 실거래가와 네이버 부동산 시세를 따로 조사해 대조하셔야 합니다."
            )
    with col2:
        with st.expander("📅 매각기일 (Auction Date)"):
            st.markdown(
                "**설명:** 실제로 입찰 법정에 출석하여 입찰표를 던지거나, 온비드를 통해 입찰서를 마감하는 당일 일정입니다.\n\n"
                "**주의점:** 법원 경매의 경우 매각기일 당일 오전 10시부터 보통 11시 10분경까지 입찰을 마감합니다. 신분증, 입찰보증금(최저입찰가의 10%), 도장을 준비해 지참해야 합니다."
            )
        with st.expander("📜 매각물건명세서 (Bid Object Description)"):
            st.markdown(
                "**설명:** 법원이 경매 물건의 권리 관계, 점유자 현황, 하자를 조사하여 일반 대중에게 공식 공개하는 가장 중요한 서류입니다.\n\n"
                "**주의점:** 매각기일 7일 전부터 법원 경매 정보망에서 열람할 수 있습니다. 여기에 기재되지 않은 권리 관계나 임차 관계 하자는 경매 법원이 책임을 지지 않으므로, 꼼꼼하게 읽어보아야 합니다."
            )

    st.write("---")

    # 2. 치명적인 위험 권리 (하드필터 제외 대상)
    st.markdown("### 2️⃣ 낙찰자에게 돈을 물어내게 하는 치명적인 리스크")
    col3, col4 = st.columns(2)
    with col3:
        with st.expander("👤 대항력과 선순위 임차인 (Prior Tenant with Counter-power)"):
            st.markdown(
                "**설명:** 세입자가 주택의 말소기준권리(대개 최초 근저당권)보다 먼저 전입신고를 마치고 점유하고 있다면 '대항력'을 가집니다. "
                "이 임차인은 낙찰자가 바뀌더라도 본인의 보증금을 전액 돌려받을 때까지 집을 비워주지 않고 거주할 법적 권리가 있습니다.\n\n"
                "**🚨 추후 발생할 수 있는 법적 문제 (리스크):**\n"
                "임차인이 배당요구(법원에서 낙찰금으로 돈을 받아 가겠다고 신청)를 했더라도 낙찰대금에서 보증금을 다 돌려받지 못하면, "
                "**남은 보증금 잔액은 낙찰자가 무조건 인수하여 대신 물어주어야 합니다.**\n"
                "예컨대 낙찰을 2억에 받았는데 선순위 세입자 보증금이 3억이고 법원에서 1억만 배당받았다면, 낙찰자는 세입자에게 2억을 추가로 물어주어야 하므로 총 매입가가 4억이 되는 치명적인 손실을 입을 수 있습니다."
            )
        with st.expander("🛠️ 유치권 (Lien)"):
            st.markdown(
                "**설명:** 건물 공사비나 수리비를 받지 못한 건축 업자 등이 돈을 받을 때까지 해당 건물이나 부동산을 점유하고 넘겨주지 않을 수 있는 법적 권리입니다.\n\n"
                "**🚨 추후 발생할 수 있는 법적 문제 (리스크):**\n"
                "유치권이 신고된 물건을 낙찰받으면 법원 인도명령 대상에서 제외되어 **유치권자와 기나긴 명도소송(방을 비워달라는 재판)을 벌여야 합니다.**\n"
                "유치권이 진정(진짜)인 경우, 낙찰자가 공사대금 채무를 대위변제(대신 지급)해야 점유를 인도받을 수 있으며, 가짜 유치권인 경우에도 법정 소송 비용과 입주 지연에 따른 금융 이자 독박 부담 리스크가 매우 큽니다."
            )
    with col4:
        with st.expander("🧱 대지사용권 없음 / 대지권 미등기 (No Land Rights)"):
            st.markdown(
                "**설명:** 아파트나 빌라의 '건물' 부분만 경매로 나오고, 건물이 서 있는 '토지(대지)' 지분은 매각에서 제외된 상태입니다.\n\n"
                "**🚨 추후 발생할 수 있는 법적 문제 (리스크):**\n"
                "건물 소유주(낙찰자)와 토지 소유주가 달라지게 됩니다. 토지 소유주가 낙찰자를 상대로 **토지 사용료(부당이득반환) 청구 소송**을 제기하여 매달 막대한 비용을 요구할 수 있습니다.\n"
                "최악의 경우, 대지권이 전혀 없는 무단 건물로 판정 나면 **건물 철거 소송 및 건물 인도 소송**을 당해 낙찰받은 건물이 철거당하고 자산 가치가 휴지조각이 되는 극단적 손실을 볼 수 있습니다."
            )
        with st.expander("📝 토지별도등기 (Separate Land Registration)"):
            st.markdown(
                "**설명:** 아파트나 빌라 등 집합건물은 건물과 토지가 일체로 거래되는 것이 원칙이나, 건설사가 토지에 대출을 받아 저당권을 설정해 둔 뒤 집을 짓고 토지 등기부를 정리하지 않은 상태입니다.\n\n"
                "**🚨 추후 발생할 수 있는 법적 문제 (리스크):**\n"
                "경매를 통해 낙찰을 받더라도 토지 저당권자가 배당을 다 받지 못하면 **토지 등기부상의 담보권(근저당 등)이 말소되지 않고 낙찰자에게 그대로 인수**될 수 있습니다.\n"
                "사후에 토지 지분만 경매로 따로 넘어가 소유권을 일부 상실하거나, 대지 지분을 잃고 '대지사용권 없는 건물' 신세로 전락할 위험이 상존합니다."
            )

    st.write("---")

    # 3. 명도 및 사후 처리
    st.markdown("### 3️⃣ 낙찰 후 부동산을 인도받는 과정 (명도 리스크)")
    col5, col6 = st.columns(2)
    with col5:
        with st.expander("🚪 명도 (Eviction / Possession Transfer)"):
            st.markdown(
                "**설명:** 경매 물건의 기존 소유자나 세입자를 내보내고 집 열쇠와 점유권을 넘겨받는 행위입니다.\n\n"
                "**🚨 추후 발생할 수 있는 법적 문제 (리스크):**\n"
                "살고 있는 사람이 곱게 나가지 않으면 강제로 내보내야 합니다. 대화와 협상을 통해 이사비(통상 평당 10만 원 안팎)를 주고 내보내는 것이 보편적이나, "
                "이사비를 무리하게 요구하며 버티는 경우 법적 강제집행 절차를 밟아야 하며 이 과정에서 수개월의 시간과 집행 비용이 지출됩니다."
            )
    with col6:
        with st.expander("⚖️ 인도명령 (Eviction Order) vs 명도소송 (Eviction Lawsuit)"):
            st.markdown(
                "**인도명령:** 대금을 모두 납부한 낙찰자가 6개월 이내에 법원에 청구하여 소송 없이 간편하게 강제 집행 권원을 얻는 법적 약식 제도입니다. (기존 소유자, 무단 점유자, 대항력 없는 세입자 대상)\n\n"
                "**명도소송:** 인도명령 대상이 아닌 점유자(예: 유치권자, 대항력 있는 세입자 등)가 버티거나 낙찰 후 6개월이 지난 경우 정식 소송을 제기하여 집을 비우도록 하는 법적 절차입니다. 판결문 획득까지 최소 6개월에서 1년 이상 소요됩니다."
            )
            
    st.warning(
        "⚠️ **초보자 필독 권고사사항**\n\n"
        "이 시스템의 하드필터가 잡아내 추천에서 제외시킨 **'X등급' 매물들**은 위에 기재된 선순위 대항력, 유치권, 대지권 없음 등의 "
        "치명적인 사후 법적 분쟁 리스크를 포함하고 있습니다. 부동산 경매에 통달한 전문가가 아니라면 **X등급 물건의 입찰은 원천 피하시는 것이 자산을 지키는 유일한 지름길**입니다."
    )

# --- CRAWLER GUIDE TAB ---
with tab_guide:
    st.markdown("## ⚙️ 대법원 경매 및 온비드 공매 데이터 연동 가이드")
    st.markdown("로컬 PC 및 서버에서 실시간 데이터베이스를 구축하고 업데이트하는 방법입니다.")
    st.write("---")
    
    guide_path = os.path.join(base_dir, "대법원 크롤러 사용법 가이드.md")
    if os.path.exists(guide_path):
        try:
            with open(guide_path, "r", encoding="utf-8") as f:
                guide_content = f.read()
            st.markdown(guide_content)
        except Exception as e:
            st.error(f"가이드 파일을 읽어오는 도중 오류가 발생했습니다: {e}")
    else:
        st.error("대법원 크롤러 사용법 가이드.md 파일을 프로젝트 루트 폴더에서 찾을 수 없습니다.")

# --- GLOBAL FOOTER ---
st.write("---")
render_html("""
    <div style="text-align: center; color: #64748b; font-size: 0.82rem; padding: 1.5rem 0 2.5rem 0; border-top: 1px solid #e2e8f0; margin-top: 2rem; line-height: 1.6;">
        <p style="margin: 0 0 0.4rem 0;">🏛️ 본 서비스는 <strong>대한민국 대법원 법원경매정보망</strong> 및 <strong>한국자산관리공사(KAMCO) 온비드(Onbid) 공매망</strong>의 실시간 데이터를 가공하여 활용하고 있습니다.</p>
        <p style="margin: 0; color: #94a3b8; font-size: 0.78rem;">공식 공공데이터 포털 및 크롤러 연동 정보에 기인한 자료이며, 실제 입찰 참여 시 법적 하자는 등기부등본 열람 등을 통해 반드시 직접 재검증하셔야 합니다.</p>
    </div>
""")
