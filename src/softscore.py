import datetime

def calculate_remaining_days(close_date_str):
    """
    Calculate the remaining days from today to close_date.
    Returns 9999 if date is invalid or empty, and a negative number if the date has passed.
    """
    if not close_date_str:
        return 9999
        
    try:
        # Parse close_date in YYYY-MM-DD format
        close_date = datetime.datetime.strptime(close_date_str, "%Y-%m-%d").date()
        today = datetime.date.today()
        return (close_date - today).days
    except ValueError:
        return 9999

def compute_softscore(item, budget_max, time_days, preferred_region, preferred_ptype):
    """
    Compute user-fit final score based on criteria and assign grades.
    
    Formula:
        Score_final = 60 + S_docs + S_budget + S_time + S_region + S_ptype - P_private
        
    Parameters:
        item: dictionary of real estate listing
        budget_max: float/int, upper budget limit (e.g. 200,000,000). None or <= 0 for unlimited.
        time_days: int, limit of remaining days (e.g. 180 for 6 months). None or <= 0 for unlimited.
        preferred_region: str, e.g. '서울', '상관없음'
        preferred_ptype: str, e.g. '아파트', '상관없음'
        
    Returns:
        (score, grade, breakdown)
    """
    score = 60
    breakdown = {}
    
    # 1. Documents completeness (docs_ok == '예')
    if item.get("docs_ok") == "예":
        s_docs = 10
    else:
        s_docs = 0
    score += s_docs
    breakdown["docs_score"] = s_docs

    # 2. Budget suitability (최저가 <= budget_max)
    price = item.get("price", 0)
    # If budget_max is <= 0 or None, it represents unlimited budget
    if budget_max is None or budget_max <= 0 or price <= budget_max:
        s_budget = 10
    else:
        s_budget = 0
    score += s_budget
    breakdown["budget_score"] = s_budget

    # 3. Close date timing (남은일수 <= time_days)
    remaining_days = calculate_remaining_days(item.get("close_date", ""))
    
    # If time_days is None or <= 0 or 99999, it represents unlimited
    # Otherwise, check if remaining days is positive and within the limit
    if remaining_days < 0:
        # Bidding has already closed
        s_time = 0
    elif time_days is None or time_days <= 0 or time_days == 99999:
        s_time = 5
    elif remaining_days <= time_days:
        s_time = 5
    else:
        s_time = 0
    score += s_time
    breakdown["time_score"] = s_time
    breakdown["remaining_days"] = remaining_days

    # 4. Region matching (주소 내 지역명 포함)
    address = item.get("address", "")
    if not preferred_region or preferred_region == "상관없음":
        s_region = 5
    elif preferred_region in address:
        s_region = 5
    else:
        s_region = 0
    score += s_region
    breakdown["region_score"] = s_region

    # 5. Property type matching (ptype == 유형)
    ptype = item.get("ptype", "")
    if not preferred_ptype or preferred_ptype == "상관없음":
        s_ptype = 5
    elif preferred_ptype in ptype or ptype in preferred_ptype:
        s_ptype = 5
    else:
        s_ptype = 0
    score += s_ptype
    breakdown["ptype_score"] = s_ptype

    # 6. Quality risk penalty for private listings
    if item.get("source") == "private":
        p_private = 2
    else:
        p_private = 0
    score -= p_private
    breakdown["private_penalty"] = p_private

    # Map score to grade
    if score >= 90:
        grade = "A"
    elif score >= 80:
        grade = "B"
    elif score >= 70:
        grade = "C"
    elif score >= 60:
        grade = "D"
    else:
        grade = "E"
        
    return score, grade, breakdown
