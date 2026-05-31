def check_completeness(court_count, onbid_count, private_max):
    """
    Evaluates the completeness of scraped official data (court + onbid)
    compared to the maximum records in the uploaded private database.
    
    Formula:
        Ratio = (Court_Count + Onbid_Count) / Private_Max
        
    Returns:
        (status, message, ratio)
        - status: 'NORMAL', 'PARTIAL', 'FAIL'
        - message: Warning message string to display
        - ratio: Computed float ratio
    """
    # Safe guard division by zero or when no private file is uploaded
    if private_max <= 0:
        return 'NORMAL', "", 1.0

    ratio = (court_count + onbid_count) / private_max

    if ratio >= 0.85:
        status = 'NORMAL'
        message = ""
    elif 0.40 <= ratio < 0.85:
        status = 'PARTIAL'
        message = "⚠️ 일부 법원/공매 데이터의 누락 가능성이 존재하여 사설 보조 데이터를 혼합 추천 중입니다"
    else:
        status = 'FAIL'
        message = "🚨 [비상 모드] 공식 정보망 지연으로 인해 전면 사설 보조 데이터 기반의 이중 교차 분석 리포트를 표출 중이오니, 상세 법적 하자는 대법원 사법 전산망에서 필히 재확인하십시오"

    return status, message, ratio
