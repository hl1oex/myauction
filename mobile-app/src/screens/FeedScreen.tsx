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
} from 'react-native';
import { Property, FilterState } from '../types';
import { COLORS } from '../components/Theme';
import { PropertyCard } from '../components/PropertyCard';
import { fetchProperties } from '../utils/api';
import { auth } from '../utils/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { fetchFavorites } from '../utils/firebaseDb';

interface FeedScreenProps {
  onSelectProperty: (property: Property) => void;
}

export const FeedScreen: React.FC<FeedScreenProps> = ({ onSelectProperty }) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilterPanel, setShowFilterPanel] = useState<boolean>(false);
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);

  // 로그인 세션 상태의 변화를 감지하여 유저 고유 식별자를 업데이트합니다.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUserId(currentUser.uid);
      } else {
        setUserId(null);
        setFavoriteIds(new Set());
      }
    });
    return () => unsubscribe();
  }, []);

  // Firestore 데이터베이스로부터 로그인 사용자의 관심 매물 리스트를 받아와 Set 구조로 캐싱합니다.
  const loadFavorites = useCallback(async (uid: string) => {
    try {
      const favs = await fetchFavorites(uid);
      setFavoriteIds(new Set(favs.map((f) => f.id)));
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

  // 필터 상태의 초기값을 설정합니다.
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    source: 'all',
    ptype: 'all',
    sido: 'all',
    dateLimit: 999,
    budgetLimit: 2000000000, // 기본 20억 원
    hidePast: true,
    gradeFilter: 'all',
  });

  // 서버로부터 전체 데이터를 가져옵니다.
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // API 모듈을 사용해 데이터를 호출합니다.
      const data = await fetchProperties(filters.source, filters.search);
      setProperties(data);
      // 로그인된 사용자라면 데이터가 갱신되는 시점에 관심 물건 목록도 다시 가져옵니다.
      if (auth.currentUser) {
        await loadFavorites(auth.currentUser.uid);
      }
    } catch (err) {
      setError('클라우드 데이터베이스 연결 상태가 원활하지 않습니다. 네트워크 환경을 확인하십시오.');
    } finally {
      setLoading(false);
    }
  }, [filters.source, filters.search, loadFavorites]);

  // 서버 주소가 변경되거나 검색어/소스가 바뀔 때 데이터를 다시 불러옵니다.
  useEffect(() => {
    loadData();
  }, [loadData]);

  // 로컬 필터링을 수행하여 화면에 렌더링할 목록을 추출합니다.
  useEffect(() => {
    let result = [...properties];

    // 1. 용도 필터링
    if (filters.ptype !== 'all') {
      result = result.filter((item) => {
        const type = item.ptype || '';
        if (filters.ptype === 'apart') return type.includes('아파트') || type.includes('주택') || type.includes('오피스텔');
        if (filters.ptype === 'store') return type.includes('상가') || type.includes('점포') || type.includes('근린');
        if (filters.ptype === 'house') return type.includes('단독') || type.includes('다가구') || type.includes('전원');
        if (filters.ptype === 'land') return type.includes('토지') || type.includes('임야') || type.includes('대지');
        if (filters.ptype === 'factory') return type.includes('공장') || type.includes('창고');
        return true;
      });
    }

    // 2. 시도 지역 필터링
    if (filters.sido !== 'all') {
      result = result.filter((item) => {
        const address = item.address || '';
        return address.startsWith(filters.sido) || address.includes(filters.sido);
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

    setFilteredProperties(result);
  }, [properties, filters]);

  // 필터 초기화 함수입니다.
  const handleResetFilters = () => {
    setFilters({
      search: '',
      source: 'all',
      ptype: 'all',
      sido: 'all',
      dateLimit: 999,
      budgetLimit: 2000000000,
      hidePast: true,
      gradeFilter: 'all',
    });
  };

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

              {/* 자산 공급 출처 */}
              <Text style={styles.filterLabel}>⚖️ 자산 공급 출처</Text>
              <View style={styles.chipContainer}>
                {[
                  { value: 'all', label: '전체' },
                  { value: 'court', label: '법원 경매' },
                  { value: 'onbid', label: '캠코 공매' },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.value}
                    style={[
                      styles.chip,
                      filters.source === item.value && styles.chipActive,
                    ]}
                    onPress={() => setFilters((prev) => ({ ...prev, source: item.value as any }))}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        filters.source === item.value && styles.chipTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* 물건 종류 */}
              <Text style={styles.filterLabel}>🏡 물건 종류 (용도)</Text>
              <View style={styles.chipContainer}>
                {[
                  { value: 'all', label: '전체 용도' },
                  { value: 'apart', label: '주택/오피스텔' },
                  { value: 'store', label: '상가/점포' },
                  { value: 'land', label: '토지/임야' },
                  { value: 'factory', label: '공장/창고' },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.value}
                    style={[
                      styles.chip,
                      filters.ptype === item.value && styles.chipActive,
                    ]}
                    onPress={() => setFilters((prev) => ({ ...prev, ptype: item.value as any }))}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        filters.ptype === item.value && styles.chipTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* 지역 필터 */}
              <Text style={styles.filterLabel}>📍 지역 대분류 (시/도)</Text>
              <View style={styles.chipContainer}>
                {[
                  { value: 'all', label: '전국' },
                  { value: '서울', label: '서울' },
                  { value: '경기', label: '경기' },
                  { value: '인천', label: '인천' },
                  { value: '부산', label: '부산' },
                  { value: '대구', label: '대구' },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.value}
                    style={[
                      styles.chip,
                      filters.sido === item.value && styles.chipActive,
                    ]}
                    onPress={() => setFilters((prev) => ({ ...prev, sido: item.value }))}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        filters.sido === item.value && styles.chipTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* 내 가용 예산 한도 설정 */}
              <Text style={styles.filterLabel}>💰 내 가용 예산 한도 ({getBudgetText(filters.budgetLimit)})</Text>
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

              {/* 매각 기일 임박 */}
              <Text style={styles.filterLabel}>📅 매각/입찰 기일 범위</Text>
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

              {/* AI 권리 분류 필터 */}
              <Text style={styles.filterLabel}>⚠️ AI 권리 등급 분류 필터</Text>
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

        {/* 중단 KPI 통계 대시보드 */}
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
            <TouchableOpacity style={styles.retryButton} onPress={loadData}>
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
            data={filteredProperties}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <PropertyCard
                property={item}
                onPress={() => onSelectProperty(item)}
                isFavorite={favoriteIds.has(item.id)}
              />
            )}
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
    fontSize: 17,
    fontWeight: 'bold',
    color: COLORS.slate700,
  },
  filterToggleBtnTextActive: {
    color: COLORS.white,
  },
  filterWrapper: {
    maxHeight: 320,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    padding: 12,
    marginBottom: 12,
    shadowColor: COLORS.slate900,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  filterPanel: {
    flex: 1,
  },
  filterHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate100,
    paddingBottom: 8,
  },
  filterPanelTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.slate900,
  },
  resetText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.royalBlue,
  },
  filterLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.slate700,
    marginTop: 8,
    marginBottom: 6,
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
    fontSize: 15,
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
    marginVertical: 12,
    backgroundColor: COLORS.slate100,
    padding: 10,
    borderRadius: 10,
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.slate700,
  },
  switchToggle: {
    backgroundColor: COLORS.slate200,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  switchToggleActive: {
    backgroundColor: COLORS.royalBlue,
  },
  switchToggleText: {
    fontSize: 14,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  kpiContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
    gap: 8,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    shadowColor: COLORS.slate900,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  kpiTitle: {
    fontSize: 14,
    color: COLORS.slate400,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 19,
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
});
