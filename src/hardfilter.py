import os
import json

def load_rules(rules_path=None):
    """Load configuration rules from config/rules.json."""
    if not rules_path:
        # Resolve path relative to project root
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        rules_path = os.path.join(base_dir, "config", "rules.json")
    
    try:
        with open(rules_path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading rules from {rules_path}: {e}")
        # Default fallback rules if file is missing
        return {
            "구조": ["지분", "대지권없음", "토지별도", "건물만", "토지만", "대지권 미등기"],
            "점유": ["점유관계미상", "유치권", "명도곤란", "유치권 주장"],
            "추가비용": ["인수", "선순위", "선순위 임차인", "대항력", "임차권", "보증금 인수"],
            "정보부족": ["서류없음", "확인불가", "열람불가", "자료없음"]
        }

def evaluate_hardfilter(item, rules=None):
    """
    Evaluates hard filter rules against an item's text fields (address, desc, notes).
    
    Returns:
        (is_passed, reasons_dict)
        - is_passed: True if no bad keywords match, False otherwise
        - reasons_dict: dict of category -> matching_keywords
    """
    if rules is None:
        rules = load_rules()
        
    address = str(item.get("address", "")).strip()
    desc = str(item.get("desc", "")).strip()
    notes = str(item.get("notes", "")).strip()
    
    # Combined text for searching
    search_text = f"{address} {desc} {notes}"
    
    reasons = {}
    is_passed = True
    
    for category, keywords in rules.items():
        matched_keywords = []
        for kw in keywords:
            # Check for partial match (case-insensitive where applicable, though keywords are Korean)
            if kw in search_text:
                matched_keywords.append(kw)
                is_passed = False
        if matched_keywords:
            reasons[category] = matched_keywords
            
    return is_passed, reasons
