// 부동산 경공매 입찰 전 꼭 숙지해야 하는 필수 법률 용어와 치명적 리스크를 해설하는 사전 화면입니다.

import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { COLORS } from '../components/Theme';

interface GlossaryItem {
  id: string;
  title: string;
  category: 'basic' | 'risk';
  desc: string;
  caution: string;
}

const GLOSSARY_DATA: GlossaryItem[] = [
  {
    id: '1',
    title: '최저입찰가 (Minimum Bid Price)',
    category: 'basic',
    desc: '경매 매각을 시작할 때 법원이 지정한 가장 낮은 입찰 가격입니다. 유찰될 때마다 대법원 경매는 20~30%씩, 온비드 공매는 10%씩 금액이 낮아져 다음 입찰로 진행됩니다.',
    caution: '이 금액보다 단 1원이라도 낮게 기재해 입찰할 경우 즉시 무효 처리됩니다.',
  },
  {
    id: '2',
    title: '감정평가액 (Appraisal Value)',
    category: 'basic',
    desc: '법원이나 집행기관의 의뢰를 받은 감정평가사가 해당 매물의 상태, 거래 사례 등을 분석해 책정한 가격입니다. 입찰 가격 산정의 표준 기준선 역할을 합니다.',
    caution: '감정 시점은 통상 입찰일 기준 6개월에서 1년 전이므로 현재 시세와 다를 수 있습니다.',
  },
  {
    id: '3',
    title: '매각기일 (Auction Date)',
    category: 'basic',
    desc: '실제로 입찰서를 제출하고 개찰을 진행하는 기일입니다. 법원경매는 정해진 당일 오전에 직접 현장에 참석해야 하며, 온비드는 온라인으로 제출합니다.',
    caution: '법원 현장 입찰 시 신분증, 도장, 입찰보증금 수표를 반드시 지참해야 합니다.',
  },
  {
    id: '4',
    title: '매각물건명세서 (Bid Object Description)',
    category: 'basic',
    desc: '사법보좌관이나 집행관이 조사한 권리 관계, 세입자 현황 및 물건의 중대 하자가 공식적으로 기재되는 서류로, 권리분석의 가장 핵심이 되는 바이블입니다.',
    caution: '이 서류에 기재되지 않은 권리상 오류나 점유자 하자는 법원에서 면책되므로 매우 주의해야 합니다.',
  },
  {
    id: '5',
    title: '인도명령 제도 vs 명도 소송',
    category: 'basic',
    desc: '낙찰 대금을 완납한 매수인이 불법 점유자나 세입자를 퇴거시키기 위해 법원에 요청하는 절차입니다. 법원경매는 인도명령 제도가 있어 대금 납부 후 6개월 내 신청하면 빠르게 강제집행이 가능하지만, 공매는 이 제도가 없어 명도소송을 거쳐야만 집행이 가능합니다.',
    caution: '공매에 응찰할 때는 점유자 명도 비용(이사비, 소송 기회비용 등)을 보수적으로 감안하십시오.',
  },
  {
    id: '6',
    title: '선순위 대항력 임차인 (Prior Tenant)',
    category: 'risk',
    desc: '말소기준권리(최초 근저당 등)보다 먼저 대항요건(주택 인도 및 전입신고)을 갖춘 임차인입니다. 낙찰자가 보증금 전액을 반환해 줄 때까지 거주를 계속하며 명도를 거부할 법적 권리를 갖습니다.',
    caution: '법원에서 전액 배당받지 못한 보증금의 잔액은 낙찰자가 무조건 인수하여 전액 물어주어야 합니다.',
  },
  {
    id: '7',
    title: '유치권 (Lien)',
    category: 'risk',
    desc: '공사대금, 리모델링 수수료 등을 지급받지 못한 채권자가 돈을 돌려받을 때까지 해당 부동산을 점유하고 비워주지 않을 수 있는 법적 권리입니다. 성립 여부가 모호해 법적 다툼이 가장 흔히 발생합니다.',
    caution: '허위 유치권이라 하더라도 인도명령이 기각될 수 있어 명도 협상이 장기화되고 자금이 묶일 수 있습니다.',
  },
  {
    id: '8',
    title: '대지권 미등기 및 사용권 없음',
    category: 'risk',
    desc: '아파트 및 오피스텔 등 집합건물에서 토지 지분이 제외된 채 건물 부분만 매각 대상으로 나온 특수 물건입니다. 분양 대금 미납 등 다양한 사유로 발생합니다.',
    caution: '대지 소유주로부터 토지 사용료 소송을 당하거나 건물 철거 소송에 휘말릴 위험이 높은 초고위험 하자입니다.',
  },
  {
    id: '9',
    title: '선순위 가등기 및 가처분',
    category: 'risk',
    desc: '소유권 이전에 관한 가등기나 처분금지 가처분이 말소기준권리보다 빠른 경우입니다. 낙찰을 받아 소유권 이전 등기를 마치더라도 향후 가등기권자가 본등기를 하거나 가처분권자가 소송에서 승소하면 낙찰자의 소유권이 박탈됩니다.',
    caution: '인수되는 선순위 가등기나 가처분이 있는 물건은 원칙적으로 입찰을 피하는 것이 안전합니다.',
  },
];

export const GlossaryScreen: React.FC = () => {
  const [search, setSearch] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'basic' | 'risk'>('all');

  // 검색어와 카테고리에 맞춰 용어 데이터를 필터링합니다.
  const filteredData = GLOSSARY_DATA.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.desc.toLowerCase().includes(search.toLowerCase());
    
    const matchesCategory =
      activeCategory === 'all' || item.category === activeCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* 설명 헤더 */}
        <View style={styles.introCard}>
          <Text style={styles.introTitle}>📖 필수 법률 용어 및 리스크 사전</Text>
          <Text style={styles.introDesc}>
            부동산 경공매 입찰 전 반드시 숙지해야 할 핵심 용어와 낙찰자에게 치명적인 특수 권리분석 하자 항목들을 정리해 놓은 사전입니다.
          </Text>
        </View>

        {/* 검색창 */}
        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchInput}
            placeholder="알고 싶은 법률 용어를 검색해 보세요"
            placeholderTextColor={COLORS.slate400}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* 카테고리 칩 전환 영역 */}
        <View style={styles.chipContainer}>
          {[
            { value: 'all', label: '전체 용어' },
            { value: 'basic', label: '경공매 기초 용어' },
            { value: 'risk', label: '⚠️ 권리 리스크 해설' },
          ].map((cat) => (
            <TouchableOpacity
              key={cat.value}
              style={[
                styles.chip,
                activeCategory === cat.value && styles.chipActive,
              ]}
              onPress={() => setActiveCategory(cat.value as any)}
            >
              <Text
                style={[
                  styles.chipText,
                  activeCategory === cat.value && styles.chipTextActive,
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 리스트 출력 영역 */}
        {filteredData.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>검색 결과에 맞는 용어가 존재하지 않습니다.</Text>
          </View>
        ) : (
          <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
            {filteredData.map((item) => (
              <View
                key={item.id}
                style={[
                  styles.glossaryCard,
                  item.category === 'risk' && styles.riskCardBorder,
                ]}
              >
                <View style={styles.cardHeader}>
                  <Text style={[
                    styles.cardTitle,
                    item.category === 'risk' && { color: COLORS.crimsonAlert }
                  ]}>
                    {item.title}
                  </Text>
                  <View style={[
                    styles.catBadge,
                    { backgroundColor: item.category === 'risk' ? COLORS.crimsonLight : COLORS.royalLight }
                  ]}>
                    <Text style={[
                      styles.catBadgeText,
                      { color: item.category === 'risk' ? COLORS.crimsonAlert : COLORS.royalBlue }
                    ]}>
                      {item.category === 'risk' ? '위험 분석' : '기초 지식'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.cardDesc}>{item.desc}</Text>
                
                <View style={[
                  styles.cautionBox,
                  { backgroundColor: item.category === 'risk' ? COLORS.crimsonLight : COLORS.warningLight }
                ]}>
                  <Text style={[
                    styles.cautionText,
                    { color: item.category === 'risk' ? COLORS.crimsonAlert : COLORS.warningGold }
                  ]}>
                    💡 주의: {item.caution}
                  </Text>
                </View>
              </View>
            ))}
            <View style={styles.footerSpacer} />
          </ScrollView>
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
  introCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    marginBottom: 12,
  },
  introTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.slate900,
    marginBottom: 6,
  },
  introDesc: {
    fontSize: 13,
    color: COLORS.slate600,
    lineHeight: 19,
    fontWeight: 'medium',
  },
  searchBar: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 50,
    justifyContent: 'center',
    marginBottom: 10,
  },
  searchInput: {
    fontSize: 16,
    color: COLORS.slate900,
    fontWeight: 'bold',
  },
  chipContainer: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  chip: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 6,
  },
  chipActive: {
    backgroundColor: COLORS.royalBlue,
    borderColor: COLORS.royalBlue,
  },
  chipText: {
    fontSize: 13,
    color: COLORS.slate600,
    fontWeight: 'bold',
  },
  chipTextActive: {
    color: COLORS.white,
    fontWeight: '800',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.slate400,
    fontWeight: 'bold',
  },
  listContainer: {
    flex: 1,
  },
  glossaryCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    marginBottom: 12,
  },
  riskCardBorder: {
    borderColor: COLORS.crimsonAlert,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    color: COLORS.royalBlue,
    flex: 1,
    marginRight: 8,
  },
  catBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  catBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  cardDesc: {
    fontSize: 14,
    color: COLORS.slate600,
    lineHeight: 21,
    marginBottom: 12,
    fontWeight: 'bold',
  },
  cautionBox: {
    padding: 10,
    borderRadius: 10,
  },
  cautionText: {
    fontSize: 13,
    fontWeight: 'bold',
    lineHeight: 19,
  },
  footerSpacer: {
    height: 30,
  },
});
