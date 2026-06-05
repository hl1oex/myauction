// 로컬 FastAPI 서버 통신 모듈을 대체하여 Firebase Firestore에서 실시간 매물 목록과 수집 로그를 직접 조회하는 데이터 통신 모듈입니다.

import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { Property } from '../types';

// 온라인 Firestore 서버리스 마이그레이션에 따라 기존 API 엔드포인트 URL 제어 변수 및 관련 헬퍼 함수는 사용하지 않습니다.
export function getApiBaseUrl(): string {
  return "https://firestore.googleapis.com";
}

export function setApiBaseUrl(url: string): void {
  // 사용되지 않는 레거시 포트 설정이므로 호출에 따른 무력화 처리를 진행합니다.
}

/**
 * Firestore의 properties 컬렉션으로부터 경공매 자산 데이터를 조회합니다.
 * 조건에 맞춘 서버 사이드 예외 필터(source)를 쿼리에 부여해 클라이언트 트래픽을 경감시킵니다.
 */
export async function fetchProperties(source?: string, search?: string): Promise<Property[]> {
  try {
    const propertiesCollectionRef = collection(db, 'properties');
    let q = query(propertiesCollectionRef);

    // 소스(court, onbid) 조건이 존재한다면 Firestore 쿼리 필터를 추가 적용합니다.
    if (source && source !== 'all') {
      q = query(propertiesCollectionRef, where('source', '==', source));
    }

    const querySnapshot = await getDocs(q);
    const results: Property[] = [];

    querySnapshot.forEach((docSnapshot) => {
      results.push(docSnapshot.data() as Property);
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
    console.error('Firestore 매물 조회 오류 발생', error);
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
 * 수집 크롤러 엔진의 최근 온라인 동기화 로그 및 기일 정보를 status 컬렉션으로부터 조회합니다.
 */
export async function fetchSyncStatus(): Promise<SyncStatus> {
  try {
    const statusDocRef = doc(db, 'status', 'sync_info');
    const docSnapshot = await getDoc(statusDocRef);

    if (docSnapshot.exists()) {
      const data = docSnapshot.data();
      const logs = data.logs || [];
      
      // sync_logs 테이블의 타임스탬프를 기인하여 법원 경매 및 캠코 온비드의 마지막 동기화 일자를 파싱합니다.
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
