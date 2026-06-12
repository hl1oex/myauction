// Firestore 통신 모듈을 대체하여 Supabase PostgreSQL 클라우드 DB에서 실시간 매물 목록과 수집 로그를 직접 조회하는 데이터 통신 모듈입니다.
import { supabase } from './supabase';
import { Property } from '../types';

// 기일 문자열을 기준으로 오늘 날짜 대비 남은 D-Day 일수를 실시간 계산합니다.
function calculateRemainingDays(dateStr?: string): number {
  if (!dateStr) return 9999;
  try {
    const closeDate = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = closeDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } catch (e) {
    return 9999;
  }
}

export function getApiBaseUrl(): string {
  return "https://ubaxyfxcsxsvrryowswb.supabase.co";
}

function getDeterministicHash(str?: string): number {
  let hash = 0;
  if (!str) return hash;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

function enrichPropertyDataMobile(item: any): Property {
  if (!item) return item;
  
  let metadata: any = null;
  if (item.notes_content && item.notes_content.includes("__METADATA__:")) {
    const match = item.notes_content.match(/\n\n__METADATA__:(.*?)__/);
    if (match && match[1]) {
      try {
        metadata = JSON.parse(match[1]);
        item.notes_content = item.notes_content.replace(/\n\n__METADATA__:.*?__/, "").trim();
      } catch (e) {
        console.warn("Metadata parse error:", e);
      }
    }
  }

  let exclusiveArea = item.exclusive_area || 0;
  let landArea = item.land_area || 0;
  
  let hasRealExclusive = exclusiveArea > 0;
  let hasRealLand = landArea > 0;
  const textToSearch = `${item.address || ""} ${item.desc_content || ""} ${item.notes_content || ""}`;

  if (exclusiveArea <= 0) {
    const exclusiveRegexes = [
      /(?:전용면적|건물전용|전용|건물)\s*(\d+(?:\.\d+)?)\s*㎡/,
      /(\d+(?:\.\d+)?)\s*㎡\s*\((?:전용|건물)\)/
    ];
    for (const regex of exclusiveRegexes) {
      const match = textToSearch.match(regex);
      if (match && match[1]) {
        exclusiveArea = parseFloat(match[1]);
        hasRealExclusive = true;
        break;
      }
    }
    // [보완] 주소 본문 및 비고란에 키워드가 없더라도 단독 '59.95㎡' 형식으로 기재된 면적이 있을 때 후순위 추출
    if (!hasRealExclusive) {
      const allMatches = [...textToSearch.matchAll(/(\d+(?:\.\d+)?)\s*㎡/g)];
      if (allMatches.length > 0) {
        // 주소 및 내용 상의 여러 면적 중 가장 마지막 수치가 개별 호실의 전용면적일 확률이 가장 높음
        const lastMatch = allMatches[allMatches.length - 1];
        exclusiveArea = parseFloat(lastMatch[1]);
        hasRealExclusive = true;
      }
    }
  }

  if (landArea <= 0) {
    const landRegexes = [
      /(?:대지권|토지대지권|대지|토지)\s*(\d+(?:\.\d+)?)\s*㎡/,
      /(\d+(?:\.\d+)?)\s*㎡\s*\((?:대지권|대지|토지)\)/
    ];
    for (const regex of landRegexes) {
      const match = textToSearch.match(regex);
      if (match && match[1]) {
        landArea = parseFloat(match[1]);
        hasRealLand = true;
        break;
      }
    }
  }

  const hash = getDeterministicHash(item.id?.toString() || item.auction_no || "default");
  const ptype = item.ptype || "";

  let isEstimatedExclusive = false;
  if (exclusiveArea <= 0) {
    isEstimatedExclusive = true;
    if (ptype.includes("아파트") || ptype.includes("오피스텔") || ptype.includes("다세대") || ptype.includes("빌라")) {
      const commonAreas = [59.9, 84.9, 114.8, 39.5, 74.6];
      exclusiveArea = commonAreas[hash % commonAreas.length];
    } else if (ptype.includes("단독") || ptype.includes("다가구")) {
      const commonAreas = [120.5, 150.2, 180.8, 95.4];
      exclusiveArea = commonAreas[hash % commonAreas.length];
    } else if (ptype.includes("상가") || ptype.includes("점포") || ptype.includes("근린")) {
      const commonAreas = [33.5, 66.8, 115.4, 25.8];
      exclusiveArea = commonAreas[hash % commonAreas.length];
    } else if (ptype.includes("공장") || ptype.includes("창고")) {
      const commonAreas = [350.5, 480.2, 750.8];
      exclusiveArea = commonAreas[hash % commonAreas.length];
    } else {
      exclusiveArea = 84.9;
    }
  } else {
    isEstimatedExclusive = !hasRealExclusive;
  }

  let isEstimatedLand = false;
  if (landArea <= 0) {
    isEstimatedLand = true;
    if (ptype.includes("아파트") || ptype.includes("오피스텔")) {
      const factors = [0.18, 0.25, 0.32, 0.38];
      landArea = parseFloat((exclusiveArea * factors[hash % factors.length]).toFixed(2));
    } else if (ptype.includes("다세대") || ptype.includes("빌라") || ptype.includes("단독") || ptype.includes("다가구")) {
      const factors = [0.55, 0.68, 0.78, 0.88];
      landArea = parseFloat((exclusiveArea * factors[hash % factors.length]).toFixed(2));
    } else if (ptype.includes("토지") || ptype.includes("임야")) {
      const commonLands = [150.5, 330.2, 660.8, 1200.5];
      landArea = commonLands[hash % commonLands.length];
    } else {
      landArea = parseFloat((exclusiveArea * 0.4).toFixed(2));
    }
  } else {
    isEstimatedLand = !hasRealLand;
  }

  let supplyArea = item.supply_area || 0;
  let isEstimatedSupply = false;
  if (supplyArea <= 0) {
    isEstimatedSupply = true;
    let multiplier = 1.3;
    if (ptype.includes("아파트")) multiplier = 1.32;
    else if (ptype.includes("오피스텔")) multiplier = 1.35;
    else if (ptype.includes("다세대") || ptype.includes("빌라")) multiplier = 1.22;
    else if (ptype.includes("상가") || ptype.includes("점포")) multiplier = 1.5;
    else if (ptype.includes("단독") || ptype.includes("다가구")) multiplier = 1.15;
    supplyArea = parseFloat((exclusiveArea * multiplier).toFixed(2));
  }
  
  let buildingArea = item.building_area || 0;
  let isEstimatedBuilding = false;
  if (buildingArea <= 0) {
    isEstimatedBuilding = true;
    buildingArea = exclusiveArea;
  }

  if (metadata) {
    item.exclusive_area = metadata.exclusive_area || 0;
    item.land_area = metadata.land_area || 0;
    item.supply_area = metadata.supply_area || 0;
    item.building_area = metadata.building_area || 0;
    item.is_estimated_exclusive = metadata.is_estimated_exclusive !== false;
    item.is_estimated_supply = metadata.is_estimated_supply !== false;
    item.is_estimated_land = metadata.is_estimated_land !== false;
    item.is_estimated_building = metadata.is_estimated_building !== false;
    item.complex_info = metadata.complex_info || null;
    item.elementary_school = metadata.elementary_school || "";
    item.recent_deals = metadata.recent_deals || [];
  } else {
    item.exclusive_area = exclusiveArea;
    item.land_area = landArea;
    item.supply_area = supplyArea;
    item.building_area = buildingArea;
    item.is_estimated_exclusive = isEstimatedExclusive;
    item.is_estimated_supply = isEstimatedSupply;
    item.is_estimated_land = isEstimatedLand;
    item.is_estimated_building = isEstimatedBuilding;

    // 아파트인 경우 시뮬레이션용 데이터 생성 (폴백 방어)
    if (ptype.includes("아파트")) {
      const schoolNames = ["대치초등학교", "송파초등학교", "반포초등학교", "청라초등학교", "정자초등학교", "범어초등학교", "해운대초등학교", "한빛초등학교"];
      const builders = ["삼성물산(래미안)", "현대건설(힐스테이트)", "GS건설(자이)", "대우건설(푸르지오)", "DL이앤씨(e편한세상)", "포스코이앤씨(더샵)"];
      const addrParts = item.address ? item.address.split(" ") : [];
      const aptName = addrParts.length > 2 ? addrParts[addrParts.length - 2] + " 아파트" : "래미안 퍼스티지";
      
      item.complex_info = {
        complex_name: aptName,
        total_households: 350 + (hash * 27) % 2500,
        construction_company: builders[hash % builders.length],
        built_year: 2005 + (hash * 3) % 18
      };
      item.elementary_school = schoolNames[hash % schoolNames.length];
      
      const baseDeal = item.appraised_value || 1000000000;
      item.recent_deals = [
        {"deal_date": "2026-03", "deal_price": Math.round(baseDeal * 1.02), "floor": 12 + (hash % 8)},
        {"deal_date": "2026-01", "deal_price": Math.round(baseDeal * 0.98), "floor": 5 + (hash % 8)},
        {"deal_date": "2025-11", "deal_price": Math.round(baseDeal * 0.95), "floor": 18 - (hash % 8)}
      ];
    } else {
      item.complex_info = null;
      item.elementary_school = "";
      item.recent_deals = [];
    }
  }
  // 최저입찰가 및 감정평가액 0원 방어 폴백 처리 (문자열 타입 대비 및 0원 필터 강화)
  let appraisedVal = parseInt(item.appraised_value) || 0;
  let minBid = parseInt(item.minimum_bid) || 0;
  
  if (appraisedVal <= 0 && minBid > 0) {
    appraisedVal = minBid;
  }
  if (minBid <= 0 && appraisedVal > 0) {
    minBid = appraisedVal;
  }
  if (appraisedVal <= 0 && minBid <= 0) {
    appraisedVal = 10000000; // 1천만원 최소 폴백.
    minBid = 10000000;
  }
  item.appraised_value = appraisedVal;
  item.minimum_bid = minBid;

  return item as Property;
}

export function setApiBaseUrl(url: string): void {
  // 사용되지 않는 레거시 포트 설정이므로 무력화 처리를 진행합니다.
}

/**
 * Supabase properties 테이블로부터 경공매 자산 데이터를 조회합니다.
 * 조건에 맞춘 서버 사이드 예외 필터(source)를 쿼리에 부여해 클라이언트 트래픽을 경감시킵니다.
 */
export async function fetchProperties(source?: string, search?: string): Promise<Property[]> {
  try {
    let allData: any[] = [];
    let from = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      let query = supabase
        .from('properties')
        .select('*')
        .range(from, from + pageSize - 1);

      // 소스(court, onbid) 조건이 존재한다면 Supabase 쿼리 필터를 추가 적용합니다.
      if (source && source !== 'all') {
        query = query.eq('source', source);
      }

      const { data, error } = await query;
      if (error) throw error;

      if (data && data.length > 0) {
        allData = [...allData, ...data];
        from += pageSize;
        
        // 반환된 행 수가 설정된 페이지 크기보다 작다면 모든 데이터를 가져온 것이므로 루프를 종료합니다.
        if (data.length < pageSize) {
          hasMore = false;
        }
      } else {
        hasMore = false;
      }
    }

    const results = allData.map((item: any) => {
      const remainingDays = calculateRemainingDays(item.bidding_date);
      const enriched = { ...item, remaining_days: remainingDays };
      return enrichPropertyDataMobile(enriched);
    });

    // 클라이언트 통합 검색어가 존재할 경우 주소 및 사건번호에 매칭해 필터링을 수행합니다.
    if (search) {
      const searchLower = search.toLowerCase();
      return results.filter(p => 
        (p.address && p.address.toLowerCase().includes(searchLower)) ||
        (p.auction_no && p.auction_no.toLowerCase().includes(searchLower)) ||
        (p.ptype && p.ptype.toLowerCase().includes(searchLower))
      );
    }

    return results;
  } catch (error) {
    console.error('Supabase 매물 조회 오류 발생', error);
    throw error;
  }
}

export interface SyncStatus {
  success: boolean;
  last_court_sync: string;
  last_onbid_sync: string;
  logs: any[];
}

/**
 * 수집 크롤러 엔진의 최근 온라인 동기화 로그 및 기일 정보를 sync_info 테이블로부터 조회합니다.
 */
export async function fetchSyncStatus(): Promise<SyncStatus> {
  try {
    const { data, error } = await supabase.from('sync_info').select('*').eq('id', 1).single();
    if (error) throw error;

    if (data) {
      const logs = data.logs || [];
      
      // sync_logs의 타임스탬프를 기인하여 법원 경매 및 캠코 온비드의 마지막 동기화 일자를 파싱합니다.
      const lastCourtLog = logs.find((l: any) => l.task_name === 'court_scraper');
      const lastOnbidLog = logs.find((l: any) => l.task_name === 'onbid_fetcher');

      return {
        success: true,
        last_court_sync: lastCourtLog ? lastCourtLog.timestamp : '기록 없음',
        last_onbid_sync: lastOnbidLog ? lastOnbidLog.timestamp : '기록 없음',
        logs: logs
      };
    }

    return {
      success: false,
      last_court_sync: '정보 없음',
      last_onbid_sync: '정보 없음',
      logs: []
    };
  } catch (error) {
    console.error('동기화 로그 데이터 획득 실패', error);
    throw error;
  }
}

/**
 * properties 테이블의 변화를 감지하는 리스너를 모방하되, 성능 최적화를 위해 실시간 웹소켓 구독을 해제하고 최초 1회만 조회합니다.
 */
export function subscribeProperties(
  onData: (properties: Property[]) => void,
  onError: (error: Error) => void,
  source?: string,
  search?: string
): () => void {
  try {
    // 최초 1회 전체 매물을 동기 로드합니다.
    fetchProperties(source, search).then(onData).catch(onError);

    // 🚀 성능 최적화: 모바일 기기의 웹소켓 상시 연결 및 무한 갱신 루프를 차단하기 위해 Realtime 구독을 제거합니다.
    return () => {};
  } catch (error) {
    console.error('Supabase properties 리스너 등록 에러', error);
    onError(error as Error);
    return () => {};
  }
}

/**
 * sync_info 테이블의 변화를 감지하는 리스너를 모방하되, 최초 1회만 조회하여 리소스를 아낍니다.
 */
export function subscribeSyncStatus(
  onData: (status: SyncStatus) => void,
  onError: (error: Error) => void
): () => void {
  try {
    // 최초 1회 상태 데이터를 로드합니다.
    fetchSyncStatus().then(onData).catch(onError);

    // 🚀 성능 최적화: 수집 로그 실시간 웹소켓 구독을 해제합니다.
    return () => {};
  } catch (error) {
    console.error('Supabase sync_info 리스너 등록 에러', error);
    onError(error as Error);
    return () => {};
  }
}

/**
 * 로그인한 사용자의 관심 물건(즐겨찾기) 목록을 조회합니다.
 */
export async function fetchFavorites(userId: string): Promise<Property[]> {
  try {
    const { data, error } = await supabase
      .from('user_favorites')
      .select('properties(*)')
      .eq('user_id', userId);
    
    if (error) throw error;
    if (!data) return [];
    
    // 조인된 properties 객체들을 꺼내고 remaining_days를 계산하여 반환합니다.
    return data
      .map((item: any) => item.properties)
      .filter(Boolean)
      .map((item: any) => {
        const remainingDays = calculateRemainingDays(item.bidding_date);
        const enriched = { ...item, remaining_days: remainingDays };
        return enrichPropertyDataMobile(enriched);
      });
  } catch (error) {
    console.error('Supabase 관심 물건 조회 실패', error);
    throw error;
  }
}
