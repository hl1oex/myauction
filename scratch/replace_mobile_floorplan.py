# -*- coding: utf-8 -*-
import os

# DetailScreen.tsx 파일 경로 설정
file_path = r"d:\BackUp\OneDrive\AI공부\Real estate auction\mobile-app\src\screens\DetailScreen.tsx"

if not os.path.exists(file_path):
    print("Error: File not found")
    exit(1)

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. 평면도 카드 영역을 제거하고 3대 포털 로드뷰 연동 카드로 대체
start_marker = "            {/* 내부 평면도 */}"
start_idx = content.find(start_marker)

if start_idx != -1:
    sub_content = content[start_idx:]
    # </TouchableOpacity>\n                  </>\n                )} 형태의 닫기 코드를 찾습니다.
    # 들여쓰기와 빈 칸 공백을 포괄하여 매칭하기 위해 범위를 느슨하게 탐색합니다.
    search_end = "네이버 부동산에서 실제 평면도 보기"
    text_button_idx = sub_content.find(search_end)
    if text_button_idx != -1:
        # 그 버튼 인덱스 이후 최초로 나타나는 ')}'를 찾습니다.
        end_rel_idx = sub_content.find(")}", text_button_idx)
        if end_rel_idx != -1:
            end_idx = start_idx + end_rel_idx + 2
            
            # 교체할 새 코드 정의
            new_roadview_card = """            {/* 🧭 주변 환경 및 현장 로드뷰 분석 */}
            {!isNonBuildingMobile && (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>🧭 주변 환경 및 현장 로드뷰 분석</Text>
                <Text style={{ fontSize: 10, color: COLORS.slate500, marginVertical: 6, lineHeight: 14 }}>
                  물건 위치에 따른 주요 지도 포털의 로드뷰 분석 도구입니다. 아래 버튼을 선택하여 외부 지도 서비스의 정밀 로드뷰와 파노라마 거리 뷰를 조회하십시오.
                </Text>
                
                <View style={{ gap: 8, marginTop: 4 }}>
                  <TouchableOpacity
                    onPress={() => Linking.openURL(`https://map.naver.com/v5/search/${encodeURIComponent(currentProperty.address)}`)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: '#f0fdf4',
                      borderWidth: 1,
                      borderColor: '#bbf7d0',
                      borderRadius: 12,
                      padding: 12
                    }}
                  >
                    <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#10b981', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                      <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: 'bold' }}>N</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#1e293b' }}>네이버 로드뷰 바로가기</Text>
                      <Text style={{ fontSize: 9, color: '#64748b', marginTop: 2 }}>네이버 지도 기반의 입체 현장 전경 및 실시간 도로 뷰 조회</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      if (currentProperty.latitude && currentProperty.longitude) {
                        Linking.openURL(`https://map.kakao.com/link/roadview/${currentProperty.latitude},${currentProperty.longitude}`);
                      } else {
                        Linking.openURL(`https://map.kakao.com/?q=${encodeURIComponent(currentProperty.address)}`);
                      }
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: '#fffbeb',
                      borderWidth: 1,
                      borderColor: '#fde68a',
                      borderRadius: 12,
                      padding: 12
                    }}
                  >
                    <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#f59e0b', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                      <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: 'bold' }}>K</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#1e293b' }}>카카오 로드뷰 바로가기</Text>
                      <Text style={{ fontSize: 9, color: '#64748b', marginTop: 2 }}>카카오 3D 파노라마 뷰로 매물 주변 실시간 로드뷰 확인</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      if (currentProperty.latitude && currentProperty.longitude) {
                        Linking.openURL(`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${currentProperty.latitude},${currentProperty.longitude}`);
                      } else {
                        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(currentProperty.address)}`);
                      }
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: '#eff6ff',
                      borderWidth: 1,
                      borderColor: '#bfdbfe',
                      borderRadius: 12,
                      padding: 12
                    }}
                  >
                    <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                      <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: 'bold' }}>G</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#1e293b' }}>구글 스트리트뷰 바로가기</Text>
                      <Text style={{ fontSize: 9, color: '#64748b', marginTop: 2 }}>구글 맵을 통한 광범위 위성 분석 및 스트리트뷰 연동</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            )}"""
            
            content = content[:start_idx] + new_roadview_card + content[end_idx:]
            print("Success: First step replacement (floorplan removal) done")
        else:
            print("Error: Could not find end bracket for floorplan section")
            exit(1)
    else:
        # 네이버 부동산 실제 평면도 보기 버튼 문구가 없는 경우 (이미 한번 지운 경우 대비)
        print("Warning: Naver floorplan button not found, maybe already replaced")
else:
    print("Error: Could not find the start of floorplan section in DetailScreen.tsx")
    exit(1)

# 2. 하단 중복 가로 3사 로드뷰 버튼바 영역 소거
# 중복 가로 버튼바가 위치하던 영역의 마크업을 매칭하여 삭제합니다.
target_btn_bar = """                  <View style={{ marginTop: 12, borderTopWidth: 1, borderColor: '#e2e8f0', paddingTop: 12 }}>
                    <Text style={{ fontSize: 10, fontWeight: 'bold', color: COLORS.slate500, marginBottom: 6 }}>🧭 현장 분석용 3대 포털 로드뷰 비교 바로가기</Text>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      <TouchableOpacity
                        onPress={() => Linking.openURL(`https://map.naver.com/v5/search/${encodeURIComponent(currentProperty.address)}`)}
                        style={{ flex: 1, backgroundColor: COLORS.emeraldSuccess, paddingVertical: 8, borderRadius: 8, alignItems: 'center' }}
                      >
                        <Text style={{ color: '#ffffff', fontSize: 10, fontWeight: 'bold' }}>네이버 로드뷰</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => Linking.openURL(`https://map.kakao.com/?q=${encodeURIComponent(currentProperty.address)}`)}
                        style={{ flex: 1, backgroundColor: '#f59e0b', paddingVertical: 8, borderRadius: 8, alignItems: 'center' }}
                      >
                        <Text style={{ color: '#ffffff', fontSize: 10, fontWeight: 'bold' }}>카카오 로드뷰</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(currentProperty.address)}`)}
                        style={{ flex: 1, backgroundColor: COLORS.royalBlue, paddingVertical: 8, borderRadius: 8, alignItems: 'center' }}
                      >
                        <Text style={{ color: '#ffffff', fontSize: 10, fontWeight: 'bold' }}>구글 스트리트</Text>
                      </TouchableOpacity>
                    </View>"""

replacement_btn_bar = """                  <View style={{ marginTop: 12, borderTopWidth: 1, borderColor: '#e2e8f0', paddingTop: 12 }}>"""

if target_btn_bar in content:
    content = content.replace(target_btn_bar, replacement_btn_bar)
    print("Success: Second step replacement (duplicate roadview buttons removal) done")
else:
    # 공백 불일치 대비 부분 검색 수행
    partial_target = "🧭 현장 분석용 3대 포털 로드뷰 비교 바로가기"
    if partial_target in content:
        # 줄 단위 매칭을 시도합니다.
        lines = content.splitlines()
        start_del = -1
        end_del = -1
        for idx, line in enumerate(lines):
            if "🧭 현장 분석용 3대 포털 로드뷰 비교 바로가기" in line:
                start_del = idx - 1
                close_count = 0
                for j in range(idx, len(lines)):
                    if "</View>" in lines[j]:
                        close_count += 1
                        if close_count == 2:
                            end_del = j
                            break
                break
        
        if start_del != -1 and end_del != -1:
            lines[start_del:end_del+1] = ["                  <View style={{ marginTop: 12, borderTopWidth: 1, borderColor: '#e2e8f0', paddingTop: 12 }}>"]
            content = "\n".join(lines)
            print("Success: Second step replacement (duplicate roadview buttons removal) done via line-based strategy")
        else:
            print("Error: Line-based search for duplicate roadview buttons failed")
            exit(1)
    else:
        print("Warning: Duplicate roadview buttons not found, maybe already removed")

# 변경 내용을 최종 기록합니다.
with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Success: DetailScreen.tsx patched successfully!")
