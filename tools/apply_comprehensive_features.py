import re
import os

def main():
    filepath = r"d:\BackUp\OneDrive\AI공부\Real estate auction\src\app.py"
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Inject helper functions
    helpers = """def shorten_ptype(ptype):
    if not ptype:
        return ""
    # Simplify property types for card summary columns
    ptype = ptype.replace("다세대 (빌라/연립)", "다세대").replace("단독/다가구/전원주택", "단독/다가구").replace("상가/점포/근린상가", "상가/근린").replace("토지/대지/임야", "토지/대지")
    ptype = ptype.replace("[동산] ", "")
    if len(ptype) > 10:
        return ptype[:10] + "..."
    return ptype

def get_sync_elapsed_seconds():
    court_path = os.path.join(base_dir, "input_sources", "json", "court.json")
    onbid_path = os.path.join(base_dir, "input_sources", "json", "onbid.json")
    latest_time = 0
    if os.path.exists(court_path):
        latest_time = max(latest_time, os.path.getmtime(court_path))
    if os.path.exists(onbid_path):
        latest_time = max(latest_time, os.path.getmtime(onbid_path))
    if latest_time > 0:
        return (datetime.datetime.now() - datetime.datetime.fromtimestamp(latest_time)).total_seconds()
    return 99999999

# Helper function to get the last synchronization date and time"""
    
    content = content.replace("# Helper function to get the last synchronization date and time", helpers)

    # 2. Inject high-fidelity CSS styles including input borders and hover glows
    css_pattern = re.compile(r"html, body, \[class\*=\"css\"\]\s*{.*?}\s*</style>", re.DOTALL)
    
    new_css = """html, body, [class*="css"] {
        font-family: 'Noto Sans KR', 'Outfit', sans-serif;
    }
    
    /* Outer search portal wrapper style (card-in-card design in the middle) */
    .main-search-portal {
        border: 2px solid #cbd5e1 !important;
        background-color: #f8fafc !important;
        border-radius: 16px !important;
        padding: 1.6rem !important;
        margin-top: 1.5rem !important;
        margin-bottom: 2rem !important;
        box-shadow: 0 10px 30px rgba(15, 23, 42, 0.04) !important;
    }
    
    /* Search Box borders and hover micro animations */
    .search-field-box {
        border: 1.8px solid #94a3b8 !important;
        border-radius: 12px !important;
        background-color: #ffffff !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02) !important;
        padding: 0.8rem 1rem !important;
        transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
    }
    .search-field-box:hover {
        border-color: #4f46e5 !important;
        box-shadow: 0 8px 24px rgba(79, 70, 229, 0.12) !important;
        transform: translateY(-2px);
    }
    
    /* Styled labels inside search box inputs */
    .search-field-box label p {
        font-weight: 800 !important;
        color: #1e1b4b !important;
        font-size: 0.95rem !important;
        margin-bottom: 6px !important;
    }
    
    /* Search Portal Header Title Styling */
    .search-portal-title {
        font-size: 1.35rem !important;
        font-weight: 800 !important;
        color: #1e1b4b !important;
        margin-bottom: 14px !important;
        border-bottom: 2px solid #cbd5e1 !important;
        padding-bottom: 8px !important;
    }

    /* Visible borders and hover effects on standard Streamlit input elements */
    div[data-baseweb="select"] {
        border: 1.5px solid #94a3b8 !important;
        border-radius: 8px !important;
        transition: all 0.2s ease !important;
    }
    div[data-baseweb="select"]:hover {
        border-color: #4f46e5 !important;
        box-shadow: 0 0 8px rgba(79, 70, 229, 0.15) !important;
    }
    div[data-testid="stTextInput"] input {
        border: 1.5px solid #94a3b8 !important;
        border-radius: 8px !important;
        transition: all 0.2s ease !important;
    }
    div[data-testid="stTextInput"] input:hover {
        border-color: #4f46e5 !important;
        box-shadow: 0 0 8px rgba(79, 70, 229, 0.15) !important;
    }
    div[data-testid="stSlider"] {
        border: 1.5px solid #e2e8f0 !important;
        padding: 10px !important;
        border-radius: 8px !important;
        background: #ffffff !important;
        transition: all 0.2s ease !important;
    }
    div[data-testid="stSlider"]:hover {
        border-color: #4f46e5 !important;
        box-shadow: 0 0 8px rgba(79, 70, 229, 0.15) !important;
    }
 
    /* Primary buttons - Premium Clickable Style */
    button[data-testid="stBaseButton-primary"] {
        background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%) !important;
        color: #ffffff !important;
        border: 2px solid #6366f1 !important;
        font-weight: 700 !important;
        font-size: 0.98rem !important;
        border-radius: 12px !important;
        padding: 0.7rem 1.8rem !important;
        box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3) !important;
        transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
        letter-spacing: 0.02em;
        width: 100%;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 8px !important;
        cursor: pointer !important;
    }
    
    button[data-testid="stBaseButton-primary"]:hover {
        background: linear-gradient(135deg, #4338ca 0%, #6d28d9 100%) !important;
        border-color: #818cf8 !important;
        box-shadow: 0 8px 25px rgba(99, 102, 241, 0.45) !important;
        transform: translateY(-2px) !important;
    }
 
    button[data-testid="stBaseButton-primary"]:active {
        transform: translateY(1px) scale(0.98) !important;
    }
 
    /* Unified Auction List Styles */
    #auction-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-bottom: 2.5rem;
    }
    
    .auction-header-bar {
        display: grid;
        grid-template-columns: 80px 85px 140px minmax(330px, 1.8fr) 95px 155px 95px 80px 95px 80px;
        gap: 10px;
        background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
        color: #f8fafc;
        padding: 14px 16px;
        border-radius: 12px;
        font-weight: 700;
        font-size: 0.9rem;
        align-items: center;
        margin-bottom: 8px;
        box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05);
        min-width: 1220px !important;
    }
    
    .header-col {
        cursor: pointer;
        user-select: none;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: flex-start;
        padding: 4px 8px;
        border-radius: 6px;
        white-space: nowrap !important;
    }
    .header-col:hover {
        color: #a5b4fc !important;
        background-color: rgba(255, 255, 255, 0.08);
    }
    .header-col.active-sort {
        color: #818cf8 !important;
        font-weight: 800 !important;
        background-color: rgba(99, 102, 241, 0.15);
    }
    
    .header-col.col-score, .header-col.col-grade, .header-col.col-rounds, .header-col.col-discount, .header-col.col-deadline, .header-col.col-links {
        justify-content: center;
        text-align: center;
    }
    .header-col.col-price {
        justify-content: flex-end;
        text-align: right;
    }
    
    .auction-card {
        border: 1px solid #e2e8f0;
        border-radius: 16px;
        background-color: #ffffff;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
        transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        padding: 12px 16px;
        overflow: hidden;
        min-width: 1220px !important;
    }
    
    .auction-card.card-court { border-left: 5px solid #2563eb; }
    .auction-card.card-onbid { border-left: 5px solid #10b981; }
    .auction-card.card-private { border-left: 5px solid #64748b; }
    
    .auction-card:hover {
        border-color: rgba(99, 102, 241, 0.35);
        box-shadow: 0 15px 35px rgba(99, 102, 241, 0.08);
        transform: translateY(-3px);
    }
    
    .card-summary-row {
        display: grid;
        grid-template-columns: 80px 85px 140px minmax(330px, 1.8fr) 95px 155px 95px 80px 95px 80px;
        gap: 10px;
        align-items: center;
        min-width: 1220px !important;
    }
    
    .summary-col {
        display: flex;
        align-items: center;
        justify-content: flex-start;
        font-size: 0.9rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap !important;
    }
    
    .summary-col.col-score, .summary-col.col-grade, .summary-col.col-rounds, .summary-col.col-discount, .summary-col.col-deadline, .summary-col.col-links {
        justify-content: center;
        text-align: center;
    }
    
    .summary-col.col-price {
        justify-content: flex-end;
        text-align: right;
        flex-direction: column;
        align-items: flex-end;
    }
    
    .appraisal-sub {
        color: #64748b;
        font-size: 0.8em;
        font-weight: normal;
        margin-top: 2px;
    }
    
    .rounds-main {
        color: #1e3a8a;
        font-weight: 700;
        display: block;
    }
    .rounds-sub {
        color: #475569;
        font-size: 0.8em;
        display: block;
    }
    
    .card-detail-panel {
        max-height: 0;
        opacity: 0;
        overflow: hidden;
        transition: max-height 0.4s ease, opacity 0.4s ease, margin-top 0.4s ease, padding-top 0.4s ease;
    }
    
    .auction-card:hover .card-detail-panel {
        max-height: 2500px;
        opacity: 1;
        margin-top: 14px;
        padding-top: 14px;
        border-top: 1px dashed #e2e8f0;
    }
    
    /* Sort controller styling (Glassmorphism & Micro Interactive) */
    .sort-control-container {
        margin-top: 18px;
        margin-bottom: 24px;
        background: rgba(255, 255, 255, 0.65);
        backdrop-filter: blur(20px) saturate(180%);
        -webkit-backdrop-filter: blur(20px) saturate(180%);
        padding: 12px 20px;
        border-radius: 16px;
        border: 1px solid rgba(99, 102, 241, 0.18);
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
        box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.04), inset 0 1px 1px rgba(255, 255, 255, 0.8);
    }
    .sort-ctrl-btn {
        cursor: pointer;
        background: rgba(255, 255, 255, 0.9);
        border: 1px solid rgba(226, 232, 240, 0.9);
        color: #475569;
        padding: 6px 14px;
        border-radius: 30px;
        font-weight: 700;
        font-size: 0.76rem;
        transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        display: inline-flex;
        align-items: center;
        gap: 5px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.01);
        user-select: none;
    }
    .sort-ctrl-btn:hover {
        border-color: #818cf8;
        color: #4f46e5;
        background-color: #f5f3ff;
        transform: translateY(-2px);
        box-shadow: 0 6px 18px rgba(99, 102, 241, 0.1);
    }
    .sort-ctrl-btn:active {
        transform: translateY(0px) scale(0.97);
    }
    /* Active Sort State Highlight (보라색 입체 글로우 효과) */
    .sort-ctrl-btn.active-sort, .header-col.active-sort {
        background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%) !important;
        border-color: #6366f1 !important;
        color: #ffffff !important;
        font-weight: 800 !important;
        box-shadow: 0 4px 12px rgba(99, 102, 241, 0.35) !important;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    }
    
    /* Interactive Mini-Calculator Keypad active click physics feedback */
    .calc-btn {
        transition: all 0.1s ease !important;
        outline: none !important;
    }
    .calc-btn:active {
        transform: translateY(1.5px) !important;
        border-bottom-width: 1px !important;
    }
    
    /* Hide number inputs spinner wheels for bid calculator inputs */
    input.calc-bid-input::-webkit-outer-spin-button,
    input.calc-bid-input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }
    input.calc-bid-input {
        -moz-appearance: textfield;
    }

    /* Calculator status pulse animation */
    @keyframes sync-pulse {
        0% { opacity: 0.4; box-shadow: 0 0 2px #22c55e; }
        50% { opacity: 1; box-shadow: 0 0 8px #22c55e; }
        100% { opacity: 0.4; box-shadow: 0 0 2px #22c55e; }
    }

    /* Scrollable Container for Desktop Table layout */
    .auction-list-container {
        width: 100%;
        overflow-x: auto;
        padding-bottom: 12px;
        -webkit-overflow-scrolling: touch;
    }

    /* High-Fidelity Fluid Multi-Screen Responsive Styles */
    @media (min-width: 1200px) {
        /* Widens the address display dynamically on large widescreen screens */
        .summary-col.col-address {
            white-space: normal !important;
            overflow: visible !important;
            text-overflow: clip !important;
            line-height: 1.4 !important;
            font-size: 0.88rem !important;
            padding-right: 10px !important;
        }
    }

    @media (max-width: 1200px) and (min-width: 768px) {
        /* Tablet & medium size viewport support: enforce scroll and prevent table squishing */
        .auction-list-container {
            overflow-x: auto !important;
        }
        .auction-header-bar, .card-summary-row {
            min-width: 1220px !important;
        }
        .auction-card {
            min-width: 1220px !important;
        }
        .calc-layout {
            grid-template-columns: 220px 1fr !important;
            gap: 1.2rem !important;
        }
    }

    @media (max-width: 768px) {
        .auction-header-bar {
            display: none !important; /* Hide header bar on mobile */
        }
        .auction-card {
            min-width: 100% !important;
            width: 100% !important;
            padding: 12px !important;
            margin-bottom: 10px !important;
            border-radius: 12px !important;
        }
        .card-summary-row {
            display: flex !important;
            flex-direction: column !important;
            align-items: stretch !important;
            min-width: 100% !important;
            gap: 8px !important;
        }
        .summary-col {
            width: 100% !important;
            justify-content: flex-start !important;
            text-align: left !important;
            white-space: normal !important;
        }
        .summary-col.col-score, .summary-col.col-grade {
            display: inline-flex !important;
            width: auto !important;
            margin-right: 6px !important;
        }
        .summary-col.col-case {
            font-size: 1.0rem !important;
            font-weight: 700 !important;
            margin-top: 4px !important;
        }
        .summary-col.col-address {
            color: #475569 !important;
            font-size: 0.85rem !important;
            line-height: 1.3 !important;
        }
        .summary-col.col-ptype {
            font-size: 0.82rem !important;
            background: #f1f5f9 !important;
            padding: 2px 6px !important;
            border-radius: 4px !important;
            width: fit-content !important;
        }
        .summary-col.col-price {
            align-items: flex-start !important;
            text-align: left !important;
            font-size: 0.95rem !important;
            margin-top: 4px !important;
        }
        .summary-col.col-rounds, .summary-col.col-discount, .summary-col.col-deadline {
            font-size: 0.82rem !important;
            display: inline-flex !important;
            width: auto !important;
            margin-right: 12px !important;
        }
        .summary-col.col-links {
            margin-top: 6px !important;
            border-top: 1px solid #f1f5f9 !important;
            padding-top: 8px !important;
            justify-content: space-between !important;
            flex-direction: row !important;
        }
        .calc-layout {
            grid-template-columns: 1fr !important;
            gap: 1.0rem !important;
        }
        .calc-device {
            width: 100% !important; /* Full width on mobile */
            max-width: 250px !important;
            margin: 0 auto !important;
        }
        .smart-calculator-container {
            padding-top: 0.8rem !important;
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
    </style>"""
    
    content, count = css_pattern.subn(new_css, content)
    print(f"Applied CSS styling: {count} matches")

    # 3. Restructure sidebar and main tab rendering
    # We will remove the sidebar search container from line 1166 to 1338 in original HEAD
    # And we will replace it in app.py with a very clean sidebar!
    # Let's inspect what is currently in line 1165-1339.
    # We will write a clean, compact sidebar in app.py:
    
    clean_sidebar = """# Sidebar Setup
with st.sidebar.container(border=True):
    st.image("src/images/developer_guide.png", use_container_width=True)
    st.markdown('<div class="sidebar-card-title">⚙️ 리소스 관리 패널</div>', unsafe_allow_html=True)
    
    # Sliders for display limits
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
    
    st.info("💡 **안내**: 상세 필터 검색 패널은 대시보드 화면 중앙에 정렬되어 있습니다. 넓고 쾌적한 화면에서 조건별 상세 검색을 가동하실 수 있습니다.")
"""
    
    # Let's replace the whole sidebar container block with the clean sidebar
    sidebar_pattern = re.compile(
        r"with st\.sidebar\.container\(border=True\):.*?# Process parameters based on selections", 
        re.DOTALL
    )
    
    content, count = sidebar_pattern.subn(clean_sidebar + "\n# Process parameters based on selections", content)
    print(f"Cleaned sidebar container: {count} matches")

    # 4. In st.session_state initialization, make sure all session states are pre-defined!
    # We should define selected_sido, selected_source, etc. at the top of parameters
    # Let's check lines around `sel_sido_box` initialization:
    # `# Initialize widget session states for resetting`
    # We will ensure they are initialized in the main scope so no NameErrors occur.
    
    init_state_pattern = """# Initialize Session States
if "private_data" not in st.session_state:
    st.session_state["private_data"] = []
if "uploaded_filename" not in st.session_state:
    st.session_state["uploaded_filename"] = ""
if "sel_sido_box" not in st.session_state:
    st.session_state["sel_sido_box"] = "전국"
if "sel_source" not in st.session_state:
    st.session_state["sel_source"] = "전체보기 (법원 경매 + 온비드 공매)"
if "sel_budget" not in st.session_state:
    st.session_state["sel_budget"] = "제한 없음"
if "sel_time" not in st.session_state:
    st.session_state["sel_time"] = "3개월 이내"
if "search_query_box" not in st.session_state:
    st.session_state["search_query_box"] = ""

ptype_opts = [
    "아파트", "다세대 (빌라/연립)", "단독/다가구/전원주택", "오피스텔", 
    "상가/점포/근린상가", "토지/대지/임야", "공장/창고", 
    "[동산] 자동차 / 운송장비", "[동산] 기계 / 장비", "[동산] 물품 / 예술품", 
    "[동산] 유가증권 / 회원권", "기타/미분류"
]
for opt in ptype_opts:
    cb_key = f"cb_ptype_{opt}"
    if cb_key not in st.session_state:
        st.session_state[cb_key] = True

# Process parameter variables beforehand with safe defaults to prevent NameErrors
search_query = st.session_state.get("search_query_box", "")
selected_source = st.session_state.get("sel_source", "전체보기 (법원 경매 + 온비드 공매)")
selected_sido = st.session_state.get("sel_sido_box", "전국")
selected_sidos = ["전국"] if selected_sido == "전국" else [selected_sido]
selected_budget = st.session_state.get("sel_budget", "제한 없음")
selected_timeline = st.session_state.get("sel_time", "3개월 이내")
selected_sigungus = []
for k, v in st.session_state.items():
    if k.startswith("cb_sigungu_") and v:
        selected_sigungus.append(k.replace("cb_sigungu_", ""))
selected_ptypes = []
for opt in ptype_opts:
    if st.session_state.get(f"cb_ptype_{opt}", True):
        selected_ptypes.append(opt)
"""

    content = re.sub(
        r"# Initialize Session States.*?# Process parameters based on selections", 
        init_state_pattern + "\n# Process parameters based on selections", 
        content, 
        flags=re.DOTALL
    )
    print("Injected pre-initialization variables logic.")

    # 5. Restructure the main body tab_dashboard to render banner, status cards, 12-hour sync button, and search widgets!
    # Let's inspect where tab_dashboard is rendering.
    # It starts with: `with tab_dashboard:`
    # We will replace `with tab_dashboard:` content all the way to `strictly_matched_recommended = sorted(...)`
    # Let's write a majestic tab_dashboard block!
    
    new_dashboard_block = """with tab_dashboard:
    # A. Render Banner Image
    st.image("src/images/home_banner.png", use_container_width=True)
    
    # B. Force 12-hour sync checking
    elapsed_seconds = get_sync_elapsed_seconds()
    lock_limit = 43200 # 12 hours
    is_locked = elapsed_seconds < lock_limit
    remaining_seconds = max(0, lock_limit - elapsed_seconds)
    remaining_hours = remaining_seconds / 3600.0

    st.subheader("📊 실시간 데이터 완전성 센서 상태")
    col_status_left, col_status_right = st.columns([3, 1])
    with col_status_left:
        if realtime_status == 'NORMAL':
            render_html(f\"\"\"
                <div class="status-card status-normal" style="margin-bottom: 0px !important;">
                    <h4>🟢 실시간 경매/공매 데이터 연동 정상 (NORMAL)</h4>
                    <p>{realtime_status_desc}</p>
                    <small style="opacity: 0.8;"><b>데이터 검증 기준:</b> 최근 36시간 이내 수집 성공 및 데이터 1건 이상 적재 완료</small>
                </div>
            \"\"\")
        elif realtime_status == 'PARTIAL':
            render_html(f\"\"\"
                <div class="status-card status-partial" style="margin-bottom: 0px !important;">
                    <h4>🟡 실시간 데이터 일부 주의 (PARTIAL)</h4>
                    <p>{realtime_status_desc}</p>
                    <small style="opacity: 0.8;"><b>데이터 검증 기준:</b> 최근 36시간 이내 수집 성공 및 데이터 1건 이상 적재 완료</small>
                </div>
            \"\"\")
        else: # FAIL
            render_html(f\"\"\"
                <div class="status-card status-fail" style="margin-bottom: 0px !important;">
                    <h4>🔴 실시간 데이터 연동 장애 (FAIL)</h4>
                    <p>{realtime_status_desc}</p>
                    <small style="opacity: 0.8;"><b>데이터 검증 기준:</b> 최근 36시간 이내 수집 성공 및 데이터 1건 이상 적재 완료</small>
                </div>
            \"\"\")
            
    with col_status_right:
        if is_locked:
            st.button(
                f"🔒 즉시 수집 불가 ({remaining_hours:.1f}시간 대기)",
                disabled=True,
                key="btn_force_sync_locked",
                help=f"과도한 트래픽 및 공공 API 서버 차단 방지를 위해 마지막 수집 시각 기준 12시간 이내에는 강제 즉시 수집이 불가능합니다. (마지막 수집: {sync_time})"
            )
        else:
            if st.button("🔄 실시간 즉시 수집 실행", key="btn_force_sync_active", type="primary", help="12시간 락 해제 완료! 대법원 및 온비드 공매 실시간 데이터 강제 수집을 원격 트리거합니다."):
                with st.spinner("🔄 실시간 공식 사이트 크롤링 및 수집 구동 중... (약 15~30초 소요)"):
                    try:
                        from tools.onbid_fetcher import fetch_onbid_data
                        from tools.court_scraper import scrape_court_data
                        fetch_onbid_data()
                        scrape_court_data()
                        st.toast("⚡ 실시간 수집 및 동기화가 성공적으로 완료되었습니다!", icon="✅")
                        st.rerun()
                    except Exception as e:
                        st.error(f"실시간 즉시 수집 실패: {e}")

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
            st.error(onbid_status_msg + "\\n\\n💡 **온비드 연동 장애시 플랜B 해결 가이드**: 공공데이터포털 API 키 만료로 인해 수집이 안될 때, 온비드 홈페이지에서 '공고일정표' 엑셀/CSV 파일을 직접 다운로드받아 좌측 사이드바 **[사설 경매 파일 수동 업로드]**에 드래그하여 올려주시면 정상적으로 데이터가 병합되어 작동합니다.")

    # C. Injected 5-Plan Automated Data Architecture Box
    with st.expander("⚡ 5대 실시간 자동 수집 연동 플랜 (Plan A ~ E) 아키텍처 상세", expanded=False):
        st.markdown(\"\"\"
        <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border: 1.5px solid #334155; border-radius: 12px; padding: 1.2rem; color: #f8fafc;">
            <div style="font-weight: 800; font-size: 1.1rem; color: #38bdf8; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; user-select: none;">
                ⚙️ 100% 무인 자동 업데이트 채널 가동 상태
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px; font-size: 0.88rem; line-height: 1.6;">
                <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 10px;">
                    <strong style="color: #60a5fa; font-size: 0.92rem;">🚀 플랜 A: GitHub Actions (클라우드 스케줄러)</strong><br/>
                    • 매일 새벽 3시에 클라우드 환경에서 크론 자동 트리거가 동작하여 대법원 및 온비드 사이트를 완전 자동으로 스크래핑한 뒤 로컬 DB에 자동 배포하는 1순위 무인 자동화 체계입니다.
                </div>
                <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 10px;">
                    <strong style="color: #34d399; font-size: 0.92rem;">🔌 플랜 B: 공공데이터포털 Open API 실시간 연동</strong><br/>
                    • 공공 포털의 KAMCO 자산물건 정보 OpenAPI에 1시간마다 실시간 백그라운드 호출을 실행하여, 신규 온비드 공매 물건 정보를 탐지하고 실시간 업데이트합니다.
                </div>
                <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 10px;">
                    <strong style="color: #fbbf24; font-size: 0.92rem;">🔄 플랜 C: 다중 노드 웹 크롤러 정기 데몬</strong><br/>
                    • 분산된 로컬 백업 서버의 스케줄러(Windows Task / Cron)를 통해 12시간마다 자동 백그라운드 크롤링 데몬을 구동하여 공식 DB의 무결성을 2중으로 상시 보강합니다.
                </div>
                <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; padding: 10px;">
                    <strong style="color: #f87171; font-size: 0.92rem;">🌐 플랜 D: 헤드리스 브라우저 Selenium 자동화</strong><br/>
                    • 대법원 사이트의 스크립트 차단 및 변경 감지 시, Selenium Headless Chrome 브라우저 가상 구동 데몬이 자동 가동되어 원문 매각명세서와 하자를 정밀 수집합니다.
                </div>
            </div>
            <div style="margin-top: 12px; padding: 10px; background: rgba(124, 58, 237, 0.1); border: 1px solid rgba(124, 58, 237, 0.2); border-radius: 8px; text-align: center;">
                <strong style="color: #a78bfa;">☁️ 플랜 E: AWS Lambda & CloudWatch 정기 동적 트리거</strong><br/>
                <span style="font-size: 0.82rem; color: #cbd5e1;">• 고가용성을 위해 AWS 서버리스 환경에서 무중단 분산 수집을 분 단위로 처리하며, IP 블록 발생 시 프록시 노드를 자동으로 우회 가동하는 지능형 클라우드 자동화 시스템입니다.</span>
            </div>
        </div>
        \"\"\", unsafe_allow_html=True)

    # D. Render Unified Search Filter Portal in the MIDDLE (Centered Column Layout)
    st.write("---")
    st.markdown('<div class="main-search-portal">', unsafe_allow_html=True)
    st.markdown('<div class="search-portal-title">🔍 AI 맞춤형 추천 매물 통합 검색 포털</div>', unsafe_allow_html=True)
    
    col_srch1, col_srch2 = st.columns(2)
    with col_srch1:
        search_query = st.text_input(
            "🔍 1. 통합 키워드 검색 (실시간)",
            value=st.session_state.get("search_query_box", ""),
            placeholder="예: 평택시, 아파트, 자동차, 2022타경",
            key="search_query_box",
            help="주소, 사건/관리번호, 물건 유형, 설명/비고 텍스트에서 실시간으로 키워드를 검색합니다."
        )
        
        selected_source = st.selectbox(
            "⚖️ 2. 물건 출처 선택 필터",
            ["전체보기 (법원 경매 + 온비드 공매)", "대법원 법원경매만 보기", "캠코 온비드 공매만 보기"],
            key="sel_source",
            help="조회하고자 하는 매물의 공식 수집망 출처를 필터링합니다."
        )
        
        selected_sido = st.selectbox(
            "📍 3. 관심 지역(시/도) 선택", 
            ["전국"] + list(FULL_REGIONS.keys()), 
            key="sel_sido_box",
            help="부동산이 위치한 행정구역을 선택합니다. '전국'을 선택하시면 우리나라 전체 매물을 검색합니다."
        )
        selected_sidos = ["전국"] if selected_sido == "전국" else [selected_sido]
        
    with col_srch2:
        selected_budget = st.selectbox(
            "💰 4. 최대 매입 예산 설정", 
            ["5천만 원", "1억 원", "2억 원", "3억 원", "5억 원", "7억 원", "10억 원", "15억 원", "20억 원", "30억 원", "제한 없음"], 
            key="sel_budget",
            help="경매나 공매의 최저 입찰가격 상한선을 설정합니다. 이 가격 이하로 시작하는 안전한 매물만 필터링되어 나타납니다."
        )

        selected_timeline = st.selectbox(
            "📅 5. 입찰 마감 기한 설정", 
            ["1개월 이내", "3개월 이내", "6개월 이내", "1년 이내", "2년 이내", "3년 이내", "5년 이내", "제한 없음"], 
            key="sel_time",
            help="실제 법원에 가서 입찰하거나 온비드로 입찰서를 제출해야 하는 마감기한(매각기일)이 남은 기간입니다."
        )
        
    # Sigungu and property types in centered expanders
    col_exp1, col_exp2 = st.columns(2)
    with col_exp1:
        sigungu_opts = []
        if selected_sido == "전국":
            for sd in FULL_REGIONS:
                sigungu_opts.extend([f"{sd} {sg}" for sg in FULL_REGIONS[sd]])
        else:
            sigungu_opts.extend([f"{selected_sido} {sg}" for sg in FULL_REGIONS[selected_sido]])
        sigungu_opts = sorted(sigungu_opts)

        selected_sigungus = []
        if selected_sido == "전국":
            st.info("📍 전국 단위 시/군/구 필터 적용 중")
        else:
            with st.expander(f"📍 {selected_sido} 세부 지역 선택 (중복 설정)", expanded=True):
                col_sg1, col_sg2 = st.columns(2)
                with col_sg1:
                    if st.button("전체선택", key="btn_sigungu_all"):
                        for opt in sigungu_opts:
                            st.session_state[f"cb_sigungu_{opt}"] = True
                with col_sg2:
                    if st.button("전체해제", key="btn_sigungu_none"):
                        for opt in sigungu_opts:
                            st.session_state[f"cb_sigungu_{opt}"] = False
                        
                with st.container(height=160):
                    for opt in sigungu_opts:
                        cb_key = f"cb_sigungu_{opt}"
                        if cb_key not in st.session_state:
                            st.session_state[cb_key] = False
                        is_checked = st.checkbox(opt, key=cb_key)
                        if is_checked:
                            selected_sigungus.append(opt)

    with col_exp2:
        with st.expander("🏢 희망 부동산 종류 선택 (중복 설정)", expanded=True):
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
            with st.container(height=160):
                for opt in ptype_opts:
                    cb_key = f"cb_ptype_{opt}"
                    if cb_key not in st.session_state:
                        st.session_state[cb_key] = True
                    is_checked = st.checkbox(opt, key=cb_key)
                    if is_checked:
                        selected_ptypes.append(opt)

    col_btn1, col_btn2 = st.columns([3, 1])
    with col_btn1:
        if st.button("🔍 매칭 추천 시작 / 실시간 필터 적용", type="primary", key="btn_apply_search"):
            st.toast("⚡ 매칭 조건이 대시보드 중앙에 실시간 반영되었습니다!", icon="✅")
    with col_btn2:
        if st.button("🔄 조건 초기화", key="btn_reset_search", on_click=reset_filters):
            st.rerun()

    st.markdown('</div>', unsafe_allow_html=True)

    # E. Process values inside dashboard tab to ensure correct reactive variables
    budget_val = budget_map.get(selected_budget, 10000000000000)
    time_val = time_map.get(selected_timeline, 99999)
    active_regions = selected_sigungus
    active_ptypes = selected_ptypes
    preferred_ptype_keywords = get_ptype_keywords(selected_ptypes)
    filter_sido = selected_sido
"""
    
    # Let's replace the tab_dashboard header and content up to the strict filtering logic
    tab_dashboard_pattern = re.compile(
        r"with tab_dashboard:.*?col_stat1, col_stat2, col_stat3, col_stat4 = st\.columns\(4\).*?if selected_source == \"캠코 온비드 공매만 보기\":.*?# Detailed Search Conditions Dashboard", 
        re.DOTALL
    )
    # Actually let's just make it replace cleanly in a targeted manner.
    # The start is `with tab_dashboard:` at line 1614 of the file.
    # Let's replace the segment from `with tab_dashboard:` down to `is_default_filters = (` at line 1860.
    
    content = re.sub(
        r"with tab_dashboard:.*?is_default_filters = \(", 
        new_dashboard_block + "\n    is_default_filters = (", 
        content, 
        flags=re.DOTALL
    )
    print("Injected centered search filter portal and 12-hour sync buttons.")

    # 6. Embed illustration images inside tab_glossary and tab_guide
    # Let's place st.image inside tab_glossary and tab_guide
    content = content.replace(
        'with tab_glossary:\n    st.markdown("## 📚 초보자를 위한 경매 용어 및 법적 리스크 백과사전")',
        'with tab_glossary:\n    st.image("src/images/glossary_cover.png", use_container_width=True)\n    st.markdown("## 📚 초보자를 위한 경매 용어 및 법적 리스크 백과사전")'
    )
    content = content.replace(
        'with tab_guide:\n    st.markdown("## ⚙️ 대법원 경매 및 온비드 공매 데이터 연동 가이드")',
        'with tab_guide:\n    st.image("src/images/developer_guide.png", use_container_width=True)\n    st.markdown("## ⚙️ 대법원 경매 및 온비드 공매 데이터 연동 가이드")'
    )
    print("Embedded illustration banner images.")

    # 7. Make the Bidding Price Calculator inside the card even more robust
    # We will update the HTML layout for the calculator to represent the Bidding Price Calculator (예상 낙찰가 계산기)
    # LCD Display title: planned bidding price -> '예상 낙찰가 (Bid Price)'
    content = content.replace(
        'PLANNING BID PRICE',
        '예상 낙찰가 (Bid Price)'
    )
    
    # Update Receipt Title: '🧾 입찰가 기준 세금 및 필요비용 상세 내역' -> '🧾 낙찰가 기준 예상 필요 자금 내역'
    content = content.replace(
        '🧾 입찰가 기준 세금 및 필요비용 상세 내역',
        '🧾 낙찰가 기준 예상 필요 자금 내역'
    )

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)

    print("All UI changes successfully written to app.py!")

if __name__ == "__main__":
    main()
