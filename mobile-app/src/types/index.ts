// 경매 및 공매 데이터와 필터 상태를 정의하는 타입 선언 파일입니다.

export interface Property {
  id: number;
  source: 'court' | 'court_etc' | 'onbid' | 'onbid_etc' | 'private';
  auction_no: string;
  address: string;
  ptype: string;
  appraised_value: number;
  minimum_bid: number;
  bidding_date: string;
  round_info: string;
  desc_content: string;
  notes_content: string;
  link_url: string;
  grade: string;
  score: number;
  remaining_days: number;
  updated_at?: string;
  land_area?: number;
  building_area?: number;
  owner?: string;
  debtor?: string;
  structure?: string;
  exclusive_area?: number;
  supply_area?: number;
  is_estimated_exclusive?: boolean;
  is_estimated_supply?: boolean;
  is_estimated_land?: boolean;
  is_estimated_building?: boolean;
  complex_info?: {
    complex_name: string;
    total_households: number;
    construction_company: string;
    built_year: number;
  } | null;
  elementary_school?: string;
  recent_deals?: {
    deal_date: string;
    deal_price: number;
    floor: number;
  }[];
  is_estimated?: boolean;
  is_lease?: boolean;
  images?: string[];
  lease_method?: string | null;
  lease_term?: string | null;
  car_info?: {
    car_no: string;
    model_year: string;
    car_model: string;
    mileage: string;
    fuel: string;
    displacement: string;
    color: string;
    accident_history: string;
    inspection_status: string;
  } | null;
  security_info?: {
    company_name: string;
    security_type: string;
    share_count: string;
    face_value: string;
    par_value_total: string;
    financial_status: string;
    major_shareholders: string;
  } | null;
  machinery_info?: {
    machine_name: string;
    maker: string;
    model_year: string;
    status: string;
    standard: string;
  } | null;
  etc_info?: {
    item_name: string;
    quantity: string;
    origin: string;
    status: string;
    notes: string;
  } | null;
}

export interface FilterState {
  search: string;
  source: ('court' | 'court_etc' | 'onbid' | 'onbid_etc' | 'private')[];
  ptype: ('apart' | 'officetel' | 'villa' | 'house' | 'store' | 'land' | 'factory' | 'vehicle' | 'security' | 'machinery' | 'etc_goods')[];
  sido: string[];
  sigungu: string;
  dateLimit: number; // 남은 기일 필터링 (D-Day 한도)
  budgetLimit: number; // 가용 예산 한도
  hidePast: boolean; // 과거 마감 매물 제외 여부
  gradeFilter: 'all' | 'safe' | 'risk'; // AI 등급 분류 필터
  investmentType?: 'all' | 'investment' | 'residence'; // AI 자산 투자 성향 필터
  selectedCourts?: string[]; // 관할 법원 다중 선택 필터
}

