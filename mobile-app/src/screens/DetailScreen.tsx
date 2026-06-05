// 선택된 매물의 상세한 AI 권리분석 정보와 입찰 이력을 분석하여 보여주는 상세 보기 화면입니다.

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Linking,
  SafeAreaView,
} from 'react-native';
import { Property } from '../types';
import { COLORS } from '../components/Theme';
import { auth } from '../utils/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { addFavorite, removeFavorite, fetchFavorites } from '../utils/firebaseDb';

interface DetailScreenProps {
  property: Property;
  onBack: () => void;
}

export const DetailScreen: React.FC<DetailScreenProps> = ({ property, onBack }) => {
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [userId, setUserId] = useState<string | null>(null);

  // 화면 진입 시 로그인된 사용자의 관심 물건 등록 상태를 실시간으로 확인하여 UI에 동기화합니다.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUserId(currentUser.uid);
        checkFavoriteStatus(currentUser.uid);
      } else {
        setUserId(null);
        setIsFavorite(false);
      }
    });
    return () => unsubscribe();
  }, [property.id]);

  // Firestore에서 즐겨찾기 목록을 조회해 현재 매물이 등록되어 있는 상태인지 검증합니다.
  const checkFavoriteStatus = async (uid: string) => {
    try {
      const favs = await fetchFavorites(uid);
      const exists = favs.some((f) => f.id === property.id);
      setIsFavorite(exists);
    } catch (error) {
      console.error('관심 매물 상태 체크 오류', error);
    }
  };

  // 사용자의 상호작용에 따라 관심 물건을 등록하거나 해제하고 상태 값을 반전시킵니다.
  const handleToggleFavorite = async () => {
    if (!userId) {
      alert('관심 물건을 등록하거나 보시려면 먼저 로그인을 진행해 주십시오.');
      return;
    }

    try {
      if (isFavorite) {
        await removeFavorite(userId, property.id);
        setIsFavorite(false);
      } else {
        await addFavorite(userId, property);
        setIsFavorite(true);
      }
    } catch (error) {
      console.error('관심 물건 토글 조작 실패', error);
    }
  };

  // 금액 포맷팅 헬퍼 함수입니다.
  const formatCurrency = (value: number) => {
    if (!value) return '0원';
    return `${value.toLocaleString()}원`;
  };

  // 상세 금액 표기용 한글 변환 헬퍼 함수입니다.
  const formatCurrencyKorean = (value: number) => {
    if (!value) return '0원';
    if (value >= 100000000) {
      const eok = Math.floor(value / 100000000);
      const remaining = Math.round((value % 100000000) / 10000);
      return `${eok}억 ${remaining > 0 ? remaining.toLocaleString() + '만' : ''}원`;
    }
    return `${Math.round(value / 10000).toLocaleString()}만원`;
  };

  // 저감율을 계산합니다.
  const calculateDiscountRate = () => {
    if (!property.appraised_value || !property.minimum_bid) return 0;
    const diff = property.appraised_value - property.minimum_bid;
    if (diff <= 0) return 0;
    return Math.round((diff / property.appraised_value) * 100);
  };

  // 외부 공식 링크로 이동합니다.
  const handleOpenLink = async () => {
    if (!property.link_url) return;
    const supported = await Linking.canOpenURL(property.link_url);
    if (supported) {
      await Linking.openURL(property.link_url);
    } else {
      alert('연결할 수 없는 URL 주소입니다.');
    }
  };

  // AI 등급별 컬러 및 뱃지 스타일을 결정합니다.
  const getGradeStyle = (grade: string) => {
    const g = (grade || 'X').toUpperCase();
    if (g === 'A' || g === 'B') {
      return {
        bg: COLORS.emeraldLight,
        text: COLORS.emeraldSuccess,
        label: '🟢 AI 분석 안전 등급 (우량)',
      };
    }
    if (g === 'C') {
      return {
        bg: COLORS.warningLight,
        text: COLORS.warningGold,
        label: '🟡 AI 분석 주의 등급 (보통)',
      };
    }
    return {
      bg: COLORS.crimsonLight,
      text: COLORS.crimsonAlert,
      label: '🚨 AI 분석 경고 등급 (위험)',
    };
  };

  const gradeStyle = getGradeStyle(property.grade);
  const discountRate = calculateDiscountRate();
  const sourceLabel = property.source === 'court' ? '⚖️ 대법원 법원경매' : property.source === 'onbid' ? '🏢 캠코 온비드 공매' : '📁 업로드 사설';

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* 상단 백 헤더바 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>← 뒤로가기</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>상세 권리분석</Text>
        <TouchableOpacity style={styles.favoriteButton} onPress={handleToggleFavorite}>
          <Text style={[styles.favoriteButtonText, isFavorite && styles.favoriteActive]}>
            {isFavorite ? '★' : '☆'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* 메인 매물 요약 정보 카드 */}
        <View style={styles.summaryCard}>
          <View style={styles.metaRow}>
            <Text style={styles.sourceLabel}>{sourceLabel}</Text>
            <Text style={styles.auctionNo}>{property.auction_no}</Text>
          </View>
          <Text style={styles.address}>{property.address}</Text>
          <View style={styles.ptypeBadge}>
            <Text style={styles.ptypeText}>{property.ptype || '부동산 일반 용도'}</Text>
          </View>
        </View>

        {/* AI 등급 및 진단 리스크 분석 정보 */}
        <View style={[styles.sectionCard, { borderColor: gradeStyle.text }]}>
          <Text style={styles.sectionTitle}>🎯 AI 지능형 권리진단 등급</Text>
          
          <View style={[styles.gradeRow, { backgroundColor: gradeStyle.bg }]}>
            <Text style={[styles.gradeLabel, { color: gradeStyle.text }]}>{gradeStyle.label}</Text>
            <Text style={[styles.gradeValue, { color: gradeStyle.text }]}>{property.grade}등급</Text>
          </View>

          <View style={styles.scoreRow}>
            <Text style={styles.scoreLabel}>AI 적합성 정밀 점수</Text>
            <Text style={styles.scoreValue}>{property.score}점 / 100점</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${property.score}%`, backgroundColor: gradeStyle.text }]} />
          </View>
        </View>

        {/* 금융 입찰 분석 카드 */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>💰 금융 및 입찰 금액 분석</Text>
          
          <View style={styles.priceDetailRow}>
            <View style={styles.priceDetailItem}>
              <Text style={styles.priceDetailLabel}>감정평가액</Text>
              <Text style={styles.priceDetailVal}>{formatCurrencyKorean(property.appraised_value)}</Text>
              <Text style={styles.priceDetailSub}>{formatCurrency(property.appraised_value)}</Text>
            </View>
            <View style={styles.priceDetailItem}>
              <Text style={styles.priceDetailLabel}>최저입찰가</Text>
              <Text style={[styles.priceDetailVal, { color: COLORS.crimsonAlert }]}>{formatCurrencyKorean(property.minimum_bid)}</Text>
              <Text style={styles.priceDetailSub}>{formatCurrency(property.minimum_bid)}</Text>
            </View>
          </View>

          {discountRate > 0 ? (
            <View style={styles.discountBanner}>
              <Text style={styles.discountText}>
                감정가 대비 현재 <Text style={styles.discountHighlight}>{discountRate}%</Text> 저렴하게 떨어졌습니다.
              </Text>
            </View>
          ) : null}

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>매각 입찰 기일</Text>
            <Text style={styles.infoValue}>{property.bidding_date || '미정'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>차수 정보 및 상태</Text>
            <Text style={styles.infoValue}>{property.round_info || '신건 진행 중'}</Text>
          </View>
        </View>

        {/* AI 권리분석 특이사항 */}
        <View style={[styles.sectionCard, { borderLeftWidth: 4, borderLeftColor: COLORS.royalBlue }]}>
          <Text style={[styles.sectionTitle, { color: COLORS.royalBlue }]}>📜 AI 권리분석 정밀 진단</Text>
          <Text style={styles.analysisContent}>
            {property.notes_content || '권리분석 특이사항이 기재되지 않았습니다. 말소기준권리를 기준으로 대항력 유무를 다시 점검하십시오.'}
          </Text>
        </View>

        {/* 법원 비고 및 공고 상세 원문 */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>📂 법원 비고 및 공고 상세</Text>
          <Text style={styles.descContent}>
            {property.desc_content || '해당 매물의 추가 설명 또는 법원 비고 원문이 존재하지 않습니다.'}
          </Text>
        </View>

        {/* 공식 정보 바로가기 액션 버튼 */}
        {property.link_url ? (
          <TouchableOpacity style={styles.linkButton} onPress={handleOpenLink}>
            <Text style={styles.linkButtonText}>🔗 공식 정보 웹사이트 확인하기</Text>
          </TouchableOpacity>
        ) : null}

        <View style={styles.spacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.pearlWhiteBg,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate200,
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
  },
  backButton: {
    paddingVertical: 8,
    paddingRight: 12,
  },
  backButtonText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: COLORS.royalBlue,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: COLORS.slate900,
    flex: 1,
    textAlign: 'center',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  summaryCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    marginBottom: 14,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sourceLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.slate600,
    backgroundColor: COLORS.slate100,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  auctionNo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.slate400,
  },
  address: {
    fontSize: 25,
    fontWeight: '800',
    color: COLORS.slate900,
    lineHeight: 32,
    marginBottom: 12,
  },
  ptypeBadge: {
    backgroundColor: COLORS.royalLight,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ptypeText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.royalBlue,
  },
  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: COLORS.slate900,
    marginBottom: 12,
  },
  gradeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  gradeLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  gradeValue: {
    fontSize: 23,
    fontWeight: '900',
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  scoreLabel: {
    fontSize: 16,
    color: COLORS.slate600,
    fontWeight: 'bold',
  },
  scoreValue: {
    fontSize: 18,
    color: COLORS.slate900,
    fontWeight: 'bold',
  },
  progressBarBg: {
    height: 10,
    backgroundColor: COLORS.slate100,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 999,
  },
  priceDetailRow: {
    flexDirection: 'row',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate100,
    paddingBottom: 12,
  },
  priceDetailItem: {
    flex: 1,
  },
  priceDetailLabel: {
    fontSize: 15,
    color: COLORS.slate400,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  priceDetailVal: {
    fontSize: 21,
    color: COLORS.slate900,
    fontWeight: '800',
    marginBottom: 2,
  },
  priceDetailSub: {
    fontSize: 15,
    color: COLORS.slate400,
  },
  discountBanner: {
    backgroundColor: COLORS.crimsonLight,
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  discountText: {
    fontSize: 16,
    color: COLORS.slate700,
    fontWeight: 'bold',
  },
  discountHighlight: {
    color: COLORS.crimsonAlert,
    fontWeight: '900',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate100,
  },
  infoLabel: {
    fontSize: 16,
    color: COLORS.slate600,
    fontWeight: 'bold',
  },
  infoValue: {
    fontSize: 16,
    color: COLORS.slate900,
    fontWeight: 'bold',
  },
  analysisContent: {
    fontSize: 17.5,
    color: COLORS.slate700,
    lineHeight: 28,
    fontWeight: 'bold',
  },
  descContent: {
    fontSize: 16,
    color: COLORS.slate600,
    lineHeight: 25,
  },
  linkButton: {
    backgroundColor: COLORS.royalBlue,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: COLORS.royalBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  linkButtonText: {
    fontSize: 18,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  spacer: {
    height: 40,
  },
  favoriteButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButtonText: {
    fontSize: 24,
    color: COLORS.slate400,
  },
  favoriteActive: {
    color: COLORS.warningGold,
  },
});
