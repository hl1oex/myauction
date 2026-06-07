// 경매 및 공매 데이터와 필터 상태를 정의하는 타입 선언 파일입니다.

export interface Property {
  id: number;
  source: 'court' | 'onbid' | 'private';
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
}

export interface FilterState {
  search: string;
  source: 'all' | 'court' | 'onbid' | 'private';
  ptype: 'all' | 'apart' | 'store' | 'house' | 'land' | 'factory';
  sido: string;
  sigungu: string;
  dateLimit: number; // 남은 기일 필터링 (D-Day 한도)
  budgetLimit: number; // 가용 예산 한도
  hidePast: boolean; // 과거 마감 매물 제외 여부
  gradeFilter: 'all' | 'safe' | 'risk'; // AI 등급 분류 필터
}
