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
  PanResponder,
  Dimensions,
} from 'react-native';
import { Property } from '../types';
import { COLORS } from '../components/Theme';
import { supabase } from '../utils/supabase';

interface DetailScreenProps {
  property: Property;
  onBack: () => void;
}

export const DetailScreen: React.FC<DetailScreenProps> = ({ property, onBack }) => {
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [userId, setUserId] = useState<string | null>(null);

  // 🧮 계산기 관련 상태 이식
  const [bidValue, setBidValue] = useState<number>(property.minimum_bid || 0);
  const [ltvPercent, setLtvPercent] = useState<number>(0);
  const [interestRate, setInterestRate] = useState<number>(4.5);

  // 📱 화면 어디서든 왼쪽에서 오른쪽으로 쓸어넘기는 제스처(Swipe to go back) 정의
  const screenWidth = Dimensions.get('window').width;
  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false, // 터치 시작 단계에서는 이벤트를 캡처하지 않아 하위 스크롤 뷰가 작동하도록 허용합니다.
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // 화면 어디서든 우측 방향 수평 드래그 감도가 수직 스크롤보다 우세한 경우 캡처를 수립합니다.
        const isHorizontalSwipe = gestureState.dx > 35 && Math.abs(gestureState.dy) < 15;
        return isHorizontalSwipe;
      },
      onPanResponderRelease: (evt, gestureState) => {
        // 우측 드래그 거리가 80 초과이거나 가로 스와이프 속도가 충분히 빠른 경우 뒤로가기를 실행합니다.
        if (gestureState.dx > 80 || gestureState.vx > 0.3) {
          onBack();
        }
      },
    })
  ).current;

  // 화면 진입 시 로그인된 사용자의 관심 물건 등록 상태를 실시간으로 확인하여 UI에 동기화합니다.
  useEffect(() => {
    // 매물 변경 시 계산기 상태 리셋
    setBidValue(property.minimum_bid || 0);
    setLtvPercent(0);
    setInterestRate(4.5);

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && session.user) {
        setUserId(session.user.id);
        checkFavoriteStatus(session.user.id);
      } else {
        setUserId(null);
        setIsFavorite(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session && session.user) {
        setUserId(session.user.id);
        checkFavoriteStatus(session.user.id);
      } else {
        setUserId(null);
        setIsFavorite(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [property.id]);

  // Supabase에서 즐겨찾기 목록을 조회해 현재 매물이 등록되어 있는 상태인지 검증합니다.
  const checkFavoriteStatus = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('user_favorites')
        .select('*')
        .eq('user_id', uid)
        .eq('property_id', property.id);
      if (error) throw error;
      setIsFavorite(data && data.length > 0);
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
        const { error } = await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', userId)
          .eq('property_id', property.id);
        if (error) throw error;
        setIsFavorite(false);
      } else {
        const { error } = await supabase
          .from('user_favorites')
          .insert({
            user_id: userId,
            property_id: property.id
          });
        if (error) throw error;
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

  // 🧮 가상 키패드 터치 처리
  const pressCalcKey = (key: string) => {
    if (key === 'C') {
      setBidValue(0);
    } else if (key === 'backspace') {
      const strVal = String(bidValue);
      if (strVal.length > 1) {
        setBidValue(parseInt(strVal.substring(0, strVal.length - 1)) || 0);
      } else {
        setBidValue(0);
      }
    } else if (key === '+1억') {
      setBidValue(prev => prev + 100000000);
    } else if (key === '+1천') {
      setBidValue(prev => prev + 10000000);
    } else if (key === '+1백') {
      setBidValue(prev => prev + 1000000);
    } else if (key === '최저가') {
      setBidValue(property.minimum_bid || 0);
    } else if (key === '감정가') {
      setBidValue(property.appraised_value || 0);
    } else {
      const strVal = String(bidValue);
      if (strVal === '0') {
        setBidValue(parseInt(key) || 0);
      } else {
        const nextVal = parseInt(strVal + key) || 0;
        if (nextVal < 1000000000000) { // 1조원 초과 입력 제한
          setBidValue(nextVal);
        }
      }
    }
  };

  const gradeStyle = getGradeStyle(property.grade);
  const discountRate = calculateDiscountRate();
  const sourceLabel = property.source === 'court' ? '⚖️ 대법원 법원경매' : property.source === 'onbid' ? '🏢 캠코 온비드 공매' : '📁 업로드 사설';

  // ❶ 지방세법 실거래 보정 수식 (용도분기 적용)
  const ptype = (property.ptype || "").toLowerCase();
  let taxRate = 0.015; // 아파트, 단독주택 등 주거용: 기본 디폴트 1.5%
  let rateLabel = "주택 1.5%";

  if (ptype.includes("상가") || ptype.includes("점포") || ptype.includes("근린") || ptype.includes("토지") || ptype.includes("공장") || ptype.includes("빌딩") || ptype.includes("기타")) {
    taxRate = 0.046;
    rateLabel = "상가/토지 4.6%";
  }

  // 취득세 계산 (지방세법 의거 원 단위 절사)
  const acquisitionTax = Math.floor(bidValue * taxRate);
  // 법무 수수료 및 채권 할인율 대행비 0.5% 연산
  const agencyFee = Math.floor(bidValue * 0.005);
  // 필요 소요 총자금 합계
  const totalBudget = bidValue + acquisitionTax + agencyFee;

  // LTV 계산 및 금리 시뮬레이션
  const loanAmount = Math.floor(bidValue * (ltvPercent / 100));
  const annualInterest = loanAmount * (interestRate / 100);
  const monthlyInterest = Math.floor(annualInterest / 12);
  const cashRequired = totalBudget - loanAmount;

  return (
    <SafeAreaView style={styles.safeArea} {...panResponder.panHandlers}>
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

          {/* 🧮 모바일 스마트 소요자금 계획서 계산기 통합 이식 */}
          <View style={styles.calcContainer}>
            <Text style={styles.calcLabel}>내 예상 입찰 응찰가 입력 및 🧮 디지털 계산기 패드</Text>
            
            {/* 실시간 원화 금액 포맷 디지털 모니터 */}
            <View style={styles.calcDisplay}>
              <Text style={styles.calcDisplayText}>{formatCurrencyKorean(bidValue)}</Text>
            </View>
            
            {/* 입찰가 노출용 더미 인풋창 */}
            <Text style={styles.calcInputDummy}>{formatCurrency(bidValue)}</Text>

            {/* 인터랙티브 가상 키패드 */}
            <View style={styles.keypadGrid}>
              <TouchableOpacity onPress={() => pressCalcKey('+1억')} style={[styles.keypadButton, styles.keypadButtonSpecial]}><Text style={[styles.keypadButtonTextCompact, styles.keypadButtonTextSpecial]}>+1억</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => pressCalcKey('+1천')} style={[styles.keypadButton, styles.keypadButtonSpecial]}><Text style={[styles.keypadButtonTextCompact, styles.keypadButtonTextSpecial]}>+1천만</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => pressCalcKey('+1백')} style={[styles.keypadButton, styles.keypadButtonSpecial]}><Text style={[styles.keypadButtonTextCompact, styles.keypadButtonTextSpecial]}>+1백만</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => pressCalcKey('C')} style={[styles.keypadButton, styles.keypadButtonReset]}><Text style={[styles.keypadButtonText, styles.keypadButtonTextReset]}>C</Text></TouchableOpacity>
              
              <TouchableOpacity onPress={() => pressCalcKey('7')} style={styles.keypadButton}><Text style={styles.keypadNumberText}>7</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => pressCalcKey('8')} style={styles.keypadButton}><Text style={styles.keypadNumberText}>8</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => pressCalcKey('9')} style={styles.keypadButton}><Text style={styles.keypadNumberText}>9</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => pressCalcKey('backspace')} style={[styles.keypadButton, { backgroundColor: '#fef3c7' }]}><Text style={[styles.keypadButtonText, { color: '#92400e' }]}>⌫</Text></TouchableOpacity>
              
              <TouchableOpacity onPress={() => pressCalcKey('4')} style={styles.keypadButton}><Text style={styles.keypadNumberText}>4</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => pressCalcKey('5')} style={styles.keypadButton}><Text style={styles.keypadNumberText}>5</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => pressCalcKey('6')} style={styles.keypadButton}><Text style={styles.keypadNumberText}>6</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => pressCalcKey('최저가')} style={[styles.keypadButton, { backgroundColor: '#e0e7ff' }]}><Text style={[styles.keypadButtonTextCompact, { color: '#4338ca' }]}>최저가</Text></TouchableOpacity>
              
              <TouchableOpacity onPress={() => pressCalcKey('1')} style={styles.keypadButton}><Text style={styles.keypadNumberText}>1</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => pressCalcKey('2')} style={styles.keypadButton}><Text style={styles.keypadNumberText}>2</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => pressCalcKey('3')} style={styles.keypadButton}><Text style={styles.keypadNumberText}>3</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => pressCalcKey('감정가')} style={[styles.keypadButton, { backgroundColor: '#e0e7ff' }]}><Text style={[styles.keypadButtonTextCompact, { color: '#4338ca' }]}>감정가</Text></TouchableOpacity>
              
              <TouchableOpacity onPress={() => pressCalcKey('0')} style={styles.keypadButton}><Text style={styles.keypadNumberText}>0</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => pressCalcKey('00')} style={styles.keypadButton}><Text style={styles.keypadNumberText}>00</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => pressCalcKey('000')} style={styles.keypadButton}><Text style={styles.keypadNumberText}>000</Text></TouchableOpacity>
              <View style={[styles.keypadButton, { backgroundColor: COLORS.emeraldLight }]}><Text style={[styles.keypadButtonText, { color: COLORS.emeraldSuccess }]}>✓</Text></View>
            </View>

            {/* LTV 대출 및 금리 시뮬레이터 */}
            <Text style={[styles.calcLabel, { marginTop: 10 }]}>🏦 경락잔금대출 설정 (LTV)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.ltvScroll}>
              {[0, 30, 40, 50, 60, 70, 80].map((percent) => (
                <TouchableOpacity
                  key={percent}
                  onPress={() => setLtvPercent(percent)}
                  style={[styles.ltvChip, ltvPercent === percent && styles.ltvChipActive]}
                >
                  <Text style={[styles.ltvChipText, ltvPercent === percent && styles.ltvChipTextActive]}>
                    {percent === 0 ? '비대출 (0%)' : `${percent}%`}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {ltvPercent > 0 && (
              <View style={styles.interestRow}>
                <Text style={styles.interestLabel}>대출 금리 연동 시뮬레이터</Text>
                <View style={styles.interestControl}>
                  <TouchableOpacity onPress={() => setInterestRate(prev => Math.max(1.0, parseFloat((prev - 0.1).toFixed(1))))} style={styles.interestBtn}>
                    <Text style={styles.interestBtnText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.interestValue}>{interestRate.toFixed(1)}%</Text>
                  <TouchableOpacity onPress={() => setInterestRate(prev => Math.min(15.0, parseFloat((prev + 0.1).toFixed(1))))} style={styles.interestBtn}>
                    <Text style={styles.interestBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* 취득세율 뱃지 표시 영수증 */}
            <View style={styles.receiptContainer}>
              <View style={styles.receiptHeader}>
                <Text style={styles.receiptHeaderText}>정밀 소요자금 계산 영수증</Text>
                <View style={{ backgroundColor: taxRate === 0.046 ? '#fffbeb' : '#f0f9ff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: taxRate === 0.046 ? '#fde68a' : '#bae6fd' }}>
                  <Text style={{ fontSize: 9, fontWeight: 'bold', color: taxRate === 0.046 ? '#b45309' : COLORS.royalBlue }}>{rateLabel}</Text>
                </View>
              </View>

              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>예상 응찰가격</Text>
                <Text style={styles.receiptValue}>{formatCurrency(bidValue)}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>취득세 ({(taxRate * 100).toFixed(1)}%)</Text>
                <Text style={styles.receiptValue}>+ {formatCurrency(acquisitionTax)}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>대행/채권비 (0.5%)</Text>
                <Text style={styles.receiptValue}>+ {formatCurrency(agencyFee)}</Text>
              </View>

              <View style={[styles.receiptRow, styles.receiptTotalRow]}>
                <Text style={styles.receiptTotalLabel}>필요 소요자금 총합</Text>
                <Text style={styles.receiptTotalValue}>{formatCurrency(totalBudget)}</Text>
              </View>

              {ltvPercent > 0 && (
                <View style={styles.loanHighlightRow}>
                  <View style={styles.receiptRow}>
                    <Text style={[styles.receiptLabel, { color: COLORS.royalBlue }]}>예상 잔금 대출액 ({ltvPercent}%)</Text>
                    <Text style={[styles.receiptValue, { color: COLORS.royalBlue }]}>{formatCurrency(loanAmount)}</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={[styles.receiptLabel, { color: '#047857' }]}>월평균 대출이자 지출</Text>
                    <Text style={[styles.receiptValue, { color: '#047857' }]}>{formatCurrency(monthlyInterest)} /월</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={[styles.receiptLabel, { color: COLORS.slate700 }]}>실제 준비할 현금 한도</Text>
                    <Text style={[styles.receiptValue, { color: COLORS.slate900, fontWeight: '800' }]}>{formatCurrency(cashRequired)}</Text>
                  </View>
                </View>
              )}
            </View>
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

        {/* 📋 입찰 당일 필수 체크리스트 */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>📋 입찰 당일 필수 체크리스트</Text>
          {property.source === 'court' ? (
            <View style={styles.checklistContainerCourt}>
              <Text style={styles.checklistTitleCourt}>⚖️ 대법원 법원경매 입찰 준비 (현장 법정 출석 필수)</Text>
              <View style={styles.checklistItem}>
                <Text style={styles.checklistIndexCourt}>1.</Text>
                <Text style={styles.checklistText}>본인 신분증 및 개인 도장 지참 (인감도장 권장, 대리 입찰 시 인감증명서 및 위임장 필수 준비)</Text>
              </View>
              <View style={styles.checklistItem}>
                <Text style={styles.checklistIndexCourt}>2.</Text>
                <Text style={styles.checklistText}>입찰보증금 (10%) 지참 (당회차 최저매각가격의 10%를 수표 1장으로 은행에서 사전 발급)</Text>
              </View>
              <View style={styles.checklistItem}>
                <Text style={styles.checklistIndexCourt}>3.</Text>
                <Text style={styles.checklistText}>기일입찰표 정밀 기재 (사건번호, 물건번호 및 입찰가 금액 칸의 자릿수 실수/오타 확인 필수)</Text>
              </View>
              <View style={styles.checklistItem}>
                <Text style={styles.checklistIndexCourt}>4.</Text>
                <Text style={styles.checklistText}>입찰 마감 시간 엄수 (법원별 마감 시간 - 대개 오전 11시 10분 전에 집행관 수취함에 입찰서 투함)</Text>
              </View>
            </View>
          ) : (
            <View style={styles.checklistContainerOnbid}>
              <Text style={styles.checklistTitleOnbid}>🏢 캠코 온비드공매 입찰 준비 (100% 인터넷 입찰)</Text>
              <View style={styles.checklistItem}>
                <Text style={styles.checklistIndexOnbid}>1.</Text>
                <Text style={styles.checklistText}>공동인증서 등록 상태 검증 (온비드 회원 가입 및 전자 입찰용 범용/공매전용 인증서 연동 여부 확인)</Text>
              </View>
              <View style={styles.checklistItem}>
                <Text style={styles.checklistIndexOnbid}>2.</Text>
                <Text style={styles.checklistText}>인터넷 입찰서 작성 및 제출 (공매 입찰 기간 - 대개 월요일 10:00부터 수요일 17:00까지 마감 기한 내 온라인 접수)</Text>
              </View>
              <View style={styles.checklistItem}>
                <Text style={styles.checklistIndexOnbid}>3.</Text>
                <Text style={styles.checklistText}>입찰보증금 (10%) 납부 (본인이 써낸 입찰금액의 10%를 지정 가상계좌로 이체 후 정상 확인 처리 검토)</Text>
              </View>
              <View style={styles.checklistItem}>
                <Text style={styles.checklistIndexOnbid}>4.</Text>
                <Text style={styles.checklistText}>결과 발표 대기 (목요일 오전 11시 개찰 후 낙찰 문자 메시지 및 나의온비드 낙찰 결과 확인)</Text>
              </View>
            </View>
          )}
        </View>

        {/* 🌐 정부 실무 공용 정보망 연동 및 서류 조회 */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>🌐 정부 실무 공용 정보망 연동</Text>
          <Text style={styles.networkSub}>실소유주와 점유 관계, 토지/건물 용도 및 현재 실거래 시세를 확인하기 위해 공식 공공 포털로 연동해 보십시오.</Text>
          
          <View style={styles.networkGrid}>
            {/* 1. 공식 매각원문 */}
            <TouchableOpacity 
              onPress={() => Linking.openURL(property.link_url || 'https://www.courtauction.go.kr')}
              style={[styles.networkButton, { backgroundColor: '#f0f9ff', borderColor: '#bae6fd' }]}
            >
              <View style={[styles.networkIconContainer, { backgroundColor: COLORS.royalBlue }]}>
                <Text style={styles.networkIconText}>🔗</Text>
              </View>
              <View style={styles.networkTextContainer}>
                <Text style={[styles.networkBtnTitle, { color: COLORS.royalBlue }]}>매각원문 이동</Text>
                <Text style={styles.networkBtnSub} numberOfLines={1}>법원 공식 공고 정보 이동</Text>
              </View>
            </TouchableOpacity>

            {/* 2. 네이버 지도 보기 */}
            <TouchableOpacity 
              onPress={() => Linking.openURL(`https://map.naver.com/v5/search/${encodeURIComponent(property.address)}`)}
              style={[styles.networkButton, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}
            >
              <View style={[styles.networkIconContainer, { backgroundColor: COLORS.emeraldSuccess }]}>
                <Text style={styles.networkIconText}>🗺️</Text>
              </View>
              <View style={styles.networkTextContainer}>
                <Text style={[styles.networkBtnTitle, { color: COLORS.emeraldSuccess }]}>네이버 지도 보기</Text>
                <Text style={styles.networkBtnSub} numberOfLines={1}>물건지 실위치 및 로드뷰</Text>
              </View>
            </TouchableOpacity>

            {/* 3. 대법원 인터넷등기소 */}
            <TouchableOpacity 
              onPress={() => Linking.openURL('http://www.iros.go.kr/PMainJ.jsp?main=1')}
              style={styles.networkButton}
            >
              <View style={styles.networkIconContainer}>
                <Text style={styles.networkIconText}>📜</Text>
              </View>
              <View style={styles.networkTextContainer}>
                <Text style={styles.networkBtnTitle}>인터넷등기소</Text>
                <Text style={styles.networkBtnSub} numberOfLines={1}>등기부등본 권리관계 열람</Text>
              </View>
            </TouchableOpacity>

            {/* 4. 정부24 전입세대확인서 */}
            <TouchableOpacity 
              onPress={() => Linking.openURL('https://www.gov.kr/main?a=9999&srvcId=131100000021')}
              style={styles.networkButton}
            >
              <View style={styles.networkIconContainer}>
                <Text style={styles.networkIconText}>👥</Text>
              </View>
              <View style={styles.networkTextContainer}>
                <Text style={styles.networkBtnTitle}>전입세대확인서</Text>
                <Text style={styles.networkBtnSub} numberOfLines={1}>대항력 점유 세입자 대조</Text>
              </View>
            </TouchableOpacity>

            {/* 5. 건축물대장 무료열람 */}
            <TouchableOpacity 
              onPress={() => Linking.openURL('https://www.gov.kr/mw/AA020InfoCappView.do?HighCtgCD=A01004001&CappBizCD=15000000098')}
              style={styles.networkButton}
            >
              <View style={styles.networkIconContainer}>
                <Text style={styles.networkIconText}>🏢</Text>
              </View>
              <View style={styles.networkTextContainer}>
                <Text style={styles.networkBtnTitle}>건축물대장 열람</Text>
                <Text style={styles.networkBtnSub} numberOfLines={1}>위반건축물 및 대장 조회</Text>
              </View>
            </TouchableOpacity>

            {/* 6. 네이버 부동산 시세 조회 */}
            <TouchableOpacity 
              onPress={() => Linking.openURL(`https://new.land.naver.com/complexes?searchQuery=${encodeURIComponent(property.address)}`)}
              style={styles.networkButton}
            >
              <View style={styles.networkIconContainer}>
                <Text style={styles.networkIconText}>🏠</Text>
              </View>
              <View style={styles.networkTextContainer}>
                <Text style={styles.networkBtnTitle}>실거래 시세 대조</Text>
                <Text style={styles.networkBtnSub} numberOfLines={1}>동종 면적 실거래 시세 대조</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

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
  calcContainer: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.slate100,
    paddingTop: 16,
  },
  calcLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.slate400,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  calcDisplay: {
    backgroundColor: COLORS.slate900,
    borderRadius: 10,
    padding: 10,
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  calcDisplayText: {
    fontSize: 18,
    fontFamily: 'monospace',
    fontWeight: 'bold',
    color: '#34d399',
  },
  calcInputDummy: {
    backgroundColor: COLORS.slate100,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.royalBlue,
    textAlign: 'right',
    marginBottom: 10,
  },
  keypadGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  keypadButton: {
    width: '23%',
    aspectRatio: 1.6,
    backgroundColor: COLORS.slate100,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  keypadButtonSpecial: {
    backgroundColor: COLORS.royalLight,
  },
  keypadButtonReset: {
    backgroundColor: COLORS.crimsonLight,
  },
  keypadButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.slate700,
  },
  keypadButtonTextCompact: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.slate700,
  },
  keypadButtonTextSpecial: {
    color: COLORS.royalBlue,
  },
  keypadButtonTextReset: {
    color: COLORS.crimsonAlert,
  },
  ltvScroll: {
    flexDirection: 'row',
    marginBottom: 14,
    marginTop: 4,
  },
  ltvChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: COLORS.slate100,
    borderRadius: 8,
    marginRight: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  ltvChipActive: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.royalBlue,
  },
  ltvChipText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.slate600,
  },
  ltvChipTextActive: {
    color: COLORS.royalBlue,
  },
  interestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.slate100,
    padding: 10,
    borderRadius: 10,
    marginBottom: 14,
  },
  interestLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.slate700,
  },
  interestControl: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  interestBtn: {
    backgroundColor: COLORS.slate200,
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  interestBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.slate700,
  },
  interestValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.slate700,
    marginHorizontal: 10,
    minWidth: 40,
    textAlign: 'center',
  },
  receiptContainer: {
    backgroundColor: COLORS.slate100,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    marginTop: 8,
  },
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate200,
    paddingBottom: 8,
    marginBottom: 8,
  },
  receiptHeaderText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.slate700,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  receiptLabel: {
    fontSize: 13,
    color: COLORS.slate600,
    fontWeight: 'bold',
  },
  receiptValue: {
    fontSize: 13,
    color: COLORS.slate700,
    fontWeight: 'bold',
  },
  receiptTotalRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.slate200,
    paddingTop: 8,
    marginTop: 8,
  },
  receiptTotalLabel: {
    fontSize: 14,
    color: COLORS.slate700,
    fontWeight: '800',
  },
  receiptTotalValue: {
    fontSize: 16,
    color: COLORS.royalBlue,
    fontWeight: '900',
  },
  loanHighlightRow: {
    backgroundColor: COLORS.royalLight,
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
  },
  keypadNumberText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.slate700,
  },
  checklistContainerCourt: {
    backgroundColor: '#f0f9ff',
    borderColor: '#bae6fd',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  checklistContainerOnbid: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  checklistTitleCourt: {
    fontSize: 13.5,
    fontWeight: 'bold',
    color: COLORS.royalBlue,
    marginBottom: 10,
  },
  checklistTitleOnbid: {
    fontSize: 13.5,
    fontWeight: 'bold',
    color: COLORS.emeraldSuccess,
    marginBottom: 10,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  checklistIndexCourt: {
    fontSize: 12.5,
    fontWeight: 'bold',
    color: COLORS.royalBlue,
    marginRight: 4,
  },
  checklistIndexOnbid: {
    fontSize: 12.5,
    fontWeight: 'bold',
    color: COLORS.emeraldSuccess,
    marginRight: 4,
  },
  checklistText: {
    flex: 1,
    fontSize: 12.5,
    color: COLORS.slate700,
    lineHeight: 18,
  },
  networkSub: {
    fontSize: 11.5,
    color: COLORS.slate500,
    lineHeight: 17,
    marginBottom: 12,
  },
  networkGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  networkButton: {
    width: '48.5%',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    borderRadius: 12,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: COLORS.slate900,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  networkIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: COLORS.royalLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  networkIconText: {
    fontSize: 14,
  },
  networkTextContainer: {
    flex: 1,
  },
  networkBtnTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: COLORS.slate800,
  },
  networkBtnSub: {
    fontSize: 8.5,
    color: COLORS.slate400,
    marginTop: 1,
  },
});
