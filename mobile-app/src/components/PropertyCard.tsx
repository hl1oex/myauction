// 개별 경매 및 공매 물건 정보를 일관된 프리미엄 스타일로 표현하는 카드 컴포넌트입니다.

import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Property } from '../types';
import { COLORS } from './Theme';

interface PropertyCardProps {
  property: Property;
  onPress: () => void;
  isFavorite?: boolean;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({ property, onPress, isFavorite = false }) => {
  // 감정가 및 최저입찰가를 원화(KRW) 화폐 포맷으로 변환합니다.
  const formatCurrency = (value: number) => {
    if (!value) return '0원';
    if (value >= 100000000) {
      const eok = Math.floor(value / 100000000);
      const remaining = Math.round((value % 100000000) / 10000);
      return `${eok}억 ${remaining > 0 ? remaining.toLocaleString() + '만' : ''}원`;
    }
    return `${Math.round(value / 10000).toLocaleString()}만원`;
  };

  // D-Day 일수를 텍스트로 가공합니다.
  const formatDDay = (days: number) => {
    if (days === undefined || days === null) return 'D-?';
    if (days < 0) return `종료 (${Math.abs(days)}일 경과)`;
    if (days === 0) return '오늘 입찰';
    return `D-${days}`;
  };

  // AI 등급별 컬러 테마를 결정합니다.
  const getGradeStyle = (grade: string) => {
    const g = (grade || 'X').toUpperCase();
    if (g === 'A' || g === 'B') {
      return {
        bg: COLORS.emeraldLight,
        text: COLORS.emeraldSuccess,
        label: '🟢 우량',
      };
    }
    if (g === 'C') {
      return {
        bg: COLORS.warningLight,
        text: COLORS.warningGold,
        label: '🟡 보통',
      };
    }
    return {
      bg: COLORS.crimsonLight,
      text: COLORS.crimsonAlert,
      label: '🚨 위험',
    };
  };

  const ptype = (property.ptype || '').toLowerCase();
  const score = property.score || 50;
  const isCommercial = ptype.includes('상가') || ptype.includes('근린') || ptype.includes('점포') || ptype.includes('상업') || ptype.includes('빌딩') || ptype.includes('숙박') || ptype.includes('사무') || ptype.includes('생활시설');
  const isLandOrFactory = ptype.includes('토지') || ptype.includes('대지') || ptype.includes('임야') || ptype.includes('잡종지') || ptype.includes('대') || ptype.includes('전') || ptype.includes('답') || ptype.includes('공장') || ptype.includes('창고') || ptype.includes('산업');
  const isResidential = ptype.includes('아파트') || ptype.includes('주택') || ptype.includes('다세대') || ptype.includes('빌라') || ptype.includes('오피스텔') || ptype.includes('연립') || ptype.includes('가구') || ptype.includes('단독') || ptype.includes('전원');

  const isInvestment = isCommercial || isLandOrFactory || (isResidential && score >= 85);
  const isResidence = isResidential;

  const gradeStyle = getGradeStyle(property.grade);
  const sourceLabel = property.source === 'court' ? '⚖️ 법원경매' : property.source === 'onbid' ? '🏢 캠코공매' : '📁 사설';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      {/* 상단 메타 정보 영역 */}
      <View style={styles.header}>
        <View style={styles.sourceBadge}>
          <Text style={styles.sourceText}>{sourceLabel}</Text>
        </View>
        <Text style={styles.auctionNo} numberOfLines={1}>{property.auction_no}</Text>
        {isFavorite && (
          <View style={styles.favoriteBadge}>
            <Text style={styles.favoriteBadgeText}>★</Text>
          </View>
        )}
        <View style={[styles.gradeBadge, { backgroundColor: gradeStyle.bg }]}>
          <Text style={[styles.gradeText, { color: gradeStyle.text }]}>{gradeStyle.label} ({property.grade})</Text>
        </View>
      </View>

      {/* 주소 및 물건 종류 정보 */}
      <Text style={styles.address} numberOfLines={2}>{property.address}</Text>
      
      <View style={styles.tagContainer}>
        {property.ptype ? (
          <View style={styles.ptypeBadge}>
            <Text style={styles.ptypeText}>{property.ptype}</Text>
          </View>
        ) : null}
        <View style={[styles.scoreBadge, { backgroundColor: property.score >= 80 ? COLORS.emeraldLight : COLORS.slate100 }]}>
          <Text style={[styles.scoreText, { color: property.score >= 80 ? COLORS.emeraldSuccess : COLORS.slate700 }]}>
            AI 점수: {property.score}점
          </Text>
        </View>
        {isInvestment && (
          <View style={styles.investmentBadge}>
            <Text style={styles.investmentBadgeText}>🏆 투자 추천</Text>
          </View>
        )}
        {isResidence && (
          <View style={styles.residenceBadge}>
            <Text style={styles.residenceBadgeText}>🏠 실거주 추천</Text>
          </View>
        )}
      </View>

      {/* 감정가 및 최저가 금융 수치 정보 */}
      <View style={styles.priceContainer}>
        <View style={styles.priceItem}>
          <Text style={styles.priceLabel}>감정가</Text>
          <Text style={styles.appraisedValue}>{formatCurrency(property.appraised_value)}</Text>
        </View>
        <View style={styles.priceItem}>
          <Text style={styles.priceLabel}>최저가</Text>
          <Text style={styles.minimumBid}>{formatCurrency(property.minimum_bid)}</Text>
        </View>
      </View>

      {/* 하단 D-Day 및 기일 정보 */}
      <View style={styles.footer}>
        <Text style={styles.biddingDate}>기일: {property.bidding_date || '미정'}</Text>
        <View style={[styles.ddayBadge, { backgroundColor: property.remaining_days <= 10 && property.remaining_days >= 0 ? COLORS.crimsonLight : COLORS.royalLight }]}>
          <Text style={[styles.ddayText, { color: property.remaining_days <= 10 && property.remaining_days >= 0 ? COLORS.crimsonAlert : COLORS.royalBlue }]}>
            {formatDDay(property.remaining_days)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sourceBadge: {
    backgroundColor: COLORS.slate100,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 8,
  },
  sourceText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.slate700,
  },
  auctionNo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.slate600,
    flex: 1,
  },
  gradeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  gradeText: {
    fontSize: 15,
    fontWeight: '800',
  },
  address: {
    fontSize: 19,
    fontWeight: 'bold',
    color: COLORS.slate900,
    lineHeight: 26,
    marginBottom: 8,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  ptypeBadge: {
    backgroundColor: COLORS.royalLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 6,
    marginBottom: 4,
  },
  ptypeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.royalBlue,
  },
  scoreBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 4,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  priceContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.pearlWhiteBg,
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  priceItem: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 13,
    color: COLORS.slate400,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  appraisedValue: {
    fontSize: 17,
    color: COLORS.slate700,
    fontWeight: 'bold',
  },
  minimumBid: {
    fontSize: 20,
    color: COLORS.crimsonAlert,
    fontWeight: '800',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.slate100,
    paddingTop: 10,
  },
  biddingDate: {
    fontSize: 15,
    color: COLORS.slate600,
    fontWeight: 'bold',
    flex: 1,
  },
  ddayBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  ddayText: {
    fontSize: 15,
    fontWeight: '800',
  },
  favoriteBadge: {
    marginRight: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteBadgeText: {
    fontSize: 18,
    color: COLORS.warningGold,
  },
  investmentBadge: {
    backgroundColor: '#fffbeb',
    borderColor: '#fef3c7',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 6,
    marginBottom: 4,
  },
  investmentBadgeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#b45309',
  },
  residenceBadge: {
    backgroundColor: '#eff6ff',
    borderColor: '#dbeafe',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 6,
    marginBottom: 4,
  },
  residenceBadgeText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1d4ed8',
  },
});
