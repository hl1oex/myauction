// Supabase DB로부터 사용자의 관심 물건 목록을 가져와 프리미엄 카드 리스트 형태로 렌더링하는 관심 목록 화면입니다.

import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Property } from '../types';
import { fetchFavorites } from '../utils/api';
import { PropertyCard } from '../components/PropertyCard';
import { COLORS } from '../components/Theme';

interface FavoritesScreenProps {
  userId: string;
  onSelectProperty: (property: Property) => void;
  onLogout: () => void;
  userEmail: string | null;
}

export function FavoritesScreen({ userId, onSelectProperty, onLogout, userEmail }: FavoritesScreenProps) {
  const [favorites, setFavorites] = useState<Property[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Firestore로부터 관심 물건 데이터를 비동기로 로드하여 로컬 상태에 동기화합니다.
  const loadFavorites = async () => {
    try {
      setLoading(true);
      const data = await fetchFavorites(userId);
      setFavorites(data);
    } catch (error) {
      console.error('Favorites load error', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, [userId]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadFavorites();
  };

  // 비어 있는 목록 화면을 사용자 경험을 고려해 고급스러운 펄 화이트 스타일로 디자인했습니다.
  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>⭐</Text>
      <Text style={styles.emptyTitle}>등록된 관심 물건이 없습니다.</Text>
      <Text style={styles.emptySubtitle}>
        추천 피드 화면에서 마음에 드는 경공매 매물을 찾아 별표 아이콘을 눌러 추가해 보십시오.
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* 사용자 프로필 및 로그아웃 헤더 섹션 */}
      <View style={styles.userHeader}>
        <View style={styles.userInfo}>
          <Text style={styles.userBadge}>PRO</Text>
          <Text style={styles.userEmail} numberOfLines={1}>
            {userEmail || '로그인 계정'}
          </Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
          <Text style={styles.logoutButtonText}>로그아웃</Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.royalBlue} />
          <Text style={styles.loadingText}>관심 목록을 불러오는 중입니다.</Text>
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <PropertyCard 
              property={item} 
              onPress={() => onSelectProperty(item)} 
            />
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyComponent}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.pearlWhiteBg,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate200,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  userBadge: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.white,
    backgroundColor: COLORS.royalBlue,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginRight: 8,
    overflow: 'hidden',
  },
  userEmail: {
    fontSize: 15,
    color: COLORS.slate700,
    fontWeight: '600',
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    backgroundColor: COLORS.pearlWhiteBg,
  },
  logoutButtonText: {
    fontSize: 13,
    color: COLORS.slate600,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: COLORS.slate600,
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: COLORS.slate900,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.slate400,
    textAlign: 'center',
    lineHeight: 21,
  },
});
