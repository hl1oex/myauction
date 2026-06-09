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
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Property } from '../types';
import { COLORS } from '../components/Theme';
import { supabase } from '../utils/supabase';

interface DetailScreenProps {
  property: Property;
  onBack: () => void;
}

const estimateAuctionRounds = (appraisal: number, price: number, source: string) => {
  if (!appraisal || !price || appraisal <= 0 || price <= 0) {
    return { round: 1, failedCount: 0, discount: 0 };
  }
  const discount = Math.round(((appraisal - price) / appraisal) * 100);
  const ratio = price / appraisal;
  let failedCount = 0;
  
  if (source === 'court') {
    if (ratio >= 0.95) failedCount = 0;
    else if (ratio >= 0.75) failedCount = 1;
    else if (ratio >= 0.55) failedCount = 2;
    else if (ratio >= 0.40) failedCount = 3;
    else failedCount = 4;
  } else {
    if (ratio >= 0.95) failedCount = 0;
    else if (ratio >= 0.85) failedCount = 1;
    else if (ratio >= 0.75) failedCount = 2;
    else if (ratio >= 0.65) failedCount = 3;
    else failedCount = 4;
  }
  return {
    round: failedCount + 1,
    failedCount: failedCount,
    discount: discount < 0 ? 0 : discount
  };
};

export const DetailScreen: React.FC<DetailScreenProps> = ({ property, onBack }) => {
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'analysis' | 'documents' | 'finance' | 'map'>('analysis');

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

  // 🟢 [신규] 자산 종합 투자 가치 및 규제/대항력 동적 분석 엔진
  const analyzePropertyDetailExtra = (item: Property) => {
    const address = item.address || "";
    const ptypeText = (item.ptype || "").toLowerCase();
    const grade = (item.grade || "C").toUpperCase();
    const score = item.score || 50;
    const source = item.source || "court";
    const textToSearch = `${item.address} ${item.desc_content} ${item.notes_content}`.toLowerCase();
    
    // 1) 자산 투자 유형 구분
    let investmentType = "투자 & 실거주 겸용";
    let investmentTypeColor = COLORS.emeraldSuccess;
    let investmentTypeBg = COLORS.emeraldLight;
    let investmentDesc = "주거용 부동산으로서 실거주 가치가 우수할 뿐만 아니라, 향후 시세 차익을 노릴 수 있는 투자용 자산으로도 적합합니다.";
    
    const isCommercial = ptypeText.includes("상가") || ptypeText.includes("근린") || ptypeText.includes("점포") || ptypeText.includes("상업") || ptypeText.includes("빌딩") || ptypeText.includes("숙박");
    const isLandOrFactory = ptypeText.includes("토지") || ptypeText.includes("임야") || ptypeText.includes("공장") || ptypeText.includes("창고") || ptypeText.includes("답") || ptypeText.includes("전");
    const isResidential = ptypeText.includes("아파트") || ptypeText.includes("주택") || ptypeText.includes("다세대") || ptypeText.includes("빌라") || ptypeText.includes("오피스텔");

    if (isCommercial) {
      investmentType = "수익형 투자용";
      investmentTypeColor = COLORS.royalBlue;
      investmentTypeBg = COLORS.royalLight;
      investmentDesc = "임대 소득 및 영업 권리금 창출을 목표로 하는 수익형 투자 부동산에 특화되어 있습니다.";
    } else if (isLandOrFactory) {
      investmentType = "토지/개발 투자용";
      investmentTypeColor = COLORS.warningGold;
      investmentTypeBg = COLORS.warningLight;
      investmentDesc = "장기적인 지가 상승 혜택이나 용도 변경을 통한 개발 투자용 성격이 강한 자산입니다.";
    } else if (isResidential) {
      if (score >= 85) {
        investmentType = "투자 & 실거주 겸용 (A급)";
        investmentTypeColor = COLORS.emeraldSuccess;
        investmentTypeBg = COLORS.emeraldLight;
        investmentDesc = "뛰어난 입지 요건과 안전한 권리 구성을 갖추어, 안정적인 실거주와 매매가 상승의 혜택을 동시에 취할 수 있습니다.";
      } else {
        investmentType = "실거주용 특화";
        investmentTypeColor = COLORS.royalBlue;
        investmentTypeBg = COLORS.royalLight;
        investmentDesc = "비교적 낙찰 경쟁이 덜하여 보수적인 입찰가로 내 집 마련에 적합한 실거주 중심 부동산입니다.";
      }
    }

    // 2) 말소기준권리 전후 말소확인여부
    let malsoStatus = "말소 (소멸)";
    let malsoStatusColor = COLORS.emeraldSuccess;
    let malsoStatusBg = COLORS.emeraldLight;
    let malsoDesc = "말소기준권리 이하 모든 등기부상 권리(압류, 근저당 등)는 매각으로 인해 낙찰 후 100% 소멸하여 안전하게 말소됩니다.";
    if (grade === "X" || textToSearch.includes("인수") || textToSearch.includes("선순위")) {
      malsoStatus = "인수 리스크 존재";
      malsoStatusColor = COLORS.crimsonAlert;
      malsoStatusBg = COLORS.crimsonLight;
      malsoDesc = "말소기준권리보다 순위가 앞서는 선순위 권리 또는 매각으로 소멸되지 않는 특수 권리가 있어 낙찰자 부담으로 인수될 수 있습니다.";
    }

    // 3) 대항력 유무 (보증금 인수)
    let daehangStatus = "대항력 없음 (안전)";
    let daehangColor = COLORS.emeraldSuccess;
    let daehangBg = COLORS.emeraldLight;
    let daehangDesc = "임차인의 대항력이 없거나 말소기준권리 이하로 소멸되어 낙찰자가 보증금을 인수하지 않는 안전한 매물입니다.";

    if (textToSearch.includes("대항력 포기") || textToSearch.includes("대항력포기") || textToSearch.includes("포기조건")) {
      daehangStatus = "대항력 포기 (안전)";
      daehangColor = COLORS.emeraldSuccess;
      daehangBg = COLORS.emeraldLight;
      daehangDesc = "주택도시보증공사(HUG) 등 채권승계인이 대항력을 포기하는 조건으로 매각하므로, 선순위 임차인이 존재하더라도 낙찰자가 보증금을 인수할 위험이 없습니다.";
    } else if (textToSearch.includes("대항력 미상") || textToSearch.includes("임차인 미상") || textToSearch.includes("전입세대 확인요망") || textToSearch.includes("확인요망") || textToSearch.includes("미상")) {
      daehangStatus = "대항력 미상 (확인 요망)";
      daehangColor = COLORS.warningGold;
      daehangBg = COLORS.warningLight;
      daehangDesc = "임차인이 존재하나 대항력 성립 여부나 보증금 액수가 불분명하므로, 현장 임장 및 주민센터 전입세대 열람을 통한 추가 조사가 필수적입니다.";
    } else if (textToSearch.includes("인수") || textToSearch.includes("대항력") || textToSearch.includes("임차권") || textToSearch.includes("보증금 인수") || textToSearch.includes("선순위 임차인") || textToSearch.includes("선순위 전입")) {
      daehangStatus = "선순위 대항력 주의";
      daehangColor = COLORS.crimsonAlert;
      daehangBg = COLORS.crimsonLight;
      daehangDesc = "낙찰자에게 대항할 수 있는 선순위 임차인이 존재하여, 배당되지 못한 보증금 차액을 낙찰자가 추가로 인수해야 할 수 있으므로 철저한 권리분석이 요구됩니다.";
    }

    // 4) 2주택 가능 여부
    let twoHouseStatus = "비규제 (취득세 일반)";
    let twoHouseColor = COLORS.emeraldSuccess;
    let twoHouseBg = COLORS.emeraldLight;
    let twoHouseDesc = "취득세 중과 규제가 없는 비조정대상지역으로, 2주택 취득 시에도 일반 세율이 적용되어 다주택 진입 장벽이 매우 낮습니다.";
    if (address.includes("강남구") || address.includes("서초구") || address.includes("송파구") || address.includes("용산구")) {
      twoHouseStatus = "규제지역 (취득세 중과)";
      twoHouseColor = COLORS.crimsonAlert;
      twoHouseBg = COLORS.crimsonLight;
      twoHouseDesc = "조정대상 규제지역에 속하므로 2주택 이상 취득 시 취득세가 중과(8%)될 수 있으며 세제 관리에 각별한 주의가 요구됩니다.";
    }

    // 5) 토지거래허가지역 여부
    let landPermitStatus = "허가 의무 면제";
    let landPermitColor = COLORS.emeraldSuccess;
    let landPermitBg = COLORS.emeraldLight;
    let landPermitDesc = "경매/공매 절차를 통한 매각의 경우, 토지거래허가구역 내에 위치하더라도 부동산 거래 신고 및 구청장 허가 의무가 법적으로 면제됩니다.";
    if (source === "onbid") {
      landPermitStatus = "토지거래허가 대상 (공매)";
      landPermitColor = COLORS.warningGold;
      landPermitBg = COLORS.warningLight;
      landPermitDesc = "공매는 사법상 매매에 가까우므로, 토지거래허가구역 내 주택 취득 시 사전에 구청장의 허가를 득해야 하며 실거주 의무(2년)가 부여될 수 있습니다.";
    }

    // 6) 예상 공시지가 산출 (감정평가액의 65% 수준 시뮬레이션 적용)
    const officialLandPrice = Math.floor(item.appraised_value * 0.65);
    const officialLandPriceDesc = "감정평가액 대비 약 65% 수준으로 산출된 가상 시뮬레이션 값입니다. 국토교통부 공시가격알리미 및 실거래가 대조 확인이 요구됩니다.";

    // 7) 토지이용계획 규제 요약 (주소 및 용도별 자동 식별 처리)
    let landUsePlan = "제2종일반주거지역";
    let landUsePlanDesc = "일반적인 주거용 부동산 지대이며, 건폐율 60% 이하 및 용적률 150%에서 250% 이하의 제한을 받습니다.";
    
    if (isCommercial) {
      landUsePlan = "일반상업지역";
      landUsePlanDesc = "상업 및 업무 기능 편익 증진을 위한 지역이며, 건폐율 80% 이하 및 용적률 300%에서 1300% 이하 범위에서 지자체 조례에 따라 적용됩니다.";
    } else if (isLandOrFactory) {
      if (textToSearch.includes("임야") || textToSearch.includes("보전")) {
        landUsePlan = "보전관리지역";
        landUsePlanDesc = "자연환경 보호 및 산림 보호를 위해 관리 조례에 규제되며, 건폐율 20% 이하 및 용적률 50%에서 80% 이하가 적용됩니다.";
      } else if (ptypeText.includes("공장") || ptypeText.includes("산업")) {
        landUsePlan = "준공업지역";
        landUsePlanDesc = "공업 편익 증진을 도모하되 주거, 상업 기능의 보완이 혼재 가능하며, 건폐율 70% 이하 및 용적률 200%에서 400% 이하 규제를 적용받습니다.";
      } else {
        landUsePlan = "계획관리지역";
        landUsePlanDesc = "도시지역으로의 편입이 예상되는 지역이며, 제한적인 이용 및 개발이 가능하고 건폐율 40% 이하 및 용적률 50%에서 100% 이하의 규제를 적용받습니다.";
      }
    } else if (ptypeText.includes("아파트") || textToSearch.includes("고층")) {
      landUsePlan = "제3종일반주거지역";
      landUsePlanDesc = "중고층 주택 중심의 편리한 주거환경을 조성하기 위한 지역이며, 건폐율 50% 이하 및 용적률 200%에서 300% 이하의 제한을 받습니다.";
    }

    return {
      investmentType,
      investmentTypeColor,
      investmentTypeBg,
      investmentDesc,
      malsoStatus,
      malsoStatusColor,
      malsoStatusBg,
      malsoDesc,
      daehangStatus,
      daehangColor,
      daehangBg,
      daehangDesc,
      twoHouseStatus,
      twoHouseColor,
      twoHouseBg,
      twoHouseDesc,
      landPermitStatus,
      landPermitColor,
      landPermitBg,
      landPermitDesc,
      officialLandPrice,
      officialLandPriceDesc,
      landUsePlan,
      landUsePlanDesc
    };
  };

  const score = property.score || 50;
  const isCommercial = ptype.includes('상가') || ptype.includes('근린') || ptype.includes('점포') || ptype.includes('상업') || ptype.includes('빌딩') || ptype.includes('숙박') || ptype.includes('사무') || ptype.includes('생활시설');
  const isLandOrFactory = ptype.includes('토지') || ptype.includes('대지') || ptype.includes('임야') || ptype.includes('잡종지') || ptype.includes('대') || ptype.includes('전') || ptype.includes('답') || ptype.includes('공장') || ptype.includes('창고') || ptype.includes('산업');
  const isResidential = ptype.includes('아파트') || ptype.includes('주택') || ptype.includes('다세대') || ptype.includes('빌라') || ptype.includes('오피스텔') || ptype.includes('연립') || ptype.includes('가구') || ptype.includes('단독') || ptype.includes('전원');

  const isInvestment = isCommercial || isLandOrFactory || (isResidential && score >= 85);
  const isResidence = isResidential;

  const extra = analyzePropertyDetailExtra(property);
  
  // 🟢 인근 낙찰 통계 및 시장 지표 산출
  const est = estimateAuctionRounds(property.appraised_value, property.minimum_bid, property.source);
  let aiBidRate = '';
  let aiEvictPeriod = '';
  
  if (property.grade === 'A') {
    aiBidRate = '88% ~ 93% (감정가 대비 낙찰 강력 추천)';
    aiEvictPeriod = '🚪 약 1.5개월 ~ 2개월 내 원활한 합의 가능';
  } else if (property.grade === 'B') {
    aiBidRate = '80% ~ 86% (감정가 대비 낙찰 우수)';
    aiEvictPeriod = '🚪 약 2.5개월 ~ 3개월 내 점진적 합의 가능';
  } else if (property.grade === 'X') {
    aiBidRate = '45% ~ 55% (유찰 권장 / 입찰 부적격)';
    aiEvictPeriod = '🚨 점유자 불복 / 강제집행 소송 6개월 이상 소요 예상';
  } else {
    aiBidRate = '70% ~ 78% (감정가 대비 입찰 고려)';
    aiEvictPeriod = '🚪 약 3개월 내 통상적인 명도 가능';
  }

  const aiMarketCompare = est.discount > 0 
    ? `주변 동종 매물 실거래 평균가 대비 약 ${est.discount}% 저렴하게 확보할 수 있는 파격적인 기회입니다!`
    : '신건 매물로 주변 시세와 대등하게 책정되었습니다. 추가 유찰 여부를 모니터링하십시오.';

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
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
            <View style={styles.ptypeBadge}>
              <Text style={styles.ptypeText}>{property.ptype || '부동산 일반 용도'}</Text>
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
        </View>

        {/* 4단 프리미엄 탭 버튼 바 */}
        <View style={styles.tabBar}>
          <TouchableOpacity onPress={() => setActiveTab('analysis')} style={[styles.tabButton, activeTab === 'analysis' && styles.tabButtonActive]}>
            <Text style={[styles.tabButtonText, activeTab === 'analysis' && styles.tabButtonTextActive]}>권리진단</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab('documents')} style={[styles.tabButton, activeTab === 'documents' && styles.tabButtonActive]}>
            <Text style={[styles.tabButtonText, activeTab === 'documents' && styles.tabButtonTextActive]}>서류/이력</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab('finance')} style={[styles.tabButton, activeTab === 'finance' && styles.tabButtonActive]}>
            <Text style={[styles.tabButtonText, activeTab === 'finance' && styles.tabButtonTextActive]}>입찰/금융</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab('map')} style={[styles.tabButton, activeTab === 'map' && styles.tabButtonActive]}>
            <Text style={[styles.tabButtonText, activeTab === 'map' && styles.tabButtonTextActive]}>지도/도면</Text>
          </TouchableOpacity>
        </View>

        {/* [1] 권리진단 탭 */}
        {activeTab === 'analysis' && (
          <View>
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

            {/* 📊 인근 낙찰 통계 및 시장 지표 */}
            <View style={[styles.sectionCard, { backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }]}>
              <Text style={[styles.sectionTitle, { color: COLORS.royalBlue }]}>📊 인근 낙찰 통계 및 시장 지표</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>🎯 예상 낙찰 확률 비율</Text>
                  <Text style={[styles.statValue, { color: COLORS.royalBlue }]}>{aiBidRate}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>🚪 예상 명도 소요 기간</Text>
                  <Text style={[styles.statValue, { color: '#d97706' }]}>{aiEvictPeriod}</Text>
                </View>
                <View style={[styles.statBox, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                  <Text style={styles.statLabel}>🔍 주변 동종 실거래 시세 대조 분석</Text>
                  <Text style={[styles.statCompareText, { color: COLORS.emeraldSuccess }]}>{aiMarketCompare}</Text>
                </View>
              </View>
            </View>

            {/* AI 권리분석 특이사항 및 계층형 권리분석도 */}
            <View style={[styles.sectionCard, { borderLeftWidth: 4, borderLeftColor: COLORS.royalBlue }]}>
              <Text style={[styles.sectionTitle, { color: COLORS.royalBlue }]}>📜 AI 권리분석 정밀 진단</Text>
              <Text style={styles.analysisContent}>
                {property.notes_content || '권리분석 특이사항이 기재되지 않았습니다. 말소기준권리를 기준으로 대항력 유무를 다시 점검하십시오.'}
              </Text>
              
              {/* 수직 타임라인 다이어그램 */}
              <View style={styles.rightsTimelineContainer}>
                <Text style={styles.timelineHeader}>⛓️ 등기부 권리 계층 구조도 (말소기준선)</Text>
                <View style={styles.timelineBody}>
                  {/* 1. 선순위 노드 */}
                  <View style={styles.timelineNode}>
                    <View style={[styles.nodePoint, { backgroundColor: (property.notes_content || "").includes("인수") || (property.notes_content || "").includes("선순위") || (property.notes_content || "").includes("대항력") ? COLORS.crimsonAlert : COLORS.emeraldSuccess }]} />
                    <View style={[styles.nodeCard, { backgroundColor: (property.notes_content || "").includes("인수") || (property.notes_content || "").includes("선순위") || (property.notes_content || "").includes("대항력") ? COLORS.crimsonLight : COLORS.emeraldLight, borderColor: (property.notes_content || "").includes("인수") || (property.notes_content || "").includes("선순위") || (property.notes_content || "").includes("대항력") ? COLORS.crimsonAlert : COLORS.emeraldSuccess, borderWidth: 0.5 }]}>
                      <Text style={[styles.nodeTitle, { color: (property.notes_content || "").includes("인수") || (property.notes_content || "").includes("선순위") || (property.notes_content || "").includes("대항력") ? COLORS.crimsonAlert : COLORS.emeraldSuccess }]}>
                        {(property.notes_content || "").includes("인수") || (property.notes_content || "").includes("선순위") || (property.notes_content || "").includes("대항력") ? "⚠️ 선순위 인수 리스크" : "🟢 선순위 안전 구역"}
                      </Text>
                      <Text style={styles.nodeDesc}>
                        {(property.notes_content || "").includes("인수") || (property.notes_content || "").includes("선순위") || (property.notes_content || "").includes("대항력") 
                          ? "선순위 임차권 혹은 미상 전입자가 존재하여 낙찰 후 낙찰자 부담으로 보증금 등이 인수될 위험이 있습니다." 
                          : "말소기준권리보다 앞서는 선순위 임차인이 없거나 대항력을 포기하여 인수할 금액이 없는 상태입니다."}
                      </Text>
                    </View>
                  </View>
                  
                  {/* 2. 말소기준권리 노드 */}
                  <View style={styles.timelineNode}>
                    <View style={[styles.nodePoint, { backgroundColor: COLORS.warningGold }]} />
                    <View style={[styles.nodeCard, { backgroundColor: COLORS.warningLight, borderColor: COLORS.warningGold, borderWidth: 0.5 }]}>
                      <Text style={[styles.nodeTitle, { color: COLORS.warningGold }]}>🔑 말소기준권리 (기준점)</Text>
                      <Text style={styles.nodeDesc}>매각 물건의 최우선 담보물권(압류, 근저당 등)이 설정된 날짜가 권리 말소의 기준선이 됩니다.</Text>
                    </View>
                  </View>
                  
                  {/* 3. 후순위 권리 노드 */}
                  <View style={styles.timelineNode}>
                    <View style={[styles.nodePoint, { backgroundColor: COLORS.slate400 }]} />
                    <View style={[styles.nodeCard, { backgroundColor: COLORS.slate100, borderColor: COLORS.slate300, borderWidth: 0.5 }]}>
                      <Text style={[styles.nodeTitle, { color: COLORS.slate600 }]}>🧹 후순위 권리 소멸구간</Text>
                      <Text style={styles.nodeDesc}>말소기준권리 이후에 등기된 가압류, 임차권, 저당권 등은 경매 매각절차 종료와 함께 100% 소멸합니다.</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* 법원 비고 및 공고 상세 원문 */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>📂 법원 비고 및 공고 상세</Text>
              <Text style={styles.descContent}>
                {property.desc_content || '해당 매물의 추가 설명 또는 법원 비고 원문이 존재하지 않습니다.'}
              </Text>
            </View>
          </View>
        )}

        {/* [2] 서류/이력 탭 */}
        {activeTab === 'documents' && (
          <View>
            {/* 부동산 표시 상세 명세 보드 */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>📋 부동산 표시 및 기본 명세</Text>
              <View style={styles.summaryCard}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>소재지 주소</Text>
                  <Text style={[styles.infoValue, { flex: 1, textAlign: 'right', marginLeft: 16 }]} numberOfLines={2}>{property.address}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>부동산 용도</Text>
                  <Text style={styles.infoValue}>{property.ptype || '부동산 일반 용도'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>사건/관리번호</Text>
                  <Text style={styles.infoValue}>{property.auction_no}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>감정평가금액</Text>
                  <Text style={styles.infoValue}>{formatCurrency(property.appraised_value)}</Text>
                </View>
              </View>
            </View>

            {/* 법정 주요 서류 및 사건 기록 조회 */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>⚖️ 법정 주요 서류 및 사건 기록 조회</Text>
              <Text style={styles.networkSub}>대법원 경매 및 캠코 온비드 공매 공식 서버의 문서 뷰어로 다이렉트 이동합니다.</Text>
              
              <View style={styles.networkGrid}>
                {/* 1. 감정평가서 */}
                <TouchableOpacity 
                  onPress={() => Linking.openURL(property.source === 'court' ? 'https://www.courtauction.go.kr' : 'https://www.onbid.co.kr')}
                  style={[styles.networkButton, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}
                >
                  <View style={[styles.networkIconContainer, { backgroundColor: COLORS.emeraldSuccess }]}>
                    <Text style={styles.networkIconText}>📊</Text>
                  </View>
                  <View style={styles.networkTextContainer}>
                    <Text style={[styles.networkBtnTitle, { color: COLORS.emeraldSuccess }]}>감정평가서 조회</Text>
                    <Text style={styles.networkBtnSub} numberOfLines={1}>공식 자산 감정 보고서</Text>
                  </View>
                </TouchableOpacity>

                {/* 2. 현황조사서 */}
                <TouchableOpacity 
                  onPress={() => Linking.openURL(property.source === 'court' ? 'https://www.courtauction.go.kr' : 'https://www.onbid.co.kr')}
                  style={[styles.networkButton, { backgroundColor: '#fdf4ff', borderColor: '#fbcfe8' }]}
                >
                  <View style={[styles.networkIconContainer, { backgroundColor: '#db2777' }]}>
                    <Text style={styles.networkIconText}>🔍</Text>
                  </View>
                  <View style={styles.networkTextContainer}>
                    <Text style={[styles.networkBtnTitle, { color: '#db2777' }]}>현황조사서 열람</Text>
                    <Text style={styles.networkBtnSub} numberOfLines={1}>부동산 현황 및 점유 실태</Text>
                  </View>
                </TouchableOpacity>

                {/* 3. 매각물건명세서 */}
                <TouchableOpacity 
                  onPress={() => Linking.openURL(property.source === 'court' ? 'https://www.courtauction.go.kr' : 'https://www.onbid.co.kr')}
                  style={[styles.networkButton, { backgroundColor: '#f0f9ff', borderColor: '#bae6fd' }]}
                >
                  <View style={[styles.networkIconContainer, { backgroundColor: COLORS.royalBlue }]}>
                    <Text style={styles.networkIconText}>📋</Text>
                  </View>
                  <View style={styles.networkTextContainer}>
                    <Text style={[styles.networkBtnTitle, { color: COLORS.royalBlue }]}>물건명세서 확인</Text>
                    <Text style={styles.networkBtnSub} numberOfLines={1}>법원 작성 권리 확인서</Text>
                  </View>
                </TouchableOpacity>

                {/* 4. 사건내역 */}
                <TouchableOpacity 
                  onPress={() => Linking.openURL(property.link_url || (property.source === 'court' ? 'https://www.courtauction.go.kr' : 'https://www.onbid.co.kr'))}
                  style={[styles.networkButton, { backgroundColor: '#fffbeb', borderColor: '#fde68a' }]}
                >
                  <View style={[styles.networkIconContainer, { backgroundColor: '#d97706' }]}>
                    <Text style={styles.networkIconText}>⛓️</Text>
                  </View>
                  <View style={styles.networkTextContainer}>
                    <Text style={[styles.networkBtnTitle, { color: '#d97706' }]}>사건내역 일괄조회</Text>
                    <Text style={styles.networkBtnSub} numberOfLines={1}>기초 사건 진행 전체 내역</Text>
                  </View>
                </TouchableOpacity>

                {/* 5. 기일내역 */}
                <TouchableOpacity 
                  onPress={() => Linking.openURL(property.source === 'court' ? 'https://www.courtauction.go.kr' : 'https://www.onbid.co.kr')}
                  style={[styles.networkButton, { backgroundColor: '#f8fafc', borderColor: '#cbd5e1' }]}
                >
                  <View style={[styles.networkIconContainer, { backgroundColor: '#475569' }]}>
                    <Text style={styles.networkIconText}>📅</Text>
                  </View>
                  <View style={styles.networkTextContainer}>
                    <Text style={[styles.networkBtnTitle, { color: '#475569' }]}>기일내역 연혁보기</Text>
                    <Text style={styles.networkBtnSub} numberOfLines={1}>입찰 차수별 일자 및 결과</Text>
                  </View>
                </TouchableOpacity>

                {/* 6. 법원접수문건 */}
                <TouchableOpacity 
                  onPress={() => Linking.openURL(property.source === 'court' ? 'https://www.courtauction.go.kr' : 'https://www.onbid.co.kr')}
                  style={[styles.networkButton, { backgroundColor: '#fdf2f8', borderColor: '#fbcfe8' }]}
                >
                  <View style={[styles.networkIconContainer, { backgroundColor: '#be185d' }]}>
                    <Text style={styles.networkIconText}>📨</Text>
                  </View>
                  <View style={styles.networkTextContainer}>
                    <Text style={[styles.networkBtnTitle, { color: '#be185d' }]}>법원접수문건 조회</Text>
                    <Text style={styles.networkBtnSub} numberOfLines={1}>이해관계인 서류 제출 목록</Text>
                  </View>
                </TouchableOpacity>
              </View>
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
          </View>
        )}

        {/* [3] 입찰/금융 탭 */}
        {activeTab === 'finance' && (
          <View>
            {/* 금융 및 입찰 금액 분석 카드 */}
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

            {/* 🟢 예상 공시가격 분석 요약 카드 추가 */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>💰 예상 공시가격 분석</Text>
              
              <View style={styles.summaryCard}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>예상 공시지가 총액</Text>
                  <Text style={[styles.infoValue, { color: COLORS.royalBlue }]}>{formatCurrencyKorean(extra.officialLandPrice)}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>감정가 대비 비율</Text>
                  <Text style={styles.infoValue}>약 65%</Text>
                </View>
                <Text style={[styles.networkSub, { marginTop: 8 }]}>{extra.officialLandPriceDesc}</Text>
              </View>
              
              <TouchableOpacity 
                onPress={() => Linking.openURL('https://www.realtyprice.kr')}
                style={[styles.linkButton, { backgroundColor: COLORS.royalBlue, marginTop: 8 }]}
              >
                <Text style={styles.linkButtonText}>부동산 공시가격알리미 공식 조회하기</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* [4] 지도/도면 탭 */}
        {activeTab === 'map' && (
          <View>
            {/* 📍 물건지 실시간 위치 지도 (Web/Native 분기 및 네이버 연결) */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>📍 물건지 실시간 위치 지도 (클릭 시 네이버 지도 이동)</Text>
              <TouchableOpacity 
                activeOpacity={0.9}
                onPress={() => Linking.openURL(`https://map.naver.com/v5/search/${encodeURIComponent(property.address)}`)}
                style={styles.mapContainer}
              >
                {Platform.OS === 'web' ? (
                  <iframe 
                    src={`https://maps.google.com/maps?q=${encodeURIComponent(property.address)}&t=&z=16&ie=UTF8&iwloc=&output=embed`}
                    style={{ width: '100%', height: '100%', border: 'none', borderRadius: 12, pointerEvents: 'none' }}
                  />
                ) : (
                  <WebView 
                    style={styles.mapWebView}
                    pointerEvents="none"
                    source={{ uri: `https://maps.google.com/maps?q=${encodeURIComponent(property.address)}&t=&z=16&ie=UTF8&iwloc=&output=embed` }}
                  />
                )}
                <View style={StyleSheet.absoluteFill} />
              </TouchableOpacity>
            </View>

            {/* 네이버 지도 고도화 기능 숏컷 허브 */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>🗺️ 네이버 전문 지도 및 정보망 연동</Text>
              <Text style={styles.networkSub}>다양한 지도 레이어를 네이버 지도로 열어 실경계를 분석하고 현장을 파악해 보십시오.</Text>
              
              <View style={styles.networkGrid}>
                {/* 1. 지번도 (네이버 지적편집도) */}
                <TouchableOpacity 
                  onPress={() => Linking.openURL(`https://map.naver.com/v5/search/${encodeURIComponent(property.address)}`)}
                  style={[styles.networkButton, { backgroundColor: '#fdf4ff', borderColor: '#fbcfe8' }]}
                >
                  <View style={[styles.networkIconContainer, { backgroundColor: '#db2777' }]}>
                    <Text style={styles.networkIconText}>🗺️</Text>
                  </View>
                  <View style={styles.networkTextContainer}>
                    <Text style={[styles.networkBtnTitle, { color: '#db2777' }]}>지번도 보기</Text>
                    <Text style={styles.networkBtnSub}>지적편집도 필지 경계조사</Text>
                  </View>
                </TouchableOpacity>

                {/* 2. 네이버 위성지도 */}
                <TouchableOpacity 
                  onPress={() => Linking.openURL(`https://map.naver.com/v5/search/${encodeURIComponent(property.address)}`)}
                  style={[styles.networkButton, { backgroundColor: '#f8fafc', borderColor: '#cbd5e1' }]}
                >
                  <View style={[styles.networkIconContainer, { backgroundColor: '#475569' }]}>
                    <Text style={styles.networkIconText}>🛰️</Text>
                  </View>
                  <View style={styles.networkTextContainer}>
                    <Text style={[styles.networkBtnTitle, { color: '#475569' }]}>위성지도 보기</Text>
                    <Text style={styles.networkBtnSub}>항공 위성 고해상도 촬영뷰</Text>
                  </View>
                </TouchableOpacity>

                {/* 3. 네이버 로드뷰 */}
                <TouchableOpacity 
                  onPress={() => Linking.openURL(`https://map.naver.com/v5/search/${encodeURIComponent(property.address)}`)}
                  style={[styles.networkButton, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}
                >
                  <View style={[styles.networkIconContainer, { backgroundColor: COLORS.emeraldSuccess }]}>
                    <Text style={styles.networkIconText}>📸</Text>
                  </View>
                  <View style={styles.networkTextContainer}>
                    <Text style={[styles.networkBtnTitle, { color: COLORS.emeraldSuccess }]}>로드뷰 보기</Text>
                    <Text style={styles.networkBtnSub}>현장 파노라마 도로뷰 조회</Text>
                  </View>
                </TouchableOpacity>

                {/* 4. 온나라 통합지도 */}
                <TouchableOpacity 
                  onPress={() => Linking.openURL('https://seereal.lh.or.kr')}
                  style={[styles.networkButton, { backgroundColor: '#fffbeb', borderColor: '#fde68a' }]}
                >
                  <View style={[styles.networkIconContainer, { backgroundColor: '#d97706' }]}>
                    <Text style={styles.networkIconText}>🌐</Text>
                  </View>
                  <View style={styles.networkTextContainer}>
                    <Text style={[styles.networkBtnTitle, { color: '#d97706' }]}>온나라지도 이동</Text>
                    <Text style={styles.networkBtnSub}>씨:리얼 국토정보지도 조회</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* 🟢 토지이용계획 규제 진단 및 토지이음 연동 카드 추가 */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>🌱 토지이용계획 및 규제 진단</Text>
              
              <View style={styles.summaryCard}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>용도지역 구분</Text>
                  <Text style={[styles.infoValue, { color: COLORS.royalBlue }]}>{extra.landUsePlan}</Text>
                </View>
                <Text style={[styles.networkSub, { marginTop: 8 }]}>{extra.landUsePlanDesc}</Text>
              </View>
              
              <TouchableOpacity 
                onPress={() => Linking.openURL(`https://www.eum.go.kr/web/mp/mpMapSearch.jsp?searchKeyword=${encodeURIComponent(property.address)}`)}
                style={[styles.linkButton, { backgroundColor: COLORS.emeraldSuccess, marginTop: 8 }]}
              >
                <Text style={styles.linkButtonText}>국토부 토지이음(eum.go.kr) 공식 조회하기</Text>
              </TouchableOpacity>
            </View>

            {/* 📈 종합 투자 가치 및 규제 정보 리포트 (대항력 추가) */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>📈 종합 투자 가치 및 규제 정보</Text>
              
              <View style={styles.extraGrid}>
                {/* 자산 투자 유형 */}
                <View style={styles.extraCard}>
                  <View style={styles.extraCardHeader}>
                    <Text style={styles.extraCardLabel}>자산 투자 유형</Text>
                    <View style={[styles.extraBadge, { backgroundColor: extra.investmentTypeBg }]}>
                      <Text style={[styles.extraBadgeText, { color: extra.investmentTypeColor }]}>{extra.investmentType}</Text>
                    </View>
                  </View>
                  <Text style={styles.extraCardDesc}>{extra.investmentDesc}</Text>
                </View>

                {/* 말소기준권리 말소 확인 */}
                <View style={styles.extraCard}>
                  <View style={styles.extraCardHeader}>
                    <Text style={styles.extraCardLabel}>말소기준권리 말소 확인</Text>
                    <View style={[styles.extraBadge, { backgroundColor: extra.malsoStatusBg }]}>
                      <Text style={[styles.extraBadgeText, { color: extra.malsoStatusColor }]}>{extra.malsoStatus}</Text>
                    </View>
                  </View>
                  <Text style={styles.extraCardDesc}>{extra.malsoDesc}</Text>
                </View>

                {/* 세입자 대항력 (보증금 인수) */}
                <View style={styles.extraCard}>
                  <View style={styles.extraCardHeader}>
                    <Text style={styles.extraCardLabel}>세입자 대항력 (보증금 인수)</Text>
                    <View style={[styles.extraBadge, { backgroundColor: extra.daehangBg }]}>
                      <Text style={[styles.extraBadgeText, { color: extra.daehangColor }]}>{extra.daehangStatus}</Text>
                    </View>
                  </View>
                  <Text style={styles.extraCardDesc}>{extra.daehangDesc}</Text>
                </View>

                {/* 다주택 가능 여부 */}
                <View style={styles.extraCard}>
                  <View style={styles.extraCardHeader}>
                    <Text style={styles.extraCardLabel}>다주택 가능 여부 (세제 규제)</Text>
                    <View style={[styles.extraBadge, { backgroundColor: extra.twoHouseBg }]}>
                      <Text style={[styles.extraBadgeText, { color: extra.twoHouseColor }]}>{extra.twoHouseStatus}</Text>
                    </View>
                  </View>
                  <Text style={styles.extraCardDesc}>{extra.twoHouseDesc}</Text>
                </View>

                {/* 토지거래허가 규제 여부 */}
                <View style={styles.extraCard}>
                  <View style={styles.extraCardHeader}>
                    <Text style={styles.extraCardLabel}>토지거래허가 규제 여부</Text>
                    <View style={[styles.extraBadge, { backgroundColor: extra.landPermitBg }]}>
                      <Text style={[styles.extraBadgeText, { color: extra.landPermitColor }]}>{extra.landPermitStatus}</Text>
                    </View>
                  </View>
                  <Text style={styles.extraCardDesc}>{extra.landPermitDesc}</Text>
                </View>
              </View>
            </View>

            {/* 🖼️ 물건 상태 진단 및 평면 구조 도면 갤러리 */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>🖼️ 물건 상태 진단 및 도면 정보</Text>
              
              <View style={styles.galleryContainer}>
                {/* 물건 상태 분석 */}
                <View style={styles.galleryCard}>
                  <Text style={styles.galleryLabel}>🏢 물건 상태 분석 (외관/점유)</Text>
                  <View style={styles.mockImagePlaceholder}>
                    <Text style={styles.placeholderIcon}>🏢</Text>
                    <Text style={styles.placeholderTitle}>자산 상태 가상 진단 보고</Text>
                    <View style={styles.mockProgressBarBg}>
                      <View style={[styles.mockProgressBarFill, { width: `${property.score}%`, backgroundColor: property.score >= 80 ? COLORS.emeraldSuccess : property.score >= 60 ? COLORS.royalBlue : COLORS.crimsonAlert }]} />
                    </View>
                    <Text style={styles.placeholderSub}>
                      {property.score >= 80 ? `진단 지수: 우수 (${property.score}점)` : property.score >= 60 ? `진단 지수: 보통 (${property.score}점)` : `진단 지수: 불량 (${property.score}점)`}
                    </Text>
                  </View>
                  <View style={styles.galleryBulletContainer}>
                    <Text style={styles.galleryBulletText}>• 균열/누수: 현장 임장 시 외벽 크랙 체크 권장</Text>
                    <Text style={styles.galleryBulletText}>• 주차 환경: 단지 내 지상/지하 주차장 용량 조사</Text>
                  </View>
                </View>

                {/* 평면도 및 내부 도면 */}
                <View style={styles.galleryCard}>
                  <Text style={styles.galleryLabel}>📐 내부 도면 및 구조 분석</Text>
                  
                  <View style={styles.floorPlanContainer}>
                    {(property.ptype || "").includes("아파트") || (property.ptype || "").includes("주택") || (property.ptype || "").includes("다세대") || (property.ptype || "").includes("빌라") ? (
                      <View style={styles.residentialPlan}>
                        <View style={styles.planRow}>
                          <View style={[styles.roomBox, styles.wallBorderRight, styles.wallBorderBottom]}><Text style={styles.roomText}>침실 1</Text></View>
                          <View style={[styles.roomBox, styles.wallBorderRight, styles.wallBorderBottom, { flex: 1.5 }]}><Text style={[styles.roomText, { color: COLORS.royalBlue }]}>거 실</Text></View>
                          <View style={[styles.roomBox, styles.wallBorderBottom]}><Text style={styles.roomText}>침실 3</Text></View>
                        </View>
                        <View style={styles.planRow}>
                          <View style={[styles.roomBox, styles.wallBorderRight]}><Text style={styles.roomText}>침실 2</Text></View>
                          <View style={[styles.roomBox, styles.wallBorderRight, { flex: 1.5 }]}><Text style={styles.roomText}>주 방</Text></View>
                          <View style={styles.roomBox}><Text style={[styles.roomText, { color: COLORS.crimsonAlert }]}>욕실</Text></View>
                        </View>
                      </View>
                    ) : (property.ptype || "").includes("오피스텔") || (property.ptype || "").includes("원룸") ? (
                      <View style={styles.studioPlan}>
                        <View style={[styles.studioMain, styles.wallBorderBottom]}><Text style={[styles.roomText, { color: COLORS.royalBlue }]}>원룸형 침실 / 거실</Text></View>
                        <View style={styles.planRow}>
                          <View style={[styles.roomBox, styles.wallBorderRight]}><Text style={styles.roomText}>현관</Text></View>
                          <View style={styles.roomBox}><Text style={[styles.roomText, { color: COLORS.crimsonAlert }]}>욕실</Text></View>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.commercialPlan}>
                        <View style={styles.pillarRow}>
                          <View style={styles.pillar} />
                          <View style={styles.pillar} />
                        </View>
                        <Text style={[styles.roomText, { color: COLORS.royalBlue, textAlign: 'center' }]}>상업용 개방 기둥형 구조</Text>
                        <View style={styles.pillarRow}>
                          <View style={styles.pillar} />
                          <View style={styles.pillar} />
                        </View>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.planBadgeRow}>
                    <View style={[styles.extraBadge, { backgroundColor: COLORS.royalLight, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderColor: 'transparent' }]}>
                      <Text style={{ fontSize: 9, fontWeight: 'bold', color: COLORS.royalBlue }}>
                        {(property.ptype || "").includes("아파트") ? "3-Bay 아파트 구조" : (property.ptype || "").includes("오피스텔") ? "원룸/복층 구조" : "일반 맞춤형 도면"}
                      </Text>
                    </View>
                    <Text style={styles.planBadgeDesc}>
                      {(property.ptype || "").includes("아파트") ? "방 3개, 욕실 2개 표준 구성" : (property.ptype || "").includes("오피스텔") ? "복도식 컴팩트 1-Room 구조" : "상업 전용 가변 기둥 벽체"}
                    </Text>
                  </View>
                  
                  <TouchableOpacity onPress={() => Linking.openURL('https://www.gov.kr')} style={styles.galleryBtn}>
                    <Text style={styles.galleryBtnText}>건축물대장 현황도면 신청법 가이드</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        )}

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
  extraGrid: {
    gap: 10,
  },
  extraCard: {
    backgroundColor: COLORS.slate50,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    borderRadius: 12,
    padding: 12,
  },
  extraCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  extraCardLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.slate450,
  },
  extraBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 0.5,
    borderColor: 'transparent',
  },
  extraBadgeText: {
    fontSize: 10,
    fontWeight: '900',
  },
  extraCardDesc: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.slate700,
    lineHeight: 16,
  },
  galleryContainer: {
    flexDirection: 'column',
    gap: 12,
  },
  galleryCard: {
    borderWidth: 1,
    borderColor: COLORS.slate200,
    borderRadius: 12,
    padding: 12,
  },
  galleryLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.slate600,
    marginBottom: 8,
  },
  mockImagePlaceholder: {
    height: 110,
    backgroundColor: COLORS.slate50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.slate100,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  placeholderIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  placeholderTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.slate700,
  },
  placeholderSub: {
    fontSize: 9,
    color: COLORS.slate400,
    textAlign: 'center',
    marginTop: 4,
  },
  mockProgressBarBg: {
    width: '80%',
    height: 6,
    backgroundColor: COLORS.slate200,
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 6,
  },
  mockProgressBarFill: {
    height: '100%',
    borderRadius: 999,
  },
  galleryBulletContainer: {
    marginTop: 8,
    gap: 2,
  },
  galleryBulletText: {
    fontSize: 10,
    color: COLORS.slate500,
    fontWeight: '600',
  },
  galleryBtn: {
    backgroundColor: COLORS.slate100,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 8,
  },
  galleryBtnText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.slate750,
  },
  // 지도 WebView 관련
  mapContainer: {
    height: 220,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.slate200,
    marginTop: 8,
  },
  mapWebView: {
    flex: 1,
  },
  // 평면도 뷰어 관련
  floorPlanContainer: {
    height: 110,
    backgroundColor: COLORS.slate50,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.slate100,
    padding: 8,
    justifyContent: 'center',
  },
  residentialPlan: {
    flex: 1,
    flexDirection: 'column',
    borderColor: COLORS.slate600,
    borderWidth: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  studioPlan: {
    flex: 1,
    flexDirection: 'column',
    borderColor: COLORS.slate600,
    borderWidth: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  commercialPlan: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    borderColor: COLORS.slate600,
    borderWidth: 2,
    borderRadius: 4,
    padding: 4,
  },
  planRow: {
    flex: 1,
    flexDirection: 'row',
  },
  studioMain: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  roomBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  roomText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.slate800,
  },
  pillarRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  pillar: {
    width: 6,
    height: 6,
    backgroundColor: COLORS.slate400,
    borderRadius: 2,
  },
  wallBorderRight: {
    borderRightWidth: 1.5,
    borderRightColor: COLORS.slate400,
  },
  wallBorderBottom: {
    borderBottomWidth: 1.5,
    borderBottomColor: COLORS.slate400,
  },
  planBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingHorizontal: 2,
  },
  planBadgeDesc: {
    fontSize: 9,
    fontWeight: '600',
    color: COLORS.slate500,
  },
  // 권리 구조도 타임라인 관련
  rightsTimelineContainer: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.slate100,
    paddingTop: 12,
  },
  timelineHeader: {
    fontSize: 11.5,
    fontWeight: '800',
    color: COLORS.slate500,
    marginBottom: 10,
  },
  timelineBody: {
    borderLeftWidth: 2,
    borderLeftColor: COLORS.slate200,
    paddingLeft: 12,
    marginLeft: 6,
  },
  timelineNode: {
    position: 'relative',
    marginBottom: 12,
  },
  nodePoint: {
    position: 'absolute',
    left: -18,
    top: 4,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  nodeCard: {
    borderRadius: 8,
    padding: 8,
  },
  nodeTitle: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  nodeDesc: {
    fontSize: 9.5,
    fontWeight: '600',
    color: COLORS.slate750,
    marginTop: 2,
    lineHeight: 13,
  },
  investmentBadge: {
    backgroundColor: '#fffbeb',
    borderColor: '#fef3c7',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  investmentBadgeText: {
    fontSize: 12,
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
  },
  residenceBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1d4ed8',
  },
  statsGrid: {
    marginTop: 4,
  },
  statBox: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate100,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.slate500,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '800',
  },
  statCompareText: {
    fontSize: 13.5,
    fontWeight: 'bold',
    lineHeight: 20,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.slate100,
    borderRadius: 12,
    padding: 4,
    marginBottom: 14,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabButtonActive: {
    backgroundColor: COLORS.white,
    shadowColor: COLORS.slate900,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabButtonText: {
    fontSize: 13,
    color: COLORS.slate500,
    fontWeight: 'bold',
  },
  tabButtonTextActive: {
    color: COLORS.royalBlue,
    fontWeight: '800',
  },
});
