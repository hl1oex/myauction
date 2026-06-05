// 대법원 크롤러 클라우드 동기화 상태 및 데이터 연동 이력을 제공하는 가이드 화면입니다.

import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { COLORS } from '../components/Theme';
import { subscribeSyncStatus, SyncStatus } from '../utils/api';

export const GuideScreen: React.FC = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Firestore status 컬렉션으로부터 수집 로그 정보를 실시간으로 구독합니다.
  useEffect(() => {
    setLoading(true);
    setSyncError(null);
    
    const unsubscribe = subscribeSyncStatus(
      (status) => {
        setSyncStatus(status);
        setLoading(false);
      },
      (err) => {
        setSyncError('클라우드 동기화 서버 연결에 실패하여 수집 이력을 가져올 수 없습니다.');
        setLoading(false);
      }
    );

    // 컴포넌트 언마운트 시 리스너 구독 해제
    return () => unsubscribe();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* 클라우드 데이터베이스 연동 안내 카드 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>⚙️ 클라우드 데이터베이스 연동 정보</Text>
          <Text style={styles.cardDesc}>
            본 애플리케이션은 Firebase Firestore 클라우드 인프라를 전적으로 활용하여 데이터를 동기화합니다. 백엔드 Uvicorn API 서버 주소를 로컬에서 매번 변경해 줄 필요 없이 무설정으로 동작합니다.
          </Text>
          
          <View style={styles.statusBadgeRow}>
            <View style={styles.statusDot} />
            <Text style={styles.statusBadgeText}>클라우드 데이터베이스 활성화 상태</Text>
          </View>
        </View>

        {/* 백그라운드 수집 데몬 상태 */}
        <View style={styles.card}>
          <View style={styles.syncHeaderRow}>
            <Text style={styles.cardTitle}>📡 클라우드 수집 동기화 상태</Text>
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>실시간 수신</Text>
            </View>
          </View>

          {loading ? (
            <ActivityIndicator size="small" color={COLORS.royalBlue} style={styles.loader} />
          ) : syncError ? (
            <Text style={styles.errorText}>{syncError}</Text>
          ) : syncStatus ? (
            <View style={styles.syncDetails}>
              <View style={styles.syncRow}>
                <Text style={styles.syncLabel}>⚖️ 법원 경매 최종 수집</Text>
                <Text style={styles.syncVal}>{syncStatus.last_court_sync || '이력 없음'}</Text>
              </View>
              <View style={styles.syncRow}>
                <Text style={styles.syncLabel}>🏢 온비드 공매 최종 수집</Text>
                <Text style={styles.syncVal}>{syncStatus.last_onbid_sync || '이력 없음'}</Text>
              </View>

              {/* 최근 수집 로그 테이블 */}
              <Text style={styles.subTitle}>최근 동기화 로그 (최대 5건)</Text>
              {syncStatus.logs && syncStatus.logs.length > 0 ? (
                syncStatus.logs.slice(0, 5).map((log: any, idx: number) => (
                  <View key={log.id || idx} style={styles.logItem}>
                    <View style={styles.logMeta}>
                      <Text style={styles.logTask}>
                        {log.task_name === 'court_scraper' ? '⚖️ 법원경매' : '🏢 온비드공매'}
                      </Text>
                      <Text style={[
                        styles.logStatus,
                        { color: log.status === 'SUCCESS' ? COLORS.emeraldSuccess : COLORS.crimsonAlert }
                      ]}>
                        {log.status}
                      </Text>
                    </View>
                    <View style={styles.logMeta}>
                      <Text style={styles.logCount}>수집 건수 {log.item_count}건</Text>
                      <Text style={styles.logTime}>{log.timestamp}</Text>
                    </View>
                    {log.error_msg ? (
                      <Text style={styles.logError} numberOfLines={1}>에러 {log.error_msg}</Text>
                    ) : null}
                  </View>
                ))
              ) : (
                <Text style={styles.noLogs}>최근 수집 동작 이력이 존재하지 않습니다.</Text>
              )}
            </View>
          ) : (
            <Text style={styles.noLogs}>수집 상태를 조회할 수 없습니다.</Text>
          )}
        </View>

        {/* 크롤러 가이드 문서 */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📜 대법원 크롤러 사용 가이드</Text>
          <Text style={styles.cardDesc}>
            본 애플리케이션의 실시간 부동산 데이터는 로컬 파이썬 배치 크롤러 엔진이 주기적으로 기동되어 클라우드로 갱신 처리합니다.
          </Text>

          <View style={styles.guideStep}>
            <Text style={styles.stepTitle}>1. 수집 스케줄러 자동 가동</Text>
            <Text style={styles.stepText}>
              로컬 크롤러 스케줄러 스크립트 실행 완료 시점에 최신 파싱 데이터들이 클라우드 Firestore의 properties 컬렉션으로 직접 배치 업로드됩니다.
            </Text>
          </View>

          <View style={styles.guideStep}>
            <Text style={styles.stepTitle}>2. AI 정밀 권리분석 탑재</Text>
            <Text style={styles.stepText}>
              수집된 공고문 내용 중 유치권 성립 여부, 가등기/가처분 유무, 선순위 임차인의 대항력 등을 자연어 알고리즘으로 분석하여 안전 등급을 매깁니다.
            </Text>
          </View>

          <View style={styles.guideStep}>
            <Text style={styles.stepTitle}>3. 모바일 실시간 연동</Text>
            <Text style={styles.stepText}>
              모바일 앱은 별도의 중간 웹 서버를 거치지 않고 Firebase SDK를 이용해 클라우드 데이터에 즉시 안전하게 쿼리하여 화면을 구성합니다.
            </Text>
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
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.slate900,
    marginBottom: 8,
  },
  cardDesc: {
    fontSize: 14,
    color: COLORS.slate600,
    lineHeight: 20,
    marginBottom: 12,
  },
  statusBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.emeraldLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 99,
    backgroundColor: COLORS.emeraldSuccess,
    marginRight: 6,
  },
  statusBadgeText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.emeraldSuccess,
  },
  syncHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.emeraldLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 99,
    backgroundColor: COLORS.emeraldSuccess,
    marginRight: 4,
  },
  liveText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.emeraldSuccess,
  },
  loader: {
    marginVertical: 20,
  },
  syncDetails: {
    marginTop: 4,
  },
  syncRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate100,
  },
  syncLabel: {
    fontSize: 14,
    color: COLORS.slate700,
    fontWeight: 'bold',
  },
  syncVal: {
    fontSize: 13,
    color: COLORS.slate900,
    fontWeight: 'bold',
  },
  subTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.slate900,
    marginTop: 16,
    marginBottom: 10,
  },
  logItem: {
    backgroundColor: COLORS.pearlWhiteBg,
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.slate200,
  },
  logMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  logTask: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.slate700,
  },
  logStatus: {
    fontSize: 12,
    fontWeight: '900',
  },
  logCount: {
    fontSize: 12,
    color: COLORS.slate600,
    fontWeight: 'bold',
  },
  logTime: {
    fontSize: 11,
    color: COLORS.slate400,
  },
  logError: {
    fontSize: 11,
    color: COLORS.crimsonAlert,
    marginTop: 4,
    fontWeight: 'bold',
  },
  noLogs: {
    fontSize: 13,
    color: COLORS.slate400,
    textAlign: 'center',
    paddingVertical: 14,
  },
  guideStep: {
    borderLeftWidth: 2,
    borderLeftColor: COLORS.royalBlue,
    paddingLeft: 10,
    marginVertical: 10,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.slate900,
    marginBottom: 4,
  },
  stepText: {
    fontSize: 13,
    color: COLORS.slate600,
    lineHeight: 18,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.crimsonAlert,
    textAlign: 'center',
    paddingVertical: 20,
    fontWeight: 'bold',
  },
  spacer: {
    height: 30,
  },
});
