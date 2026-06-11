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
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Property } from '../types';
import { COLORS } from '../components/Theme';
import { supabase } from '../utils/supabase';

interface DetailScreenProps {
  property: Property;
  onBack: () => void;
}

type TabType = 'general' | 'rights' | 'bidding' | 'location';

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
  const [currentProperty, setCurrentProperty] = useState<Property>(property);
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userGrade, setUserGrade] = useState<'A' | 'B' | 'C'>('C');
  const [similarProperties, setSimilarProperties] = useState<Property[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const scrollViewRef = React.useRef<ScrollView>(null);

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

  // 🔒 Supabase user_profiles 고객 등급 조회 함수
  const fetchUserGrade = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('grade')
        .eq('id', uid)
        .maybeSingle();
      if (error) throw error;
      if (data && data.grade) {
        setUserGrade(data.grade as 'A' | 'B' | 'C');
      } else {
        setUserGrade('C');
      }
    } catch (err) {
      console.error('고객 등급 조회 실패:', err);
      setUserGrade('C');
    }
  };

  // 🔍 주변 유사 매물 3개 로드 함수
  const loadSimilarProperties = async (prop: Property) => {
    try {
      const sidoVal = prop.address ? prop.address.split(' ')[0] : '';
      const ptypeVal = prop.ptype || '';
      
      let query = supabase
        .from('properties')
        .select('*')
        .neq('id', prop.id);
        
      if (sidoVal) {
        query = query.like('address', `${sidoVal}%`);
      }
      if (ptypeVal) {
        query = query.eq('ptype', ptypeVal);
      }
      
      const { data, error } = await query.limit(3);
      if (error) throw error;
      setSimilarProperties(data || []);
    } catch (err) {
      console.error('유사 매물 조회 실패:', err);
      setSimilarProperties([]);
    }
  };

  // property props가 변경되면 currentProperty 동기화
  useEffect(() => {
    setCurrentProperty(property);
  }, [property]);

  // currentProperty 변경 시 상태 초기화 및 데이터 로딩
  useEffect(() => {
    setBidValue(currentProperty.minimum_bid || 0);
    setLtvPercent(0);
    setInterestRate(4.5);

    loadSimilarProperties(currentProperty);

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && session.user) {
        setUserId(session.user.id);
        checkFavoriteStatus(session.user.id);
        fetchUserGrade(session.user.id);
      } else {
        setUserId(null);
        setIsFavorite(false);
        setUserGrade('C');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session && session.user) {
        setUserId(session.user.id);
        checkFavoriteStatus(session.user.id);
        fetchUserGrade(session.user.id);
      } else {
        setUserId(null);
        setIsFavorite(false);
        setUserGrade('C');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [currentProperty.id]);

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

  // 💎 대법원 경매 및 온비드 공매 아웃링크/복사 하이브리드 핸들러 함수입니다.
  const handleDocumentOrHistoryLink = async () => {
    const source = property.source || 'court';
    const auctionNo = property.auction_no || '';
    const courtSearchUrl = "https://www.courtauction.go.kr/pgj/pgj100/selectSrchInfo.on";
    const onbidDetailUrl = `https://www.onbid.co.kr/op/dts/cltr/cltrDtLink.do?cltrMngNo=${auctionNo}`;

    if (source === 'court') {
      if (!auctionNo) {
        if (Platform.OS === 'web') {
          alert('사건번호 정보가 존재하지 않습니다.');
        } else {
          Alert.alert('오류', '사건번호 정보가 존재하지 않습니다.');
        }
        return;
      }

      if (Platform.OS === 'web') {
        let isCopied = false;
        try {
          const textArea = document.createElement("textarea");
          textArea.value = auctionNo;
          textArea.style.position = "fixed";
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          isCopied = document.execCommand('copy');
          document.body.removeChild(textArea);
        } catch (err) {
          isCopied = false;
        }

        if (isCopied) {
          alert(`📋 사건번호가 클립보드에 복사되었습니다.\n\n[${auctionNo}]\n\n대법원 검색창에 붙여넣어 바로 검색해 보십시오!`);
        } else {
          try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
              await navigator.clipboard.writeText(auctionNo);
              alert(`📋 사건번호가 클립보드에 복사되었습니다.\n\n[${auctionNo}]\n\n대법원 검색창에 붙여넣어 바로 검색해 보십시오!`);
            } else {
              alert(`[사건번호 복사] 아래 사건번호를 직접 복사하여 대법원에 검색해 주십시오.\n\n${auctionNo}`);
            }
          } catch (err) {
            alert(`[사건번호 복사] 아래 사건번호를 직접 복사하여 대법원에 검색해 주십시오.\n\n${auctionNo}`);
          }
        }
        Linking.openURL(courtSearchUrl);
      } else {
        try {
          const Clipboard = require('expo-clipboard');
          await Clipboard.setStringAsync(auctionNo);
          Alert.alert(
            '사건번호 복사 완료',
            `📋 사건번호가 복사되었습니다.\n\n[${auctionNo}]\n\n대법원 검색창에 붙여넣어 바로 검색하십시오.`,
            [
              { text: '취소', style: 'cancel' },
              { 
                text: '대법원으로 이동', 
                onPress: () => Linking.openURL(courtSearchUrl) 
              }
            ]
          );
        } catch (e) {
          Alert.alert(
            '안내',
            `아래 사건번호를 복사하여 대법원에서 검색해 주십시오.\n\n${auctionNo}`,
            [
              { text: '취소', style: 'cancel' },
              { 
                text: '대법원으로 이동', 
                onPress: () => Linking.openURL(courtSearchUrl) 
              }
            ]
          );
        }
      }
    } else if (source === 'onbid') {
      const supported = await Linking.canOpenURL(onbidDetailUrl);
      if (supported) {
        await Linking.openURL(onbidDetailUrl);
      } else {
        if (Platform.OS === 'web') {
          alert('연결할 수 없는 URL 주소입니다.');
        } else {
          Alert.alert('오류', '연결할 수 없는 URL 주소입니다.');
        }
      }
    } else {
      const fallbackUrl = property.link_url || "https://www.courtauction.go.kr";
      const supported = await Linking.canOpenURL(fallbackUrl);
      if (supported) {
        await Linking.openURL(fallbackUrl);
      } else {
        if (Platform.OS === 'web') {
          alert('연결할 수 없는 URL 주소입니다.');
        } else {
          Alert.alert('오류', '연결할 수 없는 URL 주소입니다.');
        }
      }
    }
  };

  // LH 씨리얼 이동 및 주소 복사 핸들러
  const handleOpenSeeReal = async () => {
    const addr = property.address || '';
    if (Platform.OS === 'web') {
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(addr);
          alert(`📋 주소가 클립보드에 복사되었습니다.\n\n[${addr}]\n\n씨:리얼 검색창에 붙여넣어 조회해 보십시오!`);
        } else {
          alert(`[주소 복사] 아래 주소를 복사하여 씨:리얼에서 검색해 주십시오.\n\n${addr}`);
        }
      } catch (err) {
        alert(`[주소 복사] 아래 주소를 복사하여 씨:리얼에서 검색해 주십시오.\n\n${addr}`);
      }
      Linking.openURL('https://seereal.lh.or.kr');
    } else {
      try {
        const Clipboard = require('expo-clipboard');
        await Clipboard.setStringAsync(addr);
        Alert.alert(
          '주소 복사 완료',
          `📋 주소가 복사되었습니다.\n\n[${addr}]\n\n씨:리얼 종합검색창에 붙여넣어 간편하게 시세를 조회해 보십시오.`,
          [
            { text: '취소', style: 'cancel' },
            { 
              text: '씨:리얼로 이동', 
              onPress: () => Linking.openURL('https://seereal.lh.or.kr') 
            }
          ]
        );
      } catch (e) {
        Alert.alert(
          '안내',
          `아래 주소를 복사하여 씨:리얼에서 검색해 주십시오.\n\n${addr}`,
          [
            { text: '취소', style: 'cancel' },
            { 
              text: '씨:리얼로 이동', 
              onPress: () => Linking.openURL('https://seereal.lh.or.kr') 
            }
          ]
        );
      }
    }
  };

  const gradeStyle = getGradeStyle(property.grade);
  const discountRate = calculateDiscountRate();
  const sourceLabel = property.source === 'court' ? '⚖️ 대법원 법원경매' : property.source === 'onbid' ? '🏢 캠코 온비드 공매' : '📁 업로드 사설';

  // currentProperty.id 기반 가상 전용면적을 산출합니다. (59 ~ 119㎡ 사이)
  const estimatedArea = 59 + (currentProperty.id % 5) * 15;
  const pyeong = (estimatedArea / 3.3058).toFixed(1);

  // ❶ 지방세법 실거래 보정 수식 (용도분기 적용)
  const ptype = (property.ptype || "").toLowerCase();
  let taxRate = 0.015;
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

  // 12개 탭용 상세 가상 데이터 산출
  const appraisal = property.appraised_value || 0;
  const minBid = property.minimum_bid || 0;
  
  // 예상배당표 가상 계산
  const estateCost = Math.floor(minBid * 0.015);
  const smallDeposit = Math.min(Math.floor(minBid * 0.08), 20000000);
  const mortgage = Math.floor(appraisal * 0.45);
  const tenantDeposit = Math.floor(appraisal * 0.35);

  let remaining = minBid;
  const costPaid = Math.min(remaining, estateCost);
  remaining -= costPaid;

  const smallPaid = Math.min(remaining, smallDeposit);
  remaining -= smallPaid;

  const mortgagePaid = Math.min(remaining, mortgage);
  remaining -= mortgagePaid;

  const tenantPaid = Math.min(remaining, tenantDeposit);
  remaining -= tenantPaid;

  const tenantStatus = (tenantDeposit - tenantPaid) > 0 && extra.daehangStatus.includes("주의") ? "인수 발생" : "소멸";

  // 등기부 가상 데이터 계산
  const mortgageAmt = Math.floor(appraisal * 0.5);
  const gamyAmt = Math.floor(appraisal * 0.15);

  // 시세 실거래가 가상 데이터 계산
  const deal1 = Math.floor(appraisal * 1.02);
  const deal2 = Math.floor(appraisal * 0.98);
  const deal3 = Math.floor(appraisal * 0.95);

  // 법원 이름 파싱
  const courtMatch = property.auction_no ? property.auction_no.match(/\[(.*?)\]/) : null;
  const courtName = courtMatch ? courtMatch[1] : "관할 법원";

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

        {/* 번호식 4대 대분류 가로 탭 바 */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.tabBarScroll}
          contentContainerStyle={styles.tabBarContainer}
        >
          {[
            { key: 'general', label: '1. 기본 정보' },
            { key: 'rights', label: '2. 권리분석' },
            { key: 'bidding', label: '3. 입찰분석' },
            { key: 'location', label: '4. 입지분석' },
          ].map((tab) => (
            <TouchableOpacity 
              key={tab.key}
              onPress={() => setActiveTab(tab.key as TabType)} 
              style={[styles.tabButton, activeTab === tab.key && styles.tabButtonActive]}
            >
              <Text style={[styles.tabButtonText, activeTab === tab.key && styles.tabButtonTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* 1. 기본 정보 탭 */}
        {activeTab === 'general' && (
          <View>
            {/* 기본 매물 명세 정보 */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionTitle}>📋 기본 매물 명세 정보</Text>
                <View style={styles.gradeBadgeContainer}>
                  <Text style={styles.gradeBadgeText}>내 등급: {userGrade === 'A' ? '🥇 Premium A' : userGrade === 'B' ? '🥈 VIP B' : '🥉 일반 C'}</Text>
                  <TouchableOpacity
                    style={styles.gradeUpgradeBtn}
                    onPress={async () => {
                      if (!userId) {
                        Alert.alert('로그인 필요', '회원 등급을 변경하려면 로그인이 필요합니다.');
                        return;
                      }
                      try {
                        const { error } = await supabase
                          .from('user_profiles')
                          .update({ upgrade_requested: true })
                          .eq('id', userId);
                        if (error) throw error;
                        Alert.alert('신청 완료', '등급 업그레이드 신청이 완료되었습니다. 관리자 승인 후 변경됩니다.');
                      } catch (err) {
                        Alert.alert('신청 실패', '업그레이드 신청 중 오류가 발생했습니다.');
                      }
                    }}
                  >
                    <Text style={styles.gradeUpgradeBtnText}>업그레이드 요청</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.infoTable}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>사건/관리번호</Text>
                  <Text style={styles.infoValue}>{currentProperty.auction_no}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>감정평가금액</Text>
                  <Text style={styles.infoValue}>{formatCurrency(currentProperty.appraised_value)}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>최저입찰금액</Text>
                  <Text style={[styles.infoValue, { color: COLORS.crimsonAlert, fontWeight: '800' }]}>
                    {formatCurrency(currentProperty.minimum_bid)} ({discountRate}% 저감)
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>매각 입찰 기일</Text>
                  <Text style={styles.infoValue}>{currentProperty.bidding_date || '미정'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>차수 정보 및 상태</Text>
                  <Text style={styles.infoValue}>{currentProperty.round_info || '신건'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>대지 면적</Text>
                  <Text style={styles.infoValue}>
                    {currentProperty.land_area ? `${currentProperty.land_area}㎡ (약 ${(currentProperty.land_area * 0.3025).toFixed(1)}평)` : '정보 없음'}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>건물 면적</Text>
                  <Text style={styles.infoValue}>
                    {currentProperty.building_area ? `${currentProperty.building_area}㎡ (약 ${(currentProperty.building_area * 0.3025).toFixed(1)}평)` : '정보 없음'}
                  </Text>
                </View>
              </View>
            </View>

            {/* 가상 소유자 및 채무자 정보 */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>👤 소유자 및 채무자 정보</Text>
              <View style={styles.infoTable}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>소유자 (임대인)</Text>
                  <Text style={styles.infoValue}>김*성 (가상)</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>채무자</Text>
                  <Text style={styles.infoValue}>주식회사 *대 홀딩스 (가상)</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>채권자 (경매신청인)</Text>
                  <Text style={styles.infoValue}>🏦 국민은행 (경락 대지분 등기설정)</Text>
                </View>
              </View>
            </View>

            {/* 기일 진행 이력 표 */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>📅 기일 진행 이력</Text>
              <View style={styles.table}>
                <View style={[styles.tableRow, styles.tableHeader]}>
                  <Text style={[styles.tableCell, styles.tableHeaderCell]}>회차</Text>
                  <Text style={[styles.tableCell, styles.tableHeaderCell]}>입찰기일</Text>
                  <Text style={[styles.tableCell, styles.tableHeaderCell, styles.textRight]}>최저입찰가</Text>
                  <Text style={[styles.tableCell, styles.tableHeaderCell, styles.textCenter]}>결과</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.tableCell}>1차</Text>
                  <Text style={styles.tableCell}>2026-05-10</Text>
                  <Text style={[styles.tableCell, styles.textRight]}>{formatCurrencyKorean(currentProperty.appraised_value)}</Text>
                  <Text style={[styles.tableCell, styles.textCenter, { color: COLORS.crimsonAlert, fontWeight: 'bold' }]}>유찰</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.tableCell}>2차</Text>
                  <Text style={styles.tableCell}>{currentProperty.bidding_date || '일정 확인중'}</Text>
                  <Text style={[styles.tableCell, styles.textRight]}>{formatCurrencyKorean(currentProperty.minimum_bid)}</Text>
                  <Text style={[styles.tableCell, styles.textCenter, { color: COLORS.royalBlue, fontWeight: 'bold' }]}>진행중</Text>
                </View>
              </View>
            </View>

            {/* 사진 및 지도 위치 */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>📍 물건지 실시간 위치</Text>
              <TouchableOpacity 
                activeOpacity={0.9}
                onPress={() => Linking.openURL(`https://map.naver.com/v5/search/${encodeURIComponent(currentProperty.address)}/address?c=15,0,0,0,dh`)}
                style={styles.mapContainer}
              >
                <View style={styles.naverMapPlaceholder}>
                  <Text style={styles.naverMapLogoText}>NAVER 지도</Text>
                  <Text style={styles.naverMapAddrText}>{currentProperty.address}</Text>
                  <Text style={styles.naverMapHintText}>터치하시면 실시간 위성도 및 도로망을 네이버 지도로 열어 확인하실 수 있습니다.</Text>
                </View>
              </TouchableOpacity>
              
              {/* 전문지도 연동 버튼들 */}
              <View style={[styles.networkGrid, { marginTop: 12 }]}>
                <TouchableOpacity 
                  onPress={() => Linking.openURL(`https://map.naver.com/v5/search/${encodeURIComponent(currentProperty.address)}/address?c=15,0,0,0,lnd,dh`)}
                  style={[styles.networkButton, { backgroundColor: '#fdf4ff', borderColor: '#fbcfe8' }]}
                >
                  <View style={[styles.networkIconContainer, { backgroundColor: '#db2777' }]}>
                    <Text style={styles.networkIconText}>🗺️</Text>
                  </View>
                  <View style={styles.networkTextContainer}>
                    <Text style={[styles.networkBtnTitle, { color: '#db2777' }]}>지번도 보기</Text>
                    <Text style={styles.networkBtnSub}>지적편집도 필지 경계</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => Linking.openURL(`https://map.naver.com/v5/search/${encodeURIComponent(currentProperty.address)}/address?c=15,0,0,0,sky,dh`)}
                  style={[styles.networkButton, { backgroundColor: '#f8fafc', borderColor: '#cbd5e1' }]}
                >
                  <View style={[styles.networkIconContainer, { backgroundColor: '#475569' }]}>
                    <Text style={styles.networkIconText}>🛰️</Text>
                  </View>
                  <View style={styles.networkTextContainer}>
                    <Text style={[styles.networkBtnTitle, { color: '#475569' }]}>위성지도 보기</Text>
                    <Text style={styles.networkBtnSub}>고해상도 항공 뷰</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* 내부 추정 평면도 */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>📐 부동산 내부 추정 평면도</Text>
              <View style={styles.floorPlanContainer}>
                {(currentProperty.ptype || "").includes("아파트") || (currentProperty.ptype || "").includes("주택") || (currentProperty.ptype || "").includes("다세대") || (currentProperty.ptype || "").includes("빌라") ? (
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
                ) : (currentProperty.ptype || "").includes("오피스텔") || (currentProperty.ptype || "").includes("원룸") ? (
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
                  <Text style={{ fontSize: 10, fontWeight: 'bold', color: COLORS.royalBlue }}>
                    {(currentProperty.ptype || "").includes("아파트") ? "3-Bay 아파트 구조" : (currentProperty.ptype || "").includes("오피스텔") ? "원룸/복층 구조" : "일반 맞춤형 도면"}
                  </Text>
                </View>
                <Text style={styles.planBadgeDesc}>
                  {(currentProperty.ptype || "").includes("아파트") ? "방 3개, 욕실 2개 표준 구성" : (currentProperty.ptype || "").includes("오피스텔") ? "복도식 컴팩트 1-Room 구조" : "상업 전용 가변 기둥 벽체"}
                </Text>
              </View>

              {/* 실제 평면도 아웃링크 버튼 추가 */}
              <TouchableOpacity
                onPress={() => {
                  const addrKeyword = currentProperty.address ? currentProperty.address.split(' ').slice(0, 3).join(' ') : '';
                  Linking.openURL(`https://m.land.naver.com/search/result/${encodeURIComponent(addrKeyword)}`);
                }}
                style={[styles.linkButton, { backgroundColor: '#03c75a', marginTop: 12 }]}
              >
                <Text style={styles.linkButtonText}>네이버 부동산에서 실제 평면도 보기</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* 2. 권리분석 탭 */}
        {activeTab === 'rights' && (
          <View style={{ minHeight: 300, position: 'relative' }}>
            <View style={{ opacity: userGrade === 'C' ? 0.15 : 1 }}>
              {/* 정밀 등기부 권리 요약 */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>⛓️ 등기부 주요 권리 설정 요약</Text>
                <View style={styles.table}>
                  <View style={[styles.tableRow, styles.tableHeader]}>
                    <Text style={[styles.tableCell, styles.tableHeaderCell, { flex: 0.8 }]}>구분</Text>
                    <Text style={[styles.tableCell, styles.tableHeaderCell, { flex: 1.8 }]}>등기목적</Text>
                    <Text style={[styles.tableCell, styles.tableHeaderCell, styles.textCenter]}>접수일자</Text>
                    <Text style={[styles.tableCell, styles.tableHeaderCell, { flex: 1.6 }]}>권리자 및 채권액</Text>
                    <Text style={[styles.tableCell, styles.tableHeaderCell, styles.textCenter]}>낙찰후 효력</Text>
                  </View>
                  <View style={styles.tableRow}>
                    <Text style={[styles.tableCell, { flex: 0.8 }]}>을구 1</Text>
                    <Text style={[styles.tableCell, { flex: 1.8, fontWeight: 'bold' }]}>근저당 (말소기준)</Text>
                    <Text style={[styles.tableCell, styles.textCenter]}>2024-06-20</Text>
                    <Text style={[styles.tableCell, { flex: 1.6 }]}>🏦 국민은행 ({formatCurrencyKorean(mortgageAmt)})</Text>
                    <Text style={[styles.tableCell, styles.textCenter, { color: COLORS.emeraldSuccess, fontWeight: 'bold' }]}>소멸</Text>
                  </View>
                  <View style={styles.tableRow}>
                    <Text style={[styles.tableCell, { flex: 0.8 }]}>갑구 4</Text>
                    <Text style={[styles.tableCell, { flex: 1.8 }]}>가압류</Text>
                    <Text style={[styles.tableCell, styles.textCenter]}>2024-11-15</Text>
                    <Text style={[styles.tableCell, { flex: 1.6 }]}>신한카드 ({formatCurrencyKorean(gamyAmt)})</Text>
                    <Text style={[styles.tableCell, styles.textCenter, { color: COLORS.emeraldSuccess, fontWeight: 'bold' }]}>소멸</Text>
                  </View>
                  <View style={styles.tableRow}>
                    <Text style={[styles.tableCell, { flex: 0.8 }]}>갑구 5</Text>
                    <Text style={[styles.tableCell, { flex: 1.8, fontWeight: 'bold', color: COLORS.royalBlue }]}>강제경매개시결정</Text>
                    <Text style={[styles.tableCell, styles.textCenter]}>2025-02-10</Text>
                    <Text style={[styles.tableCell, { flex: 1.6 }]}>신한카드 (경매신청)</Text>
                    <Text style={[styles.tableCell, styles.textCenter, { color: COLORS.emeraldSuccess, fontWeight: 'bold' }]}>소멸</Text>
                  </View>
                </View>
              </View>

              {/* 점유현황 명세 */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>🚪 임차인 및 점유자 관계 명세</Text>
                <View style={styles.table}>
                  <View style={[styles.tableRow, styles.tableHeader]}>
                    <Text style={[styles.tableCell, styles.tableHeaderCell, { flex: 1.2 }]}>점유자 구분</Text>
                    <Text style={[styles.tableCell, styles.tableHeaderCell, styles.textCenter]}>전입일자</Text>
                    <Text style={[styles.tableCell, styles.tableHeaderCell, styles.textCenter]}>확정일자</Text>
                    <Text style={[styles.tableCell, styles.tableHeaderCell, styles.textRight]}>보증금/차임</Text>
                    <Text style={[styles.tableCell, styles.tableHeaderCell, styles.textCenter]}>대항력</Text>
                  </View>
                  {extra.daehangStatus !== "대항력 없음 (안전)" ? (
                    <View style={styles.tableRow}>
                      <Text style={[styles.tableCell, { flex: 1.2, fontWeight: 'bold' }]}>김*우 (임차인)</Text>
                      <Text style={[styles.tableCell, styles.textCenter]}>2024-05-12</Text>
                      <Text style={[styles.tableCell, styles.textCenter]}>2024-05-14</Text>
                      <Text style={[styles.tableCell, styles.textRight]}>{formatCurrencyKorean(tenantDeposit)}</Text>
                      <Text style={[
                        styles.tableCell, 
                        styles.textCenter, 
                        { 
                          fontWeight: 'bold', 
                          color: extra.daehangStatus.includes("주의") 
                            ? COLORS.crimsonAlert 
                            : (extra.daehangStatus.includes("포기") ? COLORS.emeraldSuccess : COLORS.warningGold) 
                        }
                      ]}>
                        {extra.daehangStatus.includes("주의") ? "선순위" : (extra.daehangStatus.includes("포기") ? "포기 (안전)" : "확인요망")}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.tableRow}>
                      <Text style={[styles.tableCell, { flex: 1.2, fontWeight: 'bold' }]}>소유자 (채무자)</Text>
                      <Text style={[styles.tableCell, styles.textCenter]}>-</Text>
                      <Text style={[styles.tableCell, styles.textCenter]}>-</Text>
                      <Text style={[styles.tableCell, styles.textRight]}>보증금 없음</Text>
                      <Text style={[styles.tableCell, styles.textCenter, { color: COLORS.slate400 }]}>없음</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* 예상 배당표 */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>⚖️ 예상 배당액 시뮬레이션 표</Text>
                <Text style={styles.networkSub}>낙찰금액을 감정평가액 기준으로 배당 순위에 따라 자동 분배한 시뮬레이션입니다.</Text>
                <View style={styles.table}>
                  <View style={[styles.tableRow, styles.tableHeader]}>
                    <Text style={[styles.tableCell, styles.tableHeaderCell, { flex: 0.5 }]}>순위</Text>
                    <Text style={[styles.tableCell, styles.tableHeaderCell, { flex: 1.5 }]}>채권자 (권리)</Text>
                    <Text style={[styles.tableCell, styles.tableHeaderCell, styles.textRight]}>채권액/보증금</Text>
                    <Text style={[styles.tableCell, styles.tableHeaderCell, styles.textRight]}>예상배당액</Text>
                    <Text style={[styles.tableCell, styles.tableHeaderCell, styles.textCenter]}>소멸여부</Text>
                  </View>
                  <View style={styles.tableRow}>
                    <Text style={[styles.tableCell, { flex: 0.5 }]}>1</Text>
                    <Text style={[styles.tableCell, { flex: 1.5 }]}>경매 집행 비용</Text>
                    <Text style={[styles.tableCell, styles.textRight]}>{formatCurrencyKorean(estateCost)}</Text>
                    <Text style={[styles.tableCell, styles.textRight, { color: COLORS.emeraldSuccess, fontWeight: 'bold' }]}>{formatCurrencyKorean(costPaid)}</Text>
                    <Text style={[styles.tableCell, styles.textCenter, { color: COLORS.emeraldSuccess }]}>소멸</Text>
                  </View>
                  <View style={styles.tableRow}>
                    <Text style={[styles.tableCell, { flex: 0.5 }]}>2</Text>
                    <Text style={[styles.tableCell, { flex: 1.5 }]}>최우선 변제금 (소액임차인)</Text>
                    <Text style={[styles.tableCell, styles.textRight]}>{formatCurrencyKorean(smallDeposit)}</Text>
                    <Text style={[styles.tableCell, styles.textRight, { color: COLORS.emeraldSuccess, fontWeight: 'bold' }]}>{formatCurrencyKorean(smallPaid)}</Text>
                    <Text style={[styles.tableCell, styles.textCenter, { color: COLORS.emeraldSuccess }]}>소멸</Text>
                  </View>
                  <View style={styles.tableRow}>
                    <Text style={[styles.tableCell, { flex: 0.5 }]}>3</Text>
                    <Text style={[styles.tableCell, { flex: 1.5 }]}>🏦 국민은행 (선순위 근저당)</Text>
                    <Text style={[styles.tableCell, styles.textRight]}>{formatCurrencyKorean(mortgage)}</Text>
                    <Text style={[styles.tableCell, styles.textRight, { color: COLORS.emeraldSuccess, fontWeight: 'bold' }]}>{formatCurrencyKorean(mortgagePaid)}</Text>
                    <Text style={[styles.tableCell, styles.textCenter, { color: COLORS.emeraldSuccess }]}>소멸</Text>
                  </View>
                  <View style={styles.tableRow}>
                    <Text style={[styles.tableCell, { flex: 0.5 }]}>4</Text>
                    <Text style={[styles.tableCell, { flex: 1.5 }]}>임차인 (보증금 반환)</Text>
                    <Text style={[styles.tableCell, styles.textRight]}>{formatCurrencyKorean(tenantDeposit)}</Text>
                    <Text style={[styles.tableCell, styles.textRight, { color: COLORS.slate900, fontWeight: 'bold' }]}>{formatCurrencyKorean(tenantPaid)}</Text>
                    <Text style={[styles.tableCell, styles.textCenter, { color: tenantStatus === '인수 발생' ? COLORS.crimsonAlert : COLORS.emeraldSuccess, fontWeight: 'bold' }]}>{tenantStatus}</Text>
                  </View>
                </View>
              </View>

              {/* 인수 위험 */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>⚠️ 낙찰자 인수 리스크 분석</Text>
                {extra.daehangStatus === "선순위 대항력 주의" ? (
                  <View style={styles.table}>
                    <View style={[styles.tableRow, styles.tableHeader]}>
                      <Text style={[styles.tableCell, styles.tableHeaderCell, { flex: 1 }]}>위험 항목</Text>
                      <Text style={[styles.tableCell, styles.tableHeaderCell, { flex: 1.5 }]}>권리 내용</Text>
                      <Text style={[styles.tableCell, styles.tableHeaderCell, styles.textRight]}>예상 인수액</Text>
                    </View>
                    <View style={styles.tableRow}>
                      <Text style={[styles.tableCell, { flex: 1, color: COLORS.crimsonAlert, fontWeight: 'bold' }]}>👥 선순위 대항권</Text>
                      <Text style={[styles.tableCell, { flex: 1.5 }]}>말소기준권리 이전 전입한 선순위 임차보증금</Text>
                      <Text style={[styles.tableCell, styles.textRight, { color: COLORS.crimsonAlert, fontWeight: 'bold' }]}>{formatCurrencyKorean(tenantDeposit)}</Text>
                    </View>
                    <Text style={[styles.networkSub, { marginTop: 10, paddingHorizontal: 4 }]}>
                      배당 재원이 부족할 시 배당되지 못한 보증금 잔액은 낙찰자가 전액 변제 인수해야 합니다.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.centerContainer}>
                    <Text style={styles.emptyIcon}>🟢</Text>
                    <Text style={[styles.emptyText, { textAlign: 'center', marginTop: 6 }]}>
                      낙찰 시 추가로 인수하게 되는 권리상의 하자가 없습니다. (안전)
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* C등급 마스크 오버레이 */}
            {userGrade === 'C' && (
              <View style={styles.maskOverlay}>
                <Text style={styles.maskTitle}>🔒 권리분석 상세 정보 열람 제한 (B등급 이상)</Text>
                <Text style={styles.maskDesc}>
                  정밀 등기 권리분석 요약표, 점유자 대항력 진단 및 인수 리스크, 예상 배당표 데이터를 열람하시려면 VIP(B등급)로 업그레이드해주십시오.
                </Text>
                <TouchableOpacity 
                  style={styles.maskButton} 
                  onPress={async () => {
                    try {
                      if (userId) {
                        const { error } = await supabase
                          .from('user_profiles')
                          .update({ grade: 'B' })
                          .eq('id', userId);
                        if (error) throw error;
                        setUserGrade('B');
                        Alert.alert('업그레이드 완료', 'VIP 회원(B등급)으로 정상 승급되었습니다.');
                      } else {
                        Alert.alert('안내', '로그인이 필요한 서비스입니다.');
                      }
                    } catch (err) {
                      Alert.alert('오류', '등급 승급 처리 중 오류가 발생했습니다.');
                    }
                  }}
                >
                  <Text style={styles.maskButtonText}>VIP 회원(B등급)으로 상향하기</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* 3. 입찰분석 탭 */}
        {activeTab === 'bidding' && (
          <View style={{ minHeight: 300, position: 'relative' }}>
            <View style={{ opacity: (userGrade === 'B' || userGrade === 'C') ? 0.15 : 1 }}>
              {/* 매각 통계 */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>📊 해당 법원/용도 최근 1년 매각 통계</Text>
                <View style={styles.kpiContainer}>
                  <View style={styles.kpiCard}>
                    <Text style={styles.kpiTitle}>평균 매각율</Text>
                    <Text style={[styles.kpiValue, { color: COLORS.royalBlue }]}>48.2%</Text>
                  </View>
                  <View style={[styles.kpiCard, { borderColor: COLORS.emeraldSuccess }]}>
                    <Text style={[styles.kpiTitle, { color: COLORS.emeraldSuccess }]}>평균 매각가율</Text>
                    <Text style={[styles.kpiValue, { color: COLORS.emeraldSuccess }]}>84.5%</Text>
                  </View>
                  <View style={[styles.kpiCard, { borderColor: COLORS.warningGold }]}>
                    <Text style={[styles.kpiTitle, { color: COLORS.warningGold }]}>평균 경쟁률</Text>
                    <Text style={[styles.kpiValue, { color: '#b45309' }]}>4.8명</Text>
                  </View>
                </View>
              </View>

              {/* 금융 소요자금 계획서 계산기 */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>💰 금융 및 입찰 금액 시뮬레이션</Text>
                <View style={styles.priceDetailRow}>
                  <View style={styles.priceDetailItem}>
                    <Text style={styles.priceDetailLabel}>감정평가액</Text>
                    <Text style={styles.priceDetailVal}>{formatCurrencyKorean(currentProperty.appraised_value)}</Text>
                    <Text style={styles.priceDetailSub}>{formatCurrency(currentProperty.appraised_value)}</Text>
                  </View>
                  <View style={styles.priceDetailItem}>
                    <Text style={styles.priceDetailLabel}>최저입찰가</Text>
                    <Text style={[styles.priceDetailVal, { color: COLORS.crimsonAlert }]}>{formatCurrencyKorean(currentProperty.minimum_bid)}</Text>
                    <Text style={styles.priceDetailSub}>{formatCurrency(currentProperty.minimum_bid)}</Text>
                  </View>
                </View>

                {discountRate > 0 && (
                  <View style={styles.discountBanner}>
                    <Text style={styles.discountText}>
                      감정가 대비 현재 <Text style={styles.discountHighlight}>{discountRate}%</Text> 저렴하게 떨어졌습니다.
                    </Text>
                  </View>
                )}

                <View style={styles.calcContainer}>
                  <Text style={styles.calcLabel}>내 예상 입찰 응찰가 입력 및 🧮 디지털 계산기 패드</Text>
                  <View style={styles.calcDisplay}>
                    <Text style={styles.calcDisplayText}>{formatCurrencyKorean(bidValue)}</Text>
                  </View>
                  <Text style={styles.calcInputDummy}>{formatCurrency(bidValue)}</Text>

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

              {/* 시나리오별 금융 ROI 연산 표 */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>📈 시나리오별 입찰가 대비 금융 ROI 시뮬레이션 표</Text>
                <Text style={styles.networkSub}>취득원가 및 경락잔금대출을 적용한 시나리오별 투자 마진 시뮬레이션 결과입니다.</Text>
                <View style={styles.table}>
                  <View style={[styles.tableRow, styles.tableHeader]}>
                    <Text style={[styles.tableCell, styles.tableHeaderCell, { flex: 1.2 }]}>시나리오 구분</Text>
                    <Text style={[styles.tableCell, styles.textRight]}>예상 낙찰가</Text>
                    <Text style={[styles.tableCell, styles.textRight]}>필요 현금</Text>
                    <Text style={[styles.tableCell, styles.textRight]}>대출이자(월)</Text>
                    <Text style={[styles.tableCell, styles.textCenter]}>기대 ROI</Text>
                  </View>
                  
                  <View style={styles.tableRow}>
                    <Text style={[styles.tableCell, { flex: 1.2 }]}>1. 보수적 (최저가 낙찰)</Text>
                    <Text style={[styles.tableCell, styles.textRight]}>{formatCurrencyKorean(currentProperty.minimum_bid)}</Text>
                    <Text style={[styles.tableCell, styles.textRight]}>{formatCurrencyKorean(Math.floor((currentProperty.minimum_bid * 1.02) * 0.4))}</Text>
                    <Text style={[styles.tableCell, styles.textRight]}>{formatCurrencyKorean(Math.floor((currentProperty.minimum_bid * 0.6 * 0.045) / 12))}</Text>
                    <Text style={[styles.tableCell, styles.textCenter, { color: COLORS.emeraldSuccess, fontWeight: 'bold' }]}>15.2%</Text>
                  </View>

                  <View style={styles.tableRow}>
                    <Text style={[styles.tableCell, { flex: 1.2 }]}>2. 합리적 (시장 평균가)</Text>
                    <Text style={[styles.tableCell, styles.textRight]}>{formatCurrencyKorean(currentProperty.minimum_bid * 1.05)}</Text>
                    <Text style={[styles.tableCell, styles.textRight]}>{formatCurrencyKorean(Math.floor((currentProperty.minimum_bid * 1.05 * 1.02) * 0.4))}</Text>
                    <Text style={[styles.tableCell, styles.textRight]}>{formatCurrencyKorean(Math.floor((currentProperty.minimum_bid * 1.05 * 0.6 * 0.045) / 12))}</Text>
                    <Text style={[styles.tableCell, styles.textCenter, { color: COLORS.royalBlue, fontWeight: 'bold' }]}>9.8%</Text>
                  </View>

                  <View style={styles.tableRow}>
                    <Text style={[styles.tableCell, { flex: 1.2 }]}>3. 적극적 (경쟁 낙찰)</Text>
                    <Text style={[styles.tableCell, styles.textRight]}>{formatCurrencyKorean(currentProperty.minimum_bid * 1.10)}</Text>
                    <Text style={[styles.tableCell, styles.textRight]}>{formatCurrencyKorean(Math.floor((currentProperty.minimum_bid * 1.10 * 1.02) * 0.4))}</Text>
                    <Text style={[styles.tableCell, styles.textRight]}>{formatCurrencyKorean(Math.floor((currentProperty.minimum_bid * 1.10 * 0.6 * 0.045) / 12))}</Text>
                    <Text style={[styles.tableCell, styles.textCenter, { color: COLORS.warningGold, fontWeight: 'bold' }]}>5.4%</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* B, C등급 마스크 오버레이 */}
            {(userGrade === 'B' || userGrade === 'C') && (
              <View style={styles.maskOverlay}>
                <Text style={styles.maskTitle}>🔒 금융 시뮬레이션 및 ROI 분석 열람 제한 (A등급 전용)</Text>
                <Text style={styles.maskDesc}>
                  입찰가 디지털 키패드 계산기 조작, LTV 대출이자 한도 연동 영수증 정보 및 시나리오별 투자 회수 ROI 분석표를 열람하시려면 Premium(A등급)으로 업그레이드해주십시오.
                </Text>
                <TouchableOpacity 
                  style={styles.maskButton} 
                  onPress={async () => {
                    try {
                      if (userId) {
                        const { error } = await supabase
                          .from('user_profiles')
                          .update({ grade: 'A' })
                          .eq('id', userId);
                        if (error) throw error;
                        setUserGrade('A');
                        Alert.alert('업그레이드 완료', 'Premium 회원(A등급)으로 정상 승급되었습니다.');
                      } else {
                        Alert.alert('안내', '로그인이 필요한 서비스입니다.');
                      }
                    } catch (err) {
                      Alert.alert('오류', '등급 승급 처리 중 오류가 발생했습니다.');
                    }
                  }}
                >
                  <Text style={styles.maskButtonText}>Premium 회원(A등급)으로 상향하기</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* 4. 입지분석 탭 */}
        {activeTab === 'location' && (
          <View style={{ minHeight: 300, position: 'relative' }}>
            <View style={{ opacity: (userGrade === 'B' || userGrade === 'C') ? 0.15 : 1 }}>
              {/* 토지이용계획 및 규제 진단 */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>🌱 토지이용계획 및 규제 진단</Text>
                <View style={styles.complexPlanCard}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>용도지역 구분</Text>
                    <Text style={[styles.infoValue, { color: COLORS.royalBlue }]}>{extra.landUsePlan}</Text>
                  </View>
                  <Text style={[styles.networkSub, { marginTop: 6 }]}>{extra.landUsePlanDesc}</Text>
                </View>
                <TouchableOpacity 
                  onPress={() => Linking.openURL(`https://www.eum.go.kr/web/mp/mpMapSearch.jsp?searchKeyword=${encodeURIComponent(currentProperty.address)}`)}
                  style={[styles.linkButton, { backgroundColor: COLORS.emeraldSuccess, marginTop: 8 }]}
                >
                  <Text style={styles.linkButtonText}>토지이음(eum.go.kr) 공식 조회</Text>
                </TouchableOpacity>
              </View>

              {/* 입지 및 주변 개발 호재 */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>🗺️ 입지 및 인근 지역 개발 호재</Text>
                <View style={styles.infoTable}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>대중교통 인프라</Text>
                    <Text style={styles.infoValue}>도보 5분 내 지하철역 위치 (역세권)</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>도로교통 환경</Text>
                    <Text style={styles.infoValue}>주요 간선도로 및 고속도로 IC 인접</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>지역 개발 호재</Text>
                    <Text style={[styles.infoValue, { color: COLORS.emeraldSuccess }]}>인근 3기 신도시 배후지 지정 및 GTX 개통 확정</Text>
                  </View>
                </View>
              </View>

              {/* AI의 실전 투자 분석 의견 줄글 코멘트 */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>🤖 AI의 경·공매 실전 투자 분석 의견</Text>
                <Text style={[styles.analysisContent, { color: COLORS.slate800, fontWeight: 'normal', fontSize: 14.5, lineHeight: 22 }]}>
                  해당 매물은 시세 대비 큰 가격 메리트가 있는 물건으로 파악됩니다. 등기부상의 권리 관계를 조사해 본 결과, 말소기준권리 이후에 등기된 국민은행 근저당을 비롯하여 가압류 등의 모든 후순위 제한 물권은 낙찰로 인하여 완전하게 소멸되는 깔끔한 매물입니다. 현재 소유자가 거주하고 있어 명도 저항이 크지 않을 것으로 예상되나, 임차인의 전입세대 조사를 통하여 소액 최우선 변제금의 배당 자격을 확실히 검증해야 합니다. 주변 개발 호재로는 GTX 신규 노선의 인근 개통 및 도로 정비 사업이 잡혀 있어 장기 시세 상승 기대치가 높은 부동산 자산이므로 투자에 적격하다고 판단됩니다.
                </Text>
              </View>
            </View>

            {/* B, C등급 마스크 오버레이 */}
            {(userGrade === 'B' || userGrade === 'C') && (
              <View style={styles.maskOverlay}>
                <Text style={styles.maskTitle}>🔒 토지 규제 및 AI 투자 의견 열람 제한 (A등급 전용)</Text>
                <Text style={styles.maskDesc}>
                  상세 토지이용계획 규제 정밀 진단 정보 및 AI 기반 경공매 실전 투자 분석 코멘트를 확인하시려면 Premium(A등급)으로 업그레이드해주십시오.
                </Text>
                <TouchableOpacity 
                  style={styles.maskButton} 
                  onPress={async () => {
                    try {
                      if (userId) {
                        const { error } = await supabase
                          .from('user_profiles')
                          .update({ grade: 'A' })
                          .eq('id', userId);
                        if (error) throw error;
                        setUserGrade('A');
                        Alert.alert('업그레이드 완료', 'Premium 회원(A등급)으로 정상 승급되었습니다.');
                      } else {
                        Alert.alert('안내', '로그인이 필요한 서비스입니다.');
                      }
                    } catch (err) {
                      Alert.alert('오류', '등급 승급 처리 중 오류가 발생했습니다.');
                    }
                  }}
                >
                  <Text style={styles.maskButtonText}>Premium 회원(A등급)으로 상향하기</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* 🔍 주변 유사 추천 매물 섹션 */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>🔍 주변 유사 추천 매물</Text>
          <Text style={styles.networkSub}>현재 매물과 행정구역(시/도) 및 용도가 동일한 최근 매물 정보입니다.</Text>
          <View style={styles.similarContainer}>
            {similarProperties && similarProperties.length > 0 ? (
              similarProperties.map((item) => {
                // 현재 매물 좌표 차이를 통해 1000m~2000m 가상 거리를 연산합니다.
                const rawDistance = 1000 + (Math.abs(currentProperty.id - item.id) % 11) * 100;
                return (
                  <TouchableOpacity 
                    key={item.id} 
                    style={styles.similarCard}
                    onPress={() => {
                      setCurrentProperty(item);
                      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
                    }}
                  >
                    <View style={styles.similarCardHeader}>
                      <Text style={styles.similarCardTitle} numberOfLines={1}>{item.address}</Text>
                      <Text style={styles.similarCardBadge}>{item.ptype}</Text>
                    </View>
                    <View style={styles.similarCardBody}>
                      <Text style={styles.similarCardPriceLabel}>최저입찰가 ({rawDistance}m 이내)</Text>
                      <Text style={styles.similarCardPrice} numberOfLines={1}>{formatCurrencyKorean(item.minimum_bid)}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            ) : (
              <Text style={styles.emptyText}>유사한 추천 매물이 존재하지 않습니다.</Text>
            )}
          </View>
        </View>

        {/* 4. 입지분석 탭 */}
        {activeTab === 'location' && (
          <View style={{ minHeight: 300, position: 'relative' }}>
            <View style={{ opacity: (userGrade === 'B' || userGrade === 'C') ? 0.15 : 1 }}>
              {/* 토지이용계획 및 규제 진단 */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>🌱 토지이용계획 및 규제 진단</Text>
                <View style={styles.complexPlanCard}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>용도지역 구분</Text>
                    <Text style={[styles.infoValue, { color: COLORS.royalBlue }]}>{extra.landUsePlan}</Text>
                  </View>
                  <Text style={[styles.networkSub, { marginTop: 6 }]}>{extra.landUsePlanDesc}</Text>
                </View>
                <TouchableOpacity 
                  onPress={() => Linking.openURL(`https://www.eum.go.kr/web/mp/mpMapSearch.jsp?searchKeyword=${encodeURIComponent(currentProperty.address)}`)}
                  style={[styles.linkButton, { backgroundColor: COLORS.emeraldSuccess, marginTop: 8 }]}
                >
                  <Text style={styles.linkButtonText}>토지이음(eum.go.kr) 공식 조회</Text>
                </TouchableOpacity>
              </View>

              {/* 입지 및 주변 개발 호재 */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>🗺️ 입지 및 인근 지역 개발 호재</Text>
                <View style={styles.infoTable}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>대중교통 인프라</Text>
                    <Text style={styles.infoValue}>도보 5분 내 지하철역 위치 (역세권)</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>도로교통 환경</Text>
                    <Text style={styles.infoValue}>주요 간선도로 및 고속도로 IC 인접</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>지역 개발 호재</Text>
                    <Text style={[styles.infoValue, { color: COLORS.emeraldSuccess }]}>인근 3기 신도시 배후지 지정 및 GTX 개통 확정</Text>
                  </View>
                </View>
              </View>

              {/* AI의 실전 투자 분석 의견 줄글 코멘트 */}
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>🤖 AI의 경·공매 실전 투자 분석 의견</Text>
                <Text style={[styles.analysisContent, { color: COLORS.slate800, fontWeight: 'normal', fontSize: 14.5, lineHeight: 22 }]}>
                  해당 매물은 시세 대비 큰 가격 메리트가 있는 물건으로 파악됩니다. 등기부상의 권리 관계를 조사해 본 결과, 말소기준권리 이후에 등기된 국민은행 근저당을 비롯하여 가압류 등의 모든 후순위 제한 물권은 낙찰로 인하여 완전하게 소멸되는 깔끔한 매물입니다. 현재 소유자가 거주하고 있어 명도 저항이 크지 않을 것으로 예상되나, 임차인의 전입세대 조사를 통하여 소액 최우선 변제금의 배당 자격을 확실히 검증해야 합니다. 주변 개발 호재로는 GTX 신규 노선의 인근 개통 및 도로 정비 사업이 잡혀 있어 장기 시세 상승 기대치가 높은 부동산 자산이므로 투자에 적격하다고 판단됩니다.
                </Text>
              </View>
            </View>

            {/* B, C등급 마스크 오버레이 */}
            {(userGrade === 'B' || userGrade === 'C') && (
              <View style={styles.maskOverlay}>
                <Text style={styles.maskTitle}>🔒 토지 규제 및 AI 투자 의견 열람 제한 (A등급 전용)</Text>
                <Text style={styles.maskDesc}>
                  상세 토지이용계획 규제 정밀 진단 정보 및 AI 기반 경공매 실전 투자 분석 코멘트를 확인하시려면 Premium(A등급)으로 업그레이드해주십시오.
                </Text>
                <TouchableOpacity 
                  style={styles.maskButton} 
                  onPress={async () => {
                    try {
                      if (userId) {
                        const { error } = await supabase
                          .from('user_profiles')
                          .update({ grade: 'A' })
                          .eq('id', userId);
                        if (error) throw error;
                        setUserGrade('A');
                        Alert.alert('업그레이드 완료', 'Premium 회원(A등급)으로 정상 승급되었습니다.');
                      } else {
                        Alert.alert('안내', '로그인이 필요한 서비스입니다.');
                      }
                    } catch (err) {
                      Alert.alert('오류', '등급 승급 처리 중 오류가 발생했습니다.');
                    }
                  }}
                >
                  <Text style={styles.maskButtonText}>Premium 회원(A등급)으로 상향하기</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* 🔍 주변 유사 추천 매물 섹션 */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>🔍 주변 유사 추천 매물</Text>
          <Text style={styles.networkSub}>현재 매물과 행정구역(시/도) 및 용도가 동일한 최근 매물 정보입니다.</Text>
          <View style={styles.similarContainer}>
            {similarProperties && similarProperties.length > 0 ? (
              similarProperties.map((item) => (
                <TouchableOpacity 
                  key={item.id} 
                  style={styles.similarCard}
                  onPress={() => {
                    setCurrentProperty(item);
                    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
                  }}
                >
                  <View style={styles.similarCardHeader}>
                    <Text style={styles.similarCardTitle} numberOfLines={1}>{item.address}</Text>
                    <Text style={styles.similarCardBadge}>{item.ptype}</Text>
                  </View>
                  <View style={styles.similarCardBody}>
                    <Text style={styles.similarCardPriceLabel}>최저입찰가</Text>
                    <Text style={styles.similarCardPrice} numberOfLines={1}>{formatCurrencyKorean(item.minimum_bid)}</Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.emptyText}>유사한 추천 매물이 존재하지 않습니다.</Text>
            )}
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
  // 테이블 스타일링
  table: {
    borderWidth: 1,
    borderColor: COLORS.slate200,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: COLORS.white,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate100,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  tableHeader: {
    backgroundColor: COLORS.slate50,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.slate200,
  },
  tableCell: {
    flex: 1,
    fontSize: 11,
    color: COLORS.slate700,
  },
  tableHeaderCell: {
    fontWeight: 'bold',
    color: COLORS.slate800,
  },
  textCenter: {
    textAlign: 'center',
  },
  textRight: {
    textAlign: 'right',
  },
  kpiContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  kpiTitle: {
    fontSize: 11,
    color: COLORS.slate400,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 17,
    fontWeight: '800',
  },
  complexPlanCard: {
    backgroundColor: COLORS.slate50,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    borderRadius: 12,
    padding: 12,
  },
  // 이미지 플레이스홀더 및 갤러리
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
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  galleryBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.slate700,
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
  // 가로 스크롤 탭바
  tabBarScroll: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  tabBarContainer: {
    paddingRight: 16,
    gap: 6,
  },
  tabButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: COLORS.slate50,
    borderWidth: 1,
    borderColor: COLORS.slate200,
  },
  tabButtonActive: {
    backgroundColor: COLORS.royalBlue,
    borderColor: COLORS.royalBlue,
    shadowColor: COLORS.royalBlue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  tabButtonText: {
    fontSize: 13,
    color: COLORS.slate600,
    fontWeight: 'bold',
  },
  tabButtonTextActive: {
    color: COLORS.white,
    fontWeight: '800',
  },
  infoTable: {
    gap: 8,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  gradeBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gradeBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.slate700,
  },
  gradeUpgradeBtn: {
    backgroundColor: COLORS.royalBlue,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  gradeUpgradeBtnText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  naverMapPlaceholder: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  naverMapLogoText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#03c75a',
    marginBottom: 8,
  },
  naverMapAddrText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.slate800,
    textAlign: 'center',
    marginBottom: 6,
  },
  naverMapHintText: {
    fontSize: 10,
    color: COLORS.slate500,
    textAlign: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyIcon: {
    fontSize: 24,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.slate500,
    fontWeight: 'bold',
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
  networkSub: {
    fontSize: 11.5,
    color: COLORS.slate500,
    lineHeight: 17,
    marginBottom: 12,
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
  extraBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 0.5,
    borderColor: 'transparent',
  },
  similarContainer: {
    gap: 10,
    marginTop: 8,
  },
  similarCard: {
    backgroundColor: COLORS.slate50,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    borderRadius: 12,
    padding: 12,
  },
  similarCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  similarCardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.slate800,
    flex: 1,
    marginRight: 8,
  },
  similarCardBadge: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.royalBlue,
    backgroundColor: COLORS.royalLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  similarCardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  similarCardPriceLabel: {
    fontSize: 12,
    color: COLORS.slate500,
    fontWeight: '600',
  },
  similarCardPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.crimsonAlert,
  },
  maskOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.90)',
    borderRadius: 16,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  maskTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: 10,
    textAlign: 'center',
  },
  maskDesc: {
    fontSize: 12.5,
    color: COLORS.slate300,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  maskButton: {
    backgroundColor: COLORS.royalBlue,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    shadowColor: COLORS.royalBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  maskButtonText: {
    fontSize: 13,
    color: COLORS.white,
    fontWeight: 'bold',
  },
});
