// 모바일 애플리케이션의 탭 상태와 상세 화면 네비게이션을 조율하는 메인 진입점 파일입니다.

import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Modal } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { COLORS } from './src/components/Theme';
import { Property } from './src/types';
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

  useEffect(() => {
    // 앱이 처음 시작되거나 갱신될 때 Supabase 인증 세션 상태의 변경 사항을 즉각 감지하기 위해 리스너를 구독하였습니다.
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session ? session.user : null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session ? session.user : null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 로그아웃을 수행한 후, UI 일관성을 위해 추천 피드 화면으로 강제 이동 처리합니다.
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setActiveTab('feed');
    } catch (error) {
      console.error('로그아웃 중 오류가 발생했습니다.', error);
    }
  };

  // 선택된 상세 화면이 있는 경우, 상세 화면을 우선 렌더링합니다. (Stack Navigation 시뮬레이션)
  const renderContent = () => {
    if (selectedProperty) {
      return (
        <DetailScreen
          property={selectedProperty}
          onBack={() => setSelectedProperty(null)}
        />
      );
    }

    switch (activeTab) {
      case 'feed':
        return (
          <FeedScreen
            onSelectProperty={(property) => setSelectedProperty(property)}
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
        return <FeedScreen onSelectProperty={(p) => setSelectedProperty(p)} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* 프리미엄 로고 및 글로벌 헤더 (상세 화면에서는 미노출) */}
      {!selectedProperty && (
        <View style={styles.header}>
          <View style={styles.logoIcon}>
            <Text style={styles.logoIconText}>🏨</Text>
          </View>
          <View style={styles.logoTextContainer}>
            <Text style={styles.logoTitle}>AI 부동산 경시/공매 통합 앱</Text>
            <Text style={styles.logoSubtitle}>PREMIUM ELEGANT PEARL WHITE</Text>
          </View>
          {user ? (
            <View style={styles.userBadgeHeader}>
              <Text style={styles.userBadgeText}>LIVE</Text>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.loginHeaderButton}
              onPress={() => setShowAuthScreen(true)}
            >
              <Text style={styles.loginHeaderButtonText}>로그인</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* 메인 콘텐츠 화면 영역 */}
      <View style={styles.content}>
        {renderContent()}
      </View>

      {/* 하단 프리미엄 탭바 (상세 화면에서는 미노출) */}
      {!selectedProperty && (
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
      )}

      {/* 인증용 모달 오버레이 영역 */}
      <Modal
        visible={showAuthScreen}
        animationType="slide"
        onRequestClose={() => setShowAuthScreen(false)}
      >
        <AuthScreen 
          onSuccess={() => setShowAuthScreen(false)}
          onCancel={() => setShowAuthScreen(false)}
        />
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
});
