// 모바일 애플리케이션의 탭 상태와 상세 화면 네비게이션을 조율하는 메인 진입점 파일입니다.

import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Modal, Platform, Image, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { COLORS } from './src/components/Theme';
import { Property, FilterState } from './src/types';
import { FeedScreen } from './src/screens/FeedScreen';
import { DetailScreen } from './src/screens/DetailScreen';
import { GlossaryScreen } from './src/screens/GlossaryScreen';
import { GuideScreen } from './src/screens/GuideScreen';
import { FavoritesScreen } from './src/screens/FavoritesScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { supabase } from './src/utils/supabase';
import { User } from '@supabase/supabase-js';

type TabType = 'feed' | 'favorites' | 'glossary' | 'guide';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('feed');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [showAuthScreen, setShowAuthScreen] = useState<boolean>(false);
  const [showMyPageModal, setShowMyPageModal] = useState<boolean>(false);
  const [userGrade, setUserGrade] = useState<'A' | 'B' | 'C'>('C');
  const [isUpgradeRequested, setIsUpgradeRequested] = useState<boolean>(false);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    source: ['court', 'onbid', 'private'],
    ptype: ['apart', 'officetel', 'villa', 'house', 'store', 'land', 'factory', 'vehicle', 'security', 'machinery', 'etc_goods'],
    sido: [],
    sigungu: 'all',
    dateLimit: 999,
    budgetLimit: 2000000000,
    hidePast: true,
    gradeFilter: 'all',
    investmentType: 'all',
    selectedCourts: [],
  });

  // 🔒 Supabase user_profiles 고객 등급 조회 함수
  const fetchUserGrade = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('grade, upgrade_requested')
        .eq('id', uid)
        .maybeSingle();
      if (error) throw error;
      if (data) {
        setUserGrade((data.grade || 'C') as 'A' | 'B' | 'C');
        setIsUpgradeRequested(!!data.upgrade_requested);
      } else {
        await supabase
          .from('user_profiles')
          .insert({ id: uid, grade: 'C', email: user?.email || '', upgrade_requested: false });
        setUserGrade('C');
        setIsUpgradeRequested(false);
      }
    } catch (err) {
      console.error('모바일 회원 등급 연동 실패:', err);
      setUserGrade('C');
      setIsUpgradeRequested(false);
    }
  };

  // 🔒 등급 업그레이드 신청 API 연동 함수
  const requestUpgrade = async () => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ upgrade_requested: true })
        .eq('id', user.id);
      if (error) throw error;
      Alert.alert('신청 완료', '등급 업그레이드 신청이 완료되었습니다.');
      setIsUpgradeRequested(true);
      if (user) {
        fetchUserGrade(user.id);
      }
    } catch (err) {
      console.error('등급 업그레이드 신청 실패:', err);
      Alert.alert('오류', '업그레이드 신청 중 오류가 발생했습니다.');
    }
  };

  useEffect(() => {
    // 앱이 처음 시작되거나 갱신될 때 Supabase 인증 세션 상태의 변경 사항을 즉각 감지하기 위해 리스너를 구독하였습니다.
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session ? session.user : null;
      setUser(currentUser);
      if (currentUser) {
        fetchUserGrade(currentUser.id);
      } else {
        setUserGrade('C');
        setIsUpgradeRequested(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session ? session.user : null;
      setUser(currentUser);
      if (currentUser) {
        fetchUserGrade(currentUser.id);
      } else {
        setUserGrade('C');
        setIsUpgradeRequested(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 브라우저 백 버튼 연동 및 뒤로가기 가드 생성
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handlePopState = (event: PopStateEvent) => {
      // 뒤로가기 감지 시 모달이 활성화된 상태라면 모달 상태를 종료합니다.
      setSelectedProperty(null);
    };

    if (selectedProperty) {
      // 현재 주소를 명시하여 경로 변경 없이 히스토리에 가상 모달 상태를 삽입합니다.
      window.history.pushState({ isModal: true }, '', window.location.pathname + window.location.search);
      window.addEventListener('popstate', handlePopState);
    }

    return () => {
      if (Platform.OS === 'web') {
        window.removeEventListener('popstate', handlePopState);
      }
    };
  }, [selectedProperty]);

  // 상세 페이지 닫기 공통 제어
  const handleCloseDetail = () => {
    if (Platform.OS === 'web') {
      // 히스토리 가드가 활성화된 상태라면 브라우저 뒤로가기를 호출하여 자연스러운 연동을 유도합니다.
      if (window.history.state?.isModal) {
        window.history.back();
      } else {
        setSelectedProperty(null);
      }
    } else {
      setSelectedProperty(null);
    }
  };

  // 로그아웃을 수행한 후, UI 일관성을 위해 추천 피드 화면으로 강제 이동 처리합니다.
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setActiveTab('feed');
    } catch (error) {
      console.error('로그아웃 중 오류가 발생했습니다.', error);
    }
  };

  // 탭 변경 시 해당 탭 화면을 렌더링합니다. (상세 화면은 이제 모달로 렌더링되므로 탭 컨텐츠에서 분리)
  const renderContent = () => {
    switch (activeTab) {
      case 'feed':
        return (
          <FeedScreen
            onSelectProperty={(property) => setSelectedProperty(property)}
            filters={filters}
            setFilters={setFilters}
          />
        );
      case 'favorites':
        if (!user) {
          // 비로그인 상태일 경우에는 사용자에게 로그인 유도 화면을 제공하여 접근을 제한합니다.
          return (
            <View style={styles.authPromptContainer}>
              <Text style={styles.authPromptIcon}>🔒</Text>
              <Text style={styles.authPromptTitle}>로그인이 필요한 서비스입니다.</Text>
              <Text style={styles.authPromptSubtitle}>
                관심 물건 목록을 안전하게 저장하고 관리하시려면 로그인을 진행해 주십시오.
              </Text>
              <TouchableOpacity 
                style={styles.authPromptButton} 
                onPress={() => setShowAuthScreen(true)}
              >
                <Text style={styles.authPromptButtonText}>로그인 / 회원가입</Text>
              </TouchableOpacity>
            </View>
          );
        }
        return (
          <FavoritesScreen
            userId={user.id}
            userEmail={user.email || null}
            onSelectProperty={(property) => setSelectedProperty(property)}
            onLogout={handleLogout}
          />
        );
      case 'glossary':
        return <GlossaryScreen />;
      case 'guide':
        return <GuideScreen />;
      default:
        return (
          <FeedScreen
            onSelectProperty={(p) => setSelectedProperty(p)}
            filters={filters}
            setFilters={setFilters}
          />
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* 프리미엄 로고 및 글로벌 헤더 (상세 모달이 아닐 때 배경 렌더링 일관성 보존) */}
      <View style={styles.header}>
        <View style={styles.logoIcon}>
          <Text style={styles.logoIconText}>🏨</Text>
        </View>
        <TouchableOpacity 
          style={styles.logoTextContainer}
          onPress={() => {
            setActiveTab('feed');
            setSelectedProperty(null);
            setFilters({
              search: '',
              source: ['court', 'onbid', 'private'],
              ptype: ['apart', 'officetel', 'villa', 'house', 'store', 'land', 'factory', 'vehicle', 'security', 'machinery', 'etc_goods'],
              sido: [],
              sigungu: 'all',
              dateLimit: 999,
              budgetLimit: 2000000000,
              hidePast: true,
              gradeFilter: 'all',
              investmentType: 'all',
              selectedCourts: [],
            });
          }}
        >
          <Text style={styles.logoTitle}>부동산경공매 검색시스템</Text>
          <Text style={styles.logoSubtitle}>PREMIUM ELEGANT PEARL WHITE</Text>
        </TouchableOpacity>
        {user ? (
          <TouchableOpacity 
            style={styles.userHeaderBadge}
            onPress={() => setShowMyPageModal(true)}
          >
            <Text style={styles.userHeaderText} numberOfLines={1}>
              {user.email ? user.email.split('@')[0] : '유저'} ({userGrade}등급)
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.loginHeaderButton}
            onPress={() => setShowAuthScreen(true)}
          >
            <Text style={styles.loginHeaderButtonText}>로그인</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 메인 콘텐츠 화면 영역 */}
      <View style={styles.content}>
        {renderContent()}
      </View>

      {/* 하단 프리미엄 탭바 */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'feed' && styles.tabItemActive]}
          onPress={() => setActiveTab('feed')}
        >
          <Text style={styles.tabIcon}>{activeTab === 'feed' ? '✨' : '⭐'}</Text>
          <Text style={[styles.tabLabel, activeTab === 'feed' && styles.tabLabelActive]}>
            추천 피드
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'favorites' && styles.tabItemActive]}
          onPress={() => setActiveTab('favorites')}
        >
          <Text style={styles.tabIcon}>{activeTab === 'favorites' ? '★' : '☆'}</Text>
          <Text style={[styles.tabLabel, activeTab === 'favorites' && styles.tabLabelActive]}>
            관심 목록
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'glossary' && styles.tabItemActive]}
          onPress={() => setActiveTab('glossary')}
        >
          <Text style={styles.tabIcon}>📖</Text>
          <Text style={[styles.tabLabel, activeTab === 'glossary' && styles.tabLabelActive]}>
            용어 사전
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'guide' && styles.tabItemActive]}
          onPress={() => setActiveTab('guide')}
        >
          <Text style={styles.tabIcon}>⚙️</Text>
          <Text style={[styles.tabLabel, activeTab === 'guide' && styles.tabLabelActive]}>
            연동 가이드
          </Text>
        </TouchableOpacity>
      </View>

      {/* 물건 상세 보기 모달 오버레이 영역 */}
      {selectedProperty !== null && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 9999, backgroundColor: COLORS.pearlWhiteBg }]}>
          <DetailScreen
            property={selectedProperty}
            onBack={handleCloseDetail}
          />
        </View>
      )}

      {/* 인증용 모달 오버레이 영역 */}
      <Modal
        visible={showAuthScreen}
        animationType="slide"
        onRequestClose={() => setShowAuthScreen(false)}
      >
        <AuthScreen 
          onSuccess={() => {
            setShowAuthScreen(false);
          }}
          onCancel={() => setShowAuthScreen(false)}
        />
      </Modal>

      {/* 👤 프리미엄 마이페이지(개인화) 모달 영역 */}
      <Modal
        visible={showMyPageModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowMyPageModal(false)}
      >
        <View style={styles.myPageModalOverlay}>
          <View style={styles.myPageModalContent}>
            <View style={styles.myPageModalHeader}>
              <Text style={styles.myPageModalTitle}>마이페이지</Text>
              <Text style={styles.myPageModalSubtitle}>로그인 정보와 계정 연동 상태를 확인합니다.</Text>
              <TouchableOpacity 
                style={styles.myPageCloseIconButton} 
                onPress={() => setShowMyPageModal(false)}
              >
                <Text style={styles.myPageCloseIconText}>×</Text>
              </TouchableOpacity>
            </View>

            {user && (
              <View>
                {/* 프로필 정보 카드 */}
                <View style={styles.myPageProfileCard}>
                  <Image 
                    source={{ uri: user.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80' }} 
                    style={styles.myPageAvatar} 
                  />
                  <View style={styles.myPageProfileInfo}>
                    <Text style={styles.myPageEmailText} numberOfLines={1}>{user.email}</Text>
                    <View style={styles.myPageGradeBadge}>
                      <Text style={styles.myPageGradeBadgeText}>👑 {userGrade}등급</Text>
                    </View>
                  </View>
                </View>

                {/* 소셜 계정 연동 상태 */}
                <View style={styles.myPageSection}>
                  <Text style={styles.myPageSectionTitle}>소셜 로그인 연동 정보</Text>
                  <View style={styles.myPageSocialRow}>
                    <Text style={styles.myPageSocialLabel}>Google</Text>
                    <Text style={[
                      styles.myPageSocialStatus, 
                      { color: user.app_metadata?.providers?.includes('google') ? COLORS.emeraldSuccess : COLORS.slate400 }
                    ]}>
                      {user.app_metadata?.providers?.includes('google') ? '🟢 연결됨' : '연결 없음'}
                    </Text>
                  </View>
                  <View style={styles.myPageSocialRowLast}>
                    <Text style={styles.myPageSocialLabel}>Kakao</Text>
                    <Text style={[
                      styles.myPageSocialStatus, 
                      { color: user.app_metadata?.providers?.includes('kakao') ? COLORS.emeraldSuccess : COLORS.slate400 }
                    ]}>
                      {user.app_metadata?.providers?.includes('kakao') ? '🟢 연결됨' : '연결 없음'}
                    </Text>
                  </View>
                </View>

                {/* 하단 동작 버튼 */}
                <View style={styles.myPageButtonContainer}>
                  {userGrade !== 'A' && (
                    <TouchableOpacity 
                      style={[styles.myPageUpgradeButton, isUpgradeRequested && styles.myPageUpgradeButtonDisabled]} 
                      disabled={isUpgradeRequested}
                      onPress={requestUpgrade}
                    >
                      <Text style={[styles.myPageUpgradeButtonText, isUpgradeRequested && styles.myPageUpgradeButtonDisabledText]}>
                        {isUpgradeRequested ? '신청 대기 중' : '▲ 등급 업그레이드'}
                      </Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity 
                    style={styles.myPageLogoutButton}
                    onPress={() => {
                      setShowMyPageModal(false);
                      handleLogout();
                    }}
                  >
                    <Text style={styles.myPageLogoutButtonText}>로그아웃</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.pearlWhiteBg,
  },
  header: {
    height: 60,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate200,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  logoIcon: {
    backgroundColor: COLORS.royalBlue,
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  logoIconText: {
    fontSize: 16,
  },
  logoTextContainer: {
    flex: 1,
  },
  logoTitle: {
    fontSize: 16.5,
    fontWeight: 'bold',
    color: COLORS.slate900,
  },
  logoSubtitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.slate400,
    letterSpacing: 0.5,
  },
  userBadgeHeader: {
    backgroundColor: COLORS.emeraldSuccess,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  userBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  loginHeaderButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.royalBlue,
  },
  loginHeaderButtonText: {
    fontSize: 13,
    color: COLORS.royalBlue,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  tabBar: {
    height: 64,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.slate200,
    flexDirection: 'row',
    paddingBottom: 4,
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 6,
  },
  tabItemActive: {
    borderTopWidth: 2,
    borderTopColor: COLORS.royalBlue,
  },
  tabIcon: {
    fontSize: 21,
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.slate400,
  },
  tabLabelActive: {
    color: COLORS.royalBlue,
    fontWeight: 'bold',
  },
  authPromptContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: COLORS.pearlWhiteBg,
  },
  authPromptIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  authPromptTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: COLORS.slate900,
    marginBottom: 8,
  },
  authPromptSubtitle: {
    fontSize: 14,
    color: COLORS.slate600,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
  },
  authPromptButton: {
    backgroundColor: COLORS.royalBlue,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  authPromptButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  // 👤 모바일 마이페이지 모달용 신규 스타일
  myPageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  myPageModalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    width: '100%',
    maxWidth: 360,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    shadowColor: COLORS.slate900,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  myPageModalHeader: {
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
    width: '100%',
  },
  myPageModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.slate900,
  },
  myPageModalSubtitle: {
    fontSize: 10.5,
    fontWeight: 'bold',
    color: COLORS.slate400,
    marginTop: 4,
  },
  myPageCloseIconButton: {
    position: 'absolute',
    top: -4,
    right: -4,
    padding: 8,
  },
  myPageCloseIconText: {
    fontSize: 22,
    color: COLORS.slate400,
    fontWeight: 'bold',
    lineHeight: 22,
  },
  myPageProfileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.slate50,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.slate100,
    marginBottom: 20,
  },
  myPageAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: COLORS.royalBlue,
  },
  myPageProfileInfo: {
    flex: 1,
    marginLeft: 12,
  },
  myPageEmailText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.slate800,
  },
  myPageGradeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#fef9c3',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#fde047',
    marginTop: 6,
  },
  myPageGradeBadgeText: {
    fontSize: 10.5,
    fontWeight: 'bold',
    color: '#854d0e',
  },
  myPageSection: {
    backgroundColor: COLORS.slate50,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.slate100,
    marginBottom: 24,
  },
  myPageSectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.slate400,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  myPageSocialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  myPageSocialRowLast: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  myPageSocialLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.slate600,
  },
  myPageSocialStatus: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  myPageButtonContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  myPageUpgradeButton: {
    flex: 1,
    height: 44,
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fcd34d',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  myPageUpgradeButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#78350f',
  },
  myPageUpgradeButtonDisabled: {
    backgroundColor: COLORS.slate50,
    borderColor: COLORS.slate200,
  },
  myPageUpgradeButtonDisabledText: {
    color: COLORS.slate400,
  },
  myPageLogoutButton: {
    paddingHorizontal: 16,
    height: 44,
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  myPageLogoutButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.crimsonAlert,
  },
  userHeaderBadge: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.royalBlue,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    maxWidth: 150,
  },
  userHeaderText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.royalBlue,
  },
});
