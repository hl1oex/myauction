# -*- coding: utf-8 -*-
# DetailScreen.tsx에 상하단 고정형 광고를 이식하고, 패딩/마진/글꼴 크기를 컴팩트하게 리팩토링하는 스크립트입니다.
import re

def main():
    filepath = "mobile-app/src/screens/DetailScreen.tsx"
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
    except Exception as e:
        print(f"Failed to read DetailScreen.tsx: {e}")
        return

    # 1. adSettings 상태 선언 및 useEffect 추가
    state_target = "  const [userId, setUserId] = useState<string | null>(null);"
    state_replacement = """  const [userId, setUserId] = useState<string | null>(null);

  // 📢 상세페이지 상하단 광고 데이터 연동
  const [adSettings, setAdSettings] = useState<any[]>([]);
  useEffect(() => {
    const fetchAds = async () => {
      try {
        const { data, error } = await supabase
          .from('ads')
          .select('*')
          .eq('active', true);
        if (!error && data) {
          setAdSettings(data);
        }
      } catch (err) {
        console.warn('상세페이지 광고 연동 실패', err);
      }
    };
    fetchAds();
  }, []);"""

    content = content.replace(state_target, state_replacement)

    # 2. renderDetailAd 함수 추가
    func_target = "  const targetBuildingArea = isTargetProperty ? 84.93 : (currentProperty.building_area || targetExclusiveArea);"
    func_replacement = """  const targetBuildingArea = isTargetProperty ? 84.93 : (currentProperty.building_area || targetExclusiveArea);

  // 📢 상세페이지용 광고 렌더링 헬퍼 함수
  const renderDetailAd = (slotName: string) => {
    const ad = adSettings.find(a => a.slot_name === slotName);
    if (!ad || !ad.active) {
      return null;
    }

    const handleAdPress = () => {
      if (ad.link_url) {
        Linking.openURL(ad.link_url).catch(err => console.warn("Failed to open URL", err));
      }
    };

    return (
      <TouchableOpacity 
        style={styles.detailAdCard} 
        activeOpacity={0.9} 
        onPress={handleAdPress}
      >
        <View style={styles.detailAdHeader}>
          <View style={styles.detailAdBadge}>
            <Text style={styles.detailAdBadgeText}>AD</Text>
          </View>
          <Text style={styles.detailAdTitle} numberOfLines={1}>
            {ad.title || "스폰서 광고"}
          </Text>
        </View>
        
        {ad.type === 'adsense' ? (
          <View style={styles.detailAdsenseContainer}>
            <Text style={styles.detailAdsenseTitle}>[Google AdSense 광고판]</Text>
            <Text style={styles.detailAdCodeText} numberOfLines={1}>
              {ad.ad_code || "Google AdSense Script"}
            </Text>
          </View>
        ) : (
          <View style={styles.detailDirectAdContainer}>
            <Text style={styles.detailAdDesc} numberOfLines={1}>
              {ad.desc || "상세 광고 설명"}
            </Text>
            {ad.image_url && (
              <Image source={{ uri: ad.image_url }} style={styles.detailAdImage} />
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };"""

    content = content.replace(func_target, func_replacement)

    # 3. JSX 상하단에 고정형 광고 추가
    # 상단 백 헤더바 영역 아래에 top ad slot 추가
    header_target = """      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>"""
    header_replacement = """      </View>

      {/* 📢 고정형 상세페이지 상단 광고판 */}
      {adSettings.some(a => a.slot_name === 'detail_top_banner' && a.active) && (
        <View style={styles.fixedAdContainerTop}>
          {renderDetailAd('detail_top_banner')}
        </View>
      )}

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>"""
    
    content = content.replace(header_target, header_replacement)

    # ScrollView 하단에 bottom ad slot 추가
    scroll_close_target = """        <View style={styles.spacer} />
      </ScrollView>"""
    scroll_close_replacement = """        <View style={styles.spacer} />
      </ScrollView>

      {/* 📢 고정형 상세페이지 하단 광고판 */}
      {adSettings.some(a => a.slot_name === 'detail_bottom_banner' && a.active) && (
        <View style={styles.fixedAdContainerBottom}>
          {renderDetailAd('detail_bottom_banner')}
        </View>
      )}"""

    content = content.replace(scroll_close_target, scroll_close_replacement)

    # 4. StyleSheet 크기 및 마진/패딩/글자 20% 축소 톤앤매너 일치 수정
    content = content.replace("    padding: 16,\n    marginBottom: 14,", "    padding: 12,\n    marginBottom: 10,") # summaryCard, sectionCard
    content = content.replace("    padding: 16,", "    padding: 12,") # container padding 16 -> 12 등의 대입용
    content = content.replace("    marginHorizontal: 16,", "    marginHorizontal: 12,")
    content = content.replace("    paddingHorizontal: 16,", "    paddingHorizontal: 12,")
    content = content.replace("    marginBottom: 14,", "    marginBottom: 10,")
    content = content.replace("    marginBottom: 12,", "    marginBottom: 8,")
    content = content.replace("    fontSize: 25,", "    fontSize: 20,") # address
    content = content.replace("    fontSize: 19,", "    fontSize: 15,") # sectionTitle, headerTitle
    content = content.replace("    fontSize: 17.5,", "    fontSize: 14.5,") # analysisContent
    content = content.replace("    paddingVertical: 10,", "    paddingVertical: 8,") # tableRow
    content = content.replace("    paddingHorizontal: 12,", "    paddingHorizontal: 8,") # tableRow
    content = content.replace("    paddingVertical: 12,", "    paddingVertical: 8,") # kpiCard
    content = content.replace("    fontSize: 13.5,", "    fontSize: 12.5,") # tableHeaderCell, tableCellText, timelineHeader
    content = content.replace("    fontSize: 13,", "    fontSize: 12,") # tableCell, receiptLabel, receiptValue, receiptHeaderText
    content = content.replace("    padding: 12,\n    flexDirection: 'row',", "    padding: 8,\n    flexDirection: 'row',") # disclaimerBanner

    # 5. 신규 광고용 스타일을 styles 선언 끝부분에 주입
    styles_end_target = """  chatSendBtn: {
    backgroundColor: COLORS.royalBlue,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
});"""

    styles_end_replacement = """  chatSendBtn: {
    backgroundColor: COLORS.royalBlue,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  fixedAdContainerTop: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate200,
    backgroundColor: COLORS.slate50,
  },
  fixedAdContainerBottom: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: COLORS.slate200,
    backgroundColor: COLORS.slate50,
  },
  detailAdCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.slate200,
    borderRadius: 12,
    padding: 8,
    flexDirection: 'column',
    shadowColor: COLORS.slate900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
    minHeight: 52,
  },
  detailAdHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  detailAdBadge: {
    backgroundColor: COLORS.slate900,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    marginRight: 6,
  },
  detailAdBadgeText: {
    color: COLORS.white,
    fontSize: 8.5,
    fontWeight: '900',
  },
  detailAdTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: COLORS.slate800,
    flex: 1,
  },
  detailAdDesc: {
    fontSize: 10.5,
    color: COLORS.slate500,
    fontWeight: '600',
    marginRight: 40,
  },
  detailAdImage: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 50,
    height: '100%',
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    opacity: 0.8,
  },
  detailAdsenseContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.slate50,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: COLORS.slate100,
  },
  detailAdsenseTitle: {
    fontSize: 10,
    color: COLORS.slate600,
    fontWeight: 'bold',
  },
  detailAdCodeText: {
    fontSize: 9.5,
    color: COLORS.royalBlue,
    fontFamily: 'monospace',
    flex: 1,
    textAlign: 'right',
    marginLeft: 8,
  },
  detailDirectAdContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});"""

    content = content.replace(styles_end_target, styles_end_replacement)

    try:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(content)
        print("Successfully updated DetailScreen.tsx layout and added ads panels.")
    except Exception as e:
        print(f"Failed to write DetailScreen.tsx: {e}")

if __name__ == "__main__":
    main()
