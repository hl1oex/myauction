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
      return { ...item, remaining_days: remainingDays } as Property;
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
 * properties 테이블의 변화를 실시간으로 구독하는 리스너를 생성합니다.
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

    // Supabase Realtime 채널을 활성화하여 모든 INSERT/UPDATE/DELETE 이벤트를 수신합니다.
    const channel = supabase
      .channel('properties-all-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'properties' },
        () => {
          fetchProperties(source, search).then(onData).catch(onError);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (error) {
    console.error('Supabase properties 실시간 리스너 등록 에러', error);
    onError(error as Error);
    return () => {};
  }
}

/**
 * sync_info 테이블의 변화를 실시간으로 구독하는 리스너를 생성합니다.
 */
export function subscribeSyncStatus(
  onData: (status: SyncStatus) => void,
  onError: (error: Error) => void
): () => void {
  try {
    // 최초 1회 상태 데이터를 로드합니다.
    fetchSyncStatus().then(onData).catch(onError);

    const channel = supabase
      .channel('sync_info-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sync_info', filter: 'id=eq.1' },
        () => {
          fetchSyncStatus().then(onData).catch(onError);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (error) {
    console.error('Supabase sync_info 실시간 리스너 등록 에러', error);
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
        return { ...item, remaining_days: remainingDays } as Property;
      });
  } catch (error) {
    console.error('Supabase 관심 물건 조회 실패', error);
    throw error;
  }
}
