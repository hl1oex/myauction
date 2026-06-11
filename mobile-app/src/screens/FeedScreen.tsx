// 실시간 경매 및 공매 매물 목록을 조회하고 다양한 조건으로 필터링하는 메인 피드 화면입니다.

import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
  Platform,
} from 'react-native';
import { Property, FilterState } from '../types';
import { COLORS } from '../components/Theme';
import { PropertyCard } from '../components/PropertyCard';
import { subscribeProperties } from '../utils/api';
import { supabase } from '../utils/supabase';


const FULL_REGIONS: Record<string, string[]> = {
  "서울": ["강남구", "강동구", "강북구", "강서구", "관악구", "광진구", "구로구", "금천구", "노원구", "도봉구", "동대문구", "동작구", "마포구", "서대문구", "서초구", "성동구", "성북구", "송파구", "양천구", "영등포구", "용산구", "은평구", "종로구", "중구", "중랑구"],
  "부산": ["강서구", "금정구", "기장군", "남구", "동구", "동래구", "부산진구", "북구", "사상구", "사하구", "서구", "수영구", "연제구", "영도구", "중구", "해운대구"],
  "대구": ["남구", "달서구", "달성군", "동구", "북구", "서구", "수성구", "중구", "군위군"],
  "인천": ["강화군", "계양구", "남동구", "동구", "미추홀구", "부평구", "서구", "연수구", "옹진군", "중구"],
  "광주": ["광산구", "남구", "동구", "북구", "서구"],
  "대전": ["대덕구", "동구", "서구", "유성구", "중구"],
  "울산": ["남구", "동구", "북구", "울주군", "중구"],
  "세종": ["세종시"],
  "경기": ["가평군", "고양시 덕양구", "고양시 일산동구", "고양시 일산서구", "과천시", "광명시", "광주시", "구리시", "군포시", "김포시", "남양주시", "동두천시", "부천시", "성남시 분당구", "성남시 수정구", "성남시 중원구", "수원시 권선구", "수원시 영통구", "수원시 장안구", "수원시 팔달구", "시흥시", "안산시 단원구", "안산시 상록구", "안성시", "안양시 동안구", "안양시 만안구", "양주시", "양평군", "여주시", "연천군", "오산시", "용인시 기흥구", "용인시 수지구", "용인시 처인구", "의왕시", "의정부시", "이천시", "파주시", "평택시", "포천시", "하남시", "화성시"],
  "강원": ["강릉시", "고성군", "동해시", "삼척시", "속초시", "양구군", "양양군", "영월군", "원주시", "인제군", "정선군", "철원군", "춘천시", "태백시", "평창군", "홍천군", "화천군", "횡성군"],
  "충북": ["괴산군", "단양군", "보은군", "영동군", "옥천군", "음성군", "제천시", "증평군", "진천군", "청주시 상당구", "청주시 서원구", "청주시 청원구", "청주시 흥덕구", "충주시"],
  "충남": ["계룡시", "공주시", "금산군", "논산시", "당진시", "부여군", "서산시", "서천군", "아산시", "예산군", "천안시 동남구", "천안시 서북구", "청양군", "태안군", "홍성군"],
  "전북": ["고창군", "군산시", "김제시", "남원시", "무주군", "부안군", "순창군", "완주군", "익산시", "임실군", "장수군", "전주시 덕진구", "전주시 완산구", "정읍시", "진안군"],
  "전남": ["강진군", "고흥군", "곡성군", "광양시", "구례군", "나주시", "담양군", "목포시", "무안군", "보성군", "순천시", "신안군", "여수시", "영광군", "영암군", "완도군", "장성군", "장흥군", "진도군", "함평군", "해남군", "화순군"],
  "경북": ["경산시", "경주시", "고령군", "구미시", "김천시", "문경시", "봉화군", "상주시", "성주군", "안동시", "영덕군", "영양군", "영주시", "영천시", "예천군", "울릉군", "울진군", "의성군", "청도군", "청송군", "칠곡군", "포항시 남구", "포항시 북구"],
  "경남": ["거제시", "거창군", "고성군", "김해시", "남해군", "밀양시", "사천시", "산청군", "양산시", "의령군", "진주시", "창녕군", "창원시 마산합포구", "창원시 마산회원구", "창원시 성산구", "창원시 의창구", "창원시 진해구", "통영시", "하동군", "함안군", "함양군", "합천군"],
  "제주": ["제주시", "서귀포시"]
};

const fallbackData: Property[] = [
  {
    id: 101,
    source: "court",
    auction_no: "2025타경10452",
    address: "서울특별시 강남구 대치동 988 대치팰리스 아파트 101동 1502호",
    ptype: "아파트/주택",
    appraised_value: 2600000000,
    minimum_bid: 2080000000,
    bidding_date: "2026-07-15",
    round_info: "2회차 (20% 저감)",
    desc_content: "대항력 미상의 임차인이 전입되어 있으며, 소유권 이전 청구권 가등기가 등기상 설정되어 있어 인수 여부에 대한 사전 법률 위험 확인이 요구되는 아파트입니다.",
    notes_content: "⚠️ 선순위 가등기 인수 리스크 우려 / 보증금 인수 가능성",
    link_url: "https://www.courtauction.go.kr",
    grade: "B",
    score: 82,
    remaining_days: 44
  },
  {
    id: 102,
    source: "onbid",
    auction_no: "2025-08745-001",
    address: "경기도 성남시 분당구 정자동 182 상록마을 상가 2층 204호",
    ptype: "상가/점포/근린상가",
    appraised_value: 850000000,
    minimum_bid: 680000000,
    bidding_date: "2026-06-25",
    round_info: "1회차 (최초 법사)",
    desc_content: "인근 유동인구가 활발한 근린 상업구역이며, 공실 상태로 즉각적인 상가 명도가 원활하여 추가 유치권 리스크가 없는 우량 상가 부동산입니다.",
    notes_content: "🟢 명도 안전성 우수 / 대지권 비율 완벽 확보",
    link_url: "https://www.onbid.co.kr",
    grade: "A",
    score: 95,
    remaining_days: 24
  },
  {
    id: 103,
    source: "court",
    auction_no: "2025타경45812",
    address: "서울특별시 서초구 반포동 2-8 반포자이 아파트 104동 301호",
    ptype: "아파트/주택",
    appraised_value: 3400000000,
    minimum_bid: 2720000000,
    bidding_date: "2026-06-18",
    round_info: "2회차 매각기일",
    desc_content: "공동 소유주의 지분 분할 청구 소송에 기인하여 형식적 경매가 청구된 아파트입니다. 지분 전원을 일괄 취득하여 하자가 매우 적습니다.",
    notes_content: "🟢 형식적 경매 지분 전원 취득 완벽 / 권리관계 무결성 우수",
    link_url: "https://www.courtauction.go.kr",
    grade: "A",
    score: 98,
    remaining_days: 17
  },
  {
    id: 104,
    source: "court",
    auction_no: "2025타경9985",
    address: "경기도 용인시 기흥구 보정동 1247 단독 전원주택",
    ptype: "단독/다가구/전원주택",
    appraised_value: 1200000000,
    minimum_bid: 600000000,
    bidding_date: "2026-05-15",
    round_info: "3회차 (50% 대폭 저감)",
    desc_content: "토지가 제외되고 지상 건물만 매각되는 '건물만 매각' 특수 물건입니다. 토지 소유주로부터 건물 철거 소송 및 지료 청구 압박 분쟁 위험이 심대하여 입찰 주의가 요망됩니다.",
    notes_content: "⚠️ 건물만 매각 리스크 극대화 / 토지 사용 지료 분쟁 소송 우려",
    link_url: "https://www.courtauction.go.kr",
    grade: "X",
    score: 0,
    remaining_days: -17
  }
];

interface FeedScreenProps {
  onSelectProperty: (property: Property) => void;
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
}

export const FeedScreen: React.FC<FeedScreenProps> = ({ onSelectProperty, filters, setFilters }) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilterPanel, setShowFilterPanel] = useState<boolean>(false);
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState<boolean>(false);
  const [adSettings, setAdSettings] = useState<any[]>([]);
  const [expandedAccordion, setExpandedAccordion] = useState<Record<string, boolean>>({
    search: false,
    source: false,
    court: false,
    ptype: false,
    sido: false,
    budget: false,
    date: false,
    grade: false,
    investment: false,
  });

  // Supabase로부터 활성화된 광고 데이터를 가져옵니다.
  useEffect(() => {
    const fetchAds = async () => {
      try {
        const { data, error } = await supabase
          .from('ads')
          .select('*')
          .eq('active', true);
        if (!error && data) {
          setAdSettings(data);
        }
      } catch (err) {
        console.warn('모바일 광고 연동 실패', err);
      }
    };
    fetchAds();
  }, []);

  const toggleAccordion = (key: string) => {
    setExpandedAccordion((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // 로그인 세션 상태의 변화를 감지하여 유저 고유 식별자를 업데이트합니다.
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && session.user) {
        setUserId(session.user.id);
      } else {
        setUserId(null);
        setFavoriteIds(new Set());
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session && session.user) {
        setUserId(session.user.id);
      } else {
        setUserId(null);
        setFavoriteIds(new Set());
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Supabase로부터 로그인 사용자의 관심 매물 리스트를 받아와 Set 구조로 캐싱합니다.
  const loadFavorites = useCallback(async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('user_favorites')
        .select('property_id')
        .eq('user_id', uid);
      if (error) throw error;
      setFavoriteIds(new Set((data || []).map((f: any) => f.property_id)));
    } catch (err) {
      console.error('FeedScreen의 관심 물건 로드 오류', err);
    }
  }, []);

  // 유저 정보가 활성화될 때 실시간 관심 물건 데이터를 연동합니다.
  useEffect(() => {
    if (userId) {
      loadFavorites(userId);
    }
  }, [userId, loadFavorites]);

  // Firestore properties 실시간 구독 리스너 가동 (실시간 연동 완비)
  // 다중 필터로 개편되었으므로, 서버사이드 쿼리 파라미터는 'all'로 고정하여 전체 매물을 가져온 후 클라이언트 로컬 필터링을 수행합니다.
  useEffect(() => {
    setLoading(true);
    setError(null);

    const unsubscribe = subscribeProperties(
      async (data) => {
        setProperties(data);
        setIsOffline(false);
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            localStorage.setItem('cached_properties', JSON.stringify(data));
          }
        } catch (cacheErr) {
          console.warn('로컬 캐시 저장 실패', cacheErr);
        }
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user) {
          await loadFavorites(session.user.id);
        }
        setLoading(false);
      },
      async (err) => {
        console.warn('⚠️ Firestore 실시간 연동 실패 - 로컬 캐시 복구를 시도합니다.', err);
        let restoredData = fallbackData;
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            const cached = localStorage.getItem('cached_properties');
            if (cached) {
              const parsed = JSON.parse(cached);
              if (Array.isArray(parsed) && parsed.length > 0) {
                restoredData = parsed;
                console.log(`[+] 로컬 캐시에서 ${parsed.length}건의 실제 매물 데이터를 복구하여 오프라인 모드로 실행합니다.`);
              }
            }
          }
        } catch (cacheErr) {
          console.warn('로컬 캐시 복구 실패', cacheErr);
        }
        setProperties(restoredData);
        setIsOffline(true);
        setError(null); // 에러 화면은 노출하지 않고 데이터를 그리도록 함
        setLoading(false);
      },
      'all',
      filters.search
    );

    // 컴포넌트 언마운트 혹은 조건 변경 시 구독 해제 클린업 수행
    return () => unsubscribe();
  }, [filters.search, loadFavorites]);

  // 로컬 필터링을 수행하여 화면에 렌더링할 목록을 추출합니다.
  useEffect(() => {
    let result = [...properties];

    // 0. 자산 공급 출처 다중 필터링
    if (filters.source && filters.source.length > 0) {
      result = result.filter((item) => {
        return filters.source.includes(item.source as any);
      });
    } else {
      // 선택된 출처가 하나도 없으면 아무것도 보여주지 않습니다.
      result = [];
    }

    // 1. 용도 필터링
    if (filters.ptype && filters.ptype.length > 0) {
      result = result.filter((item) => {
        const type = item.ptype || '';
        return filters.ptype.some(pt => {
          if (pt === 'apart') return type.includes('아파트');
          if (pt === 'officetel') return type.includes('오피스텔');
          if (pt === 'villa') return type.includes('다세대') || type.includes('빌라') || type.includes('연립');
          if (pt === 'house') return (type.includes('주택') || type.includes('가구') || type.includes('단독') || type.includes('전원')) && !type.includes('아파트') && !type.includes('오피스텔') && !type.includes('다세대') && !type.includes('빌라') && !type.includes('연립');
          if (pt === 'store') return type.includes('상가') || type.includes('점포') || type.includes('근린') || type.includes('근생') || type.includes('생활시설') || type.includes('상업') || type.includes('빌딩') || type.includes('사무실');
          if (pt === 'land') return type.includes('토지') || type.includes('임야') || type.includes('대지') || type.includes('잡종지') || type.includes('대') || type.includes('전') || type.includes('답');
          if (pt === 'factory') return type.includes('공장') || type.includes('창고') || type.includes('산업');
          return false;
        });
      });
    } else {
      result = [];
    }

    // 2. 시도 및 시군구 지역 필터링
    if (filters.sido && filters.sido.length > 0) {
      result = result.filter((item) => {
        const address = item.address || '';
        const matchSido = filters.sido.some(sd => address.startsWith(sd) || address.includes(sd));
        if (!matchSido) return false;

        // 시도가 1개만 선택되었을 때만 시군구 상세 필터를 작동시킵니다.
        if (filters.sido.length === 1 && filters.sigungu !== 'all') {
          return address.includes(filters.sigungu);
        }
        return true;
      });
    }

    // 3. 예산 한도 필터링
    if (filters.budgetLimit < 2000000000) {
      result = result.filter((item) => {
        const price = item.minimum_bid || item.appraised_value || 0;
        return price <= filters.budgetLimit;
      });
    }

    // 4. 기일 한도 필터 D-Day 필터링
    if (filters.dateLimit !== 999) {
      result = result.filter((item) => {
        const days = item.remaining_days;
        if (days === undefined || days === null) return false;
        return days >= 0 && days <= filters.dateLimit;
      });
    }

    // 5. 과거 마감 매물 제외 여부
    if (filters.hidePast) {
      result = result.filter((item) => {
        const days = item.remaining_days;
        return days === undefined || days === null || days >= 0;
      });
    }

    // 6. AI 권리 등급 필터링
    if (filters.gradeFilter !== 'all') {
      result = result.filter((item) => {
        const grade = (item.grade || 'X').toUpperCase();
        const isSafe = grade === 'A' || grade === 'B';
        if (filters.gradeFilter === 'safe') return isSafe;
        if (filters.gradeFilter === 'risk') return !isSafe;
        return true;
      });
    }

    // 7. AI 자산 투자 성향 필터링
    if (filters.investmentType && filters.investmentType !== 'all') {
      result = result.filter((item) => {
        const ptype = (item.ptype || '').toLowerCase();
        const score = item.score || 50;
        const isCommercial = ptype.includes('상가') || ptype.includes('근린') || ptype.includes('점포') || ptype.includes('상업') || ptype.includes('빌딩') || ptype.includes('숙박') || ptype.includes('사무') || ptype.includes('생활시설');
        const isLandOrFactory = ptype.includes('토지') || ptype.includes('대지') || ptype.includes('임야') || ptype.includes('잡종지') || ptype.includes('대') || ptype.includes('전') || ptype.includes('답') || ptype.includes('공장') || ptype.includes('창고') || ptype.includes('산업');
        const isResidential = ptype.includes('아파트') || ptype.includes('주택') || ptype.includes('다세대') || ptype.includes('빌라') || ptype.includes('오피스텔') || ptype.includes('연립') || ptype.includes('가구') || ptype.includes('단독') || ptype.includes('전원');

        if (filters.investmentType === 'investment') {
          return isCommercial || isLandOrFactory || (isResidential && score >= 85);
        } else if (filters.investmentType === 'residence') {
          return isResidential;
        }
        return true;
      });
    }

    // 8. 관할 법원 다중 필터링
    if (filters.selectedCourts && filters.selectedCourts.length > 0) {
      result = result.filter((item) => {
        const auctionNo = item.auction_no || '';
        return filters.selectedCourts!.some(court => auctionNo.includes(court));
      });
    }

    setFilteredProperties(result);
  }, [properties, filters]);

  // 필터 초기화 함수입니다.
  const handleResetFilters = () => {
    setFilters({
      search: '',
      source: ['court', 'onbid', 'private'],
      ptype: ['apart', 'officetel', 'villa', 'house', 'store', 'land', 'factory'],
      sido: [],
      sigungu: 'all',
      dateLimit: 999,
      budgetLimit: 2000000000,
      hidePast: true,
      gradeFilter: 'all',
      investmentType: 'all',
      selectedCourts: [],
    });
  };

  // 광고 데이터를 사이에 삽입한 리스트 데이터 생성
  const getListWithAds = useCallback(() => {
    const listWithAds: any[] = [];
    filteredProperties.forEach((item, index) => {
      if (index > 0 && index % 3 === 0) {
        listWithAds.push({
          id: `ad-${index}`,
          isAd: true,
        });
      }
      listWithAds.push(item);
    });
    return listWithAds;
  }, [filteredProperties]);

  // 예산 한도를 한글 단위 포맷으로 출력하는 헬퍼 함수입니다.
  const getBudgetText = (limit: number) => {
    if (limit >= 2000000000) return '제한 없음';
    if (limit >= 100000000) {
      const eok = limit / 100000000;
      return `${eok}억 원 이하`;
    }
    return `${limit / 10000}만 원 이하`;
  };

  // KPI 분석 통계치 계산입니다.
  const totalCount = filteredProperties.length;
  const safeCount = filteredProperties.filter((p) => {
    const g = (p.grade || 'X').toUpperCase();
    return g === 'A' || g === 'B';
  }).length;
  const riskCount = filteredProperties.filter((p) => {
    const g = (p.grade || 'X').toUpperCase();
    return g === 'X';
  }).length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* 📡 실시간 연동 상태 배지 */}
        <View style={[styles.statusBadgeContainer, { backgroundColor: isOffline ? '#fffbeb' : '#ecfdf5', borderColor: isOffline ? '#fef3c7' : '#d1fae5' }]}>
          <View style={[styles.statusDot, { backgroundColor: isOffline ? COLORS.amber500 : '#10b981' }]} />
          <Text style={[styles.statusText, { color: isOffline ? COLORS.amber700 : COLORS.emeraldSuccess }]}>
            {isOffline 
              ? `로컬 오프라인 모드 가동 (${properties.length}건)` 
              : `실시간 데이터 연동 정상 (${properties.length}건)`}
          </Text>
        </View>

        {/* 상단 검색바 및 필터 토글 버튼 영역 */}
        <View style={styles.searchHeader}>
          <View style={styles.searchBar}>
            <TextInput
              style={styles.searchInput}
              placeholder="사건번호, 주소, 용도 통합 검색"
              placeholderTextColor={COLORS.slate400}
              value={filters.search}
              onChangeText={(text) => setFilters((prev) => ({ ...prev, search: text }))}
            />
            {filters.search ? (
              <TouchableOpacity
                onPress={() => setFilters((prev) => ({ ...prev, search: '' }))}
                style={styles.clearButton}
              >
                <Text style={styles.clearButtonText}>✕</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          <TouchableOpacity
            style={[styles.filterToggleBtn, showFilterPanel && styles.filterToggleBtnActive]}
            onPress={() => setShowFilterPanel(!showFilterPanel)}
          >
            <Text style={[styles.filterToggleBtnText, showFilterPanel && styles.filterToggleBtnTextActive]}>
              {showFilterPanel ? '필터 닫기' : '상세 필터'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 상세 필터 설정 패널 영역 */}
        {showFilterPanel && (
          <View style={styles.filterWrapper}>
            <ScrollView style={styles.filterPanel} nestedScrollEnabled={true}>
              <View style={styles.filterHeaderRow}>
                <Text style={styles.filterPanelTitle}>지능형 필터링 센터</Text>
                <TouchableOpacity onPress={handleResetFilters}>
                  <Text style={styles.resetText}>초기화</Text>
                </TouchableOpacity>
              </View>

              {/* 관할 법원 다중 선택 필터 */}
              <TouchableOpacity onPress={() => toggleAccordion('court')} style={styles.accordionHeader}>
                <Text style={styles.filterLabel}>⚖️ 관할 법원 다중 필터</Text>
                <Text style={styles.accordionIcon}>{expandedAccordion['court'] ? '▲' : '▼'}</Text>
              </TouchableOpacity>
              {expandedAccordion['court'] && (
                <View style={styles.accordionContent}>
                  <View style={styles.selectionActions}>
                    <TouchableOpacity onPress={() => {
                      setFilters(prev => ({
                        ...prev,
                        selectedCourts: [
                          "서울중앙지방법원", "서울동부지방법원", "서울남부지방법원", "서울북부지방법원", "서울서부지방법원",
                          "의정부지방법원", "인천지방법원", "수원지방법원", "춘천지방법원", "대전지방법원",
                          "청주지방법원", "대구지방법원", "부산지방법원", "울산지방법원", "창원지방법원",
                          "광주지방법원", "전주지방법원", "제주지방법원"
                        ]
                      }));
                    }}>
                      <Text style={styles.actionText}>전체 선택</Text>
                    </TouchableOpacity>
                    <Text style={styles.actionDivider}>|</Text>
                    <TouchableOpacity onPress={() => setFilters(prev => ({ ...prev, selectedCourts: [] }))}>
                      <Text style={styles.actionText}>전체 해제</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.chipContainer}>
                    {[
                      "서울중앙지방법원", "서울동부지방법원", "서울남부지방법원", "서울북부지방법원", "서울서부지방법원",
                      "의정부지방법원", "인천지방법원", "수원지방법원", "춘천지방법원", "대전지방법원",
                      "청주지방법원", "대구지방법원", "부산지방법원", "울산지방법원", "창원지방법원",
                      "광주지방법원", "전주지방법원", "제주지방법원"
                    ].map((court) => {
                      const isSelected = filters.selectedCourts?.includes(court) || false;
                      return (
                        <TouchableOpacity
                          key={court}
                          style={[
                            styles.chip,
                            isSelected && styles.chipActive,
                          ]}
                          onPress={() => {
                            setFilters((prev) => {
                              const currentCourts = prev.selectedCourts || [];
                              const nextCourts = currentCourts.includes(court)
                                ? currentCourts.filter(c => c !== court)
                                : [...currentCourts, court];
                              return { ...prev, selectedCourts: nextCourts };
                            });
                          }}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              isSelected && styles.chipTextActive,
                            ]}
                          >
                            {court.replace("지방법원", "")}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* 자산 공급 출처 */}
              <TouchableOpacity onPress={() => toggleAccordion('source')} style={styles.accordionHeader}>
                <Text style={styles.filterLabel}>🏷️ 자산 공급 출처 (다중)</Text>
                <Text style={styles.accordionIcon}>{expandedAccordion['source'] ? '▲' : '▼'}</Text>
              </TouchableOpacity>
              {expandedAccordion['source'] && (
                <View style={styles.accordionContent}>
                  <View style={styles.selectionActions}>
                    <TouchableOpacity onPress={() => setFilters(prev => ({ ...prev, source: ['court', 'onbid', 'private'] }))}>
                      <Text style={styles.actionText}>전체 선택</Text>
                    </TouchableOpacity>
                    <Text style={styles.actionDivider}>|</Text>
                    <TouchableOpacity onPress={() => setFilters(prev => ({ ...prev, source: [] }))}>
                      <Text style={styles.actionText}>전체 해제</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.chipContainer}>
                    {[
                      { value: 'court', label: '법원 경매' },
                      { value: 'onbid', label: '캠코 공매' },
                      { value: 'private', label: '사설 매물' },
                    ].map((item) => {
                      const isSelected = filters.source.includes(item.value as any);
                      return (
                        <TouchableOpacity
                          key={item.value}
                          style={[
                            styles.chip,
                            isSelected && styles.chipActive,
                          ]}
                          onPress={() => {
                            setFilters((prev) => {
                              const next = prev.source.includes(item.value as any)
                                ? prev.source.filter(s => s !== item.value)
                                : [...prev.source, item.value as any];
                              return { ...prev, source: next };
                            });
                          }}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              isSelected && styles.chipTextActive,
                            ]}
                          >
                            {item.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* 물건 종류 */}
              <TouchableOpacity onPress={() => toggleAccordion('ptype')} style={styles.accordionHeader}>
                <Text style={styles.filterLabel}>🏡 물건 종류 (용도 다중)</Text>
                <Text style={styles.accordionIcon}>{expandedAccordion['ptype'] ? '▲' : '▼'}</Text>
              </TouchableOpacity>
              {expandedAccordion['ptype'] && (
                <View style={styles.accordionContent}>
                  <View style={styles.selectionActions}>
                    <TouchableOpacity onPress={() => setFilters(prev => ({ ...prev, ptype: ['apart', 'officetel', 'villa', 'house', 'store', 'land', 'factory'] }))}>
                      <Text style={styles.actionText}>전체 선택</Text>
                    </TouchableOpacity>
                    <Text style={styles.actionDivider}>|</Text>
                    <TouchableOpacity onPress={() => setFilters(prev => ({ ...prev, ptype: [] }))}>
                      <Text style={styles.actionText}>전체 해제</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.chipContainer}>
                    {[
                      { value: 'apart', label: '아파트' },
                      { value: 'officetel', label: '오피스텔' },
                      { value: 'villa', label: '다세대/빌라' },
                      { value: 'house', label: '단독/다가구' },
                      { value: 'store', label: '상가/점포' },
                      { value: 'land', label: '토지/임야' },
                      { value: 'factory', label: '공장/창고' },
                    ].map((item) => {
                      const isSelected = filters.ptype.includes(item.value as any);
                      return (
                        <TouchableOpacity
                          key={item.value}
                          style={[
                            styles.chip,
                            isSelected && styles.chipActive,
                          ]}
                          onPress={() => {
                            setFilters((prev) => {
                              const next = prev.ptype.includes(item.value as any)
                                ? prev.ptype.filter(p => p !== item.value)
                                : [...prev.ptype, item.value as any];
                              return { ...prev, ptype: next };
                            });
                          }}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              isSelected && styles.chipTextActive,
                            ]}
                          >
                            {item.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* 지역 필터 */}
              <TouchableOpacity onPress={() => toggleAccordion('sido')} style={styles.accordionHeader}>
                <Text style={styles.filterLabel}>📍 지역 대분류 (시도 다중)</Text>
                <Text style={styles.accordionIcon}>{expandedAccordion['sido'] ? '▲' : '▼'}</Text>
              </TouchableOpacity>
              {expandedAccordion['sido'] && (
                <View style={styles.accordionContent}>
                  <View style={styles.selectionActions}>
                    <TouchableOpacity onPress={() => setFilters(prev => ({ ...prev, sido: ['서울', '경기', '인천', '부산', '대구', '광주', '대전', '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'] }))}>
                      <Text style={styles.actionText}>전체 선택</Text>
                    </TouchableOpacity>
                    <Text style={styles.actionDivider}>|</Text>
                    <TouchableOpacity onPress={() => setFilters(prev => ({ ...prev, sido: [] }))}>
                      <Text style={styles.actionText}>전체 해제</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.chipContainer}>
                    {[
                      '서울', '경기', '인천', '부산', '대구', '광주', '대전', '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'
                    ].map((sd) => {
                      const isSelected = filters.sido.includes(sd);
                      return (
                        <TouchableOpacity
                          key={sd}
                          style={[
                            styles.chip,
                            isSelected && styles.chipActive,
                          ]}
                          onPress={() => {
                            setFilters((prev) => {
                              const next = prev.sido.includes(sd)
                                ? prev.sido.filter(s => s !== sd)
                                : [...prev.sido, sd];
                              return { ...prev, sido: next, sigungu: 'all' };
                            });
                          }}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              isSelected && styles.chipTextActive,
                            ]}
                          >
                            {sd}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}

              {/* 시군구 상세 필터 (시도가 단 하나만 지정된 경우 활성화) */}
              {filters.sido && filters.sido.length === 1 && FULL_REGIONS[filters.sido[0]] && (
                <>
                  <Text style={styles.filterLabel}>📍 상세 지역구분 (시/군/구)</Text>
                  <View style={styles.chipContainer}>
                    <TouchableOpacity
                      style={[
                        styles.chip,
                        filters.sigungu === 'all' && styles.chipActive,
                      ]}
                      onPress={() => setFilters((prev) => ({ ...prev, sigungu: 'all' }))}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          filters.sigungu === 'all' && styles.chipTextActive,
                        ]}
                      >
                        전체
                      </Text>
                    </TouchableOpacity>
                    {FULL_REGIONS[filters.sido[0]].map((sgg) => (
                      <TouchableOpacity
                        key={sgg}
                        style={[
                          styles.chip,
                          filters.sigungu === sgg && styles.chipActive,
                        ]}
                        onPress={() => setFilters((prev) => ({ ...prev, sigungu: sgg }))}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            filters.sigungu === sgg && styles.chipTextActive,
                          ]}
                        >
                          {sgg}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              {/* 내 가용 예산 한도 설정 */}
              <TouchableOpacity onPress={() => toggleAccordion('budget')} style={styles.accordionHeader}>
                <Text style={styles.filterLabel}>💰 내 가용 예산 한도 ({getBudgetText(filters.budgetLimit)})</Text>
                <Text style={styles.accordionIcon}>{expandedAccordion['budget'] ? '▲' : '▼'}</Text>
              </TouchableOpacity>
              {expandedAccordion['budget'] && (
                <View style={styles.chipContainer}>
                  {[
                    { value: 50000000, label: '5천만' },
                    { value: 100000000, label: '1억' },
                    { value: 300000000, label: '3억' },
                    { value: 500000000, label: '5억' },
                    { value: 1000000000, label: '10억' },
                    { value: 2000000000, label: '무제한' },
                  ].map((item) => (
                    <TouchableOpacity
                      key={item.value}
                      style={[
                        styles.chip,
                        filters.budgetLimit === item.value && styles.chipActive,
                      ]}
                      onPress={() => setFilters((prev) => ({ ...prev, budgetLimit: item.value }))}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          filters.budgetLimit === item.value && styles.chipTextActive,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* 매각 기일 임박 */}
              <TouchableOpacity onPress={() => toggleAccordion('date')} style={styles.accordionHeader}>
                <Text style={styles.filterLabel}>📅 매각/입찰 기일 범위</Text>
                <Text style={styles.accordionIcon}>{expandedAccordion['date'] ? '▲' : '▼'}</Text>
              </TouchableOpacity>
              {expandedAccordion['date'] && (
                <View style={styles.chipContainer}>
                  {[
                    { value: 999, label: '기한 제한 없음' },
                    { value: 30, label: '30일 이내 임박' },
                    { value: 90, label: '90일 이내' },
                  ].map((item) => (
                    <TouchableOpacity
                      key={item.value}
                      style={[
                        styles.chip,
                        filters.dateLimit === item.value && styles.chipActive,
                      ]}
                      onPress={() => setFilters((prev) => ({ ...prev, dateLimit: item.value }))}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          filters.dateLimit === item.value && styles.chipTextActive,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* AI 권리 분류 필터 */}
              <TouchableOpacity onPress={() => toggleAccordion('grade')} style={styles.accordionHeader}>
                <Text style={styles.filterLabel}>⚠️ AI 권리 등급 분류 필터</Text>
                <Text style={styles.accordionIcon}>{expandedAccordion['grade'] ? '▲' : '▼'}</Text>
              </TouchableOpacity>
              {expandedAccordion['grade'] && (
                <View style={styles.chipContainer}>
                  {[
                    { value: 'all', label: '전체 등급' },
                    { value: 'safe', label: '🟢 우량 등급' },
                    { value: 'risk', label: '🚨 위험 등급' },
                  ].map((item) => (
                    <TouchableOpacity
                      key={item.value}
                      style={[
                        styles.chip,
                        filters.gradeFilter === item.value && styles.chipActive,
                      ]}
                      onPress={() => setFilters((prev) => ({ ...prev, gradeFilter: item.value as any }))}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          filters.gradeFilter === item.value && styles.chipTextActive,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* AI 자산 투자 성향 필터 */}
              <TouchableOpacity onPress={() => toggleAccordion('investment')} style={styles.accordionHeader}>
                <Text style={styles.filterLabel}>🎯 AI 자산 투자 성향 필터</Text>
                <Text style={styles.accordionIcon}>{expandedAccordion['investment'] ? '▲' : '▼'}</Text>
              </TouchableOpacity>
              {expandedAccordion['investment'] && (
                <View style={styles.chipContainer}>
                  {[
                    { value: 'all', label: '전체' },
                    { value: 'investment', label: '🏆 투자형' },
                    { value: 'residence', label: '🏠 실거주' },
                  ].map((item) => (
                    <TouchableOpacity
                      key={item.value}
                      style={[
                        styles.chip,
                        filters.investmentType === item.value && styles.chipActive,
                      ]}
                      onPress={() => setFilters((prev) => ({ ...prev, investmentType: item.value as any }))}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          filters.investmentType === item.value && styles.chipTextActive,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* 마감 매물 제외 스위치 버튼 */}
              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>🚫 과거 마감 매물 제외</Text>
                <TouchableOpacity
                  style={[styles.switchToggle, filters.hidePast && styles.switchToggleActive]}
                  onPress={() => setFilters((prev) => ({ ...prev, hidePast: !prev.hidePast }))}
                >
                  <Text style={styles.switchToggleText}>{filters.hidePast ? 'ON' : 'OFF'}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        )}

        {/* 중단 KPI 통계 대시보드 (기존 60% 축소 적용) */}
        <View style={styles.kpiContainer}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiTitle}>적합 매물</Text>
            <Text style={styles.kpiValue}>{totalCount}건</Text>
          </View>
          <View style={[styles.kpiCard, { borderColor: COLORS.emeraldSuccess }]}>
            <Text style={[styles.kpiTitle, { color: COLORS.emeraldSuccess }]}>우량 (A~B)</Text>
            <Text style={[styles.kpiValue, { color: COLORS.emeraldSuccess }]}>{safeCount}건</Text>
          </View>
          <View style={[styles.kpiCard, { borderColor: COLORS.crimsonAlert }]}>
            <Text style={[styles.kpiTitle, { color: COLORS.crimsonAlert }]}>위험 (X)</Text>
            <Text style={[styles.kpiValue, { color: COLORS.crimsonAlert }]}>{riskCount}건</Text>
          </View>
        </View>

        {/* 메인 리스트 피드 영역 */}
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={COLORS.royalBlue} />
            <Text style={styles.loadingText}>실시간 서버로부터 자산을 연동하는 중입니다...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleResetFilters}>
              <Text style={styles.retryButtonText}>데이터 다시 불러오기</Text>
            </TouchableOpacity>
          </View>
        ) : filteredProperties.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyText}>해당 조건에 만족하는 물건이 존재하지 않습니다.</Text>
          </View>
        ) : (
          <FlatList
            data={getListWithAds()}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item, index }) => {
              if (item.isAd) {
                // 실시간 광고 렌더링
                let ad = null;
                if (adSettings && adSettings.length > 0) {
                  const adIndex = Math.floor(index / 4) % adSettings.length;
                  ad = adSettings[adIndex];
                }
                const defaultAd = {
                  title: "★ 프리미엄 경공매 투자 VIP 멤버십 모집",
                  desc: "오직 1%를 위한 NPL 부실채권 및 지분 경매 핵심 노하우 단독 공개. 지금 가입 시 30% 한정 할인 적용!",
                  image_url: "./apartment_elegant_facade.png",
                  link_url: "https://action-b8c75.web.app",
                  type: "direct"
                };
                const currentAd = ad || defaultAd;

                return (
                  <View style={styles.adCard}>
                    <View style={styles.adHeader}>
                      <View style={styles.adBadge}>
                        <Text style={styles.adBadgeText}>AD 광고</Text>
                      </View>
                      <Text style={styles.adAccentText} numberOfLines={1}>추천 스폰서</Text>
                    </View>
                    
                    {currentAd.type === 'adsense' ? (
                      <View style={styles.adsenseContainer}>
                        <Text style={styles.adsenseTitle}>[Google AdSense 광고]</Text>
                        <Text style={styles.adsenseCodeText} numberOfLines={2}>{currentAd.ad_code || '광고 스크립트 코드 탑재 영역'}</Text>
                      </View>
                    ) : (
                      <View style={styles.directAdContainer}>
                        <Text style={styles.adTitle} numberOfLines={2}>{currentAd.title}</Text>
                        <Text style={styles.adDesc} numberOfLines={3}>{currentAd.desc}</Text>
                      </View>
                    )}
                    
                    <TouchableOpacity style={styles.adFooterBtn} activeOpacity={0.8}>
                      <Text style={styles.adFooterBtnText}>자세히 보기 ➔</Text>
                    </TouchableOpacity>
                  </View>
                );
              }

              return (
                <PropertyCard
                  property={item}
                  onPress={() => onSelectProperty(item)}
                  isFavorite={favoriteIds.has(item.id)}
                />
              );
            }}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.pearlWhiteBg,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 50,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 18,
    color: COLORS.slate900,
    fontWeight: 'bold',
    height: '100%',
  },
  clearButton: {
    padding: 6,
  },
  clearButtonText: {
    color: COLORS.slate400,
    fontSize: 18,
    fontWeight: 'bold',
  },
  filterToggleBtn: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    borderRadius: 12,
    height: 50,
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterToggleBtnActive: {
    backgroundColor: COLORS.royalBlue,
    borderColor: COLORS.royalBlue,
  },
  filterToggleBtnText: {
    fontSize: 14.5,
    fontWeight: 'bold',
    color: COLORS.slate700,
  },
  filterToggleBtnTextActive: {
    color: COLORS.white,
  },
  filterWrapper: {
    maxHeight: 320,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    padding: 8,
    marginBottom: 8,
    shadowColor: COLORS.slate900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  filterPanel: {
    flex: 1,
  },
  filterHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate100,
    paddingBottom: 4,
  },
  filterPanelTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.slate900,
  },
  resetText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.royalBlue,
  },
  filterLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.slate700,
    marginTop: 6,
    marginBottom: 5,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 6,
  },
  chip: {
    backgroundColor: COLORS.slate100,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 6,
    marginBottom: 6,
  },
  chipActive: {
    backgroundColor: COLORS.royalLight,
    borderWidth: 1,
    borderColor: COLORS.royalBlue,
  },
  chipText: {
    fontSize: 17,
    color: COLORS.slate600,
    fontWeight: 'bold',
  },
  chipTextActive: {
    color: COLORS.royalBlue,
    fontWeight: '800',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 6,
    backgroundColor: COLORS.slate100,
    padding: 10,
    borderRadius: 10,
  },
  switchLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.slate700,
  },
  switchToggle: {
    backgroundColor: COLORS.slate200,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  switchToggleActive: {
    backgroundColor: COLORS.royalBlue,
  },
  switchToggleText: {
    fontSize: 18,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  kpiContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 5,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    borderRadius: 8,
    paddingVertical: 5,
    alignItems: 'center',
    shadowColor: COLORS.slate900,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.01,
    shadowRadius: 2,
    elevation: 1,
  },
  kpiTitle: {
    fontSize: 9.5,
    color: COLORS.slate400,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  kpiValue: {
    fontSize: 12.5,
    color: COLORS.slate900,
    fontWeight: '800',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 17,
    color: COLORS.slate600,
    fontWeight: 'bold',
    marginTop: 12,
  },
  errorIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  errorText: {
    fontSize: 17,
    color: COLORS.crimsonAlert,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  retryButton: {
    backgroundColor: COLORS.royalBlue,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 17,
    color: COLORS.slate400,
    fontWeight: 'bold',
  },
  listContent: {
    paddingBottom: 20,
  },
  statusBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '800',
  },
  // 💎 추가 아코디언 필터 스타일
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate100,
  },
  accordionIcon: {
    fontSize: 12,
    color: COLORS.slate450,
    fontWeight: 'bold',
  },
  accordionContent: {
    paddingLeft: 4,
    marginTop: 4,
    paddingBottom: 4,
  },
  selectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  actionText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.royalBlue,
  },
  actionDivider: {
    fontSize: 11,
    color: COLORS.slate300,
  },
  // 💎 광고 카드 데코레이션 스타일
  adCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    shadowColor: COLORS.slate900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  adHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  adBadge: {
    backgroundColor: '#fffbeb',
    borderColor: '#fef3c7',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 8,
  },
  adBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#b45309',
  },
  adAccentText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.slate600,
    flex: 1,
  },
  directAdContainer: {
    marginBottom: 12,
  },
  adTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: COLORS.slate900,
    lineHeight: 24,
    marginBottom: 6,
  },
  adDesc: {
    fontSize: 13,
    color: COLORS.slate500,
    lineHeight: 19,
  },
  adsenseContainer: {
    backgroundColor: COLORS.pearlWhiteBg,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: COLORS.slate300,
    marginBottom: 12,
  },
  adsenseTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.slate500,
    marginBottom: 4,
  },
  adsenseCodeText: {
    fontSize: 11,
    color: COLORS.slate400,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
  },
  adFooterBtn: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: COLORS.slate100,
    paddingTop: 10,
  },
  adFooterBtnText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.royalBlue,
  },
});
